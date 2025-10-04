-- ==========================================
-- تكامل الأدوية مع الفواتير - الإصلاح التدريجي
-- ==========================================

-- الخطوة 1: فحص البيانات الموجودة في invoice_items
SELECT 
  id,
  invoice_id,
  material_name_id,
  quantity,
  price_per_unit
FROM public.invoice_items
WHERE material_name_id IS NULL;

-- إذا كانت هناك صفوف بدون material_name_id، يجب حذفها أو تحديثها قبل المتابعة

-- ==========================================
-- الخطوة 2: إضافة الأعمدة الجديدة بدون قيود
-- ==========================================

-- إضافة medicine_id إلى invoice_items
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL;

-- إضافة medicine_id إلى materials
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL;

-- ==========================================
-- الخطوة 3: التحقق من البيانات قبل إضافة القيود
-- ==========================================

-- التحقق من invoice_items
SELECT 
  COUNT(*) as total_rows,
  COUNT(material_name_id) as has_material,
  COUNT(medicine_id) as has_medicine,
  SUM(CASE WHEN material_name_id IS NULL AND medicine_id IS NULL THEN 1 ELSE 0 END) as both_null,
  SUM(CASE WHEN material_name_id IS NOT NULL AND medicine_id IS NOT NULL THEN 1 ELSE 0 END) as both_not_null
FROM public.invoice_items;

-- التحقق من materials
SELECT 
  COUNT(*) as total_rows,
  COUNT(material_name_id) as has_material,
  COUNT(medicine_id) as has_medicine,
  SUM(CASE WHEN material_name_id IS NULL AND medicine_id IS NULL THEN 1 ELSE 0 END) as both_null,
  SUM(CASE WHEN material_name_id IS NOT NULL AND medicine_id IS NOT NULL THEN 1 ELSE 0 END) as both_not_null
FROM public.materials;

-- ==========================================
-- الخطوة 4: إضافة القيود (فقط إذا كانت البيانات صحيحة)
-- ==========================================

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

-- ==========================================
-- الخطوة 5: تحديث الفهارس الفريدة
-- ==========================================

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

-- ==========================================
-- الخطوة 6: التحقق النهائي
-- ==========================================

-- عرض هيكل الجدول المحدث
\d public.invoice_items;
\d public.materials;

-- عرض القيود
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname IN ('invoice_items', 'materials')
ORDER BY rel.relname, con.conname;
