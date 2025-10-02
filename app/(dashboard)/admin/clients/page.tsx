import { Suspense } from 'react';
import { getClients } from '@/actions/client.actions';
import { ClientsTable } from '@/components/admin/clients/clients-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Clients - Admin Dashboard',
  description: 'Manage customers and providers',
};

async function ClientsContent() {
  const result = await getClients();

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || 'Failed to load clients'}
        </AlertDescription>
      </Alert>
    );
  }

  return <ClientsTable clients={result.data} />;
}

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage customers and providers for invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            View and manage all customers and providers in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ClientsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
