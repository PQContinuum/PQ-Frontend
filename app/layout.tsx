import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-client-provider";

export const metadata: Metadata = {
  title: "PQ Continnuum",
  description: "Assistant AI",
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
