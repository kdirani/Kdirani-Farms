'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Warehouse = {
  id: string;
  farm_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  farm?: {
    name: string;
    location: string | null;
    user_name?: string;
  };
};

export type CreateWarehouseInput = {
  farm_id: string;
  name: string;
};

export type UpdateWarehouseInput = {
  id: string;
  name?: string;
  farm_id?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all warehouses (admin only)
 */
export async function getWarehouses(): Promise<ActionResult<Warehouse[]>> {
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

    // Get all warehouses
    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get farm details for each warehouse
    const warehousesWithFarms: Warehouse[] = [];
    
    for (const warehouse of warehouses || []) {
      let farmInfo = undefined;
      
      if (warehouse.farm_id) {
        const { data: farm } = await supabase
          .from('farms')
          .select('name, location, user_id')
          .eq('id', warehouse.farm_id)
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

      warehousesWithFarms.push({
        ...warehouse,
        farm: farmInfo,
      });
    }

    return { success: true, data: warehousesWithFarms };
  } catch (error) {
    console.error('Error getting warehouses:', error);
    return { success: false, error: 'Failed to get warehouses' };
  }
}

/**
 * Get a single warehouse by ID
 */
export async function getWarehouseById(warehouseId: string): Promise<ActionResult<Warehouse>> {
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

    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', warehouseId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let farmInfo = undefined;
    if (warehouse.farm_id) {
      const { data: farm } = await supabase
        .from('farms')
        .select('name, location, user_id')
        .eq('id', warehouse.farm_id)
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
        ...warehouse,
        farm: farmInfo,
      }
    };
  } catch (error) {
    console.error('Error getting warehouse:', error);
    return { success: false, error: 'Failed to get warehouse' };
  }
}

/**
 * Create a new warehouse (admin only)
 */
export async function createWarehouse(input: CreateWarehouseInput): Promise<ActionResult<Warehouse>> {
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
      return { success: false, error: 'Warehouse name must be at least 2 characters' };
    }

    if (!input.farm_id) {
      return { success: false, error: 'Farm is required' };
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

    // Check if farm already has a warehouse (one warehouse per farm)
    const { data: existingWarehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('farm_id', input.farm_id)
      .single();

    if (existingWarehouse) {
      return { success: false, error: 'Farm already has a warehouse assigned' };
    }

    // Create warehouse
    const { data: newWarehouse, error } = await supabase
      .from('warehouses')
      .insert({
        name: input.name.trim(),
        farm_id: input.farm_id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/warehouses');
    return { success: true, data: newWarehouse };
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return { success: false, error: 'Failed to create warehouse' };
  }
}

/**
 * Update a warehouse (admin only)
 */
export async function updateWarehouse(input: UpdateWarehouseInput): Promise<ActionResult<Warehouse>> {
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
      return { success: false, error: 'Warehouse name must be at least 2 characters' };
    }

    // Check if farm already has a warehouse (if changing farm_id)
    if (input.farm_id) {
      const { data: existingWarehouse } = await supabase
        .from('warehouses')
        .select('id')
        .eq('farm_id', input.farm_id)
        .neq('id', input.id)
        .single();

      if (existingWarehouse) {
        return { success: false, error: 'Farm already has a warehouse assigned' };
      }
    }

    // Update warehouse
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.farm_id !== undefined) updateData.farm_id = input.farm_id;

    const { data: updatedWarehouse, error } = await supabase
      .from('warehouses')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/warehouses');
    return { success: true, data: updatedWarehouse };
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return { success: false, error: 'Failed to update warehouse' };
  }
}

/**
 * Delete a warehouse (admin only)
 */
export async function deleteWarehouse(warehouseId: string): Promise<ActionResult> {
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

    // Delete warehouse (cascade will handle related records)
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', warehouseId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/warehouses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return { success: false, error: 'Failed to delete warehouse' };
  }
}

/**
 * Get warehouses for the current farmer
 */
export async function getFarmerWarehouses(): Promise<ActionResult<Warehouse[]>> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's farm
    const { data: farm } = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!farm) {
      return { success: false, error: 'No farm found for user' };
    }

    // Get warehouses for this farm
    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Add farm info to each warehouse
    const warehousesWithFarms: Warehouse[] = warehouses?.map(warehouse => ({
      ...warehouse,
      farm: {
        name: 'Current Farm',
        location: null,
      },
    })) || [];

    return { success: true, data: warehousesWithFarms };
  } catch (error) {
    console.error('Error getting farmer warehouses:', error);
    return { success: false, error: 'Failed to get warehouses' };
  }
}

/**
 * Get farms without warehouses (for assignment)
 */
export async function getFarmsWithoutWarehouses(): Promise<ActionResult<Array<{ id: string; name: string; location: string | null; is_active: boolean }>>> {
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

    // Get all farms (regardless of active status)
    const { data: allFarms } = await supabase
      .from('farms')
      .select('id, name, location, is_active');

    if (!allFarms || allFarms.length === 0) {
      return { success: true, data: [] };
    }

    // Get farms with warehouses
    const { data: warehousesWithFarms } = await supabase
      .from('warehouses')
      .select('farm_id')
      .not('farm_id', 'is', null);

    const farmIdsWithWarehouses = new Set(warehousesWithFarms?.map(w => w.farm_id) || []);

    // Filter farms without warehouses
    const farmsWithoutWarehouses = allFarms.filter(f => !farmIdsWithWarehouses.has(f.id));

    return { success: true, data: farmsWithoutWarehouses };
  } catch (error) {
    console.error('Error getting farms without warehouses:', error);
    return { success: false, error: 'Failed to get farms' };
  }
}
