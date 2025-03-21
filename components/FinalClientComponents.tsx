// components/FinalClientComponents.tsx
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import the components with SSR disabled
const Chat = dynamic(() => import('@/components/chat/Chat.client'), {
  ssr: false,
});

const FileExplorer = dynamic(() => import('@/components/FileExplorer'), {
  ssr: false,
});

const ProjectProgress = dynamic(() => import('@/components/ProjectProgress'), {
  ssr: false,
});

// Import our new components
const TemplateButton = dynamic(() => import('@/components/templates/TemplateButton'), {
  ssr: false,
});

const DesktopGameButton = dynamic(() => import('@/components/DesktopGameButton'), {
  ssr: false,
});

const SchemaButton = dynamic(() => import('@/components/database/SchemaButton'), {
  ssr: false,
});

const ExportButton = dynamic(() => import('@/components/export/ExportButton'), {
  ssr: false,
});

const OptimizationButton = dynamic(() => import('@/components/optimization/OptimizationButton'), {
  ssr: false,
});

const CollaborationButton = dynamic(() => import('@/components/collaboration/CollaborationButton'), {
  ssr: false,
});

const CollaboratorCursors = dynamic(() => import('@/components/collaboration/CollaboratorCursors'), {
  ssr: false,
});

const AnalyticsButton = dynamic(() => import('@/components/analytics/AnalyticsButton'), {
  ssr: false,
});

const ModelConfigButton = dynamic(() => import('@/components/model/ModelConfigButton'), {
  ssr: false,
});

export function FinalClientComponents() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  
  // Handle applying a prompt template
  const handleApplyPromptTemplate = (prompt: string) => {
    setSelectedPrompt(prompt);
    
    // Find the chat input and set its value to the prompt
    const chatInput = document.querySelector('textarea[placeholder*="Describe"]') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = prompt;
      
      // Trigger input event to update the state in the Chat component
      const event = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(event);
      
      // Focus the input
      chatInput.focus();
    }
  };
  
  return (
    <>
      <Chat initialPrompt={selectedPrompt} />
      <FileExplorer />
      <ProjectProgress />
      
      {/* Template features */}
      <TemplateButton onSelectTemplate={handleApplyPromptTemplate} />
      <DesktopGameButton />
      
      {/* Database and code features */}
      <SchemaButton />
      <OptimizationButton />
      
      {/* Export and sharing */}
      <ExportButton />
      <CollaborationButton />
      <CollaboratorCursors />
      
      {/* Analytics and configuration */}
      <AnalyticsButton />
      <ModelConfigButton />
    </>
  );
}