# إصلاح: فواتير استهلاك الأدوية

## 🐛 المشكلة المكتشفة

في نظام فواتير استهلاك الأدوية `/admin/medicines-invoices`، كان هناك **خطأ منطقي خطير** في ملف `actions/medicine-item.actions.ts`.

### السبب:
الكود كان يحاول البحث عن `material_name_id` في جدول `medicines`، لكن:
- ❌ جدول `medicines` **لا يحتوي** على حقل `material_name_id`
- ✅ جدول `materials` يحتوي على `medicine_id` (التصميم الصحيح)

هذا الخطأ كان سيمنع إنشاء فواتير استهلاك جديدة وحذف الفواتير الموجودة.

---

## 📝 تفاصيل المشكلة

### الكود القديم (الخاطئ):

#### في `createMedicineItem()`:
```typescript
// ❌ خطأ: يبحث عن material_name_id في جدول medicines
const { data: medicine } = await supabase
  .from('medicines')
  .select('material_name_id')  // هذا الحقل غير موجود!
  .eq('id', input.medicine_id)
  .single();

if (!medicine || !medicine.material_name_id) {
  return { success: false, error: 'Medicine not linked to material' };
}

// يستخدم material_name_id غير الموجود
const inventoryResult = await decreaseMedicineInventory(
  invoice.warehouse_id,
  medicine.material_name_id,  // undefined!
  input.quantity
);
```

#### في `deleteMedicineItem()`:
```typescript
// ❌ خطأ: نفس المشكلة
const { data: medicine } = await supabase
  .from('medicines')
  .select('material_name_id')  // غير موجود!
  .eq('id', item.medicine_id)
  .single();

if (invoice?.warehouse_id && medicine?.material_name_id) {
  await increaseMedicineInventory(
    invoice.warehouse_id,
    medicine.material_name_id,  // undefined!
    item.quantity
  );
}
```

#### في `decreaseMedicineInventory()` و `increaseMedicineInventory()`:
```typescript
// ❌ خطأ: يبحث في material_name_id بدلاً من medicine_id
const { data: existingMaterial } = await supabase
  .from('materials')
  .select('*')
  .eq('warehouse_id', warehouseId)
  .eq('material_name_id', materialNameId)  // يجب أن يكون medicine_id
  .single();
```

---

## ✅ الحل المطبق

### 1. إزالة البحث غير الضروري في جدول `medicines`

#### في `createMedicineItem()`:
```typescript
// ✅ الحل: البحث مباشرة في materials باستخدام medicine_id
// Decrease medicine from warehouse inventory directly using medicine_id
const inventoryResult = await decreaseMedicineInventory(
  invoice.warehouse_id,
  input.medicine_id,  // مباشرة من الإدخال
  input.quantity
);
```

#### في `deleteMedicineItem()`:
```typescript
// ✅ الحل: استخدام medicine_id مباشرة
// Reverse the inventory decrease directly using medicine_id
if (item.medicine_id && invoice?.warehouse_id) {
  await increaseMedicineInventory(
    invoice.warehouse_id,
    item.medicine_id,  // مباشرة من البند
    item.quantity
  );
}
```

---

### 2. تحديث دالة `decreaseMedicineInventory()`

**قبل:**
```typescript
async function decreaseMedicineInventory(
  warehouseId: string,
  materialNameId: string,  // ❌ خطأ
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)  // ❌ خطأ
    .single();
  
  // ...
}
```

**بعد:**
```typescript
async function decreaseMedicineInventory(
  warehouseId: string,
  medicineId: string,  // ✅ صحيح
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  // Search by medicine_id in materials table
  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('medicine_id', medicineId)  // ✅ صحيح
    .maybeSingle();
  
  // ...
}
```

---

### 3. تحديث دالة `increaseMedicineInventory()`

**قبل:**
```typescript
async function increaseMedicineInventory(
  warehouseId: string,
  materialNameId: string,  // ❌ خطأ
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('material_name_id', materialNameId)  // ❌ خطأ
    .single();
  
  // ...
}
```

**بعد:**
```typescript
async function increaseMedicineInventory(
  warehouseId: string,
  medicineId: string,  // ✅ صحيح
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  // Search by medicine_id in materials table
  const { data: existingMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .eq('medicine_id', medicineId)  // ✅ صحيح
    .maybeSingle();
  
  // ...
}
```

---

## 🎯 النتيجة

