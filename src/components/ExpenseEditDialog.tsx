import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useExpenses, EXPENSE_CATEGORIES } from '@/hooks/useExpenses';
import { useStorageManager } from '@/hooks/useStorageManager';
import { toast } from 'sonner';
import { formatDate, toDateInputValue } from '@/lib/format';
import { Pencil, Trash2, Upload, Loader2, Image as ImageIcon, X, Camera } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { isMobile } from '@/lib/utils';

type ExpenseCategory = Database['public']['Enums']['expense_category'];

interface ExpenseEditDialogProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    receipt_url?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseEditDialog({ expense, open, onOpenChange }: ExpenseEditDialogProps) {
  const { updateExpense } = useExpenses();
  const { uploadReceipt, deleteReceipt } = useStorageManager();
  
  const [formData, setFormData] = useState({
    description: expense.description,
    amount: String(expense.amount),
    category: expense.category,
    date: toDateInputValue(new Date(expense.date)),
  });
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingReceipt, setDeletingReceipt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update expense details
      await updateExpense.mutateAsync({
        id: expense.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
      });

      // Handle receipt upload if new file selected
      if (receiptFile) {
        setUploading(true);
        try {
          const result = await uploadReceipt(receiptFile, expense.id);
          if (result) {
            // Update expense with new receipt URL
            const { supabase } = await import('@/integrations/supabase/client');
            await supabase
              .from('expenses')
              .update({ 
                receipt_url: result.url,
                file_size_bytes: result.size,
              })
              .eq('id', expense.id);
          }
        } catch (error: any) {
          toast.error('Failed to upload receipt: ' + error.message);
        } finally {
          setUploading(false);
        }
      }

      toast.success('Expense updated successfully!');
      onOpenChange(false);
      // Reset form
      setFormData({
        description: expense.description,
        amount: String(expense.amount),
        category: expense.category,
        date: toDateInputValue(new Date(expense.date)),
      });
      setReceiptFile(null);
    } catch (error: any) {
      toast.error('Failed to update expense: ' + error.message);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!expense.receipt_url) return;
    
    setDeletingReceipt(true);
    try {
      // Clear receipt from database
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('expenses')
        .update({ 
          receipt_url: null,
          file_size_bytes: 0,
        })
        .eq('id', expense.id);

      toast.success('Receipt removed successfully!');
    } catch (error: any) {
      toast.error('Failed to remove receipt: ' + error.message);
    } finally {
      setDeletingReceipt(false);
    }
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Expense
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

          {/* Receipt Section */}
          <div className="space-y-2">
            <Label>Receipt</Label>
            
            {/* Current Receipt Preview */}
            {expense.receipt_url && (
              <div className="border border-border rounded-lg p-3 bg-accent/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Receipt</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteReceipt}
                    disabled={deletingReceipt}
                    className="text-destructive hover:text-destructive/80"
                  >
                    {deletingReceipt ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Remove
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={expense.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    View Receipt
                  </a>
                </div>
              </div>
            )}

            {/* New Receipt Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {receiptFile ? receiptFile.name : 'Upload new receipt (optional)'}
                  </p>
                  
                  {/* Mobile: Camera capture button */}
                  {isMobile() && (
                    <>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="receipt-camera"
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
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 cursor-pointer"
                  >
                    Choose File
                  </label>
                  {receiptFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReceiptFile(null)}
                      className="ml-2 text-muted-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateExpense.isPending || uploading}>
              {updateExpense.isPending || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}