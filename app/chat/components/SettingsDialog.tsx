'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string | null;
  userPlan: string;
}

// Helper para obtener colores según el plan
const getPlanColors = (plan: string) => {
  const planLower = plan.toLowerCase();

  if (planLower.includes('free') || planLower === 'gratis') {
    return {
      bg: 'from-[#7EEFB2] to-[#6AD9A0]',
      text: 'text-[#7EEFB2]',
      badge: 'bg-[#7EEFB2]/20',
    };
  }

  if (planLower.includes('basic') || planLower.includes('básico')) {
    return {
      bg: 'from-[#3CCB75] to-[#2AB861]',
      text: 'text-[#3CCB75]',
      badge: 'bg-[#3CCB75]/20',
    };
  }

  if (planLower.includes('professional') || planLower.includes('pro')) {
    return {
      bg: 'from-[#DAA520] to-[#C89514]',
      text: 'text-[#DAA520]',
      badge: 'bg-[#DAA520]/20',
    };
  }

  if (planLower.includes('enterprise') || planLower.includes('empresarial')) {
    return {
      bg: 'from-[#0A4D68] to-[#083D54]',
      text: 'text-[#0A4D68]',
      badge: 'bg-[#0A4D68]/20',
    };
  }

  // Default (Free)
  return {
    bg: 'from-[#7EEFB2] to-[#6AD9A0]',
    text: 'text-[#7EEFB2]',
    badge: 'bg-[#7EEFB2]/20',
  };
};

