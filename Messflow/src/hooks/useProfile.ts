import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createProfile = useMutation({
    mutationFn: async ({ businessName }: { businessName: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          business_name: businessName,
          owner_email: user.email!,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create profile: ' + error.message);
    },
  });

  const incrementInvoiceNumber = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      const nextNumber = ((profile as any).next_invoice_number || 1) + 1;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          next_invoice_number: nextNumber,
          invoice_count: ((profile as any).invoice_count || 0) + 1 
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;
      return nextNumber - 1; // Return the current number that was used
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Legacy incrementInvoiceCount for backward compatibility
  const incrementInvoiceCount = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      const currentCount = (profile as any).invoice_count || 0;
      const { error } = await supabase
        .from('profiles')
        .update({ invoice_count: currentCount + 1 } as any)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<typeof profile>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  return {
    profile,
    isLoading,
    createProfile,
    updateProfile,
    incrementInvoiceNumber,
    incrementInvoiceCount,
    hasProfile: !!profile,
    getNextInvoiceNumber: () => (profile as any)?.next_invoice_number || 1,
  };
}
