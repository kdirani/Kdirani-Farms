'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DailyReportSummary {
  id: string;
  report_date: string;
  farm_name: string;
  house_name: string;
  total_eggs_produced: number;
  total_eggs_sold: number;
  total_feed_consumed: number;
  total_droppings_sold: number;
  total_mortality: number;
  notes?: string;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  week_number: number;
  total_eggs_produced: number;
  total_eggs_sold: number;
  total_feed_consumed: number;
  total_droppings_sold: number;
  total_mortality: number;
  daily_average_production: number;
  reports_count: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  total_eggs_produced: number;
  total_eggs_sold: number;
  total_feed_consumed: number;
  total_droppings_sold: number;
  total_mortality: number;
  daily_average_production: number;
  reports_count: number;
}

export interface GeneralReportFilters {
  farmId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'custom';
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get daily reports with filters and pagination
 */
export async function getDailyReports(
  filters: GeneralReportFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<ActionResult<DailyReportSummary[]> & { pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('daily_reports')
      .select(`
        id,
        report_date,
        warehouse:warehouse_id (
          name,
          farm:farm_id (name)
        ),
        production_eggs,
        eggs_sold,
        feed_daily_kg,
        production_droppings,
        chicks_dead,
        notes
      `, { count: 'exact' })
      .order('report_date', { ascending: false });

    // Apply filters - we need to filter by warehouse since that's what we have
    if (filters.farmId) {
      // Get warehouses for this farm first
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('farm_id', filters.farmId);
      
      if (warehouses && warehouses.length > 0) {
        const warehouseIds = warehouses.map(w => w.id);
        query = query.in('warehouse_id', warehouseIds);
      } else {
        // No warehouses found for this farm, return empty
        return { success: true, data: [] };
      }
    }

    if (filters.startDate) {
      query = query.gte('report_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('report_date', filters.endDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: dailyReports, error, count } = await query;

    if (error) {
      console.error('Error fetching daily reports:', error);
      return { success: false, error: error.message };
    }

    if (!dailyReports || dailyReports.length === 0) {
      return { success: true, data: [] };
    }

    const reportsWithSales = dailyReports.map((report) => {
      return {
        id: report.id,
        report_date: report.report_date,
        farm_name: (report.warehouse as any)?.farm?.name || '-',
        house_name: (report.warehouse as any)?.name || '-',
        total_eggs_produced: report.production_eggs || 0,
        total_eggs_sold: report.eggs_sold || 0,
        total_feed_consumed: report.feed_daily_kg || 0,
        total_droppings_sold: report.production_droppings || 0,
        total_mortality: report.chicks_dead || 0,
        notes: report.notes || undefined,
      };
    });

    return { 
      success: true, 
      data: reportsWithSales,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return { success: false, error: 'Failed to fetch daily reports' };
  }
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(
  filters: GeneralReportFilters = {}
): Promise<ActionResult<WeeklySummary[]>> {
  try {
    const result = await getDailyReports(filters);

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const reports = result.data;

    // Group by week
    const weeklyMap = new Map<string, DailyReportSummary[]>();

    reports.forEach((report) => {
      const date = new Date(report.report_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, []);
      }
      weeklyMap.get(weekKey)!.push(report);
    });

    // Calculate weekly summaries
    const weeklySummaries: WeeklySummary[] = [];

    weeklyMap.forEach((weekReports, weekStart) => {
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      const totalEggsProduced = weekReports.reduce((sum, r) => sum + r.total_eggs_produced, 0);
      const totalEggsSold = weekReports.reduce((sum, r) => sum + r.total_eggs_sold, 0);
      const totalFeedConsumed = weekReports.reduce((sum, r) => sum + r.total_feed_consumed, 0);
      const totalDroppingsSold = weekReports.reduce((sum, r) => sum + r.total_droppings_sold, 0);
      const totalMortality = weekReports.reduce((sum, r) => sum + r.total_mortality, 0);

      weeklySummaries.push({
        week_start: weekStart,
        week_end: weekEndDate.toISOString().split('T')[0],
        week_number: getWeekNumber(weekStartDate),
        total_eggs_produced: totalEggsProduced,
        total_eggs_sold: totalEggsSold,
        total_feed_consumed: totalFeedConsumed,
        total_droppings_sold: totalDroppingsSold,
        total_mortality: totalMortality,
        daily_average_production: Math.round(totalEggsProduced / weekReports.length),
        reports_count: weekReports.length,
      });
    });

    // Sort by week start date descending
    weeklySummaries.sort((a, b) => b.week_start.localeCompare(a.week_start));

    return { success: true, data: weeklySummaries };
  } catch (error) {
    console.error('Error calculating weekly summary:', error);
    return { success: false, error: 'Failed to calculate weekly summary' };
  }
}

/**
 * Get monthly summary
 */
export async function getMonthlySummary(
  filters: GeneralReportFilters = {}
): Promise<ActionResult<MonthlySummary[]>> {
  try {
    const result = await getDailyReports(filters);

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const reports = result.data;

    // Group by month
    const monthlyMap = new Map<string, DailyReportSummary[]>();

    reports.forEach((report) => {
      const date = new Date(report.report_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, []);
      }
      monthlyMap.get(monthKey)!.push(report);
    });

    // Calculate monthly summaries
    const monthlySummaries: MonthlySummary[] = [];

    monthlyMap.forEach((monthReports, monthKey) => {
      const [year, month] = monthKey.split('-');

      const totalEggsProduced = monthReports.reduce((sum, r) => sum + r.total_eggs_produced, 0);
      const totalEggsSold = monthReports.reduce((sum, r) => sum + r.total_eggs_sold, 0);
      const totalFeedConsumed = monthReports.reduce((sum, r) => sum + r.total_feed_consumed, 0);
      const totalDroppingsSold = monthReports.reduce((sum, r) => sum + r.total_droppings_sold, 0);
      const totalMortality = monthReports.reduce((sum, r) => sum + r.total_mortality, 0);

      monthlySummaries.push({
        month: getMonthName(parseInt(month)),
        year: parseInt(year),
        total_eggs_produced: totalEggsProduced,
        total_eggs_sold: totalEggsSold,
        total_feed_consumed: totalFeedConsumed,
        total_droppings_sold: totalDroppingsSold,
        total_mortality: totalMortality,
        daily_average_production: Math.round(totalEggsProduced / monthReports.length),
        reports_count: monthReports.length,
      });
    });

    // Sort by year and month descending
    monthlySummaries.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return getMonthNumber(b.month) - getMonthNumber(a.month);
    });

    return { success: true, data: monthlySummaries };
  } catch (error) {
    console.error('Error calculating monthly summary:', error);
    return { success: false, error: 'Failed to calculate monthly summary' };
  }
}

/**
 * Get overall statistics
 */
export async function getOverallStatistics(
  filters: GeneralReportFilters = {}
): Promise<ActionResult<{
  total_eggs_produced: number;
  total_eggs_sold: number;
  total_feed_consumed: number;
  total_droppings_sold: number;
  total_mortality: number;
  average_daily_production: number;
  total_reports: number;
}>> {
  try {
    const result = await getDailyReports(filters);

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const reports = result.data;

    const stats = {
      total_eggs_produced: reports.reduce((sum, r) => sum + r.total_eggs_produced, 0),
      total_eggs_sold: reports.reduce((sum, r) => sum + r.total_eggs_sold, 0),
      total_feed_consumed: reports.reduce((sum, r) => sum + r.total_feed_consumed, 0),
      total_droppings_sold: reports.reduce((sum, r) => sum + r.total_droppings_sold, 0),
      total_mortality: reports.reduce((sum, r) => sum + r.total_mortality, 0),
      average_daily_production: reports.length > 0 
        ? Math.round(reports.reduce((sum, r) => sum + r.total_eggs_produced, 0) / reports.length)
        : 0,
      total_reports: reports.length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error calculating overall statistics:', error);
    return { success: false, error: 'Failed to calculate statistics' };
  }
}

// Helper functions
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getMonthName(monthNumber: number): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthNumber - 1] || '';
}

function getMonthNumber(monthName: string): number {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months.indexOf(monthName) + 1;
}
