'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/auth';

// ==================== Types ====================

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type EggSaleInvoiceItem = {
  egg_weight_id: string;
  unit_id: string;
  quantity: number;
  price: number;
};

export type DroppingsSaleInvoiceData = {
  unit_id: string;
  quantity: number;
  price: number;
  client_id?: string;
};

export type MedicineConsumptionItem = {
  medicine_id: string;
  unit_id: string;
  quantity: number;
  price: number;
};

export type IntegratedDailyReportInput = {
  // Daily Report Data
  warehouse_id: string;
  report_date: string;
  report_time: string;
  production_eggs_healthy: number;
  production_eggs_deformed: number;
  eggs_sold: number;
  eggs_gift: number;
  previous_eggs_balance: number;
  carton_consumption: number;
  chicks_before: number;
  chicks_dead: number;
  feed_daily_kg: number;
  feed_monthly_kg: number;
  feed_ratio: number;
  production_droppings: number;
  notes?: string;

  // Egg Sale Invoices
  eggSaleInvoices?: Array<{
    client_id?: string;
    items: EggSaleInvoiceItem[];
  }>;

  // Droppings Sale Invoice
  droppingsSaleInvoice?: DroppingsSaleInvoiceData;

  // Medicine Consumption Invoice
  medicineConsumptionItems?: MedicineConsumptionItem[];
  
  // Poultry Status ID for medicine invoice
  poultry_status_id?: string;
};

// ==================== Helper Functions ====================

/**
 * Generate invoice number with prefix and timestamp
 */
function generateInvoiceNumber(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/**
 * Get or create material by name
 */
async function getOrCreateMaterial(
  supabase: any,
  warehouseId: string,
  materialName: string,
  unitId: string
): Promise<string | null> {
  // First, get or create material_name
  let { data: materialNameData } = await supabase
    .from('materials_names')
    .select('id')
    .eq('material_name', materialName)
    .maybeSingle();

  if (!materialNameData) {
    const { data: newMaterialName, error: nameError } = await supabase
      .from('materials_names')
      .insert({ material_name: materialName })
      .select('id')
      .single();

    if (nameError || !newMaterialName) {
      console.error('Error creating material name:', nameError);
      return null;
    }
    materialNameData = newMaterialName;
  }

  // Check if material exists in warehouse
  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('id')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameData.id)
    .maybeSingle();

  if (existingMaterial) {
    return materialNameData.id;
  }

  // Create material in warehouse
  const { error: materialError } = await supabase
    .from('materials')
    .insert({
      warehouse_id: warehouseId,
      material_name_id: materialNameData.id,
      unit_id: unitId,
      opening_balance: 0,
      purchases: 0,
      sales: 0,
      consumption: 0,
      manufacturing: 0,
      current_balance: 0,
    });

  if (materialError) {
    console.error('Error creating material:', materialError);
    return null;
  }

  return materialNameData.id;
}

/**
 * Update material inventory
 */
async function updateMaterialInventory(
  supabase: any,
  warehouseId: string,
  materialNameId: string,
  field: 'purchases' | 'sales' | 'consumption',
  quantity: number
): Promise<boolean> {
  const { data: material } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)
    .single();

  if (!material) {
    console.error('Material not found in warehouse');
    return false;
  }

  let newBalance = material.current_balance;
  const updates: any = { updated_at: new Date().toISOString() };

  if (field === 'purchases') {
    updates.purchases = material.purchases + quantity;
    newBalance += quantity;
  } else if (field === 'sales') {
    updates.sales = material.sales + quantity;
    newBalance -= quantity;
  } else if (field === 'consumption') {
    updates.consumption = material.consumption + quantity;
    newBalance -= quantity;
  }

  updates.current_balance = Math.max(0, newBalance);

  const { error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', material.id);

  return !error;
}

/**
 * Check if this is the first report for the warehouse
 */
async function isFirstReport(supabase: any, warehouseId: string | undefined | null): Promise<boolean> {
  // If no warehouse specified, treat as first to avoid scanning unrelated data
  if (!warehouseId) return true;
  const { count } = await supabase
    .from('daily_reports')
    .select('id', { count: 'exact', head: true })
    .eq('warehouse_id', warehouseId);

  return count === 0;
}

/**
 * Get chicks count from poultry status
 * Note: Each farm has only ONE poultry status (one-to-one relationship)
 */
