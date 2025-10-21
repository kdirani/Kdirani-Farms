'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type EggWeight = {
  id: string;
  weight_range: string;
  created_at: string;
  updated_at: string;
};

export type CreateEggWeightInput = {
  weight_range: string;
};

export type UpdateEggWeightInput = {
  id: string;
  weight_range: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all egg weights
 */
export async function getEggWeights(): Promise<ActionResult<EggWeight[]>> {
  try {
    const supabase = await createClient();

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

    const { data: eggWeights, error } = await supabase
      .from('egg_weights')
      .select('*')
      .order('weight_range');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: eggWeights || [] };
  } catch (error) {
    console.error('Error getting egg weights:', error);
    return { success: false, error: 'Failed to get egg weights' };
  }
}

/**
 * Create a new egg weight
 */
export async function createEggWeight(input: CreateEggWeightInput): Promise<ActionResult<EggWeight>> {
  try {
    const supabase = await createClient();

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

    if (!input.weight_range || input.weight_range.trim().length < 2) {
      return { success: false, error: 'Weight range must be at least 2 characters' };
    }

    // Check if weight range already exists
    const { data: existing } = await supabase
      .from('egg_weights')
      .select('id')
      .eq('weight_range', input.weight_range.trim())
      .single();

    if (existing) {
      return { success: false, error: 'Weight range already exists' };
    }

    const { data: newEggWeight, error } = await supabase
      .from('egg_weights')
      .insert({
        weight_range: input.weight_range.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/egg-weights');
    return { success: true, data: newEggWeight };
  } catch (error) {
    console.error('Error creating egg weight:', error);
    return { success: false, error: 'Failed to create egg weight' };
  }
}

/**
 * Update an egg weight
 */
export async function updateEggWeight(input: UpdateEggWeightInput): Promise<ActionResult<EggWeight>> {
  try {
    const supabase = await createClient();

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

    if (!input.weight_range || input.weight_range.trim().length < 2) {
      return { success: false, error: 'Weight range must be at least 2 characters' };
    }

    // Check if weight range already exists (excluding current record)
    const { data: existing } = await supabase
      .from('egg_weights')
      .select('id')
      .eq('weight_range', input.weight_range.trim())
      .neq('id', input.id)
      .single();

    if (existing) {
      return { success: false, error: 'Weight range already exists' };
    }

    const { data: updatedEggWeight, error } = await supabase
      .from('egg_weights')
      .update({
        weight_range: input.weight_range.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/egg-weights');
    return { success: true, data: updatedEggWeight };
  } catch (error) {
    console.error('Error updating egg weight:', error);
    return { success: false, error: 'Failed to update egg weight' };
  }
}

/**
 * Delete an egg weight
 */
export async function deleteEggWeight(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

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

    const { error } = await supabase
      .from('egg_weights')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/egg-weights');
    return { success: true };
  } catch (error) {
    console.error('Error deleting egg weight:', error);
    return { success: false, error: 'Failed to delete egg weight' };
  }
}

/**
 * Get all egg weights for farmers (read-only access)
 */
export async function getFarmerEggWeights(): Promise<ActionResult<EggWeight[]>> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Farmers can read egg weights
    const { data: eggWeights, error } = await supabase
      .from('egg_weights')
      .select('*')
      .order('weight_range');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: eggWeights || [] };
  } catch (error) {
    console.error('Error getting farmer egg weights:', error);
    return { success: false, error: 'Failed to get egg weights' };
  }
}
