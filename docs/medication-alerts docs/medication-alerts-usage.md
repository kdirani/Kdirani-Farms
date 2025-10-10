# دليل استخدام نظام التنبيهات الدوائية

## نظرة عامة

تم تصميم نظام التنبيهات الدوائية لتذكير المزارعين بمواعيد إعطاء الأدوية واللقاحات للفراخ بناءً على عمرها.

## 1. تنفيذ استعلامات SQL في Supabase

### الخطوة 1: تنفيذ الاستعلامات
1. افتح لوحة تحكم Supabase الخاصة بك
2. اذهب إلى **SQL Editor**
3. انسخ محتوى الملف `medication-alerts-migration.sql`
4. قم بتشغيل الاستعلامات بالتسلسل

### الخطوة 2: التحقق من النجاح
بعد التنفيذ، تحقق من:
- إضافة عمود `chick_birth_date` إلى جدول `farms`
- إنشاء جدول `medication_alerts`
- إنشاء جميع الدوال والـ Triggers

```sql
-- للتحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('farms', 'medication_alerts');

-- للتحقق من الأعمدة
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farms' 
AND column_name = 'chick_birth_date';
```

## 2. سيناريوهات الاستخدام

### السيناريو 1: إنشاء مزرعة جديدة مع تاريخ ميلاد الفراخ

عند إنشاء مزرعة جديدة وإضافة `chick_birth_date`:

```sql
-- مثال: إنشاء مزرعة
INSERT INTO public.farms (name, location, user_id, chick_birth_date, is_active)
VALUES ('مزرعة الوادي', 'القديراني', 'user-uuid-here', '2025-10-01', TRUE);

-- سيتم إنشاء جميع التنبيهات تلقائياً بواسطة الـ Trigger
```

### السيناريو 2: تحديث تاريخ ميلاد الفراخ لمزرعة موجودة

```sql
-- تحديث تاريخ الميلاد
UPDATE public.farms 
SET chick_birth_date = '2025-10-01'
WHERE id = 'farm-uuid-here';

-- سيتم إعادة إنشاء جميع التنبيهات تلقائياً
```

### السيناريو 3: إنشاء تنبيهات يدوياً لمزرعة موجودة

```sql
-- استدعاء الدالة لإنشاء التنبيهات
SELECT public.create_medication_alerts_for_farm(
  'farm-uuid-here',      -- معرف المزرعة
  '2025-10-01'          -- تاريخ ميلاد الفراخ
);
```

### السيناريو 4: جلب التنبيهات النشطة لمزرعة معينة

```sql
-- جلب التنبيهات للأيام القادمة (7 أيام افتراضياً)
SELECT * FROM public.get_active_alerts_for_farm(
  'farm-uuid-here',  -- معرف المزرعة
  7                  -- عدد الأيام القادمة
);
```

### السيناريو 5: جلب التنبيهات القادمة للمزارع (للصفحة الرئيسية)

```sql
-- جلب أول 10 تنبيهات قادمة للمزارع
SELECT * FROM public.get_upcoming_alerts(
  'user-uuid-here',  -- معرف المستخدم
  10                 -- عدد التنبيهات المطلوبة
);
```

### السيناريو 6: تحديد تنبيه كـ "تم إعطاء الدواء"

```sql
-- تحديد التنبيه كمكتمل
SELECT public.mark_alert_as_administered(
  'alert-uuid-here',     -- معرف التنبيه
  'user-uuid-here',      -- معرف المستخدم الذي أعطى الدواء
  'تم إعطاء الدواء في الموعد المحدد'  -- ملاحظات (اختياري)
);
```

### السيناريو 7: إلغاء تحديد التنبيه (في حالة الخطأ)

```sql
-- إلغاء تحديد التنبيه
SELECT public.unmark_alert_as_administered('alert-uuid-here');
```

### السيناريو 8: عرض ملخص التنبيهات لجميع المزارع

```sql
-- عرض ملخص شامل
SELECT * FROM public.v_medication_alerts_summary
ORDER BY overdue_alerts DESC, today_alerts DESC;
```

## 3. أمثلة استعلامات مفيدة

### حساب عمر الفراخ الحالي

```sql
SELECT 
  id,
  name,
  chick_birth_date,
  public.calculate_chick_age_in_days(chick_birth_date, CURRENT_DATE) AS chick_age_days
FROM public.farms
WHERE chick_birth_date IS NOT NULL;
```

### جلب التنبيهات المتأخرة

```sql
SELECT 
  ma.id,
  f.name AS farm_name,
  m.name AS medicine_name,
  ma.scheduled_date,
  CURRENT_DATE - ma.scheduled_date AS days_overdue
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date < CURRENT_DATE
  AND NOT ma.is_administered
ORDER BY ma.scheduled_date ASC;
```

### جلب التنبيهات لليوم

```sql
SELECT 
  ma.id,
  f.name AS farm_name,
  m.name AS medicine_name,
  m.description,
  ma.scheduled_day
FROM public.medication_alerts ma
INNER JOIN public.farms f ON ma.farm_id = f.id
INNER JOIN public.medicines m ON ma.medicine_id = m.id
WHERE ma.scheduled_date = CURRENT_DATE
  AND NOT ma.is_administered
ORDER BY f.name, ma.scheduled_day;
```

