'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type MeasurementUnit = {
  id: string;
  unit_name: string;
  created_at: string;
  updated_at: string;
};

export type CreateUnitInput = {
  unit_name: string;
};

export type UpdateUnitInput = {
  id: string;
  unit_name: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all measurement units
 */
export async function getMeasurementUnits(): Promise<ActionResult<MeasurementUnit[]>> {
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

    const { data: units, error } = await supabase
      .from('measurement_units')
      .select('*')
      .order('unit_name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: units || [] };
  } catch (error) {
    console.error('Error getting measurement units:', error);
    return { success: false, error: 'Failed to get measurement units' };
  }
}

/**
 * Create a new measurement unit
 */
export async function createMeasurementUnit(input: CreateUnitInput): Promise<ActionResult<MeasurementUnit>> {
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

    if (!input.unit_name || input.unit_name.trim().length < 1) {
      return { success: false, error: 'Unit name is required' };
    }

    // Check if unit name already exists
    const { data: existing } = await supabase
      .from('measurement_units')
      .select('id')
      .eq('unit_name', input.unit_name.trim())
      .single();

    if (existing) {
      return { success: false, error: 'Unit name already exists' };
    }

    const { data: newUnit, error } = await supabase
      .from('measurement_units')
      .insert({
        unit_name: input.unit_name.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/units');
    return { success: true, data: newUnit };
  } catch (error) {
    console.error('Error creating measurement unit:', error);
    return { success: false, error: 'Failed to create measurement unit' };
  }
}

/**
 * Update a measurement unit
 */
export async function updateMeasurementUnit(input: UpdateUnitInput): Promise<ActionResult<MeasurementUnit>> {
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

    if (!input.unit_name || input.unit_name.trim().length < 1) {
      return { success: false, error: 'Unit name is required' };
    }

    // Check if unit name already exists (excluding current record)
    const { data: existing } = await supabase
      .from('measurement_units')
      .select('id')
      .eq('unit_name', input.unit_name.trim())
      .neq('id', input.id)
      .single();

    if (existing) {
      return { success: false, error: 'Unit name already exists' };
    }

    const { data: updatedUnit, error } = await supabase
      .from('measurement_units')
      .update({
        unit_name: input.unit_name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/units');
    return { success: true, data: updatedUnit };
  } catch (error) {
    console.error('Error updating measurement unit:', error);
    return { success: false, error: 'Failed to update measurement unit' };
  }
}

/**
 * Delete a measurement unit
 */
export async function deleteMeasurementUnit(id: string): Promise<ActionResult> {
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
      .from('measurement_units')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/units');
    return { success: true };
  } catch (error) {
    console.error('Error deleting measurement unit:', error);
    return { success: false, error: 'Failed to delete measurement unit' };
  }
}
