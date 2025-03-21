// components/DesktopGamePanel.tsx
'use client';

import React, { useState } from 'react';
import VideoContextUploader from '../lib/video/VideoContextUploader';
import { VideoAnalysisResult } from '@/lib/video/contextProcessor';
import { projectStore } from '@/lib/stores/projectContext';
import { useToast } from '@/components/providers/ToastProvider';

interface DesktopGamePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Available frameworks for desktop/game development
const frameworks = [
  { id: 'electron', name: 'Electron', icon: 'atom', type: 'desktop' },
  { id: 'tauri', name: 'Tauri', icon: 'rust', type: 'desktop' },
  { id: 'flutter', name: 'Flutter', icon: 'mobile-alt', type: 'desktop' },
  { id: 'unity', name: 'Unity (C#)', icon: 'gamepad', type: 'game' },
  { id: 'godot', name: 'Godot', icon: 'cube', type: 'game' },
  { id: 'phaser', name: 'Phaser', icon: 'js', type: 'game' },
  { id: 'unreal', name: 'Unreal Engine', icon: 'code', type: 'game' },
  { id: 'pygame', name: 'PyGame', icon: 'python', type: 'game' }
];

export default function DesktopGamePanel({ isOpen, onClose }: DesktopGamePanelProps) {
  const [tab, setTab] = useState<'desktop' | 'game'>('desktop');
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { showToast } = useToast();
  
  if (!isOpen) return null;
  
  const handleAnalysisComplete = (result: VideoAnalysisResult) => {
    setVideoAnalysis(result);
  };
  
  const handleCreateProject = () => {
    if (!selectedFramework) {
      showToast('Please select a framework', 'error');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Find selected framework
      const framework = frameworks.find(f => f.id === selectedFramework);
      
      // Update project context
      const project = projectStore.get();
      const frameworkName = framework?.name || selectedFramework;
      const appType = framework?.type === 'game' ? 'game' : 'desktop application';
      
      const projectTitle = `${frameworkName} ${appType}`;
      const projectDescription = description || 
        `A ${appType} built with ${frameworkName}${videoAnalysis ? '. Created from video reference.' : ''}`;
      
      // Add video analysis to documentation if available
      let documentation = [];
      if (videoAnalysis) {
        documentation.push(`## Video Analysis\n${videoAnalysis.summary}`);
      }
      
      projectStore.set({
        ...project,
        id: Date.now().toString(),
        title: projectTitle,
        description: projectDescription,
        status: 'generating',
        currentStep: 1,
        totalSteps: 10,
        documentation,
        lastContext: `Starting a new ${projectTitle} project: ${projectDescription}`
      });
      
      showToast(`Creating ${projectTitle} project`, 'success');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project', 'error');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Desktop & Game Development</h2>
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
            className={`px-4 py-2 font-medium ${tab === 'desktop' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('desktop')}
          >
            Desktop Apps
          </button>
          <button
            className={`px-4 py-2 font-medium ${tab === 'game' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('game')}
          >
            Game Development
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              Upload a Video Reference (Optional)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a video showing the app or game you want to create. Our AI will analyze the UI elements and features to better understand your requirements.
            </p>
            <VideoContextUploader onAnalysisComplete={handleAnalysisComplete} />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              Select a Framework
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {frameworks
                .filter(framework => framework.type === tab)
                .map(framework => (
                  <div
                    key={framework.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedFramework === framework.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-card/80'
                    }`}
                    onClick={() => setSelectedFramework(framework.id)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 flex items-center justify-center text-2xl mb-2">
                        <i className={`fab fa-${framework.icon}`}></i>
                      </div>
                      <div className="font-medium">{framework.name}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              Project Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-card border border-border rounded-lg resize-y"
              placeholder="Describe your application or game. Include features, appearance, and any specific requirements."
              rows={4}
            />
          </div>
          
          {videoAnalysis && (
            <div className="mb-6 p-4 bg-muted/20 border border-border rounded-lg">
              <h3 className="text-lg font-medium mb-2">
                Video Analysis Summary
              </h3>
              <p className="text-sm">
                {videoAnalysis.summary}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            disabled={!selectedFramework || isCreating}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}