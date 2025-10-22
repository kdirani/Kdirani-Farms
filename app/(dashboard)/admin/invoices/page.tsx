import { Suspense } from 'react';
import { getInvoicesByFarm } from '@/actions/invoice.actions';
import { getFarms } from '@/actions/farm.actions';
import { getClients } from '@/actions/client.actions';
import { getWarehouses } from '@/actions/warehouse.actions';
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
  const [farmsResult, clientsResult, warehousesResult] = await Promise.all([
    getFarms(),
    getClients(),
    getWarehouses()
  ]);
  
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

  if (!clientsResult.success || !clientsResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {clientsResult.error || 'فشل في تحميل بيانات العملاء'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!warehousesResult.success || !warehousesResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {warehousesResult.error || 'فشل في تحميل بيانات المستودعات'}
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

  const invoicesWithPaymentInfo = result.data.map(inv => {
    const invoice: any = inv; // server type may differ; normalize optional fields
    return {
      ...invoice,
      warehouse_id: invoice.warehouse_id ?? null,
      client_id: invoice.client_id ?? null,
      payment_status: (invoice.payment_status as any) ?? 'unpaid',
      payment_method: (invoice.payment_method as any) ?? 'cash',
    };
  });

  return (
    <InvoicesTable 
      invoices={invoicesWithPaymentInfo}
      farms={farmsResult.data}
      clients={clientsResult.data}
      warehouses={warehousesResult.data}
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
