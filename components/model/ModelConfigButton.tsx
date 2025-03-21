'use client';

import React, { useState } from 'react';
import ModelConfigPanel from './ModelConfigPanel';

export default function ModelConfigButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-96 left-4 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="AI Model Settings"
      >
        <i className="fas fa-sliders-h"></i>
      </button>
      
      <ModelConfigPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}