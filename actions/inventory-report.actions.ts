'use server';

import { createClient } from '@/lib/supabase/server';

export type InventoryReport = {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  farm_name: string;
  material_name_id: string;
  material_name: string;
  unit_id: string;
  unit_name: string;
  opening_balance: number;
  purchases: number;
  sales: number;
  consumption: number;
  manufacturing: number;
  current_balance: number;
  updated_at: string;
};

export type InventorySummary = {
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
 * Get complete inventory report for all warehouses
 */
export async function getInventoryReport(): Promise<ActionResult<InventoryReport[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .order('current_balance', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedMaterials: InventoryReport[] = [];

    for (const material of materials || []) {
      let warehouseName = 'Unknown', farmName = 'Unknown';
      let materialName = 'Unknown', unitName = 'Unknown';

      // Get warehouse and farm info
      if (material.warehouse_id) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select('name, farm_id')
          .eq('id', material.warehouse_id)
          .single();

        if (warehouse) {
          warehouseName = warehouse.name;
          
          const { data: farm } = await supabase
            .from('farms')
            .select('name')
            .eq('id', warehouse.farm_id)
            .single();

          if (farm) {
            farmName = farm.name;
          }
        }
      }

      // Get material name
      if (material.material_name_id) {
        const { data: matName } = await supabase
          .from('materials_names')
          .select('material_name')
          .eq('id', material.material_name_id)
          .single();

        if (matName) {
          materialName = matName.material_name;
        }
      }

      // Get unit name
      if (material.unit_id) {
        const { data: unit } = await supabase
          .from('measurement_units')
          .select('unit_name')
          .eq('id', material.unit_id)
          .single();

        if (unit) {
          unitName = unit.unit_name;
        }
      }

      enrichedMaterials.push({
        id: material.id,
        warehouse_id: material.warehouse_id,
        warehouse_name: warehouseName,
        farm_name: farmName,
        material_name_id: material.material_name_id,
        material_name: materialName,
        unit_id: material.unit_id,
        unit_name: unitName,
        opening_balance: material.opening_balance || 0,
        purchases: material.purchases || 0,
        sales: material.sales || 0,
        consumption: material.consumption || 0,
        manufacturing: material.manufacturing || 0,
        current_balance: material.current_balance || 0,
        updated_at: material.updated_at,
      });
    }

    return { success: true, data: enrichedMaterials };
  } catch (error) {
    console.error('Error getting inventory report:', error);
    return { success: false, error: 'Failed to get inventory report' };
  }
}

/**
 * Get inventory summary statistics
 */
export async function getInventorySummary(): Promise<ActionResult<InventorySummary>> {
  try {
    const supabase = await createClient();

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
    console.error('Error getting inventory summary:', error);
    return { success: false, error: 'Failed to get inventory summary' };
  }
}

/**
 * Get inventory report filtered by warehouse
 */
export async function getInventoryByWarehouse(warehouseId: string): Promise<ActionResult<InventoryReport[]>> {
  try {
    const supabase = await createClient();

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('current_balance', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedMaterials: InventoryReport[] = [];

    for (const material of materials || []) {
      let warehouseName = 'Unknown', farmName = 'Unknown';
      let materialName = 'Unknown', unitName = 'Unknown';

      if (material.warehouse_id) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select('name, farm_id')
          .eq('id', material.warehouse_id)
          .single();

        if (warehouse) {
          warehouseName = warehouse.name;
          
          const { data: farm } = await supabase
            .from('farms')
            .select('name')
            .eq('id', warehouse.farm_id)
            .single();

          if (farm) {
            farmName = farm.name;
          }
        }
      }

      if (material.material_name_id) {
        const { data: matName } = await supabase
          .from('materials_names')
          .select('material_name')
          .eq('id', material.material_name_id)
          .single();

        if (matName) {
          materialName = matName.material_name;
        }
      }

      if (material.unit_id) {
        const { data: unit } = await supabase
          .from('measurement_units')
          .select('unit_name')
          .eq('id', material.unit_id)
          .single();

        if (unit) {
          unitName = unit.unit_name;
        }
      }

      enrichedMaterials.push({
        id: material.id,
        warehouse_id: material.warehouse_id,
        warehouse_name: warehouseName,
        farm_name: farmName,
        material_name_id: material.material_name_id,
        material_name: materialName,
        unit_id: material.unit_id,
        unit_name: unitName,
        opening_balance: material.opening_balance || 0,
        purchases: material.purchases || 0,
        sales: material.sales || 0,
        consumption: material.consumption || 0,
        manufacturing: material.manufacturing || 0,
        current_balance: material.current_balance || 0,
        updated_at: material.updated_at,
      });
    }

    return { success: true, data: enrichedMaterials };
  } catch (error) {
    console.error('Error getting warehouse inventory:', error);
    return { success: false, error: 'Failed to get warehouse inventory' };
  }
}
