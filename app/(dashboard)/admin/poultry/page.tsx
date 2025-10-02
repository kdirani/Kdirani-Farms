import { Suspense } from 'react';
import { getPoultryStatuses } from '@/actions/poultry.actions';
import { PoultryTable } from '@/components/admin/poultry/poultry-table';
import { PoultryTableSkeleton } from '@/components/admin/poultry/poultry-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Poultry Management - Admin Dashboard',
  description: 'Manage poultry batches and track chick counts',
};

async function PoultryContent() {
  const result = await getPoultryStatuses();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load poultry statuses'}
        </AlertDescription>
      </Alert>
    );
  }

  return <PoultryTable poultryStatuses={result.data} />;
}

export default function PoultryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Poultry Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage poultry batches and track chick counts across farms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Poultry Batches</CardTitle>
          <CardDescription>
            View and manage all poultry batches in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PoultryTableSkeleton />}>
            <PoultryContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
