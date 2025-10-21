'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type MaterialName = {
  id: string;
  material_name: string;
  created_at: string;
  updated_at: string;
};

export type CreateMaterialNameInput = {
  material_name: string;
};

export type UpdateMaterialNameInput = {
  id: string;
  material_name: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all material names
 */
export async function getMaterialNames(): Promise<ActionResult<MaterialName[]>> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
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

    const { data: materialNames, error } = await supabase
      .from('materials_names')
      .select('*')
      .order('material_name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: materialNames || [] };
  } catch (error) {
    console.error('Error getting material names:', error);
    return { success: false, error: 'Failed to get material names' };
  }
}

/**
 * Create a new material name
 */
export async function createMaterialName(input: CreateMaterialNameInput): Promise<ActionResult<MaterialName>> {
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

    if (!input.material_name || input.material_name.trim().length < 2) {
      return { success: false, error: 'Material name must be at least 2 characters' };
    }

    // Check if material name already exists
    const { data: existing } = await supabase
      .from('materials_names')
      .select('id')
      .eq('material_name', input.material_name.trim())
      .single();

    if (existing) {
      return { success: false, error: 'Material name already exists' };
    }

    const { data: newMaterialName, error } = await supabase
      .from('materials_names')
      .insert({
        material_name: input.material_name.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/materials-names');
    return { success: true, data: newMaterialName };
  } catch (error) {
    console.error('Error creating material name:', error);
    return { success: false, error: 'Failed to create material name' };
  }
}

/**
 * Update a material name
 */
export async function updateMaterialName(input: UpdateMaterialNameInput): Promise<ActionResult<MaterialName>> {
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

    if (!input.material_name || input.material_name.trim().length < 2) {
      return { success: false, error: 'Material name must be at least 2 characters' };
    }

    // Check if material name already exists (excluding current record)
    const { data: existing } = await supabase
      .from('materials_names')
      .select('id')
      .eq('material_name', input.material_name.trim())
      .neq('id', input.id)
      .single();

    if (existing) {
      return { success: false, error: 'Material name already exists' };
    }

    const { data: updatedMaterialName, error } = await supabase
      .from('materials_names')
      .update({
        material_name: input.material_name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/materials-names');
    return { success: true, data: updatedMaterialName };
  } catch (error) {
    console.error('Error updating material name:', error);
    return { success: false, error: 'Failed to update material name' };
  }
}

/**
 * Delete a material name
 */
export async function deleteMaterialName(id: string): Promise<ActionResult> {
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
      .from('materials_names')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/materials-names');
    return { success: true };
  } catch (error) {
    console.error('Error deleting material name:', error);
    return { success: false, error: 'Failed to delete material name' };
  }
}

/**
 * Get all material names for farmers (read-only access)
 */
export async function getFarmerMaterialNames(): Promise<ActionResult<MaterialName[]>> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Farmers can read material names
    const { data: materialNames, error } = await supabase
      .from('materials_names')
      .select('*')
      .order('material_name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: materialNames || [] };
  } catch (error) {
    console.error('Error getting farmer material names:', error);
    return { success: false, error: 'Failed to get material names' };
  }
}
