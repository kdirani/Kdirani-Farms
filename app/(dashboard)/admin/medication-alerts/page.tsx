import { Suspense } from 'react';
import { getAllAlertsForAdmin } from '@/actions/medication-alerts.actions';
import { getFarms } from '@/actions/farm.actions';
import { MedicationAlertsTable } from '@/components/admin/medication-alerts/medication-alerts-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'تنبيهات الأدوية - لوحة التحكم الإدارية',
  description: 'إدارة تنبيهات الأدوية لجميع المزارع',
};

async function MedicationAlertsContent() {
  const [alertsResult, farmsResult] = await Promise.all([
    getAllAlertsForAdmin(),
    getFarms(),
  ]);

  if (!alertsResult.success || !alertsResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {alertsResult.error || 'فشل في تحميل التنبيهات'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!farmsResult.success || !farmsResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {farmsResult.error || 'فشل في تحميل المزارع'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <MedicationAlertsTable 
      alerts={alertsResult.data} 
      farms={farmsResult.data}
    />
  );
}

export default function MedicationAlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تنبيهات الأدوية</h1>
        <p className="text-muted-foreground mt-2">
          متابعة وإدارة تنبيهات الأدوية لجميع المزارع
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جدول التنبيهات</CardTitle>
          <CardDescription>
            عرض جميع تنبيهات الأدوية وحالة إعطائها للمزارع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MedicationAlertsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
