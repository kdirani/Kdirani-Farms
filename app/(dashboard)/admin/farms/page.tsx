import { Suspense } from 'react';
import { getFarms } from '@/actions/farm.actions';
import { FarmsTable } from '@/components/admin/farms/farms-table';
import { FarmsTableSkeleton } from '@/components/admin/farms/farms-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ExportFarmsData } from '@/components/admin/farms/export-farms-data';

export const metadata = {
  title: 'إدارة المزارع - لوحة التحكم الإدارية',
  description: 'إدارة المزارع والمهام',
};

async function FarmsContent() {
  const result = await getFarms();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل المزارع'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <ExportFarmsData farms={result.data} />
      </div>
      <FarmsTable farms={result.data} />
    </>
  );
}

export default function FarmsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة المزارع</h1>
        <p className="text-muted-foreground mt-2">
          إدارة المزارع وتعيينها للمزارعين
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع المزارع</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المزارع في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FarmsTableSkeleton />}>
            <FarmsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