async function getChicksFromPoultryStatus(
  supabase: any,
  warehouseId: string | undefined | null
): Promise<number> {
  console.log('[getChicksFromPoultryStatus] Starting for warehouse:', warehouseId);
  if (!warehouseId) {
    console.warn('[getChicksFromPoultryStatus] No warehouseId provided');
    return 0;
  }
  
  // Get farm_id from warehouse
  const { data: warehouse, error: warehouseError } = await supabase
    .from('warehouses')
    .select('farm_id')
    .eq('id', warehouseId)
    .single();

  if (warehouseError) {
    console.error('[getChicksFromPoultryStatus] Error fetching warehouse:', warehouseError);
    return 0;
  }

  if (!warehouse) {
    console.warn('[getChicksFromPoultryStatus] Warehouse not found');
    return 0;
  }

  console.log('[getChicksFromPoultryStatus] Found farm_id:', warehouse.farm_id);

  // Get the single poultry status for this farm
  const { data: poultryStatus, error: poultryError } = await supabase
    .from('poultry_status')
    .select('remaining_chicks')
    .eq('farm_id', warehouse.farm_id)
    .maybeSingle();

  if (poultryError) {
    console.error('[getChicksFromPoultryStatus] Error fetching poultry status:', poultryError);
    return 0;
  }

  if (!poultryStatus) {
    console.warn('[getChicksFromPoultryStatus] No poultry status found for farm:', warehouse.farm_id);
    return 0;
  }

  console.log('[getChicksFromPoultryStatus] Found remaining_chicks:', poultryStatus.remaining_chicks);
  return poultryStatus?.remaining_chicks || 0;
}

/**
 * Get chicks_before value automatically:
 * - First report: from poultry_status.remaining_chicks
 * - Subsequent reports: from last daily_report.chicks_after
 */
async function getChicksBeforeValue(
  supabase: any,
  warehouseId: string | undefined | null
): Promise<number> {
  console.log('[getChicksBeforeValue] Starting for warehouse:', warehouseId);
  
  // Check if this is the first report
  const firstReport = await isFirstReport(supabase, warehouseId);
  console.log('[getChicksBeforeValue] Is first report:', firstReport);
  
  if (firstReport) {
    // First report: get from poultry status
    console.log('[getChicksBeforeValue] Getting from poultry status...');
    const value = await getChicksFromPoultryStatus(supabase, warehouseId);
    console.log('[getChicksBeforeValue] Returning value from poultry:', value);
    return value;
  } else {
    // Subsequent reports: get from last report's chicks_after
    console.log('[getChicksBeforeValue] Getting from last report...');
    if (!warehouseId) {
      console.warn('[getChicksBeforeValue] warehouseId missing; cannot get last report');
      return 0;
    }
    const { data: lastReport } = await supabase
      .from('daily_reports')
      .select('chicks_after')
      .eq('warehouse_id', warehouseId)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const value = lastReport?.chicks_after || 0;
    console.log('[getChicksBeforeValue] Returning value from last report:', value);
    return value;
  }
}

/**
 * Calculate monthly feed total for the current month
 * Sums up all daily feed from reports in the same month/year
 */
