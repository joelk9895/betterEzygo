import type { Metadata } from "next";
import { Instrument_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Better Ezygo Dashboard",
  description: "Student attendance dashboard for tracking course attendance",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Better Ezygo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#f9fafb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Better Ezygo" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Debug PWA support
              console.log('PWA Support Check - Service Worker:', 'serviceWorker' in navigator);
              console.log('PWA Support Check - BeforeInstallPrompt supported:', 'BeforeInstallPromptEvent' in window);
              
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  console.log('Attempting to register service worker...');
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('✅ Service Worker registered successfully with scope: ', registration.scope);
                    },
                    function(error) {
                      console.error('❌ Service Worker registration failed: ', error);
                    }
                  );
                });
              }
              
              // Listen for the beforeinstallprompt event
              window.addEventListener('beforeinstallprompt', (e) => {
                console.log('✅ beforeinstallprompt event fired');
                // Prevent Chrome 67 and earlier from automatically showing the prompt
                e.preventDefault();
                // Stash the event so it can be triggered later
                window.deferredPrompt = e;
                // Update UI to notify the user they can add to home screen
                console.log('App can be installed - showing install button or notification');
              });
            `
          }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${playfairDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
