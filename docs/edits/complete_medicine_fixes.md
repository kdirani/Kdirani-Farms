# تقرير شامل: إصلاح جميع المشاكل المتعلقة بالأدوية في نظام الفواتير

## 📋 نظرة عامة

تم اكتشاف وإصلاح **4 مشاكل رئيسية** في دعم الأدوية ضمن نظام الفواتير.

---

## 🐛 المشاكل المكتشفة والحلول

### ✅ المشكلة #1: عدم حفظ `medicine_id` عند إنشاء بند فاتورة

**الملف:** `actions/invoice-item.actions.ts`  
**الدالة:** `createInvoiceItem`

#### المشكلة:
```typescript
// ❌ الكود القديم
.insert({
  invoice_id: input.invoice_id,
  material_name_id: input.material_name_id || null,
  // medicine_id مفقود!
  unit_id: input.unit_id,
  ...
})
```

#### الحل:
```typescript
// ✅ الكود الجديد
.insert({
  invoice_id: input.invoice_id,
  material_name_id: input.material_name_id || null,
  medicine_id: input.medicine_id || null,  // تم إضافته
  unit_id: input.unit_id,
  ...
})
```

---

### ✅ المشكلة #2: عدم تحديث المخزون للأدوية

**الملف:** `actions/invoice-item.actions.ts`  
**الدالة:** `createInvoiceItem`

#### المشكلة:
```typescript
// ❌ الكود القديم - يحدث المخزون للمواد فقط
if (input.material_name_id && invoice.warehouse_id) {
  await updateWarehouseInventory(...);
}
// الأدوية لا يتم تحديث مخزونها!
```

#### الحل:
```typescript
// ✅ الكود الجديد - يدعم المواد والأدوية
if (invoice.warehouse_id) {
  if (input.material_name_id) {
    await updateWarehouseInventory(
      invoice.warehouse_id,
      input.material_name_id,
      ...
    );
  } else if (input.medicine_id) {
    await updateWarehouseInventory(
      invoice.warehouse_id,
      input.medicine_id,  // يدعم الأدوية
      ...
    );
  }
}
```

---

### ✅ المشكلة #3: دالة تحديث المخزون لا تدعم الأدوية

**الملف:** `actions/invoice-item.actions.ts`  
**الدالة:** `updateWarehouseInventory`

#### المشكلة:
```typescript
// ❌ الكود القديم
async function updateWarehouseInventory(
  warehouseId: string,
  materialNameId: string,  // اسم محدد للمواد فقط
  ...
) {
  // يبحث فقط في material_name_id
  const { data } = await supabase
    .from('materials')
    .eq('material_name_id', materialNameId)
    .single();
}
```

#### الحل:
```typescript
// ✅ الكود الجديد
async function updateWarehouseInventory(
  warehouseId: string,
  materialOrMedicineId: string,  // اسم عام
  ...
) {
  // البحث في كلا العمودين
  let existingMaterial;
  
  // أولاً: material_name_id
  const { data: materialData } = await supabase
    .from('materials')
    .eq('material_name_id', materialOrMedicineId)
    .maybeSingle();
  
  // ثانياً: medicine_id
  if (!materialData) {
    const { data: medicineData } = await supabase
      .from('materials')
      .eq('medicine_id', materialOrMedicineId)
      .maybeSingle();
    existingMaterial = medicineData;
  } else {
    existingMaterial = materialData;
  }
  
  // عند الإنشاء، التحقق من النوع
  if (!existingMaterial) {
    const { data: medicineCheck } = await supabase
      .from('medicines')
      .select('id')
      .eq('id', materialOrMedicineId)
      .maybeSingle();
    
    const isMedicine = !!medicineCheck;
    
    await supabase.from('materials').insert({
      warehouse_id: warehouseId,
      material_name_id: isMedicine ? null : materialOrMedicineId,
      medicine_id: isMedicine ? materialOrMedicineId : null,
      ...
    });
  }
}
```

---

### ✅ المشكلة #4: دالة حذف البند لا تدعم الأدوية

**الملف:** `actions/invoice-item.actions.ts`  
**الدالة:** `deleteInvoiceItem` و `reverseWarehouseInventory`

#### المشكلة:
```typescript
// ❌ الكود القديم
const { data: item } = await supabase
  .from('invoice_items')
  .select('invoice_id, material_name_id, unit_id, quantity')  // medicine_id مفقود
  .eq('id', id)
  .single();

// يتحقق من material_name_id فقط
if (item.material_name_id && invoice?.warehouse_id) {
  await reverseWarehouseInventory(
    invoice.warehouse_id,
    item.material_name_id,  // لا يدعم الأدوية
    ...
  );
}
```

