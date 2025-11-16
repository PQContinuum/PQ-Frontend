"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Rocket } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "mes",
    description: "Perfecto para explorar y empezar",
    icon: null,
    popular: false,
    features: [
      "Acceso al chat inteligente",
      "Límite de 20 mensajes/día",
      "Modelos estándar",
      "Historial de 7 días",
    ],
    cta: "Comenzar gratis",
  },
  {
    name: "Pro",
    price: "$12",
    period: "mes",
    description: "Para quienes trabajan en serio",
    icon: Sparkles,
    popular: true,
    features: [
      "Todo lo del Free, más:",
      "Mensajes ilimitados",
      "Modelo avanzado GPT-4",
      "Velocidad prioritaria",
      "Historial completo",
      "Modo conversación continua",
      "Exportación de chats",
      "Integraciones básicas (API, Zapier)",
    ],
    cta: "Actualizar a Pro",
  },
  {
    name: "Ultra",
    price: "$29",
    period: "mes",
    description: "Power users y equipos profesionales",
    icon: Rocket,
    popular: false,
    features: [
      "Todo lo del Pro, más:",
      "Modelos de última generación (GPT-4 Turbo, Claude)",
      "Generación de archivos (PDF, DOCX, código)",
      "Memoria personalizada avanzada",
      "Espacios compartidos para equipos",
      "API avanzada con rate limits extendidos",
      "Soporte prioritario 24/7",
      "Acceso anticipado a nuevas funciones",
    ],
    cta: "Obtener Ultra",
  },
];

export function PricingSection() {
  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00552b]/5 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00552b]/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Elige tu plan
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Sin permanencia. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border ${
                plan.popular
                  ? "border-[#00552b]/50 bg-white/[0.03] shadow-2xl shadow-[#00552b]/10 scale-105"
                  : "border-white/5 bg-white/[0.02]"
              } backdrop-blur-sm hover:border-[#00552b]/40 transition-all duration-300`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#00552b] text-white text-sm font-semibold shadow-lg">
                  Más popular
                </div>
              )}

              <CardContent className="p-8 space-y-6">
                {/* Icon and name */}
                <div className="space-y-2">
                  {plan.icon && (
                    <div className="w-12 h-12 rounded-2xl bg-[#00552b]/15 flex items-center justify-center mb-4 border border-[#00552b]/30">
                      <plan.icon className="w-6 h-6 text-[#00552b]" />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-neutral-400">/ {plan.period}</span>
                </div>

                {/* CTA */}
                <Button
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? "bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-lg shadow-[#00552b]/30"
                      : "border-white/20 text-white hover:bg-white/5 hover:border-[#00552b]/40"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>

                {/* Divider */}
                <div className="h-px bg-white/10" />

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="w-5 h-5 text-[#00552b] flex-shrink-0 mt-0.5" />
                      <span
                        className={
                          feature.includes("Todo lo del")
                            ? "text-neutral-500 font-medium"
                            : "text-neutral-300"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional info */}
        <p className="text-center text-sm text-neutral-500 mt-12 max-w-2xl mx-auto">
          Todos los planes incluyen actualizaciones gratuitas, cifrado end-to-end y
          acceso a nuestra comunidad. Los precios se muestran en USD.
        </p>
      </div>
    </section>
  );
}
