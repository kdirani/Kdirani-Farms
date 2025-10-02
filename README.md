# نظام إدارة مزارع الدواجن - شركة القديراني

نظام متكامل لإدارة مزارع الدواجن باستخدام Next.js 15 و Supabase

## 🚀 المميزات

### للمزارعين (Farmers)
- ✅ إضافة تقرير يومي شامل للإنتاج
- ✅ إدخال فواتير بيع البيض مباشرة مع التقرير اليومي
- ✅ إدخال فواتير بيع السواد
- ✅ إدخال فواتير استهلاك الأدوية واللقاحات
- ✅ إنشاء فواتير تصنيع العلف (يتم اختيار المستودع تلقائياً)
- ✅ عرض التقارير والمخزون

### للإدارة (Admin)
- ✅ إدارة المستخدمين (إنشاء، تعديل، حذف، تحديد الأدوار)
- ✅ إدارة المزارع والمستودعات
- ✅ إدارة المواد مع الأرصدة الافتتاحية
- ✅ إدارة القطعان مع العدد الابتدائي
- ✅ إنشاء وتعديل فواتير البيع والشراء
- ✅ اختيار المستودع والعميل في الفواتير
- ✅ عرض جميع التقارير والإحصائيات
- ✅ إدارة القوائم الأساسية (أوزان البيض، أنواع المواد، وحدات القياس، الأدوية، أنواع المصاريف)

## 🛠️ التقنيات المستخدمة

### Core Stack
- **Framework:** Next.js 15.0.3 (App Router)
- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Package Manager:** pnpm

### Database & Authentication
- **Database:** Supabase (PostgreSQL)
- **ORM:** Supabase Client
- **Authentication:** NextAuth v5

### UI & Styling
- **Styling:** Tailwind CSS
- **Components:** Radix UI (shadcn/ui)
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Fonts:** Cairo (Google Fonts) - دعم اللغة العربية

### Forms & Validation
- **Form Management:** React Hook Form
- **Schema Validation:** Zod
- **Form Hooks:** useActionState, useFormStatus

### State Management
- **Server State:** Server Components + Server Actions
- **Client State:** Zustand (للواجهة فقط)
- **URL State:** Next.js searchParams

## 📋 المتطلبات

- Node.js 20 أو أحدث
- pnpm 8 أو أحدث
- حساب Supabase

## 🔧 التثبيت والإعداد

### 1. تثبيت المكتبات

```bash
pnpm install
```

### 2. إعداد Supabase

