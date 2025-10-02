'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type InvoiceExpense = {
  id: string;
  invoice_id: string;
  expense_type_id: string | null;
  amount: number;
  account_name: string | null;
  expense_type_name?: string;
};

export type CreateInvoiceExpenseInput = {
  invoice_id: string;
  expense_type_id: string;
  amount: number;
  account_name?: string;
};

export type UpdateInvoiceExpenseInput = {
  id: string;
  amount?: number;
  account_name?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get invoice expenses
 */
export async function getInvoiceExpenses(invoiceId: string): Promise<ActionResult<InvoiceExpense[]>> {
  try {
    const supabase = await createClient();

    const { data: expenses, error } = await supabase
      .from('invoice_expenses')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedExpenses: InvoiceExpense[] = [];
    
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
    console.error('Error getting invoice expenses:', error);
    return { success: false, error: 'Failed to get invoice expenses' };
  }
}

/**
 * Create invoice expense
 */
export async function createInvoiceExpense(input: CreateInvoiceExpenseInput): Promise<ActionResult<InvoiceExpense>> {
  try {
    const supabase = await createClient();

    const { data: newExpense, error } = await supabase
      .from('invoice_expenses')
      .insert({
        invoice_id: input.invoice_id,
        expense_type_id: input.expense_type_id,
        amount: input.amount,
        account_name: input.account_name?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotals(input.invoice_id);

    revalidatePath(`/admin/invoices/${input.invoice_id}`);
    return { success: true, data: newExpense };
  } catch (error) {
    console.error('Error creating invoice expense:', error);
    return { success: false, error: 'Failed to create invoice expense' };
  }
}

/**
 * Update invoice expense
 */
export async function updateInvoiceExpense(input: UpdateInvoiceExpenseInput): Promise<ActionResult<InvoiceExpense>> {
  try {
    const supabase = await createClient();

    const { data: current } = await supabase
      .from('invoice_expenses')
      .select('invoice_id')
      .eq('id', input.id)
      .single();

    if (!current) {
      return { success: false, error: 'Expense not found' };
    }

    const updateData: any = {};
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.account_name !== undefined) updateData.account_name = input.account_name?.trim() || null;

    const { data: updatedExpense, error } = await supabase
      .from('invoice_expenses')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotals(current.invoice_id);

    revalidatePath(`/admin/invoices/${current.invoice_id}`);
    return { success: true, data: updatedExpense };
  } catch (error) {
    console.error('Error updating invoice expense:', error);
    return { success: false, error: 'Failed to update invoice expense' };
  }
}

/**
 * Delete invoice expense
 */
export async function deleteInvoiceExpense(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: expense } = await supabase
      .from('invoice_expenses')
      .select('invoice_id')
      .eq('id', id)
      .single();

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    const { error } = await supabase
      .from('invoice_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    await updateInvoiceTotals(expense.invoice_id);

    revalidatePath(`/admin/invoices/${expense.invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice expense:', error);
    return { success: false, error: 'Failed to delete invoice expense' };
  }
}

/**
 * Update invoice totals
 */
async function updateInvoiceTotals(invoiceId: string) {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from('invoice_items')
    .select('value')
    .eq('invoice_id', invoiceId);

  const totalItemsValue = items?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

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
