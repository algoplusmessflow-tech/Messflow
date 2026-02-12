import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExpenses, EXPENSE_CATEGORIES } from '@/hooks/useExpenses';
import { useStorageManager } from '@/hooks/useStorageManager';
import { useCurrency } from '@/hooks/useCurrency';
import { formatDate, toDateInputValue } from '@/lib/format';
import { Plus, Trash2, Receipt, TrendingDown, Upload, Pencil, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { PettyCashWidget } from '@/components/PettyCashWidget';
import { ExpenseEditDialog } from '@/components/ExpenseEditDialog';
import { isMobile } from '@/lib/utils';

type ExpenseCategory = Database['public']['Enums']['expense_category'];

export default function Expenses() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense, todayExpenses, monthlyExpenses } = useExpenses();
  const { uploadReceipt, canUpload, formatBytes, storageLimit, storageUsed } = useStorageManager();
  const { formatAmount } = useCurrency();
  const [open, setOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<{
    id: string;
    description: string;
    amount: string;
    category: ExpenseCategory;
    date: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'groceries' as ExpenseCategory,
    date: toDateInputValue(new Date()),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    setUploading(true);
    try {
      // Check storage quota before upload
      if (receiptFile) {
        if (!canUpload(receiptFile.size)) {
          toast.error(`Storage limit exceeded. You have ${formatBytes(storageLimit - storageUsed)} remaining.`);
          setUploading(false);
          return;
        }
      }

      // First create the expense to get ID
      const expenseData = await addExpense.mutateAsync({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        receipt_url: undefined,
        file_size_bytes: 0,
      });

      // Then upload receipt if exists
      if (receiptFile && expenseData) {
        const result = await uploadReceipt(receiptFile, expenseData.id);
        if (result) {
          // Update expense with receipt URL
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase
            .from('expenses')
            .update({ 
              receipt_url: result.url,
              file_size_bytes: result.size,
            })
            .eq('id', expenseData.id);
        }
      }

      setFormData({
        description: '',
        amount: '',
        category: 'groceries',
        date: toDateInputValue(new Date()),
      });
      setReceiptFile(null);
      setOpen(false);
    } catch (error: any) {
      toast.error('Failed to add expense: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (expense: typeof expenses[0]) => {
    setEditingExpense({
      id: expense.id,
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      date: toDateInputValue(new Date(expense.date)),
    });
    setIsEditOpen(true);
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    await updateExpense.mutateAsync({
      id: editingExpense.id,
      description: editingExpense.description,
      amount: parseFloat(editingExpense.amount),
      category: editingExpense.category,
      date: new Date(editingExpense.date).toISOString(),
    });
    setEditingExpense(null);
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteExpense.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track your daily mess expenses</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Vegetables from market"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (AED)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                  <div className="flex items-center gap-2">
                    {/* Mobile: Camera capture */}
                    {isMobile() && (
                      <>
                        <Input
                          id="receipt-camera"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor="receipt-camera"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 cursor-pointer mr-2"
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          Take Photo
                        </label>
                      </>
                    )}
                    
                    {/* Desktop: File picker */}
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {receiptFile && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {receiptFile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Receipt will be saved to cloud storage
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={addExpense.isPending || uploading}>
                  {uploading ? 'Uploading...' : addExpense.isPending ? 'Adding...' : 'Add Expense'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-destructive">{formatAmount(todayExpenses)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-destructive">{formatAmount(monthlyExpenses)}</p>
              )}
            </CardContent>
          </Card>
          <PettyCashWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No expenses recorded yet. Add your first expense!
                </p>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 20).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-accent/50 border border-border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{expense.description}</p>
                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <Upload className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">
                            {getCategoryLabel(expense.category)}
                          </span>
                          <span>{formatDate(new Date(expense.date))}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-destructive">
                          {formatAmount(Number(expense.amount))}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        {editingExpense && (
          <ExpenseEditDialog
            expense={{
              id: editingExpense.id,
              description: editingExpense.description,
              amount: parseFloat(editingExpense.amount),
              category: editingExpense.category,
              date: editingExpense.date,
              receipt_url: expenses.find(e => e.id === editingExpense.id)?.receipt_url,
            }}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The expense record will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
