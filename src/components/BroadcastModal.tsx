import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBroadcasts } from '@/hooks/useBroadcasts';
import { useSubscription } from '@/hooks/useSubscription';
import { Megaphone } from 'lucide-react';
import { formatDate } from '@/lib/format';

export function BroadcastModal() {
  const { latestBroadcast } = useBroadcasts();
  const { lastBroadcastSeenId, markBroadcastSeen } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (latestBroadcast && latestBroadcast.id !== lastBroadcastSeenId) {
      setIsOpen(true);
    }
  }, [latestBroadcast, lastBroadcastSeenId]);

  const handleClose = () => {
    if (latestBroadcast) {
      markBroadcastSeen.mutate(latestBroadcast.id);
    }
    setIsOpen(false);
  };

  if (!latestBroadcast) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 p-3 bg-primary/10 rounded-full w-fit">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{latestBroadcast.title}</DialogTitle>
          <DialogDescription className="text-center text-xs">
            {formatDate(new Date(latestBroadcast.created_at))}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            {latestBroadcast.message}
          </p>
        </div>
        <Button onClick={handleClose} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
