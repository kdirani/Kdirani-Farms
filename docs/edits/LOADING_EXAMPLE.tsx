/**
 * أمثلة على استخدام شاشات التحميل
 * Loading Screens Usage Examples
 */

import { Suspense } from 'react';
import { TableSkeleton, StatCardSkeleton, FormSkeleton } from '@/components/admin/table-skeleton';

// ═══════════════════════════════════════════════════════════
// مثال 1: صفحة بسيطة (التحميل التلقائي)
// ═══════════════════════════════════════════════════════════
// يكفي إنشاء loading.tsx في نفس المجلد

// app/(dashboard)/admin/my-page/page.tsx
export async function SimplePageExample() {
  const data = await fetchData(); // عملية بطيئة
  
  return (
    <div>
      <h1>صفحة بسيطة</h1>
      <p>{data}</p>
    </div>
  );
}

// app/(dashboard)/admin/my-page/loading.tsx
export function SimpleLoadingExample() {
  return <TableSkeleton rows={5} columns={4} />;
}

// ═══════════════════════════════════════════════════════════
// مثال 2: استخدام Suspense المخصص
// ═══════════════════════════════════════════════════════════

export function SuspenseExample() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">صفحة مع Suspense</h1>
      
      {/* جدول مع تحميل مخصص */}
      <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
        <DataTable />
      </Suspense>
      
      {/* نموذج مع تحميل مخصص */}
      <Suspense fallback={<FormSkeleton />}>
        <EditForm />
      </Suspense>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// مثال 3: Dashboard مع عدة Suspense Boundaries
// ═══════════════════════════════════════════════════════════

export function DashboardExample() {
  return (
    <div className="space-y-6">
      {/* العنوان - يُعرض مباشرة بدون تحميل */}
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة</p>
      </div>

      {/* بطاقات الإحصائيات - كل واحدة تُحمّل لوحدها */}
      <div className="grid grid-cols-4 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <UserCountCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <FarmsCountCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <ReportsCountCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <InvoicesCountCard />
        </Suspense>
      </div>

      {/* الجداول - كل واحد يُحمّل لوحده */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<TableSkeleton rows={5} columns={3} />}>
          <RecentReportsTable />
        </Suspense>
        
        <Suspense fallback={<TableSkeleton rows={5} columns={3} />}>
          <LowInventoryTable />
        </Suspense>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// مثال 4: صفحة مع تحميل متدرج
// ═══════════════════════════════════════════════════════════

export function StreamingExample() {
  return (
    <div className="space-y-6">
      {/* القسم الأول - يُعرض فوراً */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold">معلومات ثابتة</h2>
        <p>هذا المحتوى يظهر فوراً</p>
      </div>

      {/* القسم الثاني - يُحمّل أولاً */}
      <Suspense fallback={<TableSkeleton rows={3} columns={4} />}>
        <FastDataTable />
      </Suspense>

      {/* القسم الثالث - يُحمّل ثانياً (أبطأ) */}
      <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
        <SlowDataTable />
      </Suspense>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// مثال 5: Skeleton مخصص
// ═══════════════════════════════════════════════════════════

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CustomSkeletonExample() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* صورة المستخدم */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        
        {/* محتوى */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* أزرار */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// مثال 6: قائمة مع Skeleton
// ═══════════════════════════════════════════════════════════

export function ListSkeletonExample() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// مثال 7: Form مع تحميل تدريجي
// ═══════════════════════════════════════════════════════════

export function FormWithLoadingExample() {
  return (
    <div className="space-y-6">
      {/* العنوان - يظهر فوراً */}
      <h1 className="text-2xl font-bold">إضافة مزرعة جديدة</h1>
      
      {/* القوائم المنسدلة - تُحمّل */}
      <Suspense fallback={<FormSkeleton />}>
        <FarmFormWithOptions />
      </Suspense>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Components المستخدمة في الأمثلة (للتوضيح فقط)
// ═══════════════════════════════════════════════════════════

async function fetchData() {
  // محاكاة عملية بطيئة
  await new Promise(resolve => setTimeout(resolve, 2000));
  return "بيانات تم تحميلها";
}

async function DataTable() {
  const data = await fetchData();
  return <div>جدول البيانات: {data}</div>;
}

async function EditForm() {
  const data = await fetchData();
  return <div>نموذج التعديل: {data}</div>;
}

async function UserCountCard() {
  const count = await fetchData();
  return <div className="p-4 bg-white rounded shadow">المستخدمين: {count}</div>;
}

async function FarmsCountCard() {
  const count = await fetchData();
  return <div className="p-4 bg-white rounded shadow">المزارع: {count}</div>;
}

async function ReportsCountCard() {
  const count = await fetchData();
  return <div className="p-4 bg-white rounded shadow">التقارير: {count}</div>;
}

async function InvoicesCountCard() {
  const count = await fetchData();
  return <div className="p-4 bg-white rounded shadow">الفواتير: {count}</div>;
}

async function RecentReportsTable() {
  const data = await fetchData();
  return <div className="p-4 bg-white rounded shadow">أحدث التقارير</div>;
}

async function LowInventoryTable() {
  const data = await fetchData();
  return <div className="p-4 bg-white rounded shadow">المخزون المنخفض</div>;
}

async function FastDataTable() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return <div className="p-4 bg-white rounded shadow">بيانات سريعة</div>;
}

async function SlowDataTable() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return <div className="p-4 bg-white rounded shadow">بيانات بطيئة</div>;
}

async function FarmFormWithOptions() {
  const options = await fetchData();
  return <div className="p-4 bg-white rounded shadow">نموذج المزرعة</div>;
}
