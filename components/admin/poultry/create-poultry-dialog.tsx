'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPoultryStatus, getAvailableFarmsForPoultry } from '@/actions/poultry.actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const poultrySchema = z.object({
  batch_name: z.string().min(2, 'اسم الدفعة يجب أن يكون حرفين على الأقل'),
  farm_id: z.string().min(1, 'المزرعة مطلوبة'),
  opening_chicks: z.number().min(0, 'عدد الكتاكيت الافتتاحي لا يمكن أن يكون سالباً'),
  chick_birth_date: z.string().optional(),
});

type PoultryFormData = z.infer<typeof poultrySchema>;

interface CreatePoultryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePoultryDialog({ open, onOpenChange }: CreatePoultryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableFarms, setAvailableFarms] = useState<Array<{ id: string; name: string; location: string | null }>>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PoultryFormData>({
    resolver: zodResolver(poultrySchema),
    defaultValues: {
    opening_chicks: 0,
  },
  });

  const farmId = watch('farm_id');

  useEffect(() => {
    if (open) {
      loadAvailableFarms();
    }
  }, [open]);

  const loadAvailableFarms = async () => {
    setLoadingFarms(true);
    const result = await getAvailableFarmsForPoultry();
    if (result.success && result.data) {
      setAvailableFarms(result.data);
    }
    setLoadingFarms(false);
  };

  const onSubmit = async (data: PoultryFormData) => {
    setIsLoading(true);
    try {
      const result = await createPoultryStatus({
        batch_name: data.batch_name,
        farm_id: data.farm_id,
        opening_chicks: data.opening_chicks,
        chick_birth_date: data.chick_birth_date,
      });
      
      if (result.success) {
        toast.success('تم إنشاء دفعة الدواجن بنجاح');
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في إنشاء دفعة الدواجن');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إنشاء دفعة دواجن جديدة</DialogTitle>
          <DialogDescription>
            إضافة دفعة دواجن جديدة وتعيينها لمزرعة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch_name">اسم الدفعة *</Label>
            <Input
              id="batch_name"
              placeholder="مثال: دفعة 2024-01"
              {...register('batch_name')}
              disabled={isLoading}
            />
            {errors.batch_name && (
              <p className="text-sm text-destructive">{errors.batch_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm_id">تعيين إلى مزرعة *</Label>
            <Select
              value={farmId}
              onValueChange={(value) => setValue('farm_id', value)}
              disabled={isLoading || loadingFarms}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingFarms ? 'جاري تحميل المزارع...' : 'اختر مزرعة'} />
              </SelectTrigger>
              <SelectContent>
                {availableFarms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name} {farm.location ? `- ${farm.location}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.farm_id && (
              <p className="text-sm text-destructive">{errors.farm_id.message}</p>
            )}
            {availableFarms.length === 0 && !loadingFarms && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ جميع المزارع لديها قطيع بالفعل. كل مزرعة يمكن أن يكون لها قطيع واحد فقط.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_chicks">عدد الدجاج الافتتاحي *</Label>
            <Input
              id="opening_chicks"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="مثال: 0"
              {...register('opening_chicks', { 
                setValueAs: (value) => {
                  if (value === '' || isNaN(parseInt(value, 10))) {
                    return 0;
                  }
                  return parseInt(value, 10);
                }
              })}
              disabled={isLoading}
            />
            {errors.opening_chicks && (
              <p className="text-sm text-destructive">{errors.opening_chicks.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              العدد الأولي للدجاج في هذه الدفعة
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chick_birth_date">تاريخ ميلاد الفراخ</Label>
            <Input
              id="chick_birth_date"
              type="date"
              {...register('chick_birth_date')}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              🔔 عند إضافة تاريخ الميلاد، سيتم إنشاء التنبيهات الدوائية تلقائياً
            </p>
            {errors.chick_birth_date && (
              <p className="text-sm text-destructive">{errors.chick_birth_date.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || availableFarms.length === 0}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء دفعة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
