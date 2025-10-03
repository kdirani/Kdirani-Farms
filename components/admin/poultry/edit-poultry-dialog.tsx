'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updatePoultryStatus, PoultryStatus } from '@/actions/poultry.actions';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const poultrySchema = z.object({
  batch_name: z.string().min(2, 'اسم الدفعة يجب أن يكون حرفين على الأقل'),
  opening_chicks: z.number().min(1, 'عدد الكتاكيت الافتتاحي يجب أن يكون 1 على الأقل'),
  dead_chicks: z.number().min(0, 'عدد الكتاكيت النافقة لا يمكن أن يكون سالباً'),
});

type PoultryFormData = z.infer<typeof poultrySchema>;

interface EditPoultryDialogProps {
  poultry: PoultryStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPoultryDialog({ poultry, open, onOpenChange }: EditPoultryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PoultryFormData>({
    resolver: zodResolver(poultrySchema),
  });

  const openingChicks = watch('opening_chicks');
  const deadChicks = watch('dead_chicks');
  const remainingChicks = openingChicks - deadChicks;

  useEffect(() => {
    if (poultry && open) {
      reset({
        batch_name: poultry.batch_name || '',
        opening_chicks: poultry.opening_chicks,
        dead_chicks: poultry.dead_chicks,
      });
    }
  }, [poultry, open, reset]);

  const onSubmit = async (data: PoultryFormData) => {
    setIsLoading(true);
    try {
      const result = await updatePoultryStatus({
        id: poultry.id,
        batch_name: data.batch_name,
        opening_chicks: data.opening_chicks,
        dead_chicks: data.dead_chicks,
      });
      
      if (result.success) {
        toast.success('تم تحديث دفعة الدواجن بنجاح');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في تحديث دفعة الدواجن');
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
          <DialogTitle>تعديل دفعة الدواجن</DialogTitle>
          <DialogDescription>
            تحديث معلومات الدفعة وأعداد الكتاكيت.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {poultry.farm && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">المزرعة:</span> {poultry.farm.name}
                {poultry.farm.location && <span className="text-muted-foreground"> ({poultry.farm.location})</span>}
              </div>
            </div>
          )}

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
            <Label htmlFor="opening_chicks">عدد الكتاكيت الافتتاحي *</Label>
            <Input
              id="opening_chicks"
              type="number"
              min="1"
              placeholder="مثال: 1000"
              {...register('opening_chicks', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.opening_chicks && (
              <p className="text-sm text-destructive">{errors.opening_chicks.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dead_chicks">عدد الكتاكيت النافقة *</Label>
            <Input
              id="dead_chicks"
              type="number"
              min="0"
              placeholder="مثال: 50"
              {...register('dead_chicks', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.dead_chicks && (
              <p className="text-sm text-destructive">{errors.dead_chicks.message}</p>
            )}
          </div>

          {!isNaN(remainingChicks) && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">الكتاكيت المتبقية:</span>
                <span className="text-lg font-bold">
                  {remainingChicks >= 0 ? remainingChicks.toLocaleString() : (
                    <span className="text-destructive">غير صالح (سالب)</span>
                  )}
                </span>
              </div>
              {remainingChicks >= 0 && openingChicks > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  نسبة النفوق: {((deadChicks / openingChicks) * 100).toFixed(2)}%
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || remainingChicks < 0}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
