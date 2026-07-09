import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs'
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

import { AlertProvider } from "@/components/ui/AlertContext";
import { StatsProvider } from "@/components/ui/StatsContext";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "REVIEWQO",
  description: "A playful, gamified reviewer for the Civil Service Exam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
      >
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
        <body className="min-h-full flex flex-col">
          <AlertProvider>
            <StatsProvider>
              {children}
            </StatsProvider>
          </AlertProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
