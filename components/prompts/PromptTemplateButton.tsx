'use client';

import React, { useState } from 'react';
import PromptTemplateSelector from './PromptTemplateSelector';

interface PromptTemplateButtonProps {
  onSelectTemplate: (prompt: string) => void;
}

export default function PromptTemplateButton({ onSelectTemplate }: PromptTemplateButtonProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsSelectorOpen(true)}
        className="fixed bottom-48 left-4 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="AI Prompt Templates"
      >
        <i className="fas fa-lightbulb"></i>
      </button>
      
      <PromptTemplateSelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onApply={onSelectTemplate}
      />
    </>
  );
}