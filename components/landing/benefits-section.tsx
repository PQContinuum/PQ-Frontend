"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, Palette, Lock } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Precisión sin ruido",
    description:
      "Respuestas directas y útiles. Sin relleno, sin errores innecesarios.",
  },
  {
    icon: Palette,
    title: "Diseño que respira",
    description:
      "Interfaz oscura, limpia y enfocada en lo esencial. Porque importa cómo te sientes al usarlo.",
  },
  {
    icon: Lock,
    title: "Privacidad total",
    description:
      "Tus conversaciones son tuyas. Cifrado end-to-end y cero almacenamiento sin tu consentimiento.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00552b]/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Por qué es diferente
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            No es solo otro chat. Es la experiencia que estabas esperando.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="group border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-[#00552b]/30 hover:bg-white/[0.04] transition-all duration-300 hover:scale-[1.02]"
            >
              <CardContent className="p-8 space-y-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-[#00552b]/10 flex items-center justify-center group-hover:bg-[#00552b]/20 transition-colors border border-[#00552b]/20">
                  <benefit.icon className="w-6 h-6 text-[#00552b]" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-neutral-400 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
