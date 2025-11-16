'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    sessionId ? 'loading' : 'error'
  );
  const [sessionData, setSessionData] = useState<{
    status: string | null;
    customer_email: string | null;
    payment_status: string | null;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/session-status?session_id=${sessionId}`);
        const data = await response.json();

        if (data.error) {
          setStatus('error');
          return;
        }

        setSessionData(data);

        if (data.status === 'complete' && data.payment_status === 'paid') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setStatus('error');
      }
    };

    checkSession();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      {/* Background grid pattern */}
      <div className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,rgba(0,85,43,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,85,43,0.1)_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_300px,rgba(0,85,43,0.1),transparent)]"></div>
      </div>

      <Card className="relative w-full max-w-md border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00552b]/10">
                <Loader2 className="h-8 w-8 animate-spin text-[#00552b]" />
              </div>
              <CardTitle className="text-white">Verificando pago...</CardTitle>
              <CardDescription className="text-neutral-400">
                Por favor espera mientras confirmamos tu suscripción.
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00552b]/10">
                <CheckCircle2 className="h-8 w-8 text-[#00552b]" />
              </div>
              <CardTitle className="text-white">¡Pago exitoso!</CardTitle>
              <CardDescription className="text-neutral-400">
                Tu suscripción ha sido activada correctamente.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-white">Error en el pago</CardTitle>
              <CardDescription className="text-neutral-400">
                Hubo un problema al procesar tu pago. Por favor intenta nuevamente.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {status === 'success' && sessionData && (
          <CardContent className="space-y-2 text-center">
            <p className="text-sm text-neutral-400">
              Email: <span className="text-white">{sessionData.customer_email}</span>
            </p>
            <p className="text-sm text-neutral-400">
              Estado: <span className="text-[#00552b]">{sessionData.payment_status}</span>
            </p>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-2">
          {status === 'success' && (
            <>
              <Button
                onClick={() => router.push('/chat')}
                className="w-full bg-[#00552b] hover:bg-[#00552b]/90 text-white"
              >
                Ir al Chat
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/5"
              >
                Volver al inicio
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Button
                onClick={() => router.push('/payment')}
                className="w-full bg-[#00552b] hover:bg-[#00552b]/90 text-white"
              >
                Intentar nuevamente
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/5"
              >
                Volver al inicio
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-white">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#00552b]" />
            <span>Verificando pago...</span>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
