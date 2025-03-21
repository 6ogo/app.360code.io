// lib/.server/llm/stream-text.ts
import { Message as AIMessage } from 'ai';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import { analyzeMessagePurpose, selectModel, getAPIKeyForModel, ModelConfig } from './model-router';
import { projectStore } from '@/lib/stores/projectContext';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export interface StreamResult {
  toResponseStream: () => Response;
  toAIStream: () => ReadableStream;
  extractText: () => Promise<{ text: string; finishReason: string | null }>;
  modelUsed: ModelConfig;
}

export type StreamingOptions = {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  toolChoice?: 'none' | 'auto';
  preferredModel?: string; // Allow forcing a specific model
  costConstraint?: number; // Optional cost constraint in USD per 1K tokens
  onFinish?: (result: { text: string; finishReason: string | null }) => Promise<void>;
};

export class StreamingTextResponse extends Response {
  constructor(stream: ReadableStream) {
    super(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}

export async function streamText(
  messages: Messages | AIMessage[], 
  env: Env | NodeJS.ProcessEnv, 
  options: StreamingOptions = {}
): Promise<StreamResult> {
  // Convert Messages to AIMessages if needed
  const aiMessages = messages.map(msg => {
    if ('id' in msg) {
      return msg as AIMessage;
    }
    // Convert our Message to AIMessage
    return {
      id: Date.now().toString(),
      role: msg.role,
      content: msg.content
    } as AIMessage;
  });

  // Get the last user message to analyze its purpose
  const lastUserMessage = [...aiMessages].reverse().find(msg => msg.role === 'user');
  const projectContext = projectStore.get();
  
  // Determine the purpose of the message
  const messagePurpose = lastUserMessage 
    ? analyzeMessagePurpose(lastUserMessage.content as string, projectContext)
    : 'code'; // Default to code if no message available
  
  // Select the most appropriate model
  const selectedModel = options.preferredModel && env[options.preferredModel]
    ? { id: options.preferredModel, provider: 'groq', description: 'Custom model', maxTokens: 32768, costPer1KTokens: 0.001, strengths: ['code'], apiEnvKey: 'GROQ_API_KEY' } as ModelConfig
    : selectModel(messagePurpose, env, options.costConstraint);
  
  // Get the appropriate API key
  const apiKey = getAPIKeyForModel(selectedModel, env);
  
  // Log the model selection for debugging
  console.log(`Selected model ${selectedModel.id} for purpose: ${messagePurpose}`);

  // Prepare the API endpoint and request format based on the provider
  let apiEndpoint: string;
  let requestBody: any;
  
  if (selectedModel.provider === 'groq') {
    apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    requestBody = {
      model: selectedModel.id,
      messages: aiMessages,
      system: getSystemPrompt(),
      max_tokens: options.maxTokens || MAX_TOKENS,
      temperature: options.temperature,
      top_p: options.topP,
      top_k: options.topK,
      stream: true,
    };
  } else if (selectedModel.provider === 'anthropic') {
    apiEndpoint = 'https://api.anthropic.com/v1/messages';
    requestBody = {
      model: selectedModel.id,
      messages: aiMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      system: getSystemPrompt(),
      max_tokens: options.maxTokens || MAX_TOKENS,
      temperature: options.temperature,
      stream: true
    };
  } else if (selectedModel.provider === 'openai') {
    apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    requestBody = {
      model: selectedModel.id,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...aiMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      max_tokens: options.maxTokens || MAX_TOKENS,
      temperature: options.temperature,
      top_p: options.topP,
      stream: true
    };
  } else {
    throw new Error(`Unsupported provider: ${selectedModel.provider}`);
  }
  
  // Get the appropriate authorization header
  const authHeader = selectedModel.provider === 'anthropic' 
    ? `anthropic-api-key ${apiKey}`
    : `Bearer ${apiKey}`;
  
  // Get the completion stream
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }
    
    // Check if we have a stream
    if (!response.body) {
      throw new Error('No stream returned from API');
    }
    
    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    
    // Create a ReadableStream to pipe through
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        let finishReason: string | null = null;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // End of stream
              if (options.onFinish) {
                await options.onFinish({ text: fullText, finishReason });
              }
              controller.close();
              break;
            }
            
            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            
            // Handle different format responses based on provider
            if (selectedModel.provider === 'anthropic') {
              // Parse Anthropic streaming format
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta') {
                      const contentDelta = parsed.delta?.text || '';
                      fullText += contentDelta;
                      controller.enqueue(new TextEncoder().encode(contentDelta));
                    } else if (parsed.type === 'message_stop') {
                      finishReason = parsed.message_stop?.stop_reason || null;
                    }
                  } catch (e) {
                    console.error('Error parsing Anthropic stream data:', e);
                  }
                }
              }
            } else {
              // Parse OpenAI-compatible streaming format (Groq, OpenAI)
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices && parsed.choices.length > 0) {
                      const { delta, finish_reason } = parsed.choices[0];
                      
                      if (delta?.content) {
                        fullText += delta.content;
                        controller.enqueue(new TextEncoder().encode(delta.content));
                      }
                      
                      if (finish_reason) {
                        finishReason = finish_reason;
                      }
                    }
                  } catch (e) {
                    console.error('Error parsing stream data:', e);
                  }
                }
              }
            }
          }
        } catch (error: unknown) {
          console.error('Stream reading error:', error);
          controller.error(error);
        }
      }
    });
    
    // Return an object with methods to access the stream in different ways
    return {
      toResponseStream: () => new StreamingTextResponse(stream),
      toAIStream: () => stream,
      extractText: async () => {
        let text = '';
        let finishReason = null;
        
        const reader = stream.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            text += new TextDecoder().decode(value);
          }
        } finally {
          reader.releaseLock();
        }
        
        return { text, finishReason };
      },
      modelUsed: selectedModel
    };
  } catch (error) {
    console.error('Error during stream creation:', error);
    throw error;
  }
}