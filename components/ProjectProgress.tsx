'use client';

import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { projectStore } from '@/lib/stores/projectContext';
import { classNames } from './utils/classNames';

export default function ProjectProgress() {
  const project = useStore(projectStore);
  const [expanded, setExpanded] = useState(false);
  
  if (project.status === 'idle') {
    return null;
  }
  
  const steps = [];
  
  if (project.totalSteps) {
    for (let i = 1; i <= project.totalSteps; i++) {
      steps.push({
        id: i,
        name: `Step ${i}`,
        status: i < project.currentStep ? 'complete' : 
                i === project.currentStep ? 'current' : 'upcoming'
      });
    }
  } else {
    // If we don't know total steps yet, show at least 5 steps
    for (let i = 1; i <= Math.max(5, project.currentStep); i++) {
      steps.push({
        id: i,
        name: `Step ${i}`,
        status: i < project.currentStep ? 'complete' : 
                i === project.currentStep ? 'current' : 'upcoming'
      });
    }
  }
  
  return (
    <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300 ${expanded ? 'w-3/4' : 'w-64'}`}>
      <div className="bg-card border border-border rounded-lg shadow-lg mt-4 overflow-hidden">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/20"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <div 
              className={classNames(
                "h-2.5 w-2.5 flex-shrink-0 rounded-full mr-2",
                project.status === 'generating' ? "bg-blue-500 animate-pulse" : 
                project.status === 'paused' ? "bg-yellow-500" : 
                "bg-green-500"
              )}
              aria-hidden="true"
            />
            <h3 className="text-sm font-medium">
              {project.title} - {formatStatus(project.status)}
            </h3>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          </button>
        </div>
        
        {expanded && (
          <div className="px-4 pb-4">
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>
                  {project.currentStep} / {project.totalSteps || '?'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: project.totalSteps 
                    ? `${Math.min(100, (project.currentStep / project.totalSteps) * 100)}%` 
                    : `${Math.min(100, (project.currentStep / 5) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Steps</h4>
              <nav aria-label="Progress" className="overflow-x-auto pb-2">
                <ol role="list" className="flex space-x-2">
                  {steps.map((step) => (
                    <li key={step.id} className="flex items-center">
                      {step.status === 'complete' ? (
                        <div className="bg-primary text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                          <i className="fas fa-check text-xs"></i>
                        </div>
                      ) : step.status === 'current' ? (
                        <div className="bg-primary/20 border-2 border-primary text-primary rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                          <span className="text-xs">{step.id}</span>
                        </div>
                      ) : (
                        <div className="bg-muted text-muted-foreground rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                          <span className="text-xs">{step.id}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            
            {project.status === 'paused' && (
              <div className="mt-3 flex justify-end">
                <button 
                  className="px-3 py-1 bg-primary text-white text-xs rounded-md hover:bg-primary-hover transition-colors"
                  onClick={() => {
                    // Simulate clicking the "Continue Project" button
                    const continueBtn = document.querySelector('.fixed.bottom-24.right-4.z-10') as HTMLButtonElement;
                    if (continueBtn) continueBtn.click();
                  }}
                >
                  Continue Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
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