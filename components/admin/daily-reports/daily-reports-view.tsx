'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  Egg,
  Activity,
  TrendingUp,
  Package,
  Edit,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toggleDailyReportStatus } from '@/actions/daily-report.actions';
import { getDailyReportAttachments, type DailyReportAttachment } from '@/actions/daily-report-attachment.actions';
import { toast } from 'sonner';
import { EditDailyReportDialog } from '@/components/admin/daily-reports/edit-daily-report-dialog';

interface DailyReport {
  id: string;
  warehouse_id: string;
  report_date: string;
  report_time: string;
  production_eggs_healthy: number;
  production_eggs_deformed: number;
  production_eggs: number;
  production_egg_rate: number;
  eggs_sold: number;
  eggs_gift: number;
  previous_eggs_balance: number;
  current_eggs_balance: number;
  carton_consumption: number;
  chicks_before: number;
  chicks_dead: number;
  chicks_after: number;
  feed_daily_kg: number;
  feed_cumulative_kg: number;
  feed_conversion_rate: number;
  feed_conversion_ratio: number;
  production_droppings: number;
  notes: string | null;
  checked: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface Farm {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DailyReportsViewProps {
  reports: DailyReport[];
  farms: Farm[];
  selectedFarmId: string;
  pagination?: Pagination;
}

export function DailyReportsView({ reports, farms, selectedFarmId, pagination }: DailyReportsViewProps) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Record<string, DailyReportAttachment[]>>({});
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);

  const handleFarmChange = (farmId: string) => {
    router.push(`/admin/daily-reports?farm=${farmId}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/daily-reports?farm=${selectedFarmId}&page=${page}`);
  };

  const toggleExpand = async (reportId: string) => {
    const newExpandedRow = expandedRow === reportId ? null : reportId;
    setExpandedRow(newExpandedRow);
    
    // Load attachments if expanding and not already loaded
    if (newExpandedRow && !attachments[reportId]) {
      const result = await getDailyReportAttachments(reportId);
      if (result.success && result.data) {
        setAttachments(prev => ({
          ...prev,
          [reportId]: result.data!
        }));
      }
    }
  };

  const handleToggleStatus = async (reportId: string, currentStatus: boolean) => {
    setLoadingStatus(reportId);
    try {
      const result = await toggleDailyReportStatus(reportId, currentStatus);
      if (result.success) {
        toast.success(currentStatus ? 'تم إلغاء التحقق من التقرير' : 'تم التحقق من التقرير بنجاح');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل في تحديث الحالة');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="space-y-4">
      {editingReport && (
        <EditDailyReportDialog
          report={editingReport}
          onClose={() => setEditingReport(null)}
        />
      )}
      
      <div className="flex items-center justify-between">
        <Select value={selectedFarmId} onValueChange={handleFarmChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="اختر المزرعة" />
          </SelectTrigger>
          <SelectContent>
            {farms.map((farm) => (
              <SelectItem key={farm.id} value={farm.id}>
                {farm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {pagination && (
          <div className="text-sm text-muted-foreground">
            عرض {reports.length} من {pagination.total} تقرير
          </div>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          لم يتم العثور على تقارير يومية لهذه المزرعة
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead className="text-right">إنتاج البيض</TableHead>
                  <TableHead className="text-right">البيض المباع</TableHead>
                  <TableHead className="text-right">الرصيد الحالي</TableHead>
                  <TableHead className="text-right">الكتاكيت (قبل/مات/بعد)</TableHead>
                  <TableHead className="text-right">العلف (كيلو)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <React.Fragment key={report.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {formatDate(new Date(report.report_date))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.report_time}
                            </div>
                          </div>
                          {attachments[report.id] && attachments[report.id].length > 0 && (
                            <div className="relative group">
                              <FileText className="h-3 w-3 text-primary" />
                              <span className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap -top-8 left-0 z-10">
                                {attachments[report.id].length} مرفقات
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-semibold">{formatNumber(report.production_eggs)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(report.production_egg_rate)}% rate
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(report.eggs_sold)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(report.current_eggs_balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs">
                          {formatNumber(report.chicks_before)} / {formatNumber(report.chicks_dead)} / {formatNumber(report.chicks_after)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <div>{formatNumber(report.feed_daily_kg)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(report.feed_conversion_rate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(report.id, report.checked)}
                          disabled={loadingStatus === report.id}
                          className="h-auto p-0 hover:bg-transparent"
                        >
                          {report.checked ? (
                            <Badge variant="success" className="gap-1 cursor-pointer hover:opacity-80">
                              <CheckCircle className="h-3 w-3" />
                              مُتحقق
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1 cursor-pointer hover:opacity-80">
                              <XCircle className="h-3 w-3" />
                              في الانتظار
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpand(report.id)}
                          >
                            {expandedRow === report.id ? 'إخفاء' : 'التفاصيل'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingReport(report)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRow === report.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Egg className="h-4 w-4" />
                                  تفاصيل البيض
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">صحيح:</span>
                                  <span className="font-medium">{formatNumber(report.production_eggs_healthy)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">مشوه:</span>
                                  <span className="font-medium">{formatNumber(report.production_eggs_deformed)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">هدية:</span>
                                  <span className="font-medium">{formatNumber(report.eggs_gift)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">الرصيد السابق:</span>
                                  <span className="font-medium">{formatNumber(report.previous_eggs_balance)}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  حالة القطيع
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">قبل:</span>
                                  <span className="font-medium">{formatNumber(report.chicks_before)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">مات:</span>
                                  <span className="font-medium text-destructive">{formatNumber(report.chicks_dead)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">بعد:</span>
                                  <span className="font-medium">{formatNumber(report.chicks_after)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">معدل الوفيات:</span>
                                  <span className="font-medium">
                                    {formatNumber(report.chicks_before > 0 
                                      ? ((report.chicks_dead / report.chicks_before) * 100) 
                                      : 0)}%
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  استهلاك العلف
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">يومي (كيلو):</span>
                                  <span className="font-medium">{formatNumber(report.feed_daily_kg)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">تراكمي (كيلو):</span>
                                  <span className="font-medium">{formatNumber(report.feed_cumulative_kg)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">معدل تحويل العلف:</span>
                                  <span className="font-medium">{formatNumber(report.feed_conversion_rate)}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  أخرى
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">الكرتون المستخدم:</span>
                                  <span className="font-medium">{formatNumber(report.carton_consumption)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">السماد (كيلو):</span>
                                  <span className="font-medium">{formatNumber(report.production_droppings)}</span>
                                </div>
                                {report.notes && (
                                  <div className="pt-2">
                                    <span className="text-muted-foreground">ملاحظات:</span>
                                    <p className="text-xs mt-1">{report.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Attachments Section */}
                          {attachments[report.id] && attachments[report.id].length > 0 && (
                            <div className="mt-4 p-4 border-t">
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                المرفقات ({attachments[report.id].length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {attachments[report.id].map((attachment) => (
                                  <a
                                    key={attachment.id}
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 transition-colors"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm truncate flex-1">{attachment.file_name}</span>
                                    <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                الصفحة {pagination.page} من {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  التالي
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
