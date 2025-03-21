'use client';

import React, { useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useStore } from '@nanostores/react';
import { projectStore, initialProjectState } from '@/lib/stores/projectContext';
import { useToast } from '@/components/providers/ToastProvider';
import GitHubButton from '@/components/github/GitHubButton';
import { workbenchStore } from '@/lib/stores/workbench';

export default function HeaderActionButtons() {
  const { signOut, user } = useSupabase();
  const project = useStore(projectStore);
  const { showToast } = useToast();
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  
  const resetProject = () => {
    if (project.status !== 'idle') {
      const confirmReset = window.confirm('This will reset the current project and lose any unsaved progress. Are you sure?');
      
      if (confirmReset) {
        projectStore.set({
          ...initialProjectState,
          id: Date.now().toString(),
        });
        
        // Clear workbench files
        const files = workbenchStore.files.get();
        Object.keys(files).forEach(path => {
          workbenchStore.deleteFile(path);
        });
        
        showToast('Project has been reset', 'info');
      }
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Successfully signed out', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out', 'error');
    }
  };
  
  const downloadProject = () => {
    const files = workbenchStore.files.get();
    if (Object.keys(files).length === 0) {
      showToast('No files to download', 'error');
      return;
    }
    
    // Create a zip file structure
    try {
      import('jszip').then(({ default: JSZip }) => {
        const zip = new JSZip();
        
        // Add all files to the zip
        Object.entries(files).forEach(([path, content]) => {
          // Remove leading slash
          const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
          zip.file(normalizedPath, content);
        });
        
        // Add a README with project info
        const readme = `# ${project.title}\n\n${project.description}\n\n## Generated with 360code.io\n`;
        zip.file('README.md', readme);
        
        // Add documentation if present
        if (project.documentation.length > 0) {
          zip.file('documentation.md', project.documentation.join('\n\n'));
        }
        
        // Generate the zip file
        zip.generateAsync({ type: 'blob' }).then(content => {
          // Create a download link
          const url = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-project.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          showToast('Project downloaded', 'success');
        });
      }).catch(err => {
        console.error('Error loading JSZip:', err);
        showToast('Failed to create zip file', 'error');
      });
    } catch (error) {
      console.error('Error downloading project:', error);
      showToast('Failed to download project', 'error');
    }
  };
  
  const toggleModelPicker = () => {
    setModelPickerOpen(!modelPickerOpen);
  };
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={resetProject}
        className="icon-button"
        title="New Project"
        aria-label="Start a new project"
      >
        <i className="fas fa-plus"></i>
      </button>
      
      {project.status !== 'idle' && (
        <>
          <button
            onClick={downloadProject}
            className="icon-button"
            title="Download Project"
            aria-label="Download project files"
          >
            <i className="fas fa-download"></i>
          </button>
          
          <GitHubButton type="push" />
          <GitHubButton type="pull" />
          
          <div className="relative">
            <button
              onClick={toggleModelPicker}
              className="icon-button relative"
              title="Select AI Model"
              aria-label="Select AI model"
            >
              <i className="fas fa-brain"></i>
              {modelPickerOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-card border border-border z-30">
                  <div className="rounded-md py-1">
                    <p className="px-4 py-2 text-sm font-semibold border-b border-border">Select AI Model</p>
                    <div className="max-h-60 overflow-y-auto py-1">
                      <button className="w-full px-4 py-2 text-sm text-left hover:bg-primary/10 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        Claude 3 Opus (Reasoning)
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left hover:bg-primary/10 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        Qwen Coder (Code)
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left hover:bg-primary/10 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                        Claude 3 Sonnet (Documentation)
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left hover:bg-primary/10 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        GPT-4 Turbo (Planning)
                      </button>
                    </div>
                    <div className="border-t border-border pt-1 pb-1 px-4">
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" />
                        Auto-select best model
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </button>
          </div>
        </>
      )}
      
      {user && (
        <button
          onClick={handleSignOut}
          className="icon-button"
          title="Sign Out"
          aria-label="Sign out of your account"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      )}
    </div>
  );
}