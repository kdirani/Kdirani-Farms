'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export type Farm = {
  id: string;
  user_id: string | null;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    fname: string;
    email: string;
  };
  type?: string;
  warehouses_count?: number;
  warehouses_names?: string[];
  poultry_name?: string;
  poultry_opening_chicks?: number;
  poultry_current_chicks?: number;
  reports_count?: number;
  last_report_date?: string;
  avg_egg_production?: number;
  invoices_count?: number;
  last_invoice_date?: string;
  total_invoices_value?: number;
};

export type CreateFarmInput = {
  user_id?: string;
  name: string;
  location?: string;
  is_active?: boolean;
};

export type UpdateFarmInput = {
  id: string;
  name?: string;
  location?: string;
  is_active?: boolean;
  user_id?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all farms (admin only)
 */
export async function getFarms(): Promise<ActionResult<Farm[]>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.user_role !== 'admin' && profile.user_role !== 'sub_admin')) {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Get all farms
    const { data: farms, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get user details for each farm
    const adminClient = await createAdminClient();
    const farmsWithUsers: Farm[] = [];
    
    for (const farm of farms || []) {
      let userInfo = undefined;
      
      if (farm.user_id) {
        const { data: authUser } = await adminClient.auth.admin.getUserById(farm.user_id);
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('fname')
          .eq('id', farm.user_id)
          .single();

        if (authUser?.user && userProfile) {
          userInfo = {
            fname: userProfile.fname,
            email: authUser.user.email || '',
          };
        }
      }

      farmsWithUsers.push({
        ...farm,
        user: userInfo,
      });
    }

    return { success: true, data: farmsWithUsers };
  } catch (error) {
    console.error('Error getting farms:', error);
    return { success: false, error: 'Failed to get farms' };
  }
}

/**
 * Get a single farm by ID
 */
export async function getFarmById(farmId: string): Promise<ActionResult<Farm>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.user_role !== 'admin' && profile.user_role !== 'sub_admin')) {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    const { data: farm, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let userInfo = undefined;
    if (farm.user_id) {
      const adminClient = await createAdminClient();
      const { data: authUser } = await adminClient.auth.admin.getUserById(farm.user_id);
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('fname')
        .eq('id', farm.user_id)
        .single();

      if (authUser?.user && userProfile) {
        userInfo = {
          fname: userProfile.fname,
          email: authUser.user.email || '',
        };
      }
    }

    return { 
      success: true, 
      data: {
        ...farm,
        user: userInfo,
      }
    };
  } catch (error) {
    console.error('Error getting farm:', error);
    return { success: false, error: 'Failed to get farm' };
  }
}

/**
 * Create a new farm (admin only)
 */
export async function createFarm(input: CreateFarmInput): Promise<ActionResult<Farm>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Validate input
    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Farm name must be at least 2 characters' };
    }

    // Check if user already has a farm (one farm per user)
    if (input.user_id) {
      const { data: existingFarm } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', input.user_id)
        .single();

      if (existingFarm) {
        return { success: false, error: 'User already has a farm assigned' };
      }
    }

    // Create farm
    const { data: newFarm, error } = await supabase
      .from('farms')
      .insert({
        name: input.name.trim(),
        location: input.location?.trim() || null,
        user_id: input.user_id || null,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/farms');
    return { success: true, data: newFarm };
  } catch (error) {
    console.error('Error creating farm:', error);
    return { success: false, error: 'Failed to create farm' };
  }
}

/**
 * Update a farm (admin only)
 */
export async function updateFarm(input: UpdateFarmInput): Promise<ActionResult<Farm>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Validate input
    if (input.name && input.name.trim().length < 2) {
      return { success: false, error: 'Farm name must be at least 2 characters' };
    }

    // Check if user already has a farm (if changing user_id)
    if (input.user_id) {
      const { data: existingFarm } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', input.user_id)
        .neq('id', input.id)
        .single();

      if (existingFarm) {
        return { success: false, error: 'User already has a farm assigned' };
      }
    }

    // Update farm
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.location !== undefined) updateData.location = input.location?.trim() || null;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.user_id !== undefined) updateData.user_id = input.user_id || null;

    const { data: updatedFarm, error } = await supabase
      .from('farms')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/farms');
    return { success: true, data: updatedFarm };
  } catch (error) {
    console.error('Error updating farm:', error);
    return { success: false, error: 'Failed to update farm' };
  }
}

/**
 * Delete a farm (admin only)
 */
export async function deleteFarm(farmId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Delete farm (cascade will handle related records)
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/farms');
    return { success: true };
  } catch (error) {
    console.error('Error deleting farm:', error);
    return { success: false, error: 'Failed to delete farm' };
  }
}

/**
 * Get users without farms (for assignment)
 */
export async function getUsersWithoutFarms(): Promise<ActionResult<Array<{ id: string; fname: string; email: string }>>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Get all users with farmer role
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, fname')
      .eq('user_role', 'farmer');

    if (!allProfiles || allProfiles.length === 0) {
      return { success: true, data: [] };
    }

    // Get users with farms
    const { data: farmsWithUsers } = await supabase
      .from('farms')
      .select('user_id')
      .not('user_id', 'is', null);

    const userIdsWithFarms = new Set(farmsWithUsers?.map(f => f.user_id) || []);

    // Filter users without farms
    const usersWithoutFarms = allProfiles.filter(p => !userIdsWithFarms.has(p.id));

    if (usersWithoutFarms.length === 0) {
      return { success: true, data: [] };
    }

    // Use admin client to get emails from auth
    const adminClient = await createAdminClient();
    const usersWithEmails = [];
    
    for (const profile of usersWithoutFarms) {
      try {
        // Try to get user from auth using admin API
        const { data: authData } = await adminClient.auth.admin.getUserById(profile.id);
        if (authData?.user) {
          usersWithEmails.push({
            id: profile.id,
            fname: profile.fname,
            email: authData.user.email || 'No email',
          });
        }
      } catch (error) {
        // If admin API fails, still include user but without email
        console.error(`Failed to get email for user ${profile.id}:`, error);
        usersWithEmails.push({
          id: profile.id,
          fname: profile.fname,
          email: 'Email unavailable',
        });
      }
    }

    return { success: true, data: usersWithEmails };
  } catch (error) {
    console.error('Error getting users without farms:', error);
    return { success: false, error: 'Failed to get users' };
  }
}
