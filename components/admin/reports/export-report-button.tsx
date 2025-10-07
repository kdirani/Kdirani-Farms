'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DailyReportSummary,
  WeeklySummary,
  MonthlySummary,
  GeneralReportFilters,
} from '@/actions/general-report.actions';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDate } from '@/lib/utils';

interface ExportReportButtonProps {
  dailyReports: DailyReportSummary[];
  weeklySummary: WeeklySummary[];
  monthlySummary: MonthlySummary[];
  stats: {
    total_eggs_produced: number;
    total_eggs_sold: number;
    total_feed_consumed: number;
    total_droppings_sold: number;
    total_mortality: number;
    average_daily_production: number;
    total_reports: number;
  };
  filters: GeneralReportFilters;
}

export function ExportReportButton({
  dailyReports,
  weeklySummary,
  monthlySummary,
  stats,
  filters,
}: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['التقرير العام - مزارع القديراني'],
        [''],
        ['الإحصائيات العامة'],
        ['إجمالي البيض المُنتَج', stats.total_eggs_produced],
        ['إجمالي البيض المباع', stats.total_eggs_sold],
        ['إجمالي الأعلاف المستهلكة (كغم)', stats.total_feed_consumed],
        ['إجمالي السواد المباع (كغم)', stats.total_droppings_sold],
        ['إجمالي الطيور النافقة', stats.total_mortality],
        ['متوسط الإنتاج اليومي', stats.average_daily_production],
        ['عدد التقارير', stats.total_reports],
        [''],
        ['الفلاتر المطبقة'],
        ['الفترة', filters.period || 'مخصصة'],
        ['من تاريخ', filters.startDate || '-'],
        ['إلى تاريخ', filters.endDate || '-'],
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'الملخص');

      // Daily Reports Sheet
      if (dailyReports.length > 0) {
        const dailyData = dailyReports.map((report) => ({
          'التاريخ': formatDate(new Date(report.report_date)),
          'المزرعة': report.farm_name,
          'العنبر': report.house_name,
          'البيض المُنتَج': report.total_eggs_produced,
          'البيض المباع': report.total_eggs_sold,
          'الأعلاف (كغم)': report.total_feed_consumed,
          'السواد (كغم)': report.total_droppings_sold,
          'النفوق': report.total_mortality,
        }));

        const dailyWorksheet = XLSX.utils.json_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(workbook, dailyWorksheet, 'التقارير اليومية');
      }

      // Weekly Summary Sheet
      if (weeklySummary.length > 0) {
        const weeklyData = weeklySummary.map((week) => ({
          'رقم الأسبوع': week.week_number,
          'من تاريخ': formatDate(new Date(week.week_start)),
          'إلى تاريخ': formatDate(new Date(week.week_end)),
          'عدد التقارير': week.reports_count,
          'البيض المُنتَج': week.total_eggs_produced,
          'البيض المباع': week.total_eggs_sold,
          'الأعلاف (كغم)': week.total_feed_consumed,
          'السواد (كغم)': week.total_droppings_sold,
          'النفوق': week.total_mortality,
          'متوسط الإنتاج اليومي': week.daily_average_production,
        }));

        const weeklyWorksheet = XLSX.utils.json_to_sheet(weeklyData);
        XLSX.utils.book_append_sheet(workbook, weeklyWorksheet, 'التقارير الأسبوعية');
      }

      // Monthly Summary Sheet
      if (monthlySummary.length > 0) {
        const monthlyData = monthlySummary.map((month) => ({
          'الشهر': month.month,
          'السنة': month.year,
          'عدد التقارير': month.reports_count,
          'البيض المُنتَج': month.total_eggs_produced,
          'البيض المباع': month.total_eggs_sold,
          'الأعلاف (كغم)': month.total_feed_consumed,
          'السواد (كغم)': month.total_droppings_sold,
          'النفوق': month.total_mortality,
          'متوسط الإنتاج اليومي': month.daily_average_production,
        }));

        const monthlyWorksheet = XLSX.utils.json_to_sheet(monthlyData);
        XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, 'التقارير الشهرية');
      }

      // Export file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `تقرير-عام-${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
      saveAs(fileData, fileName);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} size="sm">
      <Download className="h-4 w-4 ml-2" />
      {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
    </Button>
  );
}
