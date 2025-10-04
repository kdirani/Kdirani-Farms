# تعديلات حقول الوزن والوحدة في التقرير اليومي

## 📋 التعديلات المطلوبة

تم إجراء التعديلات التالية على نظام التقرير اليومي المتكامل:

### 1. ✅ إزالة حقل الوزن (weight)
**السبب:** سيتم حذف هذا الحقل من جدول قاعدة البيانات `invoice_items`

**التعديلات:**
- ❌ إزالة حقل "الوزن (اختياري)" من واجهة فاتورة مبيع البيض
- ✅ تم تحديث Type في ملف الأكشن لإزالة `weight?: number`
- ✅ تم تعيين `weight: null` عند إنشاء بنود الفاتورة

### 2. ✅ إضافة حقل الوحدة (unit_id)
**السبب:** لتحديد وحدة القياس لكل بند بشكل صريح

**التعديلات:**
- ✅ إضافة حقل "الوحدة" إلى قسم فاتورة مبيع البيض
- ✅ إضافة حقل "الوحدة" إلى قسم فاتورة مبيع السواد
- ✅ تحديث Types في ملف الأكشن
- ✅ تحديث واجهة المستخدم

---

## 📁 الملفات المُعدلة

### 1. `actions/integrated-daily-report.actions.ts`

#### التعديلات على Types:

**قبل:**
```typescript
export type EggSaleInvoiceItem = {
  egg_weight_id: string;
  quantity: number;
  weight?: number;
  price: number;
};

export type DroppingsSaleInvoiceData = {
  quantity: number;
  price: number;
  client_id?: string;
};
```

**بعد:**
```typescript
export type EggSaleInvoiceItem = {
  egg_weight_id: string;
  unit_id: string;
  quantity: number;
  price: number;
};

export type DroppingsSaleInvoiceData = {
  unit_id: string;
  quantity: number;
  price: number;
  client_id?: string;
};
```

#### التعديلات على إنشاء بنود الفاتورة:

**فاتورة مبيع البيض:**
```typescript
await supabase.from('invoice_items').insert({
  invoice_id: invoice.id,
  material_name_id: eggMaterialId,
  unit_id: item.unit_id,  // ✅ من البند
  egg_weight_id: item.egg_weight_id,
  quantity: item.quantity,
  weight: null,  // ✅ دائماً null
  price: item.price,
  value: value,
});
```

**فاتورة مبيع السواد:**
```typescript
const droppingsMaterialId = await getOrCreateMaterial(
  supabase,
  input.warehouse_id,
  'سواد',
  input.droppingsSaleInvoice.unit_id  // ✅ من المستخدم
);

await supabase.from('invoice_items').insert({
  invoice_id: invoice.id,
  material_name_id: droppingsMaterialId,
  unit_id: input.droppingsSaleInvoice.unit_id,  // ✅ من المستخدم
  quantity: input.droppingsSaleInvoice.quantity,
  price: input.droppingsSaleInvoice.price,
  value: value,
});
```

---

### 2. `components/farmer/integrated-daily-report-form.tsx`

#### التعديلات على State:

**قبل:**
```typescript
const [newEggSaleItem, setNewEggSaleItem] = useState<Partial<EggSaleInvoiceItem & { client_id?: string }>>({
  quantity: 0,
  price: 0,
});

const [droppingsSale, setDroppingsSale] = useState<DroppingsSaleInvoiceData>({
  quantity: 0,
  price: 0,
});
```

**بعد:**
```typescript
const [newEggSaleItem, setNewEggSaleItem] = useState<Partial<EggSaleInvoiceItem & { client_id?: string }>>({
  quantity: 0,
  price: 0,
  unit_id: '',  // ✅ إضافة
});

const [droppingsSale, setDroppingsSale] = useState<Partial<DroppingsSaleInvoiceData>>({
  quantity: 0,
  price: 0,
  unit_id: '',  // ✅ إضافة
});
```

#### التعديلات على Validation:

**قبل:**
```typescript
if (!newEggSaleItem.egg_weight_id || !newEggSaleItem.quantity || !newEggSaleItem.price) {
  toast.error('يرجى ملء جميع حقول بند البيع');
  return;
}
```

**بعد:**
```typescript
if (!newEggSaleItem.egg_weight_id || !newEggSaleItem.unit_id || !newEggSaleItem.quantity || !newEggSaleItem.price) {
  toast.error('يرجى ملء جميع حقول بند البيع');
  return;
}
```

#### التعديلات على واجهة فاتورة مبيع البيض:

**الحقول (من 6 إلى 6 - تم استبدال الوزن بالوحدة):**
1. الزبون (اختياري)
2. وزن البيض ✅
3. **الوحدة** ✅ (جديد - بدلاً من الوزن)
4. الكمية ✅
5. السعر ✅
6. المبلغ (محسوب) ✅

