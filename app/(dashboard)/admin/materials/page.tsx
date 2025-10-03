import { Suspense } from 'react';
import { getMaterials, getMaterialsAggregated } from '@/actions/material.actions';
import { MaterialsTable } from '@/components/admin/materials/materials-table';
import { MaterialsTableSkeleton } from '@/components/admin/materials/materials-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة المواد - لوحة التحكم الإدارية',
  description: 'إدارة مخزون المواد وتتبع الأرصدة',
};

async function MaterialsContent({ warehouse }: { warehouse?: string }) {
  // جلب قائمة المستودعات أولاً للفلترة
  const { getWarehousesForMaterials } = await import('@/actions/material.actions');
  const warehousesResult = await getWarehousesForMaterials();
  const warehousesList = warehousesResult.success && warehousesResult.data 
    ? warehousesResult.data.map(w => ({ display: `${w.name} - ${w.farm_name}` }))
    : [];

  // استخدام الدالة المناسبة حسب اختيار المستودع
  const isAggregatedView = !warehouse || warehouse === 'all';
  const result = isAggregatedView
    ? await getMaterialsAggregated()
    : await getMaterials(warehouse);

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل المواد'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <MaterialsTable 
      materials={result.data} 
      isAggregated={isAggregatedView}
      availableWarehouses={warehousesList}
    />
  );
}

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouse?: string; search?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مخزون المواد</h1>
        <p className="text-muted-foreground mt-2">
          إدارة مخزون المواد وتتبع مستويات المخزون في المستودعات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع المواد</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المواد في مخزون المستودعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<MaterialsTableSkeleton />}>
            <MaterialsContent warehouse={params.warehouse} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
