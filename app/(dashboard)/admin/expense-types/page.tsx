import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getExpenseTypes } from '@/actions/expense-type.actions';
import { ExpenseTypesTable } from '@/components/admin/expense-types/expense-types-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'أنواع المصروفات - لوحة التحكم الإدارية',
  description: 'إدارة جدول أنواع المصروفات',
};

async function ExpenseTypesContent() {
  const result = await getExpenseTypes();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل أنواع المصروفات'}
        </AlertDescription>
      </Alert>
    );
  }

  return <ExpenseTypesTable expenseTypes={result.data} />;
}

export default function ExpenseTypesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">أنواع المصروفات</h1>
        <p className="text-muted-foreground mt-2">
          إدارة أنواع المصروفات المستخدمة في الفواتير والتتبع المالي
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع أنواع المصروفات</CardTitle>
          <CardDescription>
            إضافة، تعديل، أو حذف أنواع المصروفات من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ExpenseTypesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
