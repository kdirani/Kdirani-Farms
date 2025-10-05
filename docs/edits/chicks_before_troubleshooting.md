# استكشاف أخطاء "العدد قبل" = صفر

## 🐛 المشكلة

في التقرير الأول، يجب أن يُجلب "العدد قبل" من `poultry_status.remaining_chicks`، لكن القيمة المعروضة هي **0**.

---

## 🔍 خطوات التحقق

### 1️⃣ فتح Console في المتصفح

افتح Developer Tools (F12) → Console

ستجد سلسلة من الـ logs:

```
[getChicksBeforeForNewReport] Called for warehouse: xxx-xxx-xxx
[getChicksBeforeValue] Starting for warehouse: xxx-xxx-xxx
[getChicksBeforeValue] Is first report: true
[getChicksBeforeValue] Getting from poultry status...
[getChicksFromPoultryStatus] Starting for warehouse: xxx-xxx-xxx
[getChicksFromPoultryStatus] Found farm_id: xxx-xxx-xxx
[getChicksFromPoultryStatus] Found remaining_chicks: 10000  ← القيمة المتوقعة
[getChicksBeforeValue] Returning value from poultry: 10000
[getChicksBeforeForNewReport] Success! Returning value: 10000
```

---

## 🚨 السيناريوهات المحتملة

### السيناريو 1: المزرعة ليس لها قطيع ❌

**الـ Logs:**
```
[getChicksFromPoultryStatus] Starting for warehouse: xxx-xxx-xxx
[getChicksFromPoultryStatus] Found farm_id: xxx-xxx-xxx
[getChicksFromPoultryStatus] No poultry status found for farm: xxx-xxx-xxx  ← المشكلة
```

**الحل:**
```sql
-- التحقق من وجود قطيع للمزرعة
SELECT ps.*, f.name as farm_name
FROM farms f
LEFT JOIN poultry_status ps ON f.id = ps.farm_id
WHERE f.id = 'farm-id-here';

-- إذا لم يوجد قطيع، أنشئ واحد:
INSERT INTO poultry_status (farm_id, batch_name, opening_chicks, remaining_chicks)
VALUES ('farm-id-here', 'قطيع 2025', 10000, 10000);
```

---

### السيناريو 2: القطيع موجود لكن remaining_chicks = 0 ⚠️

**الـ Logs:**
```
[getChicksFromPoultryStatus] Starting for warehouse: xxx-xxx-xxx
[getChicksFromPoultryStatus] Found farm_id: xxx-xxx-xxx
[getChicksFromPoultryStatus] Found remaining_chicks: 0  ← القيمة فعلاً صفر!
```

**الحل:**
```sql
-- التحقق من القيمة
SELECT * FROM poultry_status WHERE farm_id = 'farm-id-here';

-- تحديث القيمة:
UPDATE poultry_status
SET 
  opening_chicks = 10000,
  remaining_chicks = 10000
WHERE farm_id = 'farm-id-here';
```

---

### السيناريو 3: المستودع ليس مرتبط بمزرعة ❌

**الـ Logs:**
```
[getChicksFromPoultryStatus] Starting for warehouse: xxx-xxx-xxx
[getChicksFromPoultryStatus] Warehouse not found  ← المشكلة
```

**الحل:**
```sql
-- التحقق من المستودع
SELECT w.*, f.name as farm_name
FROM warehouses w
LEFT JOIN farms f ON w.farm_id = f.id
WHERE w.id = 'warehouse-id-here';

-- إذا كان farm_id = null، حدّثه:
UPDATE warehouses
SET farm_id = 'correct-farm-id'
WHERE id = 'warehouse-id-here';
```

---

### السيناريو 4: خطأ في الصلاحيات 🔒

**الـ Logs:**
```
[getChicksFromPoultryStatus] Error fetching poultry status: { code: "PGRST116", ... }
```

**الحل:**
تحقق من Row Level Security (RLS) policies:

```sql
-- التحقق من الـ policies
SELECT * FROM pg_policies WHERE tablename = 'poultry_status';

-- إذا لزم الأمر، أضف policy:
CREATE POLICY "Allow farmers to read their poultry status"
ON poultry_status
FOR SELECT
TO authenticated
USING (
  farm_id IN (
    SELECT farm_id FROM warehouses
    WHERE id IN (
      SELECT warehouse_id FROM warehouse_access
      WHERE user_id = auth.uid()
    )
  )
);
```

---

## 🔧 خطوات التشخيص

### الخطوة 1: تحقق من warehouse_id

في الـ Console، ابحث عن:
```
[getChicksBeforeForNewReport] Called for warehouse: xxx-xxx-xxx
```

