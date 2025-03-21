'use client';

import React, { useState } from 'react';
import ExportPanel from './ExportPanel';

export default function ExportButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-72 right-4 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Export Project"
      >
        <i className="fas fa-file-export"></i>
      </button>
      
      <ExportPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}