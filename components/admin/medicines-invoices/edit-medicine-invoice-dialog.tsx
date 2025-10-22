'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { updateMedicineInvoice, getMedicineInvoiceById } from '@/actions/medicine-invoice.actions';
import { getWarehousesForMaterials } from '@/actions/material.actions';
import { getPoultryStatuses } from '@/actions/poultry.actions';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const formSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  invoice_date: z.date({ required_error: 'تاريخ الفاتورة مطلوب' }),
  invoice_time: z.string().optional(),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  poultry_status_id: z.string().optional(),
  notes: z.string().optional(),
});

interface PoultryStatus {
  id: string;
  batch_name?: string | null;
  status_name?: string | null;
}

interface Warehouse {
  id: string;
  name: string;
  farm_name?: string;
}

interface MedicineInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_time?: string | null;
  warehouse_id: string;
  poultry_status_id?: string | null;
  notes?: string | null;
  total_value: number;
  warehouse?: {
    name: string;
    farm_name: string;
  };
  poultry_status?: {
    status_name: string | null;
  };
}

interface EditMedicineInvoiceDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMedicineInvoiceDialog({
  invoiceId,
  open,
  onOpenChange,
}: EditMedicineInvoiceDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [poultryStatuses, setPoultryStatuses] = useState<PoultryStatus[]>([]);
  const [invoice, setInvoice] = useState<MedicineInvoice | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: '',
      invoice_date: new Date(),
      invoice_time: '',
      warehouse_id: '',
      poultry_status_id: '',
      notes: '',
    },
  });

  // تحميل بيانات الفاتورة والمستودعات وحالات الدواجن عند فتح الـ Dialog
  useEffect(() => {
    async function loadData() {
      if (!open || !invoiceId) return;

      setIsLoading(true);
      try {
        // تحميل بيانات الفاتورة باستخدام server action
        const invoiceResult = await getMedicineInvoiceById(invoiceId);
        
        if (!invoiceResult.success || !invoiceResult.data) {
          throw new Error(invoiceResult.error || 'فشل في تحميل بيانات الفاتورة');
        }

        const invoiceData = invoiceResult.data;
        setInvoice(invoiceData);

        // تحميل المستودعات
        const warehousesResult = await getWarehousesForMaterials();
        if (warehousesResult.success && warehousesResult.data) {
          setWarehouses(warehousesResult.data as Warehouse[]);
        }

        // تحميل حالات الدواجن
        const poultryStatusesResult = await getPoultryStatuses();
        if (poultryStatusesResult.success && poultryStatusesResult.data) {
          const processedStatuses = poultryStatusesResult.data.map((status) => ({
            id: status.id,
            batch_name: status.batch_name ?? null,
            status_name: status.status_name ?? null,
          }));
          setPoultryStatuses(processedStatuses);
        }

        // ملء الفورم بالبيانات
        form.reset({
          invoice_number: invoiceData.invoice_number || '',
          invoice_date: invoiceData.invoice_date ? new Date(invoiceData.invoice_date) : new Date(),
          invoice_time: invoiceData.invoice_time || '',
          warehouse_id: invoiceData.warehouse_id || '',
          poultry_status_id: invoiceData.poultry_status_id || '',
          notes: invoiceData.notes || '',
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('حدث خطأ أثناء تحميل البيانات');
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [open, invoiceId, form, onOpenChange]);

  // إعادة تعيين الفورم عند إغلاق الـ Dialog
  useEffect(() => {
    if (!open) {
      setInvoice(null);
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!invoice) {
      toast.error('لا يمكن تحديث الفاتورة: البيانات غير متوفرة');
      return;
    }

    setIsPending(true);
    try {
      const result = await updateMedicineInvoice({
        id: invoiceId,
        invoice_number: values.invoice_number,
        invoice_date: format(values.invoice_date, 'yyyy-MM-dd'),
        invoice_time: values.invoice_time || null,
        warehouse_id: values.warehouse_id,
        poultry_status_id: values.poultry_status_id || null,
        notes: values.notes || null,
      });

      if (!result.success) {
        throw new Error(result.error || 'فشل في تحديث الفاتورة');
      }

      toast.success('تم تحديث الفاتورة بنجاح');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الفاتورة');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تعديل فاتورة الأدوية</DialogTitle>
          <DialogDescription>تعديل تفاصيل فاتورة الأدوية</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل البيانات...</span>
          </div>
        ) : invoice ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الفاتورة</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الفاتورة</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-right font-normal"
                              disabled={isPending}
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'yyyy/MM/dd')
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isPending}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وقت الفاتورة</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستودع</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المستودع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} {w.farm_name ? `(${w.farm_name})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="poultry_status_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة الدواجن (اختياري)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                        value={field.value || "none"}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حالة الدواجن" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">غير محدد</SelectItem>
                          {poultryStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.batch_name || status.status_name || 'بدون اسم'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={isPending} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">إجمالي القيمة:</span>
                  <span className="text-lg font-bold">
                    {invoice.total_value?.toLocaleString() || 0} ريال
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ملاحظة: لتعديل العناصر أو المصاريف، يرجى استخدام صفحة تفاصيل الفاتورة
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}