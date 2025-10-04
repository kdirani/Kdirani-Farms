'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createMaterial, getWarehousesForMaterials } from '@/actions/material.actions';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
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

const materialSchema = z.object({
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  item_type: z.enum(['material', 'medicine']),
  material_name_id: z.string().optional(),
  medicine_id: z.string().optional(),
  unit_id: z.string().min(1, 'الوحدة مطلوبة'),
  opening_balance: z.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً'),
}).refine((data) => {
  if (data.item_type === 'material') {
    return !!data.material_name_id;
  } else {
    return !!data.medicine_id;
  }
}, {
  message: 'يجب اختيار مادة أو دواء',
  path: ['material_name_id'],
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMaterialDialog({ open, onOpenChange }: CreateMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; farm_name: string }>>([]);
  const [materialNames, setMaterialNames] = useState<Array<{ id: string; material_name: string }>>([]);
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      opening_balance: 0,
      item_type: 'material',
    },
  });

  const warehouseId = watch('warehouse_id');
  const itemType = watch('item_type');
  const materialNameId = watch('material_name_id');
  const medicineId = watch('medicine_id');
  const unitId = watch('unit_id');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const { getMedicines } = await import('@/actions/medicine.actions');
    const [warehousesResult, materialNamesResult, medicinesResult, unitsResult] = await Promise.all([
      getWarehousesForMaterials(),
      getMaterialNames(),
      getMedicines(),
      getMeasurementUnits(),
    ]);

    if (warehousesResult.success && warehousesResult.data) {
      setWarehouses(warehousesResult.data);
    }
    if (materialNamesResult.success && materialNamesResult.data) {
      setMaterialNames(materialNamesResult.data);
    }
    if (medicinesResult.success && medicinesResult.data) {
      setMedicines(medicinesResult.data);
    }
    if (unitsResult.success && unitsResult.data) {
      setUnits(unitsResult.data);
    }
  };

  const onSubmit = async (data: MaterialFormData) => {
    setIsLoading(true);
    try {
      const input = {
        warehouse_id: data.warehouse_id,
        material_name_id: data.item_type === 'material' ? data.material_name_id : undefined,
        medicine_id: data.item_type === 'medicine' ? data.medicine_id : undefined,
        unit_id: data.unit_id,
        opening_balance: data.opening_balance,
      };
      
      const result = await createMaterial(input);
      
      if (result.success) {
        toast.success(data.item_type === 'material' ? 'تم إنشاء المادة بنجاح' : 'تم إنشاء الدواء بنجاح');
        reset();
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'فشل في الإنشاء');
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
          <DialogTitle>إضافة إلى المخزون</DialogTitle>
          <DialogDescription>
            إضافة مادة غذائية أو دواء إلى مخزون المستودع
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>نوع الصنف *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="material"
                  checked={itemType === 'material'}
                  onChange={(e) => {
                    setValue('item_type', 'material');
                    setValue('medicine_id', undefined);
                  }}
                  disabled={isLoading}
                  className="rounded-full"
                />
                <span>مادة غذائية</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="medicine"
                  checked={itemType === 'medicine'}
                  onChange={(e) => {
                    setValue('item_type', 'medicine');
                    setValue('material_name_id', undefined);
                  }}
                  disabled={isLoading}
                  className="rounded-full"
                />
                <span>دواء</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse_id">المستودع *</Label>
            <Select
              value={warehouseId}
              onValueChange={(value) => setValue('warehouse_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المستودع" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.farm_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse_id && (
              <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>
            )}
          </div>

          {itemType === 'material' ? (
            <div className="space-y-2">
              <Label htmlFor="material_name_id">اسم المادة *</Label>
              <Select
                value={materialNameId}
                onValueChange={(value) => setValue('material_name_id', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {materialNames.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.material_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.material_name_id && (
                <p className="text-sm text-destructive">{errors.material_name_id.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="medicine_id">اسم الدواء *</Label>
              <Select
                value={medicineId}
                onValueChange={(value) => setValue('medicine_id', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدواء" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      💊 {medicine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.medicine_id && (
                <p className="text-sm text-destructive">{errors.medicine_id.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="unit_id">الوحدة *</Label>
            <Select
              value={unitId}
              onValueChange={(value) => setValue('unit_id', value)}
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
            {errors.unit_id && (
              <p className="text-sm text-destructive">{errors.unit_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_balance">الرصيد الافتتاحي *</Label>
            <Input
              id="opening_balance"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*\.?[0-9]*"
              placeholder="0.00"
              {...register('opening_balance', { 
                setValueAs: (value) => {
                  const parsed = parseFloat(value);
                  return isNaN(parsed) ? 0 : parsed;
                }
              })}
              disabled={isLoading}
            />
            {errors.opening_balance && (
              <p className="text-sm text-destructive">{errors.opening_balance.message}</p>
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
              {itemType === 'material' ? 'إنشاء مادة' : 'إنشاء دواء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
