# فهرس ملفات نظام التنبيهات الدوائية

## 📚 نظرة عامة

هذا الدليل يحتوي على جميع الملفات والوثائق اللازمة لتنفيذ نظام التنبيهات الدوائية في مشروع al-qadeerani-poultry-farm.

---

## 📁 الملفات الرئيسية

### 1. 🚀 [QUICK_START.md](./QUICK_START.md)
**ابدأ من هنا!**

- دليل البدء السريع (5 دقائق)
- خطوات التنفيذ الأساسية
- قائمة مهام سريعة
- حل المشاكل الشائعة

**متى تستخدمه**: إذا كنت تريد البدء مباشرة دون قراءة الكثير من التفاصيل.

---

### 2. 📖 [MEDICATION_ALERTS_README.md](./MEDICATION_ALERTS_README.md)
**الدليل الشامل**

- نظرة عامة كاملة عن النظام
- الميزات والإمكانيات
- هيكل قاعدة البيانات
- شرح الدوال
- أمثلة التكامل
- استكشاف الأخطاء

**متى تستخدمه**: للفهم العميق للنظام والمرجع الشامل.

---

### 3. 💾 [medication-alerts-migration.sql](./medication-alerts-migration.sql)
**ملف SQL الرئيسي**

**المحتوى**:
- إضافة حقل `chick_birth_date` إلى جدول farms
- إنشاء جدول `medication_alerts`
- دالة `calculate_chick_age_in_days()` - حساب عمر الفراخ
- دالة `parse_medicine_days()` - تحليل أيام الدواء
- دالة `create_medication_alerts_for_farm()` - إنشاء التنبيهات
- Trigger `auto_create_medication_alerts` - الإنشاء التلقائي
- دالة `get_active_alerts_for_farm()` - جلب التنبيهات النشطة
- دالة `mark_alert_as_administered()` - تحديد التنبيه كمكتمل
- دالة `unmark_alert_as_administered()` - إلغاء التحديد
- View `v_medication_alerts_summary` - ملخص التنبيهات
- دالة `get_upcoming_alerts()` - التنبيهات القادمة

**كيفية الاستخدام**:
```bash
1. افتح Supabase Dashboard → SQL Editor
2. انسخ والصق محتوى الملف
3. اضغط RUN
```

**مهم**: نفذ هذا الملف **مرة واحدة فقط** في بداية التنفيذ.

---

### 4. 🔒 [medication-alerts-rls.sql](./medication-alerts-rls.sql)
**سياسات الأمان**

**المحتوى**:
- تفعيل Row Level Security
- سياسات SELECT للمزارعين والمدراء
- سياسات UPDATE للتحكم في التعديلات
- سياسات INSERT/DELETE للمدراء
- ضمان عزل البيانات

**كيفية الاستخدام**:
```bash
1. بعد تنفيذ migration.sql
2. في SQL Editor
3. انسخ والصق محتوى الملف
4. اضغط RUN
```

**مهم**: نفذ هذا الملف **بعد** ملف Migration.

---

### 5. 🔍 [medication-alerts-queries.sql](./medication-alerts-queries.sql)
**استعلامات جاهزة للاستخدام**

**المحتوى**:
- 16+ استعلام جاهز
- استعلامات للتنبيهات النشطة
- استعلامات للإحصائيات
- استعلامات للتقارير
- استعلامات للصيانة

**أمثلة الاستعلامات**:
- جلب التنبيهات النشطة لمزرعة
- جلب التنبيهات المتأخرة
- جلب تنبيهات اليوم/غداً
- إحصائيات الالتزام بالجدول
- جدول الأدوية الأسبوعي

**متى تستخدمه**: كمرجع للاستعلامات في التطبيق.

---

### 6. 💻 [medication-alerts-examples.tsx](./medication-alerts-examples.tsx)
**أمثلة كود TypeScript/Next.js**

**المحتوى**:
- Types للـ TypeScript
- Server Actions جاهزة
- أمثلة مكونات React
- دوال مساعدة

**الدوال المتضمنة**:
- `getActiveAlertsForFarm()` - جلب التنبيهات النشطة
- `getUpcomingAlertsForUser()` - جلب التنبيهات القادمة
- `markAlertAsAdministered()` - تحديد التنبيه كمكتمل
- `createAlertsForFarm()` - إنشاء تنبيهات جديدة
- `getFarmAlertStats()` - إحصائيات المزرعة

**المكونات المقترحة**:
- `MedicationAlertsCard` - بطاقة التنبيهات
- `AlertsList` - قائمة التنبيهات الكاملة

**متى تستخدمه**: للنسخ واللصق في ملفات الكود.

---

### 7. 📘 [medication-alerts-usage.md](./medication-alerts-usage.md)
**دليل الاستخدام التفصيلي**

**المحتوى**:
- سيناريوهات الاستخدام (8 سيناريوهات)
- أمثلة استعلامات SQL
- كيفية التكامل مع Next.js
- التحديثات المطلوبة في الكود
- أمثلة واجهة المستخدم
- سياسات RLS المقترحة

**متى تستخدمه**: للمطورين الذين يريدون فهم تفصيلي لكيفية الاستخدام.

