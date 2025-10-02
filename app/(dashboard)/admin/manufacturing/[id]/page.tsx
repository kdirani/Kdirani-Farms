import { Suspense } from 'react';
import { getManufacturingInvoiceById } from '@/actions/manufacturing.actions';
import { getManufacturingItems } from '@/actions/manufacturing-item.actions';
import { getManufacturingExpenses } from '@/actions/manufacturing-expense.actions';
import { ManufacturingDetailView } from '@/components/admin/manufacturing/manufacturing-detail-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Manufacturing Details - Admin Dashboard',
  description: 'View and edit manufacturing invoice details',
};

interface ManufacturingDetailPageProps {
  params: { id: string };
}

async function ManufacturingContent({ invoiceId }: { invoiceId: string }) {
  const [invoiceResult, itemsResult, expensesResult] = await Promise.all([
    getManufacturingInvoiceById(invoiceId),
    getManufacturingItems(invoiceId),
    getManufacturingExpenses(invoiceId),
  ]);

  if (!invoiceResult.success || !invoiceResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {invoiceResult.error || 'Manufacturing invoice not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ManufacturingDetailView
      invoice={invoiceResult.data}
      items={itemsResult.data || []}
      expenses={expensesResult.data || []}
    />
  );
}

export default function ManufacturingDetailPage({ params }: ManufacturingDetailPageProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-screen w-full" />}>
        <ManufacturingContent invoiceId={params.id} />
      </Suspense>
    </div>
  );
}
