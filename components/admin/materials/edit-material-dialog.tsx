'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateMaterial, Material } from '@/actions/material.actions';
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

const materialSchema = z.object({
  opening_balance: z.number().min(0, 'لا يمكن أن يكون سالباً'),
  purchases: z.number().min(0, 'لا يمكن أن يكون سالباً'),
  sales: z.number().min(0, 'لا يمكن أن يكون سالباً'),
  consumption: z.number().min(0, 'لا يمكن أن يكون سالباً'),
  manufacturing: z.number().min(0, 'لا يمكن أن يكون سالباً'),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface EditMaterialDialogProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMaterialDialog({ material, open, onOpenChange }: EditMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
  });

  const formValues = watch();
  const calculatedBalance = (formValues.opening_balance || 0) + (formValues.purchases || 0) + (formValues.manufacturing || 0) - (formValues.sales || 0) - (formValues.consumption || 0);

  useEffect(() => {
    if (material && open) {
      reset({
        opening_balance: material.opening_balance,
        purchases: material.purchases,
        sales: material.sales,
        consumption: material.consumption,
        manufacturing: material.manufacturing,
      });
    }
  }, [material, open, reset]);

  const onSubmit = async (data: MaterialFormData) => {
    setIsLoading(true);
    try {
      const result = await updateMaterial({
        id: material.id,
        ...data,
      });
      
      if (result.success) {
        toast.success('تم تحديث المادة بنجاح');
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'فشل في تحديث المادة');
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
          <DialogTitle>تعديل المادة</DialogTitle>
          <DialogDescription>
            تحديث معاملات مخزون المادة
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-muted p-3 rounded-lg space-y-1">
            <div className="text-sm"><span className="font-medium">المادة:</span> {material.material_name}</div>
            <div className="text-sm"><span className="font-medium">المستودع:</span> {material.warehouse?.name}</div>
            <div className="text-sm"><span className="font-medium">الوحدة:</span> {material.unit_name}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_balance">الرصيد الافتتاحي</Label>
            <Input
              id="opening_balance"
              type="number"
              min="0"
              step="0.01"
              {...register('opening_balance', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.opening_balance && (
              <p className="text-sm text-destructive">{errors.opening_balance.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchases">المشتريات</Label>
              <Input
                id="purchases"
                type="number"
                min="0"
                step="0.01"
                {...register('purchases', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.purchases && (
                <p className="text-sm text-destructive">{errors.purchases.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturing">التصنيع</Label>
              <Input
                id="manufacturing"
                type="number"
                min="0"
                step="0.01"
                {...register('manufacturing', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.manufacturing && (
                <p className="text-sm text-destructive">{errors.manufacturing.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sales">المبيعات</Label>
              <Input
                id="sales"
                type="number"
                min="0"
                step="0.01"
                {...register('sales', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.sales && (
                <p className="text-sm text-destructive">{errors.sales.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption">الاستهلاك</Label>
              <Input
                id="consumption"
                type="number"
                min="0"
                step="0.01"
                {...register('consumption', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.consumption && (
                <p className="text-sm text-destructive">{errors.consumption.message}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">الرصيد الحالي:</span>
              <span className="text-lg font-bold">{calculatedBalance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              = الرصيد الافتتاحي + المشتريات + التصنيع - المبيعات - الاستهلاك
            </p>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
