import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getMaterialNames } from '@/actions/material-name.actions';
import { MaterialNamesTable } from '@/components/admin/materials-names/materials-names-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'أسماء المواد - لوحة التحكم الإدارية',
  description: 'إدارة جدول أسماء المواد',
};

async function MaterialNamesContent() {
  const result = await getMaterialNames();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل أسماء المواد'}
        </AlertDescription>
      </Alert>
    );
  }

  return <MaterialNamesTable materialNames={result.data} />;
}

export default function MaterialNamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">أسماء المواد</h1>
        <p className="text-muted-foreground mt-2">
          إدارة أسماء المواد المستخدمة في المخزون والفواتير
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع أسماء المواد</CardTitle>
          <CardDescription>
            إضافة أو تعديل أو حذف أسماء المواد من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MaterialNamesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
