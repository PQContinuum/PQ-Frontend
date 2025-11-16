"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Rocket, Terminal, Building2 } from "lucide-react";

const useCases = [
  {
    icon: Users,
    title: "Para creadores",
    description:
      "Transforma ideas en contenido claro y atractivo en segundos. Sin bloquearte, sin perder tu estilo.",
  },
  {
    icon: Rocket,
    title: "Para emprendedores",
    description:
      "Valida, lanza y optimiza procesos sin depender de un equipo completo. Agilidad desde el día uno.",
  },
  {
    icon: Terminal,
    title: "Para developers",
    description:
      "Documenta, genera y soluciona al instante. Más tiempo creando, menos tiempo debugeando.",
  },
  {
    icon: Building2,
    title: "Para equipos",
    description:
      "Centraliza conocimiento, acelera decisiones. Un solo lugar para colaborar con inteligencia.",
  },
];

export function UseCasesSection() {
  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#00552b]/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Casos de uso
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Diseñado para adaptarse a tu forma de trabajar
          </p>
        </div>

        {/* Use cases stack */}
        <div className="max-w-4xl mx-auto space-y-6">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="group border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-[#00552b]/30 hover:bg-white/[0.04] transition-all duration-300 hover:scale-[1.01]"
            >
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#00552b]/10 flex items-center justify-center group-hover:bg-[#00552b]/20 transition-colors border border-[#00552b]/20">
                    <useCase.icon className="w-7 h-7 text-[#00552b]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-neutral-400 leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
