import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-client-provider";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Continuum AI",
  description: "Asistente AI para un pensamiento natural.",

  openGraph: {
    title: "Continuum AI",
    description: "Asistente AI para un pensamiento natural.",
    siteName: "Continuum AI",
    images: [
      {
        url: "/images/preview1.png",
        width: 1200,
        height: 630,
        alt: "Continuum AI Preview",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Continuum AI",
    description: "Asistente AI para un pensamiento natural.",
    images: ["/images/preview1.png"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased"
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
