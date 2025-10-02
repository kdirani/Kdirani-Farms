'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ExpenseType = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CreateExpenseTypeInput = {
  name: string;
};

export type UpdateExpenseTypeInput = {
  id: string;
  name: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all expense types
 */
export async function getExpenseTypes(): Promise<ActionResult<ExpenseType[]>> {
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

    const { data: expenseTypes, error } = await supabase
      .from('expense_types')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: expenseTypes || [] };
  } catch (error) {
    console.error('Error getting expense types:', error);
    return { success: false, error: 'Failed to get expense types' };
  }
}

/**
 * Create a new expense type
 */
export async function createExpenseType(input: CreateExpenseTypeInput): Promise<ActionResult<ExpenseType>> {
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

    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Expense type name must be at least 2 characters' };
    }

    // Check if expense type already exists
    const { data: existing } = await supabase
      .from('expense_types')
      .select('id')
      .eq('name', input.name.trim())
      .single();

    if (existing) {
      return { success: false, error: 'Expense type already exists' };
    }

    const { data: newExpenseType, error } = await supabase
      .from('expense_types')
      .insert({
        name: input.name.trim(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/expense-types');
    return { success: true, data: newExpenseType };
  } catch (error) {
    console.error('Error creating expense type:', error);
    return { success: false, error: 'Failed to create expense type' };
  }
}

/**
 * Update an expense type
 */
export async function updateExpenseType(input: UpdateExpenseTypeInput): Promise<ActionResult<ExpenseType>> {
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

    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Expense type name must be at least 2 characters' };
    }

    // Check if expense type already exists (excluding current record)
    const { data: existing } = await supabase
      .from('expense_types')
      .select('id')
      .eq('name', input.name.trim())
      .neq('id', input.id)
      .single();

    if (existing) {
      return { success: false, error: 'Expense type already exists' };
    }

    const { data: updatedExpenseType, error } = await supabase
      .from('expense_types')
      .update({
        name: input.name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/expense-types');
    return { success: true, data: updatedExpenseType };
  } catch (error) {
    console.error('Error updating expense type:', error);
    return { success: false, error: 'Failed to update expense type' };
  }
}

/**
 * Delete an expense type
 */
export async function deleteExpenseType(id: string): Promise<ActionResult> {
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

    const { error } = await supabase
      .from('expense_types')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/expense-types');
    return { success: true };
  } catch (error) {
    console.error('Error deleting expense type:', error);
    return { success: false, error: 'Failed to delete expense type' };
  }
}
