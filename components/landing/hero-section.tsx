"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export function HeroSection() {
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background grid pattern */}
      <div className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,rgba(0,85,43,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,85,43,0.3)_1px,transparent_1px)] bg-[size:6rem_4rem]">
        {/* Radial gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,85,43,0.4),transparent)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#00552b]" />
          <span className="text-sm text-neutral-400">
            Inteligencia artificial en flujo continuo
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
          <span className="text-white">
            Una IA que no solo responde.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#00552b] via-green-600 to-[#00552b] bg-clip-text text-transparent">
            Te entiende.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
          La mayoría de las IA completan texto. Continuum AI interpreta ideas completas.
          <br className="hidden md:block" />
          No procesa palabras sueltas: organiza significado.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
          {redirectPath ? (
            <Link href={redirectPath} onClick={handleClick}>
              <Button
                size="lg"
                className="group px-8 bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-lg shadow-[#00552b]/20 hover:shadow-[#00552b]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    Empieza a pensar en continuo
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="px-8 bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-lg shadow-[#00552b]/20 hover:shadow-[#00552b]/30 transition-all"
              disabled
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cargando...
            </Button>
          )}
        </div>

        {/* Trust indicator */}
        <p className="mt-12 text-sm text-neutral-500 animate-fade-in animation-delay-600">
          Más de 10,000 usuarios ya confían en nosotros
        </p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
