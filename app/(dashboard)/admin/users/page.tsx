import { Suspense } from 'react';
import { getUsers } from '@/actions/user.actions';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersTableSkeleton } from '@/components/admin/users/users-table-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'User Management - Admin Dashboard',
  description: 'Manage system users and permissions',
};

async function UsersContent() {
  const result = await getUsers();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load users'}
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
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage system users, roles, and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all users in the system
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
