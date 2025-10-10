-- استعلامات تشخيص لمشكلة التنبيهات
-- استخدم هذه الاستعلامات للتحقق من حالة النظام

-- 1. التحقق من وجود جدول medication_alerts
SELECT 'medication_alerts table exists' AS check_name, 
       COUNT(*) AS row_count 
FROM public.medication_alerts;

-- 2. التحقق من وجود جدول medicines
SELECT 'medicines table exists' AS check_name,
       COUNT(*) AS row_count
FROM public.medicines;

-- 3. التحقق من وجود جدول farms
SELECT 'farms table exists' AS check_name,
       COUNT(*) AS row_count
FROM public.farms;

-- 4. التحقق من وجود poultry_status مع chick_birth_date
SELECT 'poultry with birth dates' AS check_name,
       COUNT(*) AS row_count
FROM public.poultry_status
WHERE chick_birth_date IS NOT NULL;

-- 5. التحقق من التنبيهات الموجودة
SELECT 'existing alerts' AS check_name,
       COUNT(*) AS row_count
FROM public.medication_alerts;

-- 6. عرض عينة من التنبيهات
SELECT 
    ma.id,
    f.name AS farm_name,
    m.name AS medicine_name,
    ma.scheduled_date,
    ma.is_administered
FROM public.medication_alerts ma
JOIN public.farms f ON ma.farm_id = f.id
JOIN public.medicines m ON ma.medicine_id = m.id
LIMIT 5;

-- 7. التحقق من وجود farms مع user_id
SELECT 'farms with users' AS check_name,
       COUNT(*) AS row_count
FROM public.farms
WHERE user_id IS NOT NULL;

-- 8. عرض عينة من المزارع
SELECT 
    id,
    name,
    user_id,
    is_active
FROM public.farms
LIMIT 5;
