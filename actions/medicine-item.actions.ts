'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type MedicineItem = {
  id: string;
  consumption_invoice_id: string;
  medicine_id: string | null;
  unit_id: string | null;
  administration_day: number | null;
  administration_date: string | null;
  quantity: number;
  price: number;
  value: number;
  medicine_name?: string;
  unit_name?: string;
};

export type CreateMedicineItemInput = {
  consumption_invoice_id: string;
  medicine_id: string;
  unit_id: string;
  administration_day?: number;
  administration_date?: string;
  quantity: number;
  price: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get medicine consumption items
 */
export async function getMedicineItems(invoiceId: string): Promise<ActionResult<MedicineItem[]>> {
  try {
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from('medicine_consumption_items')
      .select('*')
      .eq('consumption_invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedItems: MedicineItem[] = [];
    
    for (const item of items || []) {
      let medicineName, unitName;

      if (item.medicine_id) {
        const { data } = await supabase
          .from('medicines')
          .select('name')
          .eq('id', item.medicine_id)
          .single();
        medicineName = data?.name;
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
        medicine_name: medicineName,
        unit_name: unitName,
      });
    }

    return { success: true, data: enrichedItems };
  } catch (error) {
    console.error('Error getting medicine items:', error);
    return { success: false, error: 'Failed to get medicine items' };
  }
}

/**
 * Create medicine consumption item (decreases warehouse inventory)
 */
export async function createMedicineItem(input: CreateMedicineItemInput): Promise<ActionResult<MedicineItem>> {
  try {
    const supabase = await createClient();

    const value = input.quantity * input.price;

    // Get invoice to get warehouse_id
    const { data: invoice } = await supabase
      .from('medicine_consumption_invoices')
      .select('warehouse_id')
      .eq('id', input.consumption_invoice_id)
      .single();

    if (!invoice || !invoice.warehouse_id) {
      return { success: false, error: 'Invoice or warehouse not found' };
    }

    // Get medicine to find material_name_id
    const { data: medicine } = await supabase
      .from('medicines')
      .select('material_name_id')
      .eq('id', input.medicine_id)
      .single();

    if (!medicine || !medicine.material_name_id) {
      return { success: false, error: 'Medicine not linked to material' };
    }

    // Decrease medicine from warehouse inventory
    const inventoryResult = await decreaseMedicineInventory(
      invoice.warehouse_id,
      medicine.material_name_id,
      input.quantity
    );

    if (!inventoryResult.success) {
      return { success: false, error: inventoryResult.error };
    }

    const { data: newItem, error } = await supabase
      .from('medicine_consumption_items')
      .insert({
        consumption_invoice_id: input.consumption_invoice_id,
        medicine_id: input.medicine_id,
        unit_id: input.unit_id,
        administration_day: input.administration_day || null,
        administration_date: input.administration_date || null,
        quantity: input.quantity,
        price: input.price,
        value: value,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update invoice total
    await updateInvoiceTotal(input.consumption_invoice_id);

    revalidatePath(`/admin/medicines-invoices/${input.consumption_invoice_id}`);
    return { success: true, data: newItem };
  } catch (error) {
    console.error('Error creating medicine item:', error);
    return { success: false, error: 'Failed to create medicine item' };
  }
}

/**
 * Delete medicine consumption item (reverses inventory decrease)
 */
export async function deleteMedicineItem(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: item } = await supabase
      .from('medicine_consumption_items')
      .select('consumption_invoice_id, medicine_id, quantity')
      .eq('id', id)
      .single();

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Get invoice to get warehouse_id
    const { data: invoice } = await supabase
      .from('medicine_consumption_invoices')
      .select('warehouse_id')
      .eq('id', item.consumption_invoice_id)
      .single();

    // Get medicine to find material_name_id
    if (item.medicine_id) {
      const { data: medicine } = await supabase
        .from('medicines')
        .select('material_name_id')
        .eq('id', item.medicine_id)
        .single();

      // Reverse the inventory decrease
      if (invoice?.warehouse_id && medicine?.material_name_id) {
        await increaseMedicineInventory(
          invoice.warehouse_id,
          medicine.material_name_id,
          item.quantity
        );
      }
    }

    const { error } = await supabase
      .from('medicine_consumption_items')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotal(item.consumption_invoice_id);

    revalidatePath(`/admin/medicines-invoices/${item.consumption_invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting medicine item:', error);
    return { success: false, error: 'Failed to delete medicine item' };
  }
}

/**
 * Decrease medicine from warehouse inventory (consumption)
 */
async function decreaseMedicineInventory(
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
    return { success: false, error: 'Medicine not found in warehouse inventory' };
  }

  // Check if enough stock available
  if (existingMaterial.current_balance < quantity) {
    return { 
      success: false, 
      error: `Insufficient medicine stock. Available: ${existingMaterial.current_balance}, Required: ${quantity}` 
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
 * Increase medicine in warehouse (reverse consumption)
 */
async function increaseMedicineInventory(
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

/**
 * Update invoice total value
 */
async function updateInvoiceTotal(invoiceId: string) {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from('medicine_consumption_items')
    .select('value')
    .eq('consumption_invoice_id', invoiceId);

  const totalItems = items?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

  const { data: expenses } = await supabase
    .from('medicine_consumption_expenses')
    .select('amount')
    .eq('consumption_invoice_id', invoiceId);

  const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

  const totalValue = totalItems + totalExpenses;

  await supabase
    .from('medicine_consumption_invoices')
    .update({ total_value: totalValue })
    .eq('id', invoiceId);
}
