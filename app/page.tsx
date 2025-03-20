import { Metadata } from 'next';
import { Header } from '@/components/header/Header';
import { ClientComponents } from '@/components/ClientComponents';

export const metadata: Metadata = {
  title: '360code.io - AI-Powered Code Generator',
  description: '360code.io - Generate complete projects with AI coding assistance',
};

export default function Index() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header />
      <ClientComponents />
    </div>
  );
}