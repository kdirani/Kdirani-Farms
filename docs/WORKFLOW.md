# سير العمل - نظام التنبيهات الدوائية 🔄

## 📖 نظرة عامة

هذا المستند يشرح **كيف يعمل النظام** من البداية إلى النهاية، خطوة بخطوة.

---

## 🎬 المراحل الأساسية

```
1. إنشاء المزرعة والقطيع
         ↓
2. إضافة تاريخ ميلاد الفراخ
         ↓
3. إنشاء التنبيهات تلقائياً (Trigger)
         ↓
4. عرض التنبيهات للمزارع
         ↓
5. تنفيذ التنبيه (إعطاء الدواء)
         ↓
6. تتبع الحالة والإحصائيات
```

---

## 📋 المرحلة 1: إنشاء المزرعة والقطيع

### السيناريو
المدير يريد إنشاء مزرعة جديدة لمزارع.

### الخطوات

#### أ. إنشاء المستخدم (المزارع)
```sql
-- في Supabase Auth
INSERT INTO auth.users (email, ...)
VALUES ('farmer@example.com', ...);

-- تلقائياً يتم إنشاء profile
INSERT INTO public.profiles (id, fname, user_role)
VALUES (user_id, 'أحمد المزارع', 'farmer');
```

#### ب. إنشاء المزرعة
```sql
INSERT INTO public.farms (user_id, name, location, is_active)
VALUES (
  'user-uuid',
  'مزرعة الوادي',
  'القديراني',
  TRUE
)
RETURNING id; -- farm_id
```

#### ج. إنشاء المستودع
```sql
INSERT INTO public.warehouses (farm_id, name)
VALUES ('farm-uuid', 'المستودع الرئيسي')
RETURNING id; -- warehouse_id
```

#### د. إنشاء القطيع
```sql
INSERT INTO public.poultry_status (
  farm_id,
  batch_name,
  opening_chicks,
  remaining_chicks
)
VALUES (
  'farm-uuid',
  'قطيع 2025-01',
  5000,  -- عدد الفراخ الابتدائي
  5000   -- المتبقي = الابتدائي في البداية
)
RETURNING id; -- poultry_status_id
```

### ✅ النتيجة
- ✓ مستخدم جديد (مزارع)
- ✓ مزرعة جديدة
- ✓ مستودع
- ✓ قطيع

**❗ مهم**: في هذه المرحلة، **لا توجد تنبيهات بعد** لأننا لم نضف تاريخ ميلاد الفراخ!

---

## 📅 المرحلة 2: إضافة تاريخ ميلاد الفراخ

### السيناريو
المزارع استلم الفراخ اليوم (2025-10-10) ويريد إضافة تاريخ الميلاد.

### الخطوات

#### الطريقة الأولى: عند الإنشاء
```typescript
// في complete-farm-setup-form.tsx
const formData = {
  // ...
  poultry: {
    batch_name: 'قطيع 2025-01',
    opening_chicks: 5000,
    chick_birth_date: '2025-10-10', // ← هنا!
  }
};
```

#### الطريقة الثانية: التحديث لاحقاً
```sql
UPDATE public.poultry_status
SET chick_birth_date = '2025-10-10'
WHERE id = 'poultry-uuid';
```

### 🔥 ماذا يحدث الآن؟

عند حفظ `chick_birth_date`، يتم تشغيل **Trigger تلقائياً**:

```sql
-- Trigger: trg_auto_create_medication_alerts
-- على جدول: poultry_status
-- عند: INSERT أو UPDATE للحقل chick_birth_date

BEGIN
  -- استدعاء دالة إنشاء التنبيهات
  PERFORM create_medication_alerts_for_poultry(
    NEW.id,                    -- معرف القطيع
    NEW.chick_birth_date       -- تاريخ الميلاد
  );
END;
```

---

## ⚡ المرحلة 3: إنشاء التنبيهات تلقائياً

### كيف تعمل دالة `create_medication_alerts_for_poultry()`؟

#### الخطوة 1: جلب جميع الأدوية
```sql
SELECT id, name, day_of_age
FROM public.medicines
WHERE day_of_age IS NOT NULL;

-- النتيجة:
-- id   | name                    | day_of_age
-- -----+-------------------------+------------
-- uuid | مضاد حيوي               | 1+2+3
-- uuid | برايمر (قطرة)          | 4
-- uuid | كلون + زيتى            | 6
-- uuid | جامبورو                 | 10
-- uuid | برونشيت                | 14
-- ...
```

