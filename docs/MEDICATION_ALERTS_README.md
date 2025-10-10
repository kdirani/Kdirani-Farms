# نظام التنبيهات الدوائية - دليل شامل

## 📋 نظرة عامة

نظام التنبيهات الدوائية هو نظام متكامل لتذكير المزارعين بمواعيد إعطاء الأدوية واللقاحات للفراخ بناءً على عمرها. يتم حساب التنبيهات تلقائياً بناءً على تاريخ ميلاد الفراخ وجدول الأدوية المعرف مسبقاً.

## 🎯 الميزات الرئيسية

### 1. الحساب التلقائي للتنبيهات
- إنشاء تلقائي لجميع التنبيهات عند إضافة أو تحديث تاريخ ميلاد الفراخ
- حساب دقيق للتواريخ المجدولة بناءً على عمر الفراخ باليوم
- تنبيه مسبق (يوم واحد قبل الموعد المحدد)

### 2. تصنيف الأولويات
- **عاجل - متأخر**: التنبيهات التي فات موعدها
- **عاجل - اليوم**: التنبيهات المجدولة لليوم الحالي
- **مهم - غداً**: التنبيهات المجدولة لليوم التالي
- **عادي**: التنبيهات القادمة خلال الأسبوع

### 3. تتبع الحالة
- معرفة ما إذا تم إعطاء الدواء أم لا
- تسجيل من قام بإعطاء الدواء
- تسجيل تاريخ ووقت إعطاء الدواء
- إمكانية إضافة ملاحظات

### 4. الأمان
- سياسات RLS تضمن أن كل مزارع يرى تنبيهاته فقط
- المدراء يمكنهم رؤية وإدارة جميع التنبيهات
- حماية البيانات من الوصول غير المصرح به

## 📁 الملفات المتضمنة

### 1. `medication-alerts-migration.sql`
**الوصف**: الملف الرئيسي الذي يحتوي على جميع استعلامات إنشاء النظام

**المحتويات**:
- إضافة حقل `chick_birth_date` إلى جدول `farms`
- إنشاء جدول `medication_alerts`
- دوال SQL للحسابات والإنشاء التلقائي
- Triggers للتنفيذ التلقائي
- Views للتقارير والملخصات

**الاستخدام**: قم بتنفيذ هذا الملف في Supabase SQL Editor

### 2. `medication-alerts-rls.sql`
**الوصف**: سياسات الأمان (Row Level Security)

**المحتويات**:
- سياسات SELECT/UPDATE/INSERT/DELETE
- تحديد الصلاحيات للمزارعين والمدراء
- ضمان عزل البيانات بين المستخدمين

**الاستخدام**: قم بتنفيذ هذا الملف بعد تنفيذ ملف Migration

### 3. `medication-alerts-queries.sql`
**الوصف**: استعلامات جاهزة للاستخدام

**المحتويات**:
- استعلامات لجلب التنبيهات النشطة
- استعلامات للإحصائيات والتقارير
- استعلامات للتنظيف والصيانة

**الاستخدام**: استخدم هذه الاستعلامات كمرجع في التطبيق

### 4. `medication-alerts-usage.md`
**الوصف**: دليل الاستخدام التفصيلي

**المحتويات**:
- سيناريوهات الاستخدام
- أمثلة عملية
- نصائح للتكامل مع الكود

**الاستخدام**: مرجع للمطورين

## 🚀 خطوات التنفيذ

### الخطوة 1: تنفيذ Migration
```bash
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى medication-alerts-migration.sql
4. قم بتشغيل الاستعلامات
```

### الخطوة 2: تطبيق RLS
```bash
1. في SQL Editor
2. انسخ محتوى medication-alerts-rls.sql
3. قم بتشغيل الاستعلامات
```

### الخطوة 3: التحقق من النجاح
```sql
-- التحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('farms', 'medication_alerts');

-- التحقق من الأعمدة
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farms' 
AND column_name = 'chick_birth_date';

-- التحقق من الدوال
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%medication%';
```

