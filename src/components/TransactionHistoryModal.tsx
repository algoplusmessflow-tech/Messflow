import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTransactions } from '@/hooks/useTransactions';
import { useMembers } from '@/hooks/useMembers';
import { formatDate, formatCurrency } from '@/lib/format';
import { Loader2, Pencil, Trash2, X, Check, Calendar as CalendarIcon, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface TransactionHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: {
        id: string;
        name: string;
        balance: number;
        phone: string;
    } | null;
}

export function TransactionHistoryModal({ open, onOpenChange, member }: TransactionHistoryModalProps) {
    const { getMemberTransactions, updateTransaction, deleteTransaction } = useTransactions();
    const { updateMember } = useMembers();
    const { profile } = useProfile();
    const [editingId, setEditingId] = useState<string | null>(null);

    // Edit form state
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState<Date | null>(null);
    const [editNotes, setEditNotes] = useState('');

    if (!member) return null;

    const transactions = getMemberTransactions(member.id);

    const handleShareReceipt = (tx: any) => {
        if (!profile) return;

        // Only share payments
        if (tx.type !== 'payment') return;

        const message = `🧾 *Payment Receipt*

*${profile.business_name}*
${profile.tax_trn ? `TRN: ${profile.tax_trn}` : ''}

Dear ${member.name},

Here is a copy of your payment receipt:

Amount: AED ${Number(tx.amount).toFixed(2)}
Date: ${formatDate(new Date(tx.date))}
${tx.notes ? `Notes: ${tx.notes}` : ''}

Thank you! 🙏`;

        const cleanPhone = member.phone.replace(/[\s-]/g, '');
        const phoneWithCode = cleanPhone.startsWith('+') ? cleanPhone.slice(1) :
            cleanPhone.startsWith('971') ? cleanPhone :
                `971${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

        const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const startEdit = (tx: any) => {
        setEditingId(tx.id);
        setEditAmount(String(tx.amount));
        setEditDate(new Date(tx.date));
        setEditNotes(tx.notes || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditAmount('');
        setEditDate(null);
        setEditNotes('');
    };

    const handleSaveEdit = async (tx: any) => {
        try {
            const newAmount = Number(editAmount);
            const oldAmount = Number(tx.amount);

            // Update transaction
            await updateTransaction.mutateAsync({
                id: tx.id,
                amount: newAmount,
                date: editDate?.toISOString(),
                notes: editNotes,
            });

            // Update member balance if amount changed and it's a payment
            if (tx.type === 'payment' && newAmount !== oldAmount) {
                const diff = oldAmount - newAmount; // If paid less (100 -> 50), balance increases (+50). If paid more (100 -> 150), balance decreases (-50).
                const newBalance = Number(member.balance) + diff;

                await updateMember.mutateAsync({
                    id: member.id,
                    balance: newBalance,
                });
            }

            setEditingId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (tx: any) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await deleteTransaction.mutateAsync(tx.id);

            // Revert balance if it was a payment
            if (tx.type === 'payment') {
                const newBalance = Number(member.balance) + Number(tx.amount);
                await updateMember.mutateAsync({
                    id: member.id,
                    balance: newBalance,
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Transaction History</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Current Balance: {formatCurrency(Number(member.balance))}
                        </p>
                    </div>

                    <ScrollArea className="h-[400px] pr-4">
                        {transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No transactions yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="p-3 rounded-lg border bg-card text-sm space-y-2 relative group"
                                    >
                                        {editingId === tx.id ? (
                                            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Amount</Label>
                                                        <Input
                                                            type="number"
                                                            value={editAmount}
                                                            onChange={(e) => setEditAmount(e.target.value)}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Date</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal h-8",
                                                                        !editDate && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                                    {editDate ? format(editDate, "PP") : "Pick date"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={editDate || undefined}
                                                                    onSelect={(date) => setEditDate(date || null)}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Notes</Label>
                                                    <Input
                                                        value={editNotes}
                                                        onChange={(e) => setEditNotes(e.target.value)}
                                                        className="h-8"
                                                        placeholder="Optional notes"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1">
                                                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 px-2">
                                                        <X className="h-3 w-3 mr-1" /> Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleSaveEdit(tx)} className="h-7 px-2">
                                                        <Check className="h-3 w-3 mr-1" /> Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className={cn("font-medium",
                                                            tx.type === 'payment' ? 'text-primary' :
                                                                tx.type === 'charge' ? 'text-destructive' : 'text-muted-foreground'
                                                        )}>
                                                            {tx.type === 'payment' ? 'Payment' :
                                                                tx.type === 'charge' ? 'Charge' : tx.type}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(new Date(tx.date))}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn("font-bold",
                                                            tx.type === 'payment' ? 'text-primary' : 'text-destructive'
                                                        )}>
                                                            {tx.type === 'payment' ? '-' : '+'}
                                                            {formatCurrency(Number(tx.amount))}
                                                        </p>
                                                    </div>
                                                </div>

                                                {tx.notes && (
                                                    <p className="text-xs text-muted-foreground bg-muted/30 p-1.5 rounded">
                                                        {tx.notes}
                                                    </p>
                                                )}

                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm border p-0.5 flex gap-0.5">
                                                    {tx.type === 'payment' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 hover:text-green-600"
                                                            onClick={() => handleShareReceipt(tx)}
                                                            title="Share Receipt on WhatsApp"
                                                        >
                                                            <Share2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:text-primary"
                                                        onClick={() => startEdit(tx)}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:text-destructive"
                                                        onClick={() => handleDelete(tx)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
