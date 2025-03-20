'use client'

import { useState } from 'react'
import { Conversation } from '@/types/conversation'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation
}

export default function ProjectModal({ isOpen, onClose, conversation }: ProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'schema' | 'env' | 'connection'>('code')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-6xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">{conversation.title}</h2>
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
            className={`px-4 py-2 font-medium ${activeTab === 'code' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'schema' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('schema')}
          >
            Schema
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'env' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('env')}
          >
            Environment
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'connection' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('connection')}
          >
            Connection
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="bg-card/30 p-4 rounded-md overflow-auto h-full text-sm">
            <code>
              {activeTab === 'code' && conversation.code}
              {activeTab === 'schema' && conversation.schema}
              {activeTab === 'env' && conversation.env}
              {activeTab === 'connection' && conversation.connection}
            </code>
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}