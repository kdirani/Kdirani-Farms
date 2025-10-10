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

### الخطوة 2: نسخ ملف Actions
```bash
1. انسخ ملف actions/medication-alerts.actions.ts
2. ضعه في مجلد actions في مشروعك
3. تأكد من المسارات (@/lib/supabase/server)
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
-- ابحث عن قطيع موجود
SELECT id, batch_name FROM poultry_status LIMIT 1;

-- حدّث تاريخ ميلاد الفراخ (استبدل poultry-id-here)
UPDATE poultry_status 
SET chick_birth_date = CURRENT_DATE 
WHERE id = 'poultry-id-here';

-- تحقق من إنشاء التنبيهات
SELECT COUNT(*) FROM medication_alerts 
WHERE poultry_status_id = 'poultry-id-here';

-- يجب أن يعيد عدد > 0
```

## 🎯 الخطوات التالية في الكود

### 1. تحديث Types
```typescript
// في ملف types أو في بداية ملفات الإجراءات
export type PoultryStatus = {
  // ... الحقول الموجودة
  chick_birth_date?: string; // 👈 أضف هذا
};
```

### 2. تحديث نموذج إعداد المزرعة

في ملف `components/admin/setup/complete-farm-setup-form.tsx`:

```typescript
// في Schema
poultry: z.object({
  batch_name: z.string().min(2),
  opening_chicks: z.number().min(0),
  chick_birth_date: z.string().optional(), // 👈 أضف هذا
}),

// في النموذج
<div className="space-y-2">
  <Label htmlFor="poultry.chick_birth_date">تاريخ ميلاد الفراخ</Label>
  <Input
    id="poultry.chick_birth_date"
    type="date"
    {...register('poultry.chick_birth_date')}
    disabled={isLoading}
  />
</div>
```

### 3. إضافة التنبيهات في صفحة المزارع

في ملف `app/(dashboard)/farmer/page.tsx`:

```typescript
// استيراد
import { getUpcomingAlertsForUser } from '@/actions/medication-alerts.actions';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// في الدالة الرئيسية
const alertsResult = await getUpcomingAlertsForUser(session.user.id, 5);
const alerts = alertsResult.success ? alertsResult.data : [];

// في JSX
{alerts && alerts.length > 0 && (
  <Card className="border-orange-200 bg-orange-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-orange-600" />
        تنبيهات الأدوية ({alerts.length})
      </CardTitle>
      <CardDescription>
        التنبيهات القادمة لأدوية القطيع
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.alert_id} className="p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold">💊 {alert.medicine_name}</p>
                <p className="text-sm text-muted-foreground">
                  📅 {new Date(alert.scheduled_date).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <Badge variant={
                alert.priority === 'متأخر' ? 'destructive' :
                alert.priority === 'اليوم' ? 'warning' : 'default'
              }>
                {alert.priority}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

## 📋 قائمة المهام

### في قاعدة البيانات
- [ ] تنفيذ `medication-alerts-migration.sql`
- [ ] اختبار إنشاء التنبيهات

### في الكود
- [ ] نسخ `actions/medication-alerts.actions.ts`
- [ ] تحديث Types
- [ ] تحديث نموذج Setup (complete-farm-setup-form.tsx)
- [ ] إضافة التنبيهات في `farmer/page.tsx`

### الاختبار
- [ ] إنشاء قطيع تجريبي
- [ ] إضافة تاريخ ميلاد
- [ ] التحقق من التنبيهات
- [ ] اختبار تحديد التنبيه

## 🧪 اختبار سريع

### اختبار 1: إنشاء قطيع بتاريخ ميلاد
```typescript
// عند إنشاء قطيع جديد وإضافة chick_birth_date
// سيتم إنشاء التنبيهات تلقائياً
```

### اختبار 2: جلب التنبيهات
```typescript
import { getUpcomingAlertsForUser } from '@/actions/medication-alerts.actions';

const result = await getUpcomingAlertsForUser('user-id', 5);
console.log(result.data); // يجب أن يعرض التنبيهات
```

### اختبار 3: تحديد تنبيه كمكتمل
```typescript
import { markAlertAsAdministered } from '@/actions/medication-alerts.actions';

const result = await markAlertAsAdministered('alert-id', 'تم الإعطاء بنجاح');
console.log(result.success); // يجب أن يكون true
```

## 📁 الملفات المرفقة

| الملف | الغرض | متى تستخدمه |
|------|------|------------|
| `medication-alerts-migration.sql` | إنشاء الجداول والدوال | **مرة واحدة** في البداية |
| `medication-alerts.actions.ts` | Server Actions جاهزة | **انسخه** إلى مشروعك |
| `medication-alerts-queries.sql` | استعلامات مفيدة | **مرجع** عند الحاجة |

## ⚠️ ملاحظات مهمة

1. **لا تنفذ الاستعلامات في الإنتاج مباشرة**
   - اختبر في بيئة تطوير أولاً
   - خذ نسخة احتياطية من قاعدة البيانات

2. **الـ Triggers تعمل تلقائياً**
   - عند إضافة/تحديث `chick_birth_date`
   - لا حاجة لإجراء يدوي

3. **التنبيهات تُحسب تلقائياً**
   - بناءً على جدول الأدوية الموجود
   - يمكنك إضافة أدوية جديدة في أي وقت

4. **تم إضافة chick_birth_date إلى poultry_status**
   - وليس إلى جدول farms
   - كل قطيع له تاريخ ميلاد مستقل

## 🆘 حل المشاكل السريع

### المشكلة: لا تظهر التنبيهات
```sql
-- تحقق من تاريخ الميلاد
SELECT id, batch_name, chick_birth_date 
FROM poultry_status 
WHERE id = 'poultry-id';

-- إذا كان null، أضف تاريخ
UPDATE poultry_status 
SET chick_birth_date = '2025-10-01' 
WHERE id = 'poultry-id';

-- تحقق من التنبيهات
SELECT COUNT(*) FROM medication_alerts 
WHERE poultry_status_id = 'poultry-id';
```

### المشكلة: التواريخ خاطئة
```sql
-- أعد إنشاء التنبيهات
SELECT public.create_medication_alerts_for_poultry(
  'poultry-id',
  '2025-10-01'  -- تاريخ الميلاد الصحيح
);
```

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع قسم "حل المشاكل السريع" أعلاه
2. تحقق من `MEDICATION_ALERTS_README.md`
3. راجع `medication-alerts-usage.md`

---

**نصيحة**: ابدأ بقطيع تجريبي واحد للاختبار قبل تطبيق التغييرات على جميع القطعان.
