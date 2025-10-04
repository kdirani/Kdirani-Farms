# التحديثات المطلوبة لصفحات القطيع بعد تغيير العلاقة إلى واحد لواحد

## 📋 نظرة عامة

بعد تحويل علاقة القطيع من **واحد لكثير** إلى **واحد لواحد**، يجب تحديث الصفحات التالية:

1. ✅ `/admin/setup` - صفحة إعداد مزرعة كاملة
2. ✅ `/admin/poultry` - صفحة إدارة القطعان

---

## 🔍 التحليل

### 1. صفحة `/admin/setup`

**الوضع الحالي:**
- تستخدم `CompleteFarmSetupForm` لإنشاء مزرعة كاملة
- تنشئ: مستخدم → مزرعة → مستودع → قطيع → مواد

**التأثير:**
- ✅ **لا يحتاج تحديث كبير** - الصفحة تنشئ قطيع واحد فقط لكل مزرعة جديدة
- ⚠️ قد يحتاج تحديث النصوص التوضيحية فقط

**التحديث المطلوب:**
- تحديث النص من "قطيع أولي" إلى "القطيع" (لتوضيح أنه قطيع واحد فقط)

---

### 2. صفحة `/admin/poultry`

**الوضع الحالي:**
- تعرض جميع القطعان في جدول
- يمكن إنشاء قطيع جديد
- يمكن تعديل قطيع موجود
- يمكن حذف قطيع

**المشاكل:**

#### أ. إنشاء قطيع جديد (`create-poultry-dialog.tsx`)
**المشكلة الرئيسية:**
- يسمح باختيار أي مزرعة من القائمة
- ❌ **لا يتحقق** إذا كانت المزرعة لديها قطيع بالفعل
- سيحدث خطأ في قاعدة البيانات عند محاولة إنشاء قطيع ثاني لنفس المزرعة

**الحل المطلوب:**
1. تعديل `getActiveFarms()` لجلب **المزارع التي ليس لها قطيع فقط**
2. إضافة رسالة توضيحية عند عدم وجود مزارع متاحة

#### ب. تعديل قطيع (`edit-poultry-dialog.tsx`)
**الوضع:**
- ✅ يعمل بشكل صحيح (لا يحتاج تحديث)
- يسمح بتعديل اسم الدفعة والأعداد

#### ج. حذف قطيع (`delete-poultry-dialog.tsx`)
**الوضع:**
- ✅ يعمل بشكل صحيح (لا يحتاج تحديث)

#### د. جدول القطعان (`poultry-table.tsx`)
**الوضع:**
- ✅ يعمل بشكل صحيح (لا يحتاج تحديث)
- يعرض جميع القطعان مع معلومات المزرعة

---

## 📁 الملفات التي تحتاج تحديث

### 1. ✅ `actions/poultry.actions.ts`

**التعديل على `getActiveFarms()`:**

**قبل:**
```typescript
export async function getActiveFarms(): Promise<ActionResult<Array<{ id: string; name: string; location: string | null }>>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Get all farms
    const { data: farms } = await supabase
      .from('farms')
      .select('id, name, location')
      .order('name');

    return { success: true, data: farms || [] };
  } catch (error) {
    console.error('Error getting farms:', error);
    return { success: false, error: 'Failed to get farms' };
  }
}
```

