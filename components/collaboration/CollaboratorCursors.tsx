'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCollaboration, User } from '../../lib/collaboration/collaborationsService';

export default function CollaboratorCursors() {
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [cursorContainer, setCursorContainer] = useState<HTMLElement | null>(null);
  
  const collaboration = useCollaboration();
  
  // Set up cursor container
  useEffect(() => {
    // Create container for cursor elements
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    setCursorContainer(container);
    
    // Clean up
    return () => {
      document.body.removeChild(container);
    };
  }, []);
  
  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get current file from CodeMirror editor
      const editor = document.querySelector('.cm-editor');
      const fileName = editor?.getAttribute('data-file') || undefined;
      
      // Broadcast cursor position
      collaboration.broadcastCursorPosition(e.clientX, e.clientY, fileName);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Poll for collaborators
  useEffect(() => {
    const interval = setInterval(() => {
      const state = collaboration.getState();
      setCollaborators(Object.values(state.users));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!cursorContainer) return null;
  
  return createPortal(
    <>
      {collaborators.map(user => {
        if (!user.cursor) return null;
        
        return (
          <div
            key={user.id}
            className="absolute pointer-events-none"
            style={{
              left: `${user.cursor.x}px`,
              top: `${user.cursor.y}px`,
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.1s ease'
            }}
          >
            <div
              className="cursor-pointer"
              style={{ color: user.color || '#666' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,2L17,12L7,22V2Z" />
              </svg>
            </div>
            <div
              className="absolute left-6 top-0 px-2 py-1 text-xs rounded whitespace-nowrap"
              style={{ 
                backgroundColor: user.color || '#666',
                color: '#fff'
              }}
            >
              {user.email || `User ${user.id.substring(0, 6)}`}
            </div>
          </div>
        );
      })}
    </>,
    cursorContainer
  );
}