import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMembers } from '@/hooks/useMembers';
import { calculateExpiryDate, toDateInputValue } from '@/lib/format';
import type { Database } from '@/integrations/supabase/types';

type PlanType = Database['public']['Enums']['plan_type'];

interface ParsedMember {
  name: string;
  phone: string;
  plan_type: PlanType;
  monthly_fee: number;
  joining_date: string;
  is_valid: boolean;
  errors: string[];
  selected: boolean;
}

interface MemberImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  memberLimit: number;
  currentMemberCount: number;
}

export function MemberImportModal({
  open,
  onOpenChange,
  onSuccess,
  memberLimit,
  currentMemberCount,
}: MemberImportModalProps) {
  const { addMember } = useMembers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const remainingSlots = memberLimit - currentMemberCount;

  const resetState = () => {
    setStep('upload');
    setParsedMembers([]);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0 });
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const parseCSV = (content: string): ParsedMember[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      toast.error('CSV file must have a header row and at least one data row');
      return [];
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/['"]/g, ''));
    const nameIdx = header.findIndex(h => h.includes('name'));
    const phoneIdx = header.findIndex(h => h.includes('phone') || h.includes('mobile'));
    const planIdx = header.findIndex(h => h.includes('plan'));
    const feeIdx = header.findIndex(h => h.includes('fee') || h.includes('amount') || h.includes('price'));
    const dateIdx = header.findIndex(h => h.includes('date') || h.includes('joining'));

    if (nameIdx === -1 || phoneIdx === -1) {
      toast.error('CSV must have "name" and "phone" columns');
      return [];
    }

    const members: ParsedMember[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted values with commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const name = values[nameIdx]?.replace(/['"]/g, '').trim() || '';
      const phone = values[phoneIdx]?.replace(/['"]/g, '').trim() || '';
      const planRaw = planIdx !== -1 ? values[planIdx]?.replace(/['"]/g, '').trim().toLowerCase() : '';
      const feeRaw = feeIdx !== -1 ? values[feeIdx]?.replace(/['"]/g, '').trim() : '';
      const dateRaw = dateIdx !== -1 ? values[dateIdx]?.replace(/['"]/g, '').trim() : '';

      const errors: string[] = [];

      // Validate name
      if (!name) errors.push('Name is required');

      // Validate phone
      if (!phone) {
        errors.push('Phone is required');
      } else if (!/^[\d\s\-+()]{7,}$/.test(phone)) {
        errors.push('Invalid phone format');
      }

      // Parse plan type
      let plan_type: PlanType = '3-time';
      if (planRaw.includes('1') || planRaw.includes('one')) {
        plan_type = '1-time';
      } else if (planRaw.includes('2') || planRaw.includes('two')) {
        plan_type = '2-time';
      }

      // Parse fee
      let monthly_fee = 1500; // Default
      if (feeRaw) {
        const parsed = parseFloat(feeRaw.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          monthly_fee = parsed;
        }
      }

      // Parse date
      let joining_date = toDateInputValue(new Date());
      if (dateRaw) {
        // Try various date formats
        const dateObj = new Date(dateRaw);
        if (!isNaN(dateObj.getTime())) {
          joining_date = toDateInputValue(dateObj);
        } else {
          // Try DD/MM/YYYY format
          const ddmmyyyy = dateRaw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
          if (ddmmyyyy) {
            const [, d, m, y] = ddmmyyyy;
            const year = y.length === 2 ? `20${y}` : y;
            const parsed = new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
            if (!isNaN(parsed.getTime())) {
              joining_date = toDateInputValue(parsed);
            }
          }
        }
      }

      members.push({
        name,
        phone,
        plan_type,
        monthly_fee,
        joining_date,
        is_valid: errors.length === 0,
        errors,
        selected: errors.length === 0,
      });
    }

    return members;
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      
      if (parsed.length > 0) {
        setParsedMembers(parsed);
        setStep('preview');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      
      if (parsed.length > 0) {
        setParsedMembers(parsed);
        setStep('preview');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const toggleMember = (index: number) => {
    setParsedMembers(prev => 
      prev.map((m, i) => i === index ? { ...m, selected: !m.selected } : m)
    );
  };

  const selectAll = () => {
    setParsedMembers(prev => prev.map(m => ({ ...m, selected: m.is_valid })));
  };

  const deselectAll = () => {
    setParsedMembers(prev => prev.map(m => ({ ...m, selected: false })));
  };

  const selectedCount = parsedMembers.filter(m => m.selected).length;
  const validCount = parsedMembers.filter(m => m.is_valid).length;
  const canImport = selectedCount > 0 && selectedCount <= remainingSlots;

  const handleImport = async () => {
    const toImport = parsedMembers.filter(m => m.selected);
    if (toImport.length === 0) return;

    setStep('importing');
    let success = 0;
    let failed = 0;

    for (let i = 0; i < toImport.length; i++) {
      const member = toImport[i];
      try {
        const joiningDate = new Date(member.joining_date);
        const expiryDate = calculateExpiryDate(joiningDate);

        await addMember.mutateAsync({
          name: member.name,
          phone: member.phone,
          plan_type: member.plan_type,
          monthly_fee: member.monthly_fee,
          balance: member.monthly_fee, // Default to unpaid
          status: 'active',
          joining_date: joiningDate.toISOString(),
          plan_expiry_date: expiryDate.toISOString(),
        });
        success++;
      } catch (error) {
        failed++;
        console.error('Failed to import member:', member.name, error);
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
      setImportResults({ success, failed });
    }

    if (success > 0) {
      toast.success(`Successfully imported ${success} members!`);
      onSuccess?.();
    }
    if (failed > 0) {
      toast.error(`Failed to import ${failed} members`);
    }
  };

  const downloadTemplate = () => {
    const template = `Name,Phone,Plan,Monthly Fee,Joining Date
John Doe,0501234567,3-time,1500,01/01/2025
Jane Smith,0559876543,2-time,1200,15/01/2025
Ahmed Ali,0561112233,1-time,800,20/01/2025`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Members from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with member data to bulk import.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse files
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                CSV must have columns for <strong>Name</strong> and <strong>Phone</strong>.
                Optional: Plan, Monthly Fee, Joining Date.
                <br />
                You can import up to <strong>{remainingSlots}</strong> more members.
              </AlertDescription>
            </Alert>

            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Template CSV
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                <Badge variant={validCount === parsedMembers.length ? 'default' : 'secondary'}>
                  {validCount} / {parsedMembers.length} valid
                </Badge>
                <Badge variant="outline">
                  {selectedCount} selected
                </Badge>
                {selectedCount > remainingSlots && (
                  <Badge variant="destructive">
                    Exceeds limit by {selectedCount - remainingSlots}
                  </Badge>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="divide-y">
                {parsedMembers.map((member, index) => (
                  <div
                    key={index}
                    className={`p-3 flex items-center gap-3 ${
                      !member.is_valid ? 'bg-destructive/10' : member.selected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Checkbox
                      checked={member.selected}
                      onCheckedChange={() => toggleMember(index)}
                      disabled={!member.is_valid}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{member.name || '(empty)'}</p>
                        {member.is_valid ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-destructive shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{member.phone || '(empty)'}</span>
                        <span>•</span>
                        <span>{member.plan_type}</span>
                        <span>•</span>
                        <span>AED {member.monthly_fee}</span>
                      </div>
                      {member.errors.length > 0 && (
                        <p className="text-xs text-destructive mt-1">
                          {member.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Importing Members...</p>
              <p className="text-sm text-muted-foreground">
                {importResults.success + importResults.failed} of {selectedCount} processed
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-primary">✓ {importResults.success} imported</span>
              {importResults.failed > 0 && (
                <span className="text-destructive">✗ {importResults.failed} failed</span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!canImport}
              >
                Import {selectedCount} Members
              </Button>
            </>
          )}
          {step === 'importing' && importProgress === 100 && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}