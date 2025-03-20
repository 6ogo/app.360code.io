// components/ProjectStatus.tsx
'use client';

import { useStore } from '@nanostores/react';
import { projectStore } from '@/lib/stores/projectContext';

export function ProjectStatus() {
  const project = useStore(projectStore);
  
  if (project.status === 'idle') {
    return null;
  }
  
  return (
    <div className="fixed top-16 right-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-4 w-64">
      <h3 className="font-bold text-lg mb-2">{project.title}</h3>
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {project.currentStep} / {project.totalSteps || '?'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: project.totalSteps 
              ? `${Math.min(100, (project.currentStep / project.totalSteps) * 100)}%` 
              : '0%' 
            }}
          ></div>
        </div>
      </div>
      <div className="flex items-center">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
          {formatStatus(project.status)}
        </span>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'generating':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    case 'complete':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  }
}

function formatStatus(status: string) {
  switch (status) {
    case 'generating':
      return 'Generating';
    case 'paused':
      return 'Paused';
    case 'complete':
      return 'Complete';
    default:
      return 'Idle';
  }
}