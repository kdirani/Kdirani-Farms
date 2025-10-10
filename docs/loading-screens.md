# شاشات التحميل في النظام

تم إضافة نظام شامل لشاشات التحميل لتحسين تجربة المستخدم عند الانتقال بين الصفحات.

## 📋 المكونات المتوفرة

### 1. شاشة التحميل الافتراضية للإدارة
**الموقع**: `app/(dashboard)/admin/loading.tsx`

تظهر تلقائياً عند الانتقال بين أي صفحات إدارية.

```tsx
// يعمل تلقائياً - لا حاجة لكود إضافي
// فقط انتقل بين الصفحات في /admin/*
```

**المميزات**:
- ⚡ سريعة وبسيطة
- 🎨 تصميم أنيق مع spinner دوار
- ✨ تأثيرات animate-pulse و animate-ping
- 🌐 نص عربي

---

### 2. مكون TableSkeleton
**الموقع**: `components/admin/table-skeleton.tsx`

استخدمه لعرض هيكل تحميل للجداول:

```tsx
import { TableSkeleton } from '@/components/admin/table-skeleton';

<Suspense fallback={<TableSkeleton rows={5} columns={6} />}>
  <YourTableComponent />
</Suspense>
```

**الخيارات**:
- `rows`: عدد الصفوف (افتراضي: 5)
- `columns`: عدد الأعمدة (افتراضي: 4)
- `showHeader`: إظهار header الجدول (افتراضي: true)

---

### 3. مكون StatCardSkeleton
**الموقع**: `components/admin/table-skeleton.tsx`

لبطاقات الإحصائيات في الـ Dashboard:

```tsx
import { StatCardSkeleton } from '@/components/admin/table-skeleton';

<Suspense fallback={<StatCardSkeleton />}>
  <StatCard />
</Suspense>
```

---

### 4. مكون FormSkeleton
**الموقع**: `components/admin/table-skeleton.tsx`

لنماذج الإدخال والتعديل:

```tsx
import { FormSkeleton } from '@/components/admin/table-skeleton';

<Suspense fallback={<FormSkeleton />}>
  <YourForm />
</Suspense>
```

---

### 5. مكون Skeleton الأساسي
**الموقع**: `components/ui/skeleton.tsx`

للحالات المخصصة:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-32" />
<Skeleton className="h-10 w-10 rounded-full" />
```

---

## 🎨 التأثيرات المتاحة

بفضل `tailwindcss-animate`، لديك تأثيرات جاهزة:

```tsx
className="animate-in fade-in duration-300"     // ظهور تدريجي
className="animate-pulse"                       // نبض مستمر
className="animate-ping"                        // موجات متوسعة
className="animate-spin"                        // دوران
```

---

## 📝 أمثلة عملية

### مثال 1: صفحة بسيطة مع loading.tsx
```tsx
// app/(dashboard)/admin/my-page/page.tsx
export default async function MyPage() {
  const data = await fetchData(); // عملية بطيئة
  
  return <div>المحتوى</div>;
}

// app/(dashboard)/admin/my-page/loading.tsx
export default function Loading() {
  return <TableSkeleton rows={8} columns={5} />;
}
```

### مثال 2: استخدام Suspense مخصص
```tsx
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/admin/table-skeleton';

export default function Page() {
  return (
    <div className="space-y-6">
      <h1>عنوان الصفحة</h1>
      
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
```

### مثال 3: Multiple Suspense Boundaries
```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      <div className="grid grid-cols-4 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <StatCard1 />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <StatCard2 />
        </Suspense>
      </div>
      
      {/* جدول */}
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
```

---

## ⚡ نصائح الأداء

1. **استخدم loading.tsx للصفحات الكاملة** - أسهل وأنظف
2. **استخدم Suspense للأجزاء المحددة** - تحكم أكبر
3. **اجعل Skeleton مشابهاً للمحتوى النهائي** - تجربة أفضل
4. **استخدم animate-in fade-in للانتقال السلس** - مظهر احترافي

---

## 🔧 التخصيص

لإنشاء شاشة تحميل مخصصة:

```tsx
// components/admin/custom-loading.tsx
import { Loader2 } from 'lucide-react';

export function CustomLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        {/* شعار الشركة */}
        <Image src="/logos/logo.svg" width={80} height={80} alt="Logo" />
        
        {/* Spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        
        {/* رسالة */}
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}
```

---

## 📚 المراجع

- [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)
