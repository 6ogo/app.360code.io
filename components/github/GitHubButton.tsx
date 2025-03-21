'use client';

import React, { useState } from 'react';
import GitHubModal from './GitHubModal';

interface GitHubButtonProps {
  type: 'push' | 'pull';
}

export default function GitHubButton({ type }: GitHubButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="icon-button"
        title={type === 'push' ? 'Push to GitHub' : 'Pull from GitHub'}
      >
        <i className={`fab fa-github`}></i>
        <i className={`fas fa-${type === 'push' ? 'upload' : 'download'} text-xs absolute bottom-0 right-0 bg-primary text-white rounded-full w-3 h-3 flex items-center justify-center`}></i>
      </button>
      
      <GitHubModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={type}
      />
    </>
  );
}