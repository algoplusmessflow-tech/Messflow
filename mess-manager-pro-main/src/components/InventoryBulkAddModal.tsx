import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkItem {
  item_name: string;
  quantity: string;
  unit: string;
  description: string;
}

const UNITS = ['kg', 'pcs', 'liters', 'grams', 'boxes', 'packets'];

interface InventoryBulkAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryBulkAddModal({ open, onOpenChange }: InventoryBulkAddModalProps) {
  const { addItem } = useInventory();
  const [items, setItems] = useState<BulkItem[]>([
    { item_name: '', quantity: '', unit: 'kg', description: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = () => {
    setItems([...items, { item_name: '', quantity: '', unit: 'kg', description: '' }]);
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BulkItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async () => {
    const validItems = items.filter(
      (item) => item.item_name.trim() && item.quantity
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    try {
      for (const item of validItems) {
        await addItem.mutateAsync({
          item_name: item.item_name.trim(),
          quantity: Number(item.quantity),
          unit: item.unit,
          description: item.description.trim() || undefined,
        } as any);
        successCount++;
      }

      toast.success(`Added ${successCount} items to inventory`);
      setItems([{ item_name: '', quantity: '', unit: 'kg', description: '' }]);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Added ${successCount} items, but failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Inventory Items</DialogTitle>
          <DialogDescription>
            Add multiple items at once. Fill in the details and click save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg space-y-3 bg-accent/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Item {index + 1}</span>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Item Name *</Label>
                  <Input
                    placeholder="e.g., Rice"
                    value={item.item_name}
                    onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="10"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description (Optional)</Label>
                <Input
                  placeholder="Brief description..."
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={addRow}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Item
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save {items.filter((i) => i.item_name.trim()).length} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
