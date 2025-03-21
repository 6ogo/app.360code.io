'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CollaborationPanel from './CollaborationPanel';
import { useCollaboration } from '../../lib/collaboration/collaborationsService';
import { useToast } from '@/components/providers/ToastProvider';

export default function CollaborationButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const collaboration = useCollaboration();
  const { showToast } = useToast();
  
  // Check for room in URL params
  useEffect(() => {
    const roomId = searchParams.get('room');
    
    if (roomId) {
      // Try to join the room from URL
      joinRoomFromUrl(roomId);
    }
  }, [searchParams]);
  
  // Poll collaboration state for updates
  useEffect(() => {
    const interval = setInterval(() => {
      const state = collaboration.getState();
      setIsActive(state.isJoined);
      setActiveUsers(state.activeUsers);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const joinRoomFromUrl = async (roomId: string) => {
    try {
      const success = await collaboration.joinRoom(roomId);
      
      if (success) {
        showToast('Joined collaboration room', 'success');
        // Remove room param from URL
        router.replace('/');
      } else {
        showToast('Failed to join room', 'error');
      }
    } catch (error) {
      console.error('Error joining room from URL:', error);
      showToast('Failed to join collaboration room', 'error');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className={`fixed bottom-48 right-4 z-10 ${
          isActive ? 'bg-green-500' : 'bg-primary'
        } text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg relative`}
        title="Collaborate"
      >
        <i className="fas fa-users"></i>
        {isActive && activeUsers > 1 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium">
            {activeUsers}
          </div>
        )}
      </button>
      
      <CollaborationPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}