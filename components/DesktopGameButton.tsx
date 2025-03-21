'use client';

import React, { useState } from 'react';
import DesktopGamePanel from './DesktopGamePanel';

export default function DesktopGameButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-24 left-20 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Desktop & Game Development"
      >
        <i className="fas fa-desktop"></i>
      </button>
      
      <DesktopGamePanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}