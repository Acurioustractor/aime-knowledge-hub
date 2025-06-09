import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from './components/layout/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AIME Knowledge Hub',
  description: 'AI-powered knowledge hub for AIME research and insights',
  keywords: ['AIME', 'AI', 'Knowledge Hub', 'Research', 'RAG'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-secondary-50">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
} 