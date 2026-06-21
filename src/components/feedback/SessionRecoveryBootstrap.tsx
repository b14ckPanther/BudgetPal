/**
 * Bootstraps session recovery with router, query client, and toast.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useFeedback } from '@/components/feedback';
import { configureSessionRecovery, resetSessionRecoveryGuard } from '@/lib/sessionRecovery';

export function SessionRecoveryBootstrap() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useFeedback();

  useEffect(() => {
    configureSessionRecovery({ router, queryClient, toast });
    return () => {
      resetSessionRecoveryGuard();
    };
  }, [router, queryClient, toast]);

  return null;
}
