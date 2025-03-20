'use client'

import React from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useToast } from '@/components/providers/ToastProvider'

interface MessageProps {
  content: string
  role: 'user' | 'assistant'
  onViewProject?: () => void
  hasCode?: boolean
}

// Helper to extract code blocks from markdown
const extractCodeBlocks = (content: string) => {
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  const codeBlocks = []
  let match

  while ((match = regex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim()
    })
  }

  return codeBlocks
}

const Message: React.FC<MessageProps> = ({ content, role, onViewProject, hasCode }) => {
  const { showToast } = useToast()

  // Process the content to handle code blocks
  const processContent = () => {
    // Replace code blocks with syntax-highlighted versions
    let processedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, language, code) => {
      return `<div class="code-block-placeholder" data-language="${language || 'plaintext'}" data-code="${encodeURIComponent(code.trim())}"></div>`
    })

    // Replace newlines with <br> tags outside of code blocks
    processedContent = processedContent.replace(/\n/g, '<br>')

    return processedContent
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy to clipboard', 'error'))
  }

  React.useEffect(() => {
    // Replace code block placeholders with actual syntax highlighters
    const codeBlocks = document.querySelectorAll('.code-block-placeholder')
    codeBlocks.forEach(block => {
      const language = block.getAttribute('data-language') || 'plaintext'
      const code = decodeURIComponent(block.getAttribute('data-code') || '')
      
      // Create wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'relative my-4'
      
      // Create syntax highlighter
      const pre = document.createElement('pre')
      pre.className = 'code-block'
      pre.innerHTML = `<code class="language-${language}">${code}</code>`
      
      // Create copy button
      const copyBtn = document.createElement('button')
      copyBtn.className = 'copy-button'
      copyBtn.innerHTML = '<i class="fas fa-copy"></i>'
      copyBtn.addEventListener('click', () => copyToClipboard(code))
      
      // Append elements
      wrapper.appendChild(pre)
      wrapper.appendChild(copyBtn)
      
      // Replace placeholder with wrapper
      block.replaceWith(wrapper)
    })
  }, [content])

  return (
    <div className={`${role === 'user' ? 'user-message ml-auto' : 'ai-message mr-auto'} message max-w-[85%] rounded-md p-4 relative animate-fade-in`}>
      <div dangerouslySetInnerHTML={{ __html: processContent() }} />
      
      {role === 'assistant' && hasCode && onViewProject && (
        <button 
          onClick={onViewProject}
          className="view-project-btn"
        >
          <i className="fas fa-eye"></i>
          View Complete Project
        </button>
      )}
    </div>
  )
}

export default Message