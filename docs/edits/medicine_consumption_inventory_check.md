# إضافة عرض المخزون المتاح في فواتير استهلاك الأدوية

## 🎯 الميزة الجديدة

تم إضافة عرض **المخزون المتاح** للأدوية في نافذة إنشاء فاتورة استهلاك، مع **التحقق التلقائي** من الكمية المتاحة قبل إضافة البند.

---

## ✅ التحديثات المطبقة

### 1. تحديث دالة `getMaterialInventory()`

**الملف:** `actions/material.actions.ts`

#### قبل:
```typescript
// ❌ تدعم material_name_id فقط
export async function getMaterialInventory(
  warehouseId: string,
  materialNameId: string
): Promise<ActionResult<{ current_balance: number; unit_name: string }>> {
  // يبحث فقط في material_name_id
  const { data: material } = await supabase
    .from('materials')
    .eq('material_name_id', materialNameId)
    .single();
}
```

#### بعد:
```typescript
// ✅ تدعم material_name_id و medicine_id
export async function getMaterialInventory(
  warehouseId: string,
  materialOrMedicineId: string
): Promise<ActionResult<{ current_balance: number; unit_name: string }>> {
  // Try material_name_id first
  let material = await supabase
    .from('materials')
    .eq('material_name_id', materialOrMedicineId)
    .maybeSingle();

  // If not found, try medicine_id
  if (!material.data) {
    material = await supabase
      .from('materials')
      .eq('medicine_id', materialOrMedicineId)
      .maybeSingle();
  }
  
  // Return inventory info
  return {
    success: true,
    data: {
      current_balance: material.data?.current_balance || 0,
      unit_name: unitName,
    },
  };
}
```

---

### 2. تحديث نافذة إنشاء فاتورة استهلاك

**الملف:** `components/admin/medicines-invoices/create-medicine-invoice-dialog.tsx`

#### التحديثات:

**أ) إضافة Imports:**
```typescript
import { getMaterialInventory } from '@/actions/material.actions';
import { PackageCheck, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
```

**ب) إضافة State:**
```typescript
const [medicineInventory, setMedicineInventory] = useState<{
  current_balance: number;
  unit_name: string;
} | null>(null);
const [loadingInventory, setLoadingInventory] = useState(false);
```

**ج) إضافة useEffect لتحميل المخزون:**
```typescript
// Load inventory when medicine or warehouse changes
useEffect(() => {
  if (newItem.medicine_id && warehouseId) {
    loadMedicineInventory(warehouseId, newItem.medicine_id);
  } else {
    setMedicineInventory(null);
  }
}, [newItem.medicine_id, warehouseId]);

const loadMedicineInventory = async (warehouseId: string, medicineId: string) => {
  setLoadingInventory(true);
  const result = await getMaterialInventory(warehouseId, medicineId);
  if (result.success && result.data) {
    setMedicineInventory(result.data);
  } else {
    setMedicineInventory(null);
  }
  setLoadingInventory(false);
};
```

**د) تحديث `handleAddItem()` للتحقق من المخزون:**
```typescript
const handleAddItem = () => {
  // ... التحقق الأساسي
  
  // ✅ Check if enough inventory available
  if (medicineInventory) {
    if (medicineInventory.current_balance <= 0) {
      toast.error('لا يوجد مخزون متاح لهذا الدواء');
      return;
    }
    if (newItem.quantity > medicineInventory.current_balance) {
      toast.error(`المخزون غير كافي. المتاح: ${medicineInventory.current_balance} ${medicineInventory.unit_name}`);
      return;
    }
  }

  // إضافة البند
  setItems([...items, newItem as MedicineItemInput]);
  setNewItem({ quantity: 0, price: 0 });
  setMedicineInventory(null);  // مسح المخزون بعد الإضافة
  toast.success('تم إضافة الدواء');
};
```

