'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { Farm } from '@/actions/farm.actions';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExportSingleFarmDataProps {
  farm: Farm;
}

// تعريف واجهة لبيانات المزرعة المصدرة
interface FarmExportData {
  'اسم المزرعة': string;
  'الموقع': string;
  'الحالة': string;
  'تاريخ الإنشاء': string;
  'المدير': string;
  'البريد الإلكتروني': string;
  'المستودعات'?: string[];
  'حالة الدواجن'?: any;
  'التقارير اليومية'?: any[];
  'الفواتير'?: any[];
}

// تعريف واجهة لإعدادات التصدير
interface ExportSettings {
  includeWarehouses: boolean;
  includePoultry: boolean;
  includeDailyReports: boolean;
  includeInvoices: boolean;
  includeProduction: boolean;
  includeSales: boolean;
  includePurchases: boolean;
  includeManufacturing: boolean;
  includeMedicines: boolean;
  isComprehensiveReport: boolean;
}

export function ExportSingleFarmData({ farm }: ExportSingleFarmDataProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    includeWarehouses: true,
    includePoultry: true,
    includeDailyReports: true,
    includeInvoices: true,
    includeProduction: true,
    includeSales: true,
    includePurchases: true,
    includeManufacturing: true,
    includeMedicines: true,
    isComprehensiveReport: true
  });

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const workbook = XLSX.utils.book_new();
      
      // تجهيز بيانات المزرعة الأساسية
      const farmData: FarmExportData = {
        'اسم المزرعة': farm.name || 'غير محدد',
        'الموقع': farm.location || 'غير محدد',
        'الحالة': farm.is_active ? 'نشطة' : 'غير نشطة',
        'تاريخ الإنشاء': farm.created_at ? new Date(farm.created_at).toLocaleDateString('ar-SA') : 'غير محدد',
        'المدير': farm.user?.fname || 'غير محدد',
        'البريد الإلكتروني': farm.user?.email || 'غير محدد',
      };

      // إنشاء ورقة عمل للبيانات الأساسية
      const mainWorksheet = XLSX.utils.json_to_sheet([farmData]);
      XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'بيانات المزرعة');

      // تعديل عرض الأعمدة للورقة الرئيسية
      const mainColWidth = 25;
      const mainWscols = Object.keys(farmData).map(() => ({ wch: mainColWidth }));
      mainWorksheet['!cols'] = mainWscols;

      // جلب البيانات المرتبطة حسب الإعدادات
      if (settings.includeWarehouses) {
        try {
          const { data: warehouses } = await supabase
            .from('warehouses')
            .select('id, name, created_at')
            .eq('farm_id', farm.id);
          
          if (warehouses && warehouses.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const warehousesData = warehouses.map(w => ({
              'اسم المستودع': w.name,
              'تاريخ الإنشاء': new Date(w.created_at).toLocaleDateString('ar-SA')
            }));
            
            // إنشاء ورقة عمل للمستودعات
            const warehousesWorksheet = XLSX.utils.json_to_sheet(warehousesData);
            XLSX.utils.book_append_sheet(workbook, warehousesWorksheet, 'المستودعات');
            
            // تعديل عرض الأعمدة
            const warehousesColWidth = 20;
            const warehousesWscols = Object.keys(warehousesData[0] || {}).map(() => ({ wch: warehousesColWidth }));
            warehousesWorksheet['!cols'] = warehousesWscols;

            // جلب المواد لكل مستودع إذا كان التقرير شاملاً
            if (settings.isComprehensiveReport) {
              for (const warehouse of warehouses) {
                const { data: materials } = await supabase
                  .from('materials')
                  .select(`
                    id, 
                    opening_balance, 
                    current_balance, 
                    material_name_id (name),
                    medicine_id (name),
                    unit_id (name)
                  `)
                  .eq('warehouse_id', warehouse.id);
                
                if (materials && materials.length > 0) {
                  // تحويل البيانات إلى تنسيق مناسب للتصدير
                  const materialsData = materials.map(m => ({
                    'اسم المادة': (m.material_name_id as any)?.name || (m.medicine_id as any)?.name || 'غير محدد',
                    'الوحدة': (m.unit_id as any)?.name || 'غير محدد',
                    'الرصيد الافتتاحي': m.opening_balance || 0,
                    'الرصيد الحالي': m.current_balance || 0
                  }));
                  
                  // إنشاء ورقة عمل للمواد في المستودع
                  const materialsWorksheet = XLSX.utils.json_to_sheet(materialsData);
                  XLSX.utils.book_append_sheet(workbook, materialsWorksheet, `مواد ${warehouse.name}`);
                  
                  // تعديل عرض الأعمدة
                  const materialsColWidth = 20;
                  const materialsWscols = Object.keys(materialsData[0] || {}).map(() => ({ wch: materialsColWidth }));
                  materialsWorksheet['!cols'] = materialsWscols;
                }
              }
            }
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات المستودعات:', error);
        }
      }

      if (settings.includePoultry) {
        try {
          const { data: poultryStatus } = await supabase
            .from('poultry_status')
            .select('*')
            .eq('farm_id', farm.id)
            .single();
          
          if (poultryStatus) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const poultryData = {
              'اسم القطيع': poultryStatus.batch_name || 'غير محدد',
              'عدد الكتاكيت الافتتاحي': poultryStatus.opening_chicks || 0,
              'عدد الكتاكيت الحالي': poultryStatus.current_chicks || 0,
              'تاريخ البدء': poultryStatus.created_at ? new Date(poultryStatus.created_at).toLocaleDateString('ar-SA') : 'غير محدد',
              'آخر تحديث': poultryStatus.updated_at ? new Date(poultryStatus.updated_at).toLocaleDateString('ar-SA') : 'غير محدد'
            };
            
            // إنشاء ورقة عمل للدواجن
            const poultryWorksheet = XLSX.utils.json_to_sheet([poultryData]);
            XLSX.utils.book_append_sheet(workbook, poultryWorksheet, 'حالة الدواجن');
            
            // تعديل عرض الأعمدة
            const poultryColWidth = 25;
            const poultryWscols = Object.keys(poultryData).map(() => ({ wch: poultryColWidth }));
            poultryWorksheet['!cols'] = poultryWscols;
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الدواجن:', error);
        }
      }

      if (settings.includeDailyReports) {
        try {
          const { data: dailyReports } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('farm_id', farm.id)
            .order('report_date', { ascending: false });
          
          if (dailyReports && dailyReports.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const reportsData = dailyReports.map(report => ({
              'تاريخ التقرير': new Date(report.report_date).toLocaleDateString('ar-SA'),
              'عدد الدجاج': report.chicks_count || 0,
              'النافق': report.mortality || 0,
              'إنتاج البيض': report.production_eggs || 0,
              'وزن البيض (كجم)': report.eggs_weight || 0,
              'استهلاك العلف (كجم)': report.feed_consumption || 0,
              'استهلاك المياه (لتر)': report.water_consumption || 0,
              'ملاحظات': report.notes || ''
            }));
            
            // إنشاء ورقة عمل للتقارير اليومية
            const reportsWorksheet = XLSX.utils.json_to_sheet(reportsData);
            XLSX.utils.book_append_sheet(workbook, reportsWorksheet, 'التقارير اليومية');
            
            // تعديل عرض الأعمدة
            const reportsColWidth = 20;
            const reportsWscols = Object.keys(reportsData[0] || {}).map(() => ({ wch: reportsColWidth }));
            reportsWorksheet['!cols'] = reportsWscols;
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات التقارير اليومية:', error);
        }
      }

      if (settings.includeInvoices) {
        try {
          const { data: invoices } = await supabase
            .from('invoices')
            .select(`
              id, 
              invoice_number, 
              invoice_date, 
              client_id (name),
              total_amount,
              checked
            `)
            .eq('farm_id', farm.id)
            .order('invoice_date', { ascending: false });
          
          if (invoices && invoices.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const invoicesData = invoices.map(invoice => ({
              'رقم الفاتورة': invoice.invoice_number || 'غير محدد',
               'تاريخ الفاتورة': new Date(invoice.invoice_date).toLocaleDateString('ar-SA'),
               'العميل': (invoice.client_id as any)?.name || 'غير محدد',
               'المبلغ الإجمالي': invoice.total_amount || 0,
               'حالة التدقيق': invoice.checked ? 'تم التدقيق' : 'قيد المراجعة'
            }));
            
            // إنشاء ورقة عمل للفواتير
            const invoicesWorksheet = XLSX.utils.json_to_sheet(invoicesData);
            XLSX.utils.book_append_sheet(workbook, invoicesWorksheet, 'الفواتير');
            
            // تعديل عرض الأعمدة
            const invoicesColWidth = 20;
            const invoicesWscols = Object.keys(invoicesData[0] || {}).map(() => ({ wch: invoicesColWidth }));
            invoicesWorksheet['!cols'] = invoicesWscols;

            // جلب تفاصيل الفواتير إذا كان التقرير شاملاً
            if (settings.isComprehensiveReport) {
              for (const invoice of invoices) {
                const { data: invoiceItems } = await supabase
                  .from('invoice_items')
                  .select('*')
                  .eq('invoice_id', invoice.id);
                
                if (invoiceItems && invoiceItems.length > 0) {
                  // تحويل البيانات إلى تنسيق مناسب للتصدير
                  const itemsData = invoiceItems.map(item => ({
                    'الوصف': item.description || 'غير محدد',
                    'الكمية': item.quantity || 0,
                    'السعر': item.price || 0,
                    'المبلغ': item.amount || 0
                  }));
                  
                  // إنشاء ورقة عمل لعناصر الفاتورة
                  const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
                  XLSX.utils.book_append_sheet(workbook, itemsWorksheet, `فاتورة ${invoice.invoice_number}`);
                  
                  // تعديل عرض الأعمدة
                  const itemsColWidth = 20;
                  const itemsWscols = Object.keys(itemsData[0] || {}).map(() => ({ wch: itemsColWidth }));
                  itemsWorksheet['!cols'] = itemsWscols;
                }
              }
            }
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الفواتير:', error);
        }
      }

      // إضافة تقارير الإنتاج إذا كان مطلوباً
      if (settings.includeProduction) {
        try {
          const { data: productionData } = await supabase
            .from('daily_reports')
            .select('report_date, production_eggs, eggs_weight')
            .eq('farm_id', farm.id)
            .order('report_date', { ascending: false });
          
          if (productionData && productionData.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const productionExport = productionData.map(item => ({
              'تاريخ الإنتاج': new Date(item.report_date).toLocaleDateString('ar-SA'),
              'عدد البيض': item.production_eggs || 0,
              'وزن البيض (كجم)': item.eggs_weight || 0
            }));
            
            // إنشاء ورقة عمل للإنتاج
            const productionWorksheet = XLSX.utils.json_to_sheet(productionExport);
            XLSX.utils.book_append_sheet(workbook, productionWorksheet, 'تقارير الإنتاج');
            
            // تعديل عرض الأعمدة
            const productionColWidth = 20;
            const productionWscols = Object.keys(productionExport[0] || {}).map(() => ({ wch: productionColWidth }));
            productionWorksheet['!cols'] = productionWscols;
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الإنتاج:', error);
        }
      }

      // إضافة تقارير الأدوية إذا كان مطلوباً
      if (settings.includeMedicines) {
        try {
          const { data: medicineData } = await supabase
            .from('medicine_consumption')
            .select(`
              id,
              consumption_date,
              medicine_id (name),
              quantity,
              notes
            `)
            .eq('farm_id', farm.id)
            .order('consumption_date', { ascending: false });
          
          if (medicineData && medicineData.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const medicineExport = medicineData.map(item => ({
              'تاريخ الاستهلاك': new Date(item.consumption_date).toLocaleDateString('ar-SA'),
               'اسم الدواء': (item.medicine_id as any)?.name || 'غير محدد',
               'الكمية': item.quantity || 0,
               'ملاحظات': item.notes || ''
            }));
            
            // إنشاء ورقة عمل للأدوية
            const medicineWorksheet = XLSX.utils.json_to_sheet(medicineExport);
            XLSX.utils.book_append_sheet(workbook, medicineWorksheet, 'استهلاك الأدوية');
            
            // تعديل عرض الأعمدة
            const medicineColWidth = 20;
            const medicineWscols = Object.keys(medicineExport[0] || {}).map(() => ({ wch: medicineColWidth }));
            medicineWorksheet['!cols'] = medicineWscols;
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الأدوية:', error);
        }
      }
      
      // إضافة تقارير المبيعات إذا كان مطلوباً
      if (settings.includeSales) {
        try {
          const { data: salesData } = await supabase
            .from('invoices')
            .select(`
              id,
              invoice_number,
              invoice_date,
              client_id (name),
              total_amount,
              invoice_items (
                id,
                description,
                quantity,
                price,
                amount
              )
            `)
            .eq('farm_id', farm.id)
            .eq('invoice_type', 'sales')
            .order('invoice_date', { ascending: false });
          
          if (salesData && salesData.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const salesExport = salesData.map(item => ({
              'رقم الفاتورة': item.invoice_number || 'غير محدد',
              'تاريخ الفاتورة': new Date(item.invoice_date).toLocaleDateString('ar-SA'),
              'العميل': (item.client_id as any)?.name || 'غير محدد',
              'المبلغ الإجمالي': item.total_amount || 0,
              'عدد العناصر': item.invoice_items?.length || 0
            }));
            
            // إنشاء ورقة عمل للمبيعات
            const salesWorksheet = XLSX.utils.json_to_sheet(salesExport);
            XLSX.utils.book_append_sheet(workbook, salesWorksheet, 'تقارير المبيعات');
            
            // تعديل عرض الأعمدة
            const salesColWidth = 20;
            const salesWscols = Object.keys(salesExport[0] || {}).map(() => ({ wch: salesColWidth }));
            salesWorksheet['!cols'] = salesWscols;
            
            // إضافة تفاصيل المبيعات إذا كان التقرير شاملاً
            if (settings.isComprehensiveReport) {
              // تجميع كل عناصر المبيعات
              const allSalesItems = salesData.flatMap(invoice => 
                (invoice.invoice_items || []).map(item => ({
                  'رقم الفاتورة': invoice.invoice_number,
                  'تاريخ الفاتورة': new Date(invoice.invoice_date).toLocaleDateString('ar-SA'),
                  'العميل': (invoice.client_id as any)?.name || 'غير محدد',
                  'الوصف': item.description || 'غير محدد',
                  'الكمية': item.quantity || 0,
                  'السعر': item.price || 0,
                  'المبلغ': item.amount || 0
                }))
              );
              
              if (allSalesItems.length > 0) {
                // إنشاء ورقة عمل لتفاصيل المبيعات
                const salesItemsWorksheet = XLSX.utils.json_to_sheet(allSalesItems);
                XLSX.utils.book_append_sheet(workbook, salesItemsWorksheet, 'تفاصيل المبيعات');
                
                // تعديل عرض الأعمدة
                const salesItemsColWidth = 20;
                const salesItemsWscols = Object.keys(allSalesItems[0] || {}).map(() => ({ wch: salesItemsColWidth }));
                salesItemsWorksheet['!cols'] = salesItemsWscols;
              }
            }
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات المبيعات:', error);
        }
      }
      
      // إضافة تقارير المشتريات إذا كان مطلوباً
      if (settings.includePurchases) {
        try {
          const { data: purchasesData } = await supabase
            .from('invoices')
            .select(`
              id,
              invoice_number,
              invoice_date,
              client_id (name),
              total_amount,
              invoice_items (
                id,
                description,
                quantity,
                price,
                amount
              )
            `)
            .eq('farm_id', farm.id)
            .eq('invoice_type', 'purchase')
            .order('invoice_date', { ascending: false });
          
          if (purchasesData && purchasesData.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const purchasesExport = purchasesData.map(item => ({
              'رقم الفاتورة': item.invoice_number || 'غير محدد',
              'تاريخ الفاتورة': new Date(item.invoice_date).toLocaleDateString('ar-SA'),
              'المورد': (item.client_id as any)?.name || 'غير محدد',
              'المبلغ الإجمالي': item.total_amount || 0,
              'عدد العناصر': item.invoice_items?.length || 0
            }));
            
            // إنشاء ورقة عمل للمشتريات
            const purchasesWorksheet = XLSX.utils.json_to_sheet(purchasesExport);
            XLSX.utils.book_append_sheet(workbook, purchasesWorksheet, 'تقارير المشتريات');
            
            // تعديل عرض الأعمدة
            const purchasesColWidth = 20;
            const purchasesWscols = Object.keys(purchasesExport[0] || {}).map(() => ({ wch: purchasesColWidth }));
            purchasesWorksheet['!cols'] = purchasesWscols;
            
            // إضافة تفاصيل المشتريات إذا كان التقرير شاملاً
            if (settings.isComprehensiveReport) {
              // تجميع كل عناصر المشتريات
              const allPurchasesItems = purchasesData.flatMap(invoice => 
                (invoice.invoice_items || []).map(item => ({
                  'رقم الفاتورة': invoice.invoice_number,
                  'تاريخ الفاتورة': new Date(invoice.invoice_date).toLocaleDateString('ar-SA'),
                  'المورد': (invoice.client_id as any)?.name || 'غير محدد',
                  'الوصف': item.description || 'غير محدد',
                  'الكمية': item.quantity || 0,
                  'السعر': item.price || 0,
                  'المبلغ': item.amount || 0
                }))
              );
              
              if (allPurchasesItems.length > 0) {
                // إنشاء ورقة عمل لتفاصيل المشتريات
                const purchasesItemsWorksheet = XLSX.utils.json_to_sheet(allPurchasesItems);
                XLSX.utils.book_append_sheet(workbook, purchasesItemsWorksheet, 'تفاصيل المشتريات');
                
                // تعديل عرض الأعمدة
                const purchasesItemsColWidth = 20;
                const purchasesItemsWscols = Object.keys(allPurchasesItems[0] || {}).map(() => ({ wch: purchasesItemsColWidth }));
                purchasesItemsWorksheet['!cols'] = purchasesItemsWscols;
              }
            }
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات المشتريات:', error);
        }
      }
      
      // إضافة تقارير التصنيع إذا كان مطلوباً
      if (settings.includeManufacturing) {
        try {
          const { data: manufacturingData } = await supabase
            .from('manufacturing')
            .select(`
              id,
              manufacturing_date,
              product_name,
              quantity,
              manufacturing_items (
                id,
                material_name_id (name),
                quantity,
                unit_id (name)
              ),
              manufacturing_expenses (
                id,
                description,
                amount
              )
            `)
            .eq('farm_id', farm.id)
            .order('manufacturing_date', { ascending: false });
          
          if (manufacturingData && manufacturingData.length > 0) {
            // تحويل البيانات إلى تنسيق مناسب للتصدير
            const manufacturingExport = manufacturingData.map(item => ({
              'تاريخ التصنيع': new Date(item.manufacturing_date).toLocaleDateString('ar-SA'),
              'اسم المنتج': item.product_name || 'غير محدد',
              'الكمية': item.quantity || 0,
              'عدد المواد المستخدمة': item.manufacturing_items?.length || 0,
              'عدد المصاريف': item.manufacturing_expenses?.length || 0
            }));
            
            // إنشاء ورقة عمل للتصنيع
            const manufacturingWorksheet = XLSX.utils.json_to_sheet(manufacturingExport);
            XLSX.utils.book_append_sheet(workbook, manufacturingWorksheet, 'تقارير التصنيع');
            
            // تعديل عرض الأعمدة
            const manufacturingColWidth = 20;
            const manufacturingWscols = Object.keys(manufacturingExport[0] || {}).map(() => ({ wch: manufacturingColWidth }));
            manufacturingWorksheet['!cols'] = manufacturingWscols;
            
            // إضافة تفاصيل التصنيع إذا كان التقرير شاملاً
            if (settings.isComprehensiveReport) {
              // تجميع كل مواد التصنيع
              const allManufacturingItems = manufacturingData.flatMap(manufacturing => 
                (manufacturing.manufacturing_items || []).map(item => ({
                  'تاريخ التصنيع': new Date(manufacturing.manufacturing_date).toLocaleDateString('ar-SA'),
                  'اسم المنتج': manufacturing.product_name || 'غير محدد',
                  'اسم المادة': (item.material_name_id as any)?.name || 'غير محدد',
                  'الكمية': item.quantity || 0,
                  'الوحدة': (item.unit_id as any)?.name || 'غير محدد'
                }))
              );
              
              if (allManufacturingItems.length > 0) {
                // إنشاء ورقة عمل لمواد التصنيع
                const manufacturingItemsWorksheet = XLSX.utils.json_to_sheet(allManufacturingItems);
                XLSX.utils.book_append_sheet(workbook, manufacturingItemsWorksheet, 'مواد التصنيع');
                
                // تعديل عرض الأعمدة
                const manufacturingItemsColWidth = 20;
                const manufacturingItemsWscols = Object.keys(allManufacturingItems[0] || {}).map(() => ({ wch: manufacturingItemsColWidth }));
                manufacturingItemsWorksheet['!cols'] = manufacturingItemsWscols;
              }
              
              // تجميع كل مصاريف التصنيع
              const allManufacturingExpenses = manufacturingData.flatMap(manufacturing => 
                (manufacturing.manufacturing_expenses || []).map(expense => ({
                  'تاريخ التصنيع': new Date(manufacturing.manufacturing_date).toLocaleDateString('ar-SA'),
                  'اسم المنتج': manufacturing.product_name || 'غير محدد',
                  'وصف المصروف': expense.description || 'غير محدد',
                  'المبلغ': expense.amount || 0
                }))
              );
              
              if (allManufacturingExpenses.length > 0) {
                // إنشاء ورقة عمل لمصاريف التصنيع
                const manufacturingExpensesWorksheet = XLSX.utils.json_to_sheet(allManufacturingExpenses);
                XLSX.utils.book_append_sheet(workbook, manufacturingExpensesWorksheet, 'مصاريف التصنيع');
                
                // تعديل عرض الأعمدة
                const manufacturingExpensesColWidth = 20;
                const manufacturingExpensesWscols = Object.keys(allManufacturingExpenses[0] || {}).map(() => ({ wch: manufacturingExpensesColWidth }));
                manufacturingExpensesWorksheet['!cols'] = manufacturingExpensesWscols;
              }
            }
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات التصنيع:', error);
        }
      }

      // تنزيل الملف
      const fileName = `تقرير_مزرعة_${farm.name.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 ml-2" />
          تقرير شامل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تصدير تقرير شامل للمزرعة: {farm.name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
            <TabsTrigger value="advanced">بيانات متقدمة</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>البيانات الأساسية</CardTitle>
                <CardDescription>حدد البيانات الأساسية التي تريد تضمينها في التقرير</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="warehouses" 
                    checked={settings.includeWarehouses}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, includeWarehouses: !!checked})
                    }
                  />
                  <Label htmlFor="warehouses" className="mr-2">تضمين بيانات المستودعات</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="poultry" 
                    checked={settings.includePoultry}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, includePoultry: !!checked})
                    }
                  />
                  <Label htmlFor="poultry" className="mr-2">تضمين بيانات الدواجن</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="dailyReports" 
                    checked={settings.includeDailyReports}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, includeDailyReports: !!checked})
                    }
                  />
                  <Label htmlFor="dailyReports" className="mr-2">تضمين التقارير اليومية</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="invoices" 
                    checked={settings.includeInvoices}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, includeInvoices: !!checked})
                    }
                  />
                  <Label htmlFor="invoices" className="mr-2">تضمين الفواتير</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>بيانات متقدمة</CardTitle>
                <CardDescription>حدد البيانات المتقدمة التي تريد تضمينها في التقرير</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="production" 
                    checked={settings.includeProduction}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, includeProduction: !!checked})
                    }
                  />
                  <Label htmlFor="production" className="mr-2">تضمين تقارير الإنتاج</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="medicines" 
                    checked={settings.includeMedicines}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, includeMedicines: !!checked})
                    }
                  />
                  <Label htmlFor="medicines" className="mr-2">تضمين تقارير الأدوية</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="comprehensive" 
                    checked={settings.isComprehensiveReport}
                    onCheckedChange={(checked) => 
                      setSettings({...settings, isComprehensiveReport: !!checked})
                    }
                  />
                  <Label htmlFor="comprehensive" className="mr-2">إنشاء تقرير شامل مع كافة التفاصيل</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button 
            onClick={handleExport} 
            disabled={isLoading}
          >
            {isLoading ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير الشامل'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}