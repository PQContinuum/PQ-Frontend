"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Code2, Search, Workflow, Lightbulb, Users, Rocket, Briefcase, Terminal, Building2 } from "lucide-react";

const useCases = [
  {
    icon: Pencil,
    title: "Escritura que suena a ti, pero más nítida",
    description:
      "Ideas dispersas → mensajes precisos. Borradores a medias → textos listos para enviar. Páginas web, correos, guiones, copies, todo con tu voz, pero más claro.",
  },
  {
    icon: Code2,
    title: "Código que cobra sentido",
    description:
      "Genera, explica y documenta código. Te ayuda a depurar y refactorizar. No solo 'escribe funciones': entiende el para qué de tu proyecto.",
  },
  {
    icon: Search,
    title: "Investigación sin fatiga mental",
    description:
      "Busca, filtra, compara y resume. Te entrega lo importante sin paja ni relleno. Ideal para análisis, reportes, papers, estrategia y toma de decisiones.",
  },
  {
    icon: Workflow,
    title: "Automatización natural",
    description:
      "No necesitas ser programador. Describes el flujo, Continuum AI te ayuda a construirlo. Desde respuestas automáticas hasta flujos completos de trabajo en tu negocio.",
  },
  {
    icon: Lightbulb,
    title: "Ideas que evolucionan contigo",
    description:
      "Llegas con una sensación, un concepto borroso, una intuición. Sales con un plan claro, accionable y alineado a tus objetivos. No se queda en brainstorming; te ayuda a bajar las ideas a tierra.",
  },
  {
    icon: Users,
    title: "Para creadores de contenido",
    description:
      "Convierte intuiciones y notas sueltas en guiones, historias, newsletters, cursos y contenido que realmente conecta con tu audiencia.",
  },
  {
    icon: Rocket,
    title: "Para emprendedores y negocios",
    description:
      "Toma decisiones con más claridad: organiza ideas, diseña propuestas, responde clientes y documenta procesos en menos tiempo.",
  },
  {
    icon: Briefcase,
    title: "Para profesionales",
    description:
      "Abogados, consultores, médicos, coaches, educadores, marketers: resúmenes, reportes, presentaciones y comunicación interna sin cargar tu cabeza de ruido.",
  },
  {
    icon: Terminal,
    title: "Para developers",
    description:
      "Menos horas peleando con errores, más horas construyendo productos. Continuum AI te ayuda a entender y mantener sistemas complejos.",
  },
  {
    icon: Building2,
    title: "Para empresas",
    description:
      "Escala soporte, documentación, entrenamiento interno y análisis sin disparar tus costos. Una IA en flujo continuo, lista para integrarse a tu infraestructura.",
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
            Qué puedes hacer con Continuum AI
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Herramientas poderosas y versátiles para todo tipo de usuarios
          </p>
        </div>

        {/* Use cases grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="group border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-[#00552b]/30 hover:bg-white/[0.04] transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#00552b]/10 flex items-center justify-center group-hover:bg-[#00552b]/20 transition-colors border border-[#00552b]/20">
                    <useCase.icon className="w-5 h-5 text-[#00552b]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
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
