import { useMemo } from 'react';
import { useExpenses, EXPENSE_CATEGORIES } from '@/hooks/useExpenses';
import { useTransactions } from '@/hooks/useTransactions';
import { usePettyCash } from '@/hooks/usePettyCash';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface CostAlert {
  id: string;
  type: 'spending_spike' | 'frequent_repairs' | 'unnecessary_expense';
  severity: 'warning' | 'info';
  title: string;
  message: string;
  category?: string;
  percentageOver?: number;
}

export function useBusinessIntelligence() {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { transactions: pettyCashTransactions } = usePettyCash();

  const isLoading = expensesLoading || transactionsLoading;

  const alerts = useMemo(() => {
    if (isLoading) return [];
    
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    // Get last 3 months for averaging
    const months = [1, 2, 3].map(i => ({
      start: startOfMonth(subMonths(today, i)),
      end: endOfMonth(subMonths(today, i)),
    }));

    const alerts: CostAlert[] = [];

    // Current month's total revenue
    const currentMonthRevenue = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'payment' && date >= currentMonthStart && date <= currentMonthEnd;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate category spending analysis
    EXPENSE_CATEGORIES.forEach(category => {
      // Current month spending for this category
      const currentMonthSpend = expenses
        .filter(e => {
          const date = new Date(e.date);
          return e.category === category.value && date >= currentMonthStart && date <= currentMonthEnd;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      // Average of last 3 months
      const monthlySpends = months.map(month => 
        expenses
          .filter(e => {
            const date = new Date(e.date);
            return e.category === category.value && date >= month.start && date <= month.end;
          })
          .reduce((sum, e) => sum + Number(e.amount), 0)
      );

      const avgMonthlySpend = monthlySpends.reduce((a, b) => a + b, 0) / 3;

      // If current spend > avg * 1.15 (15% threshold)
      if (avgMonthlySpend > 0 && currentMonthSpend > avgMonthlySpend * 1.15) {
        const percentageOver = Math.round(((currentMonthSpend - avgMonthlySpend) / avgMonthlySpend) * 100);
        alerts.push({
          id: `spending-${category.value}`,
          type: 'spending_spike',
          severity: 'warning',
          title: `${category.label} Spend Alert`,
          message: `${category.label} spending is ${percentageOver}% higher than usual this month.`,
          category: category.label,
          percentageOver,
        });
      }
    });

    // Check for frequent repairs in the current week
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const repairEntries = expenses.filter(e => {
      const date = new Date(e.date);
      return e.category === 'maintenance' && date >= oneWeekAgo;
    });

    if (repairEntries.length >= 4) {
      alerts.push({
        id: 'frequent-repairs',
        type: 'frequent_repairs',
        severity: 'warning',
        title: 'Frequent Repairs Detected',
        message: `${repairEntries.length} repair/maintenance entries logged this week. Investigation suggested.`,
      });
    }

    // Check for unnecessary expenses (Miscellaneous > 5% of revenue)
    const miscellaneousSpend = expenses
      .filter(e => {
        const date = new Date(e.date);
        const desc = e.description.toLowerCase();
        return (
          date >= currentMonthStart && 
          date <= currentMonthEnd &&
          (e.category === 'other' || desc.includes('miscellaneous') || desc.includes('snack'))
        );
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (currentMonthRevenue > 0 && miscellaneousSpend > currentMonthRevenue * 0.05) {
      const percentage = Math.round((miscellaneousSpend / currentMonthRevenue) * 100);
      alerts.push({
        id: 'unnecessary-expenses',
        type: 'unnecessary_expense',
        severity: 'info',
        title: 'Unnecessary Expenses Flag',
        message: `Miscellaneous/Other expenses are ${percentage}% of revenue. Consider reviewing these costs.`,
        percentageOver: percentage,
      });
    }

    return alerts;
  }, [expenses, transactions, isLoading]);

  // Calculate variance data for charts
  const varianceData = useMemo(() => {
    if (isLoading) return [];

    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    const months = [1, 2, 3].map(i => ({
      start: startOfMonth(subMonths(today, i)),
      end: endOfMonth(subMonths(today, i)),
    }));

    return EXPENSE_CATEGORIES.map(category => {
      const currentMonthSpend = expenses
        .filter(e => {
          const date = new Date(e.date);
          return e.category === category.value && date >= currentMonthStart && date <= currentMonthEnd;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const monthlySpends = months.map(month => 
        expenses
          .filter(e => {
            const date = new Date(e.date);
            return e.category === category.value && date >= month.start && date <= month.end;
          })
          .reduce((sum, e) => sum + Number(e.amount), 0)
      );

      const avgMonthlySpend = monthlySpends.reduce((a, b) => a + b, 0) / 3;

      return {
        category: category.label,
        current: currentMonthSpend,
        average: Math.round(avgMonthlySpend),
        variance: avgMonthlySpend > 0 ? Math.round(((currentMonthSpend - avgMonthlySpend) / avgMonthlySpend) * 100) : 0,
      };
    }).filter(d => d.current > 0 || d.average > 0);
  }, [expenses, isLoading]);

  return {
    alerts,
    varianceData,
    isLoading,
  };
}
