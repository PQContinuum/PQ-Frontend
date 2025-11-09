'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/chat`,
          },
        });

        if (error) throw error;

        setMessage(
          '¡Cuenta creada! Revisa tu email para confirmar tu dirección de correo.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/chat');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;

      // Debug: Mostrar la URL de redirect en consola
      console.log('🔍 DEBUG - Redirect URL:', redirectUrl);
      console.log('🔍 DEBUG - Origin:', window.location.origin);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      // Debug: Mostrar la URL OAuth generada
      if (data?.url) {
        console.log('🔍 DEBUG - OAuth URL generada:', data.url);
      }

      if (error) throw error;
    } catch (err: any) {
      console.error('❌ Error en Google OAuth:', err);
      setError(err.message || 'Error al autenticar con Google');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f6f6] to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-xl">
          {/* Logo y título */}
          <div className="mb-8 text-center">
            <motion.div
              className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-[#00552b]/10"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/logo.png"
                alt="PQ Logo"
                width={60}
                height={60}
                className="size-16"
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#111111]">
              {isSignUp ? 'Crear cuenta' : 'Bienvenido de nuevo'}
            </h1>
            <p className="mt-2 text-sm text-[#4c4c4c]">
              {isSignUp
                ? 'Regístrate para empezar a usar PQ Continuum'
                : 'Inicia sesión en tu cuenta'}
            </p>
          </div>

          {/* Mensajes de error/éxito */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600"
            >
              {message}
            </motion.div>
          )}

          {/* Formulario */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[#111111]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#4c4c4c]" />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-lg border border-black/10 bg-white py-3 pl-11 pr-4 text-[#111111] placeholder:text-[#4c4c4c]/40 focus:border-[#00552b] focus:outline-none focus:ring-2 focus:ring-[#00552b]/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[#111111]"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#4c4c4c]" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-black/10 bg-white py-3 pl-11 pr-4 text-[#111111] placeholder:text-[#4c4c4c]/40 focus:border-[#00552b] focus:outline-none focus:ring-2 focus:ring-[#00552b]/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {isSignUp && (
                <p className="mt-1.5 text-xs text-[#4c4c4c]">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full rounded-lg bg-[#00552b] py-3 font-semibold text-white transition-colors hover:bg-[#00552b]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  Procesando...
                </span>
              ) : isSignUp ? (
                'Crear cuenta'
              ) : (
                'Iniciar sesión'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-black/10"></div>
            <span className="px-4 text-xs text-[#4c4c4c]">O continúa con</span>
            <div className="flex-1 border-t border-black/10"></div>
          </div>

          {/* Google OAuth Button */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-black/10 bg-white py-3 font-medium text-[#111111] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
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
            Continuar con Google
          </motion.button>

          {/* Toggle entre login/signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              disabled={loading}
              className="text-sm text-[#00552b] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-[#4c4c4c]">
          Al continuar, aceptas nuestros Términos de Servicio y Política de
          Privacidad
        </p>
      </motion.div>
    </div>
  );
}
