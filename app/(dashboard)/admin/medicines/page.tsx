import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getMedicines } from '@/actions/medicine.actions';
import { MedicinesTable } from '@/components/admin/medicines/medicines-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'الأدوية واللقاحات - لوحة التحكم الإدارية',
  description: 'إدارة جدول الأدوية واللقاحات',
};

async function MedicinesContent() {
  const result = await getMedicines();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل الأدوية'}
        </AlertDescription>
      </Alert>
    );
  }

  return <MedicinesTable medicines={result.data} />;
}

export default function MedicinesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الأدوية واللقاحات</h1>
        <p className="text-muted-foreground mt-2">
          إدارة الأدوية واللقاحات المستخدمة في رعاية الدواجن
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع الأدوية واللقاحات</CardTitle>
          <CardDescription>
            إضافة، تعديل، أو حذف الأدوية واللقاحات من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MedicinesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
