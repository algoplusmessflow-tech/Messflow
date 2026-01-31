import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface DailyConsumptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyConsumptionModal({ open, onOpenChange }: DailyConsumptionModalProps) {
  const { user } = useAuth();
  const { inventory, updateQuantity } = useInventory();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInventory = inventory.find((i) => i.id === selectedItem);

  const handleRelease = async () => {
    if (!selectedItem || !quantity || !user) {
      toast.error('Please select an item and enter quantity');
      return;
    }

    const qtyUsed = Number(quantity);
    if (qtyUsed <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (!selectedInventory) return;

    const currentQty = Number(selectedInventory.quantity);
    if (qtyUsed > currentQty) {
      toast.error(`Only ${currentQty} ${selectedInventory.unit} available`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Record consumption
      const { error: consumptionError } = await supabase
        .from('inventory_consumption')
        .insert({
          inventory_id: selectedItem,
          owner_id: user.id,
          quantity_used: qtyUsed,
          notes: notes.trim() || null,
        });

      if (consumptionError) throw consumptionError;

      // Deduct from inventory
      await updateQuantity.mutateAsync({
        id: selectedItem,
        quantity: currentQty - qtyUsed,
      });

      toast.success(`Released ${qtyUsed} ${selectedInventory.unit} of ${selectedInventory.item_name}`);
      setSelectedItem('');
      setQuantity('');
      setNotes('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to record consumption: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-amber-500" />
            Daily Consumption
          </DialogTitle>
          <DialogDescription>
            Record daily usage to deduct from inventory stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an inventory item" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name} ({Number(item.quantity).toFixed(1)} {item.unit} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInventory && (
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">{selectedInventory.item_name}</span>
                <br />
                <span className="text-muted-foreground">
                  Available: {Number(selectedInventory.quantity).toFixed(1)} {selectedInventory.unit}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantity Used</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter quantity in ${selectedInventory?.unit || 'units'}`}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Used for lunch preparation"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRelease} 
            disabled={isSubmitting || !selectedItem || !quantity}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Release Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
