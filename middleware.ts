import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieOptions = Parameters<NextResponse['cookies']['set']>[2];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options?: CookieOptions) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si el usuario no está autenticado y está intentando acceder a /chat
  if (!user && request.nextUrl.pathname.startsWith('/chat')) {
    const redirectUrl = new URL('/auth', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Si el usuario está autenticado y está en /auth, redirigir a /chat
  if (user && request.nextUrl.pathname === '/auth') {
    const redirectUrl = new URL('/chat', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
