"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Code2, Search, Workflow, Lightbulb, Languages } from "lucide-react";

const features = [
  {
    icon: Pencil,
    title: "Escritura profesional",
    description: "Emails, resúmenes, textos pulidos. Con tu voz, sin esfuerzo.",
  },
  {
    icon: Code2,
    title: "Código asistido",
    description: "Genera, depura y explica código. Para developers que valoran su tiempo.",
  },
  {
    icon: Search,
    title: "Investigación inteligente",
    description: "Respuestas precisas con lenguaje natural. Sin perderte en búsquedas infinitas.",
  },
  {
    icon: Workflow,
    title: "Automatización fluida",
    description: "Crea flujos, documentos y tareas recurrentes. Automatiza lo que importa.",
  },
  {
    icon: Lightbulb,
    title: "Creatividad con propósito",
    description: "Guiones, conceptos, ideas. Explora sin límites, ejecuta con claridad.",
  },
  {
    icon: Languages,
    title: "Traducción nativa",
    description: "Contexto, tono y precisión. Como si fuera escrito en el idioma destino.",
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
            Lo que puedes hacer
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Herramientas poderosas diseñadas para tu flujo de trabajo
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
