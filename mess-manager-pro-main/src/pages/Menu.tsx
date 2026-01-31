import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMenu } from '@/hooks/useMenu';
import { useProfile } from '@/hooks/useProfile';
import { generateMenuPDF } from '@/lib/menu-pdf-generator';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Save, Loader2, Plus, X, FileDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Menu() {
  const { menu, isLoading, upsertMenu, formatMenuForWhatsApp, formatWeekMenuForPDF, DAYS, WEEKS, getMenuForWeekDay } = useMenu();
  const { profile } = useProfile();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [formData, setFormData] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    optionalDishes: [] as string[],
  });
  const [newOptionalDish, setNewOptionalDish] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const dayMenu = getMenuForWeekDay(selectedWeek, selectedDay);
    setFormData({
      breakfast: dayMenu?.breakfast || '',
      lunch: dayMenu?.lunch || '',
      dinner: dayMenu?.dinner || '',
      optionalDishes: (dayMenu?.optional_dishes as string[] | null) || [],
    });
    setHasChanges(false);
  }, [selectedWeek, selectedDay, menu]);

  const handleSave = async () => {
    await upsertMenu.mutateAsync({
      day: selectedDay,
      week_number: selectedWeek,
      breakfast: formData.breakfast.trim() || null,
      lunch: formData.lunch.trim() || null,
      dinner: formData.dinner.trim() || null,
      optional_dishes: formData.optionalDishes.length > 0 ? formData.optionalDishes : null,
    });
    setHasChanges(false);
  };

  const handleWhatsAppBlast = () => {
    const message = formatMenuForWhatsApp();
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const handleAddOptionalDish = () => {
    if (newOptionalDish.trim()) {
      const updatedDishes = [...formData.optionalDishes, newOptionalDish.trim()];
      handleChange('optionalDishes', updatedDishes);
      setNewOptionalDish('');
    }
  };

  const handleRemoveOptionalDish = (index: number) => {
    const updatedDishes = formData.optionalDishes.filter((_, i) => i !== index);
    handleChange('optionalDishes', updatedDishes);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const menuData = formatWeekMenuForPDF(selectedWeek);
      const blob = await generateMenuPDF(
        selectedWeek,
        menuData,
        profile?.business_name || 'Mess Menu'
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu-week-${selectedWeek}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Menu PDF downloaded!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSharePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const menuData = formatWeekMenuForPDF(selectedWeek);
      const blob = await generateMenuPDF(
        selectedWeek,
        menuData,
        profile?.business_name || 'Mess Menu'
      );
      
      // Upload PDF to storage for sharing
      const fileName = `menu-week-${selectedWeek}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase
        .storage
        .from('receipts')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        throw new Error('Failed to upload PDF: ' + uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Create a shareable message with the PDF link
      const message = `📋 *Week ${selectedWeek} Menu* from ${profile?.business_name || 'Our Mess'}\n\nDownload the complete menu PDF here:\n${publicUrl}\n\nEnjoy your meals! 🍽️`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      toast.success('Menu PDF shared via WhatsApp!');
    } catch (error) {
      toast.error('Failed to generate PDF for sharing');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Weekly Menu</h1>
            <p className="text-muted-foreground">Manage your weekly menu plans</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Download PDF
            </Button>
            <Button onClick={handleSharePDF} variant="outline" disabled={isGeneratingPDF}>
              <Share2 className="h-4 w-4 mr-2" />
              Share PDF
            </Button>
            <Button onClick={handleWhatsAppBlast} variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Today's Menu
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Week Selection */}
            <div className="flex gap-2 flex-wrap">
              {WEEKS.map((week) => (
                <Button
                  key={week}
                  variant={selectedWeek === week ? 'default' : 'outline'}
                  onClick={() => setSelectedWeek(week)}
                  className="min-w-[80px]"
                >
                  Week {week}
                </Button>
              ))}
            </div>

            {/* Day Tabs */}
            <Tabs value={selectedDay} onValueChange={setSelectedDay}>
              <TabsList className="w-full flex overflow-x-auto">
                {DAYS.map((day) => (
                  <TabsTrigger key={day} value={day} className="flex-1 min-w-fit text-xs sm:text-sm">
                    {day.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {DAYS.map((day) => (
                <TabsContent key={day} value={day} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Week {selectedWeek} - {day}
                        <Badge variant="secondary" className="ml-auto">
                          {formData.optionalDishes.length} optional dishes
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="breakfast">🌅 Breakfast</Label>
                          <Textarea
                            id="breakfast"
                            value={formData.breakfast}
                            onChange={(e) => handleChange('breakfast', e.target.value)}
                            placeholder="e.g., Poha, Tea, Toast"
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lunch">🌞 Lunch</Label>
                          <Textarea
                            id="lunch"
                            value={formData.lunch}
                            onChange={(e) => handleChange('lunch', e.target.value)}
                            placeholder="e.g., Dal, Rice, Sabzi, Roti"
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dinner">🌙 Dinner</Label>
                          <Textarea
                            id="dinner"
                            value={formData.dinner}
                            onChange={(e) => handleChange('dinner', e.target.value)}
                            placeholder="e.g., Paneer, Roti, Rice"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>

                      {/* Optional Dishes Section */}
                      <div className="border-t pt-4">
                        <Label className="text-base font-semibold">✨ Optional Dishes</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add extra dishes available for this day
                        </p>
                        
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Add optional dish..."
                            value={newOptionalDish}
                            onChange={(e) => setNewOptionalDish(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOptionalDish())}
                          />
                          <Button onClick={handleAddOptionalDish} size="icon" variant="secondary">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {formData.optionalDishes.map((dish, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                              {dish}
                              <button
                                onClick={() => handleRemoveOptionalDish(index)}
                                className="ml-2 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          {formData.optionalDishes.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No optional dishes added</p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={handleSave}
                        className="w-full"
                        disabled={!hasChanges || upsertMenu.isPending}
                      >
                        {upsertMenu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Menu
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
