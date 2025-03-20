'use client';

import React, { useEffect, useRef } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { createRoot } from 'react-dom/client';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process the content to handle code blocks and markdown formatting
  const processContent = () => {
    // Replace code blocks with syntax-highlighted versions
    let processedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, language, code) => {
      return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span>${language || 'code'}</span>
          <button class="copy-button" data-code="${encodeURIComponent(code.trim())}">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <pre class="code-block" data-language="${language || 'plaintext'}" data-code="${encodeURIComponent(code.trim())}"></pre>
      </div>`;
    });

    // Process headers (## Header)
    processedContent = processedContent.replace(/^##\s+(.*$)/gm, '<h2 class="text-xl font-bold my-4">$1</h2>');
    processedContent = processedContent.replace(/^###\s+(.*$)/gm, '<h3 class="text-lg font-bold my-3">$1</h3>');
    
    // Process bold and italic
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processedContent = processedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process lists
    processedContent = processedContent.replace(/^\-\s+(.*$)/gm, '<li class="ml-4">$1</li>');
    
    // Process links
    processedContent = processedContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Replace newlines with <br> tags outside of code blocks
    processedContent = processedContent.replace(/\n/g, '<br>');
    
    return processedContent;
  };

  // Add the syntax highlighting to code blocks after rendering
  useEffect(() => {
    if (!containerRef.current) return;
    
    const codeBlocks = containerRef.current.querySelectorAll('.code-block');
    
    codeBlocks.forEach(block => {
      const language = block.getAttribute('data-language') || 'plaintext';
      const code = decodeURIComponent(block.getAttribute('data-code') || '');
      
      try {
        // Create a React root and render the syntax highlighter
        const root = createRoot(block);
        root.render(
          <SyntaxHighlighter language={language} style={oneDark} showLineNumbers>
            {code}
          </SyntaxHighlighter>
        );
      } catch (error) {
        console.error('Error rendering syntax highlighter:', error);
        // Fallback rendering if React root creation fails
        block.innerHTML = `<code>${code}</code>`;
      }
    });
    
    // Add click handlers for copy buttons
    const copyButtons = containerRef.current.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const code = decodeURIComponent(button.getAttribute('data-code') || '');
        navigator.clipboard.writeText(code)
          .then(() => {
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
              button.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
          })
          .catch(err => console.error('Failed to copy: ', err));
      });
    });
    
    // Cleanup function
    return () => {
      copyButtons.forEach(button => {
        button.removeEventListener('click', () => {});
      });
    };
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className="markdown-content" 
      dangerouslySetInnerHTML={{ __html: processContent() }}
    />
  );
}