import { Suspense } from 'react';
import { getMaterialNames } from '@/actions/material-name.actions';
import { MaterialNamesTable } from '@/components/admin/materials-names/materials-names-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Material Names - Admin Dashboard',
  description: 'Manage material names lookup table',
};

async function MaterialNamesContent() {
  const result = await getMaterialNames();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load material names'}
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
        <h1 className="text-3xl font-bold tracking-tight">Material Names</h1>
        <p className="text-muted-foreground mt-2">
          Manage material names used in inventory and invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Material Names</CardTitle>
          <CardDescription>
            Add, edit, or remove material names from the system
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