### الخطوة 4: اختبار النظام
```sql
-- إنشاء مزرعة تجريبية
INSERT INTO public.farms (name, location, user_id, chick_birth_date, is_active)
VALUES ('مزرعة تجريبية', 'موقع تجريبي', 'your-user-id', CURRENT_DATE, TRUE)
RETURNING id;

-- التحقق من إنشاء التنبيهات
SELECT COUNT(*) FROM public.medication_alerts 
WHERE farm_id = 'farm-id-from-above';

-- جلب التنبيهات النشطة
SELECT * FROM public.get_active_alerts_for_farm('farm-id-from-above', 7);
```

## 📊 هيكل قاعدة البيانات

### جدول `farms` (المعدل)
```sql
+ chick_birth_date: DATE  -- تاريخ ميلاد/فقس الفراخ
```

### جدول `medication_alerts` (جديد)
| العمود | النوع | الوصف |
|--------|------|-------|
| `id` | uuid | معرف التنبيه |
| `farm_id` | uuid | معرف المزرعة |
| `medicine_id` | uuid | معرف الدواء |
| `scheduled_day` | INTEGER | عمر الفرخة المجدول لإعطاء الدواء |
| `scheduled_date` | DATE | التاريخ المجدول |
| `alert_date` | DATE | تاريخ التنبيه |
| `is_administered` | BOOLEAN | هل تم إعطاء الدواء؟ |
| `administered_at` | TIMESTAMP | تاريخ ووقت الإعطاء |
| `administered_by` | uuid | من قام بالإعطاء |
| `notes` | TEXT | ملاحظات |

## 🔧 الدوال المتاحة

### 1. `calculate_chick_age_in_days(birth_date, reference_date)`
حساب عمر الفراخ بالأيام

**الاستخدام**:
```sql
SELECT public.calculate_chick_age_in_days('2025-10-01', CURRENT_DATE);
```

### 2. `create_medication_alerts_for_farm(farm_id, chick_birth_date)`
إنشاء جميع التنبيهات للمزرعة

**الاستخدام**:
```sql
SELECT public.create_medication_alerts_for_farm(
  'farm-uuid',
  '2025-10-01'
);
```

### 3. `get_active_alerts_for_farm(farm_id, days_ahead)`
جلب التنبيهات النشطة

**الاستخدام**:
```sql
SELECT * FROM public.get_active_alerts_for_farm('farm-uuid', 7);
```

### 4. `get_upcoming_alerts(user_id, limit)`
جلب التنبيهات القادمة للمستخدم

**الاستخدام**:
```sql
SELECT * FROM public.get_upcoming_alerts('user-uuid', 10);
```

### 5. `mark_alert_as_administered(alert_id, user_id, notes)`
تحديد التنبيه كمكتمل

**الاستخدام**:
```sql
SELECT public.mark_alert_as_administered(
  'alert-uuid',
  'user-uuid',
  'تم إعطاء الدواء بنجاح'
);
```

### 6. `unmark_alert_as_administered(alert_id)`
إلغاء تحديد التنبيه

**الاستخدام**:
```sql
SELECT public.unmark_alert_as_administered('alert-uuid');
```

## 💻 التكامل مع Next.js

### جلب التنبيهات النشطة
```typescript
const { data: alerts, error } = await supabase
  .rpc('get_active_alerts_for_farm', {
    p_farm_id: farmId,
    p_days_ahead: 7
  });
```

### جلب التنبيهات القادمة للمستخدم
```typescript
const { data: upcomingAlerts, error } = await supabase
  .rpc('get_upcoming_alerts', {
    p_user_id: userId,
    p_limit: 10
  });
```

### تحديد التنبيه كمكتمل
```typescript
const { data: success, error } = await supabase
  .rpc('mark_alert_as_administered', {
    p_alert_id: alertId,
    p_user_id: userId,
    p_notes: 'ملاحظات...'
  });
```

