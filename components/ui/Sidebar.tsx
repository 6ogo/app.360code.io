'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Conversation } from '@/types/conversation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onProjectSelect: (conversation: Conversation) => void
  onNewProject: () => void
  currentConversation: Conversation
}

export default function Sidebar({
  isOpen,
  onClose,
  onProjectSelect,
  onNewProject,
  currentConversation
}: SidebarProps) {
  const { user, signOut } = useSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true)
      try {
        // First try to load from Supabase
        if (user) {
          const { supabase } = useSupabase()
          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

          if (!error && data) {
            setConversations(data as Conversation[])
            setLoading(false)
            return
          }
        }

        // Fallback to localStorage
        const localConversations: Conversation[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('conversation_')) {
            try {
              const conversation = JSON.parse(localStorage.getItem(key) || '{}')
              localConversations.push(conversation)
            } catch (error) {
              console.error('Error parsing conversation:', error)
            }
          }
        }

        if (localConversations.length > 0) {
          // Sort by id (assuming it contains timestamp)
          localConversations.sort((a, b) => parseInt(b.id, 36) - parseInt(a.id, 36))
          setConversations(localConversations)
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [user, currentConversation.id])

  // Get the name part of the email (everything before @)
  const userName = user?.email ? user.email.split('@')[0] : 'User'

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="p-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.svg"
                alt="360code.io Logo"
                width={32}
                height={32}
                className="transition-transform duration-300 hover:scale-110"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight">360code.io</span>
          </div>

          <button 
            onClick={onClose}
            className="md:hidden flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <button
          onClick={onNewProject}
          className="bg-gradient-to-r from-primary to-primary-dark text-white border-none rounded py-2.5 px-4 font-medium flex items-center justify-center gap-2 cursor-pointer relative z-10 w-full transition-all hover:brightness-110 active:translate-y-0.5"
        >
          <i className="fas fa-plus"></i>
          <span>New Project</span>
        </button>
      </div>

      <div className="p-5 overflow-y-auto h-[calc(100vh-170px)]">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">History</h2>
        
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="spinner"></div>
            </div>
          ) : conversations.length > 0 ? (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`project-card ${
                  conversation.id === currentConversation.id ? 'ring-1 ring-primary' : ''
                }`}
                onClick={() => onProjectSelect(conversation)}
              >
                <div className="truncate">
                  <h3 className="font-medium text-sm mb-1 truncate">{conversation.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.updated_at || conversation.id).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No projects yet</p>
          )}
        </div>
      </div>

      <div className="flex items-center border-t border-border p-4">
        <div className="flex-1 truncate">
          <p className="text-sm truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="bg-transparent text-muted-foreground hover:text-foreground px-2 py-1 rounded"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>
  )
}