#### الخطوة 2: تحليل أيام كل دواء

**مثال 1**: دواء "مضاد حيوي" - أيام: `"1+2+3"`

```sql
-- دالة parse_medicine_days('1+2+3')
-- تُرجع: [1, 2, 3]

-- يتم إنشاء 3 تنبيهات:
-- تنبيه 1: اليوم 1
-- تنبيه 2: اليوم 2
-- تنبيه 3: اليوم 3
```

**مثال 2**: دواء "برايمر" - أيام: `"4"`

```sql
-- دالة parse_medicine_days('4')
-- تُرجع: [4]

-- يتم إنشاء تنبيه واحد:
-- تنبيه 1: اليوم 4
```

#### الخطوة 3: حساب التواريخ

لكل يوم من أيام الدواء:

```sql
-- تاريخ الميلاد: 2025-10-10
-- اليوم المجدول: 1

scheduled_date = chick_birth_date + scheduled_day
scheduled_date = 2025-10-10 + 1
scheduled_date = 2025-10-11

-- تاريخ التنبيه (قبل يوم واحد):
alert_date = scheduled_date - 1
alert_date = 2025-10-11 - 1
alert_date = 2025-10-10

-- إلا إذا كان scheduled_day <= 1:
IF scheduled_day <= 1 THEN
  alert_date = scheduled_date  -- نفس اليوم
END IF
```

#### الخطوة 4: إدراج التنبيه

```sql
INSERT INTO public.medication_alerts (
  farm_id,              -- معرف المزرعة
  poultry_status_id,    -- معرف القطيع
  medicine_id,          -- معرف الدواء
  scheduled_day,        -- اليوم (1, 2, 3, ...)
  scheduled_date,       -- التاريخ المحسوب
  alert_date,           -- تاريخ التنبيه
  is_administered,      -- FALSE (لم يتم بعد)
  created_at            -- الآن
)
VALUES (
  'farm-uuid',
  'poultry-uuid',
  'medicine-uuid',
  1,                    -- اليوم الأول
  '2025-10-11',         -- الغد
  '2025-10-10',         -- اليوم
  FALSE,
  NOW()
);
```

### 📊 مثال كامل

**معطيات**:
- تاريخ الميلاد: `2025-10-10`
- دواء: "مضاد حيوي" - أيام: `"1+2+3"`

**النتيجة**: 3 تنبيهات

| scheduled_day | scheduled_date | alert_date | is_administered |
|---------------|----------------|------------|-----------------|
| 1 | 2025-10-11 | 2025-10-10 | FALSE |
| 2 | 2025-10-12 | 2025-10-11 | FALSE |
| 3 | 2025-10-13 | 2025-10-12 | FALSE |

### ✅ النتيجة النهائية

بعد تشغيل الدالة، يتم إنشاء **جميع التنبيهات** لجميع الأدوية:

```sql
SELECT COUNT(*) FROM medication_alerts
WHERE poultry_status_id = 'poultry-uuid';

-- النتيجة: 40-50 تنبيه (حسب عدد الأدوية وأيامها)
```

---

## 👀 المرحلة 4: عرض التنبيهات للمزارع

### السيناريو
المزارع يدخل إلى لوحة التحكم ويريد رؤية التنبيهات.

### أ. في الصفحة الرئيسية (`farmer/page.tsx`)

```typescript
// جلب التنبيهات القادمة (آخر 10)
const alertsResult = await getUpcomingAlertsForUser(
  session.user.id,  // معرف المزارع
  10                // عدد التنبيهات
);

const alerts = alertsResult.data; // المصفوفة
```

### ب. كيف تعمل دالة `get_upcoming_alerts()`؟

