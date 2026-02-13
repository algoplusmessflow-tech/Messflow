import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Printer, Download, Share2 } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    fileBlob: Blob | null;
    fileName: string;
    messageBody: string;
    whatsappNumber?: string;
    title?: string;
}

export function ShareDialog({
    isOpen,
    onClose,
    fileBlob,
    fileName,
    messageBody,
    whatsappNumber,
    title = 'Share Document',
}: ShareDialogProps) {

    const handleDownload = () => {
        if (fileBlob) {
            saveAs(fileBlob, fileName);
        }
    };

    const handleWhatsApp = () => {
        handleDownload(); // Auto-download first

        // Construct WhatsApp URL
        const encodedMessage = encodeURIComponent(messageBody);
        const whatsappUrl = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(messageBody);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const handlePrint = () => {
        if (fileBlob) {
            const fileUrl = URL.createObjectURL(fileBlob);
            const printWindow = window.open(fileUrl);
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                    // Cleanup
                    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
                };
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="flex flex-col h-24 gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary"
                        onClick={handleWhatsApp}
                    >
                        <MessageCircle className="h-8 w-8 text-[#25D366]" />
                        <span>WhatsApp</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col h-24 gap-2"
                        onClick={handleEmail}
                    >
                        <Mail className="h-8 w-8 text-blue-500" />
                        <span>Email</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col h-24 gap-2"
                        onClick={handlePrint}
                    >
                        <Printer className="h-8 w-8 text-neutral-600" />
                        <span>Print</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col h-24 gap-2"
                        onClick={handleDownload}
                    >
                        <Download className="h-8 w-8 text-neutral-600" />
                        <span>Download</span>
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                    For WhatsApp/Email: The file will be downloaded automatically. Please attach it manually to your message.
                </div>
            </DialogContent>
        </Dialog>
    );
}
