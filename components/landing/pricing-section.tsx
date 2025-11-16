"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Sparkles,
  Rocket,
  Building2,
  Zap,
} from "lucide-react";

type BillingFrequency = "monthly" | "yearly";

type Plan = {
  id: string;
  name: string;
  icon: typeof Sparkles;
  price: {
    monthly: number | string | null;
    yearly: number | string | null;
  };
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Gratis",
    icon: Zap,
    price: {
      monthly: "Gratis para siempre",
      yearly: "Gratis para siempre",
    },
    description: "Perfecto para explorar y empezar con tu asistente IA.",
    features: [
      "Acceso al chat inteligente",
      "Límite de 20 mensajes/día",
      "Modelos estándar",
      "Historial de 7 días",
      "Soporte por email",
    ],
    cta: "Comenzar gratis",
  },
  {
    id: "basic",
    name: "Básico",
    icon: Rocket,
    price: {
      monthly: 349,
      yearly: 3840,
    },
    description: "Ideal para usuarios individuales que necesitan más.",
    features: [
      "Todo lo del Gratis, más:",
      "Límite de 100 mensajes/día",
      "Modelos avanzados",
      "Historial de 30 días",
      "Exportación de chats",
      "Prioridad en respuestas",
    ],
    cta: "Comenzar con Básico",
  },
  {
    id: "professional",
    name: "Profesional",
    icon: Sparkles,
    price: {
      monthly: 1499,
      yearly: 16490,
    },
    description: "Para quienes trabajan en serio y necesitan más potencia.",
    features: [
      "Todo lo del Básico, más:",
      "Mensajes ilimitados",
      "Modelo avanzado GPT-4",
      "Velocidad prioritaria",
      "Historial completo",
      "Modo conversación continua",
      "Integraciones básicas (API, Zapier)",
      "Análisis y reportes",
    ],
    cta: "Actualizar a Profesional",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    price: {
      monthly: 4199,
      yearly: 46190,
    },
    description: "Soluciones personalizadas para equipos y empresas.",
    features: [
      "Todo lo del Profesional, más:",
      "Equipos ilimitados",
      "Modelos de última generación personalizados",
      "Memoria personalizada avanzada",
      "Espacios compartidos para equipos",
      "API avanzada con rate limits extendidos",
      "Soporte dedicado 24/7",
      "SLA garantizado",
      "Entrenamiento personalizado",
      "Consultoría estratégica",
    ],
    cta: "Contactar ventas",
  },
];

export function PricingSection() {
  const router = useRouter();
  const [frequency, setFrequency] = useState<BillingFrequency>("monthly");

  const handlePlanClick = (planId: string) => {
    if (planId === "enterprise") {
      window.open(
        "mailto:sales@tudominio.com?subject=Consulta Plan Enterprise",
        "_self"
      );
      return;
    }
    router.push("/payment");
  };

  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00552b]/5 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00552b]/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Precios simples y transparentes
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Gestiona tu negocio sin complicaciones. Nuestros planes escalan
            contigo.
          </p>
        </div>

        {/* Tabs for billing frequency */}
        <div className="flex justify-center mb-10">
          <Tabs
            value={frequency}
            onValueChange={(value) => setFrequency(value as BillingFrequency)}
          >
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-[#00552b] text-white data-[state=active]:font-semibold"
              >
                Mensual
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="data-[state=active]:bg-[#00552b] text-white data-[state=active]:font-semibold"
              >
                Anual
                <Badge
                  variant="secondary"
                  className="ml-2 bg-[#00552b]/20 text-white border-0"
                >
                  Ahorra 17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = plan.price[frequency];

            return (
              <Card
                className={cn(
                  "relative w-full text-left border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300",
                  plan.popular && "ring-2 ring-[#00552b] scale-105"
                )}
                key={plan.id}
              >
                {plan.popular && (
                  <Badge className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 rounded-full bg-[#00552b] hover:bg-[#00552b]/90">
                    Más popular
                  </Badge>
                )}
                <CardHeader>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#00552b]/15 flex items-center justify-center mb-4 border border-[#00552b]/30">
                    <Icon className="w-6 h-6 text-[#00552b]" />
                  </div>

                  <CardTitle className="font-bold text-2xl text-white">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    {plan.description}
                  </CardDescription>

                  <div className="mt-4 px-6">
                    {typeof price === "number" ? (
                      <div>
                        <div className="font-semibold text-white text-3xl">
                          ${price}
                          <span className="text-lg text-neutral-400 font-normal">
                            {" "}
                            USD/mes
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          Facturado{" "}
                          {frequency === "monthly" ? "mensualmente" : "anualmente"}
                        </p>
                      </div>
                    ) : (
                      <div className="font-semibold text-white text-xl">
                        {price}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {plan.features.map((feature, index) => (
                    <div
                      className="flex items-start gap-3 text-neutral-300 text-sm"
                      key={index}
                    >
                      <Check className="h-5 w-5 text-[#00552b] flex-shrink-0 mt-0.5" />
                      <span
                        className={
                          feature.includes("Todo lo del")
                            ? "text-neutral-500 font-medium"
                            : ""
                        }
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-lg shadow-[#00552b]/30"
                        : "border-white/20 bg-white text-black hover:bg-[#00552b] hover:text-white hover:border-[#00552b] transition-all"
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional info */}
        <p className="text-center text-sm text-neutral-500 mt-12 max-w-2xl mx-auto">
          Todos los planes incluyen actualizaciones gratuitas, cifrado end-to-end
          y la opción de cancelar en cualquier momento. Sin permanencia.
        </p>
      </div>
    </section>
  );
}
