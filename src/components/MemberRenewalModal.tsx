import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useFreeTierLimits } from '@/hooks/useFreeTierLimits';
import { useCurrency } from '@/hooks/useCurrency';
import { generateMemberInvoice } from '@/lib/pdf-generator';
import { Loader2, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, addDays, addMonths } from 'date-fns';

interface MemberRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    name: string;
    monthly_fee: number;
    plan_expiry_date: string | null;
  } | null;
}

export function MemberRenewalModal({ open, onOpenChange, member }: MemberRenewalModalProps) {
  const { updateMember } = useMembers();
  const { addTransaction } = useTransactions();
  const { profile, incrementInvoiceCount } = useProfile();
  const { canGenerateInvoice } = useFreeTierLimits();
  const { formatAmount } = useCurrency();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateInvoice, setGenerateInvoice] = useState(true);

  // Calculate duration in days
  const durationDays = startDate && endDate 
    ? Math.max(0, differenceInDays(new Date(endDate), new Date(startDate)))
    : 0;

  // Initialize dates when member changes
  useEffect(() => {
    if (member && open) {
      const start = member.plan_expiry_date 
        ? new Date(member.plan_expiry_date)
        : new Date();
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(addMonths(start, 1).toISOString().split('T')[0]);
      setAmount(String(member.monthly_fee || 0));
    }
  }, [member, open]);

  // Auto-calc amount based on duration (optional)
  useEffect(() => {
    if (member && durationDays > 0) {
      const dailyRate = (member.monthly_fee || 0) / 30;
      const suggestedAmount = Math.round(dailyRate * durationDays);
      // Only auto-calc if user hasn't manually changed it
      // setAmount(String(suggestedAmount));
    }
  }, [durationDays, member]);

  const handleRenew = async () => {
    if (!member || !endDate || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update member's plan expiry
      await updateMember.mutateAsync({
        id: member.id,
        plan_expiry_date: new Date(endDate).toISOString(),
        status: 'active',
      });

      // Add payment transaction
      await addTransaction.mutateAsync({
        member_id: member.id,
        type: 'payment',
        amount: Number(amount),
        notes: `Plan renewal: ${startDate} to ${endDate}`,
      });

      // Generate invoice if enabled
      if (generateInvoice && canGenerateInvoice) {
        await generateMemberInvoice(
          member.name,
          Number(amount),
          profile?.business_name || 'MessFlow',
          profile?.tax_trn,
          Number(profile?.tax_rate) || 5,
          profile?.tax_name || 'VAT'
        );
        await incrementInvoiceCount.mutateAsync();
        toast.success('Invoice generated!');
      }

      toast.success('Membership renewed successfully!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to renew: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Renew / Extend Membership
          </DialogTitle>
          <DialogDescription>
            Extend {member.name}'s membership
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              Monthly Rate: {formatAmount(member.monthly_fee)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {durationDays > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Duration: {durationDays} days
            </p>
          )}

          <div className="space-y-2">
            <Label>Amount to Collect</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated but you can adjust for discounts/extras
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="generateInvoice"
              checked={generateInvoice}
              onChange={(e) => setGenerateInvoice(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="generateInvoice" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Generate Invoice PDF
            </Label>
            {!canGenerateInvoice && (
              <span className="text-xs text-amber-500">(Limit reached)</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRenew} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Renew Membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
