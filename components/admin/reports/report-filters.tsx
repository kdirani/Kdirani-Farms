'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GeneralReportFilters } from '@/actions/general-report.actions';
import { getFarms } from '@/actions/farm.actions';
import { createClient } from '@/lib/supabase/client';
import { Filter, RotateCcw } from 'lucide-react';

interface ReportFiltersProps {
  onFilterChange: (filters: GeneralReportFilters) => void;
  isLoading: boolean;
}

export function ReportFilters({ onFilterChange, isLoading }: ReportFiltersProps) {
  const [farms, setFarms] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadFarms();
    
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const loadFarms = async () => {
    const result = await getFarms();
    if (result.success && result.data) {
      setFarms(result.data);
    }
  };

  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    
    const today = new Date();
    let start = new Date();

    switch (newPeriod) {
      case 'today':
        start = today;
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setDate(today.getDate() - 30);
        break;
      case 'custom':
        // Don't change dates, let user pick
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const handleApplyFilters = () => {
    const filters: GeneralReportFilters = {
      period,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      farmId: selectedFarm && selectedFarm !== 'all' ? selectedFarm : undefined,
    };

    onFilterChange(filters);
  };

  const handleReset = () => {
    setSelectedFarm('all');
    setPeriod('month');
    
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);

    onFilterChange({
      period: 'month',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5" />
        <h3 className="text-lg font-semibold">الفلاتر</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Farm Filter */}
        <div className="space-y-2">
          <Label>المزرعة</Label>
          <Select value={selectedFarm} onValueChange={setSelectedFarm}>
            <SelectTrigger>
              <SelectValue placeholder="جميع المزارع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المزارع</SelectItem>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period Filter */}
        <div className="space-y-2">
          <Label>الفترة</Label>
          <Select value={period} onValueChange={(value) => handlePeriodChange(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">آخر 7 أيام</SelectItem>
              <SelectItem value="month">آخر 30 يومًا</SelectItem>
              <SelectItem value="custom">فترة مخصصة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>من تاريخ</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPeriod('custom');
            }}
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>إلى تاريخ</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPeriod('custom');
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          إعادة تعيين
        </Button>
        <Button onClick={handleApplyFilters} disabled={isLoading}>
          <Filter className="h-4 w-4 ml-2" />
          تطبيق الفلاتر
        </Button>
      </div>
    </div>
  );
}
