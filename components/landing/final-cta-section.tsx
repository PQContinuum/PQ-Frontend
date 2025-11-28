"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function FinalCTASection() {
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Determinar la ruta al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        setRedirectPath(user ? "/chat" : "/auth");
      } catch (error) {
        console.error("Error checking auth:", error);
        setRedirectPath("/auth");
      }
    };
    checkAuth();
  }, []);

  const handleClick = () => {
    setIsLoading(true);
  };
  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00552b]/5 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00552b]/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00552b]/10 mb-4 border border-[#00552b]/20">
            <Sparkles className="w-8 h-8 text-[#00552b]" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-white">
            Una IA diseñada para
            <br />
            pensar contigo.
          </h2>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto">
            Más clara. Más estable. Más consciente del contexto. Más eficiente energéticamente. Más alineada a cómo realmente piensas y trabajas.
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            {redirectPath ? (
              <Button
                asChild
                size="lg"
                className="group px-10 py-6 text-lg bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-2xl shadow-[#00552b]/30 hover:shadow-[#00552b]/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isLoading}
                onClick={handleClick}
              >
                <Link href={redirectPath}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Activa tu flujo continuo de pensamiento
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="px-10 py-6 text-lg bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-2xl shadow-[#00552b]/30 transition-all"
                disabled
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Cargando...
              </Button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="pt-8 max-w-3xl mx-auto">
            <p className="text-sm text-neutral-400 italic">
              &ldquo;Continuum AI no busca reemplazarte. Busca amplificar tu forma de crear, decidir y construir.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
