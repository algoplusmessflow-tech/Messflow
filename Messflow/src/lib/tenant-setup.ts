import { supabase } from '@/integrations/supabase/client';

export interface TenantFolderSetupResult {
  success: boolean;
  tenantId: string;
  folders?: string[];
  error?: string;
}

/**
 * Create Google Drive folders for a new tenant
 * This function is called after a user signs up to automatically
 * create their tenant-specific folder structure in Google Drive
 */
export async function setupTenantFolders(tenantId: string): Promise<TenantFolderSetupResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-tenant-folders`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenantId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Folder setup failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Folder setup failed');
  }

  return result.data;
}

/**
 * Enhanced signup function that includes automatic folder creation
 */
export async function signupWithFolderSetup(
  email: string,
  password: string,
  businessName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Create user account
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          business_name: businessName.trim(),
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Step 2: Wait a moment for the profile to be created by the trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Set up Google Drive folders for the tenant
      try {
        await setupTenantFolders(data.user.id);
        console.log('Tenant folders created successfully for:', data.user.id);
      } catch (folderError) {
        console.error('Failed to create tenant folders:', folderError);
        // Don't fail the signup if folder creation fails, just log it
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}