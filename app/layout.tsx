import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-client-provider";

export const metadata: Metadata = {
  title: "Continnuum AI",
  description: "Asistente AI para un pensamiento natural.",

  // Open Graph (Facebook, LinkedIn, WhatsApp, etc)
  openGraph: {
    title: "Continnuum AI",
    description: "Asistente AI para un pensamiento natural.",
    siteName: "Continnuum AI",
    images: [
      {
        url: "/images/preview1.png", // Cambiar por URL absoluta cuando esté lista
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
    images: ["//images/preview1.png"], // Cambiar por URL absoluta cuando esté lista
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