انسخ الـ `warehouse_id` واستخدمه في الاستعلامات التالية.

---

### الخطوة 2: تحقق من المستودع والمزرعة

```sql
SELECT 
  w.id as warehouse_id,
  w.name as warehouse_name,
  w.farm_id,
  f.name as farm_name,
  f.id as actual_farm_id
FROM warehouses w
LEFT JOIN farms f ON w.farm_id = f.id
WHERE w.id = 'warehouse-id-from-console';
```

**النتيجة المتوقعة:**
- `farm_id` يجب أن يكون موجود (ليس null)
- `farm_name` يجب أن يظهر

---

### الخطوة 3: تحقق من القطيع

```sql
SELECT 
  ps.*,
  f.name as farm_name
FROM poultry_status ps
JOIN farms f ON ps.farm_id = f.id
WHERE ps.farm_id = (
  SELECT farm_id 
  FROM warehouses 
  WHERE id = 'warehouse-id-from-console'
);
```

**النتيجة المتوقعة:**
- يجب أن يعود سجل واحد
- `remaining_chicks` يجب أن يكون > 0

---

### الخطوة 4: تحقق من التقارير السابقة

```sql
SELECT COUNT(*) as total_reports
FROM daily_reports
WHERE warehouse_id = 'warehouse-id-from-console';
```

**النتيجة المتوقعة:**
- إذا كانت `0` → هذا التقرير الأول ✅
- إذا كانت > 0 → يجب أن يجلب من آخر تقرير

---

## 🛠️ الحلول السريعة

### الحل 1: إنشاء قطيع جديد

```sql
-- استبدل 'your-farm-id' بـ farm_id الفعلي
INSERT INTO poultry_status (
  farm_id, 
  batch_name, 
  opening_chicks, 
  dead_chicks,
  remaining_chicks
)
VALUES (
  'your-farm-id',
  'قطيع 2025',
  10000,
  0,
  10000
)
ON CONFLICT (farm_id) DO UPDATE
SET 
  opening_chicks = EXCLUDED.opening_chicks,
  remaining_chicks = EXCLUDED.remaining_chicks;
```

---

### الحل 2: تحديث القطيع الموجود

```sql
UPDATE poultry_status
SET 
  opening_chicks = 10000,
  remaining_chicks = 10000,
  dead_chicks = 0
WHERE farm_id = 'your-farm-id';
```

---

### الحل 3: ربط المستودع بالمزرعة

```sql
-- إذا كان المستودع غير مرتبط بمزرعة
UPDATE warehouses
SET farm_id = 'correct-farm-id'
WHERE id = 'warehouse-id';
```

---

## 📋 Checklist للتحقق

قبل إنشاء التقرير الأول، تأكد من:

- [ ] المستودع موجود ومرتبط بمزرعة (`warehouses.farm_id` ليس null)
- [ ] المزرعة لها قطيع واحد (`poultry_status` موجود)
- [ ] القطيع له قيمة `remaining_chicks > 0`
- [ ] المستخدم له صلاحيات قراءة `poultry_status`
- [ ] لا يوجد تقارير سابقة (أو إذا وُجدت، آخر تقرير له `chicks_after > 0`)

---

## 🧪 اختبار التكامل

### Test Script:

```javascript
// في Console المتصفح
async function testChicksBeforeValue() {
  const warehouseId = 'your-warehouse-id'; // استبدل بالـ ID الفعلي
  
  try {
    const response = await fetch('/api/get-chicks-before', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouseId })
    });
    
    const result = await response.json();
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ Success! Value:', result.data);
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testChicksBeforeValue();
```

---

## 📞 الدعم

إذا استمرت المشكلة بعد التحقق من كل الخطوات:

1. **أرسل logs Console كاملة**
2. **أرسل نتائج الاستعلامات SQL**
3. **اذكر الخطوات التي قمت بها**

---

## ✅ الخلاصة

**المشكلة الأكثر شيوعاً:**
- المزرعة ليس لها قطيع
- القطيع موجود لكن `remaining_chicks = 0`

**الحل الأسرع:**
```sql
-- إنشاء أو تحديث القطيع
INSERT INTO poultry_status (farm_id, batch_name, opening_chicks, remaining_chicks)
VALUES ('farm-id', 'قطيع 2025', 10000, 10000)
ON CONFLICT (farm_id) DO UPDATE
SET remaining_chicks = 10000;
```

**بعد الحل:**
- أعد تحميل الصفحة
- تحقق من Console
- يجب أن ترى القيمة الصحيحة

---

**تاريخ الإنشاء:** 2025-10-05  
**الحالة:** 🔍 دليل استكشاف الأخطاء
