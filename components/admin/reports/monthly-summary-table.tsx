'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MonthlySummary } from '@/actions/general-report.actions';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MonthlySummaryTableProps {
  summaries: MonthlySummary[];
}

export function MonthlySummaryTable({ summaries }: MonthlySummaryTableProps) {
  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التقارير الشهرية</CardTitle>
          <CardDescription>لا توجد تقارير شهرية في الفترة المحددة</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate comparison with previous month
  const getComparison = (currentValue: number, index: number) => {
    if (index >= summaries.length - 1) return null;
    const previousValue = summaries[index + 1].total_eggs_produced;
    if (previousValue === 0) return null;
    
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return change;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>التقارير الشهرية</CardTitle>
        <CardDescription>
          ملخص {summaries.length} شهر - مقارنة الإنتاج بين الأشهر
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشهر</TableHead>
                <TableHead>السنة</TableHead>
                <TableHead className="text-right">عدد التقارير</TableHead>
                <TableHead className="text-right">البيض المُنتَج</TableHead>
                <TableHead className="text-right">البيض المباع</TableHead>
                <TableHead className="text-right">الأعلاف (كغم)</TableHead>
                <TableHead className="text-right">السواد (كغم)</TableHead>
                <TableHead className="text-right">النفوق</TableHead>
                <TableHead className="text-right">متوسط يومي</TableHead>
                <TableHead className="text-right">المقارنة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary, index) => {
                const comparison = getComparison(summary.total_eggs_produced, index);
                
                return (
                  <TableRow key={`${summary.year}-${summary.month}`}>
                    <TableCell className="font-medium">{summary.month}</TableCell>
                    <TableCell>{summary.year}</TableCell>
                    <TableCell className="text-right">{summary.reports_count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {summary.total_eggs_produced.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.total_eggs_sold.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.total_feed_consumed.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.total_droppings_sold.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.total_mortality.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.daily_average_production.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      {comparison !== null ? (
                        <Badge
                          variant={comparison > 0 ? 'success' : comparison < 0 ? 'destructive' : 'secondary'}
                          className="gap-1"
                        >
                          {comparison > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : comparison < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {Math.abs(comparison).toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