### جلب التنبيهات مباشرة
```typescript
const { data: alerts, error } = await supabase
  .from('medication_alerts')
  .select(`
    *,
    medicines:medicine_id (
      id,
      name,
      description
    ),
    farms:farm_id (
      id,
      name
    )
  `)
  .eq('farm_id', farmId)
  .eq('is_administered', false)
  .order('scheduled_date', { ascending: true });
```

## 📝 التحديثات المطلوبة في الكود

### 1. تحديث نموذج Farm
```typescript
// types/farm.ts
export type Farm = {
  id: string;
  name: string;
  location?: string;
  user_id?: string;
  is_active: boolean;
  chick_birth_date?: string; // 👈 إضافة هذا الحقل
  created_at: string;
  updated_at: string;
};
```

### 2. إضافة حقل في نماذج المزارع
```typescript
// في edit-farm-dialog.tsx و create-farm-dialog.tsx
<div className="space-y-2">
  <Label htmlFor="chick_birth_date">تاريخ ميلاد الفراخ</Label>
  <Input
    id="chick_birth_date"
    type="date"
    {...register('chick_birth_date')}
  />
</div>
```

### 3. إضافة في نموذج Setup
```typescript
// في complete-farm-setup-form.tsx
farm: z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  is_active: z.boolean().default(true),
  chick_birth_date: z.string().optional(), // 👈 إضافة هذا
}),
```

### 4. إنشاء مكونات التنبيهات
```typescript
// components/farmer/medication-alerts-card.tsx
export function MedicationAlertsCard({ userId }: { userId: string }) {
  // جلب التنبيهات وعرضها
}
```

## 🎨 أمثلة واجهة المستخدم

### عرض التنبيه
```tsx
<Card className={`border-l-4 ${
  alert.priority === 'متأخر' ? 'border-red-500' :
  alert.priority === 'اليوم' ? 'border-orange-500' :
  alert.priority === 'غداً' ? 'border-yellow-500' :
  'border-blue-500'
}`}>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span>💊 {alert.medicine_name}</span>
      <Badge variant={
        alert.priority === 'متأخر' ? 'destructive' :
        alert.priority === 'اليوم' ? 'warning' :
        'default'
      }>
        {alert.priority}
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p>📅 التاريخ المجدول: {formatDate(alert.scheduled_date)}</p>
    <p>🐣 عمر الفرخة: {alert.scheduled_day} يوم</p>
    <Button onClick={() => markAsAdministered(alert.alert_id)}>
      تم إعطاء الدواء ✓
    </Button>
  </CardContent>
</Card>
```

## 🔍 استكشاف الأخطاء

### المشكلة: لا يتم إنشاء التنبيهات تلقائياً
**الحل**:
```sql
-- تحقق من وجود Trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trg_auto_create_medication_alerts';

-- إذا لم يوجد، قم بإنشائه من جديد
-- انسخ الكود من medication-alerts-migration.sql
```

### المشكلة: لا يمكن رؤية التنبيهات
**الحل**:
```sql
-- تحقق من RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'medication_alerts';

-- تحقق من الصلاحيات
SELECT * FROM public.medication_alerts; -- يجب أن يعرض فقط تنبيهاتك
```

### المشكلة: التواريخ غير صحيحة
**الحل**:
```sql
-- تحقق من تاريخ ميلاد الفراخ
SELECT id, name, chick_birth_date FROM public.farms;

-- أعد إنشاء التنبيهات
SELECT public.create_medication_alerts_for_farm(farm_id, chick_birth_date)
FROM public.farms 
WHERE chick_birth_date IS NOT NULL;
```

## 📚 موارد إضافية

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)

## 🤝 الدعم

إذا واجهت أي مشاكل:
1. راجع قسم استكشاف الأخطاء
2. تحقق من ملفات الاستعلامات النموذجية
3. راجع ملف Usage للأمثلة

## 📄 الترخيص

هذا النظام جزء من مشروع al-qadeerani-poultry-farm

---

**تم الإنشاء**: 2025-10-10  
**آخر تحديث**: 2025-10-10  
**الإصدار**: 1.0.0
