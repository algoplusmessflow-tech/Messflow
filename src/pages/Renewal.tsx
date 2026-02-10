import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDate, formatCurrency } from '@/lib/format';
import { AlertTriangle, ExternalLink, Loader2, Gift } from 'lucide-react';

export default function Renewal() {
  const { subscriptionExpiry, paymentLink, applyPromoCode, daysUntilExpiry } = useSubscription();
  const [promoCode, setPromoCode] = useState('');

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    await applyPromoCode.mutateAsync(promoCode.trim());
    setPromoCode('');
  };

  const handlePayOnline = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Subscription Expired</CardTitle>
          <CardDescription>
            Your subscription {daysUntilExpiry !== null && daysUntilExpiry < 0 
              ? `expired on ${formatDate(subscriptionExpiry!)}` 
              : `expires on ${formatDate(subscriptionExpiry!)}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pay Online Button */}
          {paymentLink ? (
            <Button className="w-full" size="lg" onClick={handlePayOnline}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Pay Online
            </Button>
          ) : (
            <div className="text-center text-muted-foreground text-sm p-4 bg-muted rounded-lg">
              Contact admin to get your payment link
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or use promo code</span>
            </div>
          </div>

          {/* Promo Code Form */}
          <form onSubmit={handleApplyPromo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo">Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1"
                />
                <Button type="submit" disabled={applyPromoCode.isPending || !promoCode.trim()}>
                  {applyPromoCode.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact support for assistance with your subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
