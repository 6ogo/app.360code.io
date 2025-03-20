import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { ClientOnly } from '@/components/utils/ClientOnly';
import { chatStore } from '@/lib/stores/chat';
import { projectStore } from '@/lib/stores/projectContext';
import { classNames } from '../utils/classNames';
import HeaderActionButtons from './HeaderActionButtons.client';
import Image from 'next/image';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chat = useStore(chatStore);
  const project = useStore(projectStore);
  const { user } = useSupabase();
  
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image 
                src="/logo.svg" 
                alt="360code.io Logo" 
                width={32} 
                height={32}
                className="transition-transform duration-300 hover:scale-110"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight hidden sm:inline-block">
              360code.io
            </span>
          </Link>
          
          {project.status !== 'idle' && (
            <div className={classNames(
              "hidden md:flex items-center px-3 py-1 rounded-full text-sm",
              project.status === 'generating' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
              project.status === 'paused' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            )}>
              <span className="w-2 h-2 rounded-full mr-2 animate-pulse"
                style={{
                  backgroundColor: project.status === 'generating' ? '#3b82f6' :
                                project.status === 'paused' ? '#f59e0b' : '#10b981'
                }}
              ></span>
              {project.status === 'generating' ? 'Generating' : 
               project.status === 'paused' ? 'Paused' : 'Complete'}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <ClientOnly>
            {() => <HeaderActionButtons />}
          </ClientOnly>
          
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="hidden md:block">
                <div className="text-sm font-medium">
                  {user.email?.split('@')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.email}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
            </div>
          ) : (
            <Link href="/auth" className="text-sm font-medium text-primary hover:underline">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}