```sql
SELECT 
  ma.id AS alert_id,
  f.name AS farm_name,
  m.name AS medicine_name,
  ma.scheduled_date,
  (ma.scheduled_date - CURRENT_DATE) AS days_until,
  
  -- حساب الأولوية
  CASE 
    WHEN ma.scheduled_date < CURRENT_DATE THEN 'متأخر'
    WHEN ma.scheduled_date = CURRENT_DATE THEN 'اليوم'
    WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 'غداً'
    ELSE 'قادم'
  END AS priority,
  
  -- مستوى الاستعجال (للترتيب)
  CASE 
    WHEN ma.scheduled_date < CURRENT_DATE THEN 1      -- الأهم
    WHEN ma.scheduled_date = CURRENT_DATE THEN 2
    WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 3
    ELSE 4
  END AS urgency_level

FROM medication_alerts ma
INNER JOIN farms f ON ma.farm_id = f.id
INNER JOIN medicines m ON ma.medicine_id = m.id

WHERE f.user_id = 'user-uuid'           -- فقط مزارع هذا المزارع
  AND NOT ma.is_administered            -- فقط غير المنفذة
  AND ma.scheduled_date >= CURRENT_DATE - 7  -- آخر 7 أيام (للمتأخرة)

ORDER BY urgency_level ASC, ma.scheduled_date ASC
LIMIT 10;
```

### ج. مثال النتيجة

**اليوم**: 2025-10-12

| medicine_name | scheduled_date | priority | days_until |
|---------------|----------------|----------|------------|
| برايمر | 2025-10-10 | متأخر | -2 |
| كلون | 2025-10-11 | متأخر | -1 |
| مضاد حيوي | 2025-10-12 | اليوم | 0 |
| فيتامينات | 2025-10-13 | غداً | 1 |
| جامبورو | 2025-10-15 | قادم | 3 |

### د. العرض في الواجهة

```tsx
{alerts.map((alert) => (
  <div className={`alert ${
    alert.priority === 'متأخر' ? 'bg-red-50 border-red-500' :
    alert.priority === 'اليوم' ? 'bg-orange-50 border-orange-500' :
    alert.priority === 'غداً' ? 'bg-yellow-50 border-yellow-500' :
    'bg-blue-50 border-blue-500'
  }`}>
    {/* الأولوية */}
    <Badge variant={
      alert.priority === 'متأخر' ? 'destructive' :
      alert.priority === 'اليوم' ? 'warning' : 'default'
    }>
      {alert.priority}
    </Badge>
    
    {/* اسم الدواء */}
    <h4>💊 {alert.medicine_name}</h4>
    
    {/* التاريخ */}
    <p>📅 {alert.scheduled_date}</p>
    
    {/* زر الإجراء */}
    <Button onClick={() => markAsAdministered(alert.alert_id)}>
      تم الإعطاء ✓
    </Button>
  </div>
))}
```

---

## ✅ المرحلة 5: تنفيذ التنبيه (إعطاء الدواء)

### السيناريو
المزارع أعطى الدواء ويريد تحديد التنبيه كـ "تم".

### أ. في الواجهة

```tsx
import { markAlertAsAdministered } from '@/actions/medication-alerts.actions';

const handleMarkComplete = async (alertId: string) => {
  const result = await markAlertAsAdministered(
    alertId,
    'تم إعطاء الدواء في الموعد المحدد' // ملاحظات اختيارية
  );
  
  if (result.success) {
    toast.success('تم تحديث حالة التنبيه');
    // إعادة تحميل التنبيهات
  }
};
```

### ب. في Server Action

```typescript
// actions/medication-alerts.actions.ts
export async function markAlertAsAdministered(
  alertId: string,
  notes?: string
) {
  const supabase = await createClient();
  
  // استدعاء الدالة في قاعدة البيانات
  const { data, error } = await supabase.rpc(
    'mark_alert_as_administered',
    {
      p_alert_id: alertId,
      p_notes: notes || null
    }
  );
  
  if (data) {
    revalidatePath('/farmer'); // تحديث الصفحة
    return { success: true };
  }
  
  return { success: false, error: 'فشل التحديث' };
}
```

### ج. في قاعدة البيانات

```sql
-- دالة: mark_alert_as_administered()

UPDATE medication_alerts
SET 
  is_administered = TRUE,           -- تم الإعطاء
  administered_at = NOW(),          -- توقيت الإعطاء
  notes = COALESCE(p_notes, notes), -- الملاحظات (إن وجدت)
  updated_at = NOW()                -- آخر تحديث
WHERE id = p_alert_id
  AND NOT is_administered;          -- فقط إذا لم يتم تحديثه مسبقاً

-- إرجاع: TRUE إذا نجح، FALSE إذا فشل
RETURN ROW_COUNT > 0;
```

