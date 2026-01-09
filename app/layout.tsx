import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CosmicBadge from '@/components/CosmicBadge'
import ThemeProvider from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import ThemeSyncWrapper from '@/components/ThemeSyncWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cosmic Todo',
  description: 'A Wunderlist style todo list app powered by Cosmic',
  openGraph: {
    title: 'Cosmic Todo',
    description: 'A Wunderlist style todo list app powered by Cosmic',
    images: [
      {
        url: 'https://imgix.cosmicjs.com/839fb980-ec05-11f0-8092-4592c74830bf-cosmic-todo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Cosmic Todo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cosmic Todo',
    description: 'A Wunderlist style todo list app powered by Cosmic',
    images: ['https://imgix.cosmicjs.com/839fb980-ec05-11f0-8092-4592c74830bf-cosmic-todo.jpeg'],
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        // Changed: Updated to use new custom Cosmic image with imgix optimization for 180x180 apple touch icon
        url: 'https://imgix.cosmicjs.com/a8fabc00-ed01-11f0-94f4-096f86bda01e-ai-gemini-3-pro-image-preview-1767925136331.jpeg?w=180&h=180&fit=crop&auto=format,compress',
        sizes: '180x180',
        type: 'image/jpeg',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Changed: ThemeProvider is now outside AuthProvider to avoid dependency issues */}
        <ThemeProvider>
          <AuthProvider>
            {/* Changed: ThemeSyncWrapper wraps children to handle syncing user theme preference */}
            <ThemeSyncWrapper>
              {children}
            </ThemeSyncWrapper>
            <CosmicBadge bucketSlug={bucketSlug} />
            <script src="/dashboard-console-capture.js"></script>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}