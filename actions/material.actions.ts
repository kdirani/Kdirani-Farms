'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Material = {
  id: string;
  warehouse_id: string | null;
  material_name_id: string | null;
  unit_id: string | null;
  opening_balance: number;
  purchases: number;
  sales: number;
  consumption: number;
  manufacturing: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  warehouse?: {
    name: string;
    farm_name: string;
  };
  material_name?: string;
  unit_name?: string;
};

export type CreateMaterialInput = {
  warehouse_id: string;
  material_name_id: string;
  unit_id: string;
  opening_balance: number;
};

export type UpdateMaterialInput = {
  id: string;
  opening_balance?: number;
  purchases?: number;
  sales?: number;
  consumption?: number;
  manufacturing?: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all materials with their details
 */
export async function getMaterials(): Promise<ActionResult<Material[]>> {
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

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Enrich materials with warehouse, material name, and unit info
    const enrichedMaterials: Material[] = [];
    
    for (const material of materials || []) {
      let warehouseInfo = undefined;
      let materialName = undefined;
      let unitName = undefined;

      if (material.warehouse_id) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select('name, farm_id')
          .eq('id', material.warehouse_id)
          .single();

        if (warehouse) {
          const { data: farm } = await supabase
            .from('farms')
            .select('name')
            .eq('id', warehouse.farm_id)
            .single();

          warehouseInfo = {
            name: warehouse.name,
            farm_name: farm?.name || 'Unknown Farm',
          };
        }
      }

      if (material.material_name_id) {
        const { data: matName } = await supabase
          .from('materials_names')
          .select('material_name')
          .eq('id', material.material_name_id)
          .single();
        materialName = matName?.material_name;
      }

      if (material.unit_id) {
        const { data: unit } = await supabase
          .from('measurement_units')
          .select('unit_name')
          .eq('id', material.unit_id)
          .single();
        unitName = unit?.unit_name;
      }

      enrichedMaterials.push({
        ...material,
        warehouse: warehouseInfo,
        material_name: materialName,
        unit_name: unitName,
      });
    }

    return { success: true, data: enrichedMaterials };
  } catch (error) {
    console.error('Error getting materials:', error);
    return { success: false, error: 'Failed to get materials' };
  }
}

/**
 * Create a new material
 */
export async function createMaterial(input: CreateMaterialInput): Promise<ActionResult<Material>> {
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

    if (input.opening_balance < 0) {
      return { success: false, error: 'Opening balance cannot be negative' };
    }

    // Check if material already exists for this warehouse
    const { data: existing } = await supabase
      .from('materials')
      .select('id')
      .eq('warehouse_id', input.warehouse_id)
      .eq('material_name_id', input.material_name_id)
      .single();

    if (existing) {
      return { success: false, error: 'This material already exists in the selected warehouse' };
    }

    const { data: newMaterial, error } = await supabase
      .from('materials')
      .insert({
        warehouse_id: input.warehouse_id,
        material_name_id: input.material_name_id,
        unit_id: input.unit_id,
        opening_balance: input.opening_balance,
        current_balance: input.opening_balance,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/materials');
    return { success: true, data: newMaterial };
  } catch (error) {
    console.error('Error creating material:', error);
    return { success: false, error: 'Failed to create material' };
  }
}

/**
 * Update a material
 */
export async function updateMaterial(input: UpdateMaterialInput): Promise<ActionResult<Material>> {
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

    // Get current material
    const { data: current } = await supabase
      .from('materials')
      .select('*')
      .eq('id', input.id)
      .single();

    if (!current) {
      return { success: false, error: 'Material not found' };
    }

    // Calculate new current balance
    const newOpeningBalance = input.opening_balance ?? current.opening_balance;
    const newPurchases = input.purchases ?? current.purchases;
    const newSales = input.sales ?? current.sales;
    const newConsumption = input.consumption ?? current.consumption;
    const newManufacturing = input.manufacturing ?? current.manufacturing;

    const newCurrentBalance = newOpeningBalance + newPurchases + newManufacturing - newSales - newConsumption;

    const updateData: any = {
      updated_at: new Date().toISOString(),
      current_balance: newCurrentBalance,
    };

    if (input.opening_balance !== undefined) updateData.opening_balance = input.opening_balance;
    if (input.purchases !== undefined) updateData.purchases = input.purchases;
    if (input.sales !== undefined) updateData.sales = input.sales;
    if (input.consumption !== undefined) updateData.consumption = input.consumption;
    if (input.manufacturing !== undefined) updateData.manufacturing = input.manufacturing;

    const { data: updatedMaterial, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/materials');
    return { success: true, data: updatedMaterial };
  } catch (error) {
    console.error('Error updating material:', error);
    return { success: false, error: 'Failed to update material' };
  }
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string): Promise<ActionResult> {
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
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/materials');
    return { success: true };
  } catch (error) {
    console.error('Error deleting material:', error);
    return { success: false, error: 'Failed to delete material' };
  }
}

/**
 * Get warehouses for dropdown
 */
export async function getWarehousesForMaterials(): Promise<ActionResult<Array<{ id: string; name: string; farm_name: string }>>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id, name, farm_id');

    const warehousesWithFarms = [];
    for (const warehouse of warehouses || []) {
      const { data: farm } = await supabase
        .from('farms')
        .select('name')
        .eq('id', warehouse.farm_id)
        .single();

      warehousesWithFarms.push({
        id: warehouse.id,
        name: warehouse.name,
        farm_name: farm?.name || 'Unknown',
      });
    }

    return { success: true, data: warehousesWithFarms };
  } catch (error) {
    console.error('Error getting warehouses:', error);
    return { success: false, error: 'Failed to get warehouses' };
  }
}
