// components/optimization/OptimizationPanel.tsx
'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  optimizeProject, 
  OptimizationSettings,
  OptimizationResult
} from '@/lib/optimization/codeOptimizer';

interface OptimizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OptimizationPanel({ isOpen, onClose }: OptimizationPanelProps) {
  const [settings, setSettings] = useState<OptimizationSettings>({
    minifyJs: true,
    minifyCss: true,
    minifyHtml: true,
    compressImages: true,
    bundleJs: false,
    removeUnusedCss: false,
    treeshaking: false,
    lazyLoading: false
  });
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  
  const { showToast } = useToast();
  
  if (!isOpen) return null;
  
  const handleToggleSetting = (setting: keyof OptimizationSettings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };
  
  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    
    try {
      const result = await optimizeProject(settings);
      setOptimizationResult(result);
      
      if (result.changedFiles.length > 0) {
        showToast(`Optimized ${result.changedFiles.length} files with ${result.compressionRatio.toFixed(2)}% size reduction`, 'success');
      } else {
        showToast('No files were optimized', 'info');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      showToast(`Optimization error: ${(error as Error).message}`, 'error');
    } finally {
      setIsOptimizing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Optimize Project</h2>
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
            <p className="text-sm text-muted-foreground">
              Optimize your project by minifying code, removing unused CSS, and more.
              This can significantly reduce file sizes and improve loading times.
            </p>
            
            {/* Optimization options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Optimization Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="minify-js"
                      checked={settings.minifyJs}
                      onChange={() => handleToggleSetting('minifyJs')}
                      className="mr-2"
                    />
                    <label htmlFor="minify-js" className="text-sm">
                      Minify JavaScript
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="minify-css"
                      checked={settings.minifyCss}
                      onChange={() => handleToggleSetting('minifyCss')}
                      className="mr-2"
                    />
                    <label htmlFor="minify-css" className="text-sm">
                      Minify CSS
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="minify-html"
                      checked={settings.minifyHtml}
                      onChange={() => handleToggleSetting('minifyHtml')}
                      className="mr-2"
                    />
                    <label htmlFor="minify-html" className="text-sm">
                      Minify HTML
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="compress-images"
                      checked={settings.compressImages}
                      onChange={() => handleToggleSetting('compressImages')}
                      className="mr-2"
                    />
                    <label htmlFor="compress-images" className="text-sm">
                      Compress Images
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bundle-js"
                      checked={settings.bundleJs}
                      onChange={() => handleToggleSetting('bundleJs')}
                      className="mr-2"
                      disabled
                    />
                    <label htmlFor="bundle-js" className="text-sm opacity-50">
                      Bundle JavaScript (Coming soon)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remove-unused-css"
                      checked={settings.removeUnusedCss}
                      onChange={() => handleToggleSetting('removeUnusedCss')}
                      className="mr-2"
                      disabled
                    />
                    <label htmlFor="remove-unused-css" className="text-sm opacity-50">
                      Remove Unused CSS (Coming soon)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="treeshaking"
                      checked={settings.treeshaking}
                      onChange={() => handleToggleSetting('treeshaking')}
                      className="mr-2"
                      disabled
                    />
                    <label htmlFor="treeshaking" className="text-sm opacity-50">
                      Tree Shaking (Coming soon)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="lazy-loading"
                      checked={settings.lazyLoading}
                      onChange={() => handleToggleSetting('lazyLoading')}
                      className="mr-2"
                      disabled
                    />
                    <label htmlFor="lazy-loading" className="text-sm opacity-50">
                      Apply Lazy Loading (Coming soon)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Optimization result */}
            {optimizationResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Optimization Results</h3>
                  <div className="text-sm">
                    <span className="font-medium">Compression: </span>
                    <span className={optimizationResult.compressionRatio > 0 ? 'text-green-500' : 'text-gray-500'}>
                      {optimizationResult.compressionRatio.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-card/50 p-4 rounded-md border border-border">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Size Reduction</span>
                        <span>
                          {formatBytes(optimizationResult.originalSize - optimizationResult.optimizedSize)}
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full"
                          style={{ width: `${optimizationResult.compressionRatio}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Original Size:</span>{' '}
                        <span className="font-medium">{formatBytes(optimizationResult.originalSize)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Optimized Size:</span>{' '}
                        <span className="font-medium">{formatBytes(optimizationResult.optimizedSize)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Files Changed:</span>{' '}
                        <span className="font-medium">{optimizationResult.changedFiles.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {optimizationResult.changedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Modified Files:</h4>
                    <div className="max-h-32 overflow-y-auto p-2 bg-card/30 rounded-md border border-border/30 text-xs font-mono">
                      {optimizationResult.changedFiles.map((file, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Optimization Log:</h4>
                  <div className="max-h-32 overflow-y-auto p-2 bg-card/30 rounded-md border border-border/30 text-xs font-mono">
                    {optimizationResult.optimizationLog.map((log, index) => (
                      <div key={index} className="mb-1 last:mb-0">
                        {log}
                      </div>
                    ))}
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
            Close
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Format bytes helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
