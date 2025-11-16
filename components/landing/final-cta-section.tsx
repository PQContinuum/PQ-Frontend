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
            Empieza a trabajar mejor.
            <br />
            Hoy.
          </h2>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya confían en AI Chat
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            {redirectPath ? (
              <Link href={redirectPath} onClick={handleClick}>
                <Button
                  size="lg"
                  className="group px-10 py-6 text-lg bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-2xl shadow-[#00552b]/30 hover:shadow-[#00552b]/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <Link href={"/chat"}>
                      Probar ahora — es gratis
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </Button>
              </Link>
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
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00552b]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Sin tarjeta requerida</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00552b]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
