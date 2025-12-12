"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface JobRecoveryProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that handles job recovery when the app comes back to foreground.
 * This is especially important for PWAs on iOS where the app can be suspended.
 *
 * When the app becomes visible again, it invalidates all job-related queries
 * to ensure the user sees the latest status of their generation jobs.
 */
export function JobRecoveryProvider({ children }: JobRecoveryProviderProps) {
  const queryClient = useQueryClient();
  const lastVisibleTime = useRef<number>(Date.now());
  const wasHidden = useRef<boolean>(false);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "hidden") {
      // App going to background
      wasHidden.current = true;
      lastVisibleTime.current = Date.now();
      console.log("[JobRecovery] App went to background");
    } else if (document.visibilityState === "visible" && wasHidden.current) {
      // App coming back to foreground
      wasHidden.current = false;
      const hiddenDuration = Date.now() - lastVisibleTime.current;

      console.log(`[JobRecovery] App came to foreground after ${hiddenDuration}ms`);

      // Always invalidate job queries when coming back
      queryClient.invalidateQueries({ queryKey: ["jobs"] });

      // If the app was hidden for more than 30 seconds, also refetch conversations
      // in case any jobs completed and updated messages
      if (hiddenDuration > 30000) {
        console.log("[JobRecovery] Long absence detected, refreshing conversations");
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    }
  }, [queryClient]);

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    console.log("[JobRecovery] Connection restored, refreshing jobs");
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
  }, [queryClient]);

  useEffect(() => {
    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Add online listener for when connection is restored
    window.addEventListener("online", handleOnline);

    // Initial check - if user reloaded the page, check for pending jobs
    queryClient.invalidateQueries({ queryKey: ["jobs", "pending"] });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [handleVisibilityChange, handleOnline, queryClient]);

  return <>{children}</>;
}
