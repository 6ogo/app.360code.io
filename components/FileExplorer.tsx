'use client';

import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '@/lib/stores/workbench';
import Image from 'next/image';

export default function FileExplorer() {
  const [isOpen, setIsOpen] = useState(false);
  const files = useStore(workbenchStore.files);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  
  // Organize files into a directory structure
  const getFileTree = () => {
    const fileList = Object.keys(files);
    const tree: Record<string, string[]> = {
      '/': []
    };
    
    fileList.forEach(path => {
      const parts = path.split('/').filter(Boolean);
      const fileName = parts.pop() || '';
      const dirPath = parts.length > 0 ? `/${parts.join('/')}` : '/';
      
      if (!tree[dirPath]) {
        tree[dirPath] = [];
        
        // Also ensure parent directories exist
        let parentPath = '/';
        for (const part of parts) {
          const currentPath = parentPath === '/' ? `/${part}` : `${parentPath}/${part}`;
          if (!tree[currentPath]) {
            tree[currentPath] = [];
            if (!tree[parentPath].includes(`${currentPath}/`)) {
              tree[parentPath].push(`${currentPath}/`);
            }
          }
          parentPath = currentPath;
        }
      }
      
      tree[dirPath].push(fileName);
    });
    
    return tree;
  };
  
  const fileTree = getFileTree();
  
  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    setFileContent(files[path] || '');
  };
  
  const renderDirectory = (dirPath: string, indent = 0) => {
    const items = fileTree[dirPath] || [];
    
    return (
      <div style={{ marginLeft: `${indent * 16}px` }}>
        {items.sort().map(item => {
          if (item.endsWith('/')) {
            // This is a directory
            const fullPath = item;
            const dirName = item.split('/').filter(Boolean).pop() || '';
            
            return (
              <div key={fullPath}>
                <div className="flex items-center py-1 cursor-pointer hover:bg-muted/30 px-2 rounded">
                  <i className="fas fa-folder text-yellow-400 mr-2"></i>
                  <span>{dirName}</span>
                </div>
                {renderDirectory(fullPath.slice(0, -1), indent + 1)}
              </div>
            );
          } else {
            // This is a file
            const fullPath = dirPath === '/' ? `/${item}` : `${dirPath}/${item}`;
            const fileExtension = item.split('.').pop() || '';
            
            return (
              <div 
                key={fullPath}
                className={`flex items-center py-1 cursor-pointer hover:bg-muted/30 px-2 rounded ${selectedFile === fullPath ? 'bg-primary/10' : ''}`}
                onClick={() => handleFileClick(fullPath)}
              >
                <i className={`fas fa-file text-${getFileIconColor(fileExtension)} mr-2`}></i>
                <span>{item}</span>
              </div>
            );
          }
        })}
      </div>
    );
  };
  
  const getFileIconColor = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'yellow-500';
      case 'css':
      case 'scss':
      case 'sass':
        return 'blue-500';
      case 'html':
        return 'orange-500';
      case 'json':
        return 'green-500';
      case 'md':
        return 'gray-500';
      default:
        return 'gray-400';
    }
  };
  
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-24 left-4 z-10 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-folder'}`}></i>
      </button>
      
      <div className={`fixed left-0 top-16 bottom-0 bg-card border-r border-border transition-all duration-300 z-10 ${isOpen ? 'w-64' : 'w-0 -translate-x-full'}`}>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-4">Project Files</h3>
          
          <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
            {Object.keys(files).length > 0 ? (
              renderDirectory('/')
            ) : (
              <p className="text-muted-foreground italic">No files yet</p>
            )}
          </div>
        </div>
      </div>
      
      {isOpen && selectedFile && (
        <div className="fixed right-0 top-16 bottom-0 bg-card border-l border-border w-1/2 z-10">
          <div className="flex items-center justify-between border-b border-border p-2">
            <div className="truncate font-mono text-sm">{selectedFile}</div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <pre className="p-4 overflow-auto h-[calc(100vh-4rem)]">
            <code className="font-mono text-sm whitespace-pre-wrap">
              {fileContent}
            </code>
          </pre>
        </div>
      )}
    </>
  );
}