### إحصائيات التنبيهات للمزرعة

```sql
SELECT 
  f.id,
  f.name,
  COUNT(ma.id) AS total_alerts,
  COUNT(CASE WHEN ma.is_administered THEN 1 END) AS completed,
  COUNT(CASE WHEN NOT ma.is_administered THEN 1 END) AS pending,
  COUNT(CASE WHEN ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered THEN 1 END) AS overdue
FROM public.farms f
LEFT JOIN public.medication_alerts ma ON f.id = ma.farm_id
WHERE f.id = 'farm-uuid-here'
GROUP BY f.id, f.name;
```

## 4. ملاحظات مهمة

### آلية عمل النظام

1. **إنشاء التنبيهات التلقائي**: عند إضافة أو تحديث `chick_birth_date` في جدول `farms`, يتم تشغيل Trigger تلقائياً لإنشاء جميع التنبيهات.

2. **حساب التواريخ**: 
   - `scheduled_date`: التاريخ الفعلي لإعطاء الدواء (chick_birth_date + scheduled_day)
   - `alert_date`: تاريخ ظهور التنبيه (يوم واحد قبل scheduled_date)

3. **الأولويات**:
   - **عاجل - متأخر**: التنبيهات التي مر موعدها
   - **عاجل - اليوم**: التنبيهات المجدولة لليوم
   - **مهم - غداً**: التنبيهات المجدولة لغد
   - **عادي**: التنبيهات القادمة خلال الأسبوع

4. **إعادة إنشاء التنبيهات**: عند تغيير `chick_birth_date`, يتم حذف جميع التنبيهات القديمة وإنشاء تنبيهات جديدة.

### التكامل مع الكود

في ملفات TypeScript/JavaScript، يمكن استخدام:

```typescript
// جلب التنبيهات النشطة
const { data: alerts } = await supabase
  .rpc('get_active_alerts_for_farm', {
    p_farm_id: farmId,
    p_days_ahead: 7
  });

// جلب التنبيهات القادمة للمستخدم
const { data: upcomingAlerts } = await supabase
  .rpc('get_upcoming_alerts', {
    p_user_id: userId,
    p_limit: 10
  });

// تحديد التنبيه كمكتمل
const { data: success } = await supabase
  .rpc('mark_alert_as_administered', {
    p_alert_id: alertId,
    p_user_id: userId,
    p_notes: 'ملاحظات...'
  });
```

## 5. تحديثات مطلوبة في الكود

### أ. في صفحة إدارة المزارع (`admin/farms/page.tsx`)

يجب إضافة:
- حقل `chick_birth_date` في نموذج إنشاء المزرعة
- حقل `chick_birth_date` في نموذج تحديث المزرعة
- عرض عمر الفراخ في جدول المزارع

### ب. في صفحة إعداد المزرعة (`admin/setup/page.tsx`)

يجب إضافة:
- حقل `chick_birth_date` في نموذج إعداد المزرعة الكاملة

### ج. في صفحة المزارع (`farmer/page.tsx`)

يجب إضافة:
- قسم للتنبيهات النشطة
- عرض التنبيهات المتأخرة بشكل بارز
- زر لتحديد التنبيه كمكتمل

### د. إنشاء مكونات جديدة

مكونات مقترحة:
1. `MedicationAlertsCard` - لعرض التنبيهات في الصفحة الرئيسية
2. `AlertsList` - لعرض قائمة التنبيهات
3. `AlertItem` - لعرض تنبيه واحد
4. `MarkAlertButton` - زر لتحديد التنبيه كمكتمل

## 6. RLS (Row Level Security) المقترحة

```sql
-- سياسات الأمان للتنبيهات

-- السماح للمزارعين برؤية تنبيهاتهم فقط
CREATE POLICY "Farmers can view their own alerts"
ON public.medication_alerts
FOR SELECT
USING (
  farm_id IN (
    SELECT id FROM public.farms WHERE user_id = auth.uid()
  )
);

-- السماح للمزارعين بتحديث تنبيهاتهم
CREATE POLICY "Farmers can update their own alerts"
ON public.medication_alerts
FOR UPDATE
USING (
  farm_id IN (
    SELECT id FROM public.farms WHERE user_id = auth.uid()
  )
);

-- السماح للمدراء برؤية جميع التنبيهات
CREATE POLICY "Admins can view all alerts"
ON public.medication_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'sub_admin')
  )
);

-- تفعيل RLS
ALTER TABLE public.medication_alerts ENABLE ROW LEVEL SECURITY;
```

## 7. الخطوات التالية

1. ✅ تنفيذ استعلامات SQL في Supabase
2. ⏳ تحديث نماذج إنشاء/تعديل المزارع لإضافة حقل `chick_birth_date`
3. ⏳ إنشاء مكونات عرض التنبيهات
4. ⏳ إضافة قسم التنبيهات في صفحة المزارع
5. ⏳ تطبيق سياسات RLS
6. ⏳ اختبار النظام بالكامل

---

**ملاحظة**: تأكد من تنفيذ الاستعلامات في بيئة تجريبية أولاً قبل تطبيقها على بيئة الإنتاج.