#### الحل:
```typescript
// ✅ الكود الجديد
const { data: item } = await supabase
  .from('invoice_items')
  .select('invoice_id, material_name_id, medicine_id, unit_id, quantity')  // تم إضافة medicine_id
  .eq('id', id)
  .single();

// يدعم كلاهما
if (invoice?.warehouse_id) {
  const itemId = item.material_name_id || item.medicine_id;  // يدعم الاثنين
  if (itemId) {
    await reverseWarehouseInventory(
      invoice.warehouse_id,
      itemId,
      ...
    );
  }
}
```

**تحديث `reverseWarehouseInventory`:**
```typescript
// ✅ الكود الجديد - نفس منطق updateWarehouseInventory
async function reverseWarehouseInventory(
  warehouseId: string,
  materialOrMedicineId: string,  // يدعم الاثنين
  ...
) {
  // البحث في كلا العمودين (نفس المنطق)
  let existingMaterial;
  
  const { data: materialData } = await supabase
    .from('materials')
    .eq('material_name_id', materialOrMedicineId)
    .maybeSingle();
  
  if (!materialData) {
    const { data: medicineData } = await supabase
      .from('materials')
      .eq('medicine_id', materialOrMedicineId)
      .maybeSingle();
    existingMaterial = medicineData;
  } else {
    existingMaterial = materialData;
  }
  
  // عكس العملية
  ...
}
```

---

### ✅ المشكلة #5: واجهة إضافة بند لا تدعم الأدوية

**الملف:** `components/admin/invoices/add-invoice-item-dialog.tsx`

#### المشكلة:
الواجهة لم تكن تدعم إضافة أدوية عند تحرير فاتورة موجودة.

#### الحل:
تم إضافة Tabs مثل `create-invoice-dialog.tsx`:

```typescript
// ✅ إضافة استيراد getMedicines
import { getMedicines } from '@/actions/medicine.actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill } from 'lucide-react';

// ✅ إضافة state للأدوية
const [medicines, setMedicines] = useState<Array<...>>([]);
const [itemType, setItemType] = useState<'material' | 'medicine'>('material');

// ✅ جلب الأدوية
const loadData = async () => {
  const [materialsResult, medicinesResult, ...] = await Promise.all([
    getMaterialNames(),
    getMedicines(),  // تم إضافته
    ...
  ]);
  
  if (medicinesResult.success) {
    setMedicines(medicinesResult.data);
  }
};

// ✅ إضافة medicine_id في schema
const itemSchema = z.object({
  material_name_id: z.string().optional(),
  medicine_id: z.string().optional(),  // تم إضافته
  ...
});

// ✅ إضافة Tabs في الواجهة
<Tabs value={itemType} onValueChange={...}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="material">مواد</TabsTrigger>
    <TabsTrigger value="medicine">
      <Pill className="h-4 w-4 ml-2" />
      أدوية
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="material">
    {/* حقول المواد */}
  </TabsContent>
  
  <TabsContent value="medicine">
    {/* حقول الأدوية */}
  </TabsContent>
</Tabs>

// ✅ تحديث onSubmit
const onSubmit = async (data: ItemFormData) => {
  // التحقق من اختيار مادة أو دواء
  if (!data.material_name_id && !data.medicine_id) {
    toast.error('يجب اختيار مادة أو دواء');
    return;
  }
  
  const result = await createInvoiceItem({
    invoice_id: invoiceId,
    material_name_id: data.material_name_id,
    medicine_id: data.medicine_id,  // تم إضافته
    ...
  });
};
```

---

## 📊 ملخص التغييرات

### الملفات المحدثة:

| الملف | عدد التغييرات | الوصف |
|-------|---------------|-------|
| `actions/invoice-item.actions.ts` | 5 دوال | دعم كامل للأدوية في جميع العمليات |
| `components/admin/invoices/add-invoice-item-dialog.tsx` | 8 تعديلات | إضافة Tabs والأدوية |
| `components/admin/invoices/create-invoice-dialog.tsx` | تم مسبقاً | دعم الأدوية في إنشاء الفاتورة |
| `components/admin/invoices/invoice-items-section.tsx` | تم مسبقاً | عرض الأدوية في الجدول |
| `types/database.types.ts` | تم مسبقاً | إضافة medicine_id |

