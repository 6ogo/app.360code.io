// lib/collaboration/collaborationService.ts
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { workbenchStore } from '@/lib/stores/workbench';
import { projectStore } from '@/lib/stores/projectContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  color?: string;
  cursor?: { x: number, y: number, fileName?: string };
  isActive: boolean;
  lastSeen: Date;
}

export interface FileChange {
  userId: string;
  fileName: string;
  content: string;
  timestamp: Date;
}

export interface CollaborationState {
  users: Record<string, User>;
  activeUsers: number;
  isConnected: boolean;
  isJoined: boolean;
  roomId: string | null;
  isOwner: boolean;
}

class CollaborationService {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  private users: Record<string, User> = {};
  private isConnected = false;
  private isJoined = false;
  private isOwner = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA5A5', '#A5C8FF',
    '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#073B4C'
  ];
  
  constructor() {
    // Initialize with empty state
  }
  
  /**
   * Create a new collaboration room
   */
  async createRoom(): Promise<string> {
    const { supabase, user } = useSupabase();
    
    if (!user) {
      throw new Error('User must be logged in to create a room');
    }
    
    try {
      // Create a room in Supabase
      const { data, error } = await supabase
        .from('collaboration_rooms')
        .insert({
          owner_id: user.id,
          name: projectStore.get().title || 'Untitled Project',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const roomId = data.id;
      
      // Join the room we just created
      await this.joinRoom(roomId);
      
      this.isOwner = true;
      
      return roomId;
    } catch (error) {
      console.error('Error creating collaboration room:', error);
      throw error;
    }
  }
  
  /**
   * Join an existing collaboration room
   */
  async joinRoom(roomId: string): Promise<boolean> {
    const { supabase, user } = useSupabase();
    
    if (!user) {
      throw new Error('User must be logged in to join a room');
    }
    
    try {
      // Check if room exists
      const { data: room, error: roomError } = await supabase
        .from('collaboration_rooms')
        .select()
        .eq('id', roomId)
        .single();
      
      if (roomError || !room) {
        throw new Error('Room not found');
      }
      
      // Set owner status
      this.isOwner = room.owner_id === user.id;
      
      // Generate a random color for this user
      const randomColor = this.userColors[Math.floor(Math.random() * this.userColors.length)];
      
      // Add user to the room
      const { error: joinError } = await supabase
        .from('room_participants')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          user_email: user.email,
          color: randomColor,
          is_active: true,
          last_seen: new Date().toISOString()
        });
      
      if (joinError) {
        throw joinError;
      }
      
      // Subscribe to the room channel
      this.roomId = roomId;
      
      // Set up realtime subscription
      this.channel = supabase
        .channel(`room:${roomId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel?.presenceState() || {};
          this.syncUsers(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const userId = key.split(':')[1];
          console.log(`User ${userId} joined`);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const userId = key.split(':')[1];
          console.log(`User ${userId} left`);
          this.removeUser(userId);
        })
        .on('broadcast', { event: 'file_change' }, (payload) => {
          this.handleFileChange(payload);
        })
        .on('broadcast', { event: 'cursor_move' }, (payload) => {
          this.handleCursorMove(payload);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track presence
            await this.channel?.track({
              user_id: user.id,
              email: user.email,
              color: randomColor,
              online_at: new Date().toISOString()
            });
            
            // Send initial file state
            this.broadcastFiles();
            
            this.isConnected = true;
            this.isJoined = true;
            
            // Start heartbeat
            this.startHeartbeat();
          }
        });
      
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      this.leaveRoom();
      return false;
    }
  }
  
  /**
   * Leave the current collaboration room
   */
  async leaveRoom(): Promise<void> {
    try {
      const { supabase, user } = useSupabase();
      
      if (!this.roomId || !user) return;
      
      // Stop heartbeat
      this.stopHeartbeat();
      
      // Remove presence
      await this.channel?.untrack();
      
      // Unsubscribe from channel
      await this.channel?.unsubscribe();
      
      // Update participation record
      await supabase
        .from('room_participants')
        .update({
          is_active: false,
          last_seen: new Date().toISOString()
        })
        .eq('room_id', this.roomId)
        .eq('user_id', user.id);
      
      // Reset state
      this.channel = null;
      this.roomId = null;
      this.users = {};
      this.isConnected = false;
      this.isJoined = false;
      this.isOwner = false;
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }
  
  /**
   * Send a file change to all participants
   */
  async broadcastFileChange(fileName: string, content: string): Promise<void> {
    if (!this.channel || !this.isConnected) return;
    
    const { user } = useSupabase();
    if (!user) return;
    
    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'file_change',
        payload: {
          userId: user.id,
          fileName,
          content,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error broadcasting file change:', error);
    }
  }
  
  /**
   * Send cursor position to all participants
   */
  async broadcastCursorPosition(
    x: number, 
    y: number, 
    fileName?: string
  ): Promise<void> {
    if (!this.channel || !this.isConnected) return;
    
    const { user } = useSupabase();
    if (!user) return;
    
    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: user.id,
          position: { x, y, fileName }
        }
      });
    } catch (error) {
      console.error('Error broadcasting cursor position:', error);
    }
  }
  
  /**
   * Send all current files to the room
   */
  private async broadcastFiles(): Promise<void> {
    const files = workbenchStore.files.get();
    const { user } = useSupabase();
    
    if (!user || !this.channel) return;
    
    try {
      // Send each file
      for (const [fileName, content] of Object.entries(files)) {
        await this.channel.send({
          type: 'broadcast',
          event: 'file_change',
          payload: {
            userId: user.id,
            fileName,
            content,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting files:', error);
    }
  }
  
  /**
   * Handle a file change from another user
   */
  private handleFileChange(payload: any): void {
    const { userId, fileName, content } = payload;
    
    const { user } = useSupabase();
    if (userId === user?.id) return; // Ignore our own changes
    
    // Update file in workbench
    const currentContent = workbenchStore.files.get()[fileName];
    
    if (currentContent !== content) {
      workbenchStore.updateFile(fileName, content);
    }
  }
  
  /**
   * Handle cursor move from another user
   */
  private handleCursorMove(payload: any): void {
    const { userId, position } = payload;
    
    const { user } = useSupabase();
    if (userId === user?.id) return; // Ignore our own cursor
    
    // Update user's cursor position
    if (this.users[userId]) {
      this.users[userId].cursor = position;
      this.users[userId].isActive = true;
      this.users[userId].lastSeen = new Date();
    }
  }
  
  /**
   * Sync users from presence state
   */
  private syncUsers(state: Record<string, any>): void {
    const presenceUsers: Record<string, User> = {};
    
    Object.entries(state).forEach(([key, presences]) => {
      const userId = key.split(':')[1];
      const presence = Array.isArray(presences) ? presences[0] : presences;
      
      if (presence) {
        presenceUsers[userId] = {
          id: userId,
          email: presence.email,
          color: presence.color,
          cursor: presence.cursor,
          isActive: true,
          lastSeen: new Date()
        };
      }
    });
    
    this.users = presenceUsers;
  }
  
  /**
   * Remove a user from the local state
   */
  private removeUser(userId: string): void {
    const newUsers = { ...this.users };
    delete newUsers[userId];
    this.users = newUsers;
  }
  
  /**
   * Start heartbeat to keep presence alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.channel) return;
      
      try {
        // Update presence
        await this.channel.track({
          online_at: new Date().toISOString()
        });
        
        // Update participant record
        const { supabase, user } = useSupabase();
        if (user && this.roomId) {
          await supabase
            .from('room_participants')
            .update({
              last_seen: new Date().toISOString()
            })
            .eq('room_id', this.roomId)
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error in heartbeat:', error);
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Get current collaboration state
   */
  getState(): CollaborationState {
    return {
      users: this.users,
      activeUsers: Object.keys(this.users).length,
      isConnected: this.isConnected,
      isJoined: this.isJoined,
      roomId: this.roomId,
      isOwner: this.isOwner
    };
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();

// React hook for collaboration
export function useCollaboration() {
  return {
    createRoom: collaborationService.createRoom.bind(collaborationService),
    joinRoom: collaborationService.joinRoom.bind(collaborationService),
    leaveRoom: collaborationService.leaveRoom.bind(collaborationService),
    broadcastFileChange: collaborationService.broadcastFileChange.bind(collaborationService),
    broadcastCursorPosition: collaborationService.broadcastCursorPosition.bind(collaborationService),
    getState: collaborationService.getState.bind(collaborationService)
  };
}