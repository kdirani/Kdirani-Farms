# إصلاح مشكلة إنشاء فاتورة شراء بأدوية

## 🐛 المشكلة
عند محاولة إنشاء فاتورة شراء مع بنود أدوية:
- تظهر رسالة نجاح
- لكن لا يتم إضافة المادة (الدواء) إلى المستودع
- ولا يتم حفظ بيانات الفاتورة بشكل صحيح

## 🔍 السبب الجذري

### 1. عدم حفظ `medicine_id` في قاعدة البيانات
في الملف `actions/invoice-item.actions.ts`، دالة `createInvoiceItem` كانت لا تُدرج حقل `medicine_id` عند إنشاء بند جديد.

```typescript
// ❌ الكود القديم - لا يحتوي على medicine_id
.insert({
  invoice_id: input.invoice_id,
  material_name_id: input.material_name_id || null,
  // medicine_id مفقود هنا!
  unit_id: input.unit_id,
  ...
})
```

### 2. عدم تحديث المخزون للأدوية
الكود كان يتحقق فقط من وجود `material_name_id` لتحديث المخزون، وبالتالي كانت الأدوية لا تُضاف إلى المستودع.

```typescript
// ❌ الكود القديم
if (input.material_name_id && invoice.warehouse_id) {
  // يتم تحديث المخزون للمواد فقط
}
// الأدوية لا يتم تحديث مخزونها!
```

### 3. دالة تحديث المخزون لا تدعم الأدوية
دالة `updateWarehouseInventory` كانت تبحث فقط عن `material_name_id` في جدول `materials`، ولا تدعم `medicine_id`.

---

## ✅ الحل المطبق

### 1. إضافة `medicine_id` عند الإدراج

**الملف:** `actions/invoice-item.actions.ts` - السطر 159-173

```typescript
const { data: newItem, error } = await supabase
  .from('invoice_items')
  .insert({
    invoice_id: input.invoice_id,
    material_name_id: input.material_name_id || null,
    medicine_id: input.medicine_id || null,  // ✅ تم إضافته
    unit_id: input.unit_id,
    egg_weight_id: input.egg_weight_id || null,
    quantity: input.quantity,
    weight: input.weight || null,
    price: input.price,
    value: value,
  })
  .select()
  .single();
```

---

### 2. دعم تحديث المخزون للأدوية

**الملف:** `actions/invoice-item.actions.ts` - السطر 144-172

```typescript
// Update warehouse inventory if material_name_id or medicine_id is provided
if (invoice.warehouse_id) {
  if (input.material_name_id) {
    // تحديث مخزون المواد
    const inventoryResult = await updateWarehouseInventory(
      invoice.warehouse_id,
      input.material_name_id,
      input.unit_id,
      input.quantity,
      invoice.invoice_type
    );

    if (!inventoryResult.success) {
      return { success: false, error: inventoryResult.error };
    }
  } else if (input.medicine_id) {
    // ✅ تحديث مخزون الأدوية
    const inventoryResult = await updateWarehouseInventory(
      invoice.warehouse_id,
      input.medicine_id,
      input.unit_id,
      input.quantity,
      invoice.invoice_type
    );

    if (!inventoryResult.success) {
      return { success: false, error: inventoryResult.error };
    }
  }
}
```

---

### 3. تحديث دالة `updateWarehouseInventory`

**الملف:** `actions/invoice-item.actions.ts` - السطر 306-411

#### التغييرات الرئيسية:

**أ) تغيير اسم المعامل:**
```typescript
// ❌ قبل
async function updateWarehouseInventory(
  warehouseId: string,
  materialNameId: string,  // اسم محدد للمواد فقط
  ...
)

// ✅ بعد
async function updateWarehouseInventory(
  warehouseId: string,
  materialOrMedicineId: string,  // اسم عام يدعم الاثنين
  ...
)
```

**ب) البحث في كلا العمودين:**
```typescript
// ✅ البحث عن المادة أو الدواء
let existingMaterial;

// أولاً: البحث في material_name_id
const { data: materialData } = await supabase
  .from('materials')
  .select('*')
  .eq('warehouse_id', warehouseId)
  .eq('material_name_id', materialOrMedicineId)
  .maybeSingle();

// ثانياً: إذا لم يُعثر عليها، البحث في medicine_id
if (!materialData) {
  const { data: medicineData } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('medicine_id', materialOrMedicineId)
    .maybeSingle();
  existingMaterial = medicineData;
} else {
  existingMaterial = materialData;
}
```

**ج) إنشاء سجل جديد بذكاء:**
```typescript
// ✅ تحديد نوع السجل قبل الإنشاء
if (!existingMaterial) {
  // التحقق من جدول medicines لمعرفة النوع
  const { data: medicineCheck } = await supabase
    .from('medicines')
    .select('id')
    .eq('id', materialOrMedicineId)
    .maybeSingle();
  
  const isMedicine = !!medicineCheck;
  
  // الإدراج بالقيم الصحيحة
  await supabase
    .from('materials')
    .insert({
      warehouse_id: warehouseId,
      material_name_id: isMedicine ? null : materialOrMedicineId,
      medicine_id: isMedicine ? materialOrMedicineId : null,
      unit_id: unitId,
      opening_balance: 0,
      purchases: quantity,
      sales: 0,
      consumption: 0,
      manufacturing: 0,
      current_balance: quantity,
    });
}
```

---

## 🎯 النتيجة

الآن عند إنشاء فاتورة شراء بأدوية:

✅ يتم حفظ `medicine_id` في جدول `invoice_items`  
✅ يتم إضافة الدواء إلى جدول `materials` في المستودع  
✅ يتم تحديث المخزون بشكل صحيح  
✅ تظهر الأدوية في صفحة المواد `/admin/materials`  
✅ يمكن بيع الأدوية من المخزون لاحقاً  

---

## 🧪 الاختبار

### اختبار 1: فاتورة شراء بأدوية
1. افتح صفحة الفواتير `/admin/invoices`
2. انقر "إنشاء فاتورة جديدة"
3. اختر نوع الفاتورة: **شراء**
4. اختر مستودع
5. في قسم "بنود الفاتورة"، انتقل إلى تبويب **"أدوية"**
6. اختر دواء، أدخل الكمية والسعر
7. انقر زر (+) لإضافة البند
8. احفظ الفاتورة
9. ✅ تحقق من صفحة المواد - يجب أن يظهر الدواء في المخزون

### اختبار 2: فاتورة بيع للأدوية
1. أنشئ فاتورة **بيع**
2. حاول إضافة دواء موجود في المخزون
3. ✅ يجب أن يعمل بدون مشاكل ويخصم من المخزون

---

## 📄 الملفات المحدثة

```
✅ actions/invoice-item.actions.ts
  - إضافة medicine_id عند الإدراج (السطر 164)
  - دعم تحديث المخزون للأدوية (السطر 158-171)
  - تحديث دالة updateWarehouseInventory (السطر 306-411)
```

---

## 🔄 ملاحظات إضافية

### الفرق بين جدول `materials` و `medicine_consumption_items`

- **جدول `materials`**: يحتوي على مخزون **كل من** المواد والأدوية للمستودعات (للشراء/البيع)
- **جدول `medicine_consumption_items`**: يحتوي على استهلاك الأدوية **الداخلي** للدواجن فقط

هذا التصميم يسمح بـ:
- تتبع الأدوية كمنتجات للشراء والبيع
- تتبع استهلاك الأدوية للدواجن بشكل منفصل

---

**تاريخ الإصلاح:** 2025-10-04  
**الحالة:** ✅ تم الحل
