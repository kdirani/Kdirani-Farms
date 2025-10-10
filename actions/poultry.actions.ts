'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type PoultryStatus = {
  id: string;
  farm_id: string | null;
  batch_name: string | null;
  opening_chicks: number;
  chick_birth_date: string | null;
  created_at: string;
  updated_at: string;
  farm?: {
    name: string;
    location: string | null;
    user_name?: string;
  };
};

export type CreatePoultryInput = {
  farm_id: string;
  batch_name: string;
  opening_chicks: number;
  chick_birth_date?: string;
};

export type UpdatePoultryInput = {
  id: string;
  batch_name?: string;
  opening_chicks?: number;
  chick_birth_date?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all poultry statuses (admin only)
 */
export async function getPoultryStatuses(): Promise<ActionResult<PoultryStatus[]>> {
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

    // Get all poultry statuses
    const { data: poultryStatuses, error } = await supabase
      .from('poultry_status')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get farm details for each poultry status
    const poultryWithFarms: PoultryStatus[] = [];
    
    for (const poultry of poultryStatuses || []) {
      let farmInfo = undefined;
      
      if (poultry.farm_id) {
        const { data: farm } = await supabase
          .from('farms')
          .select('name, location, user_id')
          .eq('id', poultry.farm_id)
          .single();

        if (farm) {
          let userName = undefined;
          if (farm.user_id) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('fname')
              .eq('id', farm.user_id)
              .single();
            userName = userProfile?.fname;
          }

          farmInfo = {
            name: farm.name,
            location: farm.location,
            user_name: userName,
          };
        }
      }

      poultryWithFarms.push({
        ...poultry,
        farm: farmInfo,
      });
    }

    return { success: true, data: poultryWithFarms };
  } catch (error) {
    console.error('Error getting poultry statuses:', error);
    return { success: false, error: 'Failed to get poultry statuses' };
  }
}

/**
 * Get a single poultry status by ID
 */
export async function getPoultryStatusById(poultryId: string): Promise<ActionResult<PoultryStatus>> {
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

    const { data: poultry, error } = await supabase
      .from('poultry_status')
      .select('*')
      .eq('id', poultryId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let farmInfo = undefined;
    if (poultry.farm_id) {
      const { data: farm } = await supabase
        .from('farms')
        .select('name, location, user_id')
        .eq('id', poultry.farm_id)
        .single();

      if (farm) {
        let userName = undefined;
        if (farm.user_id) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('fname')
            .eq('id', farm.user_id)
            .single();
          userName = userProfile?.fname;
        }

        farmInfo = {
          name: farm.name,
          location: farm.location,
          user_name: userName,
        };
      }
    }

    return { 
      success: true, 
      data: {
        ...poultry,
        farm: farmInfo,
      }
    };
  } catch (error) {
    console.error('Error getting poultry status:', error);
    return { success: false, error: 'Failed to get poultry status' };
  }
}

/**
 * Create a new poultry status (admin only)
 */
export async function createPoultryStatus(input: CreatePoultryInput): Promise<ActionResult<PoultryStatus>> {
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
    if (!input.batch_name || input.batch_name.trim().length < 2) {
      return { success: false, error: 'Batch name must be at least 2 characters' };
    }

    if (!input.farm_id) {
      return { success: false, error: 'Farm is required' };
    }

    if (input.opening_chicks < 0) {
      return { success: false, error: 'Opening chicks must be a positive number' };
    }

    // Check if farm exists
    const { data: farm } = await supabase
      .from('farms')
      .select('id')
      .eq('id', input.farm_id)
      .single();

    if (!farm) {
      return { success: false, error: 'Farm not found' };
    }

    // Check if batch name already exists for this farm
    const { data: existingPoultry } = await supabase
      .from('poultry_status')
      .select('id')
      .eq('farm_id', input.farm_id)
      .eq('batch_name', input.batch_name.trim())
      .single();

    if (existingPoultry) {
      return { success: false, error: 'Batch name already exists for this farm' };
    }

    // Create poultry status
    const { data: newPoultry, error } = await supabase
      .from('poultry_status')
      .insert({
        farm_id: input.farm_id,
        batch_name: input.batch_name.trim(),
        opening_chicks: input.opening_chicks,
        chick_birth_date: input.chick_birth_date || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/poultry');
    return { success: true, data: newPoultry };
  } catch (error) {
    console.error('Error creating poultry status:', error);
    return { success: false, error: 'Failed to create poultry status' };
  }
}

/**
 * Update a poultry status (admin only)
 */
export async function updatePoultryStatus(input: UpdatePoultryInput): Promise<ActionResult<PoultryStatus>> {
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
    if (input.batch_name && input.batch_name.trim().length < 2) {
      return { success: false, error: 'Batch name must be at least 2 characters' };
    }

    if (input.opening_chicks !== undefined && input.opening_chicks < 0) {
      return { success: false, error: 'Opening chicks must be a positive number' };
    }

    // Get current poultry status
    const { data: currentPoultry } = await supabase
      .from('poultry_status')
      .select('*')
      .eq('id', input.id)
      .single();

    if (!currentPoultry) {
      return { success: false, error: 'Poultry status not found' };
    }

    // Update poultry status
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.batch_name !== undefined) updateData.batch_name = input.batch_name.trim();
    if (input.opening_chicks !== undefined) updateData.opening_chicks = input.opening_chicks;
    if (input.chick_birth_date !== undefined) updateData.chick_birth_date = input.chick_birth_date || null;

    const { data: updatedPoultry, error } = await supabase
      .from('poultry_status')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/poultry');
    return { success: true, data: updatedPoultry };
  } catch (error) {
    console.error('Error updating poultry status:', error);
    return { success: false, error: 'Failed to update poultry status' };
  }
}

/**
 * Delete a poultry status (admin only)
 */
export async function deletePoultryStatus(poultryId: string): Promise<ActionResult> {
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

    // Delete poultry status
    const { error } = await supabase
      .from('poultry_status')
      .delete()
      .eq('id', poultryId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/poultry');
    return { success: true };
  } catch (error) {
    console.error('Error deleting poultry status:', error);
    return { success: false, error: 'Failed to delete poultry status' };
  }
}

/**
 * Get farms without poultry status (available for assignment)
 * Since each farm can have only ONE poultry status, we filter out farms that already have one
 */
export async function getAvailableFarmsForPoultry(): Promise<ActionResult<Array<{ id: string; name: string; location: string | null }>>> {
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

    // Get all farms
    const { data: allFarms } = await supabase
      .from('farms')
      .select('id, name, location')
      .order('name');

    if (!allFarms) {
      return { success: true, data: [] };
    }

    // Get all farm IDs that already have poultry status
    const { data: existingPoultry } = await supabase
      .from('poultry_status')
      .select('farm_id');

    const farmsWithPoultry = new Set(existingPoultry?.map(p => p.farm_id) || []);

    // Filter out farms that already have poultry
    const availableFarms = allFarms.filter(farm => !farmsWithPoultry.has(farm.id));

    return { success: true, data: availableFarms };
  } catch (error) {
    console.error('Error getting available farms:', error);
    return { success: false, error: 'Failed to get available farms' };
  }
}

/**
 * @deprecated Use getAvailableFarmsForPoultry() instead
 * This function is kept for backward compatibility
 */
export async function getActiveFarms(): Promise<ActionResult<Array<{ id: string; name: string; location: string | null }>>> {
  return getAvailableFarmsForPoultry();
}
