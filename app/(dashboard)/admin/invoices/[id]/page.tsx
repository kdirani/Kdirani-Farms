import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/actions/invoice.actions';
import { getInvoiceItems } from '@/actions/invoice-item.actions';
import { getInvoiceExpenses } from '@/actions/invoice-expense.actions';
import { InvoiceDetailView } from '@/components/admin/invoices/invoice-detail-view';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Invoice Details - Admin Dashboard',
  description: 'View and edit invoice details',
};

interface InvoiceDetailPageProps {
  params: { id: string };
}

async function InvoiceContent({ invoiceId }: { invoiceId: string }) {
  const [invoiceResult, itemsResult, expensesResult] = await Promise.all([
    getInvoiceById(invoiceId),
    getInvoiceItems(invoiceId),
    getInvoiceExpenses(invoiceId),
  ]);

  if (!invoiceResult.success || !invoiceResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {invoiceResult.error || 'Invoice not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <InvoiceDetailView
      invoice={invoiceResult.data}
      items={itemsResult.data || []}
      expenses={expensesResult.data || []}
    />
  );
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-screen w-full" />}>
        <InvoiceContent invoiceId={params.id} />
      </Suspense>
    </div>
  );
}
