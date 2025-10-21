'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

export type Client = {
  id: string;
  name: string;
  type: 'customer' | 'provider';
};

export type CreateClientInput = {
  name: string;
  type: 'customer' | 'provider';
};

export type UpdateClientInput = {
  id: string;
  name: string;
  type: 'customer' | 'provider';
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all clients
 */
export async function getClients(): Promise<ActionResult<Client[]>> {
  try {
    const supabase = await createSupabaseClient();

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

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: clients || [] };
  } catch (error) {
    console.error('Error getting clients:', error);
    return { success: false, error: 'Failed to get clients' };
  }
}

/**
 * Create a new client
 */
export async function createClient(input: CreateClientInput): Promise<ActionResult<Client>> {
  try {
    const supabase = await createSupabaseClient();

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
      return { success: false, error: 'Client name must be at least 2 characters' };
    }

    if (!input.type || !['customer', 'provider'].includes(input.type)) {
      return { success: false, error: 'Client type must be either customer or provider' };
    }

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        name: input.name.trim(),
        type: input.type,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/clients');
    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: 'Failed to create client' };
  }
}

/**
 * Update a client
 */
export async function updateClient(input: UpdateClientInput): Promise<ActionResult<Client>> {
  try {
    const supabase = await createSupabaseClient();

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
      return { success: false, error: 'Client name must be at least 2 characters' };
    }

    if (!input.type || !['customer', 'provider'].includes(input.type)) {
      return { success: false, error: 'Client type must be either customer or provider' };
    }

    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update({
        name: input.name.trim(),
        type: input.type,
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/clients');
    return { success: true, data: updatedClient };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: 'Failed to update client' };
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseClient();

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
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/clients');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: 'Failed to delete client' };
  }
}

/**
 * Get all clients for farmers (read-only access)
 */
export async function getFarmerClients(): Promise<ActionResult<Client[]>> {
  try {
    const supabase = await createSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Farmers can read clients but not modify them
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: clients || [] };
  } catch (error) {
    console.error('Error getting farmer clients:', error);
    return { success: false, error: 'Failed to get clients' };
  }
}
