import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { needsPayment, createFreeSubscription } from '@/lib/subscription';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Si es un nuevo usuario, crear subscription Free por defecto
    if (data?.user) {
      await createFreeSubscription(data.user.id);

      // Verificar si necesita pagar
      const needsPay = await needsPayment(data.user.id);

      if (needsPay) {
        // Usuario nuevo o Free → ir a payment
        return NextResponse.redirect(`${origin}/payment`);
      }
    }
  }

  // Usuario con subscription activa → ir a chat
  return NextResponse.redirect(`${origin}/chat`);
}
