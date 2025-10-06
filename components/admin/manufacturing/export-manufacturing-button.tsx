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
  includeItems: boolean;
  includeExpenses: boolean;
  includeWarehouseInfo: boolean;
}

export function ExportManufacturingButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    includeItems: true,
    includeExpenses: true,
    includeWarehouseInfo: true
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const supabase = createClient();
      
      // جلب بيانات فواتير التصنيع
      const { data: manufacturings, error } = await supabase
        .from('manufacturing')
        .select(`
          *,
          warehouse:warehouse_id (name)
        `)
        .order('manufacturing_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!manufacturings || manufacturings.length === 0) {
        alert('لا توجد فواتير تصنيع للتصدير');
        return;
      }

      // إنشاء ملف Excel
      const workbook = XLSX.utils.book_new();

      // تحويل بيانات فواتير التصنيع إلى تنسيق مناسب للتصدير
      const manufacturingsData = manufacturings.map(manufacturing => {
        const data: Record<string, any> = {
          'رقم التصنيع': manufacturing.manufacturing_number,
          'تاريخ التصنيع': formatDate(new Date(manufacturing.manufacturing_date)),
          'القيمة الإجمالية للعناصر': formatCurrency(manufacturing.total_items_value),
          'قيمة المصاريف': formatCurrency(manufacturing.total_expenses_value),
          'القيمة الصافية': formatCurrency(manufacturing.net_value),
          'الحالة': manufacturing.checked ? 'مدققة' : 'غير مدققة',
        };

        // إضافة معلومات المستودع إذا كان مطلوباً
        if (settings.includeWarehouseInfo && manufacturing.warehouse) {
          data['المستودع'] = manufacturing.warehouse.name;
        }

        // إضافة الملاحظات
        if (manufacturing.notes) {
          data['ملاحظات'] = manufacturing.notes;
        }

        return data;
      });

      // إنشاء ورقة عمل لفواتير التصنيع
      const manufacturingsWorksheet = XLSX.utils.json_to_sheet(manufacturingsData);
      XLSX.utils.book_append_sheet(workbook, manufacturingsWorksheet, 'فواتير التصنيع');

      // تعديل عرض الأعمدة
      const manufacturingsColWidth = 20;
      const manufacturingsWscols = Object.keys(manufacturingsData[0] || {}).map(() => ({ wch: manufacturingsColWidth }));
      manufacturingsWorksheet['!cols'] = manufacturingsWscols;

      // إضافة تفاصيل العناصر والمصاريف إذا كان مطلوباً
      if (settings.includeItems || settings.includeExpenses) {
        for (const manufacturing of manufacturings) {
          // جلب عناصر فاتورة التصنيع إذا كان مطلوباً
          if (settings.includeItems) {
            const { data: items } = await supabase
              .from('manufacturing_items')
              .select(`
                *,
                material_name:material_name_id (material_name),
                unit:unit_id (unit_name)
              `)
              .eq('manufacturing_id', manufacturing.id);

            if (items && items.length > 0) {
              const itemsData = items.map(item => {
                return {
                  'رقم التصنيع': manufacturing.manufacturing_number,
                  'اسم المادة': item.material_name?.material_name || '-',
                  'الكمية': item.quantity,
                  'الوحدة': item.unit?.unit_name || '-',
                  'السعر': item.price,
                  'القيمة': item.value
                };
              });

              // إضافة ورقة عمل لعناصر فاتورة التصنيع
              if (itemsData.length > 0) {
                const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
                XLSX.utils.book_append_sheet(workbook, itemsWorksheet, `عناصر فاتورة التصنيع ${manufacturing.manufacturing_number}`);
              }
            }
          }

          // جلب مصاريف فاتورة التصنيع إذا كان مطلوباً
          if (settings.includeExpenses) {
            const { data: expenses } = await supabase
              .from('manufacturing_expenses')
              .select(`
                *,
                expense_type:expense_type_id (name)
              `)
              .eq('manufacturing_id', manufacturing.id);

            if (expenses && expenses.length > 0) {
              const expensesData = expenses.map(expense => {
                return {
                  'رقم التصنيع': manufacturing.manufacturing_number,
                  'نوع المصروف': expense.expense_type?.name || '-',
                  'اسم الحساب': expense.account_name || '-',
                  'المبلغ': expense.amount,
                  'ملاحظات': expense.notes || '-'
                };
              });

              // إضافة ورقة عمل لمصاريف فاتورة التصنيع
              if (expensesData.length > 0) {
                const expensesWorksheet = XLSX.utils.json_to_sheet(expensesData);
                XLSX.utils.book_append_sheet(workbook, expensesWorksheet, `مصاريف فاتورة التصنيع ${manufacturing.manufacturing_number}`);
              }
            }
          }
        }
      }

      // تصدير الملف
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `فواتير_التصنيع_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
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
          تصدير البيانات
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إعدادات تصدير فواتير التصنيع</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">تفاصيل إضافية</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeItems" 
                  checked={settings.includeItems}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeItems: checked as boolean})
                  }
                />
                <Label htmlFor="includeItems">تضمين عناصر الفواتير</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeExpenses" 
                  checked={settings.includeExpenses}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeExpenses: checked as boolean})
                  }
                />
                <Label htmlFor="includeExpenses">تضمين مصاريف الفواتير</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeWarehouseInfo" 
                  checked={settings.includeWarehouseInfo}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeWarehouseInfo: checked as boolean})
                  }
                />
                <Label htmlFor="includeWarehouseInfo">تضمين معلومات المستودعات</Label>
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