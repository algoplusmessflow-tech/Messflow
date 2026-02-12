import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, CheckCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'members' | 'invoices' | 'receipts';
  currentCount: number;
  limit: number;
}

export function UpgradePlanModal({
  open,
  onOpenChange,
  limitType,
  currentCount,
  limit,
}: UpgradePlanModalProps) {
  const { profile } = useProfile();
  const paymentLink = profile?.payment_link;

  const limitMessages = {
    members: {
      title: 'Member Limit Reached',
      description: `You have reached the maximum of ${limit} members on the Free plan.`,
    },
    invoices: {
      title: 'Invoice Limit Reached',
      description: `You have generated ${currentCount}/${limit} invoices. Upgrade to Pro for unlimited invoices.`,
    },
    receipts: {
      title: 'Receipt Upload Limit Reached',
      description: `You have uploaded ${currentCount}/${limit} receipts. Please download & delete old receipts to free up slots, or upgrade to Pro.`,
    },
  };

  const { title, description } = limitMessages[limitType];

  const handleUpgrade = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-accent/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-foreground">Pro Plan Benefits</h4>
            <ul className="space-y-2">
              {[
                'Unlimited Members',
                'Unlimited Invoice Generation',
                'Unlimited Receipt Storage (5GB)',
                'Priority Support',
                'Advanced Analytics',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="w-full sm:w-auto">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
