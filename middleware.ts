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

  // Si el usuario está autenticado y está en / o /auth, redirigir a /chat
  if (user && (request.nextUrl.pathname === '/auth' || request.nextUrl.pathname === '/')) {
    const redirectUrl = new URL('/chat', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
