'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ManufacturingInvoice = {
  id: string;
  invoice_number: string;
  warehouse_id: string | null;
  blend_name: string | null;
  material_name_id: string | null;
  unit_id: string | null;
  quantity: number;
  manufacturing_date: string;
  manufacturing_time: string | null;
  notes: string | null;
  warehouse?: {
    name: string;
    farm_name: string;
  };
  material_name?: string;
  unit_name?: string;
};

export type CreateManufacturingInvoiceInput = {
  invoice_number: string;
  warehouse_id: string;
  blend_name?: string;
  material_name_id: string;
  unit_id: string;
  quantity: number;
  manufacturing_date: string;
  notes?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all manufacturing invoices
 */
export async function getManufacturingInvoices(): Promise<ActionResult<ManufacturingInvoice[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is farmer to filter by their farm
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('manufacturing_invoices')
      .select('*')
      .order('manufacturing_date', { ascending: false });

    // If farmer, only show invoices from their farm's warehouse
    if (profile?.user_role === 'farmer') {
      const { data: farm } = await supabase
        .from('farms')
        .select('id, warehouses(id)')
        .eq('user_id', user.id)
        .single();

      if (!farm || !farm.warehouses || farm.warehouses.length === 0) {
        return { success: true, data: [] };
      }

      const warehouseIds = farm.warehouses.map((w: any) => w.id);
      query = query.in('warehouse_id', warehouseIds);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedInvoices: ManufacturingInvoice[] = [];
    
    for (const invoice of invoices || []) {
      let warehouseInfo, materialName, unitName;

      if (invoice.warehouse_id) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select('name, farm_id')
          .eq('id', invoice.warehouse_id)
          .single();

        if (warehouse) {
          const { data: farm } = await supabase
            .from('farms')
            .select('name')
            .eq('id', warehouse.farm_id)
            .single();

          warehouseInfo = {
            name: warehouse.name,
            farm_name: farm?.name || 'Unknown',
          };
        }
      }

      if (invoice.material_name_id) {
        const { data } = await supabase
          .from('materials_names')
          .select('material_name')
          .eq('id', invoice.material_name_id)
          .single();
        materialName = data?.material_name;
      }

      if (invoice.unit_id) {
        const { data } = await supabase
          .from('measurement_units')
          .select('unit_name')
          .eq('id', invoice.unit_id)
          .single();
        unitName = data?.unit_name;
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        material_name: materialName,
        unit_name: unitName,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting manufacturing invoices:', error);
    return { success: false, error: 'Failed to get manufacturing invoices' };
  }
}

/**
 * Get a single manufacturing invoice by ID
 */
export async function getManufacturingInvoiceById(invoiceId: string): Promise<ActionResult<ManufacturingInvoice>> {
  try {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('manufacturing_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let warehouseInfo, materialName, unitName;

    if (invoice.warehouse_id) {
      const { data: warehouse } = await supabase
        .from('warehouses')
        .select('name, farm_id')
        .eq('id', invoice.warehouse_id)
        .single();

      if (warehouse) {
        const { data: farm } = await supabase
          .from('farms')
          .select('name')
          .eq('id', warehouse.farm_id)
          .single();

        warehouseInfo = {
          name: warehouse.name,
          farm_name: farm?.name || 'Unknown',
        };
      }
    }

    if (invoice.material_name_id) {
      const { data } = await supabase
        .from('materials_names')
        .select('material_name')
        .eq('id', invoice.material_name_id)
        .single();
      materialName = data?.material_name;
    }

    if (invoice.unit_id) {
      const { data } = await supabase
        .from('measurement_units')
        .select('unit_name')
        .eq('id', invoice.unit_id)
        .single();
      unitName = data?.unit_name;
    }

    return {
      success: true,
      data: {
        ...invoice,
        warehouse: warehouseInfo,
        material_name: materialName,
        unit_name: unitName,
      },
    };
  } catch (error) {
    console.error('Error getting manufacturing invoice:', error);
    return { success: false, error: 'Failed to get manufacturing invoice' };
  }
}

/**
 * Create manufacturing invoice
 */
export async function createManufacturingInvoice(input: CreateManufacturingInvoiceInput): Promise<ActionResult<ManufacturingInvoice>> {
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

    if (!profile || !['admin', 'farmer'].includes(profile.user_role)) {
      return { success: false, error: 'Unauthorized - Access denied' };
    }

    // If farmer, verify warehouse belongs to their farm
    if (profile.user_role === 'farmer') {
      const { data: farm } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!farm) {
        return { success: false, error: 'No farm assigned to your account' };
      }

      const { data: warehouse } = await supabase
        .from('warehouses')
        .select('farm_id')
        .eq('id', input.warehouse_id)
        .single();

      if (!warehouse || warehouse.farm_id !== farm.id) {
        return { success: false, error: 'Invalid warehouse - not assigned to your farm' };
      }
    }

    const { data: newInvoice, error } = await supabase
      .from('manufacturing_invoices')
      .insert({
        invoice_number: input.invoice_number,
        warehouse_id: input.warehouse_id,
        blend_name: input.blend_name?.trim() || null,
        material_name_id: input.material_name_id,
        unit_id: input.unit_id,
        quantity: input.quantity,
        manufacturing_date: input.manufacturing_date,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Note: Output material will be added after all input items are successfully added
    // This prevents inventory inconsistencies if item addition fails

    revalidatePath('/admin/manufacturing');
    revalidatePath('/farmer');
    revalidatePath('/farmer/manufacturing');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('Error creating manufacturing invoice:', error);
    return { success: false, error: 'Failed to create manufacturing invoice' };
  }
}

/**
 * Rollback manufacturing invoice (delete without inventory adjustments)
 * Used internally when invoice creation fails partway
 */
export async function rollbackManufacturingInvoice(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Simply delete the invoice (cascade will delete items and expenses)
    // No inventory adjustments needed since items weren't added yet
    const { error } = await supabase
      .from('manufacturing_invoices')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error rolling back manufacturing invoice:', error);
    return { success: false, error: 'Failed to rollback manufacturing invoice' };
  }
}

/**
 * Delete manufacturing invoice
 */
export async function deleteManufacturingInvoice(id: string): Promise<ActionResult> {
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

    // Get invoice data before deletion to reverse inventory
    const { data: invoice } = await supabase
      .from('manufacturing_invoices')
      .select('warehouse_id, material_name_id, quantity')
      .eq('id', id)
      .single();

    // Reverse output material increase (decrease manufacturing)
    if (invoice?.warehouse_id && invoice.material_name_id && invoice.quantity > 0) {
      await decreaseOutputMaterial(
        invoice.warehouse_id,
        invoice.material_name_id,
        invoice.quantity
      );
    }

    // Get all input items to reverse their consumption
    const { data: items } = await supabase
      .from('manufacturing_invoice_items')
      .select('material_name_id, quantity, weight')
      .eq('manufacturing_invoice_id', id);

    // Reverse input materials consumption
    if (invoice?.warehouse_id && items && items.length > 0) {
      for (const item of items) {
        if (item.material_name_id) {
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('warehouse_id', invoice.warehouse_id)
            .eq('material_name_id', item.material_name_id)
            .single();

          if (material) {
            // Use weight if available, otherwise use quantity
            const actualQuantity = item.weight || item.quantity;
            // Reverse consumption: decrease consumption, increase balance
            await supabase
              .from('materials')
              .update({
                consumption: material.consumption - actualQuantity,
                current_balance: material.current_balance + actualQuantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', material.id);
          }
        }
      }
    }

    // Now delete the invoice (cascade will delete items and expenses)
    const { error } = await supabase
      .from('manufacturing_invoices')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/manufacturing');
    return { success: true };
  } catch (error) {
    console.error('Error deleting manufacturing invoice:', error);
    return { success: false, error: 'Failed to delete manufacturing invoice' };
  }
}

/**
 * Add output material to warehouse inventory (called after all input items are added)
 * This is a public function that can be called from the client
 */
export async function addOutputMaterialToInventory(
  invoiceId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: invoice } = await supabase
      .from('manufacturing_invoices')
      .select('warehouse_id, material_name_id, unit_id, quantity')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (!invoice.material_name_id || !invoice.unit_id || !invoice.quantity || invoice.quantity <= 0) {
      return { success: false, error: 'المادة الناتجة والكمية مطلوبة' };
    }

    await increaseOutputMaterial(
      invoice.warehouse_id,
      invoice.material_name_id,
      invoice.unit_id,
      invoice.quantity
    );

    revalidatePath('/admin/manufacturing');
    revalidatePath('/farmer');
    revalidatePath('/farmer/manufacturing');
    return { success: true };
  } catch (error) {
    console.error('Error adding output material:', error);
    return { success: false, error: 'Failed to add output material to inventory' };
  }
}

/**
 * Increase output material in warehouse (manufacturing production)
 */
async function increaseOutputMaterial(
  warehouseId: string,
  materialNameId: string,
  unitId: string,
  quantity: number
): Promise<void> {
  const supabase = await createClient();

  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (existingMaterial) {
    // Material exists, update it
    const newManufacturing = existingMaterial.manufacturing + quantity;
    const newBalance = existingMaterial.current_balance + quantity;

    await supabase
      .from('materials')
      .update({
        manufacturing: newManufacturing,
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
        purchases: 0,
        sales: 0,
        consumption: 0,
        manufacturing: quantity,
        current_balance: quantity,
      });
  }
}

/**
 * Decrease output material (reverse manufacturing)
 */
async function decreaseOutputMaterial(
  warehouseId: string,
  materialNameId: string,
  quantity: number
): Promise<void> {
  const supabase = await createClient();

  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (existingMaterial) {
    // Reverse: decrease manufacturing, decrease balance
    await supabase
      .from('materials')
      .update({
        manufacturing: existingMaterial.manufacturing - quantity,
        current_balance: existingMaterial.current_balance - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMaterial.id);
  }
}
