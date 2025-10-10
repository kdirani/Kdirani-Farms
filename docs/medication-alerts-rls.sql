-- ==================================================================================
-- سياسات الأمان (Row Level Security) لجدول التنبيهات الدوائية
-- ==================================================================================
-- 
-- هذا الملف يحتوي على سياسات RLS لضمان أن:
-- 1. المزارعون يمكنهم فقط رؤية وتعديل تنبيهاتهم الخاصة
-- 2. المدراء يمكنهم رؤية وإدارة جميع التنبيهات
-- 3. حماية البيانات من الوصول غير المصرح به
-- 
-- ==================================================================================

-- ==================================================================================
-- 1. تفعيل RLS على جدول medication_alerts
-- ==================================================================================

ALTER TABLE public.medication_alerts ENABLE ROW LEVEL SECURITY;

-- ==================================================================================
-- 2. سياسة SELECT للمزارعين - يمكنهم رؤية تنبيهات مزارعهم فقط
-- ==================================================================================

CREATE POLICY "Farmers can view their own medication alerts"
ON public.medication_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.farms f
    WHERE f.id = medication_alerts.farm_id
      AND f.user_id = auth.uid()
  )
);

-- ==================================================================================
-- 3. سياسة SELECT للمدراء - يمكنهم رؤية جميع التنبيهات
-- ==================================================================================

CREATE POLICY "Admins and SubAdmins can view all medication alerts"
ON public.medication_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_role IN ('admin', 'sub_admin')
  )
);

-- ==================================================================================
-- 4. سياسة UPDATE للمزارعين - يمكنهم تحديث تنبيهاتهم فقط
-- ==================================================================================

CREATE POLICY "Farmers can update their own medication alerts"
ON public.medication_alerts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.farms f
    WHERE f.id = medication_alerts.farm_id
      AND f.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.farms f
    WHERE f.id = medication_alerts.farm_id
      AND f.user_id = auth.uid()
  )
);

-- ==================================================================================
-- 5. سياسة UPDATE للمدراء - يمكنهم تحديث جميع التنبيهات
-- ==================================================================================

CREATE POLICY "Admins can update all medication alerts"
ON public.medication_alerts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_role = 'admin'
  )
);

-- ==================================================================================
-- 6. سياسة INSERT للنظام - فقط من خلال الدوال المعتمدة
-- ==================================================================================

-- المدراء فقط يمكنهم إدراج تنبيهات جديدة مباشرة
CREATE POLICY "Admins can insert medication alerts"
ON public.medication_alerts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_role = 'admin'
  )
);

-- ==================================================================================
-- 7. سياسة DELETE للمدراء - يمكنهم حذف التنبيهات
-- ==================================================================================

CREATE POLICY "Admins can delete medication alerts"
ON public.medication_alerts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_role = 'admin'
  )
);

-- ==================================================================================
-- ملاحظات مهمة:
-- ==================================================================================
-- 
-- 1. التنبيهات يتم إنشاؤها تلقائياً بواسطة Trigger عند إضافة/تحديث تاريخ ميلاد الفراخ
--    لذلك نحتاج إلى منح الدالة صلاحيات SECURITY DEFINER (تم ذلك مسبقاً)
-- 
-- 2. المزارعون يمكنهم:
--    - رؤية تنبيهاتهم فقط
--    - تحديث حالة التنبيهات (تم إعطاء الدواء / لم يتم)
--    - لا يمكنهم حذف أو إضافة تنبيهات مباشرة
-- 
-- 3. المدراء يمكنهم:
--    - رؤية جميع التنبيهات
--    - تحديث أي تنبيه
--    - حذف التنبيهات إذا لزم الأمر
--    - إضافة تنبيهات جديدة (في حالات خاصة)
-- 
-- 4. Sub-Admins:
--    - يمكنهم رؤية جميع التنبيهات
--    - لا يمكنهم التعديل أو الحذف (للحفاظ على سلامة البيانات)
-- 
-- ==================================================================================

-- اختبار السياسات (اختياري - للتأكد من أن السياسات تعمل بشكل صحيح)
-- يمكنك تشغيل هذه الاستعلامات بعد تطبيق السياسات

/*
-- كمزارع، جلب تنبيهاتي فقط
SELECT * FROM public.medication_alerts;  -- يجب أن يعرض فقط تنبيهات المزرعة الخاصة بالمزارع

-- كمدير، جلب جميع التنبيهات
SELECT * FROM public.medication_alerts;  -- يجب أن يعرض جميع التنبيهات

-- كمزارع، محاولة تحديث تنبيه خاص بي
UPDATE public.medication_alerts 
SET is_administered = true 
WHERE id = 'my-alert-id';  -- يجب أن ينجح

-- كمزارع، محاولة تحديث تنبيه لمزارع آخر
UPDATE public.medication_alerts 
SET is_administered = true 
WHERE id = 'other-farmer-alert-id';  -- يجب أن يفشل

-- كمزارع، محاولة حذف تنبيه
DELETE FROM public.medication_alerts WHERE id = 'my-alert-id';  -- يجب أن يفشل

-- كمدير، محاولة حذف تنبيه
DELETE FROM public.medication_alerts WHERE id = 'any-alert-id';  -- يجب أن ينجح
*/
