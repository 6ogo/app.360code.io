import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '360code.io - AI-Powered Code Generator',
  description: 'Generate code with AI and connect to Supabase backend',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <SupabaseProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
} 