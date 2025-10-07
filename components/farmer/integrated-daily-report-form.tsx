'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  createIntegratedDailyReport,
  getWarehouseMedicines,
  getChicksBeforeForNewReport,
  getPreviousEggsBalanceForNewReport,
  getMonthlyFeedPreview,
  type EggSaleInvoiceItem,
  type DroppingsSaleInvoiceData,
  type MedicineConsumptionItem,
} from '@/actions/integrated-daily-report.actions';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Package, Pill, Egg } from 'lucide-react';
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

interface IntegratedDailyReportFormProps {
  warehouseId: string;
  warehouseName: string;
  farmId: string;
  eggWeights: Array<{ id: string; weight_range: string }>;
  materialsNames: Array<{ id: string; material_name: string }>;
  units: Array<{ id: string; unit_name: string }>;
  expenseTypes: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string; type: string }>;
  medicines: Array<{ id: string; name: string }>;
  poultryStatus: { id: string; batch_name: string } | null; // قطيع واحد فقط لكل مزرعة
}

export default function IntegratedDailyReportForm({
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
}: IntegratedDailyReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  
  // Egg Sale Invoice State
  const [eggSaleItems, setEggSaleItems] = useState<Array<EggSaleInvoiceItem & { client_id?: string }>>([]);
  const [newEggSaleItem, setNewEggSaleItem] = useState<Partial<EggSaleInvoiceItem & { client_id?: string }>>({
    quantity: 0,
    price: 0,
    unit_id: '',
  });

  // Droppings Sale State
  const [droppingsSale, setDroppingsSale] = useState<Partial<DroppingsSaleInvoiceData>>({
    quantity: 0,
    price: 0,
    unit_id: '',
  });

  // Medicine Consumption State
  const [medicineItems, setMedicineItems] = useState<MedicineConsumptionItem[]>([]);
  const [newMedicineItem, setNewMedicineItem] = useState<Partial<MedicineConsumptionItem>>({
    quantity: 0,
    price: 0,
  });
  const [availableMedicines, setAvailableMedicines] = useState<any[]>([]);

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

  // Load available medicines
  useEffect(() => {
    const loadMedicines = async () => {
      const result = await getWarehouseMedicines(warehouseId);
      if (result.success && result.data) {
        setAvailableMedicines(result.data);
      }
    };
    loadMedicines();
  }, [warehouseId]);

  // Load chicks_before value automatically
  useEffect(() => {
    const loadChicksBefore = async () => {
      const result = await getChicksBeforeForNewReport(warehouseId);
      if (result.success && result.data !== undefined) {
        setValue('chicks_before', result.data, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true 
        });
      } else if (result.error) {
        console.error('Error loading chicks before:', result.error);
        toast.error('فشل في جلب عدد الدجاج');
      }
    };
    loadChicksBefore();
  }, [warehouseId, setValue]);

  // Load previous_eggs_balance value automatically
  useEffect(() => {
    const loadPreviousBalance = async () => {
      const result = await getPreviousEggsBalanceForNewReport(warehouseId);
      if (result.success && result.data !== undefined) {
        setValue('previous_eggs_balance', result.data, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true 
        });
      } else if (result.error) {
        console.error('Error loading previous eggs balance:', result.error);
        toast.error('فشل في جلب الرصيد السابق');
      }
    };
    loadPreviousBalance();
  }, [warehouseId, setValue]);

  // Watch for changes in feed_daily_kg and report_date
  const watchFeedDaily = watch('feed_daily_kg');
  const watchReportDate = watch('report_date');

  // Calculate monthly feed automatically
  useEffect(() => {
    const calculateMonthlyFeed = async () => {
      if (warehouseId && watchReportDate && watchFeedDaily >= 0) {
        const result = await getMonthlyFeedPreview(
          warehouseId,
          watchReportDate,
          watchFeedDaily
        );
        if (result.success && result.data !== undefined) {
          setValue('feed_monthly_kg', result.data, {
            shouldValidate: true,
          });
        }
      }
    };
    calculateMonthlyFeed();
  }, [warehouseId, watchReportDate, watchFeedDaily, setValue]);

  const watchHealthy = watch('production_eggs_healthy');
  const watchDeformed = watch('production_eggs_deformed');
  const watchPreviousBalance = watch('previous_eggs_balance');
  const watchSold = watch('eggs_sold');
  const watchGift = watch('eggs_gift');
  const watchChicksBefore = watch('chicks_before');
  const watchChicksDead = watch('chicks_dead');
  const watchFeedMonthly = watch('feed_monthly_kg');

  // Calculate totals
  const productionEggs = watchHealthy + watchDeformed;
  const productionEggRate = watchChicksBefore > 0 
    ? ((productionEggs * 30) / watchChicksBefore) * 100 
    : 0;
  const currentEggsBalance = watchPreviousBalance + watchHealthy - watchSold - watchGift;
  const chicksAfter = watchChicksBefore - watchChicksDead;
  
  // Calculate feed ratio: (feed in grams / chicks after) rounded to 2 decimals
  const feedRatio = chicksAfter > 0 
    ? parseFloat(((watchFeedDaily * 1000) / chicksAfter).toFixed(2))
    : 0;

  // Calculate total eggs sold from egg sale items
  const totalEggsSold = eggSaleItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Calculate carton consumption: (healthy_eggs / 100) + (healthy_eggs / 1000)
  const cartonConsumption = watchHealthy > 0
    ? parseFloat(((watchHealthy / 100) + (watchHealthy / 1000)).toFixed(2))
    : 0;

  // Auto-update feed_ratio when values change
  useEffect(() => {
    setValue('feed_ratio', feedRatio, {
      shouldValidate: true,
    });
  }, [feedRatio, setValue]);

  // Auto-update eggs_sold when egg sale items change
  useEffect(() => {
    setValue('eggs_sold', totalEggsSold, {
      shouldValidate: true,
    });
  }, [totalEggsSold, setValue]);

  // Auto-update carton_consumption when healthy eggs change
  useEffect(() => {
    setValue('carton_consumption', cartonConsumption, {
      shouldValidate: true,
    });
  }, [cartonConsumption, setValue]);

  // Egg Sale Functions
  const addEggSaleItem = () => {
    if (!newEggSaleItem.egg_weight_id || !newEggSaleItem.unit_id || !newEggSaleItem.quantity) {
      toast.error('يرجى ملء الحقول المطلوبة (وزن البيض، الوحدة، الكمية)');
      return;
    }

    setEggSaleItems([...eggSaleItems, newEggSaleItem as EggSaleInvoiceItem & { client_id?: string }]);
    setNewEggSaleItem({ quantity: 0, price: 0, unit_id: '' });
  };

  const removeEggSaleItem = (index: number) => {
    setEggSaleItems(eggSaleItems.filter((_, i) => i !== index));
  };

  // Medicine Consumption Functions
  const addMedicineItem = () => {
    if (!newMedicineItem.medicine_id || !newMedicineItem.unit_id || !newMedicineItem.quantity) {
      toast.error('يرجى ملء الحقول المطلوبة (الدواء، الوحدة، الكمية)');
      return;
    }

    // Check available quantity
    const medicine = availableMedicines.find(m => m.medicine_id === newMedicineItem.medicine_id);
    if (medicine && newMedicineItem.quantity! > medicine.current_balance) {
      toast.error(`الكمية المتاحة: ${medicine.current_balance}`);
      return;
    }

    setMedicineItems([...medicineItems, newMedicineItem as MedicineConsumptionItem]);
    setNewMedicineItem({ quantity: 0, price: 0 });
  };

  const removeMedicineItem = (index: number) => {
    setMedicineItems(medicineItems.filter((_, i) => i !== index));
  };

  const getAvailableQuantity = (medicineId: string): number => {
    const medicine = availableMedicines.find(m => m.medicine_id === medicineId);
    // Calculate remaining after considering items not yet saved
    const usedInForm = medicineItems
      .filter(item => item.medicine_id === medicineId)
      .reduce((sum, item) => sum + item.quantity, 0);
    const pendingInNewItem = newMedicineItem.medicine_id === medicineId ? (newMedicineItem.quantity || 0) : 0;
    
    return Math.max(0, (medicine?.current_balance || 0) - usedInForm - pendingInNewItem + watchHealthy);
  };

  const onSubmit = async (data: DailyReportFormData) => {
    setIsLoading(true);
    try {
      // Group egg sale items by client
      const eggSaleInvoices = eggSaleItems.length > 0 
        ? [{
            client_id: eggSaleItems[0]?.client_id,
            items: eggSaleItems.map(item => ({
              egg_weight_id: item.egg_weight_id,
              unit_id: item.unit_id,
              quantity: item.quantity,
              price: item.price,
            })),
          }]
        : undefined;

      const result = await createIntegratedDailyReport({
        warehouse_id: warehouseId,
        report_date: data.report_date,
        report_time: data.report_time,
        production_eggs_healthy: data.production_eggs_healthy,
        production_eggs_deformed: data.production_eggs_deformed,
        eggs_sold: data.eggs_sold,
        eggs_gift: data.eggs_gift,
        previous_eggs_balance: data.previous_eggs_balance,
        carton_consumption: data.carton_consumption,
        chicks_before: data.chicks_before,
        chicks_dead: data.chicks_dead,
        feed_daily_kg: data.feed_daily_kg,
        feed_monthly_kg: data.feed_monthly_kg,
        feed_ratio: data.feed_ratio,
        production_droppings: data.production_droppings,
        notes: data.notes,
        eggSaleInvoices,
        droppingsSaleInvoice: droppingsSale.quantity && droppingsSale.quantity > 0 && droppingsSale.unit_id ? droppingsSale as DroppingsSaleInvoiceData : undefined,
        medicineConsumptionItems: medicineItems.length > 0 ? medicineItems : undefined,
        poultry_status_id: poultryStatus?.id || undefined,
      });

      if (result.success && result.data?.report) {
        // Upload attachments
        if (attachmentFiles.length > 0) {
          for (const uploadedFile of attachmentFiles) {
            const attachmentResult = await createDailyReportAttachment(
              result.data.report.id,
              uploadedFile.file
            );

            if (!attachmentResult.success) {
              toast.warning(`تم حفظ التقرير لكن فشل رفع الملف: ${uploadedFile.file.name}`);
            }
          }
        }

        toast.success(result.data.message || 'تم إنشاء التقرير اليومي بنجاح');
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

  // Get customer clients
  const customerClients = clients.filter(c => c.type === 'customer');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Report Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات التقرير الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Egg Production */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Egg className="h-5 w-5" />
            إنتاج البيض
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="production_eggs_healthy">بيض صحي</Label>
              <Input
                id="production_eggs_healthy"
                type="number"
                {...register('production_eggs_healthy', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="production_eggs_deformed">بيض مشوه</Label>
              <Input
                id="production_eggs_deformed"
                type="number"
                {...register('production_eggs_deformed', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>إجمالي الإنتاج</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {productionEggs.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="previous_eggs_balance_display">الرصيد السابق (تلقائي)</Label>
              <Input
                id="previous_eggs_balance_display"
                type="number"
                value={watch('previous_eggs_balance') || 0}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              {/* Hidden input to submit the value */}
              <input type="hidden" {...register('previous_eggs_balance', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">
                يُجلب تلقائياً من الرصيد الحالي لآخر تقرير
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eggs_sold_display">البيض المباع (تلقائي)</Label>
              <Input
                id="eggs_sold_display"
                type="number"
                value={totalEggsSold}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              {/* Hidden input to submit the value */}
              <input type="hidden" {...register('eggs_sold', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">
                يُحسب تلقائياً من مجموع كميات بنود مبيع البيض
              </p>
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
                {currentEggsBalance.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carton_consumption_display">استهلاك الكراتين (تلقائي)</Label>
            <Input
              id="carton_consumption_display"
              type="number"
              step="0.01"
              value={cartonConsumption}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
            {/* Hidden input to submit the value */}
            <input type="hidden" {...register('carton_consumption', { valueAsNumber: true })} />
            <p className="text-xs text-muted-foreground">
              يُحسب تلقائياً: (بيض صحي ÷ 100) + (بيض صحي ÷ 1000)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Poultry Status */}
      <Card>
        <CardHeader>
          <CardTitle>حالة القطيع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chicks_before_display">العدد قبل (تلقائي)</Label>
              <Input
                id="chicks_before_display"
                type="number"
                value={watchChicksBefore || 0}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              {/* Hidden input to submit the value */}
              <input type="hidden" {...register('chicks_before', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">
                يُحسب تلقائياً من القطيع أو التقرير السابق
              </p>
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
                {chicksAfter.toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label>نسبة الإنتاج</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {productionEggRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                يُحسب تلقائياً: (إجمالي الإنتاج × 30 ÷ عدد الدجاج قبل) × 100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed and Droppings */}
      <Card>
        <CardHeader>
          <CardTitle>العلف والسواد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="feed_monthly_kg_display">العلف الشهري (تلقائي - كجم)</Label>
              <Input
                id="feed_monthly_kg_display"
                type="number"
                step="0.01"
                value={watch('feed_monthly_kg') || 0}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              {/* Hidden input to submit the value */}
              <input type="hidden" {...register('feed_monthly_kg', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">
                يُحسب تلقائياً بجمع العلف اليومي لكل تقارير الشهر الحالي
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed_ratio_display">معدل استهلاك العلف (تلقائي - جرام/طائر)</Label>
              <Input
                id="feed_ratio_display"
                type="number"
                step="0.01"
                value={feedRatio}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              {/* Hidden input to submit the value */}
              <input type="hidden" {...register('feed_ratio', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">
                يُحسب تلقائياً: (العلف اليومي × 1000) ÷ عدد الدجاج بعد، مقرب لمنزلتين
              </p>
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
        </CardContent>
      </Card>

      {/* Egg Sale Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            فاتورة مبيع البيض
          </CardTitle>
          <CardDescription>
            أضف بنود مبيعات البيض (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>الزبون</Label>
              <Select
                value={newEggSaleItem.client_id || ''}
                onValueChange={(value) => setNewEggSaleItem({ ...newEggSaleItem, client_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الزبون" />
                </SelectTrigger>
                <SelectContent>
                  {customerClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>وزن البيض</Label>
              <Select
                value={newEggSaleItem.egg_weight_id || ''}
                onValueChange={(value) => setNewEggSaleItem({ ...newEggSaleItem, egg_weight_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوزن" />
                </SelectTrigger>
                <SelectContent>
                  {eggWeights.map((weight) => (
                    <SelectItem key={weight.id} value={weight.id}>
                      {weight.weight_range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select
                value={newEggSaleItem.unit_id || ''}
                onValueChange={(value) => setNewEggSaleItem({ ...newEggSaleItem, unit_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                value={newEggSaleItem.quantity || 0}
                onChange={(e) => setNewEggSaleItem({ ...newEggSaleItem, quantity: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>السعر (اختياري)</Label>
              <Input
                type="number"
                step="0.01"
                value={newEggSaleItem.price || 0}
                onChange={(e) => setNewEggSaleItem({ ...newEggSaleItem, price: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>المبلغ (اختياري)</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {((newEggSaleItem.quantity || 0) * (newEggSaleItem.price || 0)).toFixed(2)}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEggSaleItem}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة بند
          </Button>

          {eggSaleItems.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">البنود المضافة:</h4>
              {eggSaleItems.map((item, index) => {
                const weight = eggWeights.find(w => w.id === item.egg_weight_id);
                const unit = units.find(u => u.id === item.unit_id);
                const client = customerClients.find(c => c.id === item.client_id);
                return (
                  <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                    <div className="flex-1 grid grid-cols-6 gap-2 text-sm">
                      <span>{client?.name || 'بدون زبون'}</span>
                      <span>{weight?.weight_range}</span>
                      <span>{unit?.unit_name}</span>
                      <span>الكمية: {item.quantity}</span>
                      <span>السعر: {item.price}</span>
                      <span className="font-bold">المبلغ: {(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEggSaleItem(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Droppings Sale Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            فاتورة مبيع السواد
          </CardTitle>
          <CardDescription>
            معلومات مبيع السواد (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>الزبون</Label>
              <Select
                value={droppingsSale.client_id || ''}
                onValueChange={(value) => setDroppingsSale({ ...droppingsSale, client_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الزبون" />
                </SelectTrigger>
                <SelectContent>
                  {customerClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select
                value={droppingsSale.unit_id || ''}
                onValueChange={(value) => setDroppingsSale({ ...droppingsSale, unit_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                step="0.01"
                value={droppingsSale.quantity || 0}
                onChange={(e) => setDroppingsSale({ ...droppingsSale, quantity: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>السعر (اختياري)</Label>
              <Input
                type="number"
                step="0.01"
                value={droppingsSale.price || 0}
                onChange={(e) => setDroppingsSale({ ...droppingsSale, price: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>المبلغ (اختياري)</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {((droppingsSale.quantity || 0) * (droppingsSale.price || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medicine Consumption Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            فاتورة استهلاك الأدوية
          </CardTitle>
          <CardDescription>
            أضف بنود استهلاك الأدوية (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {poultryStatus && (
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm text-muted-foreground">القطيع</Label>
              <p className="text-lg font-semibold mt-1">{poultryStatus.batch_name}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>الدواء</Label>
              <Select
                value={newMedicineItem.medicine_id || ''}
                onValueChange={(value) => {
                  setNewMedicineItem({ ...newMedicineItem, medicine_id: value });
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدواء" />
                </SelectTrigger>
                <SelectContent>
                  {availableMedicines.map((med) => (
                    <SelectItem key={med.medicine_id} value={med.medicine_id}>
                      {med.medicines.name} (متاح: {getAvailableQuantity(med.medicine_id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select
                value={newMedicineItem.unit_id || ''}
                onValueChange={(value) => setNewMedicineItem({ ...newMedicineItem, unit_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                step="0.01"
                value={newMedicineItem.quantity || 0}
                onChange={(e) => setNewMedicineItem({ ...newMedicineItem, quantity: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>السعر (اختياري)</Label>
              <Input
                type="number"
                step="0.01"
                value={newMedicineItem.price || 0}
                onChange={(e) => setNewMedicineItem({ ...newMedicineItem, price: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>المبلغ (اختياري)</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-bold">
                {((newMedicineItem.quantity || 0) * (newMedicineItem.price || 0)).toFixed(2)}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMedicineItem}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة دواء
          </Button>

          {medicineItems.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">الأدوية المضافة:</h4>
              {medicineItems.map((item, index) => {
                const medicine = availableMedicines.find(m => m.medicine_id === item.medicine_id);
                const unit = units.find(u => u.id === item.unit_id);
                return (
                  <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <span>{medicine?.medicines.name}</span>
                      <span>الكمية: {item.quantity} {unit?.unit_name}</span>
                      <span>السعر: {item.price}</span>
                      <span className="font-bold">المبلغ: {(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedicineItem(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>ملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
            {...register('notes')}
            disabled={isLoading}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
          <CardDescription>
            قم بإرفاق الملفات ذات الصلة (صور، PDF، مستندات)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesSelected={setAttachmentFiles}
            maxFiles={5}
            maxSizeMB={10}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      {/* Submit Buttons */}
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
          حفظ التقرير والفواتير
        </Button>
      </div>
    </form>
  );
}
