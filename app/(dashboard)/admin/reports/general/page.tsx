import { Metadata } from 'next';
import { GeneralReportView } from '@/components/admin/reports/general-report-view';
import {
  getDailyReports,
  getWeeklySummary,
  getMonthlySummary,
  getOverallStatistics,
} from '@/actions/general-report.actions';

export const metadata: Metadata = {
  title: 'التقرير العام - مزارع القديراني',
  description: 'تقرير شامل لجميع التقارير اليومية والأسبوعية والشهرية',
};

export default async function GeneralReportPage() {
  // Fetch initial data without filters (last 30 days by default)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [
    dailyReportsResult,
    weeklySummaryResult,
    monthlySummaryResult,
    statsResult,
  ] = await Promise.all([
    getDailyReports({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }),
    getWeeklySummary({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }),
    getMonthlySummary({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }),
    getOverallStatistics({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }),
  ]);

  console.log('Daily Reports:', dailyReportsResult);
  console.log('Weekly Summary:', weeklySummaryResult);
  console.log('Monthly Summary:', monthlySummaryResult);
  console.log('Stats:', statsResult);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">التقرير العام</h1>
        <p className="text-muted-foreground">
          تقرير شامل لجميع الأنشطة والإنتاج في المزارع
        </p>
      </div>

      <GeneralReportView
        initialDailyReports={dailyReportsResult.data || []}
        initialWeeklySummary={weeklySummaryResult.data || []}
        initialMonthlySummary={monthlySummaryResult.data || []}
        initialStats={statsResult.data || {
          total_eggs_produced: 0,
          total_eggs_sold: 0,
          total_feed_consumed: 0,
          total_droppings_sold: 0,
          total_mortality: 0,
          average_daily_production: 0,
          total_reports: 0,
        }}
      />
    </div>
  );
}
