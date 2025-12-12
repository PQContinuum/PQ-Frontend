import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key.
 * This client has elevated permissions and should only be used in
 * server-side code that doesn't have a user session (like webhooks).
 *
 * WARNING: Never expose this client to the browser or client-side code.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Supabase URL is not configured. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Supabase service role key is not configured. Please set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
