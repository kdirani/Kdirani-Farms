# نظام التنبيهات الدوائية 💊

## 🎉 مرحباً!

هذا المجلد يحتوي على **نظام التنبيهات الدوائية المتكامل** لمشروع إدارة مزارع الدواجن.

---

## 📂 الملفات المتوفرة

تم إنشاء **9 ملفات** كاملة:

### 🚀 للبدء السريع (5 دقائق)
**→ [`QUICK_START.md`](./QUICK_START.md)**
- خطوات التنفيذ السريعة
- قائمة مهام واضحة
- حل المشاكل الشائعة

### 📖 للفهم الشامل
**→ [`MEDICATION_ALERTS_README.md`](./MEDICATION_ALERTS_README.md)**
- شرح كامل للنظام
- الميزات والإمكانيات
- أمثلة الاستخدام
- استكشاف الأخطاء

### 💾 ملفات SQL (للتنفيذ في Supabase)

1. **[`medication-alerts-migration.sql`](./medication-alerts-migration.sql)** ⭐⭐⭐⭐⭐
   - الملف الرئيسي (18KB)
   - إنشاء الجداول والدوال
   - **نفذه مرة واحدة في البداية**

2. **[`medication-alerts-rls.sql`](./medication-alerts-rls.sql)** ⭐⭐⭐⭐
   - سياسات الأمان (6.8KB)
   - **نفذه بعد Migration**

3. **[`medication-alerts-queries.sql`](./medication-alerts-queries.sql)** ⭐⭐⭐
   - استعلامات جاهزة (12KB)
   - **مرجع عند الحاجة**

### 💻 ملفات الكود

**[`medication-alerts-examples.tsx`](./medication-alerts-examples.tsx)** ⭐⭐⭐⭐
- أمثلة TypeScript/Next.js (19KB)
- Server Actions جاهزة
- مكونات React مقترحة
- **للنسخ واللصق**

### 📚 التوثيق

1. **[`medication-alerts-usage.md`](./medication-alerts-usage.md)**
   - دليل الاستخدام التفصيلي (9.8KB)
   - سيناريوهات عملية

2. **[`INDEX.md`](./INDEX.md)**
   - فهرس شامل لجميع الملفات (9.4KB)
   - خريطة التنفيذ

3. **[`SUMMARY_AR.md`](./SUMMARY_AR.md)**
   - ملخص شامل بالعربية (13KB)
   - نظرة عامة على النظام

---

## ⚡ البدء السريع

### الخطوة 1: قاعدة البيانات (5 دقائق)

```bash
# في Supabase SQL Editor:

1. افتح medication-alerts-migration.sql
2. انسخ المحتوى → الصقه → RUN
3. افتح medication-alerts-rls.sql
4. انسخ المحتوى → الصقه → RUN
```

### الخطوة 2: الكود (10-15 دقيقة)

```typescript
// 1. أنشئ ملف جديد
// actions/medication-alerts.actions.ts

// 2. انسخ الدوال من
// medication-alerts-examples.tsx

// 3. حدّث النماذج:
// - edit-farm-dialog.tsx
// - complete-farm-setup-form.tsx

// 4. أضف التنبيهات في
// farmer/page.tsx
```

### الخطوة 3: الاختبار

```sql
-- في SQL Editor
UPDATE farms 
SET chick_birth_date = CURRENT_DATE 
WHERE id = 'your-farm-id';

-- تحقق
SELECT * FROM medication_alerts 
WHERE farm_id = 'your-farm-id';
```

✅ **تم!** النظام يعمل الآن

---

## 🎯 ما يفعله النظام؟

### الميزات الرئيسية

✨ **إنشاء تلقائي للتنبيهات**
- عند إضافة تاريخ ميلاد الفراخ
- يتم إنشاء جميع التنبيهات تلقائياً

📊 **تصنيف حسب الأولوية**
- 🚨 متأخر
- ⚠️ اليوم
- 📌 غداً
- 📅 قادم

✅ **تتبع الحالة**
- هل تم إعطاء الدواء؟
- من أعطاه؟
- متى؟

🔔 **عرض في الصفحة الرئيسية**
- المزارع يرى تنبيهاته
- يمكنه تحديد التنبيه كمكتمل

---

## 📖 أي ملف أقرأ؟

### أريد البدء فوراً
→ اقرأ [`QUICK_START.md`](./QUICK_START.md)

### أريد فهم النظام بالكامل
→ اقرأ [`MEDICATION_ALERTS_README.md`](./MEDICATION_ALERTS_README.md)

