import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CosmicBadge from '@/components/CosmicBadge'
import ThemeProvider from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import ThemeSyncWrapper from '@/components/ThemeSyncWrapper'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cosmic Todo',
  description: 'A Wunderlist style todo list app powered by Cosmic',
  // Changed: Added PWA manifest link
  manifest: '/manifest.json',
  // Changed: Added apple-mobile-web-app-capable meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cosmic Todo',
  },
  // Changed: Added format detection
  formatDetection: {
    telephone: false,
  },
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
  // Changed: Added viewport-fit for iOS notch support
  viewportFit: 'cover',
  // Changed: Added theme-color for browser chrome
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Changed: Added PWA meta tags for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        {/* Changed: ThemeProvider is now outside AuthProvider to avoid dependency issues */}
        <ThemeProvider>
          <AuthProvider>
            {/* Changed: ThemeSyncWrapper wraps children to handle syncing user theme preference */}
            <ThemeSyncWrapper>
              {children}
            </ThemeSyncWrapper>
            <CosmicBadge bucketSlug={bucketSlug} />
            {/* Changed: Added PWA install prompt component */}
            <PWAInstallPrompt />
            {/* Changed: Added service worker registration */}
            <ServiceWorkerRegistration />
            <script src="/dashboard-console-capture.js"></script>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}