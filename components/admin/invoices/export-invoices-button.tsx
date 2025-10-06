'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Invoice } from '@/actions/invoice.actions';
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
  includeClientInfo: boolean;
  includeWarehouseInfo: boolean;
  includeBuyInvoices: boolean;
  includeSellInvoices: boolean;
}

export function ExportInvoicesButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    includeItems: true,
    includeExpenses: true,
    includeClientInfo: true,
    includeWarehouseInfo: true,
    includeBuyInvoices: true,
    includeSellInvoices: true
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const supabase = createClient();
      
      // جلب بيانات الفواتير
      let query = supabase
        .from('invoices')
        .select(`
          *,
          warehouse:warehouse_id (name),
          client:client_id (name, type)
        `)
        .order('invoice_date', { ascending: false });

      // تطبيق فلتر نوع الفاتورة
      if (settings.includeBuyInvoices && !settings.includeSellInvoices) {
        query = query.eq('invoice_type', 'buy');
      } else if (!settings.includeBuyInvoices && settings.includeSellInvoices) {
        query = query.eq('invoice_type', 'sell');
      }

      const { data: invoices, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      if (!invoices || invoices.length === 0) {
        alert('لا توجد فواتير للتصدير');
        return;
      }

      // إنشاء ملف Excel
      const workbook = XLSX.utils.book_new();

      // تحويل بيانات الفواتير إلى تنسيق مناسب للتصدير
      const invoicesData = invoices.map(invoice => {
        const data: Record<string, any> = {
          'رقم الفاتورة': invoice.invoice_number,
          'نوع الفاتورة': invoice.invoice_type === 'buy' ? 'شراء' : 'بيع',
          'تاريخ الفاتورة': formatDate(new Date(invoice.invoice_date)),
          'القيمة الإجمالية للعناصر': formatCurrency(invoice.total_items_value),
          'قيمة المصاريف': formatCurrency(invoice.total_expenses_value),
          'القيمة الصافية': formatCurrency(invoice.net_value),
          'الحالة': invoice.checked ? 'مدققة' : 'غير مدققة',
        };

        // إضافة معلومات المستودع إذا كان مطلوباً
        if (settings.includeWarehouseInfo && invoice.warehouse) {
          data['المستودع'] = invoice.warehouse.name;
        }

        // إضافة معلومات العميل إذا كان مطلوباً
        if (settings.includeClientInfo && invoice.client) {
          data['العميل/المورد'] = invoice.client.name;
          data['نوع العميل'] = invoice.client.type;
        }

        // إضافة الملاحظات
        if (invoice.notes) {
          data['ملاحظات'] = invoice.notes;
        }

        return data;
      });

      // إنشاء ورقة عمل للفواتير
      const invoicesWorksheet = XLSX.utils.json_to_sheet(invoicesData);
      XLSX.utils.book_append_sheet(workbook, invoicesWorksheet, 'الفواتير');

      // تعديل عرض الأعمدة
      const invoicesColWidth = 20;
      const invoicesWscols = Object.keys(invoicesData[0] || {}).map(() => ({ wch: invoicesColWidth }));
      invoicesWorksheet['!cols'] = invoicesWscols;

      // إضافة تفاصيل العناصر والمصاريف إذا كان مطلوباً
      if (settings.includeItems || settings.includeExpenses) {
        for (const invoice of invoices) {
          // جلب عناصر الفاتورة إذا كان مطلوباً
          if (settings.includeItems) {
            const { data: items } = await supabase
              .from('invoice_items')
              .select(`
                *,
                material_name:material_name_id (material_name),
                medicine:medicine_id (medicine_name),
                unit:unit_id (unit_name),
                egg_weight:egg_weight_id (weight_range)
              `)
              .eq('invoice_id', invoice.id);

            if (items && items.length > 0) {
              const itemsData = items.map(item => {
                return {
                  'رقم الفاتورة': invoice.invoice_number,
                  'اسم المادة': item.material_name?.material_name || item.medicine?.medicine_name || '-',
                  'الكمية': item.quantity,
                  'الوزن': item.weight || '-',
                  'الوحدة': item.unit?.unit_name || '-',
                  'فئة البيض': item.egg_weight?.weight_range || '-',
                  'السعر': item.price,
                  'القيمة': item.value
                };
              });

              // إضافة ورقة عمل لعناصر الفاتورة
              if (itemsData.length > 0) {
                const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
                XLSX.utils.book_append_sheet(workbook, itemsWorksheet, `عناصر الفاتورة ${invoice.invoice_number}`);
              }
            }
          }

          // جلب مصاريف الفاتورة إذا كان مطلوباً
          if (settings.includeExpenses) {
            const { data: expenses } = await supabase
              .from('invoice_expenses')
              .select(`
                *,
                expense_type:expense_type_id (name)
              `)
              .eq('invoice_id', invoice.id);

            if (expenses && expenses.length > 0) {
              const expensesData = expenses.map(expense => {
                return {
                  'رقم الفاتورة': invoice.invoice_number,
                  'نوع المصروف': expense.expense_type?.name || '-',
                  'اسم الحساب': expense.account_name || '-',
                  'المبلغ': expense.amount,
                  'ملاحظات': expense.notes || '-'
                };
              });

              // إضافة ورقة عمل لمصاريف الفاتورة
              if (expensesData.length > 0) {
                const expensesWorksheet = XLSX.utils.json_to_sheet(expensesData);
                XLSX.utils.book_append_sheet(workbook, expensesWorksheet, `مصاريف الفاتورة ${invoice.invoice_number}`);
              }
            }
          }
        }
      }

      // تصدير الملف
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `فواتير_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
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
          <DialogTitle>إعدادات تصدير الفواتير</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">نوع الفواتير</h3>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeBuyInvoices" 
                  checked={settings.includeBuyInvoices}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeBuyInvoices: checked as boolean})
                  }
                />
                <Label htmlFor="includeBuyInvoices">فواتير الشراء</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="includeSellInvoices" 
                  checked={settings.includeSellInvoices}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeSellInvoices: checked as boolean})
                  }
                />
                <Label htmlFor="includeSellInvoices">فواتير البيع</Label>
              </div>
            </div>
          </div>
          
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
                  id="includeClientInfo" 
                  checked={settings.includeClientInfo}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, includeClientInfo: checked as boolean})
                  }
                />
                <Label htmlFor="includeClientInfo">تضمين معلومات العملاء</Label>
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
            disabled={isExporting || (!settings.includeBuyInvoices && !settings.includeSellInvoices)}
          >
            {isExporting ? 'جاري التصدير...' : 'تصدير'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}