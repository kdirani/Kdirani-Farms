'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoiceItem } from '@/actions/invoice-item.actions';
import { getInvoiceById } from '@/actions/invoice.actions';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { getEggWeights } from '@/actions/egg-weight.actions';
import { getMaterialInventory } from '@/actions/material.actions';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, PackageCheck } from 'lucide-react';

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
  const [invoice, setInvoice] = useState<{ invoice_type: 'buy' | 'sell'; warehouse_id: string | null } | null>(null);
  const [inventory, setInventory] = useState<{ current_balance: number; unit_name: string } | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  
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
  const quantity = watch('quantity');

  useEffect(() => {
    if (open) {
      loadData();
      loadInvoiceData();
    }
  }, [open]);

  // Load inventory when material changes
  useEffect(() => {
    if (materialId && invoice?.warehouse_id && materialId !== 'none') {
      loadInventory(invoice.warehouse_id, materialId);
    } else {
      setInventory(null);
    }
  }, [materialId, invoice]);

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

  const loadInvoiceData = async () => {
    const result = await getInvoiceById(invoiceId);
    if (result.success && result.data) {
      setInvoice({
        invoice_type: result.data.invoice_type,
        warehouse_id: result.data.warehouse_id,
      });
    }
  };

  const loadInventory = async (warehouseId: string, materialNameId: string) => {
    setLoadingInventory(true);
    const result = await getMaterialInventory(warehouseId, materialNameId);
    if (result.success && result.data) {
      setInventory(result.data);
    }
    setLoadingInventory(false);
  };

  const onSubmit = async (data: ItemFormData) => {
    // Validate inventory for sell invoices
    if (invoice?.invoice_type === 'sell' && data.material_name_id && inventory) {
      if (inventory.current_balance <= 0) {
        toast.error('لا يوجد مخزون متاح لهذه المادة');
        return;
      }
      if (data.quantity > inventory.current_balance) {
        toast.error(`المخزون غير كافي. المتاح: ${inventory.current_balance} ${inventory.unit_name}`);
        return;
      }
    }

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
        toast.success('تم إضافة العنصر بنجاح');
        reset();
        onOpenChange(false);

        // Delay page reload to allow user to see success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || 'فشل في إضافة العنصر');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const hasInsufficientStock = !!(invoice?.invoice_type === 'sell' && 
    materialId && 
    materialId !== 'none' && 
    inventory && 
    (inventory.current_balance <= 0 || (quantity && quantity > inventory.current_balance)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة عنصر للفاتورة</DialogTitle>
          <DialogDescription>
            إضافة مادة أو منتج جديد لهذه الفاتورة
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material_name_id">المادة/المنتج</Label>
            <Combobox
              options={[
                { value: 'none', label: 'بدون مادة' },
                ...materials.map((material) => ({
                  value: material.id,
                  label: material.material_name,
                }))
              ]}
              value={materialId || 'none'}
              onValueChange={(value) => setValue('material_name_id', value === 'none' ? undefined : value)}
              placeholder="اختر المادة"
              searchPlaceholder="ابحث عن المواد..."
              emptyText="لم يتم العثور على مواد"
              disabled={isLoading}
            />
            
            {/* Show inventory for sell invoices */}
            {invoice?.invoice_type === 'sell' && materialId && materialId !== 'none' && (
              <div className="mt-2">
                {loadingInventory ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري تحميل المخزون...</span>
                  </div>
                ) : inventory ? (
                  <Alert variant={inventory.current_balance > 0 ? "default" : "destructive"}>
                    <PackageCheck className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>المخزون المتاح:</span>
                      <span className="font-bold">
                        {inventory.current_balance} {inventory.unit_name}
                      </span>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="egg_weight_id">وزن البيض (اختياري)</Label>
            <Combobox
              options={[
                { value: 'none', label: 'بدون وزن بيض' },
                ...eggWeights.map((weight) => ({
                  value: weight.id,
                  label: weight.weight_range,
                }))
              ]}
              value={eggWeightId || 'none'}
              onValueChange={(value) => setValue('egg_weight_id', value === 'none' ? undefined : value)}
              placeholder="اختر وزن البيض"
              searchPlaceholder="ابحث عن أوزان البيض..."
              emptyText="لم يتم العثور على أوزان بيض"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية *</Label>
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
              {hasInsufficientStock && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    الكمية المطلوبة أكبر من المخزون المتاح
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">الوزن</Label>
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
              <Label htmlFor="unit_id">الوحدة *</Label>
              <Combobox
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.unit_name,
                }))}
                value={unitId}
                onValueChange={(value) => setValue('unit_id', value)}
                placeholder="اختر الوحدة"
                searchPlaceholder="ابحث عن الوحدات..."
                emptyText="لم يتم العثور على وحدات"
                disabled={isLoading}
              />
              {errors.unit_id && (
                <p className="text-sm text-destructive">{errors.unit_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">السعر *</Label>
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
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || hasInsufficientStock}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إضافة العنصر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
