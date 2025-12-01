'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, AlertCircle, Navigation, CheckCircle2 } from 'lucide-react';
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
}: LocationPermissionDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:px-6 md:py-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[95vh] overflow-y-auto pointer-events-auto"
            >
              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                  <X className="size-4 sm:size-5 text-gray-600" />
                </button>

                <div className="px-4 sm:px-6 md:px-8 pt-10 sm:pt-12 pb-6 sm:pb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#00552b] to-[#00aa56] rounded-full flex items-center justify-center mb-4 sm:mb-6"
                  >
                    <Navigation className="size-8 sm:size-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl font-bold text-[#111111] text-center mb-2 sm:mb-3"
                  >
                    Habilitar ubicación
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#4c4c4c] text-center text-sm sm:text-[15px] leading-relaxed mb-4 sm:mb-6 px-2"
                  >
                    Para ofrecerte recomendaciones culturales precisas con distancias y tiempos exactos, necesitamos acceso a tu ubicación.
                  </motion.p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 sm:gap-3"
                    >
                      <AlertCircle className="size-4 sm:size-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-red-800 leading-relaxed">{error}</p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 sm:space-y-4 mb-6 sm:mb-8"
                  >
                    {[
                      { icon: MapPin, text: 'Lugares culturales cercanos a ti' },
                      { icon: Navigation, text: 'Distancias y tiempos precisos' },
                      { icon: MapPin, text: 'Mapa interactivo con tu ubicación' },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center gap-2 sm:gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[#00552b]/10 rounded-full flex items-center justify-center">
                          <item.icon className="size-4 sm:size-5 text-[#00552b]" />
                        </div>
                        <p className="text-xs sm:text-sm text-[#4c4c4c]">{item.text}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Address Display (when available) */}
                  {address && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                        <CheckCircle2 className="size-4 sm:size-5 text-green-600" />
                        <span className="text-sm sm:text-base font-semibold text-green-900">
                          Ubicación obtenida
                        </span>
                        <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full ${
                          quality === 'excellent' ? 'bg-green-200 text-green-900' :
                          quality === 'good' ? 'bg-blue-200 text-blue-900' :
                          quality === 'fair' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-red-200 text-red-900'
                        }`}>
                          {quality === 'excellent' ? 'Excelente' :
                           quality === 'good' ? 'Buena' :
                           quality === 'fair' ? 'Regular' : 'Baja'}
                        </span>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        {address.street && (
                          <div className="flex flex-wrap">
                            <span className="text-green-700 font-medium">Calle: </span>
                            <span className="text-gray-800 ml-1">
                              {[address.street, address.streetNumber].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        )}
                        {address.neighborhood && (
                          <div className="flex flex-wrap">
                            <span className="text-green-700 font-medium">Colonia: </span>
                            <span className="text-gray-800 ml-1">{address.neighborhood}</span>
                          </div>
                        )}
                        {address.city && (
                          <div className="flex flex-wrap">
                            <span className="text-green-700 font-medium">Ciudad: </span>
                            <span className="text-gray-800 ml-1">
                              {[address.city, address.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="pt-1.5 sm:pt-2 border-t border-green-200">
                          <span className="text-[10px] sm:text-xs text-green-700">
                            Precisión: ±{address.accuracy.toFixed(1)}m
                          </span>
                        </div>
                      </div>

                      {warnings.length > 0 && (
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-green-200">
                          <p className="text-[10px] sm:text-xs font-semibold text-yellow-700 mb-1">
                            ⚠️ Advertencias:
                          </p>
                          <ul className="text-[10px] sm:text-xs text-yellow-700 space-y-0.5">
                            {warnings.map((warning, i) => (
                              <li key={i}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    {!address && (
                      <>
                        <button
                          onClick={onAllow}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 04 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Obteniendo ubicación precisa...
                            </span>
                          ) : (
                            'Permitir acceso a ubicación'
                          )}
                        </button>
                        <button
                          onClick={onClose}
                          disabled={isLoading}
                          className="w-full text-[#4c4c4c] font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
                        >
                          Ahora no
                        </button>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
