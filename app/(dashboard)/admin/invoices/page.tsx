import { Suspense } from 'react';
import { getInvoices } from '@/actions/invoice.actions';
import { InvoicesTable } from '@/components/admin/invoices/invoices-table';
import { InvoicesTableSkeleton } from '@/components/admin/invoices/invoices-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Invoices - Admin Dashboard',
  description: 'Manage buy and sell invoices',
};

async function InvoicesContent() {
  const result = await getInvoices();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load invoices'}
        </AlertDescription>
      </Alert>
    );
  }

  return <InvoicesTable invoices={result.data} />;
}

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage buy and sell invoices for materials and products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            View and manage all invoices in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InvoicesTableSkeleton />}>
            <InvoicesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
