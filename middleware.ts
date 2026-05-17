import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getRequestHost, isContinuumHost } from "@/lib/request"

// Check if request is from production domain
function isProductionDomain(request: NextRequest): boolean {
  const host = getRequestHost(request.headers)
  return isContinuumHost(host)
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const isProduction = isProductionDomain(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              sameSite: "lax" as const,
              secure: isProduction,
              ...(isProduction && { domain: ".continuumai.app" }),
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "continuum-session",
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedRoutes = ['/chat', '/payment']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Si el usuario no está autenticado y está intentando acceder a rutas protegidas
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/auth', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario está autenticado y está en /auth, verificar suscripción
  // Nota: NO redirigir desde / para evitar loop con /payment back button
  if (user && request.nextUrl.pathname === '/auth') {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.continuumai.llc/api/v1'
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userData = await response.json()
          // Basic is the free access tier; no paid Stripe subscription required.
          if (userData.hasActiveSubscription || userData.planName === 'Basic') {
            return NextResponse.redirect(new URL('/chat', request.url))
          }
        }
      }

      return NextResponse.redirect(new URL('/chat', request.url))
    } catch {
      // En caso de error de red, dejar pasar a /chat como fallback
      return NextResponse.redirect(new URL('/chat', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
