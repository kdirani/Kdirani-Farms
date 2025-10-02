import { Suspense } from 'react';
import { getManufacturingInvoices } from '@/actions/manufacturing.actions';
import { ManufacturingTable } from '@/components/admin/manufacturing/manufacturing-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Manufacturing - Admin Dashboard',
  description: 'Manage manufacturing invoices',
};

async function ManufacturingContent() {
  const result = await getManufacturingInvoices();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load manufacturing invoices'}
        </AlertDescription>
      </Alert>
    );
  }

  return <ManufacturingTable invoices={result.data} />;
}

export default function ManufacturingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manufacturing Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage manufacturing invoices, items, and expenses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manufacturing Invoices</CardTitle>
          <CardDescription>
            View and manage all manufacturing invoices in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ManufacturingContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
