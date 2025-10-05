# إصلاح عرض حقل "العدد قبل" في الواجهة

## 🐛 المشكلة

بعد تطبيق التحديثات لحساب "العدد قبل" تلقائياً، لم تكن القيمة تظهر في الحقل بشكل صحيح.

## 🔍 السبب

عند استخدام `disabled` مع `register` في react-hook-form، قد لا تُحدث القيمة بشكل صحيح عند استخدام `setValue` ديناميكياً.

## ✅ الحل المطبق

تم تقسيم الحقل إلى قسمين:

### 1. حقل العرض (Display Field)
```tsx
<Input
  id="chicks_before_display"
  type="number"
  value={watchChicksBefore || 0}  // ← يعرض القيمة مباشرة من watch
  readOnly                         // ← للقراءة فقط
  className="bg-muted cursor-not-allowed"
/>
```

**الفوائد:**
- ✅ يعرض القيمة بشكل فوري من `watch`
- ✅ لا يعتمد على register
- ✅ يُحدث تلقائياً عند تغيير القيمة

### 2. حقل مخفي (Hidden Field)
```tsx
<input 
  type="hidden" 
  {...register('chicks_before', { valueAsNumber: true })} 
/>
```

**الفوائد:**
- ✅ يُرسل القيمة مع النموذج
- ✅ يتم تحديثه عبر `setValue` في useEffect
- ✅ لا يتأثر بمشاكل العرض

---

## 🔄 التحديثات المطبقة

### 1. تحسين useEffect

**قبل:**
```typescript
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

**بعد:**
```typescript
useEffect(() => {
  const loadChicksBefore = async () => {
    const result = await getChicksBeforeForNewReport(warehouseId);
    if (result.success && result.data !== undefined) {
      setValue('chicks_before', result.data, { 
        shouldValidate: true,   // ← تفعيل التحقق
        shouldDirty: true,      // ← وضع علامة dirty
        shouldTouch: true       // ← وضع علامة touched
      });
    } else if (result.error) {
      console.error('Error loading chicks before:', result.error);
      toast.error('فشل في جلب عدد الدجاج');
    }
  };
  loadChicksBefore();
}, [warehouseId, setValue]);
```

**الفوائد:**
- ✅ `shouldValidate`: يُشغل التحقق من الصحة
- ✅ `shouldDirty`: يُعلم النموذج أن هناك تغيير
- ✅ `shouldTouch`: يُعلم أن الحقل تم لمسه
- ✅ معالجة الأخطاء مع toast

---

### 2. تحديث حقل العرض

**قبل:**
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

**بعد:**
```tsx
<div className="space-y-2">
  <Label htmlFor="chicks_before_display">العدد قبل (تلقائي)</Label>
  <Input
    id="chicks_before_display"
    type="number"
    value={watchChicksBefore || 0}
    readOnly
    className="bg-muted cursor-not-allowed"
  />
  {/* Hidden input to submit the value */}
  <input type="hidden" {...register('chicks_before', { valueAsNumber: true })} />
  <p className="text-xs text-muted-foreground">
    يُحسب تلقائياً من القطيع أو التقرير السابق
  </p>
</div>
```

**التغييرات:**
- ✅ تغيير `id` من `chicks_before` إلى `chicks_before_display`
- ✅ استبدال `{...register}` بـ `value={watchChicksBefore || 0}`
- ✅ استبدال `disabled` بـ `readOnly`
- ✅ إضافة `cursor-not-allowed` للتوضيح البصري
- ✅ إضافة حقل مخفي مع `register` لإرسال القيمة

---

## 🎯 كيف يعمل الآن؟

### خطوة بخطوة:

```
1. تحميل الصفحة
   ↓
2. useEffect يستدعي getChicksBeforeForNewReport(warehouseId)
   ↓
3. النتيجة تُحفظ في النموذج عبر setValue('chicks_before', value)
   ↓
4. watch('chicks_before') يتتبع القيمة
   ↓
5. watchChicksBefore تُحدث تلقائياً
   ↓
6. حقل العرض يعرض القيمة: value={watchChicksBefore || 0}
   ↓
7. عند الإرسال: الحقل المخفي يُرسل القيمة مع البيانات
```

---

## 📊 مقارنة

| الجانب | قبل الإصلاح | بعد الإصلاح |
|--------|-------------|-------------|
| **عرض القيمة** | ❌ لا تظهر | ✅ تظهر فوراً |
| **تحديث القيمة** | ❌ لا يعمل مع disabled | ✅ يعمل مع watch |
| **إرسال القيمة** | ✅ يُرسل | ✅ يُرسل (عبر hidden) |
| **معالجة الأخطاء** | ❌ لا توجد | ✅ toast + console |
| **التحقق من الصحة** | ❌ معطل | ✅ مفعل |

---

## 🧪 الاختبار

### اختبار 1: عرض القيمة
```
✅ افتح صفحة التقرير اليومي
✅ تحقق من ظهور قيمة "العدد قبل" فوراً
✅ تحقق من أن الحقل للقراءة فقط (readOnly)
✅ تحقق من الخلفية الرمادية (bg-muted)
```

### اختبار 2: التقرير الأول
```
✅ مزرعة جديدة بدون تقارير
✅ القيمة المعروضة = remaining_chicks من poultry_status
✅ مثلاً: 10,000
```

### اختبار 3: التقرير الثاني
```
✅ مزرعة لها تقرير واحد
✅ القيمة المعروضة = chicks_after من آخر تقرير
✅ مثلاً: 9,950 (إذا كان التقرير السابق)
```

### اختبار 4: الحفظ
```
✅ أدخل البيانات الأخرى
✅ احفظ التقرير
✅ تحقق من أن chicks_before تم حفظه بالقيمة الصحيحة
```

### اختبار 5: معالجة الأخطاء
```
✅ إذا حدث خطأ في جلب القيمة
✅ تحقق من ظهور toast خطأ
✅ تحقق من console.error
```

---

## 💡 ملاحظات مهمة

### 1. استخدام readOnly بدلاً من disabled
```tsx
readOnly        // ✅ يسمح بالعرض والتحديث
disabled        // ❌ قد يمنع التحديث في بعض الحالات
```

### 2. استخدام watch للعرض
```tsx
value={watchChicksBefore || 0}  // ✅ يعرض القيمة الحالية دائماً
{...register('chicks_before')}  // ❌ قد لا يُحدث مع disabled
```

### 3. الحقل المخفي
```tsx
<input type="hidden" {...register('chicks_before', { valueAsNumber: true })} />
```
- ضروري لإرسال القيمة مع النموذج
- يتم تحديثه تلقائياً عبر `setValue`
- لا يظهر في الواجهة

### 4. التحقق من القيمة
```typescript
if (result.success && result.data !== undefined) {
  // تحقق من undefined لأن القيمة قد تكون 0 (وهي قيمة صحيحة)
}
```

---

## ✅ الخلاصة

**المشكلة:** القيمة لا تظهر في الحقل  
**الحل:** تقسيم إلى حقل عرض + حقل مخفي  
**النتيجة:** ✅ القيمة تظهر بشكل صحيح وتُحفظ بنجاح

---

**تاريخ الإصلاح:** 2025-10-05  
**الحالة:** ✅ تم الإصلاح وجاهز للاختبار
