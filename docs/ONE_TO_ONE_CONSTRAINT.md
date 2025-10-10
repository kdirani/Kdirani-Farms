# التحقق من علاقة 1:1 بين المزرعة والقطيع

## ✅ الوضع الحالي

### في قاعدة البيانات الأصلية

```sql
CREATE TABLE public.poultry_status (
  id uuid PRIMARY KEY,
  farm_id uuid UNIQUE REFERENCES public.farms(id) ON DELETE CASCADE,
  -- ↑ UNIQUE يضمن أن كل مزرعة لها قطيع واحد فقط
  ...
);
```

**✅ هذا صحيح ومحترم في النظام الأصلي!**

---

## 🔍 التحقق من نظام التنبيهات

### في جدول `medication_alerts`

```sql
CREATE TABLE public.medication_alerts (
  id uuid PRIMARY KEY,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  poultry_status_id uuid NOT NULL REFERENCES public.poultry_status(id),
  medicine_id uuid NOT NULL,
  scheduled_day INTEGER NOT NULL,
  ...
  
  -- UNIQUE constraint على مستوى القطيع
  CONSTRAINT unique_poultry_medicine_day 
    UNIQUE (poultry_status_id, medicine_id, scheduled_day)
);
```

### ✅ النقاط الإيجابية

1. **UNIQUE constraint** يضمن عدم تكرار التنبيه لنفس الدواء في نفس اليوم لنفس القطيع
2. **poultry_status_id** هو المفتاح الأساسي للربط
3. **farm_id** موجود للأداء (تجنب JOIN)

### ⚠️ ملاحظة مهمة

حالياً، جدول `medication_alerts` يحتوي على كل من:
- `farm_id`
- `poultry_status_id`

**السؤال**: هل farm_id يطابق دائماً farm_id الموجود في poultry_status؟

---

## 🔧 الحلول المقترحة

### الخيار 1: إضافة CHECK Constraint (موصى به) ⭐

```sql
-- إضافة constraint للتأكد من التطابق
ALTER TABLE public.medication_alerts
ADD CONSTRAINT check_farm_poultry_consistency
CHECK (
  farm_id = (
    SELECT farm_id 
    FROM public.poultry_status 
    WHERE id = poultry_status_id
  )
);
```

**المشكلة**: CHECK constraint مع subquery لا يعمل في PostgreSQL مباشرة!

### الخيار 2: استخدام Trigger (الأفضل) ⭐⭐⭐

```sql
-- دالة للتحقق من التطابق
CREATE OR REPLACE FUNCTION check_farm_poultry_consistency()
RETURNS TRIGGER AS $$
DECLARE
  expected_farm_id uuid;
BEGIN
  -- جلب farm_id من القطيع
  SELECT farm_id INTO expected_farm_id
  FROM public.poultry_status
  WHERE id = NEW.poultry_status_id;
  
  -- التحقق من التطابق
  IF NEW.farm_id != expected_farm_id THEN
    RAISE EXCEPTION 'farm_id لا يطابق farm_id الموجود في poultry_status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
CREATE TRIGGER trg_check_farm_poultry_consistency
BEFORE INSERT OR UPDATE ON public.medication_alerts
FOR EACH ROW
EXECUTE FUNCTION check_farm_poultry_consistency();
```

### الخيار 3: حذف farm_id (الأبسط) ⭐⭐

```sql
-- حذف عمود farm_id
ALTER TABLE public.medication_alerts
DROP COLUMN farm_id;

-- تعديل الدوال لجلب farm_id من poultry_status عند الحاجة
-- مثال:
SELECT 
  ma.*,
  ps.farm_id
FROM medication_alerts ma
INNER JOIN poultry_status ps ON ma.poultry_status_id = ps.id;
```

**المزايا**:
- ✅ لا توجد redundancy
- ✅ مستحيل حدوث تضارب
- ✅ أبسط في الصيانة

**العيوب**:
- ❌ أداء أقل قليلاً (JOIN إضافي)
- ❌ تعديل في الدوال الموجودة

### الخيار 4: إضافة farm_id تلقائياً (توازن) ⭐⭐⭐⭐

