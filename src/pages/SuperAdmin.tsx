import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { useBroadcasts } from '@/hooks/useBroadcasts';
import { formatDate } from '@/lib/format';
import { Users, Megaphone, Gift, Loader2, Plus, Trash2, CheckCircle, XCircle, Link as LinkIcon, UserPlus, AlertTriangle, HardDrive, Shield, CreditCard, UserCheck, ShieldAlert, Download, Edit2, UsersRound, FileSpreadsheet, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function SuperAdmin() {
  const { isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const { 
    allProfiles, 
    promoCodes, 
    promoAssignments,
    superAdmins,
    profilesLoading, 
    promoLoading,
    assignmentsLoading,
    superAdminsLoading,
    updatePaymentLink,
    updateBusinessName,
    updateSubscription,
    createPromoCode,
    deletePromoCode,
    assignPromoCode,
    removePromoAssignment,
    togglePaymentStatus,
    addSuperAdmin,
    removeSuperAdmin,
    fetchMembersForOwner,
  } = useSuperAdmin();
  
  const { createBroadcast, allBroadcasts } = useBroadcasts();

  const [editingPaymentLink, setEditingPaymentLink] = useState<string | null>(null);
  const [newPaymentLink, setNewPaymentLink] = useState('');
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', days: '30' });
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningPromoId, setAssigningPromoId] = useState<string | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [editingBusinessName, setEditingBusinessName] = useState<string | null>(null);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [exportingOwner, setExportingOwner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">Access Denied</p>
            <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleActivatePlan = async (profileId: string) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    await updateSubscription.mutateAsync({
      profileId,
      status: 'active',
      expiryDate: newExpiry.toISOString(),
    });
  };

  const handleDeactivatePlan = async (profileId: string) => {
    await updateSubscription.mutateAsync({
      profileId,
      status: 'expired',
      expiryDate: new Date().toISOString(),
    });
  };

  const handleSavePaymentLink = async (profileId: string) => {
    await updatePaymentLink.mutateAsync({ profileId, paymentLink: newPaymentLink });
    setEditingPaymentLink(null);
    setNewPaymentLink('');
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPromoCode.mutateAsync({
      code: promoForm.code,
      daysToAdd: Number(promoForm.days),
    });
    setPromoForm({ code: '', days: '30' });
    setIsPromoOpen(false);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBroadcast.mutateAsync(broadcastForm);
    setBroadcastForm({ title: '', message: '' });
    setIsBroadcastOpen(false);
  };

  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSuperAdmin.mutateAsync(newAdminEmail);
    setNewAdminEmail('');
    setIsAddAdminOpen(false);
  };

  const handleOpenAssignDialog = (promoId: string) => {
    const existingAssignments = promoAssignments
      .filter(a => a.promo_code_id === promoId)
      .map(a => a.profile_id);
    setSelectedProfileIds(existingAssignments);
    setAssigningPromoId(promoId);
    setIsAssignOpen(true);
  };

  const handleSaveAssignments = async () => {
    if (!assigningPromoId) return;
    await assignPromoCode.mutateAsync({
      promoCodeId: assigningPromoId,
      profileIds: selectedProfileIds,
    });
    setIsAssignOpen(false);
    setAssigningPromoId(null);
    setSelectedProfileIds([]);
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedProfileIds(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const getPromoAssignmentCount = (promoId: string) => {
    return promoAssignments.filter(a => a.promo_code_id === promoId).length;
  };

  const handleSaveBusinessName = async (profileId: string) => {
    await updateBusinessName.mutateAsync({ profileId, businessName: newBusinessName });
    setEditingBusinessName(null);
    setNewBusinessName('');
  };

  const handleExportMembers = async (profile: typeof allProfiles[0]) => {
    try {
      setExportingOwner(profile.id);
      const members = await fetchMembersForOwner(profile.user_id);
      
      if (members.length === 0) {
        toast.error('No members found for this owner');
        return;
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Member Details with Menu Week Summary
      const memberData = members.map((m, index) => {
        // Format menu summary for this member
        const menuSummary = m.menuDetails?.days
          ?.map(d => `${d.day}: B-${d.breakfast}, L-${d.lunch}, D-${d.dinner}`)
          .join(' | ') || 'No menu assigned';

        return {
          'S.No': index + 1,
          'Member ID': m.id,
          'Name': m.name,
          'Phone': m.phone,
          'Status': m.status,
          'Plan Type': m.plan_type,
          'Menu Week': m.menuDetails?.week ? `Week ${m.menuDetails.week}` : 'Not Set',
          'Balance': m.balance,
          'Monthly Fee': m.monthly_fee,
          'Joining Date': m.joining_date ? new Date(m.joining_date).toLocaleDateString() : '',
          'Plan Expiry Date': m.plan_expiry_date ? new Date(m.plan_expiry_date).toLocaleDateString() : '',
          'Created At': m.created_at ? new Date(m.created_at).toLocaleString() : '',
          'Weekly Menu Summary': menuSummary,
        };
      });

      const memberSheet = XLSX.utils.json_to_sheet(memberData);
      const memberColWidths = Object.keys(memberData[0] || {}).map(key => ({
        wch: key === 'Weekly Menu Summary' ? 100 : Math.max(key.length, 15)
      }));
      memberSheet['!cols'] = memberColWidths;
      XLSX.utils.book_append_sheet(workbook, memberSheet, 'Members');

      // Sheet 2: Detailed Menu by Member
      const menuDetailData: any[] = [];
      members.forEach((m, index) => {
        if (m.menuDetails?.days && m.menuDetails.days.length > 0) {
          m.menuDetails.days.forEach(day => {
            menuDetailData.push({
              'S.No': index + 1,
              'Member Name': m.name,
              'Phone': m.phone,
              'Plan Type': m.plan_type,
              'Menu Week': `Week ${m.menuDetails?.week || 1}`,
              'Day': day.day,
              'Breakfast': day.breakfast,
              'Lunch': day.lunch,
              'Dinner': day.dinner,
            });
          });
        } else {
          menuDetailData.push({
            'S.No': index + 1,
            'Member Name': m.name,
            'Phone': m.phone,
            'Plan Type': m.plan_type,
            'Menu Week': 'Not Set',
            'Day': '-',
            'Breakfast': '-',
            'Lunch': '-',
            'Dinner': '-',
          });
        }
      });

      const menuSheet = XLSX.utils.json_to_sheet(menuDetailData);
      const menuColWidths = Object.keys(menuDetailData[0] || {}).map(key => ({
        wch: Math.max(key.length, 20)
      }));
      menuSheet['!cols'] = menuColWidths;
      XLSX.utils.book_append_sheet(workbook, menuSheet, 'Member Menu Details');

      // Generate filename with current month
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const fileName = `${profile.business_name.replace(/[^a-zA-Z0-9]/g, '_')}_members_menu_${currentMonth.replace(' ', '_')}.xlsx`;
      
      // Write and download
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Exported ${members.length} members with menu details to Excel`);
    } catch (error: any) {
      toast.error('Failed to export: ' + error.message);
    } finally {
      setExportingOwner(null);
    }
  };

  // Calculate total members across all tenants
  const totalMembers = allProfiles.reduce((sum, p) => sum + (p.member_count || 0), 0);

  // Filter and apply search filter
  const tenantProfiles = allProfiles
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.business_name.toLowerCase().includes(query) ||
        p.owner_email.toLowerCase().includes(query)
      );
    });

  // Calculate recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignups = tenantProfiles.filter(p => new Date(p.created_at) >= sevenDaysAgo);

  // Calculate expiring soon (next 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const expiringSoon = tenantProfiles.filter(p => {
    if (!p.subscription_expiry) return false;
    const expiryDate = new Date(p.subscription_expiry);
    return expiryDate >= now && expiryDate <= sevenDaysFromNow;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl border backdrop-blur-xl border-border bg-card/80 p-6 shadow-xl shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Tenant Management
              </h1>
              <p className="text-muted-foreground mt-1">Manage subscriptions and view all registered mess owners</p>
            </div>
            <Link to="/super-admin/security">
              <Button variant="outline" className="border-border hover:bg-accent/50 transition-all duration-300">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Security
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Tenants</p>
                <p className="text-2xl font-bold text-foreground">{profilesLoading ? '—' : tenantProfiles.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">New This Week</p>
                <p className="text-2xl font-bold text-foreground">{profilesLoading ? '—' : recentSignups.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Expiring Soon</p>
                <p className="text-2xl font-bold text-foreground">{profilesLoading ? '—' : expiringSoon.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Promos</p>
                <p className="text-2xl font-bold text-foreground">{promoLoading ? '—' : promoCodes.filter(p => !p.is_used).length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <UsersRound className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{profilesLoading ? '—' : totalMembers}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signups Alert */}
        {recentSignups.length > 0 && (
          <Card className="backdrop-blur-xl border-green-500/30 bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-600 font-semibold">
                <UserPlus className="h-5 w-5" />
                Recent Signups (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSignups.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-green-500/20 hover:bg-green-500/10 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{profile.business_name}</p>
                      <p className="text-sm text-muted-foreground">{profile.owner_email}</p>
                    </div>
                    <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 font-medium">
                      {formatDate(new Date(profile.created_at))}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Soon Alert */}
        {expiringSoon.length > 0 && (
          <Card className="backdrop-blur-xl border-orange-500/30 bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-600 font-semibold">
                <AlertTriangle className="h-5 w-5" />
                Subscriptions Expiring Soon (Next 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringSoon.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-orange-500/20 hover:bg-orange-500/10 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{profile.business_name}</p>
                      <p className="text-sm text-muted-foreground">{profile.owner_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="font-medium">
                        Expires {formatDate(new Date(profile.subscription_expiry!))}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivatePlan(profile.id)}
                        disabled={updateSubscription.isPending}
                        className="border-orange-500/50 text-orange-600 hover:bg-orange-500 hover:text-white transition-colors"
                      >
                        +30 Days
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="tenants" className="w-full">
          <TabsList>
            <TabsTrigger value="tenants">
              <Users className="h-4 w-4 mr-2" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="payment-integration">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Integration
            </TabsTrigger>
            <TabsTrigger value="promos">
              <Gift className="h-4 w-4 mr-2" />
              Promo Codes
            </TabsTrigger>
            <TabsTrigger value="broadcasts">
              <Megaphone className="h-4 w-4 mr-2" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Shield className="h-4 w-4 mr-2" />
              Admins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-4">
            <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold">All Mess Owners</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-border focus:border-border focus:ring-border"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {profilesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : tenantProfiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No registered tenants yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold text-muted-foreground">Mess Name</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Owner Email</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Members</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Signup Date</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Payment</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Expiry Date</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Storage</TableHead>
                          <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenantProfiles.map((profile) => (
                          <TableRow key={profile.id} className="hover:bg-background/50 transition-colors">
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                {profile.business_name}
                                <Dialog 
                                  open={editingBusinessName === profile.id} 
                                  onOpenChange={(open) => {
                                    if (!open) setEditingBusinessName(null);
                                    else {
                                      setEditingBusinessName(profile.id);
                                      setNewBusinessName(profile.business_name);
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-background/50">
                                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Business Name</DialogTitle>
                                      <DialogDescription>Update the business name for this tenant.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Input
                                        value={newBusinessName}
                                        onChange={(e) => setNewBusinessName(e.target.value)}
                                        placeholder="Business Name"
                                        className="border-border focus:border-border focus:ring-border"
                                      />
                                      <Button 
                                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold" 
                                        onClick={() => handleSaveBusinessName(profile.id)}
                                        disabled={updateBusinessName.isPending}
                                      >
                                        {updateBusinessName.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{profile.owner_email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono bg-background/50 text-foreground border-border">
                                {profile.member_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(new Date(profile.created_at))}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={profile.is_paid ? 'default' : 'outline'}
                                className={`${profile.is_paid ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-border text-foreground hover:bg-background/50'} font-medium`}
                                onClick={() => togglePaymentStatus.mutate({ 
                                  profileId: profile.id, 
                                  isPaid: !profile.is_paid 
                                })}
                                disabled={togglePaymentStatus.isPending}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                {profile.is_paid ? 'Paid' : 'Unpaid'}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  profile.subscription_status === 'active' ? 'default' : 
                                  profile.subscription_status === 'trial' ? 'secondary' : 'destructive'
                                }
                                className={`${profile.subscription_status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 
                                  profile.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                                  'bg-red-100 text-red-800 border-red-200'} font-medium`}
                              >
                                {profile.subscription_status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {profile.subscription_expiry 
                                ? formatDate(new Date(profile.subscription_expiry))
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                <span className={profile.storage_used > (profile.storage_limit * 0.9) ? 'text-destructive font-medium' : ''}>
                                  {formatBytes(profile.storage_used || 0)}
                                </span>
                                <span className="text-muted-foreground/70"> / {formatBytes(profile.storage_limit || 104857600)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivatePlan(profile.id)}
                                  disabled={updateSubscription.isPending}
                                  className="border-green-500/50 text-green-600 hover:bg-green-500 hover:text-white font-medium transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeactivatePlan(profile.id)}
                                  disabled={updateSubscription.isPending}
                                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white font-medium transition-colors"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Deactivate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleExportMembers(profile)}
                                  disabled={exportingOwner === profile.id}
                                  title="Export members as Excel"
                                  className="hover:bg-background/50"
                                >
                                  {exportingOwner === profile.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : (
                                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promos" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={isPromoOpen} onOpenChange={setIsPromoOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Promo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Promo Code</DialogTitle>
                    <DialogDescription>Create a new promo code to extend subscription periods.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePromo} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-muted-foreground font-medium">Code</Label>
                      <Input
                        id="code"
                        value={promoForm.code}
                        onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., WELCOME30"
                        required
                        className="border-border focus:border-border focus:ring-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="days" className="text-muted-foreground font-medium">Days to Add</Label>
                      <Input
                        id="days"
                        type="number"
                        value={promoForm.days}
                        onChange={(e) => setPromoForm({ ...promoForm, days: e.target.value })}
                        placeholder="30"
                        required
                        className="border-border focus:border-border focus:ring-border"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold" disabled={createPromoCode.isPending}>
                      {createPromoCode.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Code
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
              <CardContent className="p-0">
                {promoLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : promoCodes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No promo codes created yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-muted-foreground">Code</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Days</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Assigned To</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Created</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoCodes.map((promo) => {
                        const assignmentCount = getPromoAssignmentCount(promo.id);
                        const assignments = promoAssignments.filter(a => a.promo_code_id === promo.id);
                        return (
                          <TableRow key={promo.id} className="hover:bg-background/50 transition-colors">
                            <TableCell className="font-mono font-bold text-foreground">{promo.code}</TableCell>
                            <TableCell className="text-muted-foreground">+{promo.days_to_add} days</TableCell>
                            <TableCell>
                              {assignmentCount === 0 ? (
                                <Badge variant="outline" className="text-muted-foreground border-border bg-background/50">
                                  Public (All Users)
                                </Badge>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {assignments.slice(0, 2).map((a) => (
                                    <Badge key={a.id} variant="secondary" className="text-xs bg-background/50 text-foreground border-border">
                                      {a.profile?.business_name || 'Unknown'}
                                    </Badge>
                                  ))}
                                  {assignmentCount > 2 && (
                                    <Badge variant="secondary" className="text-xs bg-background/50 text-foreground border-border">
                                      +{assignmentCount - 2} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={promo.is_used ? 'secondary' : 'default'} className={`${promo.is_used ? 'bg-background/50 text-foreground border-border' : 'bg-green-100 text-green-800 border-green-200'} font-medium`}>
                                {promo.is_used ? 'Used' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(new Date(promo.created_at))}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOpenAssignDialog(promo.id)}
                                  disabled={promo.is_used}
                                  title="Assign to users"
                                  className="hover:bg-background/50"
                                >
                                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deletePromoCode.mutate(promo.id)}
                                  disabled={deletePromoCode.isPending}
                                  className="hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogContent className="max-w-md max-h-[80vh] backdrop-blur-xl border-border bg-card/80">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Assign Promo Code to Users</DialogTitle>
                  <DialogDescription>Select users who can redeem this promo code.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select users who can use this promo code. Leave empty for public access.
                  </p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-md p-2 bg-background/50">
                    {tenantProfiles.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No tenants found</p>
                    ) : (
                      tenantProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                            selectedProfileIds.includes(profile.id)
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-background/50'
                          }`}
                          onClick={() => toggleProfileSelection(profile.id)}
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">{profile.business_name}</p>
                            <p className="text-xs text-muted-foreground">{profile.owner_email}</p>
                          </div>
                          {selectedProfileIds.includes(profile.id) && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedProfileIds.length === 0 
                        ? 'Public (all users can use)' 
                        : `${selectedProfileIds.length} user(s) selected`}
                    </span>
                    {selectedProfileIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProfileIds([])}
                        className="text-muted-foreground hover:text-foreground hover:bg-background/50"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold" 
                    onClick={handleSaveAssignments}
                    disabled={assignPromoCode.isPending}
                  >
                    {assignPromoCode.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Assignment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="broadcasts" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold">
                    <Megaphone className="h-4 w-4 mr-1" />
                    Send Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send System Update</DialogTitle>
                    <DialogDescription>Broadcast an announcement to all mess owners.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-muted-foreground font-medium">Title</Label>
                      <Input
                        id="title"
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                        placeholder="e.g., New Feature Released!"
                        required
                        className="border-border focus:border-border focus:ring-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-muted-foreground font-medium">Message</Label>
                      <Textarea
                        id="message"
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                        placeholder="Write your announcement..."
                        rows={4}
                        required
                        className="border-border focus:border-border focus:ring-border"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold" disabled={createBroadcast.isPending}>
                      {createBroadcast.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send to All Owners
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
              <CardContent className="p-0">
                {allBroadcasts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No broadcasts sent yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-muted-foreground">Title</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Message</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Sent On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBroadcasts.map((broadcast) => (
                        <TableRow key={broadcast.id} className="hover:bg-background/50 transition-colors">
                          <TableCell className="font-medium text-foreground">{broadcast.title}</TableCell>
                          <TableCell className="text-muted-foreground max-w-md truncate">
                            {broadcast.message}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(new Date(broadcast.created_at))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-integration" className="mt-4 space-y-4">
            <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-semibold text-foreground">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Integration Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">Configure payment gateway settings and manage payment integrations for tenants.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payment Gateway Configuration */}
                  <Card className="border-border bg-background/50">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Payment Gateway Settings</CardTitle>
                      <p className="text-sm text-muted-foreground">Configure your preferred payment gateway for tenant subscriptions.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Payment Gateway</Label>
                        <select className="w-full p-2 border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="razorpay">Razorpay</option>
                          <option value="stripe">Stripe</option>
                          <option value="paypal">PayPal</option>
                          <option value="manual">Manual Payment</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">API Key</Label>
                        <Input 
                          type="password" 
                          placeholder="Enter your API key"
                          className="border-border focus:border-border focus:ring-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Secret Key</Label>
                        <Input 
                          type="password" 
                          placeholder="Enter your secret key"
                          className="border-border focus:border-border focus:ring-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Webhook URL</Label>
                        <Input 
                          type="text" 
                          value="https://api.messflow.com/webhook/payments"
                          readOnly
                          className="border-border bg-background/50 text-muted-foreground"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold">
                          Save Configuration
                        </Button>
                        <Button variant="outline" className="border-border text-foreground hover:bg-background/50">
                          Test Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tenant Payment Status */}
                  <Card className="border-border bg-background/50">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Tenant Payment Overview</CardTitle>
                      <p className="text-sm text-muted-foreground">Monitor payment status and integration setup for all tenants.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Active Integrations</p>
                            <p className="text-sm text-muted-foreground">Tenants with working payment setup</p>
                          </div>
                          <Badge variant="default" className="bg-green-500/20 text-green-700 border-green-500/50 font-medium">
                            {tenantProfiles.filter(p => p.payment_link).length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Pending Setup</p>
                            <p className="text-sm text-muted-foreground">Tenants without payment integration</p>
                          </div>
                          <Badge variant="default" className="bg-orange-500/20 text-orange-700 border-orange-500/50 font-medium">
                            {tenantProfiles.filter(p => !p.payment_link).length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Manual Payments</p>
                            <p className="text-sm text-muted-foreground">Tenants using manual payment method</p>
                          </div>
                          <Badge variant="default" className="bg-blue-500/20 text-blue-700 border-blue-500/50 font-medium">
                            {tenantProfiles.filter(p => p.is_paid && !p.payment_link).length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                  {/* Tenant Payment Details */}
                <div className="mt-6">
                  <Card className="border-border bg-background/50">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Tenant Payment Details</CardTitle>
                      <p className="text-sm text-muted-foreground">Detailed view of payment integration status for each tenant.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-semibold text-muted-foreground">Business Name</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Payment Gateway</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Integration Status</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Last Payment</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tenantProfiles.map((profile) => (
                              <TableRow key={profile.id} className="hover:bg-background/50 transition-colors">
                                <TableCell className="font-medium text-foreground">{profile.business_name}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-background/50 text-foreground border-border">
                                    {profile.payment_link ? 'Razorpay' : 'Manual'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={profile.payment_link ? 'default' : 'destructive'}
                                    className={`${profile.payment_link ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} font-medium`}
                                  >
                                    {profile.payment_link ? 'Active' : 'Not Configured'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {profile.subscription_expiry ? formatDate(new Date(profile.subscription_expiry)) : '—'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Dialog 
                                      open={editingPaymentLink === profile.id} 
                                      onOpenChange={(open) => {
                                        if (!open) setEditingPaymentLink(null);
                                        else {
                                          setEditingPaymentLink(profile.id);
                                          setNewPaymentLink(profile.payment_link || '');
                                        }
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                                        >
                                          Configure
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Configure Payment Link</DialogTitle>
                                          <DialogDescription>Set a payment link for {profile.business_name} to enable subscription payments.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="paymentLink" className="text-sm font-medium">Payment Link</Label>
                                            <Input
                                              id="paymentLink"
                                              value={newPaymentLink}
                                              onChange={(e) => setNewPaymentLink(e.target.value)}
                                              placeholder="https://razorpay.me/your-link"
                                              className="border-border focus:border-border focus:ring-border"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                              This link will be used when users click "Subscribe Now" in the Pricing page
                                            </p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button 
                                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold" 
                                              onClick={() => handleSavePaymentLink(profile.id)}
                                              disabled={updatePaymentLink.isPending}
                                            >
                                              {updatePaymentLink.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                              Save Payment Link
                                            </Button>
                                            <Button 
                                              variant="outline"
                                              onClick={() => {
                                                setNewPaymentLink('https://wa.me/971501234567?text=I%20want%20to%20subscribe%20to%20MessFlow');
                                              }}
                                              className="border-border text-foreground hover:bg-background/50"
                                            >
                                              Use Default WhatsApp
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (profile.payment_link) {
                                          window.open(profile.payment_link, '_blank');
                                        } else {
                                          toast.error('No payment link configured for this tenant');
                                        }
                                      }}
                                      className="border-green-500/50 text-green-600 hover:bg-green-500/10"
                                    >
                                      Test Payment Link
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Super Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Assistant Super Admin</DialogTitle>
                    <DialogDescription>Grant super admin privileges to another user.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSuperAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="text-muted-foreground font-medium">User Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="user@example.com"
                        required
                        className="border-border focus:border-border focus:ring-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        The user must have already signed up to be added as a super admin.
                      </p>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold" disabled={addSuperAdmin.isPending}>
                      {addSuperAdmin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Super Admin
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="backdrop-blur-xl border-border bg-card/80 hover:shadow-lg hover:shadow-glass transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-semibold text-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  Super Administrators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {superAdminsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : superAdmins.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No super admins found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-muted-foreground">Email</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Added On</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {superAdmins.map((admin) => (
                        <TableRow key={admin.id} className="hover:bg-background/50 transition-colors">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              {admin.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(new Date(admin.created_at))}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeSuperAdmin.mutate(admin.id)}
                              disabled={removeSuperAdmin.isPending}
                              className="hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
