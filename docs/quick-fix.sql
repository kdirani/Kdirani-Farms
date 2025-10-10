-- إصلاح سريع لمشكلة التنبيهات
-- انسخ والصق هذا الكود في Supabase SQL Editor

-- إصلاح دالة get_upcoming_alerts
CREATE OR REPLACE FUNCTION public.get_upcoming_alerts(
  p_user_id uuid,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  alert_id uuid,
  farm_id uuid,
  farm_name TEXT,
  medicine_name VARCHAR(255),
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
    m.name::VARCHAR(255) AS medicine_name,
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
