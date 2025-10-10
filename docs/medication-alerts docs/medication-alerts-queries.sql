-- ==================================================================================
-- استعلامات مفيدة لنظام التنبيهات الدوائية
-- ==================================================================================
-- 
-- هذا الملف يحتوي على استعلامات جاهزة للاستخدام في التطبيق
-- 
-- ==================================================================================

-- ==================================================================================
-- 1. جلب التنبيهات النشطة لمزرعة معينة (للأيام الـ 7 القادمة)
-- ==================================================================================

-- استخدام الدالة المخصصة
SELECT * FROM public.get_active_alerts_for_farm(
  'farm-uuid-here',  -- استبدل بمعرف المزرعة
  7                  -- عدد الأيام القادمة
);

-- أو استعلام مباشر
SELECT 
  ma.id AS alert_id,
  m.id AS medicine_id,
  m.name AS medicine_name,
  m.description AS medicine_description,
  ma.scheduled_day,
  ma.scheduled_date,
  ma.is_administered,
  (ma.scheduled_date - CURRENT_DATE) AS days_until,
  CASE 
    WHEN ma.scheduled_date < CURRENT_DATE THEN 'متأخر'
    WHEN ma.scheduled_date = CURRENT_DATE THEN 'اليوم'
    WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 'غداً'
    ELSE 'قادم'
  END AS priority
FROM public.medication_alerts ma
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.farm_id = 'farm-uuid-here'
  AND NOT ma.is_administered
  AND ma.alert_date <= CURRENT_DATE + 7
ORDER BY ma.scheduled_date ASC;

-- ==================================================================================
-- 2. جلب التنبيهات القادمة للمزارع (للصفحة الرئيسية)
-- ==================================================================================

-- استخدام الدالة المخصصة
SELECT * FROM public.get_upcoming_alerts(
  'user-uuid-here',  -- استبدل بمعرف المستخدم
  10                 -- عدد التنبيهات المطلوبة
);

-- ==================================================================================
-- 3. جلب التنبيهات المتأخرة فقط
-- ==================================================================================

SELECT 
  ma.id,
  f.id AS farm_id,
  f.name AS farm_name,
  m.name AS medicine_name,
  ma.scheduled_date,
  CURRENT_DATE - ma.scheduled_date AS days_overdue
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date < CURRENT_DATE
  AND NOT ma.is_administered
  AND f.user_id = 'user-uuid-here'  -- للمزارع المحدد
ORDER BY ma.scheduled_date ASC;

-- ==================================================================================
-- 4. جلب التنبيهات المجدولة لليوم
-- ==================================================================================

SELECT 
  ma.id,
  f.id AS farm_id,
  f.name AS farm_name,
  m.name AS medicine_name,
  m.description,
  ma.scheduled_day,
  ma.notes
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date = CURRENT_DATE
  AND NOT ma.is_administered
  AND f.user_id = 'user-uuid-here'  -- للمزارع المحدد
ORDER BY f.name, ma.scheduled_day;

-- ==================================================================================
-- 5. جلب التنبيهات المجدولة لغد
-- ==================================================================================

SELECT 
  ma.id,
  f.id AS farm_id,
  f.name AS farm_name,
  m.name AS medicine_name,
  m.description,
  ma.scheduled_day
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date = CURRENT_DATE + 1
  AND NOT ma.is_administered
  AND f.user_id = 'user-uuid-here'  -- للمزارع المحدد
ORDER BY f.name, ma.scheduled_day;

-- ==================================================================================
-- 6. إحصائيات التنبيهات لمزرعة معينة
-- ==================================================================================

SELECT 
  COUNT(*) AS total_alerts,
  COUNT(CASE WHEN ma.is_administered THEN 1 END) AS completed_alerts,
  COUNT(CASE WHEN NOT ma.is_administered THEN 1 END) AS pending_alerts,
  COUNT(CASE WHEN ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered THEN 1 END) AS overdue_alerts,
  COUNT(CASE WHEN ma.scheduled_date = CURRENT_DATE AND NOT ma.is_administered THEN 1 END) AS today_alerts,
  COUNT(CASE WHEN ma.scheduled_date = CURRENT_DATE + 1 AND NOT ma.is_administered THEN 1 END) AS tomorrow_alerts
FROM public.medication_alerts ma
WHERE ma.farm_id = 'farm-uuid-here';

-- ==================================================================================
-- 7. جلب ملخص التنبيهات لجميع المزارع (للمدراء)
-- ==================================================================================

SELECT * FROM public.v_medication_alerts_summary
ORDER BY overdue_alerts DESC, today_alerts DESC, tomorrow_alerts DESC;

-- ==================================================================================
-- 8. جلب التنبيهات المكتملة لمزرعة معينة (السجل)
-- ==================================================================================

SELECT 
  ma.id,
  m.name AS medicine_name,
  ma.scheduled_day,
  ma.scheduled_date,
  ma.administered_at,
  p.fname AS administered_by_name,
  ma.notes
FROM public.medication_alerts ma
INNER JOIN public.medicines m ON ma.medicine_id = m.id
LEFT JOIN public.profiles p ON ma.administered_by = p.id
WHERE ma.farm_id = 'farm-uuid-here'
  AND ma.is_administered = TRUE
ORDER BY ma.administered_at DESC
LIMIT 50;

