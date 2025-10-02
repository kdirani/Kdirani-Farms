'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoiceItem } from '@/actions/invoice-item.actions';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { getEggWeights } from '@/actions/egg-weight.actions';
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
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const itemSchema = z.object({
  material_name_id: z.string().optional(),
  unit_id: z.string().min(1, 'Unit is required'),
  egg_weight_id: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  weight: z.number().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface AddInvoiceItemDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInvoiceItemDialog({ invoiceId, open, onOpenChange }: AddInvoiceItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Array<{ id: string; material_name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [eggWeights, setEggWeights] = useState<Array<{ id: string; weight_range: string }>>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      quantity: 1,
      price: 0,
    },
  });

  const materialId = watch('material_name_id');
  const unitId = watch('unit_id');
  const eggWeightId = watch('egg_weight_id');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const [materialsResult, unitsResult, eggWeightsResult] = await Promise.all([
      getMaterialNames(),
      getMeasurementUnits(),
      getEggWeights(),
    ]);

    if (materialsResult.success && materialsResult.data) {
      setMaterials(materialsResult.data);
    }
    if (unitsResult.success && unitsResult.data) {
      setUnits(unitsResult.data);
    }
    if (eggWeightsResult.success && eggWeightsResult.data) {
      setEggWeights(eggWeightsResult.data);
    }
  };

  const onSubmit = async (data: ItemFormData) => {
    setIsLoading(true);
    try {
      const result = await createInvoiceItem({
        invoice_id: invoiceId,
        material_name_id: data.material_name_id,
        unit_id: data.unit_id,
        egg_weight_id: data.egg_weight_id,
        quantity: data.quantity,
        weight: data.weight,
        price: data.price,
      });
      
      if (result.success) {
        toast.success('Item added successfully');
        reset();
        onOpenChange(false);

        // Delay page reload to allow user to see success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to add item');
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
          <DialogTitle>Add Invoice Item</DialogTitle>
          <DialogDescription>
            Add a new material or product to this invoice
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material_name_id">Material/Product</Label>
            <Combobox
              options={[
                { value: 'none', label: 'No material' },
                ...materials.map((material) => ({
                  value: material.id,
                  label: material.material_name,
                }))
              ]}
              value={materialId || 'none'}
              onValueChange={(value) => setValue('material_name_id', value === 'none' ? undefined : value)}
              placeholder="Select material"
              searchPlaceholder="Search materials..."
              emptyText="No materials found"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="egg_weight_id">Egg Weight (Optional)</Label>
            <Combobox
              options={[
                { value: 'none', label: 'No egg weight' },
                ...eggWeights.map((weight) => ({
                  value: weight.id,
                  label: weight.weight_range,
                }))
              ]}
              value={eggWeightId || 'none'}
              onValueChange={(value) => setValue('egg_weight_id', value === 'none' ? undefined : value)}
              placeholder="Select egg weight"
              searchPlaceholder="Search egg weights..."
              emptyText="No egg weights found"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                {...register('weight', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit *</Label>
              <Combobox
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.unit_name,
                }))}
                value={unitId}
                onValueChange={(value) => setValue('unit_id', value)}
                placeholder="Select unit"
                searchPlaceholder="Search units..."
                emptyText="No units found"
                disabled={isLoading}
              />
              {errors.unit_id && (
                <p className="text-sm text-destructive">{errors.unit_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
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
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
