"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/auth";

// Daily Report Schema
const dailyReportSchema = z.object({
  warehouse_id: z.string().uuid(),
  report_date: z.string(),
  report_time: z.string(),
  production_eggs_healthy: z.number().min(0).default(0),
  production_eggs_deformed: z.number().min(0).default(0),
  production_eggs: z.number().min(0).default(0),
  production_egg_rate: z.number().min(0).default(0),
  eggs_sold: z.number().min(0).default(0),
  eggs_gift: z.number().min(0).default(0),
  previous_eggs_balance: z.number().min(0).default(0),
  current_eggs_balance: z.number().min(0).default(0),
  carton_consumption: z.number().min(0).default(0),
  chicks_before: z.number().int().min(0).default(0),
  chicks_dead: z.number().int().min(0).default(0),
  chicks_after: z.number().int().min(0).default(0),
  feed_daily_kg: z.number().min(0).default(0),
  feed_monthly_kg: z.number().min(0).default(0),
  feed_ratio: z.number().min(0).default(0),
  production_droppings: z.number().min(0).default(0),
  notes: z.string().optional(),
  checked: z.boolean().default(false),
});

// Egg Sale Invoice Schema
const eggSaleInvoiceSchema = z.object({
  invoice_type: z.literal("sell"),
  invoice_date: z.string(),
  invoice_time: z.string(),
  invoice_number: z.string(),
  warehouse_id: z.string().uuid(),
  client_id: z.string().uuid().optional(),
  items: z.array(
    z.object({
      material_name_id: z.string().uuid().optional(),
      unit_id: z.string().uuid().optional(),
      egg_weight_id: z.string().uuid().optional(),
      quantity: z.number().min(0),
      weight: z.number().optional(),
      price: z.number().min(0),
      value: z.number().min(0),
    })
  ),
  expenses: z.array(
    z.object({
      expense_type_id: z.string().uuid(),
      amount: z.number().min(0),
      account_name: z.string().optional(),
    })
  ).optional(),
  total_items_value: z.number().min(0),
  total_expenses_value: z.number().min(0),
  net_value: z.number().min(0),
  notes: z.string().optional(),
});

// Medicine Consumption Invoice Schema
const medicineConsumptionSchema = z.object({
  invoice_number: z.string(),
  invoice_date: z.string(),
  invoice_time: z.string(),
  warehouse_id: z.string().uuid(),
  poultry_status_id: z.string().uuid(),
  items: z.array(
    z.object({
      medicine_id: z.string().uuid(),
      unit_id: z.string().uuid(),
      administration_day: z.number().int().optional(),
      administration_date: z.string(),
      quantity: z.number().min(0),
      price: z.number().min(0),
      value: z.number().min(0),
    })
  ),
  expenses: z.array(
    z.object({
      expense_type_id: z.string().uuid(),
      amount: z.number().min(0),
      account_name: z.string().optional(),
    })
  ).optional(),
  total_value: z.number().min(0),
  notes: z.string().optional(),
});

