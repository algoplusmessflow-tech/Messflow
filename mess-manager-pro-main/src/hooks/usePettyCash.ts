import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export type PettyCashType = 'refill' | 'expense';

export interface PettyCashTransaction {
  id: string;
  owner_id: string;
  amount: number;
  type: PettyCashType;
  description: string;
  balance_after: number;
  date: string;
  linked_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

export function usePettyCash() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['petty-cash', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .select('*')
        .eq('owner_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as PettyCashTransaction[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('petty-cash-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'petty_cash_transactions',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Current balance is the balance_after of the most recent transaction
  const currentBalance = transactions.length > 0 ? Number(transactions[0].balance_after) : 0;

  const addRefill = useMutation({
    mutationFn: async ({ amount, description, linkedExpenseId }: { 
      amount: number; 
      description: string;
      linkedExpenseId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const newBalance = currentBalance + amount;
      
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .insert({
          owner_id: user.id,
          amount,
          type: 'refill' as PettyCashType,
          description,
          balance_after: newBalance,
          linked_expense_id: linkedExpenseId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      toast.success('Cash added to petty cash!');
    },
    onError: (error) => {
      toast.error('Failed to add funds: ' + error.message);
    },
  });

  const addSmallExpense = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      if (amount > currentBalance) {
        throw new Error('Insufficient petty cash balance');
      }
      
      const newBalance = currentBalance - amount;
      
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .insert({
          owner_id: user.id,
          amount,
          type: 'expense' as PettyCashType,
          description,
          balance_after: newBalance,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      toast.success('Small expense recorded!');
    },
    onError: (error) => {
      toast.error('Failed to record expense: ' + error.message);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('petty_cash_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      toast.success('Transaction deleted!');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  return {
    transactions,
    currentBalance,
    isLoading,
    addRefill,
    addSmallExpense,
    deleteTransaction,
  };
}