### ✅ النتيجة

**قبل**:
```sql
id: uuid-123
medicine_id: med-uuid
scheduled_date: 2025-10-12
is_administered: FALSE
administered_at: NULL
notes: NULL
```

**بعد**:
```sql
id: uuid-123
medicine_id: med-uuid
scheduled_date: 2025-10-12
is_administered: TRUE         ← تغير
administered_at: 2025-10-12 14:30:00  ← تغير
notes: 'تم إعطاء الدواء...'  ← تغير
updated_at: 2025-10-12 14:30:00  ← تغير
```

---

## 📊 المرحلة 6: تتبع الحالة والإحصائيات

### أ. إحصائيات المزرعة

```typescript
const stats = await getFarmAlertStats('farm-uuid');

// النتيجة:
{
  total: 45,        // إجمالي التنبيهات
  completed: 12,    // المكتملة
  pending: 33,      // المعلقة
  overdue: 3,       // المتأخرة
  today: 2,         // اليوم
  tomorrow: 1       // غداً
}
```

### ب. ملخص جميع المزارع (للمدراء)

```sql
SELECT * FROM v_medication_alerts_summary;
```

| farm_name | current_chick_age | total_alerts | completed | overdue | today |
|-----------|-------------------|--------------|-----------|---------|-------|
| مزرعة الوادي | 15 يوم | 45 | 12 | 3 | 2 |
| مزرعة النور | 30 يوم | 48 | 25 | 0 | 1 |

### ج. التنبيهات النشطة بالتفصيل

```typescript
const alerts = await getActiveAlertsForFarm('farm-uuid', 7);

// النتيجة:
[
  {
    medicine_name: 'مضاد حيوي',
    scheduled_day: 1,
    scheduled_date: '2025-10-11',
    days_until_scheduled: -1,
    is_overdue: true,
    priority: 'عاجل - متأخر'
  },
  {
    medicine_name: 'فيتامينات',
    scheduled_day: 2,
    scheduled_date: '2025-10-12',
    days_until_scheduled: 0,
    is_overdue: false,
    priority: 'عاجل - اليوم'
  },
  // ...
]
```

---

## 🔄 السيناريوهات الخاصة

### 🔄 السيناريو 1: تغيير تاريخ الميلاد

**الحالة**: المزارع أدخل تاريخ خاطئ ويريد تصحيحه.

```sql
-- تحديث التاريخ
UPDATE poultry_status
SET chick_birth_date = '2025-10-01'  -- التاريخ الجديد
WHERE id = 'poultry-uuid';

-- ماذا يحدث؟
-- 1. يتم تشغيل Trigger
-- 2. يتم حذف جميع التنبيهات القديمة
-- 3. يتم إنشاء تنبيهات جديدة بناءً على التاريخ الجديد
```

### 🔄 السيناريو 2: إضافة دواء جديد

**الحالة**: المدير أضاف دواء جديد في جدول `medicines`.

```sql
-- إضافة دواء جديد
INSERT INTO medicines (name, description, day_of_age)
VALUES ('دواء جديد', 'وصف', '5+10+15');

-- ماذا يحدث؟
-- ❌ لا شيء! التنبيهات الموجودة لا تتأثر.

-- الحل: إعادة إنشاء التنبيهات يدوياً
SELECT create_medication_alerts_for_poultry(
  'poultry-uuid',
  (SELECT chick_birth_date FROM poultry_status WHERE id = 'poultry-uuid')
);
```

### 🔄 السيناريو 3: إلغاء تحديد التنبيه (خطأ)

**الحالة**: المزارع حدد التنبيه بالخطأ.

```typescript
const result = await unmarkAlertAsAdministered('alert-uuid');

// ماذا يحدث؟
// 1. is_administered = FALSE
// 2. administered_at = NULL
// 3. التنبيه يظهر مرة أخرى في القائمة
```

---

## 📈 مخطط تدفق البيانات

