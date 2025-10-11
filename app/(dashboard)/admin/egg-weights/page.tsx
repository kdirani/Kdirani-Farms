import { Suspense } from 'react';
import { getEggWeights } from '@/actions/egg-weight.actions';
import { EggWeightsTable } from '@/components/admin/egg-weights/egg-weights-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'أوزان البيض - لوحة التحكم الإدارية',
  description: 'إدارة جدول أوزان البيض',
};

async function EggWeightsContent() {
  const result = await getEggWeights();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل أوزان البيض'}
        </AlertDescription>
      </Alert>
    );
  }

  return <EggWeightsTable eggWeights={result.data} />;
}

export default function EggWeightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">أوزان البيض</h1>
        <p className="text-muted-foreground mt-2">
          إدارة أوزان البيض المستخدمة في المخزون والفواتير
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع أوزان البيض</CardTitle>
          <CardDescription>
            إضافة، تعديل، أو حذف أوزان البيض من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <EggWeightsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
