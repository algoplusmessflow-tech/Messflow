import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, X, Loader2, Building } from 'lucide-react';
import { uploadCompanyLogo } from '@/lib/cloudinary';

interface CompanyLogoUploadProps {
  currentLogoUrl?: string | null;
}

export function CompanyLogoUpload({ currentLogoUrl }: CompanyLogoUploadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Upload to Cloudinary
      const logoUrl = await uploadCompanyLogo(file);

      // Update profile with logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_logo_url: logoUrl } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!user || !currentLogoUrl) return;

    setRemoving(true);
    try {
      // Note: Cloudinary image remains until manually deleted via dashboard
      // We just clear the reference in the database

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ company_logo_url: null } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Logo removed!');
    } catch (error: any) {
      toast.error('Failed to remove logo: ' + error.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Company Logo</Label>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-border">
          {currentLogoUrl ? (
            <AvatarImage src={currentLogoUrl} alt="Company logo" />
          ) : (
            <AvatarFallback className="bg-muted">
              <Building className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
              </>
            )}
          </Button>
          
          {currentLogoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="text-destructive hover:text-destructive"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Recommended: Square image, max 5MB. Will appear on invoices.
      </p>
    </div>
  );
}
