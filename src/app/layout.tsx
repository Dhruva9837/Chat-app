import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

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
  title: 'Nexora — Architects Neural Hub',
  description: 'High-fidelity decentralized messaging node for architectural discourse.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased text-[#1b1b1b] selection:bg-[#3525cd]/10`}>
        {children}
      </body>
    </html>
  );
}
