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
  warehouse_id: string;
  poultry_status_id?: string;
  notes?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

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
          // Find the medicine material in warehouse
          const { data: medicine } = await supabase
            .from('medicines')
            .select('material_name_id')
            .eq('id', item.medicine_id)
            .single();

          if (medicine?.material_name_id) {
            const { data: material } = await supabase
              .from('materials')
              .select('*')
              .eq('warehouse_id', invoice.warehouse_id)
              .eq('material_name_id', medicine.material_name_id)
              .single();

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