**الكود:**
```tsx
<div className="space-y-2">
  <Label>الوحدة</Label>
  <Select
    value={newEggSaleItem.unit_id || ''}
    onValueChange={(value) => setNewEggSaleItem({ ...newEggSaleItem, unit_id: value })}
    disabled={isLoading}
  >
    <SelectTrigger>
      <SelectValue placeholder="اختر الوحدة" />
    </SelectTrigger>
    <SelectContent>
      {units.map((unit) => (
        <SelectItem key={unit.id} value={unit.id}>
          {unit.unit_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

#### التعديلات على واجهة فاتورة مبيع السواد:

**الحقول (من 4 إلى 5):**
1. الزبون (اختياري)
2. **الوحدة** ✅ (جديد)
3. الكمية ✅
4. السعر ✅
5. المبلغ (محسوب) ✅

**الكود:**
```tsx
<div className="space-y-2">
  <Label>الوحدة</Label>
  <Select
    value={droppingsSale.unit_id || ''}
    onValueChange={(value) => setDroppingsSale({ ...droppingsSale, unit_id: value })}
    disabled={isLoading}
  >
    <SelectTrigger>
      <SelectValue placeholder="اختر الوحدة" />
    </SelectTrigger>
    <SelectContent>
      {units.map((unit) => (
        <SelectItem key={unit.id} value={unit.id}>
          {unit.unit_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

#### التعديلات على عرض البنود المضافة:

**فاتورة مبيع البيض:**
```tsx
{eggSaleItems.map((item, index) => {
  const weight = eggWeights.find(w => w.id === item.egg_weight_id);
  const unit = units.find(u => u.id === item.unit_id);  // ✅ إضافة
  const client = customerClients.find(c => c.id === item.client_id);
  return (
    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
      <div className="flex-1 grid grid-cols-6 gap-2 text-sm">  {/* ✅ من 5 إلى 6 */}
        <span>{client?.name || 'بدون زبون'}</span>
        <span>{weight?.weight_range}</span>
        <span>{unit?.unit_name}</span>  {/* ✅ إضافة */}
        <span>الكمية: {item.quantity}</span>
        <span>السعر: {item.price}</span>
        <span className="font-bold">المبلغ: {(item.quantity * item.price).toFixed(2)}</span>
      </div>
      {/* ... */}
    </div>
  );
})}
```

---

### 3. التوثيق

تم تحديث الملفات التالية:
- ✅ `docs/INTEGRATED_DAILY_REPORT_GUIDE.md`
- ✅ `docs/edits/integrated_daily_report_implementation.md`

---

## 🎯 التأثير على قاعدة البيانات

### جدول `invoice_items`

**الحقول المتأثرة:**
```sql
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  material_name_id uuid REFERENCES public.materials_names(id),
  unit_id uuid REFERENCES public.measurement_units(id),  -- ✅ مطلوب الآن
  egg_weight_id uuid REFERENCES public.egg_weights(id),
  quantity DECIMAL(10,2) DEFAULT 0,
  weight DECIMAL(10,2) DEFAULT NULL,  -- ⚠️ سيتم حذفه لاحقاً
  price DECIMAL(10,2) DEFAULT 0,
  value DECIMAL(12,2) DEFAULT 0
);
```

**ملاحظة:** حقل `weight` سيتم حذفه من السكيما لاحقاً. حالياً يتم تعيينه كـ `null` دائماً.

---

## ✅ الاختبار المطلوب

### 1. فاتورة مبيع البيض
- ✅ التحقق من ظهور حقل "الوحدة"
- ✅ التحقق من عدم ظهور حقل "الوزن (اختياري)"
- ✅ التحقق من أن الوحدة مطلوبة (لا يمكن الإضافة بدونها)
- ✅ التحقق من حفظ `unit_id` في قاعدة البيانات
- ✅ التحقق من أن `weight` يساوي `null`

### 2. فاتورة مبيع السواد
- ✅ التحقق من ظهور حقل "الوحدة"
- ✅ التحقق من أن الوحدة مطلوبة
- ✅ التحقق من حفظ `unit_id` في قاعدة البيانات
- ✅ التحقق من إنشاء مادة "سواد" بالوحدة الصحيحة

### 3. عرض البنود
- ✅ التحقق من عرض الوحدة في قائمة البنود المضافة
- ✅ التحقق من أن العرض يعمل بشكل صحيح (6 أعمدة للبيض)

---

## 📊 مثال على البيانات

### قبل التعديل:
```json
{
  "egg_weight_id": "uuid-1",
  "quantity": 100,
  "weight": 1850.5,  // ❌ سيتم إزالته
  "price": 50
}
```

### بعد التعديل:
```json
{
  "egg_weight_id": "uuid-1",
  "unit_id": "uuid-2",  // ✅ إضافة
  "quantity": 100,
  "price": 50
}
```

---

## 🔄 الخطوات التالية (للمطور)

1. ✅ **تم** - تحديث ملفات الأكشن والواجهة
2. ✅ **تم** - تحديث التوثيق
3. ⏳ **قيد الانتظار** - اختبار التطبيق
4. ⏳ **قيد الانتظار** - حذف حقل `weight` من السكيما (بعد التأكد من عمل كل شيء)

### SQL لحذف حقل weight (بعد الاختبار):
```sql
-- ⚠️ لا تنفذ هذا إلا بعد التأكد من عمل كل شيء بشكل صحيح
ALTER TABLE public.invoice_items DROP COLUMN weight;
```

---

**تاريخ التعديل:** 2025-10-05  
**الحالة:** ✅ تم التنفيذ - جاهز للاختبار
