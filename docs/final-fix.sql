-- الحل النهائي لمشكلة التنبيهات
-- انسخ هذا الكود بالكامل في Supabase SQL Editor

-- 1. حذف الدوال القديمة
DROP FUNCTION IF EXISTS public.get_upcoming_alerts(uuid, integer);
DROP FUNCTION IF EXISTS public.get_active_alerts_for_farm(uuid, integer);

-- 2. إنشاء دالة get_upcoming_alerts الجديدة
CREATE OR REPLACE FUNCTION public.get_upcoming_alerts(
  p_user_id uuid,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  alert_id uuid,
  farm_id uuid,
  farm_name TEXT,
  medicine_name TEXT,  -- تم تغييره إلى TEXT بدلاً من VARCHAR(255)
  scheduled_date DATE,
  days_until INTEGER,
  priority TEXT,
  urgency_level INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id AS alert_id,
    f.id AS farm_id,
    f.name AS farm_name,
    m.name::TEXT AS medicine_name,  -- تحويل صريح إلى TEXT
    ma.scheduled_date,
    (ma.scheduled_date - CURRENT_DATE) AS days_until,
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE THEN 'متأخر'
      WHEN ma.scheduled_date = CURRENT_DATE THEN 'اليوم'
      WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 'غداً'
      ELSE 'قادم'
    END AS priority,
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE THEN 1
      WHEN ma.scheduled_date = CURRENT_DATE THEN 2
      WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 3
      ELSE 4
    END AS urgency_level
  FROM public.medication_alerts ma
  INNER JOIN public.farms f ON ma.farm_id = f.id
  INNER JOIN public.medicines m ON ma.medicine_id = m.id
  WHERE f.user_id = p_user_id
    AND NOT ma.is_administered
    AND ma.scheduled_date >= CURRENT_DATE - 7
  ORDER BY urgency_level ASC, ma.scheduled_date ASC
  LIMIT p_limit;
END;
$$;

-- 3. إنشاء دالة get_active_alerts_for_farm الجديدة
CREATE OR REPLACE FUNCTION public.get_active_alerts_for_farm(
  p_farm_id uuid,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  alert_id uuid,
  medicine_id uuid,
  medicine_name TEXT,  -- تم تغييره إلى TEXT
  medicine_description TEXT,
  scheduled_day INTEGER,
  scheduled_date DATE,
  alert_date DATE,
  is_administered BOOLEAN,
  days_until_scheduled INTEGER,
  is_overdue BOOLEAN,
  priority TEXT,
  notes TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id AS alert_id,
    m.id AS medicine_id,
    m.name::TEXT AS medicine_name,  -- تحويل صريح إلى TEXT
    m.description AS medicine_description,
    ma.scheduled_day,
    ma.scheduled_date,
    ma.alert_date,
    ma.is_administered,
    (ma.scheduled_date - CURRENT_DATE) AS days_until_scheduled,
    (ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered) AS is_overdue,
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered THEN 'عاجل - متأخر'
      WHEN ma.scheduled_date = CURRENT_DATE AND NOT ma.is_administered THEN 'عاجل - اليوم'
      WHEN ma.scheduled_date = CURRENT_DATE + 1 AND NOT ma.is_administered THEN 'مهم - غداً'
      WHEN ma.scheduled_date <= CURRENT_DATE + p_days_ahead AND NOT ma.is_administered THEN 'عادي'
      ELSE 'غير عاجل'
    END AS priority,
    ma.notes
  FROM public.medication_alerts ma
  INNER JOIN public.medicines m ON ma.medicine_id = m.id
  WHERE ma.farm_id = p_farm_id
    AND NOT ma.is_administered
    AND ma.alert_date <= CURRENT_DATE + p_days_ahead
  ORDER BY 
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE THEN 1
      WHEN ma.scheduled_date = CURRENT_DATE THEN 2
      WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 3
      ELSE 4
    END,
    ma.scheduled_date ASC;
END;
$$;

-- 4. إضافة تعليقات
COMMENT ON FUNCTION public.get_upcoming_alerts IS 'دالة لجلب التنبيهات القادمة - محدثة مع أنواع البيانات الصحيحة';
COMMENT ON FUNCTION public.get_active_alerts_for_farm IS 'دالة لجلب التنبيهات النشطة للمزرعة - محدثة مع أنواع البيانات الصحيحة';

-- 5. التحقق من النجاح
SELECT 'تم إصلاح جميع الدوال بنجاح' AS status;
