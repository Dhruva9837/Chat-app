import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const manrope = Manrope({ 
  subsets: ["latin"], 
  variable: "--font-manrope",
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nexora — Simple & Secure Messaging',
  description: 'A clean, secure, and modern messaging platform for everyone.',
};

import { ThemeHandler } from "@/components/ThemeHandler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${manrope.variable} font-sans antialiased text-text-main selection:bg-primary/10 transition-colors duration-500`}
      >
        <ThemeProvider>
          <ThemeHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
