// lib/optimization/codeOptimizer.ts
import { workbenchStore } from '@/lib/stores/workbench';

export interface OptimizationSettings {
  minifyJs: boolean;
  minifyCss: boolean;
  minifyHtml: boolean;
  compressImages: boolean;
  bundleJs: boolean;
  removeUnusedCss: boolean;
  treeshaking: boolean;
  lazyLoading: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  changedFiles: string[];
  optimizationLog: string[];
}

/**
 * Minify JavaScript code
 */
function minifyJavaScript(code: string): string {
  try {
    // This is a very simple implementation
    // In a real app, use a proper minifier like Terser
    
    // Remove comments
    code = code.replace(/\/\/.*$/gm, '');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove whitespace
    code = code.replace(/\s+/g, ' ');
    
    // Remove whitespace around operators
    code = code.replace(/\s*([+\-*/%=<>!&|{}():;,])\s*/g, '$1');
    
    // Remove leading/trailing whitespace
    code = code.trim();
    
    return code;
  } catch (error) {
    console.error('Error minifying JavaScript:', error);
    return code;
  }
}

/**
 * Minify CSS code
 */
function minifyCSS(css: string): string {
  try {
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove whitespace
    css = css.replace(/\s+/g, ' ');
    
    // Remove whitespace around selectors and declarations
    css = css.replace(/\s*({|}|;|:|,)\s*/g, '$1');
    
    // Remove leading/trailing whitespace
    css = css.trim();
    
    return css;
  } catch (error) {
    console.error('Error minifying CSS:', error);
    return css;
  }
}

/**
 * Minify HTML code
 */
function minifyHTML(html: string): string {
  try {
    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove whitespace between tags
    html = html.replace(/>\s+</g, '><');
    
    // Remove unnecessary whitespace
    html = html.replace(/\s+/g, ' ');
    
    // Remove leading/trailing whitespace
    html = html.trim();
    
    return html;
  } catch (error) {
    console.error('Error minifying HTML:', error);
    return html;
  }
}

/**
 * Optimize code based on file type and settings
 */
function optimizeFile(path: string, content: string, settings: OptimizationSettings): string {
  const extension = path.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return settings.minifyJs ? minifyJavaScript(content) : content;
    
    case 'css':
    case 'scss':
    case 'sass':
      return settings.minifyCss ? minifyCSS(content) : content;
    
    case 'html':
    case 'htm':
      return settings.minifyHtml ? minifyHTML(content) : content;
    
    default:
      return content;
  }
}

/**
 * Calculate file size in bytes
 */
function calculateSize(content: string): number {
  return new TextEncoder().encode(content).length;
}

/**
 * Optimize all code files in the project
 */
export async function optimizeProject(settings: OptimizationSettings): Promise<OptimizationResult> {
  const files = workbenchStore.files.get();
  let originalSize = 0;
  let optimizedSize = 0;
  const changedFiles: string[] = [];
  const log: string[] = [];
  
  for (const [path, content] of Object.entries(files)) {
    // Skip node_modules and other large directories
    if (path.includes('node_modules/') || path.includes('.git/')) {
      continue;
    }
    
    // Calculate original size
    const originalFileSize = calculateSize(content);
    originalSize += originalFileSize;
    
    // Optimize file
    const optimizedContent = optimizeFile(path, content, settings);
    
    // Calculate optimized size
    const optimizedFileSize = calculateSize(optimizedContent);
    optimizedSize += optimizedFileSize;
    
    // If file was changed, update it
    if (content !== optimizedContent) {
      workbenchStore.updateFile(path, optimizedContent);
      changedFiles.push(path);
      
      const savings = originalFileSize - optimizedFileSize;
      const savingsPercentage = (savings / originalFileSize) * 100;
      
      log.push(`Optimized ${path}: ${formatBytes(savings)} saved (${savingsPercentage.toFixed(2)}%)`);
    }
  }
  
  const compressionRatio = originalSize > 0 ? (1 - (optimizedSize / originalSize)) * 100 : 0;
  
  log.push(`Total size reduction: ${formatBytes(originalSize - optimizedSize)} (${compressionRatio.toFixed(2)}%)`);
  log.push(`Original size: ${formatBytes(originalSize)}`);
  log.push(`Optimized size: ${formatBytes(optimizedSize)}`);
  
  return {
    originalSize,
    optimizedSize,
    compressionRatio,
    changedFiles,
    optimizationLog: log
  };
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}