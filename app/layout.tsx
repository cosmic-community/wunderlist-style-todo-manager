import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CosmicBadge from '@/components/CosmicBadge'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cosmic Todo',
  description: 'A Wunderlist style todo list app powered by Cosmic',
  openGraph: {
    title: 'Cosmic Todo',
    description: 'A Wunderlist style todo list app powered by Cosmic',
    images: [
      {
        url: 'https://imgix.cosmicjs.com/25c3c790-ec03-11f0-8092-4592c74830bf-image.png',
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
    images: ['https://imgix.cosmicjs.com/25c3c790-ec03-11f0-8092-4592c74830bf-image.png'],
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
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
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
        <ThemeProvider>
          {children}
          <CosmicBadge bucketSlug={bucketSlug} />
          <script src="/dashboard-console-capture.js"></script>
        </ThemeProvider>
      </body>
    </html>
  )
}