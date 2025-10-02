import { Suspense } from 'react';
import { getMaterials } from '@/actions/material.actions';
import { MaterialsTable } from '@/components/admin/materials/materials-table';
import { MaterialsTableSkeleton } from '@/components/admin/materials/materials-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Materials Inventory - Admin Dashboard',
  description: 'Manage materials inventory and track balances',
};

async function MaterialsContent() {
  const result = await getMaterials();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load materials'}
        </AlertDescription>
      </Alert>
    );
  }

  return <MaterialsTable materials={result.data} />;
}

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Materials Inventory</h1>
        <p className="text-muted-foreground mt-2">
          Manage materials inventory and track stock levels across warehouses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Materials</CardTitle>
          <CardDescription>
            View and manage all materials in warehouse inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<MaterialsTableSkeleton />}>
            <MaterialsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
