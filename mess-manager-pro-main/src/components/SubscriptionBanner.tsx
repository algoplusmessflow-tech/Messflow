import { AlertTriangle, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';

export function SubscriptionBanner() {
  const { isExpiringSoon, daysUntilExpiry, isExpired } = useSubscription();

  if (!isExpiringSoon && !isExpired) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {isExpired ? (
          <span>Your subscription has expired. <Link to="/renewal" className="underline font-bold">Renew now</Link></span>
        ) : (
          <span>Plan expires in {daysUntilExpiry} days. <Link to="/renewal" className="underline font-bold">Contact Admin to renew.</Link></span>
        )}
      </div>
    </div>
  );
}
