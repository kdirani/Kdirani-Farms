import { Suspense } from 'react';
import { getExpenseTypes } from '@/actions/expense-type.actions';
import { ExpenseTypesTable } from '@/components/admin/expense-types/expense-types-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Expense Types - Admin Dashboard',
  description: 'Manage expense types lookup table',
};

async function ExpenseTypesContent() {
  const result = await getExpenseTypes();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load expense types'}
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
        <h1 className="text-3xl font-bold tracking-tight">Expense Types</h1>
        <p className="text-muted-foreground mt-2">
          Manage expense types used in invoices and financial tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Expense Types</CardTitle>
          <CardDescription>
            Add, edit, or remove expense types from the system
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
