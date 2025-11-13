'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Básico',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    monthlyPrice: 349,
    features: [
      'Acceso a todas las funciones básicas',
      'Hasta 1,000 mensajes al mes',
      'Soporte por email',
      'Historial de conversaciones',
      'Exportar conversaciones',
    ],
  },
  {
    name: 'Pro',
    icon: Sparkles,
    color: 'from-[#00552b] to-[#00aa56]',
    borderColor: 'border-[#00aa56]',
    bgColor: 'bg-green-50',
    monthlyPrice: 1499,
    popular: true,
    features: [
      'Todo lo incluido en Básico',
      'Mensajes ilimitados',
      'Soporte prioritario 24/7',
      'Integraciones avanzadas',
      'API personalizada',
      'Análisis y reportes detallados',
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-600',
    bgColor: 'bg-yellow-50',
    monthlyPrice: 4199,
    features: [
      'Todo lo incluido en Pro',
      'Equipos ilimitados',
      'Soporte dedicado',
      'SLA garantizado',
      'Entrenamiento personalizado',
      'Consultoría estratégica',
      'Implementación asistida',
    ],
  },
];

export default function PaymentPage() {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');
  const router = useRouter();

  const calculateAnnualPrice = (monthlyPrice: number) => {
    return monthlyPrice * 11;
  };

  const calculateDiscount = () => {
    return Math.round((1 / 12) * 100);
  };

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === 'monthly') {
      return monthlyPrice;
    }
    return calculateAnnualPrice(monthlyPrice);
  };

  const getPriceLabel = (monthlyPrice: number) => {
    if (billingCycle === 'monthly') {
      return `$${monthlyPrice.toLocaleString('es-MX')} MXN/mes`;
    }
    return `$${calculateAnnualPrice(monthlyPrice).toLocaleString('es-MX')} MXN/año`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f6f6] via-white to-green-50/30">
      {/* Header */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.button
          onClick={() => router.back()}
          className="mb-8 text-sm text-[#4c4c4c] hover:text-[#00552b] transition-colors"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Volver
        </motion.button>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#111111] mb-4">
            Elige el plan perfecto para ti
          </h1>
          <p className="text-lg text-[#4c4c4c] max-w-2xl mx-auto">
            Potencia tu productividad con PQ Continuum. Todos los planes incluyen
            acceso completo a nuestro asistente IA.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span
              className={`text-sm font-medium transition-colors w-16 text-center ${
                billingCycle === 'monthly' ? 'text-[#111111]' : 'text-[#4c4c4c]'
              }`}
            >
              Mensual
            </span>
            <button
              onClick={() =>
                setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')
              }
              className="relative w-16 h-8 rounded-full bg-[#00552b] transition-all"
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{
                  left: billingCycle === 'monthly' ? 4 : 36,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors w-16 text-center ${
                billingCycle === 'annual' ? 'text-[#111111]' : 'text-[#4c4c4c]'
              }`}
            >
              Anual
            </span>
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              opacity: billingCycle === 'annual' ? 1 : 0,
              height: billingCycle === 'annual' ? 'auto' : 0,
              marginTop: billingCycle === 'annual' ? 0 : -12,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <span className="inline-block text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white rounded-full shadow-md">
              ✨ Ahorra {calculateDiscount()}% con el plan anual
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative"
              >
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                  >
                    <span className="bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      MÁS POPULAR
                    </span>
                  </motion.div>
                )}

                <div
                  className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                    plan.popular ? plan.borderColor : 'border-gray-200'
                  } p-8 h-full flex flex-col overflow-hidden transition-all ${
                    plan.popular ? 'shadow-xl' : 'hover:shadow-xl'
                  }`}
                >
                  {/* Background Gradient */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${plan.color}`}
                  />

                  {/* Icon */}
                  <div className={`${plan.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="size-7 text-[#111111]" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-[#111111] mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[#111111]">
                        ${getPrice(plan.monthlyPrice).toLocaleString('es-MX')}
                      </span>
                      <span className="text-[#4c4c4c] text-sm">MXN</span>
                    </div>
                    <p className="text-sm text-[#4c4c4c] mt-1">
                      {billingCycle === 'monthly' ? 'por mes' : 'por año'}
                    </p>
                    {billingCycle === 'annual' && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Equivale a ${plan.monthlyPrice.toLocaleString('es-MX')} MXN/mes
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 + i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`${plan.bgColor} rounded-full p-1 mt-0.5`}>
                          <Check className="size-3 text-[#00552b]" />
                        </div>
                        <span className="text-sm text-[#4c4c4c]">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white shadow-lg hover:shadow-xl'
                        : 'bg-[#f6f6f6] text-[#111111] hover:bg-gray-200'
                    }`}
                  >
                    Comenzar ahora
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-[#4c4c4c] max-w-2xl mx-auto">
            Todos los planes incluyen acceso completo a nuestro asistente de IA,
            actualizaciones gratuitas y la opción de cancelar en cualquier momento.
            ¿Necesitas ayuda para elegir? Contáctanos.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
