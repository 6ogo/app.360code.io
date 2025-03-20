import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { projectStore } from '@/lib/stores/projectContext';
import Markdown from '@/components/chat/Markdown';

export function ProjectSummary() {
  const project = useStore(projectStore);
  const [isOpen, setIsOpen] = useState(false);
  
  if (project.status === 'idle') {
    return null;
  }
  
  const fileList = Object.keys(project.fileChanges);
  
  return (
    <div className={`fixed bottom-24 left-4 z-10 transition-all duration-300 ${isOpen ? 'w-96' : 'w-12'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 bottom-0 bg-primary text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg z-20"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-project-diagram'}`}></i>
      </button>
      
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2">{project.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
          
          <div className="mb-4">
            <h4 className="font-medium text-md mb-2">Project Files</h4>
            {fileList.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {fileList.map((file, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                    {file}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No files created yet</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-md mb-2">Progress</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: project.totalSteps 
                  ? `${Math.min(100, (project.currentStep / project.totalSteps) * 100)}%` 
                  : '0%' 
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step {project.currentStep} of {project.totalSteps || '?'}
            </p>
          </div>
          
          {project.lastContext && (
            <div className="mb-4">
              <h4 className="font-medium text-md mb-2">Last Update</h4>
              <div className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md max-h-32 overflow-y-auto">
                <Markdown content={project.lastContext.substring(0, 200) + '...'} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}