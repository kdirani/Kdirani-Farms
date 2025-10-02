import { Suspense } from 'react';
import { getPoultryStatuses } from '@/actions/poultry.actions';
import { PoultryTable } from '@/components/admin/poultry/poultry-table';
import { PoultryTableSkeleton } from '@/components/admin/poultry/poultry-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة القطعان - لوحة التحكم الإدارية',
  description: 'إدارة دفعات القطعان وتتبع أعداد الكتاكيت',
};

async function PoultryContent() {
  const result = await getPoultryStatuses();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل حالات القطعان'}
        </AlertDescription>
      </Alert>
    );
  }

  return <PoultryTable poultryStatuses={result.data} />;
}

export default function PoultryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة القطعان</h1>
        <p className="text-muted-foreground mt-2">
          إدارة دفعات القطعان وتتبع أعداد الكتاكيت في جميع المزارع
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع دفعات القطعان</CardTitle>
          <CardDescription>
            عرض وإدارة جميع دفعات القطعان في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PoultryTableSkeleton />}>
            <PoultryContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
