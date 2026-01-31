import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type SecurityEventType = 
  | 'LOGIN'
  | 'FAILED_LOGIN'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'PASSWORD_RESET'
  | 'BULK_DELETE'
  | 'PLAN_CHANGE'
  | 'INVOICE_GENERATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_DELETED'
  | 'RECEIPT_UPLOADED'
  | 'RECEIPT_DELETED'
  | 'SETTINGS_CHANGED'
  | 'RATE_LIMIT_HIT';

interface SecurityLogDetails {
  [key: string]: any;
}

export function useSecurityLogger() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logEvent = useMutation({
    mutationFn: async ({
      eventType,
      details,
      userId,
    }: {
      eventType: SecurityEventType;
      details?: SecurityLogDetails;
      userId?: string;
    }) => {
      // Get user agent and attempt to get IP (will be null on client-side)
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

      const { error } = await supabase.from('security_logs').insert({
        user_id: userId || user?.id || null,
        event_type: eventType,
        user_agent: userAgent,
        details: details || {},
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-logs'] });
    },
  });

  return {
    logEvent,
    logLogin: (userId?: string) => 
      logEvent.mutate({ eventType: 'LOGIN', userId }),
    logFailedLogin: (email?: string, reason?: string) => 
      logEvent.mutate({ 
        eventType: 'FAILED_LOGIN', 
        details: { email, reason },
      }),
    logLogout: () => 
      logEvent.mutate({ eventType: 'LOGOUT' }),
    logSignup: (email?: string) => 
      logEvent.mutate({ eventType: 'SIGNUP', details: { email } }),
    logBulkDelete: (table: string, count: number) => 
      logEvent.mutate({ 
        eventType: 'BULK_DELETE', 
        details: { table, count } 
      }),
    logPlanChange: (from: string, to: string) => 
      logEvent.mutate({ 
        eventType: 'PLAN_CHANGE', 
        details: { from, to } 
      }),
    logInvoiceGenerated: (memberId?: string, amount?: number) =>
      logEvent.mutate({
        eventType: 'INVOICE_GENERATED',
        details: { memberId, amount },
      }),
    logRateLimitHit: (action: string) =>
      logEvent.mutate({
        eventType: 'RATE_LIMIT_HIT',
        details: { action },
      }),
  };
}

// Hook for Super Admin to view all security logs
export function useSecurityLogs() {
  return useQuery({
    queryKey: ['security-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data;
    },
  });
}
