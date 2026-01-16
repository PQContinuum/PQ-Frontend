// Only re-export client functions to avoid importing next/headers in client components
export { createSupabaseBrowserClient, getSupabaseBrowserClient } from "./supabase/client";

// For server-side imports, use: import { createSupabaseServerClient } from "@/lib/supabase/server";
