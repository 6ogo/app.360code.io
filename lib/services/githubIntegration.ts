// lib/services/githubIntegration.ts
import { workbenchStore } from '@/lib/stores/workbench';
import { projectStore } from '@/lib/stores/projectContext';
import { toast } from '@/components/ToastWrapper';

// GitHub API endpoints
const GITHUB_API_URL = 'https://api.github.com';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  description?: string;
  isPrivate?: boolean;
}

interface CommitFile {
  path: string;
  content: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
  type?: 'blob' | 'tree' | 'commit';
}

export class GitHubService {
  private token: string | null = null;

  constructor() {
    // Try to load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('github_token');
    }
  }

  /**
   * Set the GitHub token for authentication
   */
  setToken(token: string): void {
    this.token = token;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('github_token', token);
    }
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Clear the authentication token
   */
  logout(): void {
    this.token = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_token');
    }
  }

  /**
   * Make an authenticated request to the GitHub API
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const headers: HeadersInit = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    if (method !== 'GET' && data) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get the currently authenticated user's information
   */
  async getCurrentUser(): Promise<any> {
    return this.request('/user');
  }

  /**
   * Get a list of repositories for the authenticated user
   */
  async listRepositories(): Promise<any[]> {
    return this.request('/user/repos?sort=updated&direction=desc');
  }

  /**
   * Create a new repository
   */
  async createRepository(name: string, isPrivate: boolean = true, description?: string): Promise<any> {
    return this.request('/user/repos', 'POST', {
      name,
      description: description || `Created with 360code.io`,
      private: isPrivate,
      auto_init: true // Initialize with a README
    });
  }

  /**
   * Get the default branch for a repository
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const repository = await this.request(`/repos/${owner}/${repo}`);
    return repository.default_branch;
  }

  /**
   * Get the latest commit SHA for a branch
   */
  async getLatestCommitSha(owner: string, repo: string, branch: string): Promise<string> {
    const reference = await this.request(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    return reference.object.sha;
  }

  /**
   * Create or update multiple files in a repository
   */
  async commitFiles(
    config: GitHubConfig,
    files: CommitFile[],
    message: string
  ): Promise<any> {
    const { owner, repo } = config;
    const branch = config.branch || 'main';

    try {
      // Get the latest commit SHA
      const latestCommitSha = await this.getLatestCommitSha(owner, repo, branch);

      // Create a tree with all the files
      const tree = await this.request(`/repos/${owner}/${repo}/git/trees`, 'POST', {
        base_tree: latestCommitSha,
        tree: files.map(file => ({
          path: file.path,
          mode: file.mode || '100644', // Regular file
          type: file.type || 'blob',
          content: file.content
        }))
      });

      // Create a commit
      const commit = await this.request(`/repos/${owner}/${repo}/git/commits`, 'POST', {
        message,
        tree: tree.sha,
        parents: [latestCommitSha]
      });

      // Update the reference to point to the new commit
      return this.request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, 'PATCH', {
        sha: commit.sha,
        force: false
      });
    } catch (error) {
      console.error('Error committing files:', error);
      throw error;
    }
  }

  /**
   * Push the current project to GitHub
   */
  async pushProject(config: GitHubConfig): Promise<boolean> {
    try {
      const files = workbenchStore.files.get();
      const project = projectStore.get();
      
      // Check if we need to create the repository
      let repoExists = true;
      try {
        await this.request(`/repos/${config.owner}/${config.repo}`);
      } catch (error) {
        repoExists = false;
      }
      
      // Create repository if it doesn't exist
      if (!repoExists) {
        await this.createRepository(
          config.repo,
          config.isPrivate !== false,
          config.description || project.description || `Generated with 360code.io`
        );
        
        // Wait a moment for GitHub to initialize the repository
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Convert files to the format needed for GitHub API
      const commitFiles: CommitFile[] = Object.entries(files).map(([path, content]) => ({
        path: path.startsWith('/') ? path.slice(1) : path, // Remove leading slash if present
        content
      }));
      
      // Add README if it doesn't exist in our files
      if (!Object.keys(files).some(path => path.toLowerCase().includes('readme.md'))) {
        commitFiles.push({
          path: 'README.md',
          content: `# ${project.title || config.repo}\n\n${project.description || 'Generated with 360code.io'}\n`
        });
      }
      
      // Add documentation as project-docs.md
      if (project.documentation.length > 0) {
        commitFiles.push({
          path: 'project-docs.md',
          content: `# Project Documentation\n\n${project.documentation.join('\n\n')}`
        });
      }
      
      // Commit all files
      await this.commitFiles(
        config,
        commitFiles,
        `Update project via 360code.io`
      );
      
      return true;
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      toast.error('Failed to push to GitHub: ' + (error as Error).message);
      return false;
    }
  }
  
  /**
   * Pull a repository from GitHub
   */
  async pullRepository(
    owner: string,
    repo: string,
    branch?: string,
    path?: string
  ): Promise<boolean> {
    try {
      const actualBranch = branch || await this.getDefaultBranch(owner, repo);
      const basePath = path || '';
      
      // Get the tree recursively
      const treeSha = await this.getLatestCommitSha(owner, repo, actualBranch);
      const tree = await this.request(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`);
      
      // Filter to just get the blobs (files)
      const filePromises = tree.tree
        .filter((item: any) => item.type === 'blob')
        .filter((item: any) => !basePath || item.path.startsWith(basePath))
        .map(async (item: any) => {
          // Skip large files (GitHub returns the content as a separate request for files > 1MB)
          if (item.size > 1000000) {
            return null;
          }
          
          try {
            // Get the file content
            const content = await this.request(`/repos/${owner}/${repo}/contents/${item.path}?ref=${actualBranch}`);
            
            // GitHub returns content as base64
            const decodedContent = atob(content.content);
            
            // Remove the base path if present
            const relativePath = basePath ? item.path.slice(basePath.length) : item.path;
            const fullPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
            
            return { path: fullPath, content: decodedContent };
          } catch (error) {
            console.warn(`Failed to fetch content for ${item.path}:`, error);
            return null;
          }
        });
      
      const files = (await Promise.all(filePromises)).filter(Boolean) as { path: string, content: string }[];
      
      // Add all files to the workbench
      let filesAdded = 0;
      for (const file of files) {
        workbenchStore.addFile(file.path, file.content);
        filesAdded++;
      }
      
      // Update project info
      const project = projectStore.get();
      projectStore.set({
        ...project,
        title: repo,
        description: `Imported from GitHub: ${owner}/${repo}`,
        status: 'paused',
        currentStep: project.currentStep + 1
      });
      
      toast.success(`Successfully imported ${filesAdded} files from GitHub`);
      return true;
    } catch (error) {
      console.error('Error pulling from GitHub:', error);
      toast.error('Failed to pull from GitHub: ' + (error as Error).message);
      return false;
    }
  }
}

// Singleton instance
export const githubService = new GitHubService();