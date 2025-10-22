'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { updateManufacturingInvoice } from '@/actions/manufacturing.actions';
import { getWarehousesForMaterials, getMaterialInventory } from '@/actions/material.actions';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const formSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  manufacturing_date: z.date({ required_error: 'تاريخ التصنيع مطلوب' }),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  blend_name: z.string().optional(),
  material_name_id: z.string().min(1, 'المادة الناتجة مطلوبة'),
  unit_id: z.string().min(1, 'الوحدة مطلوبة'),
  quantity: z.number().min(1, 'الكمية مطلوبة'),
  notes: z.string().optional(),
});

interface ManufacturingInvoice {
  id: string;
  invoice_number: string;
  manufacturing_date: string;
  warehouse_id: string | null;
  blend_name?: string | null;
  material_name_id?: string | null;
  unit_id?: string | null;
  quantity: number;
  notes?: string | null;
}

interface EditManufacturingDialogProps {
  invoice: ManufacturingInvoice;
  warehouses?: { id: string; name: string; farm_name?: string }[];
  materials?: { id: string; name: string }[];
  units?: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}

export function EditManufacturingDialog({
  invoice,
  warehouses,
  materials,
  units,
  open,
  onClose,
}: EditManufacturingDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [warehousesState, setWarehousesState] = useState<Array<{ id: string; name: string; farm_name?: string }>>(warehouses && warehouses.length>0 ? (warehouses as any) : []);
  const [materialsState, setMaterialsState] = useState<Array<{ id: string; name: string }>>(materials && materials.length>0 ? (materials as any) : []);
  const [unitsState, setUnitsState] = useState<Array<{ id: string; name: string }>>(units && units.length>0 ? (units as any) : []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: invoice.invoice_number,
      manufacturing_date: new Date(invoice.manufacturing_date),
      warehouse_id: invoice.warehouse_id ?? '',
      blend_name: invoice.blend_name || '',
      material_name_id: invoice.material_name_id ?? '',
      unit_id: invoice.unit_id ?? '',
      quantity: invoice.quantity,
      notes: invoice.notes || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsPending(true);
      const result = await updateManufacturingInvoice({
        id: invoice.id,
        invoice_number: values.invoice_number,
        manufacturing_date: values.manufacturing_date.toISOString(),
        warehouse_id: values.warehouse_id,
        blend_name: values.blend_name || null,
        material_name_id: values.material_name_id,
        unit_id: values.unit_id,
        quantity: values.quantity,
        notes: values.notes || null,
      });

      if (!result.success) {
        toast.error(result.error || 'فشل في تحديث فاتورة التصنيع');
        return;
      }

      toast.success('تم تحديث فاتورة التصنيع');
      onClose();
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث فاتورة التصنيع');
    } finally {
      setIsPending(false);
    }
  };

  const loadData = async () => {
    try {
      const [warehousesResult, materialsResult, unitsResult] = await Promise.all([
        getWarehousesForMaterials(),
        getMaterialNames(),
        getMeasurementUnits(),
      ]);

      if (warehousesResult.success && warehousesResult.data) {
        setWarehousesState(warehousesResult.data as any);
      }
      if (materialsResult.success && materialsResult.data) {
        // map to {id, name}
        setMaterialsState((materialsResult.data as any).map((m: any) => ({ id: m.id, name: m.material_name || m.name })) );
      }
      if (unitsResult.success && unitsResult.data) {
        setUnitsState((unitsResult.data as any).map((u: any) => ({ id: u.id, name: u.unit_name || u.name })) );
      }
    } catch (error) {
      // ignore
    }
  };

  // load lists when dialog opens
  useEffect(() => {
    if (open) loadData();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تعديل فاتورة التصنيع</DialogTitle>
          <DialogDescription>تعديل تفاصيل فاتورة التصنيع</DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={(form.handleSubmit as any)(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الفاتورة</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ التصنيع</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-right font-normal"
                            disabled={isPending}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'yyyy/MM/dd')
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={isPending} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouse_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستودع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستودع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(warehousesState || []).map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blend_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الخلطة</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="material_name_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المادة الناتجة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(materialsState || []).map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوحدة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوحدة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(unitsState || []).map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكمية</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>ملاحظات</FormLabel>
                <FormControl>
                  <Textarea {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>إلغاء</Button>
              <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
