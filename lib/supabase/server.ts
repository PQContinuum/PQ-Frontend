import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

// Check if request is from production domain
async function isProductionDomain(): Promise<boolean> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  return host.endsWith("continuumai.app")
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const isProduction = await isProductionDomain()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                sameSite: "lax" as const,
                secure: isProduction,
                ...(isProduction && { domain: ".continuumai.app" }),
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "continuum-session",
      },
    }
  )
}
