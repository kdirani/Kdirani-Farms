import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getWarehouses } from '@/actions/warehouse.actions';
import { WarehousesTable } from '@/components/admin/warehouses/warehouses-table';
import { WarehousesTableSkeleton } from '@/components/admin/warehouses/warehouses-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة المستودعات - لوحة التحكم الإدارية',
  description: 'إدارة المستودعات ومهام المزارع',
};

async function WarehousesContent() {
  const result = await getWarehouses();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل المستودعات'}
        </AlertDescription>
      </Alert>
    );
  }

  return <WarehousesTable warehouses={result.data} />;
}

export default function WarehousesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستودعات</h1>
        <p className="text-muted-foreground mt-2">
          إدارة المستودعات ومهام المزارع الخاصة بها
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع المستودعات</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المستودعات في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<WarehousesTableSkeleton />}>
            <WarehousesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
