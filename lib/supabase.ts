import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
};

export const createSupabaseBrowserClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
};

export const createSupabaseServerClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        const mutableCookies = cookies() as unknown as {
          set: (name: string, value: string, options?: Record<string, unknown>) => void;
        };

        cookiesToSet.forEach(({ name, value, options }) => {
          mutableCookies.set(name, value, options);
        });
      },
    },
  });
};
