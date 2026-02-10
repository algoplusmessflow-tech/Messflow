import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePettyCash } from '@/hooks/usePettyCash';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/hooks/useCurrency';
import { Wallet, Plus, Minus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';

export function PettyCashWidget() {
  const { transactions, currentBalance, isLoading, addRefill, addSmallExpense } = usePettyCash();
  const { addExpense } = useExpenses();
  const { formatAmount } = useCurrency();
  const [refillOpen, setRefillOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [refillAmount, setRefillAmount] = useState('');
  const [refillDescription, setRefillDescription] = useState('Cash Withdrawal');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const handleRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(refillAmount);
    if (!amount || amount <= 0) return;

    try {
      // First create the main expense record for cash withdrawal
      const expenseData = await addExpense.mutateAsync({
        description: refillDescription || 'Cash Withdrawal for Petty Cash',
        amount,
        category: 'other',
        date: new Date().toISOString(),
      });

      // Then add to petty cash with linked expense
      await addRefill.mutateAsync({
        amount,
        description: refillDescription || 'Cash Withdrawal',
        linkedExpenseId: expenseData?.id,
      });

      setRefillAmount('');
      setRefillDescription('Cash Withdrawal');
      setRefillOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSmallExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0 || !expenseDescription) return;

    try {
      await addSmallExpense.mutateAsync({
        amount,
        description: expenseDescription,
      });

      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Petty Cash</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">{formatAmount(currentBalance)}</p>
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => setRefillOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Funds
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => setExpenseOpen(true)}
            >
              <Minus className="h-3 w-3 mr-1" />
              Spend
            </Button>
          </div>

          {/* Recent transactions */}
          {transactions.length > 0 && (
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Recent</p>
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {tx.type === 'refill' ? (
                      <ArrowUpCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                    )}
                    <span className="truncate">{tx.description}</span>
                  </div>
                  <span className={tx.type === 'refill' ? 'text-green-500' : 'text-destructive'}>
                    {tx.type === 'refill' ? '+' : '-'}{formatAmount(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refill Dialog */}
      <Dialog open={refillOpen} onOpenChange={setRefillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Petty Cash</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRefill} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create an expense entry for "Cash Withdrawal" and add the amount to your petty cash balance.
            </p>
            <div className="space-y-2">
              <Label htmlFor="refillAmount">Amount</Label>
              <Input
                id="refillAmount"
                type="number"
                step="0.01"
                min="0"
                value={refillAmount}
                onChange={(e) => setRefillAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refillDescription">Description</Label>
              <Input
                id="refillDescription"
                value={refillDescription}
                onChange={(e) => setRefillDescription(e.target.value)}
                placeholder="Cash Withdrawal"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRefillOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addRefill.isPending || addExpense.isPending}>
                {addRefill.isPending || addExpense.isPending ? 'Adding...' : 'Add Funds'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Small Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Small Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSmallExpense} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Record a small expense from petty cash. This won't appear in the main expense list.
            </p>
            <div className="p-3 bg-muted rounded">
              <p className="text-sm">Available Balance: <span className="font-bold">{formatAmount(currentBalance)}</span></p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseAmount">Amount</Label>
              <Input
                id="expenseAmount"
                type="number"
                step="0.01"
                min="0"
                max={currentBalance}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseDescription">Description</Label>
              <Input
                id="expenseDescription"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="e.g., Tea for staff"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addSmallExpense.isPending || parseFloat(expenseAmount) > currentBalance}
              >
                {addSmallExpense.isPending ? 'Recording...' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
