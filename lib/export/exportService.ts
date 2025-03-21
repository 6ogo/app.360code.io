// lib/export/exportService.ts
import { workbenchStore } from '@/lib/stores/workbench';
import { projectStore } from '@/lib/stores/projectContext';
import JSZip from 'jszip';

export type ExportTarget = 'zip' | 'github' | 'vercel' | 'netlify' | 'firebase' | 'aws' | 'azure';

export interface ExportConfig {
  target: ExportTarget;
  includeNodeModules?: boolean;
  includeDotEnv?: boolean;
  includeDocumentation?: boolean;
  compressImages?: boolean;
  buildCommand?: string;
  deployCommand?: string;
  rootDirectory?: string;
  customSettings?: Record<string, string>;
}

export interface ExportResult {
  success: boolean;
  data?: any;
  message?: string;
  url?: string;
}

/**
 * Generate a zip file for the project
 */
export async function exportToZip(config: ExportConfig): Promise<ExportResult> {
  try {
    const files = workbenchStore.files.get();
    const project = projectStore.get();
    const zip = new JSZip();
    
    // Add all project files
    Object.entries(files).forEach(([path, content]) => {
      // Skip node_modules if not included
      if (!config.includeNodeModules && path.includes('node_modules/')) {
        return;
      }
      
      // Skip .env files if not included
      if (!config.includeDotEnv && (path.includes('.env') || path.includes('env.local'))) {
        return;
      }
      
      // Normalize path (remove leading slash)
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      
      // Add file to zip
      zip.file(normalizedPath, content);
    });
    
    // Add documentation if requested
    if (config.includeDocumentation && project.documentation.length > 0) {
      const docs = project.documentation.join('\n\n---\n\n');
      zip.file('documentation.md', `# ${project.title} Documentation\n\n${docs}`);
    }
    
    // Add README if it doesn't exist
    if (!Object.keys(files).some(path => path.toLowerCase().includes('readme.md'))) {
      const readme = `# ${project.title}\n\n${project.description}\n\nGenerated with 360code.io\n`;
      zip.file('README.md', readme);
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return {
      success: true,
      data: zipBlob,
      message: 'Project exported successfully'
    };
  } catch (error) {
    console.error('Error exporting to zip:', error);
    return {
      success: false,
      message: 'Failed to export project: ' + (error as Error).message
    };
  }
}

/**
 * Generate a deployment package for Vercel
 */
export async function exportToVercel(config: ExportConfig): Promise<ExportResult> {
  try {
    const files = workbenchStore.files.get();
    const project = projectStore.get();
    const zip = new JSZip();
    
    // Add all project files
    Object.entries(files).forEach(([path, content]) => {
      // Skip node_modules
      if (path.includes('node_modules/')) {
        return;
      }
      
      // Normalize path
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      zip.file(normalizedPath, content);
    });
    
    // Add or update vercel.json if it doesn't exist
    if (!Object.keys(files).some(path => path.toLowerCase().includes('vercel.json'))) {
      // Detect framework and create appropriate vercel.json
      const hasPackageJson = Object.keys(files).some(path => path.toLowerCase().includes('package.json'));
      const hasNextConfig = Object.keys(files).some(path => path.toLowerCase().includes('next.config'));
      const hasViteConfig = Object.keys(files).some(path => path.toLowerCase().includes('vite.config'));
      
      let framework = 'node';
      let buildCommand = 'npm run build';
      let outputDirectory = 'dist';
      
      if (hasNextConfig) {
        framework = 'nextjs';
        outputDirectory = '.next';
      } else if (hasViteConfig) {
        framework = 'vite';
      }
      
      // Framework-specific settings
      if (config.customSettings?.framework) {
        framework = config.customSettings.framework;
      }
      
      if (config.buildCommand) {
        buildCommand = config.buildCommand;
      }
      
      if (config.rootDirectory) {
        // Adjust for root directory
        buildCommand = `cd ${config.rootDirectory} && ${buildCommand}`;
      }
      
      const vercelConfig = {
        name: project.title.toLowerCase().replace(/\s+/g, '-'),
        framework,
        buildCommand,
        installCommand: 'npm install',
        outputDirectory: config.rootDirectory 
          ? `${config.rootDirectory}/${outputDirectory}`
          : outputDirectory,
        env: {}
      };
      
      zip.file('vercel.json', JSON.stringify(vercelConfig, null, 2));
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return {
      success: true,
      data: zipBlob,
      message: 'Project exported for Vercel deployment'
    };
  } catch (error) {
    console.error('Error exporting for Vercel:', error);
    return {
      success: false,
      message: 'Failed to export project: ' + (error as Error).message
    };
  }
}

/**
 * Generate a deployment package for Netlify
 */
export async function exportToNetlify(config: ExportConfig): Promise<ExportResult> {
  try {
    const files = workbenchStore.files.get();
    const project = projectStore.get();
    const zip = new JSZip();
    
    // Add all project files
    Object.entries(files).forEach(([path, content]) => {
      // Skip node_modules
      if (path.includes('node_modules/')) {
        return;
      }
      
      // Normalize path
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      zip.file(normalizedPath, content);
    });
    
    // Add or update netlify.toml if it doesn't exist
    if (!Object.keys(files).some(path => path.toLowerCase().includes('netlify.toml'))) {
      // Detect build command and publish directory
      let buildCommand = 'npm run build';
      let publishDirectory = 'dist';
      
      const hasNextConfig = Object.keys(files).some(path => path.toLowerCase().includes('next.config'));
      const hasViteConfig = Object.keys(files).some(path => path.toLowerCase().includes('vite.config'));
      
      if (hasNextConfig) {
        publishDirectory = 'out';
        buildCommand = 'npm run build && npm run export';
      } else if (hasViteConfig) {
        publishDirectory = 'dist';
      }
      
      if (config.buildCommand) {
        buildCommand = config.buildCommand;
      }
      
      if (config.rootDirectory) {
        // Adjust for root directory
        buildCommand = `cd ${config.rootDirectory} && ${buildCommand}`;
        publishDirectory = `${config.rootDirectory}/${publishDirectory}`;
      }
      
      const netlifyConfig = `[build]
  command = "${buildCommand}"
  publish = "${publishDirectory}"
  
[build.environment]
  NODE_VERSION = "18"

[dev]
  command = "npm run dev"
  targetPort = 3000
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
      
      zip.file('netlify.toml', netlifyConfig);
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return {
      success: true,
      data: zipBlob,
      message: 'Project exported for Netlify deployment'
    };
  } catch (error) {
    console.error('Error exporting for Netlify:', error);
    return {
      success: false,
      message: 'Failed to export project: ' + (error as Error).message
    };
  }
}

/**
 * Generate a deployment package for Firebase
 */
export async function exportToFirebase(config: ExportConfig): Promise<ExportResult> {
  try {
    const files = workbenchStore.files.get();
    const project = projectStore.get();
    const zip = new JSZip();
    
    // Add all project files
    Object.entries(files).forEach(([path, content]) => {
      // Skip node_modules
      if (path.includes('node_modules/')) {
        return;
      }
      
      // Normalize path
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      zip.file(normalizedPath, content);
    });
    
    // Add or update firebase.json if it doesn't exist
    if (!Object.keys(files).some(path => path.toLowerCase().includes('firebase.json'))) {
      // Detect build and publish configuration
      let buildCommand = 'npm run build';
      let publicDirectory = 'dist';
      
      const hasNextConfig = Object.keys(files).some(path => path.toLowerCase().includes('next.config'));
      const hasViteConfig = Object.keys(files).some(path => path.toLowerCase().includes('vite.config'));
      
      if (hasNextConfig) {
        publicDirectory = 'out';
        buildCommand = 'npm run build && npm run export';
      } else if (hasViteConfig) {
        publicDirectory = 'dist';
      }
      
      if (config.buildCommand) {
        buildCommand = config.buildCommand;
      }
      
      if (config.rootDirectory) {
        publicDirectory = `${config.rootDirectory}/${publicDirectory}`;
      }
      
      const firebaseConfig = {
        hosting: {
          public: publicDirectory,
          ignore: [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
          ],
          rewrites: [
            {
              source: "**",
              destination: "/index.html"
            }
          ]
        }
      };
      
      zip.file('firebase.json', JSON.stringify(firebaseConfig, null, 2));
      
      // Also add .firebaserc
      const firebaserc = {
        projects: {
          default: project.title.toLowerCase().replace(/\s+/g, '-')
        }
      };
      
      zip.file('.firebaserc', JSON.stringify(firebaserc, null, 2));
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return {
      success: true,
      data: zipBlob,
      message: 'Project exported for Firebase deployment'
    };
  } catch (error) {
    console.error('Error exporting for Firebase:', error);
    return {
      success: false,
      message: 'Failed to export project: ' + (error as Error).message
    };
  }
}

/**
 * Export project to the specified target
 */
export async function exportProject(config: ExportConfig): Promise<ExportResult> {
  switch (config.target) {
    case 'zip':
      return exportToZip(config);
    case 'vercel':
      return exportToVercel(config);
    case 'netlify':
      return exportToNetlify(config);
    case 'firebase':
      return exportToFirebase(config);
    case 'github':
      // GitHub export is handled by the GitHub integration
      throw new Error('GitHub export is handled separately');
    default:
      throw new Error(`Export target '${config.target}' not supported`);
  }
}

/**
 * Download the export result as a file
 */
export function downloadExport(result: ExportResult, fileName: string): void {
  if (!result.success || !result.data) {
    throw new Error('Cannot download: Export was not successful');
  }
  
  const blob = result.data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}