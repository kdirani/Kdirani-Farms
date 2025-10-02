import { Suspense } from 'react';
import { getMaterials } from '@/actions/material.actions';
import { MaterialsTable } from '@/components/admin/materials/materials-table';
import { MaterialsTableSkeleton } from '@/components/admin/materials/materials-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة المواد - لوحة التحكم الإدارية',
  description: 'إدارة مخزون المواد وتتبع الأرصدة',
};

async function MaterialsContent() {
  const result = await getMaterials();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل المواد'}
        </AlertDescription>
      </Alert>
    );
  }

  return <MaterialsTable materials={result.data} />;
}

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مخزون المواد</h1>
        <p className="text-muted-foreground mt-2">
          إدارة مخزون المواد وتتبع مستويات المخزون في المستودعات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع المواد</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المواد في مخزون المستودعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<MaterialsTableSkeleton />}>
            <MaterialsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