```
┌─────────────────────────────────────────────────────────────┐
│                    1. إنشاء القطيع                          │
│  ┌────────────┐         ┌──────────────┐                    │
│  │   المدير   │ ─────→ │ poultry_status│                    │
│  └────────────┘         └──────────────┘                    │
│                              │                               │
│                              │ (بدون chick_birth_date)       │
│                              ↓                               │
│                         ❌ لا توجد تنبيهات                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              2. إضافة تاريخ الميلاد                         │
│  ┌────────────┐         ┌──────────────┐                    │
│  │   المزارع  │ ─────→ │    UPDATE     │                    │
│  └────────────┘         │chick_birth_date│                   │
│                         └──────────────┘                    │
│                              │                               │
│                              ↓                               │
│                      ⚡ Trigger يعمل                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              3. إنشاء التنبيهات تلقائياً                    │
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │ create_medication_alerts_for_poultry()      │            │
│  └─────────────────────────────────────────────┘            │
│         │                                                     │
│         ├──→ جلب الأدوية من medicines                       │
│         ├──→ تحليل أيام كل دواء (parse_medicine_days)      │
│         ├──→ حساب scheduled_date و alert_date               │
│         └──→ إدراج في medication_alerts                     │
│                                                               │
│  ✅ تم إنشاء 40-50 تنبيه                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  4. عرض التنبيهات                           │
│  ┌────────────┐         ┌──────────────┐                    │
│  │   المزارع  │ ─────→ │ farmer/page  │                    │
│  └────────────┘         └──────────────┘                    │
│                              │                               │
│                              ↓                               │
│                   get_upcoming_alerts()                      │
│                              │                               │
│                              ↓                               │
│         ┌────────────────────────────────┐                  │
│         │  🚨 متأخر  │  ⚠️ اليوم  │  📌 غداً │               │
│         └────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  5. تنفيذ التنبيه                           │
│  ┌────────────┐         ┌──────────────┐                    │
│  │   المزارع  │ ─────→ │ [تم الإعطاء ✓] │                   │
│  └────────────┘         └──────────────┘                    │
│                              │                               │
│                              ↓                               │
│               mark_alert_as_administered()                   │
│                              │                               │
│                              ↓                               │
│                  ┌─────────────────────┐                    │
│                  │ is_administered = TRUE│                   │
│                  │ administered_at = NOW │                   │
│                  └─────────────────────┘                    │
│                                                               │
│  ✅ التنبيه لا يظهر في القائمة بعد الآن                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 ملخص سير العمل

### المدخلات
1. تاريخ ميلاد الفراخ (`chick_birth_date`)
2. جدول الأدوية (`medicines` مع `day_of_age`)

### المعالجة (تلقائية)
1. Trigger يتم تشغيله عند إضافة/تحديث التاريخ
2. الدالة تجلب جميع الأدوية
3. تحليل أيام كل دواء
4. حساب التواريخ المجدولة
5. إنشاء التنبيهات

### المخرجات
1. تنبيهات مصنفة حسب الأولوية
2. عرض في لوحة التحكم
3. إمكانية التحديد كـ "تم"
4. إحصائيات وتقارير

### الميزات التلقائية
- ✅ إنشاء تلقائي للتنبيهات
- ✅ تصنيف تلقائي للأولوية
- ✅ حساب تلقائي للتواريخ
- ✅ تحديث تلقائي عند تغيير التاريخ

---

## 🔍 أسئلة شائعة

### س: متى يتم إنشاء التنبيهات؟
**ج**: تلقائياً عند إضافة أو تحديث `chick_birth_date` في جدول `poultry_status`.

### س: ماذا لو غيرت تاريخ الميلاد؟
**ج**: يتم حذف جميع التنبيهات القديمة وإنشاء تنبيهات جديدة بناءً على التاريخ الجديد.

### س: هل يمكن إضافة تنبيه يدوياً؟
**ج**: لا ينصح بذلك. الأفضل إضافة الدواء في جدول `medicines` ثم إعادة إنشاء التنبيهات.

### س: ماذا لو نسيت إعطاء دواء؟
**ج**: التنبيه سيظهر كـ "متأخر" (🚨) مع عدد الأيام المتأخرة.

### س: كيف أعرف التنبيهات المكتملة؟
**ج**: استخدم `getAllAlertsForFarm()` مع فلتر `is_administered = TRUE`.

---

**📖 المرجع الكامل**: راجع `MEDICATION_ALERTS_README.md` للتفاصيل الفنية.
