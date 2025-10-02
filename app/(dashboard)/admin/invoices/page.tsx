import { Suspense } from 'react';
import { getInvoices } from '@/actions/invoice.actions';
import { InvoicesTable } from '@/components/admin/invoices/invoices-table';
import { InvoicesTableSkeleton } from '@/components/admin/invoices/invoices-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة الفواتير - لوحة التحكم الإدارية',
  description: 'إدارة فواتير البيع والشراء',
};

async function InvoicesContent() {
  const result = await getInvoices();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل الفواتير'}
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
        <h1 className="text-3xl font-bold tracking-tight">إدارة الفواتير</h1>
        <p className="text-muted-foreground mt-2">
          إدارة فواتير البيع والشراء للمواد والمنتجات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الفواتير</CardTitle>
          <CardDescription>
            عرض وإدارة جميع الفواتير في النظام
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
