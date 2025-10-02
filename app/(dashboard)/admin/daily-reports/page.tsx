import { Suspense } from 'react';
import { getDailyReports } from '@/actions/daily-report.actions';
import { getWarehousesForMaterials } from '@/actions/material.actions';
import { DailyReportsView } from '@/components/admin/daily-reports/daily-reports-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Daily Reports - Admin Dashboard',
  description: 'View daily operational reports from all warehouses',
};

async function DailyReportsContent({ warehouseId, page }: { warehouseId?: string; page: number }) {
  // Get warehouses first
  const warehousesResult = await getWarehousesForMaterials();
  
  if (!warehousesResult.success || !warehousesResult.data || warehousesResult.data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No warehouses found. Please create a warehouse first.
        </AlertDescription>
      </Alert>
    );
  }

  // Use first warehouse if no warehouse selected
  const selectedWarehouseId = warehouseId || warehousesResult.data[0].id;

  const result = await getDailyReports(selectedWarehouseId, page);

  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load daily reports'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DailyReportsView 
      reports={result.data || []} 
      warehouses={warehousesResult.data}
      selectedWarehouseId={selectedWarehouseId}
      pagination={result.pagination}
    />
  );
}

interface DailyReportsPageProps {
  searchParams: { warehouse?: string; page?: string };
}

export default function DailyReportsPage({ searchParams }: DailyReportsPageProps) {
  const page = parseInt(searchParams.page || '1');
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
        <p className="text-muted-foreground mt-2">
          View comprehensive daily operational reports including production, sales, and inventory
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Operational Reports</CardTitle>
          <CardDescription>
            Track egg production, feed consumption, medicine usage, and sales activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <DailyReportsContent warehouseId={searchParams.warehouse} page={page} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
