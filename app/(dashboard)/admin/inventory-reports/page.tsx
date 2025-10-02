import { Suspense } from 'react';
import { getInventoryReport, getInventorySummary } from '@/actions/inventory-report.actions';
import { InventoryReportTable } from '@/components/admin/inventory-reports/inventory-report-table';
import { InventorySummaryCards } from '@/components/admin/inventory-reports/inventory-summary-cards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'تقارير المخزون - لوحة الإدارة',
  description: 'عرض تقارير وتحليلات المخزون الشاملة',
};

async function InventorySummaryContent() {
  const result = await getInventorySummary();

  if (!result.success || !result.data) {
    return null;
  }

  return <InventorySummaryCards summary={result.data} />;
}

async function InventoryReportContent() {
  const result = await getInventoryReport();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل تقرير المخزون'}
        </AlertDescription>
      </Alert>
    );
  }

  return <InventoryReportTable inventory={result.data} />;
}

export default function InventoryReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تقارير المخزون</h1>
        <p className="text-muted-foreground mt-2">
          تتبع وتحليل المخزون الشامل عبر جميع المستودعات
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}>
        <InventorySummaryContent />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على المخزون</CardTitle>
          <CardDescription>
            مستويات المخزون والحركات في الوقت الفعلي لجميع المواد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <InventoryReportContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
