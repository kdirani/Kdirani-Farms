'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Farm } from '@/actions/farm.actions';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { createClient } from '@/lib/supabase/client';

interface ExportFarmsDataProps {
  farms: Farm[];
}

// تعريف واجهة لبيانات المزرعة المصدرة
interface FarmExportData {
  'اسم المزرعة': string;
  'الموقع': string;
  'الحالة': string;
  'تاريخ الإنشاء': string;
  'المسؤول': string;
  'البريد الإلكتروني': string;
  'عدد المستودعات'?: number;
  'أسماء المستودعات'?: string;
  'اسم القطيع'?: string;
  'عدد الكتاكيت الافتتاحي'?: number;
  'عدد الكتاكيت الحالي'?: number;
  'عدد التقارير'?: number;
  'آخر تقرير'?: string;
  'متوسط إنتاج البيض'?: number;
  'عدد الفواتير'?: number;
  'آخر فاتورة'?: string;
  'إجمالي قيمة الفواتير'?: number;
}

export function ExportFarmsData({ farms }: ExportFarmsDataProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const supabase = createClient();

      // تجميع البيانات المرتبطة بكل مزرعة
      const farmsData: FarmExportData[] = [];

      for (const farm of farms) {
        // بيانات المزرعة الأساسية
        const farmData: FarmExportData = {
          'اسم المزرعة': farm.name,
          'الموقع': farm.location || 'غير محدد',
          'الحالة': farm.is_active ? 'نشط' : 'غير نشط',
          'تاريخ الإنشاء': new Date(farm.created_at).toLocaleDateString('ar-SA'),
          'المسؤول': farm.user?.fname || 'غير معين',
          'البريد الإلكتروني': farm.user?.email || 'غير معين',
        };

        try {
          // جلب المستودعات المرتبطة بالمزرعة
          const { data: warehouses } = await supabase
            .from('warehouses')
            .select('*')
            .eq('farm_id', farm.id);

          if (warehouses && warehouses.length > 0) {
            farmData['عدد المستودعات'] = warehouses.length;
            farmData['أسماء المستودعات'] = warehouses.map(w => w.name).join(', ');
          } else {
            farmData['عدد المستودعات'] = 0;
            farmData['أسماء المستودعات'] = 'لا توجد مستودعات';
          }

          // جلب بيانات الدواجن المرتبطة بالمزرعة
          const { data: poultry } = await supabase
            .from('poultry_status')
            .select('*')
            .eq('farm_id', farm.id)
            .single();

          if (poultry) {
            farmData['اسم القطيع'] = poultry.batch_name;
            farmData['عدد الكتاكيت الافتتاحي'] = poultry.opening_chicks;
            farmData['عدد الكتاكيت الحالي'] = poultry.current_chicks;
          } else {
            farmData['اسم القطيع'] = 'لا يوجد';
            farmData['عدد الكتاكيت الافتتاحي'] = 0;
            farmData['عدد الكتاكيت الحالي'] = 0;
          }

          // جلب التقارير اليومية للمزرعة (آخر 10 تقارير)
          if (warehouses && warehouses.length > 0) {
            const warehouseIds = warehouses.map(w => w.id);
            const { data: reports } = await supabase
              .from('daily_reports')
              .select('*')
              .in('warehouse_id', warehouseIds)
              .order('report_date', { ascending: false })
              .limit(10);

            if (reports && reports.length > 0) {
              farmData['عدد التقارير'] = reports.length;
              farmData['آخر تقرير'] = new Date(reports[0].report_date).toLocaleDateString('ar-SA');
              farmData['متوسط إنتاج البيض'] = reports.reduce((sum, r) => sum + (r.production_eggs || 0), 0) / reports.length;
            } else {
              farmData['عدد التقارير'] = 0;
              farmData['آخر تقرير'] = 'لا يوجد';
              farmData['متوسط إنتاج البيض'] = 0;
            }

            // جلب الفواتير المرتبطة بالمزرعة (آخر 10 فواتير)
            const { data: invoices } = await supabase
              .from('invoices')
              .select('*')
              .in('warehouse_id', warehouseIds)
              .order('invoice_date', { ascending: false })
              .limit(10);

            if (invoices && invoices.length > 0) {
              farmData['عدد الفواتير'] = invoices.length;
              farmData['آخر فاتورة'] = new Date(invoices[0].invoice_date).toLocaleDateString('ar-SA');
              farmData['إجمالي قيمة الفواتير'] = invoices.reduce((sum, i) => sum + (i.net_value || 0), 0);
            } else {
              farmData['عدد الفواتير'] = 0;
              farmData['آخر فاتورة'] = 'لا يوجد';
              farmData['إجمالي قيمة الفواتير'] = 0;
            }
          }
        } catch (error) {
          console.error(`خطأ في جلب بيانات المزرعة ${farm.name}:`, error);
          // استكمال البيانات الناقصة بقيم افتراضية
          farmData['عدد المستودعات'] = farmData['عدد المستودعات'] || 0;
          farmData['أسماء المستودعات'] = farmData['أسماء المستودعات'] || 'خطأ في جلب البيانات';
          farmData['اسم القطيع'] = farmData['اسم القطيع'] || 'خطأ في جلب البيانات';
          farmData['عدد الكتاكيت الافتتاحي'] = farmData['عدد الكتاكيت الافتتاحي'] || 0;
          farmData['عدد الكتاكيت الحالي'] = farmData['عدد الكتاكيت الحالي'] || 0;
          farmData['عدد التقارير'] = farmData['عدد التقارير'] || 0;
          farmData['آخر تقرير'] = farmData['آخر تقرير'] || 'خطأ في جلب البيانات';
          farmData['متوسط إنتاج البيض'] = farmData['متوسط إنتاج البيض'] || 0;
          farmData['عدد الفواتير'] = farmData['عدد الفواتير'] || 0;
          farmData['آخر فاتورة'] = farmData['آخر فاتورة'] || 'خطأ في جلب البيانات';
          farmData['إجمالي قيمة الفواتير'] = farmData['إجمالي قيمة الفواتير'] || 0;
        }

        farmsData.push(farmData);
      }

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.json_to_sheet(farmsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المزارع');

      // تعديل عرض الأعمدة
      const colWidths = [];
      for (const key in farmsData[0]) {
        colWidths.push({ wch: Math.max(20, key.length * 1.5) });
      }
      worksheet['!cols'] = colWidths;

      // تصدير الملف
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `بيانات_المزارع_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
      saveAs(fileData, fileName);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={exportToExcel} 
      disabled={isExporting}
    >
      <Download className="h-4 w-4 ml-2" />
      {isExporting ? 'جاري التصدير...' : 'تصدير البيانات'}
    </Button>
  );
}