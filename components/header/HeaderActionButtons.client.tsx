'use client';

import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useStore } from '@nanostores/react';
import { projectStore, initialProjectState } from '@/lib/stores/projectContext';
import { useToast } from '@/components/providers/ToastProvider';

export default function HeaderActionButtons() {
  const { signOut, user } = useSupabase();
  const project = useStore(projectStore);
  const { showToast } = useToast();
  
  const resetProject = () => {
    if (project.status !== 'idle') {
      const confirmReset = window.confirm('This will reset the current project and lose any unsaved progress. Are you sure?');
      
      if (confirmReset) {
        projectStore.set({
          ...initialProjectState,
          id: Date.now().toString(),
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
    if (Object.keys(project.fileChanges).length === 0) {
      showToast('No files to download', 'error');
      return;
    }
    
    // This is a simple implementation that would need to be enhanced
    // for actual file download functionality with proper zip creation
    const fileContent = JSON.stringify(project.fileChanges, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-files.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Project downloaded', 'success');
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
        <button
          onClick={downloadProject}
          className="icon-button"
          title="Download Project"
          aria-label="Download project files"
        >
          <i className="fas fa-download"></i>
        </button>
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