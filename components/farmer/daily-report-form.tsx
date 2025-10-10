'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createDailyReport } from '@/actions/daily-report.actions';
import { createDailyReportAttachment } from '@/actions/daily-report-attachment.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { toast } from 'sonner'; 
import { Loader2, Plus, Trash2 } from 'lucide-react'; 
import { useRouter } from 'next/navigation';

const dailyReportSchema = z.object({
  report_date: z.string().min(1, 'التاريخ مطلوب'),
  report_time: z.string().min(1, 'الوقت مطلوب'),
  production_eggs_healthy: z.number().min(0, 'يجب أن يكون رقم موجب'),
  production_eggs_deformed: z.number().min(0, 'يجب أن يكون رقم موجب'),
  eggs_sold: z.number().min(0, 'يجب أن يكون رقم موجب'),
  eggs_gift: z.number().min(0, 'يجب أن يكون رقم موجب'),
  previous_eggs_balance: z.number().min(0, 'يجب أن يكون رقم موجب'),
  carton_consumption: z.number().min(0, 'يجب أن يكون رقم موجب'),
  chicks_before: z.number().int().min(0, 'يجب أن يكون رقم صحيح موجب'),
  chicks_dead: z.number().int().min(0, 'يجب أن يكون رقم صحيح موجب'),
  feed_daily_kg: z.number().min(0, 'يجب أن يكون رقم موجب'),
  feed_monthly_kg: z.number().min(0, 'يجب أن يكون رقم موجب'),
  feed_ratio: z.number().min(0, 'يجب أن يكون رقم موجب'),
  production_droppings: z.number().min(0, 'يجب أن يكون رقم موجب'),
  notes: z.string().optional(),
});

type DailyReportFormData = z.infer<typeof dailyReportSchema>;

interface DailyReportFormProps {
  warehouseId: string;
  warehouseName: string;
  farmId: string;
  eggWeights: Array<{ id: string; weight_range: string }>;
  materialsNames: Array<{ id: string; material_name: string }>;
  units: Array<{ id: string; unit_name: string }>;
  expenseTypes: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
  medicines: Array<{ id: string; name: string }>;
  poultryStatus: Array<{ id: string; status_name: string; batch_name: string }>;
}

