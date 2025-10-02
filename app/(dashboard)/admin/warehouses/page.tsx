import { Suspense } from 'react';
import { getWarehouses } from '@/actions/warehouse.actions';
import { WarehousesTable } from '@/components/admin/warehouses/warehouses-table';
import { WarehousesTableSkeleton } from '@/components/admin/warehouses/warehouses-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Warehouse Management - Admin Dashboard',
  description: 'Manage warehouses and farm assignments',
};

async function WarehousesContent() {
  const result = await getWarehouses();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load warehouses'}
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
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage warehouses and their farm assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Warehouses</CardTitle>
          <CardDescription>
            View and manage all warehouses in the system
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
