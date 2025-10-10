# تحويل علاقة القطيع إلى واحد لواحد (One-to-One)

## 📋 نظرة عامة

تم تعديل نظام القطيع ليكون لكل مزرعة **قطيع واحد فقط** بدلاً من عدة قطعان.

---

## 🔄 التغيير الرئيسي

### قبل التعديل:
- **علاقة واحد لكثير** (One-to-Many): مزرعة واحدة → عدة قطعان
- يمكن للمزرعة أن يكون لها أكثر من قطيع
- القيد: `UNIQUE (farm_id, batch_name)`

### بعد التعديل:
- **علاقة واحد لواحد** (One-to-One): مزرعة واحدة → قطيع واحد
- كل مزرعة لها قطيع واحد فقط
- القيد: `farm_id UNIQUE`

---

## 📁 الملفات المُعدلة

### 1. `docs/schema.md`

**التعديل على جدول `poultry_status`:**

**قبل:**
```sql
CREATE TABLE public.poultry_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_name VARCHAR(255),
  opening_chicks INTEGER DEFAULT 0,
  dead_chicks INTEGER DEFAULT 0,
  remaining_chicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_farm_batch UNIQUE (farm_id, batch_name)
);
```

**بعد:**
```sql
-- القطيع أو الدجاج يحوي العدد الأولي والنفوق والمتبقي
-- علاقة واحد لواحد: كل مزرعة لها قطيع واحد فقط
CREATE TABLE public.poultry_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid UNIQUE REFERENCES public.farms(id) ON DELETE CASCADE, -- UNIQUE لضمان قطيع واحد
  batch_name VARCHAR(255),
  opening_chicks INTEGER DEFAULT 0,
  dead_chicks INTEGER DEFAULT 0,
  remaining_chicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**التغييرات:**
- ✅ إضافة `UNIQUE` على `farm_id`
- ❌ إزالة `CONSTRAINT unique_farm_batch`

---

### 2. `actions/integrated-daily-report.actions.ts`

**التعديل على دالة `getChicksFromPoultryStatus`:**

**قبل:**
```typescript
async function getChicksFromPoultryStatus(
  supabase: any,
  warehouseId: string
): Promise<number> {
  // Get farm_id from warehouse
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('farm_id')
    .eq('id', warehouseId)
    .single();

  if (!warehouse) return 0;

  // Get poultry status
  const { data: poultryStatus } = await supabase
    .from('poultry_status')
    .select('remaining_chicks')
    .eq('farm_id', warehouse.farm_id)
    .order('created_at', { ascending: false })  // ❌ غير ضروري
    .limit(1)                                    // ❌ غير ضروري
    .maybeSingle();

  return poultryStatus?.remaining_chicks || 0;
}
```

**بعد:**
```typescript
/**
 * Get chicks count from poultry status
 * Note: Each farm has only ONE poultry status (one-to-one relationship)
 */