---

## 🎯 الوظائف المدعومة الآن

### ✅ العمليات الكاملة:

1. **إنشاء فاتورة شراء بأدوية**
   - يتم حفظ البند مع `medicine_id`
   - يتم إضافة الدواء إلى المستودع
   - يتم تحديث المخزون بشكل صحيح

2. **إنشاء فاتورة بيع بأدوية**
   - يتم التحقق من المخزون
   - يتم خصم الكمية من المخزون
   - يظهر تحذير إذا كان المخزون غير كافٍ

3. **إضافة بند دواء لفاتورة موجودة**
   - عبر واجهة `AddInvoiceItemDialog`
   - نفس الوظائف مثل إنشاء الفاتورة

4. **حذف بند دواء**
   - يتم عكس العملية على المخزون
   - يتم تحديث إجماليات الفاتورة

5. **عرض الأدوية**
   - في صفحة تفاصيل الفاتورة
   - مع أيقونة مميزة 💊
   - عرض يوم الإعطاء

---

## 🧪 سيناريوهات الاختبار

### ✅ اختبار 1: فاتورة شراء بأدوية
```
1. إنشاء فاتورة شراء جديدة
2. اختيار مستودع
3. إضافة دواء من تبويب "أدوية"
4. حفظ الفاتورة
5. التحقق من:
   - ✅ ظهور الدواء في تفاصيل الفاتورة
   - ✅ إضافة الدواء إلى صفحة المواد
   - ✅ تحديث المخزون بشكل صحيح
```

### ✅ اختبار 2: فاتورة بيع بأدوية
```
1. التأكد من وجود أدوية في المخزون
2. إنشاء فاتورة بيع
3. إضافة دواء من المخزون
4. حفظ الفاتورة
5. التحقق من:
   - ✅ خصم الكمية من المخزون
   - ✅ تحديث المبيعات
```

### ✅ اختبار 3: إضافة دواء لفاتورة موجودة
```
1. فتح فاتورة موجودة
2. النقر على "إضافة عنصر"
3. اختيار تبويب "أدوية"
4. إضافة دواء
5. التحقق من:
   - ✅ ظهور الدواء في قائمة البنود
   - ✅ تحديث المخزون
   - ✅ تحديث إجمالي الفاتورة
```

### ✅ اختبار 4: حذف بند دواء
```
1. حذف بند دواء من فاتورة
2. التحقق من:
   - ✅ عكس العملية على المخزون
   - ✅ تحديث إجمالي الفاتورة
```

---

## 🔄 التكامل الكامل

### نقاط التكامل:

1. **قاعدة البيانات**
   - جدول `invoice_items` يحتوي على `medicine_id`
   - جدول `materials` يحتوي على `medicine_id`
   - القيود تضمن وجود مادة أو دواء

2. **Server Actions**
   - جميع الدوال تدعم `medicine_id`
   - المخزون يُحدث للأدوية
   - عمليات العكس (Reverse) تعمل

3. **واجهات المستخدم**
   - Tabs للتبديل بين المواد والأدوية
   - أيقونات مميزة 💊
   - رسائل واضحة

4. **التحقق والتأكيد**
   - التحقق من المخزون للبيع
   - رسائل خطأ واضحة
   - تحذيرات للمخزون المنخفض

---

## 📝 ملاحظات إضافية

### الفرق بين الأنظمة:

1. **فواتير الشراء/البيع** (`invoices`)
   - تدعم المواد والأدوية
   - للتعامل مع الموردين والعملاء
   - تحديث المخزون في جدول `materials`

2. **فواتير استهلاك الأدوية** (`medicine_consumption_invoices`)
   - للأدوية فقط
   - للاستهلاك الداخلي للدواجن
   - نظام منفصل تماماً

---

## ✅ الخلاصة

تم إصلاح **جميع المشاكل** المتعلقة بدعم الأدوية في نظام الفواتير:

✅ حفظ `medicine_id` في قاعدة البيانات  
✅ تحديث المخزون للأدوية (شراء وبيع)  
✅ دعم البحث في `medicine_id` و `material_name_id`  
✅ عكس العمليات عند الحذف  
✅ واجهة إضافة بند تدعم الأدوية  
✅ عرض الأدوية في جميع الواجهات  

**النظام الآن يدعم الأدوية بشكل كامل ومتكامل! 🎉**

---

**تاريخ الإصلاح:** 2025-10-04  
**الحالة:** ✅ مكتمل ومُختبر
