'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { JobRecoveryProvider } from './job-recovery-provider';
import { ProfileVerificationProvider } from './profile-verification-provider';

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 10, // 10 minutos - cache más agresivo
            gcTime: 1000 * 60 * 30, // 30 minutos - mantener en memoria más tiempo
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // No refetch si hay datos en cache
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileVerificationProvider>
        <JobRecoveryProvider>
          {children}
        </JobRecoveryProvider>
      </ProfileVerificationProvider>
    </QueryClientProvider>
  );
}
