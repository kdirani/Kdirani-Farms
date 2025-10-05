# حساب "العدد قبل" تلقائياً في التقرير اليومي

## 📋 نظرة عامة

تم تحديث نظام التقرير اليومي لحساب حقل **"العدد قبل"** (`chicks_before`) تلقائياً بدلاً من إدخاله يدوياً.

---

## 🎯 المنطق الجديد

### القاعدة:
```
إذا كان التقرير الأول → العدد قبل = العدد المتبقي من جدول القطيع (poultry_status.remaining_chicks)
إذا لم يكن التقرير الأول → العدد قبل = العدد بعد من آخر تقرير (last_daily_report.chicks_after)
```

### التفصيل:

#### 1️⃣ **التقرير الأول** (First Report):
- المصدر: `poultry_status.remaining_chicks`
- السبب: لا يوجد تقرير سابق
- المثال: إذا كان لديك 10,000 دجاجة في القطيع، سيكون "العدد قبل" = 10,000

#### 2️⃣ **التقارير التالية** (Subsequent Reports):
- المصدر: `daily_reports.chicks_after` من آخر تقرير
- السبب: العدد المتبقي من اليوم السابق هو البداية لليوم الحالي
- المثال: 
  - اليوم الأول: العدد بعد = 9,950 (مات 50)
  - اليوم الثاني: العدد قبل = 9,950 (تلقائياً من اليوم السابق)

---

## 📁 الملفات المُعدلة

### 1. `actions/integrated-daily-report.actions.ts`

#### أ. إضافة دالة `getChicksBeforeValue()`:

```typescript
/**
 * Get chicks_before value automatically:
 * - First report: from poultry_status.remaining_chicks
 * - Subsequent reports: from last daily_report.chicks_after
 */
async function getChicksBeforeValue(
  supabase: any,
  warehouseId: string
): Promise<number> {
  // Check if this is the first report
  const firstReport = await isFirstReport(supabase, warehouseId);
  
  if (firstReport) {
    // First report: get from poultry status
    return await getChicksFromPoultryStatus(supabase, warehouseId);
  } else {
    // Subsequent reports: get from last report's chicks_after
    const { data: lastReport } = await supabase
      .from('daily_reports')
      .select('chicks_after')
      .eq('warehouse_id', warehouseId)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return lastReport?.chicks_after || 0;
  }
}
```

#### ب. إضافة دالة `getChicksBeforeForNewReport()` للواجهة:

```typescript
/**
 * Public function to get chicks_before value for UI
 */
export async function getChicksBeforeForNewReport(
  warehouseId: string
): Promise<ActionResult<number>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'غير مصرح' };
    }

    const supabase = await createClient();
    const chicksBeforeValue = await getChicksBeforeValue(supabase, warehouseId);
    
    return { success: true, data: chicksBeforeValue };
  } catch (error) {
    console.error('Error getting chicks before:', error);
    return { success: false, error: 'فشل في جلب عدد الدجاج' };
  }
}
```

#### ج. تحديث `createIntegratedDailyReport()`:

**قبل:**
```typescript
// Check if this is the first report
const firstReport = await isFirstReport(supabase, input.warehouse_id);

// If first report, get chicks from poultry status
let chicksBeforeValue = input.chicks_before;
if (firstReport && chicksBeforeValue === 0) {
  chicksBeforeValue = await getChicksFromPoultryStatus(supabase, input.warehouse_id);
}
```

**بعد:**
```typescript
// Get chicks_before value automatically
// First report: from poultry_status.remaining_chicks
// Subsequent reports: from last daily_report.chicks_after
const chicksBeforeValue = await getChicksBeforeValue(supabase, input.warehouse_id);
```

---

### 2. `components/farmer/integrated-daily-report-form.tsx`

#### أ. تحديث الـ Import:

```typescript
import { 
  createIntegratedDailyReport,
  getWarehouseMedicines,
  getChicksBeforeForNewReport, // ✅ إضافة
  type EggSaleInvoiceItem,
  type DroppingsSaleInvoiceData,
  type MedicineConsumptionItem,
} from '@/actions/integrated-daily-report.actions';
```

#### ب. إضافة useEffect لجلب القيمة تلقائياً:

```typescript
// Load chicks_before value automatically
useEffect(() => {
  const loadChicksBefore = async () => {
    const result = await getChicksBeforeForNewReport(warehouseId);
    if (result.success && result.data !== undefined) {
      setValue('chicks_before', result.data);
    }
  };
  loadChicksBefore();
}, [warehouseId, setValue]);
```

