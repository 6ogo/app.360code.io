// components/export/ExportPanel.tsx
'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  exportProject, 
  downloadExport,
  ExportTarget,
  ExportConfig,
  ExportResult
} from '@/lib/export/exportService';
import { projectStore } from '@/lib/stores/projectContext';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_OPTIONS: Array<{ id: ExportTarget; name: string; icon: string; description: string }> = [
  { 
    id: 'zip', 
    name: 'ZIP Archive', 
    icon: 'file-archive',
    description: 'Export as a ZIP file for local download'
  },
  { 
    id: 'github', 
    name: 'GitHub Repository', 
    icon: 'github',
    description: 'Push to a GitHub repository'
  },
  { 
    id: 'vercel', 
    name: 'Vercel', 
    icon: 'cloud',
    description: 'Deploy to Vercel hosting platform'
  },
  { 
    id: 'netlify', 
    name: 'Netlify', 
    icon: 'cloud-upload-alt',
    description: 'Deploy to Netlify hosting platform'
  },
  { 
    id: 'firebase', 
    name: 'Firebase', 
    icon: 'fire',
    description: 'Deploy to Firebase hosting'
  },
  { 
    id: 'aws', 
    name: 'AWS Amplify', 
    icon: 'aws',
    description: 'Deploy to AWS Amplify'
  },
  { 
    id: 'azure', 
    name: 'Azure Static Web Apps', 
    icon: 'cloud',
    description: 'Deploy to Azure Static Web Apps'
  }
];

export default function ExportPanel({ isOpen, onClose }: ExportPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget>('zip');
  const [isLoading, setIsLoading] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  
  // Export options
  const [includeDotEnv, setIncludeDotEnv] = useState(false);
  const [includeDocumentation, setIncludeDocumentation] = useState(true);
  const [includeNodeModules, setIncludeNodeModules] = useState(false);
  const [compressImages, setCompressImages] = useState(true);
  const [buildCommand, setBuildCommand] = useState('');
  const [deployCommand, setDeployCommand] = useState('');
  const [rootDirectory, setRootDirectory] = useState('');
  
  const { showToast } = useToast();
  const project = projectStore.get();
  
  if (!isOpen) return null;
  
  const handleExport = async () => {
    setIsLoading(true);
    setExportResult(null);
    
    try {
      // If GitHub is selected, open GitHub panel instead
      if (selectedTarget === 'github') {
        // Find and click the GitHub push button
        const githubBtn = document.querySelector('[title="Push to GitHub"]') as HTMLButtonElement;
        if (githubBtn) {
          githubBtn.click();
          onClose();
          return;
        } else {
          throw new Error('GitHub integration not found');
        }
      }
      
      // For other targets, proceed with export
      const config: ExportConfig = {
        target: selectedTarget,
        includeDotEnv,
        includeDocumentation,
        includeNodeModules,
        compressImages,
        buildCommand: buildCommand || undefined,
        deployCommand: deployCommand || undefined,
        rootDirectory: rootDirectory || undefined
      };
      
      const result = await exportProject(config);
      setExportResult(result);
      
      if (result.success) {
        showToast('Export successful!', 'success');
        
        // For zip exports, download the file automatically
        if (selectedTarget === 'zip' && result.data) {
          const fileName = `${project.title.toLowerCase().replace(/\s+/g, '-')}.zip`;
          downloadExport(result, fileName);
        }
      } else {
        showToast(`Export failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast(`Export error: ${(error as Error).message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadResult = () => {
    if (!exportResult?.success || !exportResult.data) {
      showToast('No valid export result to download', 'error');
      return;
    }
    
    try {
      const fileName = `${project.title.toLowerCase().replace(/\s+/g, '-')}-${selectedTarget}.zip`;
      downloadExport(exportResult, fileName);
      showToast('Export downloaded', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast(`Download error: ${(error as Error).message}`, 'error');
    }
  };
  
  const targetInfo = TARGET_OPTIONS.find(t => t.id === selectedTarget) || TARGET_OPTIONS[0];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Export Project</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Target selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Export Target</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TARGET_OPTIONS.map(target => (
                  <div
                    key={target.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTarget === target.id 
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setSelectedTarget(target.id)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="text-2xl mb-2">
                        <i className={`fab fa-${target.icon}`}></i>
                      </div>
                      <div className="font-medium text-sm">{target.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-card/50 p-4 rounded-md border border-border">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  <i className={`fab fa-${targetInfo.icon}`}></i>
                </div>
                <div>
                  <h3 className="font-medium">{targetInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {targetInfo.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Export options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Export Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="include-env"
                      checked={includeDotEnv}
                      onChange={(e) => setIncludeDotEnv(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="include-env" className="text-sm">
                      Include .env files
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="include-docs"
                      checked={includeDocumentation}
                      onChange={(e) => setIncludeDocumentation(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="include-docs" className="text-sm">
                      Include documentation
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="include-node-modules"
                      checked={includeNodeModules}
                      onChange={(e) => setIncludeNodeModules(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="include-node-modules" className="text-sm">
                      Include node_modules
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="compress-images"
                      checked={compressImages}
                      onChange={(e) => setCompressImages(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="compress-images" className="text-sm">
                      Compress images
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Root Directory</label>
                    <input
                      type="text"
                      value={rootDirectory}
                      onChange={(e) => setRootDirectory(e.target.value)}
                      placeholder="e.g., frontend"
                      className="w-full p-2 text-sm bg-card border border-border rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Build Command</label>
                    <input
                      type="text"
                      value={buildCommand}
                      onChange={(e) => setBuildCommand(e.target.value)}
                      placeholder="e.g., npm run build"
                      className="w-full p-2 text-sm bg-card border border-border rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Deploy Command</label>
                    <input
                      type="text"
                      value={deployCommand}
                      onChange={(e) => setDeployCommand(e.target.value)}
                      placeholder="e.g., npm run deploy"
                      className="w-full p-2 text-sm bg-card border border-border rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Result */}
            {exportResult && (
              <div className={`p-4 rounded-md ${
                exportResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    <i className={`fas fa-${exportResult.success ? 'check-circle' : 'exclamation-circle'}`}></i>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {exportResult.success ? 'Export Successful' : 'Export Failed'}
                    </h3>
                    <p className="text-sm">
                      {exportResult.message}
                    </p>
                    
                    {exportResult.success && exportResult.data && selectedTarget !== 'zip' && (
                      <button
                        onClick={downloadResult}
                        className="mt-2 px-3 py-1 bg-primary text-white text-sm rounded"
                      >
                        Download Export
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
            onClick={handleExport}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            {isLoading ? 'Exporting...' : 'Export Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
