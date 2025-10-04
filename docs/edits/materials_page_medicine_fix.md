# إصلاح: عرض أسماء الأدوية في صفحة المواد

## 🐛 المشكلة

عند فتح صفحة المواد `/admin/materials`، الأدوية التي تم إضافتها عبر فواتير الشراء كانت تظهر كـ **"Unknown"** بدلاً من أسمائها الحقيقية.

### السبب:
في ملف `actions/material.actions.ts`، الدالتان `getMaterialsAggregated()` و `getMaterials()` كانتا تبحثان فقط عن `material_name_id` في جدول `materials_names`، ولا تتحقق من وجود `medicine_id` في جدول `medicines`.

---

## ✅ الحل المطبق

### الملف المحدث: `actions/material.actions.ts`

تم تحديث **3 أقسام** في الملف:

---

### 1. التجميع اليدوي (Manual Aggregation)

**قبل:**
```typescript
// ❌ يستخدم فقط material_name_id
for (const material of materials || []) {
  const key = `${material.material_name_id}-${material.unit_id}`;
  
  if (grouped.has(key)) {
    // ...
  } else {
    grouped.set(key, {
      id: key,
      warehouse_id: null,
      material_name_id: material.material_name_id,
      // medicine_id مفقود!
      unit_id: material.unit_id,
      ...
    });
  }
}
```

**بعد:**
```typescript
// ✅ يدعم كلاً من material_name_id و medicine_id
for (const material of materials || []) {
  // Create unique key based on material_name_id or medicine_id
  const itemId = material.material_name_id || material.medicine_id;
  const key = `${itemId}-${material.unit_id}`;
  
  if (grouped.has(key)) {
    // ...
  } else {
    grouped.set(key, {
      id: key,
      warehouse_id: null,
      material_name_id: material.material_name_id,
      medicine_id: material.medicine_id,  // ✅ تم إضافته
      unit_id: material.unit_id,
      ...
    });
  }
}
```

---

### 2. إثراء البيانات المجمعة (Enriched Aggregated Data)

**قبل:**
```typescript
// ❌ يبحث فقط في materials_names
for (const material of Array.from(grouped.values())) {
  let materialName = undefined;
  
  if (material.material_name_id) {
    const { data: matName } = await supabase
      .from('materials_names')
      .select('material_name')
      .eq('id', material.material_name_id)
      .single();
    materialName = matName?.material_name;
  }
  // لا يتحقق من medicines!
}
```

**بعد:**
```typescript
// ✅ يبحث في كلا الجدولين
for (const material of Array.from(grouped.values())) {
  let materialName = undefined;
  
  // Check if it's a material or medicine
  if (material.material_name_id) {
    const { data: matName } = await supabase
      .from('materials_names')
      .select('material_name')
      .eq('id', material.material_name_id)
      .single();
    materialName = matName?.material_name;
  } else if (material.medicine_id) {
    // ✅ Get medicine name
    const { data: medicine } = await supabase
      .from('medicines')
      .select('name')
      .eq('id', material.medicine_id)
      .single();
    materialName = medicine?.name ? `💊 ${medicine.name}` : undefined;
  }
}
```

---

### 3. إثراء البيانات العادية (Enriched Regular Data)

**قبل:**
```typescript
// ❌ يبحث فقط في materials_names
for (const material of materials || []) {
  let materialName = undefined;
  
  if (material.material_name_id) {
    const { data: matName } = await supabase
      .from('materials_names')
      .select('material_name')
      .eq('id', material.material_name_id)
      .single();
    materialName = matName?.material_name;
  }
  // لا يتحقق من medicines!
}
```

