'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type MedicineInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_time: string | null;
  warehouse_id: string | null;
  poultry_status_id: string | null;
  total_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  warehouse?: {
    name: string;
    farm_name: string;
  };
  poultry_status?: {
    status_name: string;
  };
};

export type CreateMedicineInvoiceInput = {
  invoice_number: string;
  invoice_date: string;
  invoice_time?: string;
  warehouse_id: string;
  poultry_status_id?: string;
  notes?: string;
};

export type UpdateMedicineInvoiceInput = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_time?: string | null;
  warehouse_id: string;
  poultry_status_id?: string | null;
  notes?: string | null;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Update a medicine invoice
 */
export async function updateMedicineInvoice(input: UpdateMedicineInvoiceInput): Promise<ActionResult<MedicineInvoice>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!input.id || !input.invoice_number || !input.invoice_date || !input.warehouse_id) {
      return { success: false, error: 'Missing required fields' };
    }

    // Check if invoice exists
    const { data: existingInvoice, error: checkError } = await supabase
      .from('medicine_consumption_invoices')
      .select('id')
      .eq('id', input.id)
      .single();

    if (checkError || !existingInvoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Check if invoice number already exists (excluding current invoice)
    const { data: duplicateInvoices, error: duplicateError } = await supabase
      .from('medicine_consumption_invoices')
      .select('id')
      .eq('invoice_number', input.invoice_number.trim())
      .neq('id', input.id);

    if (duplicateError) {
      console.error('Error checking duplicate invoice:', duplicateError);
    }
    
    if (duplicateInvoices && duplicateInvoices.length > 0) {
      return { success: false, error: 'Invoice number already exists' };
    }

    // Update the medicine invoice
    const { data: invoice, error } = await supabase
      .from('medicine_consumption_invoices')
      .update({
        invoice_number: input.invoice_number.trim(),
        invoice_date: input.invoice_date,
        invoice_time: input.invoice_time || null,
        warehouse_id: input.warehouse_id,
        poultry_status_id: input.poultry_status_id || null,
        notes: input.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate both admin and farmer paths
    revalidatePath('/admin/medicines-invoices');
    revalidatePath(`/admin/medicines-invoices/${input.id}`);
    revalidatePath('/farmer/medicine-invoices');
    revalidatePath(`/farmer/medicine-invoices/${input.id}`);
    
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error updating medicine invoice:', error);
    return { success: false, error: 'Failed to update medicine invoice' };
  }
}

/**
 * Get all medicine consumption invoices
 */
export async function getMedicineInvoices(): Promise<ActionResult<MedicineInvoice[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: invoices, error } = await supabase
      .from('medicine_consumption_invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedInvoices: MedicineInvoice[] = [];
    
    for (const invoice of invoices || []) {
      let warehouseInfo, poultryStatusInfo;

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

      if (invoice.poultry_status_id) {
        const { data: status } = await supabase
          .from('poultry_status')
          .select('status_name')
          .eq('id', invoice.poultry_status_id)
          .single();

        if (status) {
          poultryStatusInfo = {
            status_name: status.status_name,
          };
        }
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        poultry_status: poultryStatusInfo,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting medicine invoices:', error);
    return { success: false, error: 'Failed to get medicine invoices' };
  }
}

/**
 * Get a single medicine invoice by ID
 */
export async function getMedicineInvoiceById(invoiceId: string): Promise<ActionResult<MedicineInvoice>> {
  try {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('medicine_consumption_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let warehouseInfo, poultryStatusInfo;

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

    if (invoice.poultry_status_id) {
      const { data: status } = await supabase
        .from('poultry_status')
        .select('status_name')
        .eq('id', invoice.poultry_status_id)
        .single();

      if (status) {
        poultryStatusInfo = {
          status_name: status.status_name,
        };
      }
    }

    return {
      success: true,
      data: {
        ...invoice,
        warehouse: warehouseInfo,
        poultry_status: poultryStatusInfo,
      },
    };
  } catch (error) {
    console.error('Error getting medicine invoice:', error);
    return { success: false, error: 'Failed to get medicine invoice' };
  }
}

/**
 * Create medicine consumption invoice
 */
export async function createMedicineInvoice(input: CreateMedicineInvoiceInput): Promise<ActionResult<MedicineInvoice>> {
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

    const { data: newInvoice, error } = await supabase
      .from('medicine_consumption_invoices')
      .insert({
        invoice_number: input.invoice_number,
        invoice_date: input.invoice_date,
        invoice_time: input.invoice_time || null,
        warehouse_id: input.warehouse_id,
        poultry_status_id: input.poultry_status_id || null,
        total_value: 0,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/medicine-invoices');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('Error creating medicine invoice:', error);
    return { success: false, error: 'Failed to create medicine invoice' };
  }
}

/**
 * Delete medicine consumption invoice
 */
export async function deleteMedicineInvoice(id: string): Promise<ActionResult> {
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

    // Get invoice data for reversal
    const { data: invoice } = await supabase
      .from('medicine_consumption_invoices')
      .select('warehouse_id')
      .eq('id', id)
      .single();

    // Get all items to reverse their consumption
    const { data: items } = await supabase
      .from('medicine_consumption_items')
      .select('medicine_id, quantity')
      .eq('consumption_invoice_id', id);

    // Reverse medicine consumption
    if (invoice?.warehouse_id && items && items.length > 0) {
      for (const item of items) {
        if (item.medicine_id) {
          // Search directly in materials table using medicine_id
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('warehouse_id', invoice.warehouse_id)
            .eq('medicine_id', item.medicine_id)
            .maybeSingle();

          if (material) {
            // Reverse consumption: decrease consumption, increase balance
            await supabase
              .from('materials')
              .update({
                consumption: material.consumption - item.quantity,
                current_balance: material.current_balance + item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', material.id);
          }
        }
      }
    }

    const { error } = await supabase
      .from('medicine_consumption_invoices')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/medicines-invoices');
    return { success: true };
  } catch (error) {
    console.error('Error deleting medicine invoice:', error);
    return { success: false, error: 'Failed to delete medicine invoice' };
  }
}

/**
 * Get medicine consumption invoices for farmers (filtered by their farm's warehouses)
 */
export async function getFarmerMedicineInvoices(): Promise<ActionResult<MedicineInvoice[]>> {
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
      return { success: true, data: [] };
    }

    // Get all warehouses from all farms
    const warehouseIds: any[] = [];
    if (Array.isArray(profile.farms)) {
      profile.farms.forEach((farm: any) => {
        if (farm.warehouses && Array.isArray(farm.warehouses)) {
          farm.warehouses.forEach((w: any) => warehouseIds.push(w.id));
        }
      });
    }

    // Get medicine invoices for farmer's warehouses
    const { data: invoices, error } = await supabase
      .from('medicine_consumption_invoices')
      .select('*')
      .in('warehouse_id', warehouseIds)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Enrich invoices with warehouse and poultry status info
    const enrichedInvoices: MedicineInvoice[] = [];
    
    for (const invoice of invoices || []) {
      let warehouseInfo = undefined;
      let poultryStatusInfo = undefined;

      // Get warehouse info
      if (invoice.warehouse_id) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select(`
            name,
            farms (name)
          `)
          .eq('id', invoice.warehouse_id)
          .single();

        if (warehouse) {
          warehouseInfo = {
            name: warehouse?.name || 'Unknown',
            farm_name: warehouse?.farms?.[0]?.name || 'Unknown Farm',
          };
        }
      }

      // Get poultry status info
      if (invoice.poultry_status_id) {
        const { data: poultryStatus } = await supabase
          .from('poultry_statuses')
          .select('status_name')
          .eq('id', invoice.poultry_status_id)
          .single();

        if (poultryStatus) {
          poultryStatusInfo = {
            status_name: poultryStatus.status_name,
          };
        }
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        poultry_status: poultryStatusInfo,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting farmer medicine invoices:', error);
    return { success: false, error: 'Failed to get medicine invoices' };
  }
}

/**
 * Create a new medicine consumption invoice for farmers (with warehouse ownership validation)
 */
export async function createFarmerMedicineInvoice(input: CreateMedicineInvoiceInput): Promise<ActionResult<MedicineInvoice>> {
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

    if (!profile.farms || !profile.farms[0] || !profile.farms[0].warehouses) {
      return { success: false, error: 'No warehouses found for your farm' };
    }

    // Verify that the warehouse belongs to the farmer's farm
    const warehouseIds = profile.farms[0].warehouses.map((w: any) => w.id);
    if (!warehouseIds.includes(input.warehouse_id)) {
      return { success: false, error: 'Unauthorized - Warehouse does not belong to your farm' };
    }

    // Validate input
    if (!input.invoice_number || !input.invoice_date || !input.warehouse_id) {
      return { success: false, error: 'Missing required fields' };
    }

    // Check if invoice number already exists
    const { data: existingInvoices, error: checkError } = await supabase
      .from('medicine_consumption_invoices')
      .select('id')
      .eq('invoice_number', input.invoice_number.trim());

    if (checkError) {
      console.error('Error checking existing invoice:', checkError);
    }
    
    if (existingInvoices && existingInvoices.length > 0) {
      return { success: false, error: 'Invoice number already exists' };
    }

    // Create the medicine invoice
    const { data: invoice, error } = await supabase
      .from('medicine_consumption_invoices')
      .insert({
        invoice_number: input.invoice_number.trim(),
        invoice_date: input.invoice_date,
        invoice_time: input.invoice_time || null,
        warehouse_id: input.warehouse_id,
        poultry_status_id: input.poultry_status_id || null,
        total_value: 0,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/farmer/medicine-invoices');
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error creating farmer medicine invoice:', error);
    return { success: false, error: 'Failed to create medicine invoice' };
  }
}

/**
 * Get medicine consumption invoice by ID for farmers (with ownership validation)
 */
export async function getFarmerMedicineInvoiceById(invoiceId: string): Promise<ActionResult<MedicineInvoice>> {
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

    if (!profile.farms || !profile.farms[0] || !profile.farms[0].warehouses) {
      return { success: false, error: 'No warehouses found for your farm' };
    }

    const warehouseIds = profile.farms[0].warehouses.map((w: any) => w.id);

    // Get the medicine invoice
    const { data: invoice, error } = await supabase
      .from('medicine_consumption_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!invoice) {
      return { success: false, error: 'Medicine invoice not found' };
    }

    // Verify that the invoice's warehouse belongs to the farmer's farm
    if (!warehouseIds.includes(invoice.warehouse_id)) {
      return { success: false, error: 'Unauthorized - Invoice does not belong to your farm' };
    }

    // Enrich with warehouse and poultry status info
    let warehouseInfo = undefined;
    let poultryStatusInfo = undefined;

    if (invoice.warehouse_id) {
      const { data: warehouse } = await supabase
        .from('warehouses')
        .select(`
          name,
          farms (name)
        `)
        .eq('id', invoice.warehouse_id)
        .single();

      if (warehouse) {
        warehouseInfo = {
          name: warehouse?.name || 'Unknown',
          farm_name: warehouse?.farms?.[0]?.name || 'Unknown Farm',
        };
      }
    }

    if (invoice.poultry_status_id) {
      const { data: poultryStatus } = await supabase
        .from('poultry_statuses')
        .select('status_name')
        .eq('id', invoice.poultry_status_id)
        .single();

      if (poultryStatus) {
        poultryStatusInfo = {
          status_name: poultryStatus.status_name,
        };
      }
    }

    const enrichedInvoice: MedicineInvoice = {
      ...invoice,
      warehouse: warehouseInfo,
      poultry_status: poultryStatusInfo,
    };

    return { success: true, data: enrichedInvoice };
  } catch (error) {
    console.error('Error getting farmer medicine invoice by id:', error);
    return { success: false, error: 'Failed to get medicine invoice' };
  }
}