**بعد:**
```typescript
/**
 * Get farms without poultry status (available for assignment)
 * Since each farm can have only ONE poultry status, we filter out farms that already have one
 */
export async function getAvailableFarmsForPoultry(): Promise<ActionResult<Array<{ id: string; name: string; location: string | null }>>> {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Get all farms
    const { data: allFarms } = await supabase
      .from('farms')
      .select('id, name, location')
      .order('name');

    if (!allFarms) {
      return { success: true, data: [] };
    }

    // Get all farm IDs that already have poultry status
    const { data: existingPoultry } = await supabase
      .from('poultry_status')
      .select('farm_id');

    const farmsWithPoultry = new Set(existingPoultry?.map(p => p.farm_id) || []);

    // Filter out farms that already have poultry
    const availableFarms = allFarms.filter(farm => !farmsWithPoultry.has(farm.id));

    return { success: true, data: availableFarms };
  } catch (error) {
    console.error('Error getting available farms:', error);
    return { success: false, error: 'Failed to get available farms' };
  }
}

/**
 * @deprecated Use getAvailableFarmsForPoultry() instead
 * This function is kept for backward compatibility
 */
export async function getActiveFarms(): Promise<ActionResult<Array<{ id: string; name: string; location: string | null }>>> {
  return getAvailableFarmsForPoultry();
}
```

---

### 2. ✅ `components/admin/poultry/create-poultry-dialog.tsx`

**التعديلات:**

**استيراد الدالة الجديدة:**
```typescript
import { createPoultryStatus, getAvailableFarmsForPoultry } from '@/actions/poultry.actions';
```

**تحديث دالة التحميل:**
```typescript
const loadAvailableFarms = async () => {
  setLoadingFarms(true);
  const result = await getAvailableFarmsForPoultry(); // ✅ تغيير هنا
  if (result.success && result.data) {
    setAvailableFarms(result.data);
  }
  setLoadingFarms(false);
};
```

**تحديث الرسالة عند عدم وجود مزارع:**
```tsx
{availableFarms.length === 0 && !loadingFarms && (
  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
    ⚠️ جميع المزارع لديها قطيع بالفعل. كل مزرعة يمكن أن يكون لها قطيع واحد فقط.
  </p>
)}
```

---

### 3. ✅ `app/(dashboard)/admin/setup/page.tsx`

**التعديل على النص التوضيحي:**

**قبل:**
```tsx
<li>قطيع أولي (دجاج)</li>
```

**بعد:**
```tsx
<li>القطيع (كل مزرعة لها قطيع واحد فقط)</li>
```

---

### 4. ✅ `app/(dashboard)/admin/poultry/page.tsx`

**التعديل على الوصف:**

**قبل:**
```tsx
<p className="text-muted-foreground mt-2">
  إدارة دفعات القطعان وتتبع أعداد الكتاكيت في جميع المزارع
</p>
```

**بعد:**
```tsx
<p className="text-muted-foreground mt-2">
  إدارة القطعان وتتبع أعداد الكتاكيت (كل مزرعة لها قطيع واحد فقط)
</p>
```

**تحديث عنوان الكارد:**

**قبل:**
```tsx
<CardTitle>جميع دفعات القطعان</CardTitle>
<CardDescription>
  عرض وإدارة جميع دفعات القطعان في النظام
</CardDescription>
```

**بعد:**
```tsx
<CardTitle>جميع القطعان</CardTitle>
<CardDescription>
  عرض وإدارة القطعان في النظام (قطيع واحد لكل مزرعة)
</CardDescription>
```

---

## 🎯 ملخص التحديثات

| الملف | نوع التحديث | الأولوية |
|------|-------------|---------|
| `actions/poultry.actions.ts` | ✅ **إضافة دالة جديدة** | 🔴 عالية |
| `components/admin/poultry/create-poultry-dialog.tsx` | ✅ **تحديث منطق** | 🔴 عالية |
| `app/(dashboard)/admin/setup/page.tsx` | ✅ **تحديث نص** | 🟡 متوسطة |
| `app/(dashboard)/admin/poultry/page.tsx` | ✅ **تحديث نصوص** | 🟡 متوسطة |
| `components/admin/poultry/edit-poultry-dialog.tsx` | ✅ **لا يحتاج** | ✅ |
| `components/admin/poultry/delete-poultry-dialog.tsx` | ✅ **لا يحتاج** | ✅ |
| `components/admin/poultry/poultry-table.tsx` | ✅ **لا يحتاج** | ✅ |

