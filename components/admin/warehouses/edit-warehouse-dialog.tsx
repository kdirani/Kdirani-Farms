'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateWarehouse, getFarmsWithoutWarehouses, Warehouse } from '@/actions/warehouse.actions';
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

const warehouseSchema = z.object({
  name: z.string().min(2, 'اسم المستودع يجب أن يكون حرفين على الأقل'),
  farm_id: z.string().min(1, 'المزرعة مطلوبة'),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface EditWarehouseDialogProps {
  warehouse: Warehouse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWarehouseDialog({ warehouse, open, onOpenChange }: EditWarehouseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableFarms, setAvailableFarms] = useState<Array<{ id: string; name: string; location: string | null; is_active: boolean }>>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  const farmId = watch('farm_id');

  useEffect(() => {
    if (warehouse && open) {
      reset({
        name: warehouse.name,
        farm_id: warehouse.farm_id || '',
      });
      loadAvailableFarms();
    }
  }, [warehouse, open, reset]);

  const loadAvailableFarms = async () => {
    setLoadingFarms(true);
    const result = await getFarmsWithoutWarehouses();
    if (result.success && result.data) {
      // Include current farm if warehouse is assigned
      let farms = result.data;
      if (warehouse.farm_id && warehouse.farm) {
        farms = [
          { id: warehouse.farm_id, name: warehouse.farm.name, location: warehouse.farm.location, is_active: true },
          ...farms
        ];
      }
      setAvailableFarms(farms);
    }
    setLoadingFarms(false);
  };

  const onSubmit = async (data: WarehouseFormData) => {
    setIsLoading(true);
    try {
      const result = await updateWarehouse({
        id: warehouse.id,
        name: data.name,
        farm_id: data.farm_id,
      });
      
      if (result.success) {
        toast.success('تم تحديث المستودع بنجاح');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في تحديث المستودع');
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
          <DialogTitle>تعديل المستودع</DialogTitle>
          <DialogDescription>
            تحديث معلومات المستودع والتعيين.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المستودع *</Label>
            <Input
              id="name"
              placeholder="مثال: المخزن الرئيسي"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
                    {farm.name} {farm.location ? `- ${farm.location}` : ''} {!farm.is_active ? ' [غير نشطة]' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.farm_id && (
              <p className="text-sm text-destructive">{errors.farm_id.message}</p>
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
