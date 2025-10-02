import { Suspense } from 'react';
import { getUsers } from '@/actions/user.actions';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersTableSkeleton } from '@/components/admin/users/users-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'إدارة المستخدمين - لوحة التحكم الإدارية',
  description: 'إدارة المستخدمين والصلاحيات في النظام',
};

async function UsersContent() {
  const result = await getUsers();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'فشل في تحميل المستخدمين'}
        </AlertDescription>
      </Alert>
    );
  }

  return <UsersTable users={result.data} />;
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <p className="text-muted-foreground mt-2">
          إدارة المستخدمين والأدوار والصلاحيات
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع المستخدمين</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المستخدمين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
