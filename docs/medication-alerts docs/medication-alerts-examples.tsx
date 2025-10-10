/**
 * أمثلة كود TypeScript/Next.js لنظام التنبيهات الدوائية
 * 
 * هذا الملف يحتوي على أمثلة جاهزة للاستخدام في التطبيق
 */

import { createClient } from '@/lib/supabase/server';

// ==================================================================================
// Types - التعريفات
// ==================================================================================

export type MedicationAlert = {
  id: string;
  farm_id: string;
  medicine_id: string;
  scheduled_day: number;
  scheduled_date: string;
  alert_date: string;
  is_administered: boolean;
  administered_at?: string;
  administered_by?: string;
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

// ==================================================================================
// Server Actions - إجراءات الخادم
// ==================================================================================

/**
 * جلب التنبيهات النشطة لمزرعة معينة
 */
export async function getActiveAlertsForFarm(
  farmId: string,
  daysAhead: number = 7
): Promise<{ success: boolean; data?: AlertWithDetails[]; error?: string }> {
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
): Promise<{ success: boolean; data?: UpcomingAlert[]; error?: string }> {
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
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('mark_alert_as_administered', {
      p_alert_id: alertId,
      p_user_id: userId,
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
): Promise<{ success: boolean; error?: string }> {
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

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء إلغاء التحديث' };
  }
}

/**
 * إنشاء تنبيهات لمزرعة جديدة
 */
export async function createAlertsForFarm(
  farmId: string,
  chickBirthDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('create_medication_alerts_for_farm', {
      p_farm_id: farmId,
      p_chick_birth_date: chickBirthDate,
    });

    if (error) {
      console.error('Error creating alerts:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء التنبيهات' };
  }
}

/**
 * جلب ملخص التنبيهات لجميع المزارع
 */
export async function getAlertsSummary(): Promise<{
  success: boolean;
  data?: AlertsSummary[];
  error?: string;
}> {
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
export async function getFarmAlertStats(farmId: string): Promise<{
  success: boolean;
  data?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    today: number;
    tomorrow: number;
  };
  error?: string;
}> {
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

// ==================================================================================
// مكونات React - أمثلة
// ==================================================================================

/**
 * مثال: مكون بطاقة التنبيهات للصفحة الرئيسية
 */
/*
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { getUpcomingAlertsForUser, markAlertAsAdministered } from '@/actions/medication-alerts.actions';
import { toast } from 'sonner';

interface MedicationAlertsCardProps {
  userId: string;
}

export function MedicationAlertsCard({ userId }: MedicationAlertsCardProps) {
  const [alerts, setAlerts] = useState<UpcomingAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = async () => {
    setLoading(true);
    const result = await getUpcomingAlertsForUser(userId, 5);
    if (result.success && result.data) {
      setAlerts(result.data);
    }
    setLoading(false);
  };

  const handleMarkAsAdministered = async (alertId: string) => {
    const result = await markAlertAsAdministered(alertId, userId);
    if (result.success) {
      toast.success('تم تحديث حالة التنبيه بنجاح');
      loadAlerts(); // إعادة تحميل التنبيهات
    } else {
      toast.error(result.error || 'فشل في تحديث التنبيه');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          التنبيهات الدوائية القادمة
        </CardTitle>
        <CardDescription>
          {alerts.length === 0
            ? 'لا توجد تنبيهات قادمة'
            : `لديك ${alerts.length} تنبيه(ات) قادم(ة)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.alert_id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.priority === 'متأخر'
                ? 'bg-red-50 border-red-500'
                : alert.priority === 'اليوم'
                ? 'bg-orange-50 border-orange-500'
                : alert.priority === 'غداً'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-white border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      alert.priority === 'متأخر'
                        ? 'destructive'
                        : alert.priority === 'اليوم'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {alert.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {alert.farm_name}
                  </span>
                </div>
                <h4 className="font-semibold mb-1">💊 {alert.medicine_name}</h4>
                <p className="text-sm text-muted-foreground">
                  📅 {new Date(alert.scheduled_date).toLocaleDateString('ar-EG')}
                  {alert.days_until > 0 && ` (بعد ${alert.days_until} يوم)`}
                  {alert.days_until === 0 && ' (اليوم)'}
                  {alert.days_until < 0 && ` (متأخر ${Math.abs(alert.days_until)} يوم)`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAsAdministered(alert.alert_id)}
              >
                <CheckCircle2 className="h-4 w-4 ml-2" />
                تم الإعطاء
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
*/

/**
 * مثال: مكون قائمة التنبيهات الكاملة
 */
/*
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getActiveAlertsForFarm, markAlertAsAdministered } from '@/actions/medication-alerts.actions';
import { toast } from 'sonner';

interface AlertsListProps {
  farmId: string;
  userId: string;
}

export function AlertsList({ farmId, userId }: AlertsListProps) {
  const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [farmId]);

  const loadAlerts = async () => {
    setLoading(true);
    const result = await getActiveAlertsForFarm(farmId, 30); // آخر 30 يوم
    if (result.success && result.data) {
      setAlerts(result.data);
    }
    setLoading(false);
  };

  const handleMarkComplete = async (alertId: string) => {
    const result = await markAlertAsAdministered(alertId, userId);
    if (result.success) {
      toast.success('تم تحديث حالة التنبيه');
      loadAlerts();
    } else {
      toast.error(result.error || 'فشل التحديث');
    }
  };

  const overdueAlerts = alerts.filter((a) => a.is_overdue);
  const todayAlerts = alerts.filter(
    (a) => !a.is_overdue && a.days_until_scheduled === 0
  );
  const upcomingAlerts = alerts.filter((a) => a.days_until_scheduled > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>التنبيهات الدوائية</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              الكل ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              متأخر ({overdueAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="today">
              اليوم ({todayAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              قادم ({upcomingAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderAlertsList(alerts, handleMarkComplete)}
          </TabsContent>
          <TabsContent value="overdue">
            {renderAlertsList(overdueAlerts, handleMarkComplete)}
          </TabsContent>
          <TabsContent value="today">
            {renderAlertsList(todayAlerts, handleMarkComplete)}
          </TabsContent>
          <TabsContent value="upcoming">
            {renderAlertsList(upcomingAlerts, handleMarkComplete)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function renderAlertsList(
  alerts: AlertWithDetails[],
  onMarkComplete: (id: string) => void
) {
  if (alerts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">لا توجد تنبيهات</div>;
  }

  return (
    <div className="space-y-3 mt-4">
      {alerts.map((alert) => (
        <div
          key={alert.alert_id}
          className="p-4 rounded-lg border"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold mb-2">{alert.medicine_name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {alert.medicine_description}
              </p>
              <div className="flex gap-4 text-sm">
                <span>📅 {new Date(alert.scheduled_date).toLocaleDateString('ar-EG')}</span>
                <span>🐣 عمر {alert.scheduled_day} يوم</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onMarkComplete(alert.alert_id)}
            >
              تم ✓
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
*/

// ==================================================================================
// دوال مساعدة
// ==================================================================================

/**
 * تنسيق التاريخ بالعربية
 */
export function formatArabicDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * حساب الأيام المتبقية
 */
export function getDaysUntil(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * الحصول على لون الأولوية
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'عاجل - متأخر':
    case 'متأخر':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'عاجل - اليوم':
    case 'اليوم':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'مهم - غداً':
    case 'غداً':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

/**
 * الحصول على أيقونة الأولوية
 */
export function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'عاجل - متأخر':
    case 'متأخر':
      return '🚨';
    case 'عاجل - اليوم':
    case 'اليوم':
      return '⚠️';
    case 'مهم - غداً':
    case 'غداً':
      return '📌';
    default:
      return '📅';
  }
}