export async function createDailyReport(
  reportData: z.infer<typeof dailyReportSchema>,
  eggSaleInvoices?: z.infer<typeof eggSaleInvoiceSchema>[],
  droppingsSaleInvoice?: z.infer<typeof eggSaleInvoiceSchema>,
  medicineInvoice?: z.infer<typeof medicineConsumptionSchema>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح" };
    }

    // Validate data
    const validatedReport = dailyReportSchema.parse(reportData);

    const supabase = await createClient();

    // Start transaction-like operations
    // Insert daily report
    const { data: report, error: reportError } = await supabase
      .from("daily_reports")
      .insert(validatedReport)
      .select()
      .single();

    if (reportError) {
      console.error("Report error:", reportError);
      return { success: false, error: "فشل في إنشاء التقرير اليومي" };
    }

    // Process egg sale invoices
    if (eggSaleInvoices && eggSaleInvoices.length > 0) {
      for (const invoiceData of eggSaleInvoices) {
        const validatedInvoice = eggSaleInvoiceSchema.parse(invoiceData);

        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            invoice_type: validatedInvoice.invoice_type,
            invoice_date: validatedInvoice.invoice_date,
            invoice_time: validatedInvoice.invoice_time,
            invoice_number: validatedInvoice.invoice_number,
            warehouse_id: validatedInvoice.warehouse_id,
            client_id: validatedInvoice.client_id,
            total_items_value: validatedInvoice.total_items_value,
            total_expenses_value: validatedInvoice.total_expenses_value,
            net_value: validatedInvoice.net_value,
            notes: validatedInvoice.notes,
          })
          .select()
          .single();

        if (invoiceError) {
          console.error("Invoice error:", invoiceError);
          continue;
        }

        // Insert invoice items
        if (validatedInvoice.items.length > 0) {
          const itemsToInsert = validatedInvoice.items.map((item) => ({
            invoice_id: invoice.id,
            material_name_id: item.material_name_id,
            unit_id: item.unit_id,
            egg_weight_id: item.egg_weight_id,
            quantity: item.quantity,
            weight: item.weight,
            price: item.price,
            value: item.value,
          }));

          await supabase.from("invoice_items").insert(itemsToInsert);
        }

        // Insert invoice expenses
        if (validatedInvoice.expenses && validatedInvoice.expenses.length > 0) {
          const expensesToInsert = validatedInvoice.expenses.map((expense) => ({
            invoice_id: invoice.id,
            expense_type_id: expense.expense_type_id,
            amount: expense.amount,
            account_name: expense.account_name,
          }));

          await supabase.from("invoice_expenses").insert(expensesToInsert);
        }

        // Update materials inventory for egg sales
        for (const item of validatedInvoice.items) {
          if (item.material_name_id) {
            await supabase.rpc("update_material_balance", {
              p_warehouse_id: validatedInvoice.warehouse_id,
              p_material_name_id: item.material_name_id,
              p_sales: item.quantity,
            });
          }
        }
      }
    }

    // Process droppings sale invoice
    if (droppingsSaleInvoice) {
      const validatedInvoice = eggSaleInvoiceSchema.parse(droppingsSaleInvoice);

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_type: validatedInvoice.invoice_type,
          invoice_date: validatedInvoice.invoice_date,
          invoice_time: validatedInvoice.invoice_time,
          invoice_number: validatedInvoice.invoice_number,
          warehouse_id: validatedInvoice.warehouse_id,
          client_id: validatedInvoice.client_id,
          total_items_value: validatedInvoice.total_items_value,
          total_expenses_value: validatedInvoice.total_expenses_value,
          net_value: validatedInvoice.net_value,
          notes: validatedInvoice.notes,
        })
        .select()
        .single();

      if (!invoiceError && invoice) {
        // Insert items
        if (validatedInvoice.items.length > 0) {
          const itemsToInsert = validatedInvoice.items.map((item) => ({
            invoice_id: invoice.id,
            material_name_id: item.material_name_id,
            unit_id: item.unit_id,
            quantity: item.quantity,
            weight: item.weight,
            price: item.price,
            value: item.value,
          }));

          await supabase.from("invoice_items").insert(itemsToInsert);
        }

        // Insert expenses
        if (validatedInvoice.expenses && validatedInvoice.expenses.length > 0) {
          const expensesToInsert = validatedInvoice.expenses.map((expense) => ({
            invoice_id: invoice.id,
            expense_type_id: expense.expense_type_id,
            amount: expense.amount,
            account_name: expense.account_name,
          }));

          await supabase.from("invoice_expenses").insert(expensesToInsert);
        }
      }
    }

    // Process medicine consumption invoice
    if (medicineInvoice) {
      const validatedMedicine = medicineConsumptionSchema.parse(medicineInvoice);

      const { data: medInvoice, error: medInvoiceError } = await supabase
        .from("medicine_consumption_invoices")
        .insert({
          invoice_number: validatedMedicine.invoice_number,
          invoice_date: validatedMedicine.invoice_date,
          invoice_time: validatedMedicine.invoice_time,
          warehouse_id: validatedMedicine.warehouse_id,
          poultry_status_id: validatedMedicine.poultry_status_id,
          total_value: validatedMedicine.total_value,
          notes: validatedMedicine.notes,
        })
        .select()
        .single();

      if (!medInvoiceError && medInvoice) {
        // Insert medicine items
        if (validatedMedicine.items.length > 0) {
          const itemsToInsert = validatedMedicine.items.map((item) => ({
            consumption_invoice_id: medInvoice.id,
            medicine_id: item.medicine_id,
            unit_id: item.unit_id,
            administration_day: item.administration_day,
            administration_date: item.administration_date,
            quantity: item.quantity,
            price: item.price,
            value: item.value,
          }));

          await supabase.from("medicine_consumption_items").insert(itemsToInsert);
        }

        // Insert expenses
        if (validatedMedicine.expenses && validatedMedicine.expenses.length > 0) {
          const expensesToInsert = validatedMedicine.expenses.map((expense) => ({
            consumption_invoice_id: medInvoice.id,
            expense_type_id: expense.expense_type_id,
            amount: expense.amount,
            account_name: expense.account_name,
          }));

          await supabase.from("medicine_consumption_expenses").insert(expensesToInsert);
        }

        // Update medicine inventory
        for (const item of validatedMedicine.items) {
          await supabase.rpc("update_material_balance", {
            p_warehouse_id: validatedMedicine.warehouse_id,
            p_material_name_id: item.medicine_id,
            p_consumption: item.quantity,
          });
        }
      }
    }

    revalidatePath("/farmer/daily-report");
    revalidatePath("/farmer/reports");

    return { success: true, data: report };
  } catch (error) {
    console.error("Error creating daily report:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "بيانات غير صحيحة", details: error.errors };
    }
    return { success: false, error: "حدث خطأ أثناء إنشاء التقرير" };
  }
}

