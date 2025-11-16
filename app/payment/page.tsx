'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Sparkles, Zap, Building2, Rocket } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const plans = [
  {
    id: 'free',
    name: 'Gratis',
    icon: Zap,
    price: {
      monthly: 'Gratis para siempre',
      yearly: 'Gratis para siempre',
    },
    description: 'Perfecto para explorar y empezar con tu asistente IA.',
    features: [
      'Acceso al chat inteligente',
      'Límite de 20 mensajes/día',
      'Modelos estándar',
      'Historial de 7 días',
      'Soporte por email',
    ],
    cta: 'Comenzar gratis',
  },
  {
    id: 'basic',
    name: 'Básico',
    icon: Rocket,
    price: {
      monthly: 12,
      yearly: 10,
    },
    description: 'Ideal para usuarios individuales que necesitan más.',
    features: [
      'Todo lo del Gratis, más:',
      'Límite de 100 mensajes/día',
      'Modelos avanzados',
      'Historial de 30 días',
      'Exportación de chats',
      'Prioridad en respuestas',
    ],
    cta: 'Comenzar con Básico',
  },
  {
    id: 'professional',
    name: 'Profesional',
    icon: Sparkles,
    price: {
      monthly: 29,
      yearly: 24,
    },
    description: 'Para quienes trabajan en serio y necesitan más potencia.',
    features: [
      'Todo lo del Básico, más:',
      'Mensajes ilimitados',
      'Modelo avanzado GPT-4',
      'Velocidad prioritaria',
      'Historial completo',
      'Modo conversación continua',
      'Integraciones básicas (API, Zapier)',
      'Análisis y reportes',
    ],
    cta: 'Actualizar a Profesional',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: {
      monthly: 'Contactar para precio',
      yearly: 'Contactar para precio',
    },
    description: 'Soluciones personalizadas para equipos y empresas.',
    features: [
      'Todo lo del Profesional, más:',
      'Equipos ilimitados',
      'Modelos de última generación personalizados',
      'Memoria personalizada avanzada',
      'Espacios compartidos para equipos',
      'API avanzada con rate limits extendidos',
      'Soporte dedicado 24/7',
      'SLA garantizado',
      'Entrenamiento personalizado',
      'Consultoría estratégica',
    ],
    cta: 'Contactar ventas',
  },
];

export default function PaymentPage() {
  const [frequency, setFrequency] = useState<string>('monthly');
  const router = useRouter();

  const formatPrice = (price: number | string, freq: string) => {
    if (typeof price === 'string') return price;
    return `$${price} USD/mes, facturado ${freq === 'monthly' ? 'mensualmente' : 'anualmente'}.`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background grid pattern */}
      <div className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,rgba(0,85,43,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,85,43,0.1)_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_300px,rgba(0,85,43,0.1),transparent)]"></div>
      </div>

      <div className="relative flex flex-col gap-16 px-8 py-24 text-center">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-8 left-8 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          ← Volver
        </button>

        <div className="flex flex-col items-center justify-center gap-8">
          {/* Header */}
          <h1 className="mb-0 text-balance font-bold text-5xl md:text-6xl tracking-tight text-white">
            Precios simples y transparentes
          </h1>
          <p className="mx-auto mt-0 mb-0 max-w-2xl text-balance text-lg text-neutral-400">
            Gestionar tu negocio es suficientemente difícil, así que ¿por qué no
            hacerte la vida más fácil? Nuestros planes escalan contigo.
          </p>

          {/* Tabs for billing frequency */}
          <Tabs defaultValue={frequency} onValueChange={setFrequency}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="monthly" className="data-[state=active]:bg-[#00552b] text-white data-[state=active]:font-semibold">
                Mensual
              </TabsTrigger>
              <TabsTrigger value="yearly" className="data-[state=active]:bg-[#00552b] text-white data-[state=active]:font-semibold">
                Anual
                <Badge variant="secondary" className="ml-2 bg-[#00552b]/20 text-white border-0">
                  Ahorra 17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Pricing cards */}
          <div className="mt-8 grid w-full max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  className={cn(
                    'relative w-full text-left border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300',
                    plan.popular && 'ring-2 ring-[#00552b] scale-105'
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
                      {typeof plan.price[frequency as keyof typeof plan.price] ===
                      'number' ? (
                        <div>
                          <div className="font-semibold text-white text-3xl">
                            ${plan.price[frequency as keyof typeof plan.price]}
                            <span className="text-lg text-neutral-400 font-normal">
                              {' '}
                              USD/mes
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">
                            Facturado {frequency === 'monthly' ? 'mensualmente' : 'anualmente'}
                          </p>
                        </div>
                      ) : (
                        <div className="font-semibold text-white text-xl">
                          {plan.price[frequency as keyof typeof plan.price]}
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
                            feature.includes('Todo lo del')
                              ? 'text-neutral-500 font-medium'
                              : ''
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
                        'w-full',
                        plan.popular
                          ? 'bg-[#00552b] hover:bg-[#00552b]/90 text-white shadow-lg shadow-[#00552b]/30'
                          : 'border-white/20 bg-white text-black hover:bg-[#00552b] hover:text-white hover:border-[#00552b] transition-all'
                      )}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Footer info */}
          <p className="text-sm text-neutral-500 max-w-2xl mx-auto mt-8">
            Todos los planes incluyen actualizaciones gratuitas, cifrado end-to-end
            y la opción de cancelar en cualquier momento. Sin permanencia.
          </p>
        </div>
      </div>
    </div>
  );
}
