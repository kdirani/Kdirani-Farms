'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateDailyReport } from '@/actions/daily-report.actions';
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
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

// تعريف نموذج البيانات للتقرير اليومي
const editDailyReportSchema = z.object({
  production_eggs_healthy: z.coerce.number().min(0, 'يجب أن يكون عدد البيض الصحي أكبر من أو يساوي 0'),
  production_eggs_deformed: z.coerce.number().min(0, 'يجب أن يكون عدد البيض المشوه أكبر من أو يساوي 0'),
  eggs_sold: z.coerce.number().min(0, 'يجب أن يكون عدد البيض المباع أكبر من أو يساوي 0'),
  eggs_gift: z.coerce.number().min(0, 'يجب أن يكون عدد البيض المهدى أكبر من أو يساوي 0'),
  previous_eggs_balance: z.coerce.number().min(0, 'يجب أن يكون رصيد البيض السابق أكبر من أو يساوي 0'),
  carton_consumption: z.coerce.number().min(0, 'يجب أن يكون استهلاك الكرتون أكبر من أو يساوي 0'),
  chicks_dead: z.coerce.number().min(0, 'يجب أن يكون عدد الكتاكيت الميتة أكبر من أو يساوي 0'),
  feed_daily_kg: z.coerce.number().min(0, 'يجب أن يكون استهلاك العلف اليومي أكبر من أو يساوي 0'),
  production_droppings: z.coerce.number().min(0, 'يجب أن يكون إنتاج السماد أكبر من أو يساوي 0'),
  notes: z.string().optional(),
});

type EditDailyReportFormValues = z.infer<typeof editDailyReportSchema>;

interface DailyReport {
  id: string;
  warehouse_id: string;
  report_date: string;
  report_time: string;
  production_eggs_healthy: number;
  production_eggs_deformed: number;
  production_eggs: number;
  production_egg_rate: number;
  eggs_sold: number;
  eggs_gift: number;
  previous_eggs_balance: number;
  current_eggs_balance: number;
  carton_consumption: number;
  chicks_before: number;
  chicks_dead: number;
  chicks_after: number;
  feed_daily_kg: number;
  feed_cumulative_kg: number;
  feed_conversion_ratio: number;
  production_droppings: number;
  notes: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface EditDailyReportDialogProps {
  report: DailyReport | null;
  onClose: () => void;
}

export function EditDailyReportDialog({ report, onClose }: EditDailyReportDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // إعداد النموذج مع القيم الافتراضية من التقرير
  const form = useForm<EditDailyReportFormValues>({
    resolver: zodResolver(editDailyReportSchema),
    defaultValues: report ? {
      production_eggs_healthy: report.production_eggs_healthy,
      production_eggs_deformed: report.production_eggs_deformed,
      eggs_sold: report.eggs_sold,
      eggs_gift: report.eggs_gift,
      previous_eggs_balance: report.previous_eggs_balance,
      carton_consumption: report.carton_consumption,
      chicks_dead: report.chicks_dead,
      feed_daily_kg: report.feed_daily_kg,
      production_droppings: report.production_droppings,
      notes: report.notes || '',
    } : {
      production_eggs_healthy: 0,
      production_eggs_deformed: 0,
      eggs_sold: 0,
      eggs_gift: 0,
      previous_eggs_balance: 0,
      carton_consumption: 0,
      chicks_dead: 0,
      feed_daily_kg: 0,
      production_droppings: 0,
      notes: '',
    },
  });

  // حساب القيم المشتقة
  const calculateDerivedValues = (data: EditDailyReportFormValues) => {
    // إجمالي إنتاج البيض
    const totalEggs = data.production_eggs_healthy + data.production_eggs_deformed;
    
    // عدد صواني البيض (كل صينية 30 بيضة)
    const eggTrays = totalEggs / 30;
    
    // معدل إنتاج البيض (إذا كان هناك دجاج)
    let eggRate = 0;
    if (report && report.chicks_before > 0) {
      eggRate = (totalEggs / (report.chicks_before - data.chicks_dead)) * 100;
    }
    
    // رصيد البيض الحالي
    const currentEggsBalance = data.previous_eggs_balance + totalEggs - data.eggs_sold - data.eggs_gift;
    
    // عدد الدجاج بعد النفوق
    const chicksAfter = report ? report.chicks_before - data.chicks_dead : 0;
    
    return {
      production_eggs: totalEggs,
      production_egg_rate: eggRate,
      current_eggs_balance: currentEggsBalance,
      chicks_after: chicksAfter,
    };
  };

  // معالجة تقديم النموذج
  const onSubmit = async (data: EditDailyReportFormValues) => {
    if (!report) return;
    
    setIsSubmitting(true);
    
    try {
      // حساب القيم المشتقة
      const derivedValues = calculateDerivedValues(data);
      
      // تحديث التقرير
      await updateDailyReport(report.id, {
        ...data,
        ...derivedValues,
      });
      
      toast.success('تم تحديث التقرير بنجاح');
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error updating daily report:', error);
      toast.error('حدث خطأ أثناء تحديث التقرير');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={!!report} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تعديل التقرير اليومي</DialogTitle>
          <DialogDescription>
            تاريخ التقرير: {formatDate(new Date(report.report_date))}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="production_eggs_healthy"
                render={({ field }: { field: { onChange: (value: number) => void; value: number } }) => (
                  <FormItem>
                    <FormLabel>البيض الصحي</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} value={field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="production_eggs_deformed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البيض المشوه</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eggs_sold"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>البيض المباع</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eggs_gift"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>البيض المهدى</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="previous_eggs_balance"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>رصيد البيض السابق</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="carton_consumption"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>استهلاك الكرتون</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="chicks_dead"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>الكتاكيت الميتة</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="feed_daily_kg"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>استهلاك العلف اليومي (كجم)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="production_droppings"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>إنتاج السماد</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}