---

## 🗺️ خريطة التنفيذ

### المرحلة 1: قاعدة البيانات ✅
```
1. medication-alerts-migration.sql  → نفذ مرة واحدة
2. medication-alerts-rls.sql        → نفذ مرة واحدة
3. اختبار بمزرعة تجريبية         → للتأكد من العمل
```

### المرحلة 2: الكود ⏳
```
1. إنشاء ملف actions/medication-alerts.actions.ts
   └─ انسخ الدوال من medication-alerts-examples.tsx

2. تحديث Types
   └─ أضف chick_birth_date إلى نوع Farm

3. تحديث النماذج
   ├─ edit-farm-dialog.tsx
   ├─ create-farm-dialog.tsx (إذا كان موجوداً)
   └─ complete-farm-setup-form.tsx

4. إضافة التنبيهات في صفحة المزارع
   └─ app/(dashboard)/farmer/page.tsx
```

### المرحلة 3: المكونات (اختياري) ⏳
```
1. إنشاء components/farmer/medication-alerts-card.tsx
2. إنشاء components/farmer/alerts-list.tsx
3. إنشاء components/ui/alert-item.tsx
```

---

## 📋 قائمة مرجعية سريعة

### قاعدة البيانات
- [ ] تنفيذ `medication-alerts-migration.sql`
- [ ] تنفيذ `medication-alerts-rls.sql`
- [ ] اختبار إنشاء التنبيهات
- [ ] اختبار جلب التنبيهات

### الكود
- [ ] إنشاء `actions/medication-alerts.actions.ts`
- [ ] تحديث Types
- [ ] تحديث `edit-farm-dialog.tsx`
- [ ] تحديث `complete-farm-setup-form.tsx`
- [ ] إضافة التنبيهات في `farmer/page.tsx`

### الاختبار
- [ ] إنشاء مزرعة تجريبية
- [ ] إضافة تاريخ ميلاد
- [ ] التحقق من التنبيهات
- [ ] اختبار تحديد التنبيه كمكتمل

---

## 🔗 روابط سريعة

### للبدء السريع
→ [QUICK_START.md](./QUICK_START.md)

### للمرجع الشامل
→ [MEDICATION_ALERTS_README.md](./MEDICATION_ALERTS_README.md)

### لأمثلة الكود
→ [medication-alerts-examples.tsx](./medication-alerts-examples.tsx)

### لاستعلامات SQL
→ [medication-alerts-queries.sql](./medication-alerts-queries.sql)

---

## 🎯 توصيات الاستخدام

### للمبتدئين
```
1. اقرأ QUICK_START.md
2. نفذ الملفين SQL
3. انسخ الأمثلة من medication-alerts-examples.tsx
```

### للمطورين المتقدمين
```
1. راجع MEDICATION_ALERTS_README.md للفهم الكامل
2. راجع medication-alerts-usage.md للسيناريوهات
3. استخدم medication-alerts-queries.sql كمرجع
4. خصص الكود حسب احتياجاتك
```

### للمدراء/المراجعين
```
1. راجع MEDICATION_ALERTS_README.md للنظرة العامة
2. راجع medication-alerts-rls.sql لفهم الأمان
3. راجع قائمة الميزات في README
```

---

## 📞 الحصول على المساعدة

### إذا واجهت مشكلة في التنفيذ
1. راجع قسم "حل المشاكل السريع" في QUICK_START.md
2. راجع قسم "استكشاف الأخطاء" في MEDICATION_ALERTS_README.md
3. تحقق من الاستعلامات في medication-alerts-queries.sql

### إذا كانت لديك أسئلة عن الاستخدام
1. راجع medication-alerts-usage.md
2. راجع الأمثلة في medication-alerts-examples.tsx
3. راجع التعليقات في ملفات SQL

---

## 📊 ملخص الملفات

| الملف | النوع | الحجم التقريبي | الأهمية | متى تستخدمه |
|------|------|----------------|---------|-------------|
| QUICK_START.md | توثيق | قصير | ⭐⭐⭐⭐⭐ | للبدء فوراً |
| MEDICATION_ALERTS_README.md | توثيق | متوسط | ⭐⭐⭐⭐⭐ | للمرجع الشامل |
| medication-alerts-migration.sql | SQL | طويل | ⭐⭐⭐⭐⭐ | مرة واحدة في البداية |
| medication-alerts-rls.sql | SQL | قصير | ⭐⭐⭐⭐ | مرة واحدة بعد Migration |
| medication-alerts-queries.sql | SQL | متوسط | ⭐⭐⭐ | للمرجع والنسخ |
| medication-alerts-examples.tsx | TypeScript | طويل | ⭐⭐⭐⭐ | للنسخ واللصق |
| medication-alerts-usage.md | توثيق | طويل | ⭐⭐⭐ | للفهم التفصيلي |
| INDEX.md (هذا الملف) | توثيق | متوسط | ⭐⭐⭐⭐ | للتنقل والفهرسة |

---

**آخر تحديث**: 2025-10-10  
**الإصدار**: 1.0.0  
**المشروع**: al-qadeerani-poultry-farm
