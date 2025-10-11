import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getMedicineInvoices } from '@/actions/medicine-invoice.actions';
import { MedicineInvoicesTable } from '@/components/admin/medicines-invoices/medicine-invoices-table';
import { ExportMedicinesInvoicesButton } from '@/components/admin/medicines-invoices/export-medicines-invoices-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'فواتير استهلاك الأدوية - لوحة التحكم الإدارية',
  description: 'إدارة فواتير استهلاك الأدوية واللقاحات',
};

async function MedicineInvoicesContent() {
  const result = await getMedicineInvoices();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل فواتير الأدوية'}
        </AlertDescription>
      </Alert>
    );
  }

  return <MedicineInvoicesTable invoices={result.data} />;
}

export default function MedicineInvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">فواتير استهلاك الأدوية</h1>
          <p className="text-muted-foreground mt-2">
            إدارة استهلاك الأدوية واللقاحات مع تتبع المخزون التلقائي
          </p>
        </div>
        <ExportMedicinesInvoicesButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فواتير الأدوية</CardTitle>
          <CardDescription>
            تتبع استخدام الأدوية وخصمها تلقائيًا من مخزون المستودعات
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
