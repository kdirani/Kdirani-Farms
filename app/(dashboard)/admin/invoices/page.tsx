import { Suspense } from 'react';
import { getInvoicesByFarm } from '@/actions/invoice.actions';
import { getFarms } from '@/actions/farm.actions';
import { InvoicesTable } from '@/components/admin/invoices/invoices-table';
import { InvoicesTableSkeleton } from '@/components/admin/invoices/invoices-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ExportInvoicesButton } from '@/components/admin/invoices/export-invoices-button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'إدارة الفواتير - لوحة التحكم الإدارية',
  description: 'إدارة فواتير البيع والشراء',
};

async function InvoicesContent({ farmId }: { farmId?: string }) {
  // Get farms first
  const farmsResult = await getFarms();
  
  if (!farmsResult.success || !farmsResult.data || farmsResult.data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          لم يتم العثور على مزارع. يرجى إنشاء مزرعة أولاً.
        </AlertDescription>
      </Alert>
    );
  }

  // Use first farm if no farm selected
  const selectedFarmId = farmId || farmsResult.data[0].id;

  const result = await getInvoicesByFarm(selectedFarmId);

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

  return (
    <InvoicesTable 
      invoices={result.data} 
      farms={farmsResult.data}
      selectedFarmId={selectedFarmId}
    />
  );
}

interface InvoicesPageProps {
  searchParams: Promise<{ farm?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفواتير</h1>
          <p className="text-muted-foreground mt-2">
            إدارة فواتير البيع والشراء للمواد والمنتجات
          </p>
        </div>
        <ExportInvoicesButton />
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
            <InvoicesContent farmId={params.farm} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
