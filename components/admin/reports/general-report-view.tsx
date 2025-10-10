'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportFilters } from './report-filters';
import { SummaryCards } from './summary-cards';
import { DailyReportsTable } from './daily-reports-table';
import { WeeklySummaryTable } from './weekly-summary-table';
import { MonthlySummaryTable } from './monthly-summary-table';
import { ExportReportButton } from './export-report-button';
import {
  DailyReportSummary,
  WeeklySummary,
  MonthlySummary,
  GeneralReportFilters,
  getDailyReports,
  getWeeklySummary,
  getMonthlySummary,
  getOverallStatistics,
} from '@/actions/general-report.actions';
import { Loader2 } from 'lucide-react';

interface GeneralReportViewProps {
  initialDailyReports: DailyReportSummary[];
  initialWeeklySummary: WeeklySummary[];
  initialMonthlySummary: MonthlySummary[];
  initialStats: {
    total_eggs_produced: number;
    total_eggs_sold: number;
    total_feed_consumed: number;
    total_droppings_sold: number;
    total_mortality: number;
    average_daily_production: number;
    total_reports: number;
  };
}

export function GeneralReportView({
  initialDailyReports,
  initialWeeklySummary,
  initialMonthlySummary,
  initialStats,
}: GeneralReportViewProps) {
  const [dailyReports, setDailyReports] = useState(initialDailyReports);
  const [weeklySummary, setWeeklySummary] = useState(initialWeeklySummary);
  const [monthlySummary, setMonthlySummary] = useState(initialMonthlySummary);
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<GeneralReportFilters>({});

  const handleFilterChange = async (filters: GeneralReportFilters) => {
    setIsLoading(true);
    setCurrentFilters(filters);

    try {
      const [dailyResult, weeklyResult, monthlyResult, statsResult] = await Promise.all([
        getDailyReports(filters),
        getWeeklySummary(filters),
        getMonthlySummary(filters),
        getOverallStatistics(filters),
      ]);

      if (dailyResult.success && dailyResult.data) {
        setDailyReports(dailyResult.data);
      }

      if (weeklyResult.success && weeklyResult.data) {
        setWeeklySummary(weeklyResult.data);
      }

      if (monthlyResult.success && monthlyResult.data) {
        setMonthlySummary(monthlyResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <ReportFilters onFilterChange={handleFilterChange} isLoading={isLoading} />
      </Card>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-2">جاري تحميل البيانات...</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Summary Cards */}
          <SummaryCards stats={stats} />

          {/* Export Button */}
          <div className="flex justify-end">
            <ExportReportButton
              dailyReports={dailyReports}
              weeklySummary={weeklySummary}
              monthlySummary={monthlySummary}
              stats={stats}
              filters={currentFilters}
            />
          </div>

          {/* Reports Tabs */}
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">التقارير اليومية</TabsTrigger>
              <TabsTrigger value="weekly">التقارير الأسبوعية</TabsTrigger>
              <TabsTrigger value="monthly">التقارير الشهرية</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <DailyReportsTable reports={dailyReports} />
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <WeeklySummaryTable summaries={weeklySummary} />
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <MonthlySummaryTable summaries={monthlySummary} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