export async function getDailyReports(warehouseId: string, page: number = 1, limit: number = 10) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح" };
    }

    const supabase = await createClient();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("daily_reports")
      .select("*", { count: "exact" })
      .eq("warehouse_id", warehouseId)
      .order("report_date", { ascending: false })
      .order("report_time", { ascending: false })
      .range(from, to);

    if (error) {
      return { success: false, error: "فشل في جلب التقارير" };
    }

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching daily reports:", error);
    return { success: false, error: "حدث خطأ أثناء جلب التقارير" };
  }
}

export async function updateDailyReport(id: string, data: Partial<z.infer<typeof dailyReportSchema>>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح" };
    }

    const supabase = await createClient();

    const { data: report, error } = await supabase
      .from("daily_reports")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: "فشل في تحديث التقرير" };
    }

    revalidatePath("/farmer/daily-report");
    revalidatePath("/farmer/reports");

    return { success: true, data: report };
  } catch (error) {
    console.error("Error updating daily report:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث التقرير" };
  }
}

export async function toggleDailyReportStatus(id: string, currentStatus: boolean) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "farmer") {
      return { success: false, error: "غير مصرح" };
    }

    const supabase = await createClient();

    const { data: report, error } = await supabase
      .from("daily_reports")
      .update({
        checked: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: "فشل في تحديث حالة التقرير" };
    }

    revalidatePath("/admin/daily-reports");

    return { success: true, data: report };
  } catch (error) {
    console.error("Error toggling daily report status:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث الحالة" };
  }
}

export async function deleteDailyReport(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "farmer") {
      return { success: false, error: "غير مصرح" };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("daily_reports")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: "فشل في حذف التقرير" };
    }

    revalidatePath("/farmer/daily-report");
    revalidatePath("/farmer/reports");
    revalidatePath("/admin/reports");

    return { success: true };
  } catch (error) {
    console.error("Error deleting daily report:", error);
    return { success: false, error: "حدث خطأ أثناء حذف التقرير" };
  }
}
