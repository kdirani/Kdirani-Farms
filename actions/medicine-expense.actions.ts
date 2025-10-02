'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type MedicineExpense = {
  id: string;
  consumption_invoice_id: string;
  expense_type_id: string | null;
  amount: number;
  account_name: string | null;
  expense_type_name?: string;
};

export type CreateMedicineExpenseInput = {
  consumption_invoice_id: string;
  expense_type_id: string;
  amount: number;
  account_name?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get medicine consumption expenses
 */
export async function getMedicineExpenses(invoiceId: string): Promise<ActionResult<MedicineExpense[]>> {
  try {
    const supabase = await createClient();

    const { data: expenses, error } = await supabase
      .from('medicine_consumption_expenses')
      .select('*')
      .eq('consumption_invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedExpenses: MedicineExpense[] = [];
    
    for (const expense of expenses || []) {
      let expenseTypeName;

      if (expense.expense_type_id) {
        const { data } = await supabase
          .from('expense_types')
          .select('name')
          .eq('id', expense.expense_type_id)
          .single();
        expenseTypeName = data?.name;
      }

      enrichedExpenses.push({
        ...expense,
        expense_type_name: expenseTypeName,
      });
    }

    return { success: true, data: enrichedExpenses };
  } catch (error) {
    console.error('Error getting medicine expenses:', error);
    return { success: false, error: 'Failed to get medicine expenses' };
  }
}

/**
 * Create medicine consumption expense
 */
export async function createMedicineExpense(input: CreateMedicineExpenseInput): Promise<ActionResult<MedicineExpense>> {
  try {
    const supabase = await createClient();

    const { data: newExpense, error } = await supabase
      .from('medicine_consumption_expenses')
      .insert({
        consumption_invoice_id: input.consumption_invoice_id,
        expense_type_id: input.expense_type_id,
        amount: input.amount,
        account_name: input.account_name?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update invoice total
    await updateInvoiceTotal(input.consumption_invoice_id);

    revalidatePath(`/admin/medicines-invoices/${input.consumption_invoice_id}`);
    return { success: true, data: newExpense };
  } catch (error) {
    console.error('Error creating medicine expense:', error);
    return { success: false, error: 'Failed to create medicine expense' };
  }
}

/**
 * Delete medicine consumption expense
 */
export async function deleteMedicineExpense(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: expense } = await supabase
      .from('medicine_consumption_expenses')
      .select('consumption_invoice_id')
      .eq('id', id)
      .single();

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    const { error } = await supabase
      .from('medicine_consumption_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotal(expense.consumption_invoice_id);

    revalidatePath(`/admin/medicines-invoices/${expense.consumption_invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting medicine expense:', error);
    return { success: false, error: 'Failed to delete medicine expense' };
  }
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
