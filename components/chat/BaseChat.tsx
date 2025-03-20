// components/chat/BaseChat.tsx
'use client';

import React, { forwardRef, useRef, useEffect } from 'react';
import Message from '@/components/ui/Message';
import { AppMessage } from '@/types/message';

interface BaseChatProps {
  messageRef?: React.RefObject<HTMLDivElement>;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  showChat: boolean;
  chatStarted: boolean;
  isStreaming: boolean;
  messages: AppMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleStop: () => void;
  sendMessage: (e: React.FormEvent, options?: any) => void;
}

export const BaseChat = forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      messageRef,
      textareaRef,
      showChat,
      chatStarted,
      isStreaming,
      messages,
      input,
      handleInputChange,
      handleStop,
      sendMessage,
    },
    ref
  ) => {
    const localTextareaRef = useRef<HTMLTextAreaElement>(null);
    const actualTextareaRef = textareaRef || localTextareaRef;
    
    // Auto-resize textarea based on content
    useEffect(() => {
      if (actualTextareaRef.current) {
        actualTextareaRef.current.style.height = 'auto';
        actualTextareaRef.current.style.height = `${actualTextareaRef.current.scrollHeight}px`;
      }
    }, [input, actualTextareaRef]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(e);
    };

    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Messages area */}
        <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatStarted ? (
            messages.map((message, index) => (
              <div key={index} ref={index === messages.length - 1 ? messageRef : undefined}>
                <Message 
                  content={message.content} 
                  role={message.role}
                  hasCode={message.content.includes('```')}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to 360code.io</h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Describe your project requirements, and I'll generate a complete solution for you.
              </p>
            </div>
          )}
        </div>
        
        {/* Input area */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={actualTextareaRef}
              className="w-full p-3 pr-24 bg-card border border-border rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Describe your project requirements..."
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isStreaming}
            />
            
            {isStreaming ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleStop();
                }}
                className="absolute right-2 bottom-2 px-4 py-1.5 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                type="button"
              >
                <i className="fas fa-stop mr-2"></i>
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 bottom-2 px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Send
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }
);

BaseChat.displayName = 'BaseChat';

export default BaseChat;