# دليل البدء السريع - نظام التنبيهات الدوائية

## ⚡ التنفيذ السريع (5 دقائق)

### الخطوة 1: تنفيذ SQL في Supabase
```bash
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ والصق محتوى: medication-alerts-migration.sql
4. اضغط RUN
5. انتظر حتى تنتهي جميع الاستعلامات (قد تستغرق 10-30 ثانية)
```

### الخطوة 2: تطبيق سياسات الأمان
```bash
1. في نفس SQL Editor
2. انسخ والصق محتوى: medication-alerts-rls.sql
3. اضغط RUN
```

### الخطوة 3: التحقق من النجاح
```sql
-- نفذ هذا الاستعلام للتحقق
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'medication_alerts';

-- يجب أن يعيد: medication_alerts
```

### الخطوة 4: اختبار النظام
```sql
-- ابحث عن مزرعة موجودة
SELECT id, name FROM farms LIMIT 1;

-- حدّث تاريخ ميلاد الفراخ (استبدل farm-id-here)
UPDATE farms 
SET chick_birth_date = CURRENT_DATE 
WHERE id = 'farm-id-here';

-- تحقق من إنشاء التنبيهات
SELECT COUNT(*) FROM medication_alerts 
WHERE farm_id = 'farm-id-here';

-- يجب أن يعيد عدد > 0
```

## 🎯 الخطوات التالية في الكود

### 1. تحديث Types
```typescript
// في ملف types أو في بداية ملفات الإجراءات
export type Farm = {
  // ... الحقول الموجودة
  chick_birth_date?: string; // 👈 أضف هذا
};
```

### 2. تحديث نموذج تعديل المزرعة
```typescript
// في edit-farm-dialog.tsx
// أضف هذا الحقل في النموذج

<div className="space-y-2">
  <Label htmlFor="chick_birth_date">تاريخ ميلاد الفراخ</Label>
  <Input
    id="chick_birth_date"
    type="date"
    {...register('chick_birth_date')}
    disabled={isLoading}
  />
</div>
```

### 3. تحديث Schema Validation
```typescript
// في edit-farm-dialog.tsx و create-farm-dialog.tsx
const farmSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  user_id: z.string().optional(),
  is_active: z.boolean(),
  chick_birth_date: z.string().optional(), // 👈 أضف هذا
});
```

### 4. تحديث نموذج Setup
```typescript
// في complete-farm-setup-form.tsx

// في schema
farm: z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  is_active: z.boolean().default(true),
  chick_birth_date: z.string().optional(), // 👈 أضف هذا
}),

// في النموذج
<div className="space-y-2">
  <Label htmlFor="farm.chick_birth_date">تاريخ ميلاد الفراخ</Label>
  <Input
    id="farm.chick_birth_date"
    type="date"
    {...register('farm.chick_birth_date')}
    disabled={isLoading}
  />
</div>
```

### 5. إضافة التنبيهات في صفحة المزارع
```typescript
// في app/(dashboard)/farmer/page.tsx

// استيراد
import { getUpcomingAlertsForUser } from '@/actions/medication-alerts.actions';

// في الدالة الرئيسية
const { data: alerts } = await supabase.rpc('get_upcoming_alerts', {
  p_user_id: session.user.id,
  p_limit: 5
});

// في JSX
{alerts && alerts.length > 0 && (
  <Card className="border-orange-200 bg-orange-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        تنبيهات الأدوية ({alerts.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.alert_id} className="p-3 bg-white rounded-lg">
            <p className="font-semibold">{alert.medicine_name}</p>
            <p className="text-sm text-muted-foreground">
              {alert.scheduled_date} - {alert.priority}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

## 📋 قائمة المهام

### في قاعدة البيانات
- [x] إضافة حقل `chick_birth_date` إلى جدول farms
- [x] إنشاء جدول `medication_alerts`
- [x] إنشاء الدوال والـ Triggers
- [x] تطبيق سياسات RLS

### في الكود
- [ ] تحديث Types
- [ ] تحديث نموذج تعديل المزرعة (edit-farm-dialog.tsx)
- [ ] تحديث نموذج إنشاء المزرعة (create-farm-dialog.tsx) إذا كان موجوداً
- [ ] تحديث نموذج Setup (complete-farm-setup-form.tsx)
- [ ] إنشاء actions/medication-alerts.actions.ts
- [ ] إضافة قسم التنبيهات في صفحة المزارع
- [ ] إنشاء مكونات عرض التنبيهات (اختياري)
- [ ] اختبار النظام بالكامل

## 🧪 اختبار سريع

### اختبار 1: إنشاء مزرعة بتاريخ ميلاد
```typescript
// يجب أن يعمل هذا تلقائياً بعد التحديثات
// عند إنشاء مزرعة جديدة وإضافة chick_birth_date
// سيتم إنشاء التنبيهات تلقائياً
```

### اختبار 2: جلب التنبيهات
```typescript
// في أي مكان
const { data } = await supabase
  .rpc('get_upcoming_alerts', {
    p_user_id: 'user-id',
    p_limit: 5
  });
