import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { projectStore } from '@/lib/stores/projectContext';
import Markdown from '@/components/chat/Markdown';

export function DocumentationViewer() {
  const project = useStore(projectStore);
  const [isOpen, setIsOpen] = useState(false);
  
  if (project.documentation.length === 0) {
    return null;
  }
  
  return (
    <div className={`fixed top-16 right-4 z-10 transition-all duration-300 ${isOpen ? 'w-96' : 'w-12'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-0 top-0 bg-primary text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg z-20"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-book'}`}></i>
      </button>
      
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-4">Project Documentation</h3>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            {project.documentation.map((doc, index) => (
              <div key={index} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <Markdown content={doc} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}