#### ج. تحديث الحقل في الواجهة:

**قبل:**
```tsx
<div className="space-y-2">
  <Label htmlFor="chicks_before">العدد قبل</Label>
  <Input
    id="chicks_before"
    type="number"
    {...register('chicks_before', { valueAsNumber: true })}
    disabled={isLoading}
  />
</div>
```

**بعد:**
```tsx
<div className="space-y-2">
  <Label htmlFor="chicks_before">العدد قبل (تلقائي)</Label>
  <Input
    id="chicks_before"
    type="number"
    {...register('chicks_before', { valueAsNumber: true })}
    disabled
    className="bg-muted"
  />
  <p className="text-xs text-muted-foreground">
    يُحسب تلقائياً من القطيع أو التقرير السابق
  </p>
</div>
```

**التغييرات:**
- ✅ إضافة "(تلقائي)" في Label
- ✅ جعل الحقل `disabled` دائماً (للقراءة فقط)
- ✅ إضافة `className="bg-muted"` لتوضيح أنه حقل محسوب
- ✅ إضافة رسالة توضيحية أسفل الحقل

---

## 🔄 سير العمل (Flow)

### السيناريو 1: التقرير الأول

```
1. المستخدم يفتح صفحة التقرير اليومي
2. useEffect يستدعي getChicksBeforeForNewReport(warehouseId)
3. الدالة تتحقق: هل هذا التقرير الأول؟ → نعم
4. تجلب القيمة من poultry_status.remaining_chicks
5. القيمة تُعرض في الحقل (مثلاً: 10,000)
6. المستخدم يدخل النافق (مثلاً: 50)
7. يُحسب العدد بعد تلقائياً = 10,000 - 50 = 9,950
8. يتم حفظ التقرير
```

### السيناريو 2: التقرير الثاني

```
1. المستخدم يفتح صفحة التقرير اليومي (في يوم جديد)
2. useEffect يستدعي getChicksBeforeForNewReport(warehouseId)
3. الدالة تتحقق: هل هذا التقرير الأول؟ → لا
4. تجلب القيمة من آخر تقرير: daily_reports.chicks_after
5. القيمة تُعرض في الحقل (9,950 من اليوم السابق)
6. المستخدم يدخل النافق (مثلاً: 30)
7. يُحسب العدد بعد تلقائياً = 9,950 - 30 = 9,920
8. يتم حفظ التقرير
```

---

## 📊 مثال توضيحي

### بيانات القطيع:
```sql
poultry_status:
  id: ps-1
  farm_id: farm-1
  remaining_chicks: 10000
```

### التقارير اليومية:

| التاريخ | التقرير | العدد قبل | النافق | العدد بعد | المصدر |
|---------|---------|----------|--------|----------|--------|
| 2025-01-01 | الأول | **10,000** | 50 | 9,950 | ✅ من `poultry_status` |
| 2025-01-02 | الثاني | **9,950** | 30 | 9,920 | ✅ من التقرير السابق |
| 2025-01-03 | الثالث | **9,920** | 25 | 9,895 | ✅ من التقرير السابق |
| 2025-01-04 | الرابع | **9,895** | 20 | 9,875 | ✅ من التقرير السابق |

---

## 🎨 واجهة المستخدم

