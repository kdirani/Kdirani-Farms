import { Suspense } from 'react';
import { getEggWeights } from '@/actions/egg-weight.actions';
import { EggWeightsTable } from '@/components/admin/egg-weights/egg-weights-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Egg Weights - Admin Dashboard',
  description: 'Manage egg weight ranges lookup table',
};

async function EggWeightsContent() {
  const result = await getEggWeights();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load egg weights'}
        </AlertDescription>
      </Alert>
    );
  }

  return <EggWeightsTable eggWeights={result.data} />;
}

export default function EggWeightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Egg Weights</h1>
        <p className="text-muted-foreground mt-2">
          Manage egg weight ranges used in inventory and invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Egg Weight Ranges</CardTitle>
          <CardDescription>
            Add, edit, or remove egg weight ranges from the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <EggWeightsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
