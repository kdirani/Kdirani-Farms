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

    // استخدام استعلام مباشر بدلاً من دالة قاعدة البيانات
    const { data, error } = await supabase
      .from('medication_alerts')
      .select(`
        id,
        medicine_id,
        scheduled_day,
        scheduled_date,
        alert_date,
        is_administered,
        notes,
        medicines!inner (
          id,
          name,
          description
        )
      `)
      .eq('farm_id', farmId)
      .eq('is_administered', false)
      .lte('alert_date', new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching active alerts:', error);
      return { success: false, error: error.message };
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const alerts: AlertWithDetails[] = (data || []).map((alert: any) => {
      const today = new Date();
      const scheduledDate = new Date(alert.scheduled_date);
      const daysUntilScheduled = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilScheduled < 0;

      let priority: 'عاجل - متأخر' | 'عاجل - اليوم' | 'مهم - غداً' | 'عادي' | 'غير عاجل';
      if (isOverdue) priority = 'عاجل - متأخر';
      else if (daysUntilScheduled === 0) priority = 'عاجل - اليوم';
      else if (daysUntilScheduled === 1) priority = 'مهم - غداً';
      else if (daysUntilScheduled <= daysAhead) priority = 'عادي';
      else priority = 'غير عاجل';

      return {
        alert_id: alert.id,
        medicine_id: alert.medicine_id,
        medicine_name: alert.medicines.name,
        medicine_description: alert.medicines.description || '',
        scheduled_day: alert.scheduled_day,
        scheduled_date: alert.scheduled_date,
        alert_date: alert.alert_date,
        is_administered: alert.is_administered,
        days_until_scheduled: daysUntilScheduled,
        is_overdue: isOverdue,
        priority,
        notes: alert.notes || '',
      };
    });

    // ترتيب حسب الأولوية
    alerts.sort((a, b) => {
      const priorityOrder = {
        'عاجل - متأخر': 1,
        'عاجل - اليوم': 2,
        'مهم - غداً': 3,
        'عادي': 4,
        'غير عاجل': 5,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return { success: true, data: alerts };
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

    // استخدام استعلام مباشر بدلاً من دالة قاعدة البيانات
    // جلب جميع التنبيهات غير المنفذة بدون قيد لعرض كل التنبيهات المتأخرة
    const { data, error } = await supabase
      .from('medication_alerts')
      .select(`
        id,
        farm_id,
        scheduled_date,
        farms!inner (
          id,
          name,
          user_id
        ),
        medicines!inner (
          id,
          name
        )
      `)
      .eq('farms.user_id', userId)
      .eq('is_administered', false)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming alerts:', error);
      return { success: false, error: error.message };
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const allAlerts: UpcomingAlert[] = (data || []).map((alert: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduledDate = new Date(alert.scheduled_date);
      scheduledDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let priority: 'متأخر' | 'اليوم' | 'غداً' | 'قادم';
      if (daysUntil < 0) priority = 'متأخر';
      else if (daysUntil === 0) priority = 'اليوم';
      else if (daysUntil === 1) priority = 'غداً';
      else priority = 'قادم';

      let urgencyLevel: number;
      if (daysUntil < 0) urgencyLevel = 1;
      else if (daysUntil === 0) urgencyLevel = 2;
      else if (daysUntil === 1) urgencyLevel = 3;
      else urgencyLevel = 4;

      return {
        alert_id: alert.id,
        farm_id: alert.farm_id,
        farm_name: alert.farms.name,
        medicine_name: alert.medicines.name,
        scheduled_date: alert.scheduled_date,
        days_until: daysUntil,
        priority,
        urgency_level: urgencyLevel,
      };
    });

    // فصل التنبيهات حسب الأولوية
    const overdueAlerts = allAlerts.filter(alert => alert.priority === 'متأخر');
    const todayAlerts = allAlerts.filter(alert => alert.priority === 'اليوم');
    const tomorrowAlerts = allAlerts.filter(alert => alert.priority === 'غداً');
    const upcomingAlerts = allAlerts.filter(alert => alert.priority === 'قادم');
    
    // ترتيب حسب الأولوية
    overdueAlerts.sort((a, b) => a.days_until - b.days_until); // الأقدم أولاً
    
    // عرض كل التنبيهات المتأخرة واليوم وغداً بدون حد + تنبيه قادم واحد فقط
    const alerts = [
      ...overdueAlerts, // كل التنبيهات المتأخرة
      ...todayAlerts, // كل تنبيهات اليوم
      ...tomorrowAlerts, // كل تنبيهات الغد
      ...upcomingAlerts.slice(0, 1) // تنبيه قادم واحد فقط
    ];

    return { success: true, data: alerts };
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
    revalidatePath('/admin/medication-alerts');

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
    revalidatePath('/admin/medication-alerts');

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
    revalidatePath('/admin/medication-alerts');

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث الملاحظات' };
  }
}

/**
 * جلب جميع التنبيهات للمدير مع تفاصيل المزرعة والدواء
 */
export type AdminMedicationAlert = {
  id: string;
  farm_id: string;
  farm_name: string;
  medicine_id: string;
  medicine_name: string;
  scheduled_day: number;
  scheduled_date: string;
  is_administered: boolean;
  administered_at?: string;
  notes?: string;
  days_until_scheduled: number;
  priority: 'متأخر' | 'اليوم' | 'غداً' | 'قادم';
};

export async function getAllAlertsForAdmin(
  farmId?: string
): Promise<ActionResult<AdminMedicationAlert[]>> {
  try {
    const supabase = await createClient();

    // التحقق من أن المستخدم مدير
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'غير مصرح' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.user_role !== 'admin' && profile.user_role !== 'sub_admin')) {
      return { success: false, error: 'غير مصرح - يتطلب صلاحيات المدير' };
    }

    // بناء الاستعلام
    let query = supabase
      .from('medication_alerts')
      .select(`
        id,
        farm_id,
        medicine_id,
        scheduled_day,
        scheduled_date,
        is_administered,
        administered_at,
        notes,
        farms!inner (
          id,
          name
        ),
        medicines!inner (
          id,
          name
        )
      `)
      .order('scheduled_date', { ascending: false });

    // التصفية حسب المزرعة إذا تم تحديدها
    if (farmId) {
      query = query.eq('farm_id', farmId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching alerts for admin:', error);
      return { success: false, error: error.message };
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const alerts: AdminMedicationAlert[] = (data || []).map((alert: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduledDate = new Date(alert.scheduled_date);
      scheduledDate.setHours(0, 0, 0, 0);
      const daysUntilScheduled = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let priority: 'متأخر' | 'اليوم' | 'غداً' | 'قادم';
      if (daysUntilScheduled < 0) priority = 'متأخر';
      else if (daysUntilScheduled === 0) priority = 'اليوم';
      else if (daysUntilScheduled === 1) priority = 'غداً';
      else priority = 'قادم';

      return {
        id: alert.id,
        farm_id: alert.farm_id,
        farm_name: alert.farms.name,
        medicine_id: alert.medicine_id,
        medicine_name: alert.medicines.name,
        scheduled_day: alert.scheduled_day,
        scheduled_date: alert.scheduled_date,
        is_administered: alert.is_administered,
        administered_at: alert.administered_at,
        notes: alert.notes,
        days_until_scheduled: daysUntilScheduled,
        priority,
      };
    });

    return { success: true, data: alerts };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب التنبيهات' };
  }
}
