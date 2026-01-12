import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.continuumai.llc/api/v1';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.session?.access_token) {
      try {
        // Llamar al backend externo para sincronizar usuario y obtener plan
        // GET /users/me crea el usuario si no existe y devuelve el plan
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();

          // Si es Free o no tiene subscription activa, redirigir a payment
          if (!userData.hasActiveSubscription || userData.planName === 'Free') {
            return NextResponse.redirect(`${origin}/payment`);
          }
        }
      } catch (error) {
        console.error('Error syncing user with backend:', error);
        // En caso de error, redirigir a payment por seguridad
        return NextResponse.redirect(`${origin}/payment`);
      }
    }
  }

  // Usuario con subscription activa → ir a chat
  return NextResponse.redirect(`${origin}/chat`);
}