```sql
-- دالة لملء farm_id تلقائياً
CREATE OR REPLACE FUNCTION auto_set_farm_id()
RETURNS TRIGGER AS $$
BEGIN
  -- جلب farm_id من القطيع تلقائياً
  SELECT farm_id INTO NEW.farm_id
  FROM public.poultry_status
  WHERE id = NEW.poultry_status_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
CREATE TRIGGER trg_auto_set_farm_id
BEFORE INSERT OR UPDATE ON public.medication_alerts
FOR EACH ROW
EXECUTE FUNCTION auto_set_farm_id();
```

**المزايا**:
- ✅ farm_id يُملأ تلقائياً
- ✅ مستحيل حدوث خطأ
- ✅ أداء جيد (farm_id موجود)
- ✅ لا حاجة لتعديل الدوال

---

## 📝 التوصية النهائية

### الحل الموصى به: **الخيار 4** ⭐⭐⭐⭐

نضيف Trigger يملأ `farm_id` تلقائياً من `poultry_status`:

```sql
-- ==================================================================================
-- Trigger لملء farm_id تلقائياً من poultry_status
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.auto_set_farm_id_from_poultry()
RETURNS TRIGGER AS $$
BEGIN
  -- ملء farm_id تلقائياً من القطيع
  SELECT farm_id INTO NEW.farm_id
  FROM public.poultry_status
  WHERE id = NEW.poultry_status_id;
  
  -- التحقق من وجود القطيع
  IF NEW.farm_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على المزرعة للقطيع المحدد';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_set_farm_id_from_poultry IS 
  'دالة Trigger لملء farm_id تلقائياً من poultry_status لضمان التطابق';

-- إنشاء Trigger
DROP TRIGGER IF EXISTS trg_auto_set_farm_id ON public.medication_alerts;

CREATE TRIGGER trg_auto_set_farm_id
BEFORE INSERT OR UPDATE ON public.medication_alerts
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_farm_id_from_poultry();
```

### كيفية استخدامه؟

بعد هذا التعديل، عند إدراج تنبيه جديد:

```sql
-- قبل: كنت تحتاج تحديد farm_id يدوياً
INSERT INTO medication_alerts (farm_id, poultry_status_id, ...)
VALUES ('farm-uuid', 'poultry-uuid', ...);

-- بعد: farm_id يُملأ تلقائياً
INSERT INTO medication_alerts (poultry_status_id, medicine_id, ...)
VALUES ('poultry-uuid', 'medicine-uuid', ...);
-- farm_id سيُملأ تلقائياً من poultry_status!
```

---

## ✅ التحقق من التطابق

### اختبار بسيط

```sql
-- التحقق من أن جميع التنبيهات متطابقة
SELECT 
  ma.id,
  ma.farm_id AS alert_farm_id,
  ps.farm_id AS poultry_farm_id,
  CASE 
    WHEN ma.farm_id = ps.farm_id THEN '✅ متطابق'
    ELSE '❌ غير متطابق'
  END AS status
FROM medication_alerts ma
INNER JOIN poultry_status ps ON ma.poultry_status_id = ps.id
WHERE ma.farm_id != ps.farm_id;  -- يجب أن يعيد 0 صفوف
```

---

## 📊 الخلاصة

| الجانب | الوضع الحالي | مع Trigger |
|--------|--------------|------------|
| علاقة 1:1 محترمة؟ | ✅ نعم (في poultry_status) | ✅ نعم |
| التطابق مضمون؟ | ⚠️ يدوي | ✅ تلقائي |
| الأداء | ✅ جيد | ✅ جيد |
| سهولة الصيانة | ⚠️ متوسط | ✅ ممتاز |
| منع الأخطاء | ⚠️ ممكن | ✅ مستحيل |

---

## 🚀 تطبيق التحسين

إذا أردت تطبيق التحسين، أضف الكود أعلاه إلى ملف `medication-alerts-migration.sql` بعد إنشاء جدول `medication_alerts`.

**ملاحظة**: يمكن تشغيل هذا Trigger على البيانات الموجودة:

```sql
-- تحديث farm_id للتنبيهات الموجودة (إن وجدت)
UPDATE medication_alerts ma
SET farm_id = ps.farm_id
FROM poultry_status ps
WHERE ma.poultry_status_id = ps.id;
```

---

**الإجابة المختصرة**: 
✅ نعم، النظام يحترم أن كل مزرعة لها قطيع واحد (بفضل UNIQUE constraint على poultry_status.farm_id)
⚠️ لكن يُنصح بإضافة Trigger لضمان تطابق farm_id في medication_alerts تلقائياً
