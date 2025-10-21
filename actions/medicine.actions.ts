'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Medicine = {
  id: string;
  name: string;
  description: string | null;
  day_of_age: string;
  created_at: string;
  updated_at: string;
};

export type CreateMedicineInput = {
  name: string;
  description?: string;
  day_of_age: string;
};

export type UpdateMedicineInput = {
  id: string;
  name: string;
  description?: string;
  day_of_age: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all medicines
 */
export async function getMedicines(): Promise<ActionResult<Medicine[]>> {
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

    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: medicines || [] };
  } catch (error) {
    console.error('Error getting medicines:', error);
    return { success: false, error: 'Failed to get medicines' };
  }
}

/**
 * Create a new medicine
 */
export async function createMedicine(input: CreateMedicineInput): Promise<ActionResult<Medicine>> {
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

    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Medicine name must be at least 2 characters' };
    }

    if (!input.day_of_age || input.day_of_age.trim().length < 1) {
      return { success: false, error: 'Day of age is required' };
    }

    // Check if medicine already exists
    const { data: existing } = await supabase
      .from('medicines')
      .select('id')
      .eq('name', input.name.trim())
      .single();

    if (existing) {
      return { success: false, error: 'Medicine name already exists' };
    }

    const { data: newMedicine, error } = await supabase
      .from('medicines')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        day_of_age: input.day_of_age.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/medicines');
    return { success: true, data: newMedicine };
  } catch (error) {
    console.error('Error creating medicine:', error);
    return { success: false, error: 'Failed to create medicine' };
  }
}

/**
 * Update a medicine
 */
export async function updateMedicine(input: UpdateMedicineInput): Promise<ActionResult<Medicine>> {
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

    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Medicine name must be at least 2 characters' };
    }

    if (!input.day_of_age || input.day_of_age.trim().length < 1) {
      return { success: false, error: 'Day of age is required' };
    }

    // Check if medicine name already exists (excluding current record)
    const { data: existing } = await supabase
      .from('medicines')
      .select('id')
      .eq('name', input.name.trim())
      .neq('id', input.id)
      .single();

    if (existing) {
      return { success: false, error: 'Medicine name already exists' };
    }

    const { data: updatedMedicine, error } = await supabase
      .from('medicines')
      .update({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        day_of_age: input.day_of_age.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/medicines');
    return { success: true, data: updatedMedicine };
  } catch (error) {
    console.error('Error updating medicine:', error);
    return { success: false, error: 'Failed to update medicine' };
  }
}

/**
 * Delete a medicine
 */
export async function deleteMedicine(id: string): Promise<ActionResult> {
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
      .from('medicines')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/medicines');
    return { success: true };
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return { success: false, error: 'Failed to delete medicine' };
  }
}

/**
 * Get all medicines for farmers (read-only access)
 */
export async function getFarmerMedicines(): Promise<ActionResult<Medicine[]>> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Farmers can read medicines
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: medicines || [] };
  } catch (error) {
    console.error('Error getting farmer medicines:', error);
    return { success: false, error: 'Failed to get medicines' };
  }
}
