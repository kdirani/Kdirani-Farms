'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ==================================================================================
// Types - التعريفات
// ==================================================================================

export type MedicationAlert = {
  id: string;
  farm_id: string;
  poultry_status_id: string;
  medicine_id: string;
  scheduled_day: number;
  scheduled_date: string;
  alert_date: string;
  is_administered: boolean;
  administered_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
};

export type AlertWithDetails = {
  alert_id: string;
  medicine_id: string;
  medicine_name: string;
  medicine_description: string;
  scheduled_day: number;
  scheduled_date: string;
  alert_date: string;
  is_administered: boolean;
  days_until_scheduled: number;
  is_overdue: boolean;
  priority: 'عاجل - متأخر' | 'عاجل - اليوم' | 'مهم - غداً' | 'عادي' | 'غير عاجل';
  notes?: string;
};

export type UpcomingAlert = {
  alert_id: string;
  farm_id: string;
  farm_name: string;
  medicine_name: string;
  scheduled_date: string;
  days_until: number;
  priority: 'متأخر' | 'اليوم' | 'غداً' | 'قادم';
  urgency_level: number;
};

export type AlertsSummary = {
  farm_id: string;
  farm_name: string;
  chick_birth_date: string;
  current_chick_age: number;
  total_alerts: number;
  completed_alerts: number;
  pending_alerts: number;
  overdue_alerts: number;
  today_alerts: number;
  tomorrow_alerts: number;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ==================================================================================
// Server Actions - إجراءات الخادم
// ==================================================================================

/**
 * حساب عمر الفراخ بالأيام
 */
export async function calculateChickAge(
  birthDate: string,
  referenceDate?: string
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_chick_age_in_days', {
      birth_date: birthDate,
      reference_date: referenceDate || new Date().toISOString().split('T')[0],
    });

    if (error) {
      console.error('Error calculating chick age:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || 0 };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء حساب عمر الفراخ' };
  }
}

/**
 * إنشاء تنبيهات لقطيع جديد
 */
export async function createAlertsForPoultry(
  poultryStatusId: string,
  chickBirthDate: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('create_medication_alerts_for_poultry', {
      p_poultry_status_id: poultryStatusId,
      p_chick_birth_date: chickBirthDate,
    });

    if (error) {
      console.error('Error creating alerts:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/farmer');
    revalidatePath('/admin/farms');
    
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء التنبيهات' };
  }
}

/**
 * جلب التنبيهات النشطة لمزرعة معينة
 */
export async function getActiveAlertsForFarm(
  farmId: string,
  daysAhead: number = 7
): Promise<ActionResult<AlertWithDetails[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_active_alerts_for_farm', {
      p_farm_id: farmId,
      p_days_ahead: daysAhead,
    });

    if (error) {
      console.error('Error fetching active alerts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب التنبيهات' };
  }
}

/**
 * جلب التنبيهات القادمة للمستخدم (للصفحة الرئيسية)
 */
export async function getUpcomingAlertsForUser(
  userId: string,
  limit: number = 10
): Promise<ActionResult<UpcomingAlert[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_upcoming_alerts', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching upcoming alerts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب التنبيهات القادمة' };
  }
}

/**
 * تحديد تنبيه كـ "تم إعطاء الدواء"
 */
export async function markAlertAsAdministered(
  alertId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('mark_alert_as_administered', {
      p_alert_id: alertId,
      p_notes: notes || null,
    });

    if (error) {
      console.error('Error marking alert as administered:', error);
      return { success: false, error: error.message };
    }

    // data سيكون true إذا تم التحديث بنجاح
    if (!data) {
      return { success: false, error: 'لم يتم العثور على التنبيه أو تم تحديثه مسبقاً' };
    }

    revalidatePath('/farmer');
    revalidatePath('/admin/farms');

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث التنبيه' };
  }
}

/**
 * إلغاء تحديد التنبيه
 */
export async function unmarkAlertAsAdministered(
  alertId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('unmark_alert_as_administered', {
      p_alert_id: alertId,
    });

    if (error) {
      console.error('Error unmarking alert:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'لم يتم العثور على التنبيه' };
    }

    revalidatePath('/farmer');
    revalidatePath('/admin/farms');

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء إلغاء التحديث' };
  }
}

/**
 * جلب ملخص التنبيهات لجميع المزارع
 */
export async function getAlertsSummary(): Promise<ActionResult<AlertsSummary[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('v_medication_alerts_summary')
      .select('*')
      .order('overdue_alerts', { ascending: false })
      .order('today_alerts', { ascending: false });

    if (error) {
      console.error('Error fetching alerts summary:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب ملخص التنبيهات' };
  }
}

/**
 * جلب إحصائيات التنبيهات لمزرعة معينة
 */
export async function getFarmAlertStats(farmId: string): Promise<
  ActionResult<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    today: number;
    tomorrow: number;
  }>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('medication_alerts')
      .select('*')
      .eq('farm_id', farmId);

    if (error) {
      console.error('Error fetching farm alert stats:', error);
      return { success: false, error: error.message };
    }

    const alerts = data || [];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const stats = {
      total: alerts.length,
      completed: alerts.filter((a) => a.is_administered).length,
      pending: alerts.filter((a) => !a.is_administered).length,
      overdue: alerts.filter(
        (a) => !a.is_administered && a.scheduled_date < today
      ).length,
      today: alerts.filter(
        (a) => !a.is_administered && a.scheduled_date === today
      ).length,
      tomorrow: alerts.filter(
        (a) => !a.is_administered && a.scheduled_date === tomorrow
      ).length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب الإحصائيات' };
  }
}

/**
 * جلب جميع التنبيهات لمزرعة معينة
 */
export async function getAllAlertsForFarm(
  farmId: string
): Promise<ActionResult<MedicationAlert[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('medication_alerts')
      .select('*')
      .eq('farm_id', farmId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching all alerts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب التنبيهات' };
  }
}

/**
 * جلب تنبيه واحد بالتفاصيل
 */
export async function getAlertById(
  alertId: string
): Promise<ActionResult<MedicationAlert & { medicine?: any }>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('medication_alerts')
      .select(`
        *,
        medicine:medicines(*)
      `)
      .eq('id', alertId)
      .single();

    if (error) {
      console.error('Error fetching alert:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب التنبيه' };
  }
}

/**
 * تحديث ملاحظات تنبيه
 */
export async function updateAlertNotes(
  alertId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('medication_alerts')
      .update({ 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error updating alert notes:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/farmer');
    revalidatePath('/admin/farms');

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث الملاحظات' };
  }
}
