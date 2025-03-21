'use client';

import React, { useState, useEffect } from 'react';
import { githubService, GitHubConfig } from '@/lib/services/githubIntegration';
import { useToast } from '@/components/providers/ToastProvider';
import { projectStore } from '@/lib/stores/projectContext';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'push' | 'pull';
}

export default function GitHubModal({ isOpen, onClose, mode }: GitHubModalProps) {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [branch, setBranch] = useState('main');
  
  const [step, setStep] = useState<'auth' | 'configure' | 'processing'>('auth');
  
  const { showToast } = useToast();
  const project = projectStore.get();
  
  // Check if already authenticated
  useEffect(() => {
    if (githubService.isAuthenticated()) {
      setIsAuthenticated(true);
      setStep('configure');
      loadUserData();
    }
    
    if (mode === 'push' && project.title) {
      setRepo(project.title.toLowerCase().replace(/\s+/g, '-'));
      setDescription(project.description);
    }
  }, [isOpen, mode, project.title, project.description]);
  
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await githubService.getCurrentUser();
      setUser(userData);
      setOwner(userData.login);
      
      if (mode === 'pull') {
        const repositories = await githubService.listRepositories();
        setRepos(repositories);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load GitHub data', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAuthenticate = async () => {
    try {
      setIsLoading(true);
      githubService.setToken(token);
      await loadUserData();
      setIsAuthenticated(true);
      setStep('configure');
      showToast('Successfully authenticated with GitHub', 'success');
    } catch (error) {
      console.error('Authentication error:', error);
      showToast('Invalid GitHub token', 'error');
      githubService.logout();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePush = async () => {
    if (!owner || !repo) {
      showToast('Repository details are required', 'error');
      return;
    }
    
    try {
      setStep('processing');
      setIsLoading(true);
      
      const config: GitHubConfig = {
        owner,
        repo,
        branch,
        description,
        isPrivate
      };
      
      const success = await githubService.pushProject(config);
      
      if (success) {
        showToast('Successfully pushed to GitHub', 'success');
        onClose();
      }
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      showToast('Failed to push to GitHub', 'error');
    } finally {
      setIsLoading(false);
      setStep('configure');
    }
  };
  
  const handlePull = async () => {
    if (!owner || !repo) {
      showToast('Repository details are required', 'error');
      return;
    }
    
    try {
      setStep('processing');
      setIsLoading(true);
      
      const success = await githubService.pullRepository(owner, repo, branch);
      
      if (success) {
        showToast('Successfully pulled from GitHub', 'success');
        onClose();
      }
    } catch (error) {
      console.error('Error pulling from GitHub:', error);
      showToast('Failed to pull from GitHub', 'error');
    } finally {
      setIsLoading(false);
      setStep('configure');
    }
  };
  
  const handleRepoSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRepo = repos.find(r => r.name === event.target.value);
    if (selectedRepo) {
      setRepo(selectedRepo.name);
      setBranch(selectedRepo.default_branch);
    }
  };
  
  const handleLogout = () => {
    githubService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRepos([]);
    setStep('auth');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">
            {mode === 'push' ? 'Push to GitHub' : 'Pull from GitHub'}
          </h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 'auth' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your GitHub personal access token. This token needs 'repo' permissions.
              </p>
              
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-2 bg-card border border-border rounded-md"
                placeholder="ghp_your_personal_access_token"
              />
              
              <div className="pt-2">
                <button
                  onClick={handleAuthenticate}
                  disabled={!token || isLoading}
                  className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </div>
              
              <div className="text-xs text-muted-foreground pt-4">
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Generate a new token
                </a>
              </div>
            </div>
          )}
          
          {step === 'configure' && isAuthenticated && (
            <div className="space-y-4">
              {user && (
                <div className="flex items-center space-x-2 mb-4">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{user.name || user.login}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.login} 
                      <button
                        onClick={handleLogout}
                        className="ml-2 text-primary hover:underline"
                      >
                        (Logout)
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'push' ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Owner/Organization</label>
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded-md"
                      placeholder="GitHub username or organization"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Repository Name</label>
                    <input
                      type="text"
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded-md"
                      placeholder="Repository name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded-md"
                      placeholder="Repository description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Branch</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded-md"
                      placeholder="Branch (e.g. main)"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="isPrivate" className="text-sm">
                      Private repository
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handlePush}
                      disabled={!owner || !repo || isLoading}
                      className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover disabled:opacity-50"
                    >
                      {isLoading ? 'Pushing...' : 'Push to GitHub'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Repository</label>
                    {repos.length > 0 ? (
                      <select
                        value={repo}
                        onChange={handleRepoSelect}
                        className="w-full p-2 bg-card border border-border rounded-md"
                      >
                        <option value="">Select a repository</option>
                        {repos.map((repository) => (
                          <option key={repository.id} value={repository.name}>
                            {repository.full_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={owner}
                          onChange={(e) => setOwner(e.target.value)}
                          className="flex-1 p-2 bg-card border border-border rounded-md"
                          placeholder="Owner"
                        />
                        <span className="self-center">/</span>
                        <input
                          type="text"
                          value={repo}
                          onChange={(e) => setRepo(e.target.value)}
                          className="flex-1 p-2 bg-card border border-border rounded-md"
                          placeholder="Repository"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Branch</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full p-2 bg-card border border-border rounded-md"
                      placeholder="Branch (e.g. main)"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handlePull}
                      disabled={!owner || !repo || isLoading}
                      className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover disabled:opacity-50"
                    >
                      {isLoading ? 'Pulling...' : 'Pull from GitHub'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {step === 'processing' && (
            <div className="py-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {mode === 'push' ? 'Pushing to GitHub...' : 'Pulling from GitHub...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}