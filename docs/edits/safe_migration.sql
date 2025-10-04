-- ==========================================
-- سكريبت آمن لتكامل الأدوية مع الفواتير
-- نفذ كل قسم على حدة وتحقق من النتائج
-- ==========================================

-- ==========================================
-- القسم 1: إضافة الأعمدة فقط
-- ==========================================
BEGIN;

ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL;

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL;

COMMIT;

-- ==========================================
-- القسم 2: فحص البيانات
-- ==========================================

-- فحص invoice_items
SELECT 
  'invoice_items' as table_name,
  COUNT(*) as total_rows,
  COUNT(material_name_id) as has_material,
  COUNT(medicine_id) as has_medicine,
  SUM(CASE WHEN material_name_id IS NULL AND medicine_id IS NULL THEN 1 ELSE 0 END) as both_null,
  SUM(CASE WHEN material_name_id IS NOT NULL AND medicine_id IS NOT NULL THEN 1 ELSE 0 END) as both_not_null
FROM public.invoice_items

UNION ALL

-- فحص materials
SELECT 
  'materials' as table_name,
  COUNT(*) as total_rows,
  COUNT(material_name_id) as has_material,
  COUNT(medicine_id) as has_medicine,
  SUM(CASE WHEN material_name_id IS NULL AND medicine_id IS NULL THEN 1 ELSE 0 END) as both_null,
  SUM(CASE WHEN material_name_id IS NOT NULL AND medicine_id IS NOT NULL THEN 1 ELSE 0 END) as both_not_null
FROM public.materials;

-- ==========================================
-- القسم 3: إصلاح البيانات (إذا لزم الأمر)
-- ==========================================

-- إذا أظهر القسم 2 وجود صفوف both_null > 0، نفذ أحد الخيارات التالية:

-- الخيار أ: حذف الصفوف الفارغة (إذا كانت غير مهمة)
-- BEGIN;
-- DELETE FROM public.invoice_items WHERE material_name_id IS NULL AND medicine_id IS NULL;
-- COMMIT;

-- الخيار ب: تحديث الصفوف بقيمة افتراضية
-- BEGIN;
-- 
-- -- إنشاء مادة افتراضية
-- INSERT INTO public.materials_names (material_name)
-- VALUES ('غير محدد')
-- ON CONFLICT (material_name) DO NOTHING;
-- 
-- -- تحديث invoice_items
-- UPDATE public.invoice_items 
-- SET material_name_id = (
--   SELECT id FROM public.materials_names WHERE material_name = 'غير محدد' LIMIT 1
-- )
-- WHERE material_name_id IS NULL AND medicine_id IS NULL;
-- 
-- -- تحديث materials (إذا لزم الأمر)
-- UPDATE public.materials 
-- SET material_name_id = (
--   SELECT id FROM public.materials_names WHERE material_name = 'غير محدد' LIMIT 1
-- )
-- WHERE material_name_id IS NULL AND medicine_id IS NULL;
-- 
-- COMMIT;

-- ==========================================
-- القسم 4: إضافة القيود (بعد التأكد من نظافة البيانات)
-- ==========================================

BEGIN;

-- إزالة القيود القديمة إن وجدت
ALTER TABLE public.invoice_items 
DROP CONSTRAINT IF EXISTS check_material_or_medicine;

ALTER TABLE public.materials 
DROP CONSTRAINT IF EXISTS check_material_or_medicine_in_stock;

-- إضافة القيود الجديدة
ALTER TABLE public.invoice_items
ADD CONSTRAINT check_material_or_medicine 
CHECK (
  (material_name_id IS NOT NULL AND medicine_id IS NULL) OR 
  (material_name_id IS NULL AND medicine_id IS NOT NULL)
);

ALTER TABLE public.materials
ADD CONSTRAINT check_material_or_medicine_in_stock
CHECK (
  (material_name_id IS NOT NULL AND medicine_id IS NULL) OR 
  (material_name_id IS NULL AND medicine_id IS NOT NULL)
);

COMMIT;

-- ==========================================
-- القسم 5: تحديث الفهارس
-- ==========================================

BEGIN;

-- إزالة القيد الفريد القديم من materials
ALTER TABLE public.materials 
DROP CONSTRAINT IF EXISTS unique_warehouse_material;

-- إنشاء فهارس فريدة منفصلة
DROP INDEX IF EXISTS unique_warehouse_material_name;
CREATE UNIQUE INDEX unique_warehouse_material_name 
ON public.materials (warehouse_id, material_name_id) 
WHERE material_name_id IS NOT NULL;

DROP INDEX IF EXISTS unique_warehouse_medicine;
CREATE UNIQUE INDEX unique_warehouse_medicine 
ON public.materials (warehouse_id, medicine_id) 
WHERE medicine_id IS NOT NULL;

COMMIT;

-- ==========================================
-- القسم 6: التحقق النهائي
-- ==========================================

-- عرض القيود على invoice_items
SELECT 
  'invoice_items' as table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'invoice_items'
  AND con.contype = 'c'
ORDER BY con.conname;

-- عرض القيود على materials
SELECT 
  'materials' as table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'materials'
  AND con.contype = 'c'
ORDER BY con.conname;

-- عرض الفهارس
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('invoice_items', 'materials')
ORDER BY tablename, indexname;

-- ==========================================
-- اختبار: إضافة عنصر فاتورة اختباري
-- ==========================================

-- اختبار 1: إضافة عنصر بـ material_name_id فقط (يجب أن ينجح)
-- INSERT INTO public.invoice_items (
--   invoice_id,
--   material_name_id,
--   unit_id,
--   quantity,
--   price_per_unit,
--   total_price
-- ) VALUES (
--   'UUID-OF-EXISTING-INVOICE',
--   'UUID-OF-EXISTING-MATERIAL',
--   'UUID-OF-EXISTING-UNIT',
--   1,
--   100,
--   100
-- );

-- اختبار 2: إضافة عنصر بـ medicine_id فقط (يجب أن ينجح)
-- INSERT INTO public.invoice_items (
--   invoice_id,
--   medicine_id,
--   unit_id,
--   quantity,
--   price_per_unit,
--   total_price
-- ) VALUES (
--   'UUID-OF-EXISTING-INVOICE',
--   'UUID-OF-EXISTING-MEDICINE',
--   'UUID-OF-EXISTING-UNIT',
--   1,
--   100,
--   100
-- );

-- اختبار 3: إضافة عنصر بدون material_name_id ولا medicine_id (يجب أن يفشل)
-- INSERT INTO public.invoice_items (
--   invoice_id,
--   unit_id,
--   quantity,
--   price_per_unit,
--   total_price
-- ) VALUES (
--   'UUID-OF-EXISTING-INVOICE',
--   'UUID-OF-EXISTING-UNIT',
--   1,
--   100,
--   100
-- );

-- اختبار 4: إضافة عنصر بكل من material_name_id و medicine_id (يجب أن يفشل)
-- INSERT INTO public.invoice_items (
--   invoice_id,
--   material_name_id,
--   medicine_id,
--   unit_id,
--   quantity,
--   price_per_unit,
--   total_price
-- ) VALUES (
--   'UUID-OF-EXISTING-INVOICE',
--   'UUID-OF-EXISTING-MATERIAL',
--   'UUID-OF-EXISTING-MEDICINE',
--   'UUID-OF-EXISTING-UNIT',
--   1,
--   100,
--   100
-- );
