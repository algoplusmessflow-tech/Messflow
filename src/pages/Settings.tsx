import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/hooks/useProfile';
import { useExpenses } from '@/hooks/useExpenses';
import { useStorageManager } from '@/hooks/useStorageManager';
import { formatDate } from '@/lib/format';
import { GCC_CURRENCIES, CurrencyCode } from '@/lib/currencies';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  FileText, 
  Database, 
  Trash2, 
  Download,
  AlertTriangle,
  HardDrive,
  MessageSquare,
  Eye,
  EyeOff,
  Building,
  Coins,
  Image
} from 'lucide-react';
import { CompanyLogoUpload } from '@/components/CompanyLogoUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateExpenseReport } from '@/lib/pdf-generator';

export default function Settings() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { expenses } = useExpenses();
  const { storageUsed, storageLimit, formatBytes, deleteOldReceipts } = useStorageManager();
  const queryClient = useQueryClient();

  // Tax settings
  const [taxName, setTaxName] = useState('VAT');
  const [taxRate, setTaxRate] = useState('5');
  const [taxTrn, setTaxTrn] = useState('');
  const [saving, setSaving] = useState(false);

  // Company settings
  const [companyAddress, setCompanyAddress] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('AED');
  const [savingCompany, setSavingCompany] = useState(false);

  // WhatsApp API
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Audit report
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Cleanup dialog
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupDate, setCleanupDate] = useState('');
  const [cleaning, setCleaning] = useState(false);

  // Initialize from profile
  useEffect(() => {
    if (profile) {
      setTaxName(profile.tax_name || 'VAT');
      setTaxRate(profile.tax_rate?.toString() || '5');
      setTaxTrn(profile.tax_trn || '');
      setWhatsappApiKey(profile.whatsapp_api_key || '');
      setCompanyAddress((profile as any).company_address || '');
      setCurrency(((profile as any).currency || 'AED') as CurrencyCode);
    }
  }, [profile]);

  const saveTaxSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tax_name: taxName,
          tax_rate: parseFloat(taxRate) || 5,
          tax_trn: taxTrn || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Tax settings saved!');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCompanySettings = async () => {
    if (!user) return;
    setSavingCompany(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_address: companyAddress || null,
          currency: currency,
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Company settings saved!');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSavingCompany(false);
    }
  };

  const saveWhatsappSettings = async () => {
    if (!user) return;
    setSavingWhatsapp(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_api_key: whatsappApiKey || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('WhatsApp API key saved!');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportFromDate || !reportToDate) {
      toast.error('Please select both From and To dates');
      return;
    }

    const fromDate = new Date(reportFromDate);
    const toDate = new Date(reportToDate);
    
    if (fromDate > toDate) {
      toast.error('From date must be before To date');
      return;
    }

    setGeneratingReport(true);
    try {
      const filteredExpenses = expenses.filter((e) => {
        const expDate = new Date(e.date);
        return expDate >= fromDate && expDate <= toDate;
      });

      if (filteredExpenses.length === 0) {
        toast.error('No expenses found in selected date range');
        return;
      }

      await generateExpenseReport(filteredExpenses, fromDate, toDate, profile?.business_name || 'MessFlow');
      toast.success('Expense report downloaded!');
    } catch (error: any) {
      toast.error('Failed to generate report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCleanup = async () => {
    if (!cleanupDate) {
      toast.error('Please select a date');
      return;
    }

    setCleaning(true);
    try {
      await deleteOldReceipts(new Date(cleanupDate));
      setCleanupOpen(false);
      setCleanupDate('');
      toast.success('Old receipts deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete receipts: ' + error.message);
    } finally {
      setCleaning(false);
    }
  };

  const storagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your mess settings and data</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="backdrop-blur-xl bg-card/80 border border-border flex-wrap h-auto">
            <TabsTrigger value="company" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="tax" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Tax & Legal
            </TabsTrigger>
            <TabsTrigger value="storage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4 mr-2" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Settings
                </GlassCardTitle>
                <GlassCardDescription>
                  Configure your business details for invoices and branding
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {/* Company Logo Upload */}
                <CompanyLogoUpload currentLogoUrl={(profile as any)?.company_logo_url} />

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={profile?.business_name || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Business name cannot be changed after signup
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Enter your company address..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GCC_CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This will update all price displays across the app
                  </p>
                </div>

                <Button onClick={saveCompanySettings} disabled={savingCompany}>
                  {savingCompany ? 'Saving...' : 'Save Company Settings'}
                </Button>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Tax & Legal Settings
                </GlassCardTitle>
                <GlassCardDescription>
                  Configure your VAT/Tax settings for invoices and receipts
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxName">Tax Name</Label>
                    <Input
                      id="taxName"
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      placeholder="e.g., VAT, GST"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxTrn">Tax Registration Number (TRN)</Label>
                  <Input
                    id="taxTrn"
                    value={taxTrn}
                    onChange={(e) => setTaxTrn(e.target.value)}
                    placeholder="e.g., 100123456789003"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will appear on all generated invoices
                  </p>
                </div>
                <Button onClick={saveTaxSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Tax Settings'}
                </Button>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            {/* Storage Usage Card */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatBytes(storageUsed)} used</span>
                    <span>{formatBytes(storageLimit)} limit</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        storagePercentage > 90 ? 'bg-destructive' : 
                        storagePercentage > 70 ? 'bg-accent-foreground' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {storagePercentage.toFixed(1)}% of storage used
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Smart Audit Download */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Smart Audit Report
                </GlassCardTitle>
                <GlassCardDescription>
                  Download a comprehensive expense report with all receipts
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={reportFromDate}
                      onChange={(e) => setReportFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={reportToDate}
                      onChange={(e) => setReportToDate(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleGenerateReport} disabled={generatingReport}>
                  <Download className="h-4 w-4 mr-2" />
                  {generatingReport ? 'Generating...' : 'Download Expense Report'}
                </Button>
              </GlassCardContent>
            </GlassCard>

            {/* Storage Cleanup */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Free Up Space
                </GlassCardTitle>
                <GlassCardDescription>
                  Delete old receipt images to reclaim storage
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <Button variant="destructive" onClick={() => setCleanupOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Old Receipts
                </Button>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp Business API
                </GlassCardTitle>
                <GlassCardDescription>
                  Configure your WhatsApp Business API for automated messaging
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="whatsappApiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder="Enter your WhatsApp Business API key"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored securely and used for sending automated WhatsApp messages.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">How to get your API key:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Sign up for WhatsApp Business API (via Meta Business Suite or a provider like Twilio, MessageBird)</li>
                    <li>Create an application and generate an API key</li>
                    <li>Copy and paste the key above</li>
                  </ol>
                </div>
                <Button onClick={saveWhatsappSettings} disabled={savingWhatsapp}>
                  {savingWhatsapp ? 'Saving...' : 'Save WhatsApp Settings'}
                </Button>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Cleanup Dialog */}
        <Dialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Old Receipts
              </DialogTitle>
              <DialogDescription>
                This will permanently delete all receipt images uploaded before the selected date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Warning: Ensure you have downloaded the Smart Audit Report first!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deleted receipts cannot be recovered.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cleanupDate">Delete receipts older than</Label>
                <Input
                  id="cleanupDate"
                  type="date"
                  value={cleanupDate}
                  onChange={(e) => setCleanupDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCleanupOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleCleanup} disabled={cleaning}>
                {cleaning ? 'Deleting...' : 'Delete Receipts'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
