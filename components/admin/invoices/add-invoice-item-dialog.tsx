'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoiceItem } from '@/actions/invoice-item.actions';
import { getInvoiceById } from '@/actions/invoice.actions';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { getEggWeights } from '@/actions/egg-weight.actions';
import { getMaterialInventory } from '@/actions/material.actions';
import { getMedicines } from '@/actions/medicine.actions';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, PackageCheck, Pill } from 'lucide-react';

const itemSchema = z.object({
  material_name_id: z.string().optional(),
  medicine_id: z.string().optional(),
  unit_id: z.string().min(1, 'الوحدة مطلوبة'),
  egg_weight_id: z.string().optional(),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من 0'),
  weight: z.number().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
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
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string; day_of_age: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [eggWeights, setEggWeights] = useState<Array<{ id: string; weight_range: string }>>([]);
  const [invoice, setInvoice] = useState<{ invoice_type: 'buy' | 'sell'; warehouse_id: string | null } | null>(null);
  const [inventory, setInventory] = useState<{ current_balance: number; unit_name: string } | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [itemType, setItemType] = useState<'material' | 'medicine'>('material');
  
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
    const [materialsResult, medicinesResult, unitsResult, eggWeightsResult] = await Promise.all([
      getMaterialNames(),
      getMedicines(),
      getMeasurementUnits(),
      getEggWeights(),
    ]);

    if (materialsResult.success && materialsResult.data) {
      setMaterials(materialsResult.data);
    }
    if (medicinesResult.success && medicinesResult.data) {
      setMedicines(medicinesResult.data);
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
    // Validate that either material or medicine is selected
    if (!data.material_name_id && !data.medicine_id) {
      toast.error('يجب اختيار مادة أو دواء');
      return;
    }

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
        medicine_id: data.medicine_id,
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
          <Tabs value={itemType} onValueChange={(value) => setItemType(value as 'material' | 'medicine')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="material">مواد</TabsTrigger>
              <TabsTrigger value="medicine">
                <Pill className="h-4 w-4 ml-2" />
                أدوية
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="material" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="material_name_id">المادة/المنتج</Label>
                <Combobox
                  options={[
                    { value: 'none', label: 'بدون مادة' },
                    ...materials.map((material) => ({
                      value: material.id,
                      label: material.material_name,
                    })),
                  ]}
                  value={materialId || 'none'}
                  onValueChange={(value) => {
                    setValue('material_name_id', value === 'none' ? undefined : value);
                    setValue('medicine_id', undefined);
                  }}
                  placeholder="اختر المادة"
                  searchPlaceholder="البحث عن المواد..."
                  emptyText="لا توجد مواد"
                  disabled={isLoading}
                />
                
                {invoice?.invoice_type === 'sell' && materialId && materialId !== 'none' && (
                  <div className="bg-muted p-3 rounded-md">
                    {loadingInventory ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        <span className="text-sm">جاري تحميل معلومات المخزون...</span>
                      </div>
                    ) : inventory ? (
                      <div className="flex items-center gap-2">
                        <PackageCheck className={`h-5 w-5 ${hasInsufficientStock ? 'text-destructive' : 'text-primary'}`} />
                        <span className="text-sm">
                          المخزون المتاح: <strong>{inventory.current_balance}</strong> {inventory.unit_name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">لا توجد معلومات مخزون متاحة</span>
                      </div>
                    )}
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
                    })),
                  ]}
                  value={eggWeightId || 'none'}
                  onValueChange={(value) => setValue('egg_weight_id', value === 'none' ? undefined : value)}
                  placeholder="اختر وزن البيض"
                  searchPlaceholder="البحث عن أوزان البيض..."
                  emptyText="لا توجد أوزان بيض"
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="medicine" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicine_id">الدواء</Label>
                <Combobox
                  options={[
                    { value: 'none', label: 'اختر دواء' },
                    ...medicines.map((medicine) => ({
                      value: medicine.id,
                      label: `${medicine.name} (${medicine.day_of_age})`,
                    })),
                  ]}
                  value={watch('medicine_id') || 'none'}
                  onValueChange={(value) => {
                    setValue('medicine_id', value === 'none' ? undefined : value);
                    setValue('material_name_id', undefined);
                    setValue('egg_weight_id', undefined);
                  }}
                  placeholder="اختر الدواء"
                  searchPlaceholder="البحث عن الأدوية..."
                  emptyText="لا توجد أدوية"
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
          </Tabs>

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
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إضافة العنصر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
