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
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  material_name_id: z.string().min(1, 'Material name is required'),
  unit_id: z.string().min(1, 'Unit is required'),
  opening_balance: z.number().min(0, 'Opening balance cannot be negative'),
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
    },
  });

  const warehouseId = watch('warehouse_id');
  const materialNameId = watch('material_name_id');
  const unitId = watch('unit_id');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const [warehousesResult, materialNamesResult, unitsResult] = await Promise.all([
      getWarehousesForMaterials(),
      getMaterialNames(),
      getMeasurementUnits(),
    ]);

    if (warehousesResult.success && warehousesResult.data) {
      setWarehouses(warehousesResult.data);
    }
    if (materialNamesResult.success && materialNamesResult.data) {
      setMaterialNames(materialNamesResult.data);
    }
    if (unitsResult.success && unitsResult.data) {
      setUnits(unitsResult.data);
    }
  };

  const onSubmit = async (data: MaterialFormData) => {
    setIsLoading(true);
    try {
      const result = await createMaterial(data);
      
      if (result.success) {
        toast.success('Material created successfully');
        reset();
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to create material');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Add a new material to warehouse inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse_id">Warehouse *</Label>
            <Select
              value={warehouseId}
              onValueChange={(value) => setValue('warehouse_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
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

          <div className="space-y-2">
            <Label htmlFor="material_name_id">Material Name *</Label>
            <Select
              value={materialNameId}
              onValueChange={(value) => setValue('material_name_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
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

          <div className="space-y-2">
            <Label htmlFor="unit_id">Unit *</Label>
            <Select
              value={unitId}
              onValueChange={(value) => setValue('unit_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
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
            <Label htmlFor="opening_balance">Opening Balance *</Label>
            <Input
              id="opening_balance"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...register('opening_balance', { valueAsNumber: true })}
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
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Material
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