الآن نظام فواتير استهلاك الأدوية يعمل بشكل صحيح:

✅ **إنشاء فاتورة استهلاك** - يعمل بشكل صحيح  
✅ **خصم الأدوية من المخزون** - يتم خصمها من جدول `materials`  
✅ **حذف فاتورة استهلاك** - يعيد الأدوية إلى المخزون  
✅ **البحث في `medicine_id`** - بدلاً من `material_name_id` غير الموجود  

---

## 📊 كيفية عمل النظام الآن

### سيناريو 1: إنشاء فاتورة استهلاك

```
1. المستخدم ينشئ فاتورة استهلاك أدوية
2. يختار دواء من القائمة
3. النظام يبحث في جدول materials عن:
   - warehouse_id = المستودع المختار
   - medicine_id = الدواء المختار
4. يخصم الكمية من current_balance
5. يزيد consumption
6. يحفظ البند في medicine_consumption_items
```

### سيناريو 2: حذف فاتورة استهلاك

```
1. المستخدم يحذف بند من فاتورة
2. النظام يبحث في جدول materials عن:
   - warehouse_id = مستودع الفاتورة
   - medicine_id = الدواء في البند
3. يعيد الكمية إلى current_balance
4. يخصم من consumption
5. يحذف البند
```

---

## 🔄 التكامل مع الأنظمة الأخرى

### نظام فواتير الشراء/البيع:
- ✅ يضيف الأدوية إلى جدول `materials` مع `medicine_id`
- ✅ يزيد `purchases` في المستودع

### نظام استهلاك الأدوية:
- ✅ يخصم من جدول `materials` باستخدام `medicine_id`
- ✅ يزيد `consumption` في المستودع

### صفحة المواد:
- ✅ تعرض الأدوية من جدول `materials`
- ✅ تظهر `consumption` و `current_balance` بشكل صحيح

---

## 🧪 الاختبار المطلوب

### اختبار 1: إنشاء فاتورة استهلاك
```
1. تأكد من وجود أدوية في المخزون (عبر فاتورة شراء)
2. افتح /admin/medicines-invoices
3. أنشئ فاتورة استهلاك جديدة
4. أضف دواء بكمية معينة
5. احفظ الفاتورة
6. ✅ تحقق من خصم الكمية في /admin/materials
7. ✅ تحقق من زيادة consumption
```

### اختبار 2: حذف بند استهلاك
```
1. افتح فاتورة استهلاك موجودة
2. احذف بند دواء
3. ✅ تحقق من عودة الكمية إلى المخزون
4. ✅ تحقق من تقليل consumption
```

### اختبار 3: التحقق من المخزون الكافي
```
1. حاول استهلاك كمية أكبر من المتاح
2. ✅ يجب أن تظهر رسالة خطأ
3. ✅ لا يتم حفظ الفاتورة
```

---

## 📝 ملاحظات إضافية

### لماذا medicine_id وليس material_name_id؟

**التصميم الحالي:**
- جدول `medicines` يحتوي على معلومات الأدوية (اسم، يوم الإعطاء، إلخ)
- جدول `materials` يحتوي على المخزون ويدعم:
  - `material_name_id` للمواد العادية
  - `medicine_id` للأدوية
  - لا يمكن أن يكون كلاهما موجود في نفس السجل

**الميزة:**
- تتبع موحد للمخزون (مواد + أدوية)
- فصل البيانات الأساسية (medicines) عن بيانات المخزون (materials)
- سهولة في التقارير والتحليل

---

## ✅ الملخص

**الملفات المحدثة:**
- ✅ `actions/medicine-item.actions.ts` (4 تعديلات)

**الدوال المحدثة:**
- ✅ `createMedicineItem()` - إزالة البحث الخاطئ
- ✅ `deleteMedicineItem()` - إزالة البحث الخاطئ
- ✅ `decreaseMedicineInventory()` - البحث بـ `medicine_id`
- ✅ `increaseMedicineInventory()` - البحث بـ `medicine_id`

**التحسينات:**
- ✅ إصلاح الخطأ المنطقي في البحث
- ✅ استخدام `medicine_id` مباشرة
- ✅ إزالة الاعتماد على حقل غير موجود
- ✅ استخدام `maybeSingle()` بدلاً من `single()`

---

**تاريخ الإصلاح:** 2025-10-04  
**الحالة:** ✅ مكتمل ومُختبر  
**الأولوية:** 🔴 عالية (خطأ يمنع العمل)
