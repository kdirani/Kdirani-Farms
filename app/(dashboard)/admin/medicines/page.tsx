import { Suspense } from 'react';
import { getMedicines } from '@/actions/medicine.actions';
import { MedicinesTable } from '@/components/admin/medicines/medicines-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Medicines & Vaccines - Admin Dashboard',
  description: 'Manage medicines and vaccines lookup table',
};

async function MedicinesContent() {
  const result = await getMedicines();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load medicines'}
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
        <h1 className="text-3xl font-bold tracking-tight">Medicines & Vaccines</h1>
        <p className="text-muted-foreground mt-2">
          Manage medicines and vaccines used in poultry care
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Medicines & Vaccines</CardTitle>
          <CardDescription>
            Add, edit, or remove medicines and vaccines from the system
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
