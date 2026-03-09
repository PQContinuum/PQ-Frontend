import type { Metadata } from "next";
import { RevealObserver } from "@/components/site";
import "./site.css";

export const metadata: Metadata = {
  title: "ContinuumAI - No es cualquier IA. Razona en continuo.",
  description:
    "Plataforma de inteligencia artificial para generar imágenes, crear videos con IA, producir audio, leer documentos y conversar con contexto.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-theme" style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      <RevealObserver />
      {children}
    </div>
  );
}
