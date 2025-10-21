'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Invoice = {
  id: string;
  invoice_type: 'buy' | 'sell';
  invoice_date: string;
  invoice_time: string | null;
  invoice_number: string;
  warehouse_id: string | null;
  client_id: string | null;
  total_items_value: number;
  total_expenses_value: number;
  net_value: number;
  checked: boolean;
  notes: string | null;
  warehouse?: {
    name: string;
    farm_name: string;
  };
  client?: {
    name: string;
    type: string;
  };
};

export type CreateInvoiceInput = {
  invoice_type: 'buy' | 'sell';
  invoice_date: string;
  invoice_time?: string;
  invoice_number: string;
  warehouse_id: string;
  client_id?: string;
  notes?: string;
};

export type UpdateInvoiceInput = {
  id: string;
  invoice_type?: 'buy' | 'sell';
  invoice_date?: string;
  warehouse_id?: string;
  client_id?: string;
  checked?: boolean;
  notes?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all invoices
 */
export async function getInvoices(): Promise<ActionResult<Invoice[]>> {
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

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Enrich invoices with warehouse and client info
    const enrichedInvoices: Invoice[] = [];
    
    for (const invoice of invoices || []) {
      let warehouseInfo = undefined;
      let clientInfo = undefined;

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

      if (invoice.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('name, type')
          .eq('id', invoice.client_id)
          .single();

        if (client) {
          clientInfo = {
            name: client.name,
            type: client.type,
          };
        }
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        client: clientInfo,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting invoices:', error);
    return { success: false, error: 'Failed to get invoices' };
  }
}

/**
 * Get invoices by farm
 */
export async function getInvoicesByFarm(farmId: string): Promise<ActionResult<Invoice[]>> {
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

    // Get warehouses for this farm
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('farm_id', farmId);

    if (!warehouses || warehouses.length === 0) {
      return { success: true, data: [] };
    }

    const warehouseIds = warehouses.map(w => w.id);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('warehouse_id', warehouseIds)
      .order('invoice_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Enrich invoices with warehouse and client info
    const enrichedInvoices: Invoice[] = [];
    
    for (const invoice of invoices || []) {
      let warehouseInfo = undefined;
      let clientInfo = undefined;

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

      if (invoice.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('name, type')
          .eq('id', invoice.client_id)
          .single();

        if (client) {
          clientInfo = {
            name: client.name,
            type: client.type,
          };
        }
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        client: clientInfo,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting invoices by farm:', error);
    return { success: false, error: 'Failed to get invoices' };
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<ActionResult<Invoice>> {
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

    if (!input.invoice_number || input.invoice_number.trim().length < 1) {
      return { success: false, error: 'Invoice number is required' };
    }

    // Check if invoice number already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', input.invoice_number.trim())
      .single();

    if (existing) {
      return { success: false, error: 'Invoice number already exists' };
    }

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_type: input.invoice_type,
        invoice_date: input.invoice_date,
        invoice_time: input.invoice_time || null,
        invoice_number: input.invoice_number.trim(),
        warehouse_id: input.warehouse_id,
        client_id: input.client_id || null,
        notes: input.notes?.trim() || null,
        total_items_value: 0,
        total_expenses_value: 0,
        net_value: 0,
        checked: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/invoices');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { success: false, error: 'Failed to create invoice' };
  }
}

/**
 * Update an invoice
 */
export async function updateInvoice(input: UpdateInvoiceInput): Promise<ActionResult<Invoice>> {
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

    const updateData: any = {};
    
    if (input.invoice_type !== undefined) updateData.invoice_type = input.invoice_type;
    if (input.invoice_date !== undefined) updateData.invoice_date = input.invoice_date;
    if (input.warehouse_id !== undefined) updateData.warehouse_id = input.warehouse_id;
    if (input.client_id !== undefined) updateData.client_id = input.client_id || null;
    if (input.checked !== undefined) updateData.checked = input.checked;
    if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;

    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/invoices');
    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error('Error updating invoice:', error);
    return { success: false, error: 'Failed to update invoice' };
  }
}

/**
 * Get a single invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<ActionResult<Invoice>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let warehouseInfo = undefined;
    let clientInfo = undefined;

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

    if (invoice.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, type')
        .eq('id', invoice.client_id)
        .single();

      if (client) {
        clientInfo = {
          name: client.name,
          type: client.type,
        };
      }
    }

    return {
      success: true,
      data: {
        ...invoice,
        warehouse: warehouseInfo,
        client: clientInfo,
      },
    };
  } catch (error) {
    console.error('Error getting invoice:', error);
    return { success: false, error: 'Failed to get invoice' };
  }
}

/**
 * Toggle invoice checked status
 */
export async function toggleInvoiceStatus(id: string): Promise<ActionResult<Invoice>> {
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

    // Get current invoice status
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('checked')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Toggle the checked status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({ checked: !currentInvoice.checked })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/admin/invoices');
    revalidatePath(`/admin/invoices/${id}`);
    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error('Error toggling invoice status:', error);
    return { success: false, error: 'Failed to toggle invoice status' };
  }
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: string): Promise<ActionResult> {
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

    // Get invoice and its items to reverse inventory before deletion
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_type, warehouse_id')
      .eq('id', id)
      .single();

    if (invoice?.warehouse_id) {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('material_name_id, unit_id, quantity')
        .eq('invoice_id', id);

      // Reverse inventory for each item
      if (items && items.length > 0) {
        const { deleteInvoiceItem } = await import('./invoice-item.actions');
        
        for (const item of items) {
          if (item.material_name_id) {
            // Reverse the transaction
            const reverseType = invoice.invoice_type === 'buy' ? 'sell' : 'buy';
            
            const { data: existingMaterial } = await supabase
              .from('materials')
              .select('*')
              .eq('warehouse_id', invoice.warehouse_id)
              .eq('material_name_id', item.material_name_id)
              .single();

            if (existingMaterial) {
              if (reverseType === 'sell') {
                // Reverse buy: decrease purchases, decrease balance
                await supabase
                  .from('materials')
                  .update({
                    purchases: existingMaterial.purchases - item.quantity,
                    current_balance: existingMaterial.current_balance - item.quantity,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingMaterial.id);
              } else {
                // Reverse sell: decrease sales, increase balance
                await supabase
                  .from('materials')
                  .update({
                    sales: existingMaterial.sales - item.quantity,
                    current_balance: existingMaterial.current_balance + item.quantity,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingMaterial.id);
              }
            }
          }
        }
      }
    }

    // Now delete the invoice (cascade will delete items and expenses)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/invoices');
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: 'Failed to delete invoice' };
  }
}

export async function getFarmerInvoices(): Promise<ActionResult<Invoice[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: farm, error: farmErr } = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (farmErr) {
      return { success: false, error: farmErr.message };
    }

    if (!farm) {
      return { success: true, data: [] };
    }

    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('farm_id', farm.id);

    if (!warehouses || warehouses.length === 0) {
      return { success: true, data: [] };
    }

    const warehouseIds = warehouses.map(w => w.id);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('warehouse_id', warehouseIds)
      .order('invoice_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedInvoices: Invoice[] = [];

    for (const invoice of invoices || []) {
      let warehouseInfo: { name: string; farm_name: string } | undefined = undefined;
      let clientInfo: { name: string; type: string } | undefined = undefined;

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

      if (invoice.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('name, type')
          .eq('id', invoice.client_id)
          .single();

        if (client) {
          clientInfo = {
            name: client.name,
            type: client.type,
          };
        }
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        client: clientInfo,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting farmer invoices:', error);
    return { success: false, error: 'Failed to get invoices' };
  }
}

export async function getInvoiceByIdForFarmer(id: string): Promise<ActionResult<Invoice>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (!invoice.warehouse_id) {
      return { success: false, error: 'Unauthorized - Missing warehouse binding' };
    }

    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('name, farm_id')
      .eq('id', invoice.warehouse_id)
      .maybeSingle();

    if (!warehouse) {
      return { success: false, error: 'Warehouse not found' };
    }

    const { data: farmRow } = await supabase
      .from('farms')
      .select('name, user_id')
      .eq('id', warehouse.farm_id)
      .maybeSingle();

    if (!farmRow || farmRow.user_id !== user.id) {
      return { success: false, error: 'Unauthorized - Access denied' };
    }

    let clientInfo: { name: string; type: string } | undefined = undefined;
    if (invoice.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, type')
        .eq('id', invoice.client_id)
        .maybeSingle();

      if (client) {
        clientInfo = {
          name: client.name,
          type: client.type,
        };
      }
    }

    const enrichedInvoice: Invoice = {
      ...invoice,
      warehouse: { name: warehouse.name, farm_name: farmRow?.name || 'Unknown' },
      client: clientInfo,
    };

    return { success: true, data: enrichedInvoice };
  } catch (error) {
    console.error('Error getting invoice by id (farmer):', error);
    return { success: false, error: 'Failed to get invoice' };
  }
}

/**
 * Create a new invoice for farmers (with warehouse ownership validation)
 */
export async function createFarmerInvoice(input: CreateInvoiceInput): Promise<ActionResult<Invoice>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's profile and farm
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        user_role,
        farms!inner (
          id,
          name,
          warehouses (
            id,
            name
          )
        )
      `)
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'farmer') {
      return { success: false, error: 'Unauthorized - Farmer access required' };
    }

    if (!profile.farms || !Array.isArray(profile.farms) || profile.farms.length === 0) {
      return { success: false, error: 'لم يتم العثور على مزارع مرتبطة بحسابك. يرجى التواصل مع المسؤول لإضافة مزرعة لحسابك' };
    }

    // Get all warehouses from all farms
    const warehouseIds: any[] = [];
    profile.farms.forEach((farm: any) => {
      if (farm.warehouses && Array.isArray(farm.warehouses)) {
        farm.warehouses.forEach((w: any) => warehouseIds.push(w.id));
      }
    });
    if (!warehouseIds.includes(input.warehouse_id)) {
      return { success: false, error: 'Unauthorized - Warehouse does not belong to your farm' };
    }

    // Validate input
    if (!input.invoice_type || !input.invoice_date || !input.invoice_number || !input.warehouse_id) {
      return { success: false, error: 'Missing required fields' };
    }

    // Check if invoice number already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', input.invoice_number.trim())
      .single();

    if (existingInvoice) {
      return { success: false, error: 'Invoice number already exists' };
    }

    // Create the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_type: input.invoice_type,
        invoice_date: input.invoice_date,
        invoice_time: input.invoice_time || null,
        invoice_number: input.invoice_number.trim(),
        warehouse_id: input.warehouse_id,
        client_id: input.client_id || null,
        total_items_value: 0,
        total_expenses_value: 0,
        net_value: 0,
        checked: false,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/farmer/invoices');
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error creating farmer invoice:', error);
    return { success: false, error: 'Failed to create invoice' };
  }
}
