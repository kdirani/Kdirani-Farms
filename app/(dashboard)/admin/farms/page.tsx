import { Suspense } from 'react';
import { getFarms } from '@/actions/farm.actions';
import { FarmsTable } from '@/components/admin/farms/farms-table';
import { FarmsTableSkeleton } from '@/components/admin/farms/farms-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Farm Management - Admin Dashboard',
  description: 'Manage farms and assignments',
};

async function FarmsContent() {
  const result = await getFarms();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load farms'}
        </AlertDescription>
      </Alert>
    );
  }

  return <FarmsTable farms={result.data} />;
}

export default function FarmsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Farm Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage farms and assign them to farmers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Farms</CardTitle>
          <CardDescription>
            View and manage all farms in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FarmsTableSkeleton />}>
            <FarmsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
