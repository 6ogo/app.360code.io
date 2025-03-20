// components/ClientComponents.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the components with SSR disabled
const Chat = dynamic(() => import('@/components/chat/Chat.client'), {
  ssr: false,
});

const FileExplorer = dynamic(() => import('@/components/FileExplorer'), {
  ssr: false,
});

const ProjectProgress = dynamic(() => import('@/components/ProjectProgress'), {
  ssr: false,
});

export function ClientComponents() {
  return (
    <>
      <Chat />
      <FileExplorer />
      <ProjectProgress />
    </>
  );
}