---

## 🧪 سيناريوهات الاختبار

### 1. إنشاء قطيع جديد
**الخطوات:**
1. فتح `/admin/poultry`
2. الضغط على "إنشاء قطيع جديد"
3. التحقق من أن القائمة تعرض **المزارع التي ليس لها قطيع فقط**
4. محاولة إنشاء قطيع لمزرعة
5. التحقق من نجاح الإنشاء
6. محاولة إنشاء قطيع آخر
7. التحقق من أن المزرعة **لا تظهر** في القائمة بعد الآن

### 2. عدم وجود مزارع متاحة
**الخطوات:**
1. التأكد من أن جميع المزارع لديها قطيع
2. فتح حوار إنشاء قطيع
3. التحقق من ظهور رسالة: "جميع المزارع لديها قطيع بالفعل"
4. التحقق من تعطيل زر "إنشاء دفعة"

### 3. صفحة الإعداد
**الخطوات:**
1. فتح `/admin/setup`
2. التحقق من النص الجديد: "القطيع (كل مزرعة لها قطيع واحد فقط)"
3. إنشاء مزرعة جديدة كاملة
4. التحقق من إنشاء قطيع واحد فقط

---

## ⚠️ تحذيرات مهمة

### 1. البيانات الموجودة
إذا كانت هناك مزارع لديها أكثر من قطيع حالياً:
```sql
-- التحقق من المزارع التي لها أكثر من قطيع
SELECT farm_id, COUNT(*) as poultry_count
FROM public.poultry_status
GROUP BY farm_id
HAVING COUNT(*) > 1;
```

يجب حل هذه المشكلة قبل تطبيق القيد `UNIQUE` على `farm_id`.

### 2. رسائل الخطأ
عند محاولة إنشاء قطيع ثاني لنفس المزرعة (قبل التحديث):
```
ERROR: duplicate key value violates unique constraint "unique_farm_id"
```

بعد التحديث، سيتم منع هذا من الواجهة.

---

## 🔄 ترتيب التنفيذ

1. ✅ **الأولوية الأولى:** تحديث `actions/poultry.actions.ts`
2. ✅ **الأولوية الثانية:** تحديث `create-poultry-dialog.tsx`
3. ✅ **الأولوية الثالثة:** تحديث النصوص في الصفحات
4. ✅ **الأولوية الرابعة:** الاختبار الشامل

---

## 📊 مثال على البيانات

### قبل التحديث:
```typescript
// getActiveFarms() تُرجع جميع المزارع
[
  { id: "farm-1", name: "مزرعة الأمل", location: "الرياض" },      // ✅ لديها قطيع
  { id: "farm-2", name: "مزرعة النور", location: "جدة" },         // ✅ لديها قطيع
  { id: "farm-3", name: "مزرعة السلام", location: "الدمام" },     // ❌ ليس لديها قطيع
]
```

### بعد التحديث:
```typescript
// getAvailableFarmsForPoultry() تُرجع المزارع بدون قطيع فقط
[
  { id: "farm-3", name: "مزرعة السلام", location: "الدمام" },     // ✅ متاحة
]
```

---

## ✅ الخلاصة

**التحديثات المطلوبة:**
- ✅ إضافة دالة `getAvailableFarmsForPoultry()` في الأكشن
- ✅ تحديث `create-poultry-dialog.tsx` لاستخدام الدالة الجديدة
- ✅ تحديث النصوص التوضيحية في الصفحات
- ✅ إضافة رسالة واضحة عند عدم وجود مزارع متاحة

**الفوائد:**
- منع الأخطاء عند محاولة إنشاء قطيع ثاني
- تحسين تجربة المستخدم
- توضيح القيود للمستخدم

---

**تاريخ الإنشاء:** 2025-10-05  
**الحالة:** 📝 جاهز للتنفيذ