async function calculateMonthlyFeed(
  supabase: any,
  warehouseId: string | undefined | null,
  reportDate: string,
  currentDailyFeed: number
): Promise<number> {
  console.log('[calculateMonthlyFeed] Starting for warehouse:', warehouseId, 'date:', reportDate);
  
  if (!warehouseId || !reportDate) {
    return currentDailyFeed;
  }

  // Extract year and month from report date
  const date = new Date(reportDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed, so add 1
  
  // Get start and end of the month
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = new Date(year, month, 0); // Last day of month
  const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
  
  console.log('[calculateMonthlyFeed] Month range:', startOfMonth, 'to', endOfMonthStr);

  // Get all reports in the same month
  const { data: monthlyReports, error } = await supabase
    .from('daily_reports')
    .select('feed_daily_kg')
    .eq('warehouse_id', warehouseId)
    .gte('report_date', startOfMonth)
    .lte('report_date', endOfMonthStr)
    .order('report_date', { ascending: true });

  if (error) {
    console.error('[calculateMonthlyFeed] Error fetching monthly reports:', error);
    return currentDailyFeed;
  }

  // Sum all daily feed from previous reports in this month
  const previousMonthlyTotal = monthlyReports?.reduce(
    (sum: number, report: any) => sum + (Number(report.feed_daily_kg) || 0),
    0
  ) || 0;

  const totalMonthlyFeed = previousMonthlyTotal + currentDailyFeed;
  
  console.log('[calculateMonthlyFeed] Previous monthly total:', previousMonthlyTotal);
  console.log('[calculateMonthlyFeed] Current daily feed:', currentDailyFeed);
  console.log('[calculateMonthlyFeed] Total monthly feed:', totalMonthlyFeed);

  return totalMonthlyFeed;
}

/**
 * Public function to calculate expected monthly feed for UI preview
 */
export async function getMonthlyFeedPreview(
  warehouseId: string,
  reportDate: string,
  currentDailyFeed: number
): Promise<ActionResult<number>> {
  console.log('[getMonthlyFeedPreview] Called for warehouse:', warehouseId, 'date:', reportDate);
  
  try {
    const session = await auth();
    if (!session?.user) {
      console.warn('[getMonthlyFeedPreview] User not authenticated');
      return { success: false, error: 'غير مصرح' };
    }

    const supabase = await createClient();

    if (!warehouseId) {
      console.warn('[getMonthlyFeedPreview] No warehouseId provided');
      return { success: true, data: currentDailyFeed };
    }

    const monthlyFeed = await calculateMonthlyFeed(
      supabase,
      warehouseId,
      reportDate,
      currentDailyFeed
    );
    
    console.log('[getMonthlyFeedPreview] Success! Returning value:', monthlyFeed);
    return { success: true, data: monthlyFeed };
  } catch (error) {
    console.error('[getMonthlyFeedPreview] Error calculating monthly feed:', error);
    return { success: false, error: 'فشل في حساب العلف الشهري' };
  }
}

/**
 * Public function to get chicks_before value for UI
 */
export async function getChicksBeforeForNewReport(
  warehouseId: string
): Promise<ActionResult<number>> {
  console.log('[getChicksBeforeForNewReport] Called for warehouse:', warehouseId);
  
  try {
    const session = await auth();
    if (!session?.user) {
      console.warn('[getChicksBeforeForNewReport] User not authenticated');
      return { success: false, error: 'غير مصرح' };
    }

    const supabase = await createClient();

    // If warehouseId is empty, do not attempt cross-warehouse queries
    if (!warehouseId) {
      console.warn('[getChicksBeforeForNewReport] No warehouseId provided; returning 0');
      return { success: true, data: 0 };
    }

    // Validate warehouse belongs to the current user's farm
    const { data: wh, error: whErr } = await supabase
      .from('warehouses')
      .select('id, farm_id')
      .eq('id', warehouseId)
      .maybeSingle();

    if (whErr) {
      console.error('[getChicksBeforeForNewReport] Error fetching warehouse:', whErr);
      return { success: false, error: 'خطأ في التحقق من المستودع' };
    }

    if (!wh) {
      console.warn('[getChicksBeforeForNewReport] Warehouse not found');
      return { success: false, error: 'المستودع غير موجود' };
    }

    const { data: farmRow, error: farmErr } = await supabase
      .from('farms')
      .select('user_id')
      .eq('id', wh.farm_id)
      .maybeSingle();

    if (farmErr) {
      console.error('[getChicksBeforeForNewReport] Error fetching farm:', farmErr);
      return { success: false, error: 'خطأ في التحقق من المزرعة' };
    }

    if (!farmRow || farmRow.user_id !== session.user.id) {
      console.warn('[getChicksBeforeForNewReport] Warehouse does not belong to current user');
      return { success: false, error: 'غير مصرح' };
    }

    const chicksBeforeValue = await getChicksBeforeValue(supabase, warehouseId);
    
    console.log('[getChicksBeforeForNewReport] Success! Returning value:', chicksBeforeValue);
    return { success: true, data: chicksBeforeValue };
  } catch (error) {
    console.error('[getChicksBeforeForNewReport] Error getting chicks before:', error);
    return { success: false, error: 'فشل في جلب عدد الدجاج' };
  }
}

// ==================== Main Function ====================

export async function createIntegratedDailyReport(
  input: IntegratedDailyReportInput
): Promise<ActionResult<any>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'غير مصرح' };
    }

    const supabase = await createClient();

    // Get chicks_before value automatically
    // First report: from poultry_status.remaining_chicks
    // Subsequent reports: from last daily_report.chicks_after
    const chicksBeforeValue = await getChicksBeforeValue(supabase, input.warehouse_id);

    // Calculate monthly feed automatically (sum of all daily feeds in the same month)
    const feedMonthlyKg = await calculateMonthlyFeed(
      supabase,
      input.warehouse_id,
      input.report_date,
      input.feed_daily_kg
    );

    // Calculate computed fields
    const productionEggs = input.production_eggs_healthy + input.production_eggs_deformed;
    const productionEggRate = chicksBeforeValue > 0 
      ? (productionEggs / chicksBeforeValue) * 100 
      : 0;
    const currentEggsBalance = 
      input.previous_eggs_balance + 
      input.production_eggs_healthy - 
      input.eggs_sold - 
      input.eggs_gift;
    const chicksAfter = chicksBeforeValue - input.chicks_dead;

    // Get default unit (كرتونة for eggs)
    const { data: cartonUnit } = await supabase
      .from('measurement_units')
      .select('id')
      .eq('unit_name', 'كرتونة')
      .single();

    const defaultUnitId = cartonUnit?.id;

    if (!defaultUnitId) {
      return { success: false, error: 'وحدة القياس الافتراضية غير موجودة' };
    }

    // 1. Create or get "بيض" material
    const eggMaterialId = await getOrCreateMaterial(
      supabase,
      input.warehouse_id,
      'بيض',
      defaultUnitId
    );

    if (!eggMaterialId) {
      return { success: false, error: 'فشل في إنشاء مادة البيض' };
    }

    // 2. Update egg inventory (add healthy eggs as purchases)
    if (input.production_eggs_healthy > 0) {
      await updateMaterialInventory(
        supabase,
        input.warehouse_id,
        eggMaterialId,
        'purchases',
        input.production_eggs_healthy
      );
    }

    // 3. Update egg gifts (consumption)
    if (input.eggs_gift > 0) {
      await updateMaterialInventory(
        supabase,
        input.warehouse_id,
        eggMaterialId,
        'consumption',
        input.eggs_gift
      );
    }

    // 4. Create Daily Report
    const { data: dailyReport, error: reportError } = await supabase
      .from('daily_reports')
      .insert({
        warehouse_id: input.warehouse_id,
        report_date: input.report_date,
        report_time: input.report_time,
        production_eggs_healthy: input.production_eggs_healthy,
        production_eggs_deformed: input.production_eggs_deformed,
        production_eggs: productionEggs,
        production_egg_rate: parseFloat(productionEggRate.toFixed(2)),
        eggs_sold: input.eggs_sold,
        eggs_gift: input.eggs_gift,
        previous_eggs_balance: input.previous_eggs_balance,
        current_eggs_balance: currentEggsBalance,
        carton_consumption: input.carton_consumption,
        chicks_before: chicksBeforeValue,
        chicks_dead: input.chicks_dead,
        chicks_after: chicksAfter,
        feed_daily_kg: input.feed_daily_kg,
        feed_monthly_kg: feedMonthlyKg, // Calculated automatically
        feed_ratio: input.feed_ratio,
        production_droppings: input.production_droppings,
        notes: input.notes,
        checked: false,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report error:', reportError);
      return { success: false, error: 'فشل في إنشاء التقرير اليومي' };
    }

    // 5. Create Egg Sale Invoices
    if (input.eggSaleInvoices && input.eggSaleInvoices.length > 0) {
      for (const saleInvoice of input.eggSaleInvoices) {
        const invoiceNumber = generateInvoiceNumber('EGG-SALE');
        
        // Calculate totals
        const totalItemsValue = saleInvoice.items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_type: 'sell',
            invoice_date: input.report_date,
            invoice_time: input.report_time,
            invoice_number: invoiceNumber,
            warehouse_id: input.warehouse_id,
            client_id: saleInvoice.client_id || null,
            total_items_value: totalItemsValue,
            total_expenses_value: 0,
            net_value: totalItemsValue,
            checked: false,
          })
          .select()
          .single();

        if (invoiceError || !invoice) {
          console.error('Invoice error:', invoiceError);
          continue;
        }

        // Create invoice items
        for (const item of saleInvoice.items) {
          const value = item.quantity * item.price;

          await supabase.from('invoice_items').insert({
            invoice_id: invoice.id,
            material_name_id: eggMaterialId,
            unit_id: item.unit_id,
            egg_weight_id: item.egg_weight_id,
            quantity: item.quantity,
            weight: null,
            price: item.price,
            value: value,
          });

          // Update egg sales in inventory
          await updateMaterialInventory(
            supabase,
            input.warehouse_id,
            eggMaterialId,
            'sales',
            item.quantity
          );
        }
      }
    }

    // 6. Create Droppings Sale Invoice
    if (input.droppingsSaleInvoice && input.droppingsSaleInvoice.quantity > 0) {
      const invoiceNumber = generateInvoiceNumber('DROP-SALE');
      
      // Get or create "سواد" material
      const droppingsMaterialId = await getOrCreateMaterial(
        supabase,
        input.warehouse_id,
        'سواد',
        input.droppingsSaleInvoice.unit_id
      );

      if (droppingsMaterialId) {
        const value = input.droppingsSaleInvoice.quantity * input.droppingsSaleInvoice.price;

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_type: 'sell',
            invoice_date: input.report_date,
            invoice_time: input.report_time,
            invoice_number: invoiceNumber,
            warehouse_id: input.warehouse_id,
            client_id: input.droppingsSaleInvoice.client_id || null,
            total_items_value: value,
            total_expenses_value: 0,
            net_value: value,
            checked: false,
          })
          .select()
          .single();

        if (!invoiceError && invoice) {
          await supabase.from('invoice_items').insert({
            invoice_id: invoice.id,
            material_name_id: droppingsMaterialId,
            unit_id: input.droppingsSaleInvoice.unit_id,
            quantity: input.droppingsSaleInvoice.quantity,
            price: input.droppingsSaleInvoice.price,
            value: value,
          });

          // Update droppings sales in inventory
          await updateMaterialInventory(
            supabase,
            input.warehouse_id,
            droppingsMaterialId,
            'sales',
            input.droppingsSaleInvoice.quantity
          );
        }
      }
    }

    // 7. Create Medicine Consumption Invoice
    if (input.medicineConsumptionItems && input.medicineConsumptionItems.length > 0) {
      const invoiceNumber = generateInvoiceNumber('MED-CONS');
      
      const totalValue = input.medicineConsumptionItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      const { data: medInvoice, error: medInvoiceError } = await supabase
        .from('medicine_consumption_invoices')
        .insert({
          invoice_number: invoiceNumber,
          invoice_date: input.report_date,
          invoice_time: input.report_time,
          warehouse_id: input.warehouse_id,
          poultry_status_id: input.poultry_status_id || null,
          total_value: totalValue,
          notes: input.notes,
        })
        .select()
        .single();

      if (!medInvoiceError && medInvoice) {
        // Create medicine items
        for (const item of input.medicineConsumptionItems) {
          const value = item.quantity * item.price;

          await supabase.from('medicine_consumption_items').insert({
            consumption_invoice_id: medInvoice.id,
            medicine_id: item.medicine_id,
            unit_id: item.unit_id,
            administration_date: input.report_date,
            quantity: item.quantity,
            price: item.price,
            value: value,
          });

          // Update medicine consumption in inventory
          // Note: Medicines are stored in materials table with medicine_id
          const { data: material } = await supabase
            .from('materials')
            .select('*')
            .eq('warehouse_id', input.warehouse_id)
            .eq('medicine_id', item.medicine_id)
            .maybeSingle();

          if (material) {
            const newConsumption = material.consumption + item.quantity;
            const newBalance = Math.max(0, material.current_balance - item.quantity);

            await supabase
              .from('materials')
              .update({
                consumption: newConsumption,
                current_balance: newBalance,
                updated_at: new Date().toISOString(),
              })
              .eq('id', material.id);
          }
        }
      }
    }

    revalidatePath('/farmer/daily-report');
    revalidatePath('/farmer/reports');
    revalidatePath('/admin/reports');
    revalidatePath('/admin/materials');

    return { 
      success: true, 
      data: { 
        report: dailyReport,
        message: 'تم إنشاء التقرير اليومي والفواتير بنجاح'
      } 
    };
  } catch (error) {
    console.error('Error creating integrated daily report:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء التقرير' };
  }
}

/**
 * Get available medicine quantity in warehouse
 */
export async function getAvailableMedicineQuantity(
  warehouseId: string,
  medicineId: string
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const { data: material } = await supabase
      .from('materials')
      .select('current_balance')
      .eq('warehouse_id', warehouseId)
      .eq('medicine_id', medicineId)
      .maybeSingle();

    return { 
      success: true, 
      data: material?.current_balance || 0 
    };
  } catch (error) {
    console.error('Error getting medicine quantity:', error);
    return { success: false, error: 'فشل في جلب الكمية المتاحة' };
  }
}

/**
 * Get medicines available in warehouse
 */
export async function getWarehouseMedicines(
  warehouseId: string
): Promise<ActionResult<any[]>> {
  try {
    const supabase = await createClient();

    const { data: materials, error } = await supabase
      .from('materials')
      .select(`
        id,
        medicine_id,
        current_balance,
        medicines (
          id,
          name,
          day_of_age
        )
      `)
      .eq('warehouse_id', warehouseId)
      .not('medicine_id', 'is', null)
      .gt('current_balance', 0);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: materials || [] };
  } catch (error) {
    console.error('Error getting warehouse medicines:', error);
    return { success: false, error: 'فشل في جلب الأدوية' };
  }
}
