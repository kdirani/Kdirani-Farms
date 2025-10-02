'use client';

import { InventorySummary } from '@/actions/inventory-report.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, XCircle, Warehouse } from 'lucide-react';

interface InventorySummaryCardsProps {
  summary: InventorySummary;
}

export function InventorySummaryCards({ summary }: InventorySummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المواد</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_materials}</div>
          <p className="text-xs text-muted-foreground">
            عبر {summary.total_warehouses} مستودع
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المواد منخفضة المخزون</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{summary.low_stock_count}</div>
          <p className="text-xs text-muted-foreground">
            المواد أقل من 100 وحدة
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نفد المخزون</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{summary.out_of_stock_count}</div>
          <p className="text-xs text-muted-foreground">
            المواد تحتاج إعادة تخزين
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المستودعات</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_warehouses}</div>
          <p className="text-xs text-muted-foreground">
            المواقع النشطة
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
