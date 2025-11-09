import { createBrowserClient } from "@supabase/ssr";

const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { url, anonKey };
};

export const createSupabaseBrowserClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
};
