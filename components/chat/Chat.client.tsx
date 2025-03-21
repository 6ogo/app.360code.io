// components/chat/Chat.client.tsx
'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { projectStore } from '@/lib/stores/projectContext';
import { continueProject } from '@/lib/services/projectContinuation';
import { generateDocumentation } from '@/lib/services/documentationGenerator';
import { workbenchStore } from '@/lib/stores/workbench';
import { useCollaboration } from '../../lib/collaboration/collaborationsService';
import BaseChat from './BaseChat';
import { useSnapScroll, useMessageParser } from '@/lib/hooks';
import { ToastContainer, toast } from '@/components/ToastWrapper';
import { DocumentationViewer } from '@/components/DocumentationViewer';
import { ProjectSummary } from '@/components/ProjectSummary';
import { Message } from '@/types/conversation';
import { AppMessage } from '@/types/message';

interface ChatClientProps {
  initialPrompt?: string;
}

export default function Chat({ initialPrompt = '' }: ChatClientProps) {
  const [messageRef, scrollRef] = useSnapScroll();
  const { parsedMessages, parseMessages } = useMessageParser();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [customInput, setCustomInput] = useState(initialPrompt);
  
  const project = useStore(projectStore);
  const files = useStore(workbenchStore.files);
  const collaboration = useCollaboration();
  
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    setMessages: setAiMessages,
    isLoading,
    stop
  } = useChat({
    api: '/api/chat',
    initialInput: initialPrompt,
    onResponse: () => {
      setIsStreaming(true);
    },
    onFinish: (message) => {
      setIsStreaming(false);
      
      // Once response is complete, generate documentation
      if (aiMessages.length > 1) {
        const lastAssistantMessage = aiMessages.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMessage) {
          const description = lastAssistantMessage.content.substring(0, 200) + '...';
          generateDocumentation(files, description);
          
          // Update project status
          const currentProject = projectStore.get();
          projectStore.set({
            ...currentProject,
            currentStep: currentProject.currentStep + 1,
            status: 'paused',
            lastContext: lastAssistantMessage.content
          });
        }
      }
      
      setIsContinuing(false);
      
      // If in collaboration mode, broadcast the latest file changes
      if (collaboration.getState().isJoined) {
        // Broadcast all files to collaborators
        Object.entries(files).forEach(([path, content]) => {
          collaboration.broadcastFileChange(path, content);
        });
      }
    },
    onError: (error) => {
      setIsStreaming(false);
      setIsContinuing(false);
      toast.error(`Error: ${error.message || 'An error occurred'}`);
    }
  });

  // Handle initialPrompt changes
  useEffect(() => {
    if (initialPrompt && initialPrompt !== input) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, setInput]);

  useEffect(() => {
    // Convert AI SDK messages to our app format for parsing
    const appCompatibleMessages = aiMessages.map(msg => {
      return {
        role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'assistant',
        content: msg.content.toString()
      } as Message;
    });
    
    parseMessages(appCompatibleMessages, isLoading);
  }, [aiMessages, isLoading, parseMessages]);

  useEffect(() => {
    // If message token limit is reached (assumed by completion status),
    // automatically continue the project
    if (project.status === 'paused' && !isStreaming && !isContinuing && aiMessages.length > 0) {
      const shouldAutoContinue = window.confirm(
        'The project is paused. Would you like to continue where you left off?'
      );
      
      if (shouldAutoContinue) {
        continueProjectExecution();
      }
    }
  }, [project.status, isStreaming, isContinuing, aiMessages.length]);

  const continueProjectExecution = async () => {
    setIsContinuing(true);
    
    try {
      // Convert AI SDK messages to our app format for continuation
      const appCompatibleMessages = aiMessages.map(msg => {
        return {
          id: msg.id,
          role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'assistant',
          content: msg.content.toString()
        };
      });
      
      const continuationMessages = await continueProject(appCompatibleMessages);
      setAiMessages(continuationMessages);
      
      // Update project status
      const currentProject = projectStore.get();
      projectStore.set({
        ...currentProject,
        status: 'generating'
      });
      
      // Submit the continuation message
      const lastMessage = continuationMessages[continuationMessages.length - 1];
      
      // Create a form event and submit the message
      const form = document.createElement('form');
      const submitEvent = new SubmitEvent('submit', { 
        bubbles: true, 
        cancelable: true, 
        submitter: form 
      });
      
      handleSubmit(submitEvent, {
        data: {
          content: lastMessage.content
        }
      });
    } catch (error) {
      console.error('Failed to continue project:', error);
      toast.error('Failed to continue the project');
      setIsContinuing(false);
    }
  };

  const chatStarted = aiMessages.length > 0;

  // Convert AI messages to our app's message format
  const convertedMessages: AppMessage[] = aiMessages.map((message, index) => ({
    role: message.role === 'user' || message.role === 'assistant' ? message.role : 'assistant',
    content: parsedMessages[index] || (typeof message.content === 'string' 
      ? message.content 
      : typeof message.content === 'object' && message.content !== null
        ? JSON.stringify(message.content)
        : String(message.content))
  }));

  const divRef = useRef<HTMLDivElement | null>(null);
  
  // Custom input handler with collaboration support
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInput(e.target.value);
    handleInputChange(e);
  };
  
  // Custom submit handler with collaboration support
  const handleCustomSubmit = (e: React.FormEvent, options?: any) => {
    if (collaboration.getState().isJoined) {
      // Before submitting, broadcast the current cursor position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      collaboration.broadcastCursorPosition(rect.left, rect.top);
    }
    
    handleSubmit(e, options);
  };

  return (
    <>
      <BaseChat
        ref={scrollRef}
        messageRef={messageRef as React.RefObject<HTMLDivElement>}
        showChat={true}
        chatStarted={chatStarted}
        isStreaming={isStreaming}
        messages={convertedMessages}
        input={input}
        handleInputChange={handleCustomInputChange}
        handleStop={stop}
        sendMessage={handleCustomSubmit}
      />
      
      <DocumentationViewer />
      <ProjectSummary />
      
      {project.status === 'paused' && !isStreaming && !isContinuing && (
        <button 
          className="fixed bottom-24 right-4 z-10 bg-primary text-white px-4 py-2 rounded-md shadow-lg"
          onClick={continueProjectExecution}
        >
          Continue Project
        </button>
      )}
      
      <ToastContainer position="bottom-right" />
    </>
  );
}