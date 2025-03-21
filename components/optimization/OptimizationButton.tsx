'use client';

import React, { useState } from 'react';
import OptimizationPanel from './OptimizationPanel';

export default function OptimizationButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-72 left-4 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Optimize Project"
      >
        <i className="fas fa-tachometer-alt"></i>
      </button>
      
      <OptimizationPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}