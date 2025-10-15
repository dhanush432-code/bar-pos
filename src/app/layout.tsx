// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // Import the new provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barcode POS",
  description: "Point of Sale system for a bar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> {/* Wrap your children with the provider */}
          {children}
        </Providers>
      </body>
    </html>
  );
}