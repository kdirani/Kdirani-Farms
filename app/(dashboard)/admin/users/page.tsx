import { Suspense } from 'react';
import { getUsers } from '@/actions/user.actions';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersTableSkeleton } from '@/components/admin/users/users-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

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

async function refreshUsers() {
  'use server';
  revalidatePath('/admin/users');
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-2">
            إدارة المستخدمين والأدوار والصلاحيات
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>جميع المستخدمين</CardTitle>
            <CardDescription>
              عرض وإدارة جميع المستخدمين في النظام
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <UsersContent />
        </CardContent>
      </Card>
    </div>
  );
}
