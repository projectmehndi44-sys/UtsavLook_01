import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Playfair_Display, Roboto, Dancing_Script } from 'next/font/google';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
});

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-dancing-script',
});


export const metadata: Metadata = {
  title: 'UtsavLook: Artistry at Your Fingertips',
  description: 'Discover and book the most talented mehndi and makeup artists near you. Your perfect look for any occasion is just a click away.',
  manifest: '/manifest.json',
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <meta name="theme-color" content="#8B4513" />
       </head>
       <body className={cn('min-h-screen bg-background font-body antialiased', playfairDisplay.variable, roboto.variable, dancingScript.variable)}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
