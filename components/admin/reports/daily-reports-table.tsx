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
import { DailyReportSummary } from '@/actions/general-report.actions';
import { formatDate } from '@/lib/utils';

interface DailyReportsTableProps {
  reports: DailyReportSummary[];
}

export function DailyReportsTable({ reports }: DailyReportsTableProps) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التقارير اليومية</CardTitle>
          <CardDescription>لا توجد تقارير يومية في الفترة المحددة</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>التقارير اليومية</CardTitle>
        <CardDescription>
          إجمالي {reports.length} تقرير يومي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>المزرعة</TableHead>
                <TableHead>المستودع</TableHead>
                <TableHead className="text-right">البيض المُنتَج</TableHead>
                <TableHead className="text-right">البيض المباع</TableHead>
                <TableHead className="text-right">الأعلاف (كغم)</TableHead>
                <TableHead className="text-right">السواد (كغم)</TableHead>
                <TableHead className="text-right">النفوق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {formatDate(new Date(report.report_date))}
                  </TableCell>
                  <TableCell>{report.farm_name}</TableCell>
                  <TableCell>{report.house_name}</TableCell>
                  <TableCell className="text-right">
                    {report.total_eggs_produced.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.total_eggs_sold.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.total_feed_consumed.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.total_droppings_sold.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.total_mortality.toLocaleString('en-US')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