**هـ) إضافة عرض المخزون في الواجهة:**
```tsx
{/* Show inventory information */}
{newItem.medicine_id && warehouseId && (
  <div className="bg-muted p-3 rounded-md">
    {loadingInventory ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>جاري تحميل معلومات المخزون...</span>
      </div>
    ) : medicineInventory ? (
      <div>
        <div className="flex items-center gap-2">
          <PackageCheck className={`h-5 w-5 ${
            medicineInventory.current_balance <= 0 || 
            (newItem.quantity && newItem.quantity > medicineInventory.current_balance)
              ? 'text-destructive' 
              : 'text-primary'
          }`} />
          <span className="text-sm font-medium">
            المخزون المتاح: <strong>{medicineInventory.current_balance}</strong> {medicineInventory.unit_name}
          </span>
        </div>
        {newItem.quantity && newItem.quantity > medicineInventory.current_balance && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              الكمية المطلوبة أكبر من المخزون المتاح
            </AlertDescription>
          </Alert>
        )}
      </div>
    ) : (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-5 w-5" />
        <span>لا يوجد مخزون لهذا الدواء في المستودع</span>
      </div>
    )}
  </div>
)}
```

---

## 🎨 الواجهة

### حالات العرض:

#### 1. **جاري التحميل:**
```
🔄 جاري تحميل معلومات المخزون...
```

#### 2. **مخزون متاح كافٍ:**
```
✅ المخزون المتاح: 100 علبة
```

#### 3. **مخزون غير كافٍ:**
```
❌ المخزون المتاح: 10 علبة
⚠️ الكمية المطلوبة أكبر من المخزون المتاح
```

#### 4. **لا يوجد مخزون:**
```
⚠️ لا يوجد مخزون لهذا الدواء في المستودع
```

---

## 🔒 التحقق من الكمية

### عند محاولة إضافة البند:

```typescript
// ✅ التحقق التلقائي
if (medicineInventory) {
  // 1. التحقق من وجود مخزون
  if (medicineInventory.current_balance <= 0) {
    toast.error('لا يوجد مخزون متاح لهذا الدواء');
    return;  // منع الإضافة
  }
  
  // 2. التحقق من كفاية المخزون
  if (newItem.quantity > medicineInventory.current_balance) {
    toast.error(`المخزون غير كافي. المتاح: ${medicineInventory.current_balance}`);
    return;  // منع الإضافة
  }
}

// ✅ إذا نجحت جميع الفحوصات، يتم إضافة البند
```

---

## 🎯 سلوك النظام

### السيناريو 1: مخزون كافٍ ✅
```
1. المستخدم يختار دواء
2. يظهر: "المخزون المتاح: 100 علبة" (أخضر)
3. المستخدم يدخل كمية: 50
4. الأيقونة تبقى خضراء ✅
5. يمكن إضافة البند بنجاح
```

### السيناريو 2: مخزون غير كافٍ ❌
```
1. المستخدم يختار دواء
2. يظهر: "المخزون المتاح: 10 علبة"
3. المستخدم يدخل كمية: 50
4. الأيقونة تتحول إلى أحمر ❌
5. يظهر تحذير: "الكمية المطلوبة أكبر من المخزون المتاح"
6. عند محاولة الإضافة: رسالة خطأ ومنع الإضافة
```

### السيناريو 3: لا يوجد مخزون ⚠️
```
1. المستخدم يختار دواء غير موجود في المستودع
2. يظهر: "لا يوجد مخزون لهذا الدواء في المستودع"
3. عند محاولة الإضافة: رسالة خطأ ومنع الإضافة
```

---

## 🔄 التحديث التلقائي

### متى يتم تحميل المخزون؟

```typescript
useEffect(() => {
  if (newItem.medicine_id && warehouseId) {
    loadMedicineInventory(warehouseId, newItem.medicine_id);
  } else {
    setMedicineInventory(null);
  }
}, [newItem.medicine_id, warehouseId]);
```

**يتم التحميل عند:**
- ✅ اختيار دواء جديد
- ✅ تغيير المستودع
- ✅ فتح النافذة

**يتم المسح عند:**
- ✅ إلغاء اختيار الدواء
- ✅ إضافة البند بنجاح
- ✅ إغلاق النافذة

---

## 🧪 الاختبار

### اختبار 1: مخزون كافٍ
```
1. أنشئ فاتورة شراء بدواء (كمية: 100)
2. افتح /admin/medicines-invoices
3. أنشئ فاتورة استهلاك جديدة
4. اختر نفس المستودع والدواء
5. ✅ يجب أن يظهر: "المخزون المتاح: 100"
6. أدخل كمية: 50
7. ✅ يجب أن تتم الإضافة بنجاح
```

### اختبار 2: مخزون غير كافٍ
```
1. اختر دواء بمخزون: 10
2. أدخل كمية: 50
3. ✅ يجب أن يظهر تحذير أحمر
4. حاول الإضافة
5. ✅ يجب أن تظهر رسالة خطأ ومنع الإضافة
```

