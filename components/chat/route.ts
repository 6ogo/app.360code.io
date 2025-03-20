import { NextRequest, NextResponse } from 'next/server';
import { Message } from 'ai';
import { streamText, StreamingTextResponse } from '@/lib/.server/llm/stream-text';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '@/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '@/lib/.server/llm/prompts';
import { fileModificationsToHTML } from '../../components/utils/diff';
import SwitchableStream from '@/lib/.server/llm/switchable-stream';

// Global store for file modifications (in a real app, use a more robust solution)
let fileModifications: Record<string, string[]> | null = null;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: Message[] };
    
    // Include file modifications in the user message if available
    if (fileModifications && messages.length > 0) {
      const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
      
      if (lastUserMessageIndex >= 0) {
        const actualIndex = messages.length - 1 - lastUserMessageIndex;
        const fileModificationsHTML = fileModificationsToHTML(fileModifications);
        
        messages[actualIndex] = {
          ...messages[actualIndex],
          content: `${fileModificationsHTML}\n\n${messages[actualIndex].content}`
        };
        
        // Reset file modifications after they've been sent
        fileModifications = null;
      }
    }
    
    const stream = new SwitchableStream();
    
    try {
      const env = {
        GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      };
      
      const options = {
        maxTokens: MAX_TOKENS,
        toolChoice: 'none' as const,
        onFinish: async ({ text, finishReason }: { text: string; finishReason: string | null }) => {
          if (finishReason !== 'length') {
            return stream.close();
          }
          
          if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
            throw new Error('Cannot continue message: Maximum segments reached');
          }
          
          const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
          
          console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);
          
          // Add the current completion and continue prompt to messages
          const newMessages = [
            ...messages,
            { id: Date.now().toString(), role: 'assistant' as const, content: text },
            { id: (Date.now() + 1).toString(), role: 'user' as const, content: CONTINUE_PROMPT }
          ];
          
          const result = await streamText(newMessages, env, options);
          
          return stream.switchSource(result.toAIStream());
        }
      };
      
      const result = await streamText(messages, env, options);
      
      stream.switchSource(result.toAIStream());
      
      return new Response(stream.readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    } catch (error) {
      console.error('Error in chat API:', error);
      stream.close();
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}

// Helper function to set file modifications from client-side
export function setFileModifications(mods: Record<string, string[]>) {
  fileModifications = mods;
}