'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Loader2,
  Check,
  ExternalLink,
  X,
  Shield,
  MessageSquareText,
  FileText,
  ImageIcon,
  Video,
  Globe,
  Mic,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const features = [
  { icon: MessageSquareText, label: 'Chat Inteligente', color: '#FF8B3D' },
  { icon: FileText, label: 'Análisis de Documentos', color: '#3B82F6' },
  { icon: ImageIcon, label: 'Generación de Imágenes', color: '#8B5CF6' },
  { icon: Video, label: 'Creación de Video', color: '#10B981' },
  { icon: Globe, label: 'Análisis Web y Redes', color: '#06B6D4' },
  { icon: Mic, label: 'Audio y Narración', color: '#EC4899' },
];

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleTermsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledTerms(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (isSignUp && !acceptedTerms) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad para crear tu cuenta.');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error en Google OAuth:', error);
      setError('Error al autenticar con Google. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f6f6] to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl"
      >
        {/* PANEL IZQUIERDO */}
        <div className="flex w-full flex-col justify-between p-8 lg:w-[55%] lg:p-10">
          {/* Sección superior */}
          <div>
            {/* Logo */}
            <div className="mb-8">
              <Image
                src="/apple-touch-icon.png"
                alt="Continuum AI"
                width={48}
                height={48}
                className="rounded-xl"
              />
            </div>

            {/* Título */}
            <h1 className="mb-2 text-2xl font-bold text-[#111111]">
              {isSignUp ? 'Crea tu cuenta' : 'Inicia sesión para acceder a Continuum AI'}
            </h1>
            <p className="mb-8 text-sm text-[#666]">
              {isSignUp
                ? 'Regístrate para empezar a crear'
                : 'Tu plataforma de IA multimodal'}
            </p>

            {/* Mensajes de error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            {/* Botón de Google */}
            <div className="relative">
              <span className="absolute -top-2.5 right-3 z-10 rounded-full bg-[#FF8B3D]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#FF8B3D]">
                Último usado
              </span>
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || (isSignUp && !acceptedTerms)}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-black/10 bg-white py-3.5 font-medium text-[#111111] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-[#4c4c4c]" />
                ) : (
                  <svg className="size-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {loading ? 'Conectando...' : 'Continuar con Google'}
              </motion.button>
            </div>

            {/* Checkbox de Términos y Condiciones (solo en signup) */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 overflow-hidden"
                >
                  <div
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      acceptedTerms
                        ? 'border-[#FF8B3D]/30 bg-[#FF8B3D]/5'
                        : 'border-black/10 bg-gray-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAcceptedTerms(!acceptedTerms)}
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                        acceptedTerms
                          ? 'border-[#FF8B3D] bg-[#FF8B3D]'
                          : 'border-gray-300 bg-white hover:border-[#FF8B3D]/50'
                      }`}
                    >
                      <AnimatePresence>
                        {acceptedTerms && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <Check className="size-3.5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                    <label className="text-xs leading-relaxed text-[#4c4c4c]">
                      He leído y acepto los{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="inline-flex items-center gap-0.5 font-semibold text-[#FF8B3D] underline decoration-[#FF8B3D]/30 underline-offset-2 transition-colors hover:text-[#FF8B3D]/80 hover:decoration-[#FF8B3D]/60"
                      >
                        Términos de Servicio
                        <ExternalLink className="size-3" />
                      </button>{' '}
                      y la{' '}
                      <a
                        href="/legal/privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-semibold text-[#FF8B3D] underline decoration-[#FF8B3D]/30 underline-offset-2 transition-colors hover:text-[#FF8B3D]/80 hover:decoration-[#FF8B3D]/60"
                      >
                        Política de Privacidad
                        <ExternalLink className="size-3" />
                      </a>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle entre login/signup */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setAcceptedTerms(false);
                }}
                disabled={loading}
                className="text-sm text-[#FF8B3D] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSignUp ? (
                  <>
                    ¿Ya tienes cuenta? <span className="font-semibold">Inicia sesión</span>
                  </>
                ) : (
                  <>
                    ¿No tienes cuenta? <span className="font-semibold">Regístrate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Texto legal inferior */}
          <p className="mt-8 text-center text-xs text-[#999]">
            Al continuar, aceptas nuestros{' '}
            <a
              href="/legal/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-[#666]"
            >
              Términos de Servicio
            </a>
            {' '}y{' '}
            <a
              href="/legal/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-[#666]"
            >
              Política de Privacidad
            </a>
            .
          </p>
        </div>

        {/* PANEL DERECHO - oculto en móvil */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-center bg-[#111111] p-10 text-white rounded-r-2xl">
          {/* Logo + Marca */}
          <div className="mb-6 flex items-center gap-3">
            <Logo className="size-10 text-[#FF8B3D]" />
            <div>
              <h2 className="text-xl font-bold">Continuum AI</h2>
              <p className="text-sm italic text-white/60">Razona en continuo</p>
            </div>
          </div>

          <p className="mb-8 text-sm leading-relaxed text-white/70">
            La única plataforma de IA multimodal que necesitas — chat, documentos, imágenes, video y audio en un solo flujo.
          </p>

          <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-white/40">
            Incluye
          </p>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${f.color}20` }}
                >
                  <f.icon className="size-4" style={{ color: f.color }} />
                </div>
                <span className="text-sm font-medium text-white/90">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Modal de Términos y Condiciones */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowTermsModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF8B3D]/10">
                    <Shield className="size-5 text-[#FF8B3D]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111111]">Términos de Servicio</h2>
                    <p className="text-xs text-[#4c4c4c]">Continuum AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-[#4c4c4c] transition-colors hover:bg-gray-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div
                className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-[#4c4c4c]"
                onScroll={handleTermsScroll}
              >
                <div className="space-y-4">
                  <p className="font-semibold text-[#111111]">
                    Última actualización: Marzo 2026
                  </p>

                  <p>
                    Bienvenido a Continuum AI. Al acceder y utilizar nuestros servicios, aceptas estar
                    sujeto a los siguientes términos y condiciones. Por favor, léelos cuidadosamente.
                  </p>

                  <h3 className="font-semibold text-[#111111]">1. Aceptación de los Términos</h3>
                  <p>
                    Al registrarte y usar Continuum AI, aceptas cumplir con estos Términos de Servicio,
                    nuestra Política de Privacidad y cualquier política adicional que publiquemos. Si no
                    estás de acuerdo con alguno de estos términos, no debes usar nuestros servicios.
                  </p>

                  <h3 className="font-semibold text-[#111111]">2. Descripción del Servicio</h3>
                  <p>
                    Continuum AI proporciona herramientas de inteligencia artificial para la generación de
                    contenido, incluyendo texto, imágenes, video y audio. Los servicios están sujetos a
                    cambios y actualizaciones sin previo aviso.
                  </p>

                  <h3 className="font-semibold text-[#111111]">3. Cuenta de Usuario</h3>
                  <p>
                    Eres responsable de mantener la seguridad de tu cuenta. Notifícanos
                    inmediatamente de cualquier uso no autorizado de tu cuenta.
                  </p>

                  <h3 className="font-semibold text-[#111111]">4. Uso Aceptable</h3>
                  <p>
                    Te comprometes a no usar nuestros servicios para actividades ilegales, generar contenido
                    dañino, infringir derechos de propiedad intelectual, o cualquier propósito que viole
                    las leyes aplicables.
                  </p>

                  <h3 className="font-semibold text-[#111111]">5. Propiedad Intelectual</h3>
                  <p>
                    El contenido generado usando nuestras herramientas está sujeto a nuestras políticas de
                    uso. Continuum AI retiene todos los derechos sobre la plataforma, marca y tecnología
                    subyacente.
                  </p>

                  <h3 className="font-semibold text-[#111111]">6. Pagos y Suscripciones</h3>
                  <p>
                    Los planes de suscripción se facturan de acuerdo con el plan seleccionado. Las
                    cancelaciones surten efecto al final del período de facturación actual.
                  </p>

                  <h3 className="font-semibold text-[#111111]">7. Limitación de Responsabilidad</h3>
                  <p>
                    Continuum AI no será responsable por daños indirectos, incidentales o consecuentes
                    derivados del uso de nuestros servicios. Nuestros servicios se proporcionan &quot;tal cual&quot;
                    sin garantías de ningún tipo.
                  </p>

                  <h3 className="font-semibold text-[#111111]">8. Privacidad</h3>
                  <p>
                    Tu privacidad es importante para nosotros. Consulta nuestra{' '}
                    <a
                      href="/legal/privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#FF8B3D] underline"
                    >
                      Política de Privacidad
                    </a>{' '}
                    para obtener información sobre cómo recopilamos, usamos y protegemos tus datos
                    personales.
                  </p>

                  <h3 className="font-semibold text-[#111111]">9. Modificaciones</h3>
                  <p>
                    Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
                    serán notificados a través de nuestra plataforma o por correo electrónico.
                  </p>

                  <h3 className="font-semibold text-[#111111]">10. Contacto</h3>
                  <p>
                    Para preguntas sobre estos términos, contáctanos en{' '}
                    <span className="font-semibold text-[#FF8B3D]">soporte@continuumai.llc</span>
                  </p>

                  <div className="rounded-lg border border-[#FF8B3D]/20 bg-[#FF8B3D]/5 p-4 text-center">
                    <p className="text-xs text-[#4c4c4c]">
                      Para ver los términos completos, visita{' '}
                      <a
                        href="/legal/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#FF8B3D] underline"
                      >
                        nuestra página de términos
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer del modal con indicador de scroll */}
              <div className="border-t border-black/10 px-6 py-4">
                {!hasScrolledTerms && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-3 text-center text-xs text-amber-600"
                  >
                    Desplázate hasta el final para poder aceptar
                  </motion.p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="flex-1 rounded-lg border border-black/10 py-2.5 text-sm font-medium text-[#4c4c4c] transition-colors hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  <motion.button
                    onClick={() => {
                      setAcceptedTerms(true);
                      setShowTermsModal(false);
                      setError(null);
                    }}
                    disabled={!hasScrolledTerms}
                    whileHover={{ scale: hasScrolledTerms ? 1.02 : 1 }}
                    whileTap={{ scale: hasScrolledTerms ? 0.98 : 1 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF8B3D] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF8B3D]/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="size-4" />
                    Acepto los términos
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
