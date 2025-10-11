import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getPoultryStatuses } from '@/actions/poultry.actions';
import { PoultryTable } from '@/components/admin/poultry/poultry-table';
import { PoultryTableSkeleton } from '@/components/admin/poultry/poultry-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة القطعان - لوحة التحكم الإدارية',
  description: 'إدارة القطعان وتتبع أعداد الكتاكيت (قطيع واحد لكل مزرعة)',
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
          إدارة القطعان وتتبع أعداد الكتاكيت (كل مزرعة لها قطيع واحد فقط)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع القطعان</CardTitle>
          <CardDescription>
            عرض وإدارة القطعان في النظام (قطيع واحد لكل مزرعة)
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
