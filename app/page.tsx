import { Metadata } from 'next';
import { ClientOnly } from '@/components/utils/ClientOnly';
import BaseChat from '@/components/chat/BaseChat';
import { Header } from '@/components/header/Header';
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

export const metadata: Metadata = {
  title: '360code.io - AI-Powered Code Generator',
  description: '360code.io - Generate complete projects with AI coding assistance',
};

export default function Index() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header />
      <ClientOnly fallback={<BaseChat showChat={true} chatStarted={false} isStreaming={false} messages={[]} input="" handleInputChange={() => {}} handleStop={() => {}} sendMessage={() => {}} />}>
        {() => (
          <>
            <Chat />
            <FileExplorer />
            <ProjectProgress />
          </>
        )}
      </ClientOnly>
    </div>
  );
}