'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Material = {
  id: string;
  warehouse_id: string | null;
  material_name_id: string | null;
  medicine_id: string | null;
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
  material_name_id?: string;
  medicine_id?: string;
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

export type MaterialsSummary = {
  total_materials: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_warehouses: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get aggregated materials from all warehouses
 */
export async function getMaterialsAggregated(): Promise<ActionResult<Material[]>> {
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

    // Get aggregated data using SQL
    const { data: aggregatedData, error } = await supabase.rpc('get_aggregated_materials');

    if (error) {
      // If the RPC doesn't exist, fall back to manual aggregation
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (materialsError) {
        return { success: false, error: materialsError.message };
      }

      // Manual aggregation
      const grouped = new Map<string, any>();

      for (const material of materials || []) {
        // Create unique key based on material_name_id or medicine_id
        const itemId = material.material_name_id || material.medicine_id;
        const key = `${itemId}-${material.unit_id}`;
        
        if (grouped.has(key)) {
          const existing = grouped.get(key);
          existing.opening_balance += material.opening_balance;
          existing.purchases += material.purchases;
          existing.sales += material.sales;
          existing.consumption += material.consumption;
          existing.manufacturing += material.manufacturing;
          existing.current_balance += material.current_balance;
        } else {
          grouped.set(key, {
            id: key,
            warehouse_id: null,
            material_name_id: material.material_name_id,
            medicine_id: material.medicine_id,
            unit_id: material.unit_id,
            opening_balance: material.opening_balance,
            purchases: material.purchases,
            sales: material.sales,
            consumption: material.consumption,
            manufacturing: material.manufacturing,
            current_balance: material.current_balance,
            created_at: material.created_at,
            updated_at: material.updated_at,
          });
        }
      }

      const enrichedMaterials: Material[] = [];
      
      for (const material of Array.from(grouped.values())) {
        let materialName = undefined;
        let unitName = undefined;

        // Check if it's a material or medicine
        if (material.material_name_id) {
          const { data: matName } = await supabase
            .from('materials_names')
            .select('material_name')
            .eq('id', material.material_name_id)
            .single();
          materialName = matName?.material_name;
        } else if (material.medicine_id) {
          // Get medicine name
          const { data: medicine } = await supabase
            .from('medicines')
            .select('name')
            .eq('id', material.medicine_id)
            .single();
          materialName = medicine?.name ? `💊 ${medicine.name}` : undefined;
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
          warehouse: {
            name: 'جميع المستودعات',
            farm_name: 'عام',
          },
          material_name: materialName,
          unit_name: unitName,
        });
      }

      return { success: true, data: enrichedMaterials };
    }

    return { success: true, data: aggregatedData };
  } catch (error) {
    console.error('Error getting aggregated materials:', error);
    return { success: false, error: 'Failed to get aggregated materials' };
  }
}

/**
 * Get all materials with their details (optionally filtered by warehouse)
 */
export async function getMaterials(warehouseFilter?: string): Promise<ActionResult<Material[]>> {
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

      // Check if it's a material or medicine
      if (material.material_name_id) {
        const { data: matName } = await supabase
          .from('materials_names')
          .select('material_name')
          .eq('id', material.material_name_id)
          .single();
        materialName = matName?.material_name;
      } else if (material.medicine_id) {
        // Get medicine name
        const { data: medicine } = await supabase
          .from('medicines')
          .select('name')
          .eq('id', material.medicine_id)
          .single();
        materialName = medicine?.name ? `💊 ${medicine.name}` : undefined;
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

    // Apply warehouse filter if provided
    let filteredMaterials = enrichedMaterials;
    if (warehouseFilter && warehouseFilter !== 'all') {
      filteredMaterials = enrichedMaterials.filter((material) => {
        if (!material.warehouse) return false;
        const display = `${material.warehouse.name} - ${material.warehouse.farm_name}`;
        return display === warehouseFilter;
      });
    }

    return { success: true, data: filteredMaterials };
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

    // Validate that either material_name_id or medicine_id is provided
    if (!input.material_name_id && !input.medicine_id) {
      return { success: false, error: 'Either material name or medicine must be provided' };
    }

    if (input.material_name_id && input.medicine_id) {
      return { success: false, error: 'Cannot provide both material name and medicine' };
    }

    // Check if material/medicine already exists for this warehouse
    let existing;
    if (input.material_name_id) {
      const { data } = await supabase
        .from('materials')
        .select('id')
        .eq('warehouse_id', input.warehouse_id)
        .eq('material_name_id', input.material_name_id)
        .maybeSingle();
      existing = data;
    } else if (input.medicine_id) {
      const { data } = await supabase
        .from('materials')
        .select('id')
        .eq('warehouse_id', input.warehouse_id)
        .eq('medicine_id', input.medicine_id)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      return { success: false, error: 'This item already exists in the selected warehouse' };
    }

    const { data: newMaterial, error } = await supabase
      .from('materials')
      .insert({
        warehouse_id: input.warehouse_id,
        material_name_id: input.material_name_id || null,
        medicine_id: input.medicine_id || null,
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

/**
 * Get material or medicine inventory for a specific warehouse
 * Supports both material_name_id and medicine_id
 */
export async function getMaterialInventory(
  warehouseId: string,
  materialOrMedicineId: string
): Promise<ActionResult<{ current_balance: number; unit_name: string }>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Try to find by material_name_id first
    let material = await supabase
      .from('materials')
      .select('current_balance, unit_id')
      .eq('warehouse_id', warehouseId)
      .eq('material_name_id', materialOrMedicineId)
      .maybeSingle();

    // If not found, try medicine_id
    if (!material.data) {
      material = await supabase
        .from('materials')
        .select('current_balance, unit_id')
        .eq('warehouse_id', warehouseId)
        .eq('medicine_id', materialOrMedicineId)
        .maybeSingle();
    }

    if (!material.data) {
      // Material/Medicine not found in warehouse
      return { success: true, data: { current_balance: 0, unit_name: '' } };
    }

    let unitName = '';
    if (material.data.unit_id) {
      const { data: unit } = await supabase
        .from('measurement_units')
        .select('unit_name')
        .eq('id', material.data.unit_id)
        .single();
      unitName = unit?.unit_name || '';
    }

    return {
      success: true,
      data: {
        current_balance: material.data.current_balance || 0,
        unit_name: unitName,
      },
    };
  } catch (error) {
    console.error('Error getting material inventory:', error);
    return { success: false, error: 'Failed to get material inventory' };
  }
}

/**
 * Get materials summary statistics
 */
export async function getMaterialsSummary(): Promise<ActionResult<MaterialsSummary>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: materials } = await supabase
      .from('materials')
      .select('current_balance');

    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id');

    const totalMaterials = materials?.length || 0;
    const lowStockCount = materials?.filter(m => m.current_balance > 0 && m.current_balance < 100).length || 0;
    const outOfStockCount = materials?.filter(m => m.current_balance === 0).length || 0;
    const totalWarehouses = warehouses?.length || 0;

    return {
      success: true,
      data: {
        total_materials: totalMaterials,
        total_value: 0, // Can be calculated if we add price tracking
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_warehouses: totalWarehouses,
      },
    };
  } catch (error) {
    console.error('Error getting materials summary:', error);
    return { success: false, error: 'Failed to get materials summary' };
  }
}