1. أنشئ مشروع جديد على [Supabase](https://supabase.com)
2. نفذ السكيما الموجود في ملف `schema.md` في SQL Editor
3. احصل على URL و Anon Key من Project Settings

### 3. إعداد المتغيرات البيئية

انسخ ملف `.env.local.example` إلى `.env.local`:

```bash
cp .env.local.example .env.local
```

ثم املأ المتغيرات:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**لإنشاء NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. إنشاء أول مستخدم Admin

في Supabase SQL Editor، نفذ:

```sql
-- إنشاء مستخدم admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"fname": "المدير العام"}'::jsonb
);

-- تحديث الدور إلى admin
UPDATE public.profiles 
SET user_role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

### 5. تشغيل المشروع

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint
```

الموقع سيعمل على: `http://localhost:3000`

## 📁 هيكل المشروع

```
new/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group للصفحات غير المحمية
│   │   └── login/                # صفحة تسجيل الدخول
│   ├── (dashboard)/              # Route group للصفحات المحمية
│   │   ├── admin/                # صفحات الإدارة
│   │   │   ├── users/            # إدارة المستخدمين
│   │   │   ├── farms/            # إدارة المزارع
│   │   │   ├── warehouses/       # إدارة المستودعات
│   │   │   ├── materials/        # إدارة المواد
│   │   │   ├── invoices/         # إدارة الفواتير
│   │   │   └── reports/          # التقارير والإحصائيات
│   │   └── farmer/               # صفحات المزارع
│   │       ├── daily-report/     # التقرير اليومي
│   │       ├── manufacturing/    # فواتير التصنيع
│   │       ├── reports/          # عرض التقارير
│   │       └── inventory/        # المخزون
│   ├── api/                      # API Routes
│   │   └── auth/[...nextauth]/   # NextAuth handlers
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── actions/                      # Server Actions
│   ├── daily-report.actions.ts   # إجراءات التقارير اليومية
│   ├── invoice.actions.ts        # إجراءات الفواتير
│   ├── manufacturing.actions.ts  # إجراءات التصنيع
│   ├── user.actions.ts           # إجراءات المستخدمين
│   └── farm.actions.ts           # إجراءات المزارع
├── components/                   # React Components
│   ├── ui/                       # UI Components (shadcn/ui)
│   ├── auth/                     # Authentication components
│   ├── farmer/                   # Farmer-specific components
│   ├── admin/                    # Admin-specific components
│   └── layout/                   # Layout components
├── lib/                          # Utilities
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript types
│   ├── database.types.ts         # Database types from schema
│   └── next-auth.d.ts            # NextAuth type extensions
├── auth.ts                       # NextAuth configuration
├── auth.config.ts                # NextAuth config details
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## 🔐 نظام الأدوار والصلاحيات

### Admin (المدير)
- الوصول الكامل لجميع الصفحات
- إدارة المستخدمين والمزارع والمستودعات
- عرض جميع التقارير والفواتير
- إدارة القوائم الأساسية

### Sub Admin (مدير فرعي)
- نفس صلاحيات Admin ما عدا إدارة المستخدمين

### Farmer (مزارع)
- إضافة التقارير اليومية
- إنشاء فواتير التصنيع
- عرض تقاريره فقط
- عرض مخزون مزرعته

## 🎨 المكونات المتوفرة (shadcn/ui)

تم إنشاء المكونات الأساسية التالية:
- Button
- Input
- Label
- Card
- Avatar
- Dropdown Menu
- Sonner (Toast notifications)

### إضافة مكونات إضافية

```bash
npx shadcn-ui@latest add [component-name]
```

أمثلة:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add textarea
```

## 📊 قاعدة البيانات

### الجداول الرئيسية

1. **profiles** - بيانات المستخدمين
2. **farms** - المزارع
3. **warehouses** - المستودعات
4. **materials** - المواد والمخزون
5. **poultry_status** - حالة القطعان
6. **daily_reports** - التقارير اليومية
7. **invoices** - فواتير البيع والشراء
8. **manufacturing_invoices** - فواتير التصنيع
9. **medicine_consumption_invoices** - فواتير استهلاك الأدوية

### القوائم المرجعية

- **egg_weights** - أوزان البيض
- **materials_names** - أسماء المواد
- **measurement_units** - وحدات القياس
- **expense_types** - أنواع المصاريف
- **medicines** - الأدوية واللقاحات
- **clients** - العملاء والموردين

## 🔄 Server Actions

جميع عمليات البيانات تتم عبر Server Actions:

```typescript
// مثال: إنشاء تقرير يومي
await createDailyReport(reportData, eggInvoices, droppingsInvoice, medicineInvoice);

// مثال: جلب التقارير
const { data, pagination } = await getDailyReports(warehouseId, page, limit);
```

## 🌐 دعم اللغة العربية

- الواجهة بالكامل باللغة العربية (RTL)
- استخدام خط Cairo من Google Fonts
- تنسيق التواريخ والأرقام بالشكل العربي
- دعم كامل للـ RTL في جميع المكونات

## 🔨 المهام المتبقية

### للإكمال:
- [ ] إنشاء نموذج التقرير اليومي الكامل
- [ ] صفحات إدارة المستخدمين للـ Admin
- [ ] صفحات إدارة المزارع والمستودعات
- [ ] صفحات إدارة المواد والقطعان
- [ ] صفحات الفواتير (بيع/شراء)
- [ ] صفحة فواتير التصنيع
- [ ] صفحات التقارير والإحصائيات
- [ ] رفع الملفات والمرفقات
- [ ] الطباعة وتصدير التقارير
- [ ] لوحة التحكم (Dashboard) مع الإحصائيات
- [ ] البحث والفلترة المتقدمة
- [ ] إشعارات الأحداث المهمة

### التحسينات المستقبلية:
- [ ] نظام الإشعارات الفورية
- [ ] تقارير متقدمة مع الرسوم البيانية
- [ ] تصدير البيانات (Excel, PDF)
- [ ] النسخ الاحتياطي التلقائي
- [ ] تطبيق موبايل (React Native)
- [ ] نظام الصلاحيات المتقدم
- [ ] سجل التغييرات (Audit Log)

## 📝 ملاحظات مهمة

1. **الأمان:**
   - جميع الصفحات محمية عبر Middleware
   - التحقق من الصلاحيات في Server Actions
   - استخدام Row Level Security في Supabase

2. **الأداء:**
   - Server Components للبيانات الثابتة
   - Client Components فقط عند الحاجة
   - Caching تلقائي من Next.js
   - PPR و React Compiler مفعّلين

3. **التحقق:**
   - Zod للتحقق من البيانات
   - التحقق على الـ client والـ server
   - رسائل خطأ واضحة بالعربية

## 🐛 استكشاف الأخطاء

### خطأ في الاتصال بـ Supabase
```bash
# تأكد من صحة المتغيرات البيئية
# تحقق من أن المشروع نشط على Supabase
```

### خطأ في المصادقة
```bash
# تأكد من وجود NEXTAUTH_SECRET
# تحقق من تطابق NEXTAUTH_URL مع الـ URL الحالي
```

### خطأ في TypeScript
```bash
# أعد تشغيل type checking
pnpm type-check

# أعد تشغيل dev server
pnpm dev
```

## 📞 الدعم والمساعدة

للأسئلة والمشاكل:
- راجع التوثيق الرسمي لـ [Next.js](https://nextjs.org/docs)
- راجع التوثيق الرسمي لـ [Supabase](https://supabase.com/docs)
- راجع التوثيق الرسمي لـ [NextAuth](https://authjs.dev/getting-started)

## 📄 الترخيص

© 2024 شركة القديراني - جميع الحقوق محفوظة

---

**تم تطويره باستخدام:**
- Next.js 15
- React 19
- TypeScript
- Supabase
- Tailwind CSS
- shadcn/ui