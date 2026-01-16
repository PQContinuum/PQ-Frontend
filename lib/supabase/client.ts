import { createBrowserClient } from "@supabase/ssr"

// Singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Check if we're running on production (continuumai.app domain)
function isProductionDomain(): boolean {
  if (typeof window === "undefined") return false
  return window.location.hostname.endsWith("continuumai.app")
}

// Get cookie domain based on environment
function getCookieDomain(): string | undefined {
  // Only set cross-subdomain cookie on production
  if (isProductionDomain()) {
    return ".continuumai.app"
  }
  // On localhost/dev, don't set domain (use default)
  return undefined
}

export function getSupabaseBrowserClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const cookieDomain = getCookieDomain()
  const isProduction = isProductionDomain()

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "continuum-session",
        storage: {
          getItem: (key) => {
            if (typeof document === "undefined") return null
            const cookies = document.cookie.split("; ")
            const cookie = cookies.find((c) => c.startsWith(`${key}=`))
            if (!cookie) return null
            return decodeURIComponent(cookie.split("=")[1])
          },
          setItem: (key, value) => {
            if (typeof document === "undefined") return
            const maxAge = 60 * 60 * 24 * 365 // 1 year
            let cookieString = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`

            if (cookieDomain) {
              cookieString += `; domain=${cookieDomain}`
            }
            if (isProduction) {
              cookieString += "; Secure"
            }

            document.cookie = cookieString
          },
          removeItem: (key) => {
            if (typeof document === "undefined") return
            let cookieString = `${key}=; path=/; max-age=0; SameSite=Lax`

            if (cookieDomain) {
              cookieString += `; domain=${cookieDomain}`
            }
            if (isProduction) {
              cookieString += "; Secure"
            }

            document.cookie = cookieString
          },
        },
      },
    }
  )

  return supabaseClient
}

// For backward compatibility
export const createSupabaseBrowserClient = getSupabaseBrowserClient
