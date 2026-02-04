"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  verificationApi,
  type SendPhoneVerificationRequest,
  type VerifyPhoneCodeRequest,
  type CompleteProfileRequest,
} from "@/lib/api-client";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const verificationKeys = {
  all: ["verification"] as const,
  status: () => [...verificationKeys.all, "status"] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get current verification status
 */
export function useVerificationStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: verificationKeys.status(),
    queryFn: () => verificationApi.getStatus(),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Resend email verification (via Supabase)
 */
export function useResendEmailVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => verificationApi.resendEmailVerification(),
    onSuccess: () => {
      // Invalidate status to check for updates
      queryClient.invalidateQueries({ queryKey: verificationKeys.status() });
    },
  });
}

/**
 * Send phone OTP (via Supabase)
 */
export function useSendPhoneOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendPhoneVerificationRequest) =>
      verificationApi.sendPhoneOtp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.status() });
    },
  });
}

/**
 * Verify phone OTP code
 */
export function useVerifyPhoneCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyPhoneCodeRequest) =>
      verificationApi.verifyPhoneCode(data),
    onSuccess: (result) => {
      if (result.verified) {
        queryClient.invalidateQueries({ queryKey: verificationKeys.status() });
      }
    },
  });
}

/**
 * Complete user profile
 */
export function useCompleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteProfileRequest) =>
      verificationApi.completeProfile(data),
    onSuccess: () => {
      // Invalidate verification status
      queryClient.invalidateQueries({ queryKey: verificationKeys.status() });
      // Invalidate user profile as well
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
