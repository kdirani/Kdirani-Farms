import { Suspense } from 'react';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { CompleteFarmSetupForm } from '@/components/admin/setup/complete-farm-setup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export const metadata = {
  title: 'إعداد مزرعة كاملة - لوحة التحكم',
  description: 'إنشاء إعداد مزرعة كامل مع المستخدم والمزرعة والمستودع والقطيع والمواد الغذائية والأدوية',
};

async function SetupFormContent() {
  const [materialNamesResult, unitsResult] = await Promise.all([
    getMaterialNames(),
    getMeasurementUnits(),
  ]);

  if (!materialNamesResult.success || !materialNamesResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          فشل تحميل أسماء المواد: {materialNamesResult.error || 'خطأ غير معروف'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!unitsResult.success || !unitsResult.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          فشل تحميل وحدات القياس: {unitsResult.error || 'خطأ غير معروف'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <CompleteFarmSetupForm
      materialNames={materialNamesResult.data}
      units={unitsResult.data}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function CompleteFarmSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعداد مزرعة كاملة</h1>
        <p className="text-muted-foreground mt-2">
          إنشاء تكوين مزرعة كامل في مكان واحد: المزارع، المزرعة، المستودع، القطيع، المواد الغذائية والأدوية
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <SetupFormContent />
      </Suspense>
    </div>
  );
}
