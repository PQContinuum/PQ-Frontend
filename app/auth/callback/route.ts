import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getRequestHost, getRequestOrigin, isContinuumHost } from "@/lib/request"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.continuumai.llc/api/v1'

// Check if request is from production domain
function isProductionDomain(request: Request): boolean {
  const host = getRequestHost(request.headers)
  if (host) {
    return isContinuumHost(host)
  }
  const url = new URL(request.url)
  return isContinuumHost(url.hostname)
}

export async function GET(request: Request) {
  const fallbackUrl = new URL(request.url)
  const { searchParams } = fallbackUrl
  const origin = getRequestOrigin(request.headers) ?? fallbackUrl.origin
  const code = searchParams.get("code")
  const isProduction = isProductionDomain(request)

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                sameSite: "lax" as const,
                secure: isProduction,
                ...(isProduction && { domain: ".continuumai.app" }),
              }
              cookieStore.set(name, value, cookieOptions)
            })
          },
        },
        auth: {
          persistSession: true,
          storageKey: "continuum-session",
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session?.access_token) {
      try {
        // Llamar al backend externo para sincronizar usuario y obtener plan
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userData = await response.json()

          // Si tiene subscription activa y NO es Free, ir a chat
          if (userData.hasActiveSubscription && userData.planName !== 'Free') {
            return NextResponse.redirect(`${origin}/chat`)
          }
        }

        // Usuario nuevo, sin subscription, Free, o error del backend → payment
        return NextResponse.redirect(`${origin}/payment`)
      } catch (error) {
        console.error('Error syncing user with backend:', error)
        return NextResponse.redirect(`${origin}/payment`)
      }
    }
  }

  // Return to auth with error
  return NextResponse.redirect(`${origin}/auth?error=auth`)
}
