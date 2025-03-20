import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { projectStore } from '~/lib/stores/projectContext';
import { continueProject } from '~/lib/services/projectContinuation';
import { generateDocumentation } from '~/lib/services/documentationGenerator';
import { workbenchStore } from '~/lib/stores/workbench';
import { BaseChat } from './BaseChat';
import { useSnapScroll, useMessageParser } from '~/lib/hooks';
import { ToastContainer, toast } from 'react-toastify';
import { ProjectStatus } from '~/components/ProjectStatus';
import { DocumentationViewer } from '~/components/DocumentationViewer';
import { ProjectSummary } from '~/components/ProjectSummary';

export function Chat() {
  const [messageRef, scrollRef] = useSnapScroll();
  const { parsedMessages, parseMessages } = useMessageParser();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const project = useStore(projectStore);
  const files = useStore(workbenchStore.files);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    stop
  } = useChat({
    api: '/api/chat',
    onResponse: () => {
      setIsStreaming(true);
    },
    onFinish: () => {
      setIsStreaming(false);
      
      // Once response is complete, generate documentation
      if (messages.length > 1) {
        const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMessage) {
          const description = lastAssistantMessage.content.substring(0, 200) + '...';
          generateDocumentation(files.get(), description);
          
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
    },
    onError: (error) => {
      setIsStreaming(false);
      setIsContinuing(false);
      toast.error(`Error: ${error.message}`);
    }
  });

  useEffect(() => {
    parseMessages(messages, isLoading);
  }, [messages, isLoading]);

  useEffect(() => {
    // If message token limit is reached (assumed by completion status),
    // automatically continue the project
    if (project.status === 'paused' && !isStreaming && !isContinuing && messages.length > 0) {
      const shouldAutoContinue = window.confirm(
        'The project is paused. Would you like to continue where you left off?'
      );
      
      if (shouldAutoContinue) {
        continueProjectExecution();
      }
    }
  }, [project.status, isStreaming]);

  const continueProjectExecution = async () => {
    setIsContinuing(true);
    
    try {
      const continuationMessages = await continueProject(messages);
      setMessages(continuationMessages);
      
      // Update project status
      const currentProject = projectStore.get();
      projectStore.set({
        ...currentProject,
        status: 'generating'
      });
      
      // Submit the continuation message
      const lastMessage = continuationMessages[continuationMessages.length - 1];
      handleSubmit(new Event('continue') as any, lastMessage.content);
    } catch (error) {
      console.error('Failed to continue project:', error);
      toast.error('Failed to continue the project');
      setIsContinuing(false);
    }
  };

  const chatStarted = messages.length > 0;

  return (
    <>
      <BaseChat
        ref={scrollRef}
        messageRef={messageRef}
        textareaRef={undefined}
        showChat={true}
        chatStarted={chatStarted}
        isStreaming={isStreaming}
        messages={messages.map((message, i) => ({
          ...message,
          content: parsedMessages[i] || message.content,
        }))}
        input={input}
        handleInputChange={handleInputChange}
        handleStop={stop}
        sendMessage={handleSubmit}
      />
      
      <ProjectStatus />
      <DocumentationViewer />
      <ProjectSummary />
      
      {project.status === 'paused' && !isStreaming && !isContinuing && (
        <button 
          className="fixed bottom-24 right-4 z-10 bg-accent-500 text-white px-4 py-2 rounded-md shadow-lg"
          onClick={continueProjectExecution}
        >
          Continue Project
        </button>
      )}
      
      <ToastContainer position="bottom-right" />
    </>
  );
  