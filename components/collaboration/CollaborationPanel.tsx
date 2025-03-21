// components/collaboration/CollaborationPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCollaboration, User } from '../../lib/collaboration/collaborationsService';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaborationPanel({ isOpen, onClose }: CollaborationPanelProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [tab, setTab] = useState<'join' | 'invite'>('join');
  
  const { user } = useSupabase();
  const { showToast } = useToast();
  const collaboration = useCollaboration();
  
  // Get collaboration state
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const state = collaboration.getState();
      
      setCollaborators(Object.values(state.users));
      
      if (state.roomId && state.isJoined) {
        setRoomId(state.roomId);
        setShareUrl(`${window.location.origin}/collaborate?room=${state.roomId}`);
        setTab('invite');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);
  
  const handleCreateRoom = async () => {
    if (!user) {
      showToast('You must be logged in to create a room', 'error');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const newRoomId = await collaboration.createRoom();
      setRoomId(newRoomId);
      setShareUrl(`${window.location.origin}/collaborate?room=${newRoomId}`);
      setTab('invite');
      showToast('Collaboration room created successfully', 'success');
    } catch (error) {
      console.error('Error creating room:', error);
      showToast('Failed to create collaboration room', 'error');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinRoom = async () => {
    if (!roomId) {
      showToast('Please enter a room ID', 'error');
      return;
    }
    
    if (!user) {
      showToast('You must be logged in to join a room', 'error');
      return;
    }
    
    setIsJoining(true);
    
    try {
      const success = await collaboration.joinRoom(roomId);
      
      if (success) {
        setShareUrl(`${window.location.origin}/collaborate?room=${roomId}`);
        setTab('invite');
        showToast('Joined collaboration room successfully', 'success');
      } else {
        showToast('Failed to join room', 'error');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      showToast('Failed to join collaboration room', 'error');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeaveRoom = async () => {
    try {
      await collaboration.leaveRoom();
      setRoomId('');
      setShareUrl('');
      setTab('join');
      showToast('Left collaboration room', 'info');
    } catch (error) {
      console.error('Error leaving room:', error);
      showToast('Failed to leave room', 'error');
    }
  };
  
  const copyRoomLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
      showToast('Collaboration link copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast('Failed to copy link', 'error');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Real-Time Collaboration</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            className={`px-4 py-2 font-medium ${tab === 'join' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('join')}
          >
            Join Room
          </button>
          <button
            className={`px-4 py-2 font-medium ${tab === 'invite' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('invite')}
            disabled={!shareUrl}
          >
            Invite Others
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {tab === 'join' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Room ID</label>
                <div className="flex">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID to join"
                    className="flex-1 p-2 bg-card border border-border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!roomId || isJoining}
                    className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary-hover disabled:opacity-50"
                  >
                    {isJoining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-sm text-muted-foreground">or</span>
              </div>
              
              <div>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full px-4 py-2 bg-muted text-foreground border border-border rounded-md hover:bg-muted/80 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create New Room'}
                </button>
              </div>
            </div>
          )}
          
          {tab === 'invite' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Share Link</label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-2 bg-card border border-border rounded-l-md focus:outline-none"
                  />
                  <button
                    onClick={copyRoomLink}
                    className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary-hover"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Room ID</label>
                <p className="p-2 bg-card border border-border rounded-md font-mono text-sm">
                  {roomId}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Active Collaborators</label>
                <div className="border border-border rounded-md overflow-hidden">
                  {collaborators.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {collaborators.map(user => (
                        <li key={user.id} className="flex items-center p-3">
                          <div 
                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                            style={{ backgroundColor: user.color || '#666' }}
                          ></div>
                          <span className="flex-1 truncate">
                            {user.email || `User ${user.id.substring(0, 6)}`}
                          </span>
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No active collaborators
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <button
                  onClick={handleLeaveRoom}
                  className="w-full px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-500/20"
                >
                  Leave Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}