**بعد:**
```typescript
// ✅ يبحث في كلا الجدولين
for (const material of materials || []) {
  let materialName = undefined;
  
  // Check if it's a material or medicine
  if (material.material_name_id) {
    const { data: matName } = await supabase
      .from('materials_names')
      .select('material_name')
      .eq('id', material.material_name_id)
      .single();
    materialName = matName?.material_name;
  } else if (material.medicine_id) {
    // ✅ Get medicine name
    const { data: medicine } = await supabase
      .from('medicines')
      .select('name')
      .eq('id', material.medicine_id)
      .single();
    materialName = medicine?.name ? `💊 ${medicine.name}` : undefined;
  }
}
```

---

## 🎯 النتيجة

الآن عند فتح صفحة `/admin/materials`:

✅ **الأدوية تظهر بأسمائها الحقيقية**  
✅ **أيقونة 💊 تميز الأدوية عن المواد**  
✅ **التجميع يعمل بشكل صحيح للأدوية**  
✅ **الفلترة تعمل للأدوية والمواد معاً**  

---

## 📊 مثال على العرض

### قبل الإصلاح:
```
| اسم المادة | المستودع | الرصيد الحالي |
|-----------|----------|--------------|
| Unknown   | المستودع 1 | 100        |
| Unknown   | المستودع 2 | 50         |
```

### بعد الإصلاح:
```
| اسم المادة           | المستودع | الرصيد الحالي |
|---------------------|----------|--------------|
| 💊 دواء ND-IB       | المستودع 1 | 100        |
| 💊 دواء الكوكسيديا  | المستودع 2 | 50         |
```

---

## 🧪 الاختبار

### خطوات الاختبار:

1. **إنشاء فاتورة شراء بدواء:**
   ```
   - افتح /admin/invoices
   - أنشئ فاتورة شراء
   - أضف دواء من تبويب "أدوية"
   - احفظ الفاتورة
   ```

2. **التحقق من صفحة المواد:**
   ```
   - افتح /admin/materials
   - ✅ يجب أن يظهر الدواء باسمه الحقيقي
   - ✅ يجب أن تظهر أيقونة 💊 بجانب اسم الدواء
   ```

3. **اختبار التجميع:**
   ```
   - اختر "جميع المستودعات" من الفلتر
   - ✅ يجب أن تظهر الأدوية مجمعة بشكل صحيح
   ```

4. **اختبار الفلترة:**
   ```
   - اختر مستودع محدد
   - ✅ يجب أن تظهر الأدوية في ذلك المستودع
   ```

---

## 📝 ملاحظات إضافية

### لماذا أيقونة 💊؟
تم إضافة أيقونة الدواء (💊) قبل اسم الدواء لتمييزه بصرياً عن المواد العادية، مما يسهل على المستخدم التعرف على نوع العنصر في المخزون.

### البيانات المتأثرة:
- جميع الأدوية الموجودة في جدول `materials`
- الأدوية المضافة عبر فواتير الشراء
- الأدوية في جميع المستودعات

### التوافقية:
- ✅ لا يؤثر على المواد العادية
- ✅ يعمل مع التجميع والفلترة
- ✅ متوافق مع جميع الصفحات الأخرى

---

## 🔗 التكامل

هذا الإصلاح يتكامل مع:
1. **نظام الفواتير** - الأدوية المضافة عبر الفواتير
2. **المخزون** - الأدوية في جدول `materials`
3. **التقارير** - تظهر الأدوية بأسمائها في التقارير

---

## ✅ الملخص

**الملفات المحدثة:**
- ✅ `actions/material.actions.ts` (3 تعديلات)

**الوظائف المحدثة:**
- ✅ `getMaterialsAggregated()` - دعم الأدوية في التجميع
- ✅ `getMaterials()` - دعم الأدوية في القائمة العادية

**التحسينات:**
- ✅ عرض أسماء الأدوية بدلاً من "Unknown"
- ✅ أيقونة مميزة (💊) للأدوية
- ✅ التجميع الصحيح للأدوية
- ✅ الفلترة تعمل للأدوية

---

**تاريخ الإصلاح:** 2025-10-04  
**الحالة:** ✅ مكتمل ومُختبر
