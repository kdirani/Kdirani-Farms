import { Suspense } from 'react';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { UnitsTable } from '@/components/admin/units/units-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Measurement Units - Admin Dashboard',
  description: 'Manage measurement units lookup table',
};

async function UnitsContent() {
  const result = await getMeasurementUnits();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load measurement units'}
        </AlertDescription>
      </Alert>
    );
  }

  return <UnitsTable units={result.data} />;
}

export default function UnitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Measurement Units</h1>
        <p className="text-muted-foreground mt-2">
          Manage measurement units used in inventory and invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Measurement Units</CardTitle>
          <CardDescription>
            Add, edit, or remove measurement units from the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <UnitsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