async function getChicksFromPoultryStatus(
  supabase: any,
  warehouseId: string
): Promise<number> {
  // Get farm_id from warehouse
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('farm_id')
    .eq('id', warehouseId)
    .single();

  if (!warehouse) return 0;

  // Get the single poultry status for this farm
  const { data: poultryStatus } = await supabase
    .from('poultry_status')
    .select('remaining_chicks')
    .eq('farm_id', warehouse.farm_id)
    .maybeSingle();  // ✅ مباشرة بدون order و limit

  return poultryStatus?.remaining_chicks || 0;
}
```

**التغييرات:**
- ✅ إزالة `.order()` و `.limit()` (غير ضرورية الآن)
- ✅ إضافة تعليق توضيحي
- ✅ تبسيط الكود

---

### 3. `components/farmer/integrated-daily-report-form.tsx`

**التعديل على Props:**

**قبل:**
```typescript
interface IntegratedDailyReportFormProps {
  // ... other props
  poultryStatus: Array<{ id: string; batch_name: string }>;  // ❌ Array
}
```

**بعد:**
```typescript
interface IntegratedDailyReportFormProps {
  // ... other props
  poultryStatus: { id: string; batch_name: string } | null;  // ✅ Object or null
}
```

**التعديل على State:**

**قبل:**
```typescript
const [selectedPoultryStatusId, setSelectedPoultryStatusId] = useState<string>('');
```

**بعد:**
```typescript
// ❌ تم إزالة هذا State (لم يعد ضرورياً)
```

**التعديل على الواجهة:**

**قبل:**
```tsx
<div className="space-y-2">
  <Label>القطيع</Label>
  <Select
    value={selectedPoultryStatusId}
    onValueChange={setSelectedPoultryStatusId}
    disabled={isLoading}
  >
    <SelectTrigger>
      <SelectValue placeholder="اختر القطيع" />
    </SelectTrigger>
    <SelectContent>
      {poultryStatus.map((status) => (
        <SelectItem key={status.id} value={status.id}>
          {status.batch_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**بعد:**
```tsx
{poultryStatus && (
  <div className="bg-muted p-4 rounded-lg">
    <Label className="text-sm text-muted-foreground">القطيع</Label>
    <p className="text-lg font-semibold mt-1">{poultryStatus.batch_name}</p>
  </div>
)}
```

**التغييرات:**
- ❌ إزالة قائمة القطعان المنسدلة (Select)
- ✅ عرض اسم القطيع الوحيد مباشرة
- ✅ إضافة تحقق من وجود القطيع (`poultryStatus &&`)

**التعديل على إرسال البيانات:**

**قبل:**
```typescript
poultry_status_id: selectedPoultryStatusId || undefined,
```

**بعد:**
```typescript
poultry_status_id: poultryStatus?.id || undefined,
```

---

### 4. `app/(dashboard)/farmer/daily-report/page.tsx`

**التعديل على جلب البيانات:**

**قبل:**
```typescript
// Get poultry status
const { data: poultryStatus } = await supabase
  .from("poultry_status")
  .select("*")
  .eq("farm_id", farm.id)
  .order("batch_name");  // ❌ غير ضروري
```

**بعد:**
```typescript
// Get poultry status (one per farm)
const { data: poultryStatus } = await supabase
  .from("poultry_status")
  .select("*")
  .eq("farm_id", farm.id)
  .maybeSingle();  // ✅ جلب سجل واحد فقط
```

**التعديل على تمرير البيانات:**

**قبل:**
```tsx
poultryStatus={poultryStatus || []}
```

**بعد:**
```tsx
poultryStatus={poultryStatus || null}
```

---

## 🎯 الفوائد

### 1. **تبسيط الكود**
- إزالة الحاجة لقوائم منسدلة
- إزالة State غير ضروري
- تقليل عدد الاستعلامات

### 2. **تحسين الأداء**
- استعلامات أسرع (بدون `order` و `limit`)
- عدد أقل من العمليات

### 3. **تحسين تجربة المستخدم**
- واجهة أبسط وأوضح
- عدم الحاجة لاختيار القطيع (يتم تحديده تلقائياً)

### 4. **منع الأخطاء**
- ضمان عدم وجود أكثر من قطيع لنفس المزرعة (على مستوى قاعدة البيانات)
- تقليل احتمالية الأخطاء البرمجية

---

## 🔧 SQL للتطبيق على قاعدة البيانات

### الخطوة 1: حذف القيد القديم
```sql
ALTER TABLE public.poultry_status 
DROP CONSTRAINT IF EXISTS unique_farm_batch;
```

### الخطوة 2: إضافة القيد الجديد
```sql
ALTER TABLE public.poultry_status 
ADD CONSTRAINT unique_farm_id UNIQUE (farm_id);
```

### الخطوة 3: التحقق من البيانات الموجودة
```sql
-- التحقق من وجود مزارع لها أكثر من قطيع
SELECT farm_id, COUNT(*) as count
FROM public.poultry_status
GROUP BY farm_id
HAVING COUNT(*) > 1;
```

**⚠️ ملاحظة:** إذا كانت هناك مزارع لها أكثر من قطيع، يجب حذف أو دمج القطعان الإضافية قبل تطبيق القيد الجديد.

### الخطوة 4: حذف القطعان الإضافية (إذا لزم الأمر)
```sql
-- الاحتفاظ بأحدث قطيع لكل مزرعة وحذف الباقي
DELETE FROM public.poultry_status
WHERE id NOT IN (
  SELECT DISTINCT ON (farm_id) id
  FROM public.poultry_status
  ORDER BY farm_id, created_at DESC
);
```

---

## 🧪 الاختبار

### 1. اختبار قاعدة البيانات
```sql
-- محاولة إضافة قطيع ثاني لنفس المزرعة (يجب أن تفشل)
INSERT INTO public.poultry_status (farm_id, batch_name, opening_chicks)
VALUES ('existing-farm-id', 'قطيع جديد', 1000);
-- Expected: ERROR: duplicate key value violates unique constraint "unique_farm_id"
```

### 2. اختبار الواجهة
- ✅ التحقق من عرض اسم القطيع بدلاً من قائمة
- ✅ التحقق من عدم وجود قائمة منسدلة للقطعان
- ✅ التحقق من إرسال `poultry_status_id` بشكل صحيح

### 3. اختبار الأكشن
- ✅ التحقق من جلب عدد الدجاج للتقرير الأول
- ✅ التحقق من إنشاء فاتورة استهلاك أدوية بشكل صحيح

---

## 📊 مقارنة البيانات

### قبل التعديل:
```json
// مزرعة واحدة → عدة قطعان
{
  "farm_id": "farm-1",
  "poultry_status": [
    { "id": "ps-1", "batch_name": "قطيع 2024-A", },
    { "id": "ps-2", "batch_name": "قطيع 2024-B",  },
    { "id": "ps-3", "batch_name": "قطيع 2025-A",  }
  ]
}
```

### بعد التعديل:
```json
// مزرعة واحدة → قطيع واحد
{
  "farm_id": "farm-1",
  "poultry_status": {
    "id": "ps-1",
    "batch_name": "قطيع 2025",
  }
}
```

---

## 🔮 التأثير على الميزات الأخرى

### ميزات تحتاج تحديث:
1. ✅ **التقرير اليومي** - تم التحديث
2. ✅ **فاتورة استهلاك الأدوية** - تم التحديث
3. ⏳ **صفحة إدارة القطعان** - قد تحتاج تحديث (إن وجدت)
4. ⏳ **التقارير والإحصائيات** - قد تحتاج مراجعة

---

## ✅ الخلاصة

تم تحويل علاقة القطيع من **واحد لكثير** إلى **واحد لواحد** بنجاح:

- ✅ تحديث السكيما
- ✅ تحديث ملفات الأكشن
- ✅ تحديث واجهة المستخدم
- ✅ تبسيط الكود
- ✅ تحسين الأداء

**الحالة:** ✅ جاهز للتطبيق على قاعدة البيانات

---

**تاريخ التعديل:** 2025-10-05  
**الإصدار:** 1.0