### اختبار 3: لا يوجد مخزون
```
1. اختر دواء غير موجود في المستودع
2. ✅ يجب أن يظهر: "لا يوجد مخزون"
3. حاول الإضافة
4. ✅ يجب أن تظهر رسالة خطأ
```

### اختبار 4: تغيير المستودع
```
1. اختر دواء في مستودع 1
2. يظهر المخزون
3. غيّر إلى مستودع 2
4. ✅ يجب أن يتحدث المخزون تلقائياً
```

---

## 🎨 التصميم

### الألوان والأيقونات:

| الحالة | الأيقونة | اللون | الرسالة |
|--------|----------|-------|---------|
| مخزون كافٍ | ✅ PackageCheck | أخضر | المخزون المتاح: X |
| مخزون غير كافٍ | ❌ PackageCheck | أحمر | المخزون المتاح: X + تحذير |
| لا يوجد مخزون | ⚠️ AlertTriangle | رمادي | لا يوجد مخزون |
| جاري التحميل | 🔄 Loader2 | رمادي | جاري التحميل... |

---

## 📊 التكامل

### مع الأنظمة الأخرى:

#### 1. **فواتير الشراء**
- ✅ عند شراء أدوية، يزيد المخزون
- ✅ يظهر المخزون الجديد في فواتير الاستهلاك

#### 2. **فواتير البيع**
- ✅ عند بيع أدوية، يقل المخزون
- ✅ يظهر المخزون المحدث في فواتير الاستهلاك

#### 3. **فواتير الاستهلاك**
- ✅ عند الاستهلاك، يقل المخزون
- ✅ يظهر المخزون المحدث للفواتير التالية

---

## 🔐 الأمان

### التحقق على مستويين:

#### 1. **Frontend (الواجهة):**
```typescript
// التحقق قبل إضافة البند
if (newItem.quantity > medicineInventory.current_balance) {
  toast.error('المخزون غير كافي');
  return;  // منع الإضافة
}
```

#### 2. **Backend (Server Action):**
```typescript
// في createMedicineItem()
// التحقق من المخزون في decreaseMedicineInventory()
if (existingMaterial.current_balance < quantity) {
  return { 
    success: false, 
    error: `Insufficient medicine stock. Available: ${existingMaterial.current_balance}` 
  };
}
```

**الفائدة:** حماية مزدوجة ضد استهلاك أكثر من المتاح

---

## 💡 الميزات الإضافية

### 1. **التحديث التلقائي**
- المخزون يتحدث فوراً عند تغيير الدواء أو المستودع

### 2. **التحذيرات البصرية**
- تغيير اللون من أخضر إلى أحمر عند تجاوز المخزون
- رسالة تحذير واضحة

### 3. **منع الأخطاء**
- لا يمكن إضافة بند بكمية أكبر من المتاح
- رسائل خطأ واضحة ومفيدة

### 4. **تجربة مستخدم محسنة**
- معلومات فورية عن المخزون
- لا حاجة للتنقل بين الصفحات
- تقليل الأخطاء البشرية

---

## 📝 ملاحظات

### الفرق عن فواتير الشراء/البيع:

| الميزة | فواتير الشراء/البيع | فواتير الاستهلاك |
|--------|---------------------|------------------|
| **عرض المخزون** | فقط للبيع | دائماً (استهلاك) |
| **التحقق** | فقط للبيع | دائماً |
| **السبب** | الشراء لا يحتاج مخزون | الاستهلاك يحتاج مخزون |

---

## ✅ الخلاصة

**الملفات المحدثة:**
- ✅ `actions/material.actions.ts` - دعم medicine_id في getMaterialInventory
- ✅ `components/admin/medicines-invoices/create-medicine-invoice-dialog.tsx` - عرض المخزون والتحقق

**الميزات الجديدة:**
- ✅ عرض المخزون المتاح تلقائياً
- ✅ التحقق من الكمية قبل الإضافة
- ✅ تحذيرات بصرية واضحة
- ✅ منع الأخطاء

**الفوائد:**
- ✅ تجربة مستخدم أفضل
- ✅ تقليل الأخطاء
- ✅ معلومات فورية
- ✅ حماية المخزون

---

**تاريخ الإضافة:** 2025-10-04  
**الحالة:** ✅ مكتمل ومُختبر
