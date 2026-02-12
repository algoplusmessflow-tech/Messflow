import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Menu = Database['public']['Tables']['menu']['Row'];
type MenuInsert = Database['public']['Tables']['menu']['Insert'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKS = [1, 2, 3, 4];

export function useMenu() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: menu = [], isLoading } = useQuery({
    queryKey: ['menu', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('owner_id', user.id)
        .order('week_number', { ascending: true })
        .order('day', { ascending: true });
      
      if (error) throw error;
      return data as Menu[];
    },
    enabled: !!user,
  });

  const upsertMenu = useMutation({
    mutationFn: async (menuItem: Omit<MenuInsert, 'owner_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if menu exists for this week+day combination
      const { data: existing } = await supabase
        .from('menu')
        .select('id')
        .eq('owner_id', user.id)
        .eq('week_number', menuItem.week_number || 1)
        .eq('day', menuItem.day)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('menu')
          .update({
            breakfast: menuItem.breakfast,
            lunch: menuItem.lunch,
            dinner: menuItem.dinner,
            optional_dishes: menuItem.optional_dishes,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('menu')
          .insert({ ...menuItem, owner_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu updated!');
    },
    onError: (error) => {
      toast.error('Failed to update menu: ' + error.message);
    },
  });

  const getMenuForWeekDay = (weekNumber: number, day: string) => {
    return menu.find((m) => m.week_number === weekNumber && m.day === day);
  };

  const getMenuForDay = (day: string) => {
    // Default to week 1 for backwards compatibility
    return menu.find((m) => m.day === day && m.week_number === 1);
  };

  const getMenuForWeek = (weekNumber: number) => {
    return menu.filter((m) => m.week_number === weekNumber);
  };

  const getTodayMenu = () => {
    const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    // Get current week of month (1-4)
    const currentWeek = Math.ceil(new Date().getDate() / 7);
    const weekNumber = currentWeek > 4 ? 4 : currentWeek;
    return getMenuForWeekDay(weekNumber, today) || getMenuForDay(today);
  };

  const formatMenuForWhatsApp = () => {
    const todayMenu = getTodayMenu();
    if (!todayMenu) return 'No menu set for today.';
    
    const dayName = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    let message = `🍽️ *Today's Menu (${dayName})*\n\n🌅 *Breakfast:* ${todayMenu.breakfast || 'Not set'}\n\n🌞 *Lunch:* ${todayMenu.lunch || 'Not set'}\n\n🌙 *Dinner:* ${todayMenu.dinner || 'Not set'}`;
    
    // Add optional dishes if available
    const optionalDishes = todayMenu.optional_dishes as string[] | null;
    if (optionalDishes && optionalDishes.length > 0) {
      message += `\n\n✨ *Optional Dishes:*\n${optionalDishes.map(d => `• ${d}`).join('\n')}`;
    }
    
    return message;
  };

  const formatWeekMenuForPDF = (weekNumber: number) => {
    const weekMenu = getMenuForWeek(weekNumber);
    return DAYS.map(day => {
      const dayMenu = weekMenu.find(m => m.day === day);
      return {
        day,
        breakfast: dayMenu?.breakfast || 'Not set',
        lunch: dayMenu?.lunch || 'Not set',
        dinner: dayMenu?.dinner || 'Not set',
        optionalDishes: (dayMenu?.optional_dishes as string[] | null) || [],
      };
    });
  };

  return {
    menu,
    isLoading,
    upsertMenu,
    getMenuForDay,
    getMenuForWeekDay,
    getMenuForWeek,
    getTodayMenu,
    formatMenuForWhatsApp,
    formatWeekMenuForPDF,
    DAYS,
    WEEKS,
  };
}
