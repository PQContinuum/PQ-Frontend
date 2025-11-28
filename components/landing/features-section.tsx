"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, TrendingDown, Gauge, Brain, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Hasta 40% más eficiencia",
    description: "Más claridad. Menos consumo. Continuum AI reorganiza tu mensaje antes de responder.",
  },
  {
    icon: Target,
    title: "Elimina ruido",
    description: "Aclara lo que quieres decir antes de actuar. Respuestas más útiles y profundas.",
  },
  {
    icon: TrendingDown,
    title: "Reduce contradicciones",
    description: "Menos tokens consumidos. Menor costo operativo sin sacrificar calidad.",
  },
  {
    icon: Gauge,
    title: "Mayor precisión en menos tiempo",
    description: "Tú solo escribes como siempre. Continuum AI se encarga de optimizar el flujo.",
  },
  {
    icon: Brain,
    title: "Una experiencia que se adapta a ti",
    description: "No hablas con una máquina. Hablas con una versión más ordenada de ti.",
  },
  {
    icon: CheckCircle,
    title: "Ajuste automático",
    description: "Analiza tu forma de expresarte y ajusta tono, ritmo, profundidad y enfoque.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:6rem_6rem]" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#00552b]/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Velocidad y eficiencia que se siente
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Con Continuum AI cada mensaje fluye, cada contexto se mantiene y cada decisión se vuelve más sencilla
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-white/5 bg-black/40 backdrop-blur-sm hover:border-[#00552b]/30 hover:bg-black/60 transition-all duration-300"
            >
              <CardContent className="p-6 space-y-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#00552b]/10 flex items-center justify-center group-hover:bg-[#00552b]/20 transition-colors border border-[#00552b]/20">
                  <feature.icon className="w-5 h-5 text-[#00552b]" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
