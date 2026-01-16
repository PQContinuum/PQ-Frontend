import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.continuumai.llc/api/v1'

// Check if request is from production domain
function isProductionDomain(request: Request): boolean {
  const url = new URL(request.url)
  return url.hostname.endsWith("continuumai.app")
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
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

          // Si es Free o no tiene subscription activa, redirigir a payment
          if (!userData.hasActiveSubscription || userData.planName === 'Free') {
            return NextResponse.redirect(`${origin}/payment`)
          }
        }
      } catch (error) {
        console.error('Error syncing user with backend:', error)
        return NextResponse.redirect(`${origin}/payment`)
      }

      // Usuario con subscription activa → ir a chat
      return NextResponse.redirect(`${origin}/chat`)
    }
  }

  // Return to auth with error
  return NextResponse.redirect(`${origin}/auth?error=auth`)
}