console.log(data); // يجب أن يعرض التنبيهات
```

### اختبار 3: تحديد تنبيه كمكتمل
```typescript
const { data } = await supabase
  .rpc('mark_alert_as_administered', {
    p_alert_id: 'alert-id',
    p_user_id: 'user-id',
    p_notes: 'تم الإعطاء بنجاح'
  });
console.log(data); // يجب أن يكون true
```

## 📁 الملفات المرفقة

| الملف | الغرض | متى تستخدمه |
|------|------|------------|
| `medication-alerts-migration.sql` | إنشاء الجداول والدوال | **مرة واحدة** في البداية |
| `medication-alerts-rls.sql` | سياسات الأمان | **مرة واحدة** بعد Migration |
| `medication-alerts-queries.sql` | استعلامات مفيدة | **مرجع** عند الحاجة |
| `medication-alerts-examples.tsx` | أمثلة الكود | **مرجع** للنسخ واللصق |
| `medication-alerts-usage.md` | دليل الاستخدام | **مرجع** للمطورين |
| `MEDICATION_ALERTS_README.md` | دليل شامل | **مرجع** عام |

## ⚠️ ملاحظات مهمة

1. **لا تنفذ الاستعلامات في الإنتاج مباشرة**
   - اختبر في بيئة تطوير أولاً
   - خذ نسخة احتياطية من قاعدة البيانات

2. **الـ Triggers تعمل تلقائياً**
   - عند إضافة/تحديث `chick_birth_date`
   - لا حاجة لإجراء يدوي

3. **RLS نشطة**
   - المزارعون يرون تنبيهاتهم فقط
   - المدراء يرون جميع التنبيهات

4. **التنبيهات تُحسب تلقائياً**
   - بناءً على جدول الأدوية الموجود
   - يمكنك إضافة أدوية جديدة في أي وقت

## 🆘 حل المشاكل السريع

### المشكلة: لا تظهر التنبيهات
```sql
-- تحقق من تاريخ الميلاد
SELECT id, name, chick_birth_date FROM farms WHERE id = 'farm-id';

-- إذا كان null، أضف تاريخ
UPDATE farms SET chick_birth_date = '2025-10-01' WHERE id = 'farm-id';

-- تحقق من التنبيهات
SELECT COUNT(*) FROM medication_alerts WHERE farm_id = 'farm-id';
```

### المشكلة: خطأ في الصلاحيات
```sql
-- تحقق من RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'medication_alerts';

-- إذا لم توجد، نفذ medication-alerts-rls.sql
```

### المشكلة: التواريخ خاطئة
```sql
-- أعد إنشاء التنبيهات
SELECT public.create_medication_alerts_for_farm(
  'farm-id',
  '2025-10-01'  -- تاريخ الميلاد الصحيح
);
```

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع قسم "حل المشاكل السريع" أعلاه
2. تحقق من `MEDICATION_ALERTS_README.md`
3. راجع `medication-alerts-usage.md`

---

**نصيحة**: ابدأ بمزرعة تجريبية واحدة للاختبار قبل تطبيق التغييرات على جميع المزارع.