### أريد أمثلة كود جاهزة
→ افتح [`medication-alerts-examples.tsx`](./medication-alerts-examples.tsx)

### أريد استعلامات SQL
→ افتح [`medication-alerts-queries.sql`](./medication-alerts-queries.sql)

### أريد ملخص سريع
→ اقرأ [`SUMMARY_AR.md`](./SUMMARY_AR.md)

### أريد الفهرس الكامل
→ اقرأ [`INDEX.md`](./INDEX.md)

---

## 🗂️ هيكل النظام

```
نظام التنبيهات الدوائية
│
├── قاعدة البيانات
│   ├── جدول farms
│   │   └── + chick_birth_date (تاريخ الميلاد)
│   │
│   ├── جدول medication_alerts (جديد)
│   │   ├── farm_id
│   │   ├── medicine_id
│   │   ├── scheduled_date
│   │   ├── is_administered
│   │   └── ...
│   │
│   └── دوال
│       ├── calculate_chick_age_in_days()
│       ├── create_medication_alerts_for_farm()
│       ├── get_active_alerts_for_farm()
│       ├── mark_alert_as_administered()
│       └── ...
│
├── الكود (Next.js)
│   ├── Types
│   ├── Server Actions
│   ├── تحديثات النماذج
│   └── عرض التنبيهات
│
└── الأمان (RLS)
    ├── المزارعون → تنبيهاتهم فقط
    └── المدراء → جميع التنبيهات
```

---

## 📊 الإحصائيات

| البند | القيمة |
|------|--------|
| عدد الملفات | 9 ملفات |
| حجم إجمالي | ~100 KB |
| دوال SQL | 11 دالة |
| Views | 1 view |
| Triggers | 1 trigger |
| Server Actions | 6 إجراءات |
| سياسات RLS | 7 سياسات |

---

## ✅ قائمة مرجعية

### قاعدة البيانات
- [ ] تنفيذ `medication-alerts-migration.sql`
- [ ] تنفيذ `medication-alerts-rls.sql`
- [ ] اختبار إنشاء التنبيهات

### الكود
- [ ] إنشاء `actions/medication-alerts.actions.ts`
- [ ] تحديث `edit-farm-dialog.tsx`
- [ ] تحديث `complete-farm-setup-form.tsx`
- [ ] إضافة التنبيهات في `farmer/page.tsx`

### الاختبار
- [ ] إنشاء مزرعة تجريبية
- [ ] إضافة تاريخ ميلاد
- [ ] التحقق من التنبيهات
- [ ] اختبار تحديد التنبيه

---

## 🆘 المساعدة

### مشكلة في التنفيذ؟
→ راجع قسم "حل المشاكل" في [`QUICK_START.md`](./QUICK_START.md)

### سؤال عن الاستخدام؟
→ راجع [`medication-alerts-usage.md`](./medication-alerts-usage.md)

### تريد أمثلة؟
→ افتح [`medication-alerts-examples.tsx`](./medication-alerts-examples.tsx)

---

## 📞 معلومات إضافية

- **المشروع**: al-qadeerani-poultry-farm
- **النظام**: نظام التنبيهات الدوائية
- **الإصدار**: 1.0.0
- **تاريخ الإنشاء**: 2025-10-10
- **الحالة**: ✅ جاهز للتنفيذ

---

## 🎓 للمطورين

### التقنيات المستخدمة
- PostgreSQL (Supabase)
- Row Level Security (RLS)
- Functions & Triggers
- Next.js 15
- TypeScript
- React Server Components

### المفاهيم المطبقة
- SECURITY DEFINER Functions
- Automatic Trigger Execution
- Policy-based Access Control
- Server Actions Pattern
- Type Safety

---

## 🌟 الميزات المتقدمة

- ⚡ إنشاء تلقائي للتنبيهات
- 🔒 أمان متعدد المستويات (RLS)
- 📊 إحصائيات وتقارير
- 🎯 تصنيف ذكي للأولويات
- 📱 واجهة سهلة الاستخدام
- 🔔 تنبيهات فورية
- 📈 تتبع الالتزام بالجدول
- 🗂️ سجل كامل للتنبيهات

---

**🚀 ابدأ الآن من [`QUICK_START.md`](./QUICK_START.md)**

---

*تم الإنشاء بواسطة نظام مساعد الذكاء الاصطناعي | آخر تحديث: 2025-10-10*
