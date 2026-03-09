"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSession() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getSupabaseBrowserClient()
      .auth.getUser()
      .then((res: { data: { user: { email?: string } | null } }) => {
        setEmail(res.data.user?.email ?? null);
        setReady(true);
      });
  }, []);

  return { email, ready, initial: email ? email[0].toUpperCase() : null };
}
