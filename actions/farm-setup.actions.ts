'use server';

import { revalidatePath } from 'next/cache';
import { createUser, CreateUserInput } from './user.actions';
import { createFarm, CreateFarmInput } from './farm.actions';
import { createWarehouse, CreateWarehouseInput } from './warehouse.actions';
import { createPoultryStatus, CreatePoultryInput } from './poultry.actions';
import { createMaterial, CreateMaterialInput } from './material.actions';
import { createClient } from '@/lib/supabase/server';

export type FarmSetupInput = {
  // User details
  user: {
    email: string;
    password: string;
    fname: string;
  };
  
  // Farm details
  farm: {
    name: string;
    location?: string;
    is_active?: boolean;
  };
  
  // Warehouse details
  warehouse: {
    name: string;
  };
  
  // Poultry details
  poultry: {
    batch_name: string;
    opening_chicks: number;
  };
  
  // Materials (array of materials to create)
  materials: Array<{
    material_name_id: string;
    unit_id: string;
    opening_balance: number;
  }>;
  
  // Medicines (array of medicines to create)
  medicines: Array<{
    medicine_id: string;
    unit_id: string;
    opening_balance: number;
  }>;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type SetupResult = {
  userId?: string;
  farmId?: string;
  warehouseId?: string;
  poultryId?: string;
  materialIds?: string[];
  medicineIds?: string[];
};

/**
 * Create a complete farm setup with user, farm, warehouse, poultry, and materials
 */
export async function createCompleteFarmSetup(
  input: FarmSetupInput
): Promise<ActionResult<SetupResult>> {
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

    const result: SetupResult = {};

    // Step 1: Create user (farmer)
    const userInput: CreateUserInput = {
      email: input.user.email,
      password: input.user.password,
      fname: input.user.fname,
      user_role: 'farmer',
    };

    const userResult = await createUser(userInput);
    if (!userResult.success || !userResult.data) {
      return { 
        success: false, 
        error: `Failed to create user: ${userResult.error}` 
      };
    }
    result.userId = userResult.data.id;

    // Step 2: Create farm and assign to user
    const farmInput: CreateFarmInput = {
      name: input.farm.name,
      location: input.farm.location,
      is_active: input.farm.is_active ?? true,
      user_id: result.userId,
    };

    const farmResult = await createFarm(farmInput);
    if (!farmResult.success || !farmResult.data) {
      return { 
        success: false, 
        error: `Failed to create farm: ${farmResult.error}`,
        data: result,
      };
    }
    result.farmId = farmResult.data.id;

    // Step 3: Create warehouse for the farm
    const warehouseInput: CreateWarehouseInput = {
      name: input.warehouse.name,
      farm_id: result.farmId,
    };

    const warehouseResult = await createWarehouse(warehouseInput);
    if (!warehouseResult.success || !warehouseResult.data) {
      return { 
        success: false, 
        error: `Failed to create warehouse: ${warehouseResult.error}`,
        data: result,
      };
    }
    result.warehouseId = warehouseResult.data.id;

    // Step 4: Create poultry batch
    const poultryInput: CreatePoultryInput = {
      farm_id: result.farmId,
      batch_name: input.poultry.batch_name,
      opening_chicks: input.poultry.opening_chicks,
    };

    const poultryResult = await createPoultryStatus(poultryInput);
    if (!poultryResult.success || !poultryResult.data) {
      return { 
        success: false, 
        error: `Failed to create poultry batch: ${poultryResult.error}`,
        data: result,
      };
    }
    result.poultryId = poultryResult.data.id;

    // Step 5: Create materials (opening stocks)
    result.materialIds = [];
    for (const material of input.materials) {
      const materialInput: CreateMaterialInput = {
        warehouse_id: result.warehouseId,
        material_name_id: material.material_name_id,
        unit_id: material.unit_id,
        opening_balance: material.opening_balance,
      };

      const materialResult = await createMaterial(materialInput);
      if (materialResult.success && materialResult.data) {
        result.materialIds.push(materialResult.data.id);
      }
      // Continue even if some materials fail - we'll still create the others
    }

    // Step 6: Create medicines (opening stocks)
    result.medicineIds = [];
    for (const medicine of input.medicines || []) {
      const medicineInput: CreateMaterialInput = {
        warehouse_id: result.warehouseId,
        medicine_id: medicine.medicine_id,
        unit_id: medicine.unit_id,
        opening_balance: medicine.opening_balance,
      };

      const medicineResult = await createMaterial(medicineInput);
      if (medicineResult.success && medicineResult.data) {
        result.medicineIds.push(medicineResult.data.id);
      }
      // Continue even if some medicines fail - we'll still create the others
    }

    // Revalidate all relevant paths
    revalidatePath('/admin/users');
    revalidatePath('/admin/farms');
    revalidatePath('/admin/warehouses');
    revalidatePath('/admin/poultry');
    revalidatePath('/admin/materials');
    revalidatePath('/admin/setup');

    return { 
      success: true, 
      data: result,
    };
  } catch (error) {
    console.error('Error in complete farm setup:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred during setup' 
    };
  }
}
