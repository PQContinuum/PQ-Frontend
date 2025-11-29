'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, AlertCircle, Navigation } from 'lucide-react';

type LocationPermissionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  error?: string | null;
  isLoading?: boolean;
};

export function LocationPermissionDialog({
  isOpen,
  onClose,
  onAllow,
  error,
  isLoading = false,
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto"
            >
              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                  <X className="size-5 text-gray-600" />
                </button>

                <div className="px-8 pt-12 pb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-[#00552b] to-[#00aa56] rounded-full flex items-center justify-center mb-6"
                  >
                    <Navigation className="size-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-[#111111] text-center mb-3"
                  >
                    Habilitar ubicación
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#4c4c4c] text-center text-[15px] leading-relaxed mb-6"
                  >
                    Para ofrecerte recomendaciones culturales precisas con distancias y tiempos exactos, necesitamos acceso a tu ubicación.
                  </motion.p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                    >
                      <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 leading-relaxed">{error}</p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4 mb-8"
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
                        className="flex items-center gap-3"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-[#00552b]/10 rounded-full flex items-center justify-center">
                          <item.icon className="size-5 text-[#00552b]" />
                        </div>
                        <p className="text-sm text-[#4c4c4c]">{item.text}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={onAllow}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-[#00552b] to-[#00aa56] text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Obteniendo ubicación...
                        </span>
                      ) : (
                        'Permitir acceso a ubicación'
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="w-full text-[#4c4c4c] font-medium py-4 px-6 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Ahora no
                    </button>
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