-- ==================================================================================
-- 9. حساب عمر الفراخ الحالي لجميع المزارع النشطة
-- ==================================================================================

SELECT 
  f.id,
  f.name AS farm_name,
  f.chick_birth_date,
  public.calculate_chick_age_in_days(f.chick_birth_date, CURRENT_DATE) AS chick_age_days,
  CASE 
    WHEN public.calculate_chick_age_in_days(f.chick_birth_date, CURRENT_DATE) <= 30 THEN 'صغير (0-30 يوم)'
    WHEN public.calculate_chick_age_in_days(f.chick_birth_date, CURRENT_DATE) <= 60 THEN 'متوسط (31-60 يوم)'
    WHEN public.calculate_chick_age_in_days(f.chick_birth_date, CURRENT_DATE) <= 120 THEN 'كبير (61-120 يوم)'
    ELSE 'بالغ (أكثر من 120 يوم)'
  END AS age_category
FROM public.farms f
WHERE f.chick_birth_date IS NOT NULL
  AND f.is_active = TRUE
ORDER BY chick_age_days ASC;

-- ==================================================================================
-- 10. جلب التنبيهات حسب نطاق تاريخي معين
-- ==================================================================================

SELECT 
  ma.id,
  f.name AS farm_name,
  m.name AS medicine_name,
  ma.scheduled_date,
  ma.is_administered
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date BETWEEN '2025-10-01' AND '2025-10-31'  -- استبدل بالتواريخ المطلوبة
  AND f.user_id = 'user-uuid-here'
ORDER BY ma.scheduled_date ASC;

-- ==================================================================================
-- 11. إحصائيات الالتزام بالجدول الدوائي لمزرعة
-- ==================================================================================

WITH stats AS (
  SELECT 
    COUNT(*) AS total_scheduled,
    COUNT(CASE WHEN is_administered THEN 1 END) AS administered_count,
    COUNT(CASE WHEN is_administered AND administered_at::date <= scheduled_date THEN 1 END) AS on_time_count,
    COUNT(CASE WHEN is_administered AND administered_at::date > scheduled_date THEN 1 END) AS late_count,
    COUNT(CASE WHEN NOT is_administered AND scheduled_date < CURRENT_DATE THEN 1 END) AS missed_count
  FROM public.medication_alerts
  WHERE farm_id = 'farm-uuid-here'
    AND scheduled_date <= CURRENT_DATE
)
SELECT 
  total_scheduled,
  administered_count,
  on_time_count,
  late_count,
  missed_count,
  ROUND((on_time_count::numeric / NULLIF(total_scheduled, 0)) * 100, 2) AS on_time_percentage,
  ROUND((administered_count::numeric / NULLIF(total_scheduled, 0)) * 100, 2) AS completion_percentage
FROM stats;

-- ==================================================================================
-- 12. جدول الأدوية القادمة للأسبوع (تقرير أسبوعي)
-- ==================================================================================

SELECT 
  TO_CHAR(ma.scheduled_date, 'Day DD/MM/YYYY') AS scheduled_day,
  f.name AS farm_name,
  m.name AS medicine_name,
  m.description,
  ma.scheduled_day AS chick_age_day,
  ma.is_administered
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
  AND f.user_id = 'user-uuid-here'
ORDER BY ma.scheduled_date ASC, f.name;

-- ==================================================================================
-- 13. التنبيهات حسب نوع الدواء
-- ==================================================================================

SELECT 
  m.name AS medicine_name,
  COUNT(*) AS total_alerts,
  COUNT(CASE WHEN ma.is_administered THEN 1 END) AS completed,
  COUNT(CASE WHEN NOT ma.is_administered AND ma.scheduled_date < CURRENT_DATE THEN 1 END) AS overdue
FROM public.medication_alerts ma
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.farm_id = 'farm-uuid-here'
GROUP BY m.id, m.name
ORDER BY total_alerts DESC;

-- ==================================================================================
-- 14. التنبيهات التي تم إضافتها حديثاً
-- ==================================================================================

SELECT 
  ma.id,
  f.name AS farm_name,
  m.name AS medicine_name,
  ma.scheduled_date,
  ma.created_at
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ma.created_at DESC;

-- ==================================================================================
-- 15. إعادة إنشاء التنبيهات لجميع المزارع (استخدام حذر!)
-- ==================================================================================

-- هذا الاستعلام يعيد إنشاء التنبيهات لجميع المزارع التي لديها تاريخ ميلاد
-- ⚠️ تحذير: استخدم هذا فقط إذا كنت متأكداً من حاجتك لإعادة إنشاء جميع التنبيهات

/*
SELECT 
  f.id,
  f.name,
  public.create_medication_alerts_for_farm(f.id, f.chick_birth_date) AS result
FROM public.farms f
WHERE f.chick_birth_date IS NOT NULL;
*/

-- ==================================================================================
-- 16. حذف التنبيهات المكتملة القديمة (تنظيف)
-- ==================================================================================

-- حذف التنبيهات المكتملة التي مر عليها أكثر من 6 أشهر
-- ⚠️ تحذير: استخدم بحذر وبعد أخذ نسخة احتياطية

/*
DELETE FROM public.medication_alerts
WHERE is_administered = TRUE
  AND administered_at < CURRENT_DATE - INTERVAL '6 months';
*/

-- ==================================================================================
-- نهاية ملف الاستعلامات المفيدة
-- ==================================================================================
