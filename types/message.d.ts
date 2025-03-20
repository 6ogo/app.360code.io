import type { Message as AIMessage } from 'ai';

// Define our application's Message type
export interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Define a utility type to convert between AI library messages and our app messages
export type AIMessageToAppMessage = {
  role: AppMessage['role'];
  content: string;
};

// Conversion functions
export function convertToAppMessage(message: AIMessage): AppMessage {
  return {
    role: message.role === 'user' || message.role === 'assistant' 
      ? message.role 
      : 'assistant',
    content: message.content as string
  };
}

export function convertToAIMessage(message: AppMessage): AIMessage {
  return {
    id: Date.now().toString(),
    role: message.role,
    content: message.content
  };
}

export function convertToAppMessages(messages: AIMessage[]): AppMessage[] {
  return messages.map(convertToAppMessage);
}

export function convertToAIMessages(messages: AppMessage[]): AIMessage[] {
  return messages.map(convertToAIMessage);
}