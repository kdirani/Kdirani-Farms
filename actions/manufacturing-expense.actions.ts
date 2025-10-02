'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ManufacturingExpense = {
  id: string;
  manufacturing_invoice_id: string;
  expense_type_id: string | null;
  amount: number;
  account_name: string | null;
  expense_type_name?: string;
};

export type CreateManufacturingExpenseInput = {
  manufacturing_invoice_id: string;
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
 * Get manufacturing expenses
 */
export async function getManufacturingExpenses(invoiceId: string): Promise<ActionResult<ManufacturingExpense[]>> {
  try {
    const supabase = await createClient();

    const { data: expenses, error } = await supabase
      .from('manufacturing_expenses')
      .select('*')
      .eq('manufacturing_invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const enrichedExpenses: ManufacturingExpense[] = [];
    
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
    console.error('Error getting manufacturing expenses:', error);
    return { success: false, error: 'Failed to get manufacturing expenses' };
  }
}

/**
 * Create manufacturing expense
 */
export async function createManufacturingExpense(input: CreateManufacturingExpenseInput): Promise<ActionResult<ManufacturingExpense>> {
  try {
    const supabase = await createClient();

    const { data: newExpense, error } = await supabase
      .from('manufacturing_expenses')
      .insert({
        manufacturing_invoice_id: input.manufacturing_invoice_id,
        expense_type_id: input.expense_type_id,
        amount: input.amount,
        account_name: input.account_name?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/manufacturing/${input.manufacturing_invoice_id}`);
    return { success: true, data: newExpense };
  } catch (error) {
    console.error('Error creating manufacturing expense:', error);
    return { success: false, error: 'Failed to create manufacturing expense' };
  }
}

/**
 * Delete manufacturing expense
 */
export async function deleteManufacturingExpense(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: expense } = await supabase
      .from('manufacturing_expenses')
      .select('manufacturing_invoice_id')
      .eq('id', id)
      .single();

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    const { error } = await supabase
      .from('manufacturing_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/manufacturing/${expense.manufacturing_invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting manufacturing expense:', error);
    return { success: false, error: 'Failed to delete manufacturing expense' };
  }
}