### قبل التحديث:
```
┌─────────────────────────────────┐
│ العدد قبل                       │
│ ┌─────────────────────────────┐ │
│ │ 10000                       │ │ ← يُدخل يدوياً
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### بعد التحديث:
```
┌─────────────────────────────────┐
│ العدد قبل (تلقائي)              │
│ ┌─────────────────────────────┐ │
│ │ 10000                    🔒 │ │ ← محسوب تلقائياً
│ └─────────────────────────────┘ │
│ يُحسب تلقائياً من القطيع أو     │
│ التقرير السابق                  │
└─────────────────────────────────┘
```

---

## ✅ الفوائد

### 1. **دقة البيانات**
- ❌ قبل: خطأ بشري عند الإدخال اليدوي
- ✅ بعد: حساب دقيق تلقائياً

### 2. **سهولة الاستخدام**
- ❌ قبل: المستخدم يحتاج لتذكر أو البحث عن العدد السابق
- ✅ بعد: يُعرض تلقائياً

### 3. **الاتساق**
- ❌ قبل: إمكانية عدم التطابق بين التقارير
- ✅ بعد: ضمان التسلسل الصحيح

### 4. **منع الأخطاء**
- ❌ قبل: يمكن إدخال رقم خاطئ
- ✅ بعد: الحقل للقراءة فقط

---

## 🧪 الاختبار المطلوب

### اختبار 1: التقرير الأول
```
1. تأكد أن المزرعة ليس لها تقارير يومية
2. افتح صفحة التقرير اليومي
3. تحقق: "العدد قبل" = العدد من القطيع (poultry_status.remaining_chicks)
4. تحقق: الحقل معطل (للقراءة فقط)
5. أدخل النافق وأكمل التقرير
6. احفظ التقرير
7. تحقق: تم حفظ chicks_before بالقيمة الصحيحة
```

### اختبار 2: التقرير الثاني
```
1. افتح صفحة التقرير اليومي (بعد إنشاء التقرير الأول)
2. تحقق: "العدد قبل" = chicks_after من التقرير السابق
3. تحقق: الحقل معطل (للقراءة فقط)
4. أدخل النافق وأكمل التقرير
5. احفظ التقرير
6. تحقق: تم حفظ chicks_before بالقيمة الصحيحة
```

### اختبار 3: التسلسل
```
1. أنشئ 3 تقارير متتالية
2. تحقق من أن:
   - التقرير 2: chicks_before = التقرير 1: chicks_after
   - التقرير 3: chicks_before = التقرير 2: chicks_after
```

---

## 🔍 استعلامات SQL للتحقق

### التحقق من التقرير الأول:
```sql
-- التحقق من أن chicks_before = poultry_status.remaining_chicks
SELECT 
  dr.report_date,
  dr.chicks_before,
  ps.remaining_chicks,
  CASE 
    WHEN dr.chicks_before = ps.remaining_chicks THEN '✅ صحيح'
    ELSE '❌ خطأ'
  END as status
FROM daily_reports dr
JOIN warehouses w ON dr.warehouse_id = w.id
JOIN poultry_status ps ON w.farm_id = ps.farm_id
WHERE dr.warehouse_id = 'warehouse-id'
ORDER BY dr.report_date
LIMIT 1;
```

### التحقق من التسلسل:
```sql
-- التحقق من أن chicks_before = last chicks_after
SELECT 
  dr1.report_date as current_date,
  dr1.chicks_before as current_before,
  dr2.report_date as previous_date,
  dr2.chicks_after as previous_after,
  CASE 
    WHEN dr1.chicks_before = dr2.chicks_after THEN '✅ صحيح'
    ELSE '❌ خطأ'
  END as status
FROM daily_reports dr1
LEFT JOIN daily_reports dr2 ON 
  dr1.warehouse_id = dr2.warehouse_id AND
  dr2.report_date < dr1.report_date
WHERE dr1.warehouse_id = 'warehouse-id'
ORDER BY dr1.report_date;
```

---

## ⚠️ ملاحظات مهمة

### 1. البيانات الموجودة
التحديث لا يؤثر على التقارير الموجودة. التقارير الجديدة فقط ستستخدم الحساب التلقائي.

### 2. الحقل في قاعدة البيانات
حقل `chicks_before` لا يزال موجوداً في الجدول ويتم حفظه، لكن القيمة تُحسب تلقائياً بدلاً من إدخالها يدوياً.

### 3. التعديل اليدوي
إذا احتاج المدير لتعديل قيمة "العدد قبل" لتقرير محفوظ، يمكنه ذلك عبر SQL مباشرة.

---

## 📝 الخلاصة

**ما تم تنفيذه:**
- ✅ إضافة دالة `getChicksBeforeValue()` في الأكشن
- ✅ إضافة دالة `getChicksBeforeForNewReport()` للواجهة
- ✅ تحديث `createIntegratedDailyReport()` لاستخدام الحساب التلقائي
- ✅ إضافة useEffect لجلب القيمة عند تحميل الصفحة
- ✅ جعل الحقل للقراءة فقط مع رسالة توضيحية

**الفوائد:**
- ✅ دقة أعلى في البيانات
- ✅ سهولة استخدام أكبر
- ✅ منع الأخطاء البشرية
- ✅ ضمان التسلسل الصحيح

---

**تاريخ التنفيذ:** 2025-10-05  
**الحالة:** ✅ جاهز للاختبار