export default function DailyReportForm({
  warehouseId,
  warehouseName,
  farmId,
  eggWeights,
  materialsNames,
  units,
  expenseTypes,
  clients,
  medicines,
  poultryStatus,
}: DailyReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DailyReportFormData>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0],
      report_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      production_eggs_healthy: 0,
      production_eggs_deformed: 0,
      eggs_sold: 0,
      eggs_gift: 0,
      previous_eggs_balance: 0,
      carton_consumption: 0,
      chicks_before: 0,
      chicks_dead: 0,
      feed_daily_kg: 0,
      feed_monthly_kg: 0,
      feed_ratio: 0,
      production_droppings: 0,
    },
  });

  const watchHealthy = watch('production_eggs_healthy');
  const watchDeformed = watch('production_eggs_deformed');
  const watchPreviousBalance = watch('previous_eggs_balance');
  const watchSold = watch('eggs_sold');
  const watchGift = watch('eggs_gift');
  const watchChicksBefore = watch('chicks_before');
  const watchChicksDead = watch('chicks_dead');

  // Calculate totals
  const productionEggs = watchHealthy + watchDeformed;
  const productionEggRate = watchChicksBefore > 0 ? (productionEggs / watchChicksBefore) * 100 : 0;
  const currentEggsBalance = watchPreviousBalance + productionEggs - watchSold - watchGift;
  const chicksAfter = watchChicksBefore - watchChicksDead;

  const onSubmit = async (data: DailyReportFormData) => {
    setIsLoading(true);
    try {
      const reportData = {
        warehouse_id: warehouseId,
        report_date: data.report_date,
        report_time: data.report_time,
        production_eggs_healthy: data.production_eggs_healthy,
        production_eggs_deformed: data.production_eggs_deformed,
        production_eggs: productionEggs,
        production_egg_rate: parseFloat(productionEggRate.toFixed(2)),
        eggs_sold: data.eggs_sold,
        eggs_gift: data.eggs_gift,
        previous_eggs_balance: data.previous_eggs_balance,
        current_eggs_balance: currentEggsBalance,
        carton_consumption: data.carton_consumption,
        chicks_before: data.chicks_before,
        chicks_dead: data.chicks_dead,
        chicks_after: chicksAfter,
        feed_daily_kg: data.feed_daily_kg,
        feed_monthly_kg: data.feed_monthly_kg,
        feed_ratio: data.feed_ratio,
        production_droppings: data.production_droppings,
        notes: data.notes,
        checked: false,
      };

      const result = await createDailyReport(reportData);

      if (result.success && result.data) {
        // Upload attachments
        if (attachmentFiles.length > 0) {
          for (const uploadedFile of attachmentFiles) {
            const attachmentResult = await createDailyReportAttachment(
              result.data.id,
              uploadedFile.file
            );

            if (!attachmentResult.success) {
              toast.warning(`تم حفظ التقرير لكن فشل رفع الملف: ${uploadedFile.file.name}`);
            }
          }
        }

        toast.success('تم إنشاء التقرير اليومي بنجاح');
        router.push('/farmer/reports');
      } else {
        toast.error(result.error || 'فشل في إنشاء التقرير');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report_date">التاريخ *</Label>
            <Input
              id="report_date"
              type="date"
              {...register('report_date')}
              disabled={isLoading}
            />
            {errors.report_date && (
              <p className="text-sm text-destructive">{errors.report_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report_time">الوقت *</Label>
            <Input
              id="report_time"
              type="time"
              {...register('report_time')}
              disabled={isLoading}
            />
            {errors.report_time && (
              <p className="text-sm text-destructive">{errors.report_time.message}</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">إنتاج البيض</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="production_eggs_healthy">بيض صحي</Label>
              <Input
                id="production_eggs_healthy"
                type="number"
                {...register('production_eggs_healthy', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.production_eggs_healthy && (
                <p className="text-sm text-destructive">{errors.production_eggs_healthy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="production_eggs_deformed">بيض مشوه</Label>
              <Input
                id="production_eggs_deformed"
                type="number"
                {...register('production_eggs_deformed', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.production_eggs_deformed && (
                <p className="text-sm text-destructive">{errors.production_eggs_deformed.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>إجمالي الإنتاج</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {productionEggs.toLocaleString('en-US')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="previous_eggs_balance">الرصيد السابق</Label>
              <Input
                id="previous_eggs_balance"
                type="number"
                {...register('previous_eggs_balance', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eggs_sold">البيض المباع</Label>
              <Input
                id="eggs_sold"
                type="number"
                {...register('eggs_sold', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eggs_gift">بيض هدية</Label>
              <Input
                id="eggs_gift"
                type="number"
                {...register('eggs_gift', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>الرصيد الحالي</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-primary/10 px-3 text-sm font-bold text-primary">
                {currentEggsBalance.toLocaleString('en-US')}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carton_consumption">استهلاك الكراتين</Label>
            <Input
              id="carton_consumption"
              type="number"
              {...register('carton_consumption', { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">حالة القطيع</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chicks_before">العدد قبل</Label>
              <Input
                id="chicks_before"
                type="number"
                {...register('chicks_before', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chicks_dead">النافق</Label>
              <Input
                id="chicks_dead"
                type="number"
                {...register('chicks_dead', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>العدد بعد</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {chicksAfter.toLocaleString('en-US')}
              </div>
            </div>

            <div className="space-y-2">
              <Label>نسبة الإنتاج</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {productionEggRate.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">العلف والسواد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feed_daily_kg">العلف اليومي (كجم)</Label>
              <Input
                id="feed_daily_kg"
                type="number"
                step="0.01"
                {...register('feed_daily_kg', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed_monthly_kg">العلف الشهري (كجم)</Label>
              <Input
                id="feed_monthly_kg"
                type="number"
                step="0.01"
                {...register('feed_monthly_kg', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed_ratio">معدل التحويل</Label>
              <Input
                id="feed_ratio"
                type="number"
                step="0.01"
                {...register('feed_ratio', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="production_droppings">إنتاج السواد (كجم)</Label>
            <Input
              id="production_droppings"
              type="number"
              step="0.01"
              {...register('production_droppings', { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
            {...register('notes')}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <Separator />

        {/* File Attachments */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">المرفقات</h3>
            <p className="text-sm text-muted-foreground mb-4">
              قم بإرفاق الملفات ذات الصلة (صور، PDF، مستندات)
            </p>
          </div>
          <FileUpload
            onFilesSelected={setAttachmentFiles}
            maxFiles={5}
            maxSizeMB={10}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          حفظ التقرير
        </Button>
      </div>
    </form>
  );
}
