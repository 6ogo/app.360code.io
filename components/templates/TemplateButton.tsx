'use client';

import React from 'react';

// Define the prop types
interface TemplateButtonProps {
  onSelectTemplate: (prompt: string) => void;
}

export default function TemplateButton({ onSelectTemplate }: TemplateButtonProps) {
  // Example implementation
  const promptTemplates = [
    'Create a new React component',
    'Implement a data visualization',
    'Build a REST API endpoint'
  ];

  return (
    <div>
      <button onClick={() => {
        // Example: select the first template
        onSelectTemplate(promptTemplates[0]);
      }}>
        Select Prompt Template
      </button>
    </div>
  );
}