'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useToast } from '@/components/providers/ToastProvider'
import Sidebar from '@/components/ui/Sidebar'
import Message from '@/components/ui/Message'
import { Conversation, Message as MessageType, generateId, extractCodeBlocks, generateDefaultSchema, generateDefaultEnv, generateDefaultConnection } from '@/types/conversation'
import ProjectModal from '@/components/ProjectModal'

export default function Home() {
  const { user, loading: authLoading } = useSupabase()
  const { showToast } = useToast()
  const router = useRouter()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  
  const [prompt, setPrompt] = useState('')
  const [modelType, setModelType] = useState('qwen-2.5-coder-32b')
  const [temperature, setTemperature] = useState(0.7)
  
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Define new conversation state with all required fields
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    id: generateId(),
    title: 'New Project',
    messages: [],
    code: null,
    schema: null,
    env: null,
    connection: null,
    model: 'qwen-2.5-coder-32b',
    temperature: 0.7,
  })

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Handle textarea auto-resize
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto'
      const scrollHeight = promptRef.current.scrollHeight
      promptRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  }, [prompt])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [currentConversation.messages])

  // Function to generate code
  const generateCode = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt.', 'error')
      return
    }

    // Add user message to the conversation
    const updatedMessages: MessageType[] = [
      ...currentConversation.messages,
      { role: 'user', content: prompt }
    ]
    
    // Update conversation title if this is the first message
    const title = currentConversation.messages.length === 0
      ? (prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt)
      : currentConversation.title
    
    setCurrentConversation(prev => ({
      ...prev,
      title,
      messages: updatedMessages
    }))
    
    // Clear input and set loading state
    setPrompt('')
    setLoading(true)
    
    try {
      // Call the API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: modelType,
          temperature
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Process the response
      const aiMessage: MessageType = {
        role: 'assistant',
        content: data.code
      }
      
      // Extract code blocks
      const codeBlocks = extractCodeBlocks(data.code)
      
      let mainCode = null
      let schema = null
      let env = null
      let connection = null
      
      if (codeBlocks.length > 0) {
        // Set main code from the first code block
        mainCode = codeBlocks[0].code
        
        // Try to identify special code blocks
        if (codeBlocks.length > 1) {
          // Look for SQL schema
          const sqlBlock = codeBlocks.find(block => 
            block.language.toLowerCase() === 'sql' || 
            block.code.toLowerCase().includes('create table'))
          
          if (sqlBlock) {
            schema = sqlBlock.code
          }
          
          // Look for environment variables
          const envBlock = codeBlocks.find(block => 
            block.code.includes('SUPABASE_URL') || 
            block.code.includes('.env'))
          
          if (envBlock) {
            env = envBlock.code
          }
          
          // Look for connection code
          const connectionBlock = codeBlocks.find(block => 
            block.code.includes('createClient') || 
            block.code.includes('supabase'))
          
          if (connectionBlock) {
            connection = connectionBlock.code
          }
        }
        
        // Generate defaults if not found
        if (!schema) schema = generateDefaultSchema()
        if (!env) env = generateDefaultEnv()
        if (!connection) connection = generateDefaultConnection()
      }
      
      // Update conversation with AI response and extracted code
      setCurrentConversation(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        code: mainCode,
        schema,
        env,
        connection,
        updated_at: new Date().toISOString()
      }))
      
      // Save the conversation
      saveConversation({
        ...currentConversation,
        messages: [...updatedMessages, aiMessage],
        code: mainCode,
        schema,
        env,
        connection,
        updated_at: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error generating code:', error)
      
      // Add error message to conversation
      setCurrentConversation(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { 
            role: 'assistant', 
            content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}. Please try again.` 
          }
        ]
      }))
      
      showToast(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  // Function to save conversation
  const saveConversation = async (conversation: Conversation) => {
    try {
      if (user) {
        // Save to Supabase
        const { supabase } = useSupabase()
        
        await supabase.from('conversations').upsert({
          id: conversation.id,
          user_id: user.id,
          title: conversation.title,
          messages: conversation.messages,
          code: conversation.code,
          schema: conversation.schema,
          env: conversation.env,
          connection: conversation.connection,
          model: conversation.model,
          temperature: conversation.temperature,
          updated_at: new Date().toISOString()
        })
      } else {
        // Save to localStorage
        localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation))
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
      // Fallback to localStorage if Supabase fails
      localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation))
    }
  }
  
  // Function to start a new chat
  const startNewChat = () => {
    // Save current conversation if it has messages
    if (currentConversation.messages.length > 0) {
      saveConversation(currentConversation)
    }
    
    // Create new conversation
    setCurrentConversation({
      id: generateId(),
      title: 'New Project',
      messages: [],
      code: null,
      schema: null,
      env: null,
      connection: null,
      model: modelType,
      temperature,
    })
    
    // Close sidebar on mobile
    setSidebarOpen(false)
  }
  
  // Function to load a conversation
  const loadConversation = (conversation: Conversation) => {
    // Save current conversation first
    if (currentConversation.messages.length > 0) {
      saveConversation(currentConversation)
    }
    
    // Load selected conversation
    setCurrentConversation(conversation)
    setSidebarOpen(false)
  }
  
  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      generateCode()
    }
  }
  
  // Welcome message component
  const WelcomeMessage = () => (
    <div className="ai-message message max-w-[85%] rounded-md p-4 relative animate-fade-in mr-auto">
      <p className="font-medium">Welcome to 360code.io!</p>
      <p className="mt-3">I can help you generate code for your projects. Try prompts like:</p>
      <ul className="mt-2 ml-6 list-disc">
        <li>Create a simple snake game</li>
        <li>Build a to-do list app with React</li>
        <li>Generate a landing page for a fitness app</li>
      </ul>
      <p className="mt-3">Your projects can include Supabase integration for backend functionality.</p>
    </div>
  )

  // Open project modal
  const openProjectModal = () => {
    setModalOpen(true)
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Background effects */}
      <div className="dot-pattern"></div>
      <div className="blue-glow top-right"></div>
      <div className="blue-glow bottom-left"></div>
      
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onProjectSelect={loadConversation}
        onNewProject={startNewChat}
        currentConversation={currentConversation}
      />
      
      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-muted-foreground bg-transparent border-none cursor-pointer text-xl"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          
          <div className="flex items-center gap-4">
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="bg-card/30 border border-border rounded text-foreground py-1.5 px-3 text-sm outline-none transition focus:border-primary focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
            >
              <option value="qwen-2.5-coder-32b">Qwen 2.5 Coder 32B</option>
              <option value="llama3-70b-8192">Llama3 70B</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
            </select>
            
            <div className="flex items-center gap-2 hidden md:flex">
              <span className="text-sm text-muted-foreground">Temperature:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-24 h-1 bg-muted/50 rounded-sm appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-sm min-w-[1.5rem] text-center">{temperature}</span>
            </div>
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex flex-col h-[calc(100vh-64px)]">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
          >
            {currentConversation.messages.length === 0 ? (
              <WelcomeMessage />
            ) : (
              currentConversation.messages.map((message, index) => (
                <Message
                  key={index}
                  content={message.content}
                  role={message.role}
                  onViewProject={message.role === 'assistant' && currentConversation.code ? openProjectModal : undefined}
                  hasCode={message.role === 'assistant' && !!currentConversation.code}
                />
              ))
            )}
            
            {loading && (
              <div className="ai-message message max-w-[85%] rounded-md p-4 relative animate-fade-in mr-auto">
                <div className="flex items-center gap-2">
                  <div className="spinner"></div>
                  <div className="text-muted-foreground">Generating code...</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background/95">
            <div className="relative max-w-4xl mx-auto">
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build..."
                className="input-box"
                disabled={loading}
              />
              <button
                onClick={generateCode}
                className="absolute right-3 bottom-3 bg-transparent border-none text-primary cursor-pointer text-xl transition-transform hover:scale-110 hover:text-primary-foreground hover:bg-primary/10 w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                disabled={loading || !prompt.trim()}
              >
                <i className={loading ? "fas fa-circle-notch fa-spin" : "fas fa-paper-plane"}></i>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Project Modal */}
      {modalOpen && (
        <ProjectModal
          isOpen={modalOpen}
          conversation={currentConversation}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}