export function SettingsDialog({
  open,
  onOpenChange,
  userEmail,
  userPlan,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState<'account' | 'plans'>('account');
  const router = useRouter();
  const planColors = getPlanColors(userPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl w-full h-[85vh] max-h-[750px] md:h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          <div className="w-full md:w-64 bg-[#f6f6f6] border-b md:border-b-0 md:border-r border-black/5 p-4 md:p-6 flex-shrink-0 overflow-y-auto md:overflow-y-visible">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold text-[#111111]">
                Configuración
              </DialogTitle>
            </DialogHeader>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'account'
                    ? 'bg-white text-[#00552b] shadow-sm'
                    : 'text-[#4c4c4c] hover:bg-white/50'
                }`}
              >
                <User className="size-4" />
                <span>Cuenta</span>
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'plans'
                    ? 'bg-white text-[#00552b] shadow-sm'
                    : 'text-[#4c4c4c] hover:bg-white/50'
                }`}
              >
                <CreditCard className="size-4" />
                <span>Planes</span>
              </button>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 md:p-6 lg:p-8">
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-bold text-[#111111] mb-1">
                      Información de la Cuenta
                    </h3>
                    <p className="text-sm text-[#4c4c4c]">
                      Gestiona tu información personal
                    </p>
                  </div>

                  {/* Email Section */}
                  <div className="bg-white rounded-xl p-5 border border-black/10 shadow-sm">
                    <label className="text-xs font-semibold text-[#4c4c4c] uppercase tracking-wide mb-3 block">
                      Correo Electrónico
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#00552b]/10 to-[#00aa56]/10 rounded-lg p-2.5">
                        <User className="size-5 text-[#00552b]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111111] truncate">
                          {userEmail || 'No disponible'}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Verificado
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                        Conversaciones
                      </p>
                      <p className="text-3xl font-bold text-[#111111]">12</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">
                        Mensajes
                      </p>
                      <p className="text-3xl font-bold text-[#111111]">148</p>
                    </div>
                  </div>

                  {/* Upgrade Banner */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5">
                    <div className="flex gap-3">
                      <Sparkles className="size-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-[#111111] mb-1">
                          Mejora tu experiencia
                        </h4>
                        <p className="text-xs text-[#4c4c4c] mb-3 leading-relaxed">
                          Desbloquea todas las funciones premium de PQ Continuum
                        </p>
                        <button
                          onClick={() => {
                            onOpenChange(false);
                            router.push('/payment');
                          }}
                          className="text-xs font-bold text-yellow-700 hover:text-yellow-800 underline underline-offset-2"
                        >
                          Ver planes →
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'plans' && (
                <motion.div
                  key="plans"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-bold text-[#111111] mb-1">
                      Tu Plan Actual
                    </h3>
                    <p className="text-sm text-[#4c4c4c]">
                      Gestiona tu suscripción
                    </p>
                  </div>

                  {/* Current Plan Card */}
                  <div className={`bg-gradient-to-br ${planColors.bg} rounded-xl p-6 text-white shadow-lg`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm opacity-90 mb-1 font-medium">Plan Actual</p>
                        <h4 className="text-3xl font-bold">{userPlan}</h4>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                        <Sparkles className="size-6" />
                      </div>
                    </div>
                    <p className="text-sm opacity-95 font-medium">
                      {userPlan === 'Gratis' || userPlan === 'Free'
                        ? 'Acceso básico a PQ Continuum'
                        : `Plan ${userPlan} - Funciones premium incluidas`}
                    </p>
                  </div>

                  {/* Plan Features */}
                  <div className="bg-white rounded-xl p-5 border border-black/10 shadow-sm">
                    <h5 className="text-sm font-bold text-[#111111] mb-4">
                      Características incluidas
                    </h5>
                    <ul className="space-y-3">
                      {userPlan === 'Gratis' ? (
                        <>
                          <li className="flex items-start gap-3 text-sm text-[#4c4c4c]">
                            <div className="bg-green-100 rounded-full p-1 mt-0.5">
                              <Sparkles className="size-3 text-green-600" />
                            </div>
                            <span>Conversaciones básicas</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-[#4c4c4c]">
                            <div className="bg-green-100 rounded-full p-1 mt-0.5">
                              <Sparkles className="size-3 text-green-600" />
                            </div>
                            <span>Historial limitado de conversaciones</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-[#4c4c4c]">
                            <div className="bg-green-100 rounded-full p-1 mt-0.5">
                              <Sparkles className="size-3 text-green-600" />
                            </div>
                            <span>Soporte por comunidad</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-3 text-sm text-[#4c4c4c]">
                            <div className="bg-green-100 rounded-full p-1 mt-0.5">
                              <Sparkles className="size-3 text-green-600" />
                            </div>
                            <span>Conversaciones ilimitadas</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-[#4c4c4c]">
                            <div className="bg-green-100 rounded-full p-1 mt-0.5">
                              <Sparkles className="size-3 text-green-600" />
                            </div>
                            <span>Soporte prioritario 24/7</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-[#4c4c4c]">
                            <div className="bg-green-100 rounded-full p-1 mt-0.5">
                              <Sparkles className="size-3 text-green-600" />
                            </div>
                            <span>Integraciones avanzadas y API</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Upgrade CTA */}
                  {userPlan === 'Gratis' && (
                    <div className="border-2 border-dashed border-[#00aa56] rounded-xl p-6 text-center bg-green-50/30">
                      <div className="bg-gradient-to-br from-[#00552b]/10 to-[#00aa56]/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="size-7 text-[#00aa56]" />
                      </div>
                      <h4 className="text-base font-bold text-[#111111] mb-2">
                        ¿Listo para crecer?
                      </h4>
                      <p className="text-sm text-[#4c4c4c] mb-4 max-w-sm mx-auto">
                        Mejora tu plan y desbloquea el potencial completo de PQ Continuum
                      </p>
                      <button
                        onClick={() => {
                          onOpenChange(false);
                          router.push('/payment');
                        }}
                        className="bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all inline-flex items-center gap-2"
                      >
                        <Sparkles className="size-4" />
                        Ver Planes
                      </button>
                    </div>
                  )}

                  {/* Manage Subscription */}
                  {userPlan !== 'Gratis' && (
                    <div className="pt-4 border-t border-black/10">
                      <button className="text-sm text-[#4c4c4c] hover:text-[#00552b] font-semibold transition-colors">
                        Gestionar mi suscripción →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
