'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ManufacturingItem = {
  id: string;
  manufacturing_invoice_id: string;
  material_name_id: string | null;
  unit_id: string | null;
  quantity: number;
  blend_count: number;
  weight: number | null;
  material_name?: string;
  unit_name?: string;
};

export type CreateManufacturingItemInput = {
  manufacturing_invoice_id: string;
  material_name_id: string;
  unit_id: string;
  quantity: number;
  blend_count?: number;
  weight?: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get manufacturing items
 */
export async function getManufacturingItems(invoiceId: string): Promise<ActionResult<ManufacturingItem[]>> {
  try {
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from('manufacturing_invoice_items')
      .select('*')
      .eq('manufacturing_invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedItems: ManufacturingItem[] = [];
    
    for (const item of items || []) {
      let materialName, unitName;

      if (item.material_name_id) {
        const { data } = await supabase
          .from('materials_names')
          .select('material_name')
          .eq('id', item.material_name_id)
          .single();
        materialName = data?.material_name;
      }

      if (item.unit_id) {
        const { data } = await supabase
          .from('measurement_units')
          .select('unit_name')
          .eq('id', item.unit_id)
          .single();
        unitName = data?.unit_name;
      }

      enrichedItems.push({
        ...item,
        material_name: materialName,
        unit_name: unitName,
      });
    }

    return { success: true, data: enrichedItems };
  } catch (error) {
    console.error('Error getting manufacturing items:', error);
    return { success: false, error: 'Failed to get manufacturing items' };
  }
}

/**
 * Create manufacturing item (input material - decreases inventory)
 */
export async function createManufacturingItem(input: CreateManufacturingItemInput): Promise<ActionResult<ManufacturingItem>> {
  try {
    const supabase = await createClient();

    // Get manufacturing invoice to get warehouse_id
    const { data: invoice } = await supabase
      .from('manufacturing_invoices')
      .select('warehouse_id')
      .eq('id', input.manufacturing_invoice_id)
      .single();

    if (!invoice || !invoice.warehouse_id) {
      return { success: false, error: 'Manufacturing invoice or warehouse not found' };
    }

    // Decrease input material from warehouse inventory
    const inventoryResult = await decreaseWarehouseInventory(
      invoice.warehouse_id,
      input.material_name_id,
      input.quantity
    );

    if (!inventoryResult.success) {
      return { success: false, error: inventoryResult.error };
    }

    const { data: newItem, error } = await supabase
      .from('manufacturing_invoice_items')
      .insert({
        manufacturing_invoice_id: input.manufacturing_invoice_id,
        material_name_id: input.material_name_id,
        unit_id: input.unit_id,
        quantity: input.quantity,
        blend_count: input.blend_count || 1,
        weight: input.weight || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/manufacturing/${input.manufacturing_invoice_id}`);
    return { success: true, data: newItem };
  } catch (error) {
    console.error('Error creating manufacturing item:', error);
    return { success: false, error: 'Failed to create manufacturing item' };
  }
}

/**
 * Delete manufacturing item (reverses inventory decrease)
 */
export async function deleteManufacturingItem(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: item } = await supabase
      .from('manufacturing_invoice_items')
      .select('manufacturing_invoice_id, material_name_id, quantity')
      .eq('id', id)
      .single();

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Get manufacturing invoice to get warehouse_id
    const { data: invoice } = await supabase
      .from('manufacturing_invoices')
      .select('warehouse_id')
      .eq('id', item.manufacturing_invoice_id)
      .single();

    // Reverse the inventory decrease by increasing it back
    if (invoice?.warehouse_id && item.material_name_id) {
      await increaseWarehouseInventory(
        invoice.warehouse_id,
        item.material_name_id,
        item.quantity
      );
    }

    const { error } = await supabase
      .from('manufacturing_invoice_items')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/manufacturing/${item.manufacturing_invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting manufacturing item:', error);
    return { success: false, error: 'Failed to delete manufacturing item' };
  }
}

/**
 * Decrease warehouse inventory for input materials (consumption)
 */
async function decreaseWarehouseInventory(
  warehouseId: string,
  materialNameId: string,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (!existingMaterial) {
    return { success: false, error: 'Material not found in warehouse inventory' };
  }

  // Check if enough stock available
  if (existingMaterial.current_balance < quantity) {
    return { 
      success: false, 
      error: `Insufficient stock. Available: ${existingMaterial.current_balance}, Required: ${quantity}` 
    };
  }

  // Update: increase consumption, decrease current_balance
  const newConsumption = existingMaterial.consumption + quantity;
  const newBalance = existingMaterial.current_balance - quantity;

  await supabase
    .from('materials')
    .update({
      consumption: newConsumption,
      current_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingMaterial.id);

  return { success: true };
}

/**
 * Increase warehouse inventory (reverse consumption)
 */
async function increaseWarehouseInventory(
  warehouseId: string,
  materialNameId: string,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (existingMaterial) {
    // Reverse: decrease consumption, increase balance
    await supabase
      .from('materials')
      .update({
        consumption: existingMaterial.consumption - quantity,
        current_balance: existingMaterial.current_balance + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMaterial.id);
  }

  return { success: true };
}
