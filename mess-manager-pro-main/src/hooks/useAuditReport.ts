import { useMemo } from 'react';
import { useExpenses, EXPENSE_CATEGORIES } from '@/hooks/useExpenses';
import { useTransactions } from '@/hooks/useTransactions';
import { useStaff } from '@/hooks/useStaff';
import { usePettyCash } from '@/hooks/usePettyCash';
import { useProfile } from '@/hooks/useProfile';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface AuditReport {
  month: string;
  year: number;
  totalRevenue: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  netProfit: number;
  salaryManifest: {
    staffName: string;
    role: string;
    baseSalary: number;
    paidAmount: number;
    status: 'paid' | 'pending';
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  pettyCashSummary: {
    totalRefills: number;
    totalSpent: number;
    closingBalance: number;
  };
  memberStats: {
    totalPayments: number;
    paymentCount: number;
  };
}

export function useAuditReport(selectedMonth: Date) {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { staff, salaryPayments, isLoading: staffLoading } = useStaff();
  const { transactions: pettyCashTx, isLoading: pettyCashLoading } = usePettyCash();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = expensesLoading || transactionsLoading || staffLoading || pettyCashLoading || profileLoading;

  const report = useMemo((): AuditReport | null => {
    if (isLoading) return null;

    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const monthName = format(selectedMonth, 'MMMM');
    const year = selectedMonth.getFullYear();
    const monthYear = format(selectedMonth, 'MMMM yyyy');

    // Revenue from payments
    const monthPayments = transactions.filter(t => {
      const date = new Date(t.date);
      return t.type === 'payment' && date >= monthStart && date <= monthEnd;
    });
    const totalRevenue = monthPayments.reduce((sum, t) => sum + Number(t.amount), 0);

    // Expenses in this month (excluding salaries category which we calculate separately)
    const monthExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date >= monthStart && date <= monthEnd && e.category !== 'salaries';
    });

    // Variable costs = all expenses except rent and salaries
    const variableExpenses = monthExpenses.filter(e => e.category !== 'rent');
    const totalVariableCosts = variableExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Fixed costs = rent + salaries paid this month
    const rentExpenses = monthExpenses.filter(e => e.category === 'rent');
    const rentCost = rentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Salary manifest
    const salaryManifest = staff.map(s => {
      const payment = salaryPayments.find(
        p => p.staff_id === s.id && p.month_year === monthYear
      );
      return {
        staffName: s.name,
        role: s.role,
        baseSalary: Number(s.base_salary),
        paidAmount: payment ? Number(payment.amount) : 0,
        status: payment ? 'paid' as const : 'pending' as const,
      };
    });

    const totalSalaries = salaryManifest.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalFixedCosts = rentCost + totalSalaries;

    // Category breakdown
    const allMonthExpenses = [...monthExpenses];
    // Add salary expenses
    if (totalSalaries > 0) {
      allMonthExpenses.push({
        category: 'salaries',
        amount: totalSalaries,
      } as any);
    }

    const totalExpenses = allMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    const categoryBreakdown = EXPENSE_CATEGORIES.map(cat => {
      const amount = allMonthExpenses
        .filter(e => e.category === cat.value)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        category: cat.label,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      };
    }).filter(c => c.amount > 0);

    // Petty cash summary
    const monthPettyCash = pettyCashTx.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const pettyCashRefills = monthPettyCash
      .filter(t => t.type === 'refill')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pettyCashSpent = monthPettyCash
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Find closing balance (last transaction of the month or current balance)
    const closingBalance = monthPettyCash.length > 0 
      ? Number(monthPettyCash[0].balance_after) 
      : 0;

    // Add petty cash refills to variable costs (they came from main expense as cash withdrawal)
    // Don't double count - petty cash refills are already in expenses as "Cash Withdrawal"

    const netProfit = totalRevenue - totalFixedCosts - totalVariableCosts;

    return {
      month: monthName,
      year,
      totalRevenue,
      totalFixedCosts,
      totalVariableCosts,
      netProfit,
      salaryManifest,
      categoryBreakdown,
      pettyCashSummary: {
        totalRefills: pettyCashRefills,
        totalSpent: pettyCashSpent,
        closingBalance,
      },
      memberStats: {
        totalPayments: totalRevenue,
        paymentCount: monthPayments.length,
      },
    };
  }, [expenses, transactions, staff, salaryPayments, pettyCashTx, selectedMonth, isLoading]);

  return {
    report,
    isLoading,
    businessName: profile?.business_name || 'Business',
    businessAddress: profile?.company_address || '',
    currency: profile?.currency || 'AED',
  };
}
