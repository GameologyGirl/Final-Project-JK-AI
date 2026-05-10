import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'You Be The Judge',
  description:
    'An interactive courtroom simulation where you interrogate two AIs who lie by omission. Can you find the truth before they bury it?',
  generator: 'v0.app',
  keywords: ['AI', 'courtroom', 'game', 'lying by omission', 'interactive', 'simulation'],
}

export const viewport: Viewport = {
  themeColor: '#1e1e28',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
