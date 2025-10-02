import { Suspense } from 'react';
import { getMedicineInvoices } from '@/actions/medicine-invoice.actions';
import { MedicineInvoicesTable } from '@/components/admin/medicines-invoices/medicine-invoices-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Medicine Consumption Invoices - Admin Dashboard',
  description: 'Manage medicine and vaccine consumption invoices',
};

async function MedicineInvoicesContent() {
  const result = await getMedicineInvoices();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load medicine invoices'}
        </AlertDescription>
      </Alert>
    );
  }

  return <MedicineInvoicesTable invoices={result.data} />;
}

export default function MedicineInvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medicine Consumption Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Manage medicine and vaccine consumption with automatic inventory tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicine Invoices</CardTitle>
          <CardDescription>
            Track medicine usage and automatically deduct from warehouse inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MedicineInvoicesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
