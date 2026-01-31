import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type AppRole = 'super_admin' | 'mess_owner';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user,
  });

  const isSuperAdmin = roles.includes('super_admin');
  const isMessOwner = !isSuperAdmin; // Default role for non-super-admins

  return {
    roles,
    isSuperAdmin,
    isMessOwner,
    isLoading,
  };
}
