import { Suspense } from 'react';
import { getMedicineInvoiceById } from '@/actions/medicine-invoice.actions';
import { getMedicineItems } from '@/actions/medicine-item.actions';
import { getMedicineExpenses } from '@/actions/medicine-expense.actions';
import { MedicineInvoiceDetailView } from '@/components/admin/medicines-invoices/medicine-invoice-detail-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Medicine Invoice Details - Admin Dashboard',
  description: 'View and edit medicine consumption invoice details',
};

interface MedicineInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

async function MedicineInvoiceContent({ invoiceId }: { invoiceId: string }) {
  const [invoiceResult, itemsResult, expensesResult] = await Promise.all([
    getMedicineInvoiceById(invoiceId),
    getMedicineItems(invoiceId),
    getMedicineExpenses(invoiceId),
  ]);

  if (!invoiceResult.success || !invoiceResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {invoiceResult.error || 'Medicine invoice not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <MedicineInvoiceDetailView
      invoice={invoiceResult.data}
      items={itemsResult.data || []}
      expenses={expensesResult.data || []}
    />
  );
}

export default async function MedicineInvoiceDetailPage({ params }: MedicineInvoiceDetailPageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-screen w-full" />}>
        <MedicineInvoiceContent invoiceId={id} />
      </Suspense>
    </div>
  );
}
