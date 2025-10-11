'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ExportSettings {
  includeEggProduction: boolean;
  includeChickStats: boolean;
  includeFeedConsumption: boolean;
  includeEggSales: boolean;
}

interface ExportDailyReportsButtonProps {
  farmId: string;
  farmName?: string;
}

export function ExportDailyReportsButton({ farmId, farmName }: ExportDailyReportsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    includeEggProduction: true,
    includeChickStats: true,
    includeFeedConsumption: true,
    includeEggSales: true
  });

  const handleExport = async () => {
    if (!farmId) {
      alert('يرجى تحديد المزرعة أولاً');
      return;
    }

    try {
      setIsExporting(true);
      const supabase = createClient();

      // جلب المستودعات التابعة للمزرعة
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('farm_id', farmId);

      if (!warehouses || warehouses.length === 0) {
        alert('لا توجد مستودعات لهذه المزرعة');
        setIsExporting(false);
        return;
      }

      const warehouseIds = warehouses.map(w => w.id);

      // جلب بيانات التقارير اليومية للمزرعة المحددة
      const { data: reports, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          warehouse:warehouses(id, name)
        `)
        .in('warehouse_id', warehouseIds)
        .order('report_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (!reports || reports.length === 0) {
        alert('لا توجد تقارير يومية لهذه المزرعة');
        setIsExporting(false);
        return;
      }

      // إنشاء كتاب عمل Excel جديد
      const workbook = XLSX.utils.book_new();

      // تحضير بيانات التقارير الرئيسية
      const reportsData = reports.map(report => {
        const baseData: Record<string, any> = {
          'التاريخ': formatDate(report.report_date),
          'الوقت': report.report_time,
          'المستودع': report.warehouse?.name || '-',
        };

        // إضافة بيانات إنتاج البيض حسب الإعدادات
        if (settings.includeEggProduction) {
          baseData['إنتاج البيض السليم'] = report.production_eggs_healthy;
          baseData['إنتاج البيض المشوه'] = report.production_eggs_deformed;
          baseData['إجمالي إنتاج البيض'] = report.production_eggs;
          baseData['معدل إنتاج البيض (%)'] = report.production_egg_rate;
          baseData['رصيد البيض السابق'] = report.previous_eggs_balance;
          baseData['الرصيد الحالي للبيض'] = report.current_eggs_balance;
        }

        // إضافة بيانات الكتاكيت حسب الإعدادات
        if (settings.includeChickStats) {
          baseData['عدد الدجاج قبل'] = report.chicks_before;
          baseData['عدد الدجاج النافق'] = report.chicks_dead;
          baseData['عدد الدجاج الحالي'] = report.chicks_after;
        }

        // إضافة بيانات استهلاك العلف حسب الإعدادات
        if (settings.includeFeedConsumption) {
          baseData['استهلاك العلف اليومي (كجم)'] = report.feed_daily_kg;
          baseData['استهلاك العلف الشهري (كجم)'] = report.feed_monthly_kg;
          baseData['نسبة استهلاك العلف'] = report.feed_ratio;
        }

        // إضافة بيانات مبيعات البيض حسب الإعدادات
        if (settings.includeEggSales) {
          baseData['البيض المباع'] = report.eggs_sold;
          baseData['البيض المهدى'] = report.eggs_gift;
          baseData['استهلاك الكراتين'] = report.carton_consumption;
        }

        // إضافة بيانات إضافية
        baseData['إنتاج السبلة'] = report.production_droppings;
        baseData['ملاحظات'] = report.notes || '-';

        return baseData;
      });

      // إنشاء ورقة عمل للتقارير
      const reportsWorksheet = XLSX.utils.json_to_sheet(reportsData);
      
      // إضافة ورقة العمل إلى الكتاب
      const farmTitle = farmName || `مزرعة ${farmId}`;
      XLSX.utils.book_append_sheet(workbook, reportsWorksheet, `تقارير ${farmTitle}`);

      // تصدير الملف
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `تقارير_يومية_${farmTitle}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
      saveAs(fileData, fileName);
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 ml-2" />
          تصدير التقارير
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إعدادات تصدير التقارير اليومية</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">تفاصيل التقارير المراد تصديرها</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeEggProduction" 
                  checked={settings.includeEggProduction}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeEggProduction: checked as boolean})
                  }
                />
                <Label htmlFor="includeEggProduction">بيانات إنتاج البيض</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeChickStats" 
                  checked={settings.includeChickStats}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeChickStats: checked as boolean})
                  }
                />
                <Label htmlFor="includeChickStats">إحصائيات الدجاج</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeFeedConsumption" 
                  checked={settings.includeFeedConsumption}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeFeedConsumption: checked as boolean})
                  }
                />
                <Label htmlFor="includeFeedConsumption">استهلاك العلف</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeEggSales" 
                  checked={settings.includeEggSales}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeEggSales: checked as boolean})
                  }
                />
                <Label htmlFor="includeEggSales">بيانات مبيعات البيض</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? 'جاري التصدير...' : 'تصدير'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}