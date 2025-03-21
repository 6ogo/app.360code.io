import { workbenchStore } from '@/lib/stores/workbench';
import { projectStore } from '@/lib/stores/projectContext';

export interface FileStats {
  path: string;
  size: number;
  lines: number;
  type: string;
  lastModified: Date;
}

export interface ProjectStats {
  totalFiles: number;
  totalSize: number;
  totalLines: number;
  filesByType: Record<string, number>;
  sizeByType: Record<string, number>;
  largestFiles: FileStats[];
  mostComplexFiles: FileStats[];
  performance: {
    estimatedBundleSize: number;
    estimatedLoadTime: number;
    complexityScore: number;
    maintainabilityIndex: number;
  };
  dependencies: {
    name: string;
    version: string;
    size: number;
  }[];
  history: {
    date: Date;
    files: number;
    size: number;
  }[];
}

/**
 * Calculate project statistics
 */
export function calculateProjectStats(): ProjectStats {
  const files = workbenchStore.files.get();
  const project = projectStore.get();
  
  // File statistics
  const fileStats: FileStats[] = [];
  const filesByType: Record<string, number> = {};
  const sizeByType: Record<string, number> = {};
  let totalSize = 0;
  let totalLines = 0;
  
  // Process each file
  Object.entries(files).forEach(([path, content]) => {
    // Get file extension
    const extension = path.split('.').pop()?.toLowerCase() || 'unknown';
    const type = getFileType(extension);
    
    // Calculate size and lines
    const size = new TextEncoder().encode(content).length;
    const lines = content.split('\n').length;
    
    // Update totals
    totalSize += size;
    totalLines += lines;
    
    // Update type counts
    filesByType[type] = (filesByType[type] || 0) + 1;
    sizeByType[type] = (sizeByType[type] || 0) + size;
    
    // Add to file stats
    fileStats.push({
      path,
      size,
      lines,
      type,
      lastModified: new Date()
    });
  });
  
  // Sort files by size and complexity (using lines as a simple proxy for complexity)
  const largestFiles = [...fileStats].sort((a, b) => b.size - a.size).slice(0, 5);
  const mostComplexFiles = [...fileStats].sort((a, b) => b.lines - a.lines).slice(0, 5);
  
  // Detect dependencies from package.json
  const dependencies: { name: string; version: string; size: number }[] = [];
  const packageJsonPath = Object.keys(files).find(path => path.endsWith('package.json'));
  
  if (packageJsonPath) {
    try {
      const packageJson = JSON.parse(files[packageJsonPath]);
      
      if (packageJson.dependencies) {
        Object.entries(packageJson.dependencies).forEach(([name, version]) => {
          dependencies.push({
            name,
            version: version as string,
            size: Math.round(Math.random() * 1000000) // Placeholder size
          });
        });
      }
      
      if (packageJson.devDependencies) {
        Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
          dependencies.push({
            name,
            version: version as string,
            size: Math.round(Math.random() * 500000) // Placeholder size
          });
        });
      }
    } catch (error) {
      console.error('Error parsing package.json:', error);
    }
  }
  
  // Sort dependencies by size
  dependencies.sort((a, b) => b.size - a.size);
  
  // Calculate performance metrics (simplified estimates)
  const jsSize = sizeByType['javascript'] || 0;
  const cssSize = sizeByType['css'] || 0;
  const imageSize = sizeByType['image'] || 0;
  
  const estimatedBundleSize = jsSize + cssSize + Math.floor(imageSize * 0.7); // Assume 30% image compression
  const estimatedLoadTime = Math.floor(estimatedBundleSize / 50000); // Rough estimate: 50KB/s
  
  // Simulate history data
  const history = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate some growth over time
    const factor = 1 + (30 - i) / 30;
    history.push({
      date,
      files: Math.max(1, Math.floor(Object.keys(files).length / factor)),
      size: Math.floor(totalSize / factor)
    });
  }
  
  return {
    totalFiles: Object.keys(files).length,
    totalSize,
    totalLines,
    filesByType,
    sizeByType,
    largestFiles,
    mostComplexFiles,
    performance: {
      estimatedBundleSize,
      estimatedLoadTime,
      complexityScore: Math.floor(totalLines / Math.max(1, Object.keys(files).length)),
      maintainabilityIndex: Math.max(0, 100 - (totalLines / Math.max(1, Object.keys(files).length) / 10))
    },
    dependencies,
    history
  };
}

/**
 * Get file type from extension
 */
function getFileType(extension: string): string {
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'javascript';
    
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    
    case 'html':
    case 'htm':
      return 'html';
    
    case 'json':
      return 'json';
    
    case 'md':
    case 'markdown':
      return 'markdown';
    
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return 'image';
    
    case 'ttf':
    case 'woff':
    case 'woff2':
    case 'eot':
    case 'otf':
      return 'font';
    
    default:
      return 'other';
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}