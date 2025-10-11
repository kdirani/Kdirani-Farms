import { Suspense } from 'react';
import { getDailyReportsByFarm } from '@/actions/daily-report.actions';
import { getFarms } from '@/actions/farm.actions';
import { DailyReportsView } from '@/components/admin/daily-reports/daily-reports-view';
import { ExportDailyReportsButton } from '@/components/admin/daily-reports/export-daily-reports-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'التقارير اليومية - لوحة الإدارة',
  description: 'عرض التقارير التشغيلية اليومية من جميع المزارع',
};

async function DailyReportsContent({ farmId, page }: { farmId?: string; page: number }) {
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

  const result = await getDailyReportsByFarm(selectedFarmId, page);

  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل التقارير اليومية'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DailyReportsView 
      reports={result.data || []} 
      farms={farmsResult.data}
      selectedFarmId={selectedFarmId}
      pagination={result.pagination}
    />
  );
}

interface DailyReportsPageProps {
  searchParams: Promise<{ farm?: string; page?: string }>;
}

export default async function DailyReportsPage({ searchParams }: DailyReportsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  
  // Fetch farms data for the export button
  const farmsResult = await getFarms();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير اليومية</h1>
        <p className="text-muted-foreground mt-2">
          عرض التقارير التشغيلية اليومية الشاملة بما في ذلك الإنتاج والمبيعات والمخزون
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>التقارير التشغيلية اليومية</CardTitle>
            <CardDescription>
              تتبع إنتاج البيض واستهلاك العلف واستخدام الأدوية ونشاط المبيعات
            </CardDescription>
          </div>
          {params.farm && farmsResult.success && (
            <ExportDailyReportsButton 
              farmId={params.farm}
              farmName={farmsResult.data?.find(f => f.id === params.farm)?.name}
            />
          )}
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <DailyReportsContent farmId={params.farm} page={page} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
