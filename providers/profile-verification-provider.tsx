"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { ProfileVerificationModal } from "@/components/verification";
import { useVerificationStatus } from "@/hooks/use-verification";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ============================================================================
// CONTEXT
// ============================================================================

interface ProfileVerificationContextValue {
  /** Whether verification is required */
  isRequired: boolean;
  /** Whether status is loading */
  isLoading: boolean;
  /** Open the verification modal */
  openVerification: () => void;
  /** Close the verification modal */
  closeVerification: () => void;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Check if profile needs verification (useful after API errors) */
  checkVerification: () => void;
}

const ProfileVerificationContext = createContext<
  ProfileVerificationContextValue | undefined
>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface ProfileVerificationProviderProps {
  children: ReactNode;
}

export function ProfileVerificationProvider({
  children,
}: ProfileVerificationProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Only fetch status when authenticated
  const { data: status, isLoading: isStatusLoading, refetch } = useVerificationStatus({
    enabled: isAuthenticated,
  });

  // Check auth state
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
      // Refetch status on auth change
      if (session) {
        refetch();
      }
    });

    return () => subscription.unsubscribe();
  }, [refetch]);

  // Determine if verification is required
  const isLoading = !authChecked || (isAuthenticated && isStatusLoading);
  const isRequired = isAuthenticated && !isLoading && status ? !status.profileCompleted : false;

  // Auto-open modal if profile is not complete and user is authenticated
  useEffect(() => {
    if (isRequired && !isOpen && !isLoading) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isRequired, isOpen, isLoading]);

  const openVerification = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeVerification = useCallback(() => {
    setIsOpen(false);
  }, []);

  const checkVerification = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleComplete = useCallback(() => {
    setIsOpen(false);
    // Refetch to update status
    refetch();
  }, [refetch]);

  const value: ProfileVerificationContextValue = {
    isRequired,
    isLoading,
    openVerification,
    closeVerification,
    isOpen,
    checkVerification,
  };

  return (
    <ProfileVerificationContext.Provider value={value}>
      {children}
      <ProfileVerificationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onComplete={handleComplete}
        required={isRequired}
      />
    </ProfileVerificationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useProfileVerification() {
  const context = useContext(ProfileVerificationContext);
  if (!context) {
    throw new Error(
      "useProfileVerification must be used within a ProfileVerificationProvider"
    );
  }
  return context;
}
