'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { UserRole } from '@/types/database.types';

export type User = {
  id: string;
  email: string;
  fname: string;
  user_role: UserRole;
  created_at: string;
  updated_at: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
};

export type CreateUserInput = {
  email: string;
  password: string;
  fname: string;
  user_role: UserRole;
};

export type UpdateUserInput = {
  id: string;
  fname?: string;
  user_role?: UserRole;
  email?: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<ActionResult<User[]>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
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

    // Get all users from auth.users using admin client
    const adminClient = await createAdminClient();
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
      return { success: false, error: authError.message };
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return { success: false, error: profilesError.message };
    }

    // Merge auth users with profiles
    const users: User[] = authUsers.users.map((authUser) => {
      const profile = profiles.find(p => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email!,
        fname: profile?.fname || 'Unknown',
        user_role: profile?.user_role || 'farmer',
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at || null,
        email_confirmed_at: authUser.email_confirmed_at || null,
        last_sign_in_at: authUser.last_sign_in_at || null,
      };
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: 'Failed to get users' };
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<ActionResult<User>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
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

    // Get user from auth
    const adminClient = await createAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(userId);

    if (authError || !authData.user) {
      return { success: false, error: 'User not found' };
    }

    // Get profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    const userData: User = {
      id: authData.user.id,
      email: authData.user.email!,
      fname: userProfile.fname,
      user_role: userProfile.user_role,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
      email_confirmed_at: authData.user.email_confirmed_at || null,
      last_sign_in_at: authData.user.last_sign_in_at || null,
    };

    return { success: true, data: userData };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: 'Failed to get user' };
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUser(input: CreateUserInput): Promise<ActionResult<User>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
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

    // Validate input
    if (!input.email || !input.password || !input.fname) {
      return { success: false, error: 'Missing required fields' };
    }

    if (input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Create user in auth
    const adminClient = await createAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create user' };
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        fname: input.fname,
        user_role: input.user_role,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: profileError.message };
    }

    const newUser: User = {
      id: authData.user.id,
      email: authData.user.email!,
      fname: newProfile.fname,
      user_role: newProfile.user_role,
      created_at: newProfile.created_at,
      updated_at: newProfile.updated_at,
      email_confirmed_at: authData.user.email_confirmed_at || null,
      last_sign_in_at: authData.user.last_sign_in_at || null,
    };

    revalidatePath('/admin/users');
    return { success: true, data: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

/**
 * Update a user (admin only)
 */
export async function updateUser(input: UpdateUserInput): Promise<ActionResult<User>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
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

    // Update email in auth if provided
    if (input.email) {
      const adminClient = await createAdminClient();
      const { error: emailError } = await adminClient.auth.admin.updateUserById(
        input.id,
        { email: input.email }
      );

      if (emailError) {
        return { success: false, error: emailError.message };
      }
    }

    // Update profile
    const updateData: any = {};
    if (input.fname) updateData.fname = input.fname;
    if (input.user_role) updateData.user_role = input.user_role;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Get updated auth user
    const adminClient = await createAdminClient();
    const { data: authData } = await adminClient.auth.admin.getUserById(input.id);

    const updatedUser: User = {
      id: updatedProfile.id,
      email: input.email || authData?.user?.email || '',
      fname: updatedProfile.fname,
      user_role: updatedProfile.user_role,
      created_at: updatedProfile.created_at,
      updated_at: updatedProfile.updated_at,
      email_confirmed_at: authData?.user?.email_confirmed_at || null,
      last_sign_in_at: authData?.user?.last_sign_in_at || null,
    };

    revalidatePath('/admin/users');
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (user.id === userId) {
      return { success: false, error: 'Cannot delete yourself' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Delete profile first (cascade will handle related records)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Delete user from auth
    const adminClient = await createAdminClient();
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Profile is already deleted, but log the error
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Check if user is admin
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

    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Update password
    const adminClient = await createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Toggle user active status (admin only)
 */
export async function toggleUserStatus(userId: string, ban: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (user.id === userId) {
      return { success: false, error: 'Cannot ban yourself' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Ban or unban user
    const adminClient = await createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: ban ? 'none' : '876000h', // ~100 years for permanent ban
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, error: 'Failed to toggle user status' };
  }
}
