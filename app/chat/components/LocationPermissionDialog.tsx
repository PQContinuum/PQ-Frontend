'use client';

import { MapPin, X, AlertCircle, Navigation, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { StructuredAddress } from '@/lib/geolocation/address-types';

type LocationPermissionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  error?: string | null;
  isLoading?: boolean;
  address?: StructuredAddress | null;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  warnings?: string[];
  stage?: 'idle' | 'quick' | 'precise' | 'done';
};

export function LocationPermissionDialog({
  isOpen,
  onClose,
  onAllow,
  error,
  isLoading = false,
  address,
  quality,
  warnings = [],
  stage = 'idle',
}: LocationPermissionDialogProps) {
  const getLoadingMessage = () => {
    switch (stage) {
      case 'quick':
        return 'Obteniendo ubicación...';
      case 'precise':
        return 'Mejorando precisión con GPS...';
      default:
        return 'Obteniendo ubicación...';
    }
  };

  const qualityLabel = quality === 'excellent' ? 'Excelente'
    : quality === 'good' ? 'Buena'
    : quality === 'fair' ? 'Regular' : 'Baja';

  const qualityColor = quality === 'excellent' ? 'bg-emerald-100 text-emerald-700'
    : quality === 'good' ? 'bg-blue-100 text-blue-700'
    : quality === 'fair' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="!max-w-[400px] p-0 gap-0 overflow-hidden border-black/[0.08]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#FF8B3D]/10 flex items-center justify-center">
              <Navigation className="size-5 text-[#FF8B3D]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111]">Habilitar ubicación</h3>
              <p className="text-[12px] text-[#999]">Contexto geográfico para tus respuestas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-[#999]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          {/* Benefits */}
          {!address && (
            <div className="space-y-2 mb-5">
              {[
                { icon: MapPin, text: 'Lugares y servicios cercanos a ti' },
                { icon: Navigation, text: 'Distancias y tiempos precisos' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-50">
                  <item.icon className="size-4 text-[#FF8B3D] shrink-0" />
                  <p className="text-[13px] text-[#666]">{item.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Address result */}
          {address && (
            <div className="mb-5 p-4 bg-neutral-50 border border-black/[0.06] rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-[13px] font-semibold text-[#111]">Ubicación obtenida</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${qualityColor}`}>
                  {qualityLabel}
                </span>
              </div>

              <div className="space-y-1.5 text-[13px]">
                {address.street && (
                  <p className="text-[#666]">
                    <span className="text-[#999]">Calle:</span>{' '}
                    {[address.street, address.streetNumber].filter(Boolean).join(' ')}
                  </p>
                )}
                {address.neighborhood && (
                  <p className="text-[#666]">
                    <span className="text-[#999]">Colonia:</span> {address.neighborhood}
                  </p>
                )}
                {address.city && (
                  <p className="text-[#666]">
                    <span className="text-[#999]">Ciudad:</span>{' '}
                    {[address.city, address.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-[#bbb] mt-2 pt-2 border-t border-black/[0.06]">
                Precisión: ±{address.accuracy.toFixed(1)}m
              </p>

              {warnings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-black/[0.06]">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-yellow-600">• {w}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!address && (
            <div className="space-y-2">
              <button
                onClick={onAllow}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#FF8B3D] hover:bg-[#e67a2e] text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 text-[13px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {getLoadingMessage()}
                  </>
                ) : (
                  'Permitir acceso a ubicación'
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full text-[#999] font-medium py-2.5 px-4 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-[13px]"
              >
                Ahora no
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
