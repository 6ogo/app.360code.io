import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types/conversation';

// Hook for scrolling chat to the latest message
export function useSnapScroll() {
  const messageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messageRef.current && scrollRef.current) {
      const { offsetTop } = messageRef.current;
      scrollRef.current.scrollTo({
        top: offsetTop - 100,
        behavior: 'smooth',
      });
    }
  }, [messageRef.current]);
  
  return [messageRef, scrollRef] as const;
}

// Hook for parsing AI messages to transform Markdown, code blocks, etc.
export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<string[]>([]);
  
  const parseMessages = (messages: Message[], isLoading: boolean) => {
    const processed = messages.map((message) => {
      // We're only processing assistant messages
      if (message.role !== 'assistant') {
        return message.content;
      }
      
      // Process any special syntax here
      let content = message.content;
      
      // Remove any artifact tags from the displayed message
      content = content.replace(/<boltArtifact[\s\S]*?<\/boltArtifact>/g, '');
      
      return content;
    });
    
    setParsedMessages(processed);
  };
  
  return { parsedMessages, parseMessages };
}