import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { useEffect } from 'react';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseCategory = Database['public']['Enums']['expense_category'];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

export function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const addExpense = useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, 'owner_id'> & { file_size_bytes?: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({ 
          ...expense, 
          owner_id: user.id,
          file_size_bytes: expense.file_size_bytes || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added!');
    },
    onError: (error) => {
      toast.error('Failed to add expense: ' + error.message);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated!');
    },
    onError: (error) => {
      toast.error('Failed to update expense: ' + error.message);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted!');
    },
    onError: (error) => {
      toast.error('Failed to delete expense: ' + error.message);
    },
  });

  // Today's expenses
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const todayExpenses = expenses
    .filter((e) => {
      const expDate = new Date(e.date);
      return expDate >= todayStart && expDate <= todayEnd;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // This month's expenses
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  const monthlyExpenses = expenses
    .filter((e) => {
      const expDate = new Date(e.date);
      return expDate >= monthStart && expDate <= monthEnd;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Weekly data for chart
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const weeklyExpenses = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(weekEnd, 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const amount = expenses
      .filter((e) => {
        const expDate = new Date(e.date);
        return expDate >= dayStart && expDate <= dayEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      amount,
    };
  });

  // Category breakdown for this month
  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat.label,
    amount: expenses
      .filter((e) => {
        const expDate = new Date(e.date);
        return e.category === cat.value && expDate >= monthStart && expDate <= monthEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0),
  })).filter((c) => c.amount > 0);

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    todayExpenses,
    monthlyExpenses,
    weeklyExpenses,
    categoryBreakdown,
  };
}
