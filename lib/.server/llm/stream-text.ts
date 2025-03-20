// lib/.server/llm/stream-text.ts
import { Message as AIMessage } from 'ai';
import { getAPIKey } from '@/lib/.server/llm/api-key';
import { getGroqModel } from '@/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';

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
}

export type StreamingOptions = {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  toolChoice?: 'none' | 'auto';
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
  const apiKey = getAPIKey(env);
  const groqModel = getGroqModel(apiKey);
  
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

  // Prepare the completion options
  const completionOptions = {
    model: groqModel,
    messages: aiMessages,
    system: getSystemPrompt(),
    maxTokens: options.maxTokens || MAX_TOKENS,
    temperature: options.temperature,
    topP: options.topP,
    topK: options.topK,
    stream: true,
  };
  
  // Get the completion stream
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(completionOptions)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }
    
    // Check if we have a stream
    if (!response.body) {
      throw new Error('No stream returned from Groq API');
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
            const lines = chunk.split('\\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }
                
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
      }
    };
  } catch (error) {
    console.error('Error during stream creation:', error);
    throw error;
  }
}