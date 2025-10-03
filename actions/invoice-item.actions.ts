'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  material_name_id: string | null;
  unit_id: string | null;
  egg_weight_id: string | null;
  quantity: number;
  weight: number | null;
  price: number;
  value: number;
  material_name?: string;
  unit_name?: string;
  egg_weight?: string;
};

export type CreateInvoiceItemInput = {
  invoice_id: string;
  material_name_id?: string;
  unit_id: string;
  egg_weight_id?: string;
  quantity: number;
  weight?: number;
  price: number;
};

export type UpdateInvoiceItemInput = {
  id: string;
  quantity?: number;
  weight?: number;
  price?: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get invoice items
 */
export async function getInvoiceItems(invoiceId: string): Promise<ActionResult<InvoiceItem[]>> {
  try {
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedItems: InvoiceItem[] = [];
    
    for (const item of items || []) {
      let materialName, unitName, eggWeight;

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

      if (item.egg_weight_id) {
        const { data } = await supabase
          .from('egg_weights')
          .select('weight_range')
          .eq('id', item.egg_weight_id)
          .single();
        eggWeight = data?.weight_range;
      }

      enrichedItems.push({
        ...item,
        material_name: materialName,
        unit_name: unitName,
        egg_weight: eggWeight,
      });
    }

    return { success: true, data: enrichedItems };
  } catch (error) {
    console.error('Error getting invoice items:', error);
    return { success: false, error: 'Failed to get invoice items' };
  }
}

/**
 * Create invoice item
 */
export async function createInvoiceItem(input: CreateInvoiceItemInput): Promise<ActionResult<InvoiceItem>> {
  try {
    const supabase = await createClient();

    const value = input.quantity * input.price;

    // Get invoice details to check type and warehouse
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_type, warehouse_id')
      .eq('id', input.invoice_id)
      .single();

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Update warehouse inventory if material_name_id is provided
    if (input.material_name_id && invoice.warehouse_id) {
      const inventoryResult = await updateWarehouseInventory(
        invoice.warehouse_id,
        input.material_name_id,
        input.unit_id,
        input.quantity,
        invoice.invoice_type
      );

      if (!inventoryResult.success) {
        return { success: false, error: inventoryResult.error };
      }
    }

    const { data: newItem, error } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: input.invoice_id,
        material_name_id: input.material_name_id || null,
        unit_id: input.unit_id,
        egg_weight_id: input.egg_weight_id || null,
        quantity: input.quantity,
        weight: input.weight || null,
        price: input.price,
        value: value,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update invoice total
    await updateInvoiceTotals(input.invoice_id);

    revalidatePath(`/admin/invoices/${input.invoice_id}`);
    return { success: true, data: newItem };
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return { success: false, error: 'Failed to create invoice item' };
  }
}

/**
 * Update invoice item
 */
export async function updateInvoiceItem(input: UpdateInvoiceItemInput): Promise<ActionResult<InvoiceItem>> {
  try {
    const supabase = await createClient();

    const { data: current } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('id', input.id)
      .single();

    if (!current) {
      return { success: false, error: 'Item not found' };
    }

    const quantity = input.quantity ?? current.quantity;
    const price = input.price ?? current.price;
    const value = quantity * price;

    const { data: updatedItem, error } = await supabase
      .from('invoice_items')
      .update({
        quantity: input.quantity,
        weight: input.weight,
        price: input.price,
        value: value,
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotals(current.invoice_id);

    revalidatePath(`/admin/invoices/${current.invoice_id}`);
    return { success: true, data: updatedItem };
  } catch (error) {
    console.error('Error updating invoice item:', error);
    return { success: false, error: 'Failed to update invoice item' };
  }
}

/**
 * Delete invoice item
 */
export async function deleteInvoiceItem(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: item } = await supabase
      .from('invoice_items')
      .select('invoice_id, material_name_id, unit_id, quantity')
      .eq('id', id)
      .single();

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Get invoice details for reversal
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_type, warehouse_id')
      .eq('id', item.invoice_id)
      .single();

    // Reverse inventory update if material exists
    if (item.material_name_id && invoice?.warehouse_id) {
      // Reverse the exact operation that was performed
      await reverseWarehouseInventory(
        invoice.warehouse_id,
        item.material_name_id,
        item.quantity,
        invoice.invoice_type
      );
    }

    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotals(item.invoice_id);

    revalidatePath(`/admin/invoices/${item.invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice item:', error);
    return { success: false, error: 'Failed to delete invoice item' };
  }
}

/**
 * Update warehouse inventory based on invoice type
 */
async function updateWarehouseInventory(
  warehouseId: string,
  materialNameId: string,
  unitId: string,
  quantity: number,
  invoiceType: 'buy' | 'sell'
): Promise<ActionResult> {
  const supabase = await createClient();

  // Check if material exists in warehouse
  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (invoiceType === 'sell') {
    // SELL: Deduct from inventory
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

    // Update: increase sales, decrease current_balance
    const newSales = existingMaterial.sales + quantity;
    const newBalance = existingMaterial.current_balance - quantity;

    await supabase
      .from('materials')
      .update({
        sales: newSales,
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMaterial.id);

  } else {
    // BUY: Add to inventory
    if (existingMaterial) {
      // Material exists, update it
      const newPurchases = existingMaterial.purchases + quantity;
      const newBalance = existingMaterial.current_balance + quantity;

      await supabase
        .from('materials')
        .update({
          purchases: newPurchases,
          current_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMaterial.id);
    } else {
      // Material doesn't exist, create it
      await supabase
        .from('materials')
        .insert({
          warehouse_id: warehouseId,
          material_name_id: materialNameId,
          unit_id: unitId,
          opening_balance: 0,
          purchases: quantity,
          sales: 0,
          consumption: 0,
          manufacturing: 0,
          current_balance: quantity,
        });
    }
  }

  return { success: true };
}

/**
 * Reverse warehouse inventory when deleting an invoice item
 */
async function reverseWarehouseInventory(
  warehouseId: string,
  materialNameId: string,
  quantity: number,
  originalInvoiceType: 'buy' | 'sell'
): Promise<ActionResult> {
  const supabase = await createClient();

  // Get existing material
  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (!existingMaterial) {
    return { success: false, error: 'Material not found in warehouse inventory' };
  }

  if (originalInvoiceType === 'buy') {
    // Reversing a BUY: decrease purchases and current_balance
    const newPurchases = Math.max(0, existingMaterial.purchases - quantity);
    const newBalance = Math.max(0, existingMaterial.current_balance - quantity);

    await supabase
      .from('materials')
      .update({
        purchases: newPurchases,
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMaterial.id);
  } else {
    // Reversing a SELL: decrease sales and increase current_balance
    const newSales = Math.max(0, existingMaterial.sales - quantity);
    const newBalance = existingMaterial.current_balance + quantity;

    await supabase
      .from('materials')
      .update({
        sales: newSales,
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMaterial.id);
  }

  return { success: true };
}

/**
 * Update invoice totals
 */
async function updateInvoiceTotals(invoiceId: string) {
  const supabase = await createClient();

  // Get total items value
  const { data: items } = await supabase
    .from('invoice_items')
    .select('value')
    .eq('invoice_id', invoiceId);

  const totalItemsValue = items?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

  // Get total expenses value
  const { data: expenses } = await supabase
    .from('invoice_expenses')
    .select('amount')
    .eq('invoice_id', invoiceId);

  const totalExpensesValue = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

  const netValue = totalItemsValue + totalExpensesValue;

  await supabase
    .from('invoices')
    .update({
      total_items_value: totalItemsValue,
      total_expenses_value: totalExpensesValue,
      net_value: netValue,
    })
    .eq('id', invoiceId);
}
