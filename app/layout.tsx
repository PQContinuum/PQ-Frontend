import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-client-provider";

// Configurar base URL según el ambiente
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl), // ✅ Esto elimina el warning
  title: "Continnuum AI",
  description: "Asistente AI para un pensamiento natural.",

  // Open Graph (Facebook, LinkedIn, WhatsApp, etc)
  openGraph: {
    title: "Continnuum AI",
    description: "Asistente AI para un pensamiento natural.",
    siteName: "Continnuum AI",
    images: [
      {
        url: "/images/preview1.png", // Ahora se resolverá con metadataBase
        width: 1200,
        height: 630,
        alt: "Continnuum AI Preview",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Continnuum AI",
    description: "Asistente AI para un pensamiento natural.",
    images: ["/images/preview1.png"], // ✅ Arreglado (tenía // en lugar de /)
  },

  // Otras metadata útiles
  icons: {
    icon: "/favicon.ico",
    apple: "/images/preview1.png",
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
