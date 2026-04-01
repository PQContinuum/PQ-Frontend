'use client';

import { useAccountStats } from '@/hooks/use-account-stats';
import { Clock, Zap, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';

export function TrialBanner() {
  const { data: stats } = useAccountStats();
  const [dismissed, setDismissed] = useState(false);

  const trialInfo = useMemo(() => {
    if (!stats?.subscription) return null;

    const { status, currentPeriodEnd } = stats.subscription;

    // Only show for trialing users
    if (status !== 'trialing' || !currentPeriodEnd) return null;

    const endDate = new Date(currentPeriodEnd);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
    const totalTrialDays = 7;
    const daysUsed = totalTrialDays - Math.max(0, daysRemaining);
    const progress = Math.min(100, (daysUsed / totalTrialDays) * 100);

    return {
      daysRemaining: Math.max(0, daysRemaining),
      hoursRemaining: Math.max(0, hoursRemaining),
      progress,
      isExpired: diffMs <= 0,
      isUrgent: daysRemaining <= 2,
    };
  }, [stats]);

  // No subscription or not trialing
  if (!trialInfo || dismissed) return null;

  // Trial expired
  if (trialInfo.isExpired) {
    return (
      <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-r from-[#FF8B3D] to-[#e67a2e] p-4 shadow-lg shadow-[#FF8B3D]/20 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-white/20 backdrop-blur-sm">
            <Zap className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Tu prueba gratuita ha terminado
            </p>
            <p className="text-xs text-white/80 mt-0.5">
              Activa tu plan Basic para seguir creando
            </p>
          </div>
          <Link
            href="/payment"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-[#FF8B3D] text-xs font-bold rounded-full hover:bg-white/90 transition-all hover:scale-105 shadow-md"
          >
            Activar plan
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Active trial
  const timeLabel = trialInfo.daysRemaining <= 1
    ? `${trialInfo.hoursRemaining}h restantes`
    : `${trialInfo.daysRemaining} días restantes`;

  return (
    <div className="mx-3 mt-3 animate-in slide-in-from-top-2 duration-300">
      <div className={`relative overflow-hidden rounded-2xl p-3.5 border transition-all ${
        trialInfo.isUrgent
          ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200/60'
          : 'bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-amber-200/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center size-9 rounded-xl shrink-0 ${
            trialInfo.isUrgent
              ? 'bg-red-500/10'
              : 'bg-[#FF8B3D]/10'
          }`}>
            <Clock className={`size-4.5 ${
              trialInfo.isUrgent ? 'text-red-500' : 'text-[#FF8B3D]'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs font-semibold text-gray-800">
                Prueba gratuita
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                trialInfo.isUrgent
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-[#FF8B3D]/10 text-[#FF8B3D]'
              }`}>
                {timeLabel}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  trialInfo.isUrgent
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-[#FF8B3D] to-[#e67a2e]'
                }`}
                style={{ width: `${trialInfo.progress}%` }}
              />
            </div>
          </div>

          <Link
            href="/payment"
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all hover:scale-105 ${
              trialInfo.isUrgent
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#FF8B3D] text-white hover:bg-[#e67a2e]'
            }`}
          >
            Elegir plan
            <ArrowRight className="size-3" />
          </Link>

          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="size-3 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
