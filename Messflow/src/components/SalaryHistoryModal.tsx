import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { Calendar, DollarSign, FileText } from 'lucide-react';

interface SalaryPayment {
  id: string;
  amount: number;
  month_year: string;
  paid_at: string;
}

interface SalaryHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  staffName: string;
}

export function SalaryHistoryModal({ open, onOpenChange, staffId, staffName }: SalaryHistoryModalProps) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && staffId && user) {
      loadHistory();
    }
  }, [open, staffId, user]);

  const loadHistory = async () => {
    if (!staffId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('staff_id', staffId)
        .eq('owner_id', user.id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Failed to load salary history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Salary History
          </DialogTitle>
          <DialogDescription>
            Payment records for {staffName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No salary payments recorded yet</p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-primary/10 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Total Paid ({payments.length} payments)</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalPaid)}</p>
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{formatMonthYear(payment.month_year)}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid on {formatDate(new Date(payment.paid_at))}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary">
                      {formatCurrency(Number(payment.amount))}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
