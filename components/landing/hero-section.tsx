"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background gradient effect - Verde sutil */}
      <div className="absolute inset-0 bg-gradient-radial from-[#00552b]/10 via-transparent to-transparent" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Floating particles - Verde */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00552b]/15 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00552b]/10 rounded-full blur-[120px] animate-float-delayed" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#00552b]" />
          <span className="text-sm text-neutral-400">
            Inteligencia que se siente humana
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
          <span className="text-white">
            Tu asistente inteligente.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#00552b] via-green-600 to-[#00552b] bg-clip-text text-transparent">
            Más claro, más rápido, más humano.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
          Un AI chat diseñado para trabajar contigo — no contra ti.
          <br className="hidden md:block" />
          Preciso, elegante y siempre disponible.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
          <Button size="lg" className="group px-8 bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-lg shadow-[#00552b]/20 hover:shadow-[#00552b]/30 transition-all">
            Comenzar ahora
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="px-8 border-white/20 text-black hover:text-white hover:bg-white/5 hover:border-[#00552b]/50">
            Ver demo
          </Button>
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
