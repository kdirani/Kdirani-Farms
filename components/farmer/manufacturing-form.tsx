'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createManufacturingInvoice } from '@/actions/manufacturing.actions';
import { createManufacturingItem } from '@/actions/manufacturing-item.actions';
import { createManufacturingExpense } from '@/actions/manufacturing-expense.actions';
import { createManufacturingAttachment } from '@/actions/manufacturing-attachment.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const manufacturingSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  blend_name: z.string().optional(),
  material_name_id: z.string().min(1, 'المادة الناتجة مطلوبة'),
  unit_id: z.string().min(1, 'الوحدة مطلوبة'),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
  manufacturing_date: z.string().min(1, 'تاريخ التصنيع مطلوب'),
  notes: z.string().optional(),
  inputItems: z.array(z.object({
    material_name_id: z.string().min(1, 'المادة مطلوبة'),
    unit_id: z.string().min(1, 'الوحدة مطلوبة'),
    quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
    blend_count: z.number().min(1, 'عدد الخلطات مطلوب'),
    weight: z.number().optional(),
  })).optional(),
  expenses: z.array(z.object({
    expense_type_id: z.string().min(1, 'نوع المصروف مطلوب'),
    amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
    account_name: z.string().optional(),
  })).optional(),
});

type ManufacturingFormData = z.infer<typeof manufacturingSchema>;

interface ManufacturingFormProps {
  warehouseId: string;
  warehouseName: string;
  farmId: string;
  materialsNames: Array<{ id: string; material_name: string }>;
  units: Array<{ id: string; unit_name: string }>;
  expenseTypes: Array<{ id: string; name: string }>;
}

export function ManufacturingForm({
  warehouseId,
  warehouseName,
  farmId,
  materialsNames,
  units,
  expenseTypes,
}: ManufacturingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ManufacturingFormData>({
    resolver: zodResolver(manufacturingSchema),
    defaultValues: {
      invoice_number: `MAN-${Date.now()}`,
      manufacturing_date: new Date().toISOString().split('T')[0],
      quantity: 0,
      inputItems: [],
      expenses: [],
    },
  });

  const { fields: inputItemFields, append: appendInputItem, remove: removeInputItem } = useFieldArray({
    control,
    name: 'inputItems',
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: 'expenses',
  });

  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);

  const materialNameId = watch('material_name_id');
  const unitId = watch('unit_id');
  const inputItems = watch('inputItems');

  // Auto-calculate output quantity from sum of all input weights
  useEffect(() => {
    if (inputItems && inputItems.length > 0) {
      const totalWeight = inputItems.reduce((sum, item) => {
        return sum + (item.weight || 0);
      }, 0);
      setValue('quantity', totalWeight);
    } else {
      setValue('quantity', 0);
    }
  }, [inputItems, setValue]);

  const onSubmit = async (data: ManufacturingFormData) => {
    setIsLoading(true);
    try {
      // Create main invoice
      const result = await createManufacturingInvoice({
        warehouse_id: warehouseId,
        invoice_number: data.invoice_number,
        blend_name: data.blend_name,
        material_name_id: data.material_name_id,
        unit_id: data.unit_id,
        quantity: data.quantity,
        manufacturing_date: data.manufacturing_date,
        notes: data.notes,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'فشل في إنشاء فاتورة التصنيع');
        return;
      }

      const invoiceId = result.data.id;

      // Create input items (materials consumed)
      if (data.inputItems && data.inputItems.length > 0) {
        for (const item of data.inputItems) {
          const itemResult = await createManufacturingItem({
            manufacturing_invoice_id: invoiceId,
            material_name_id: item.material_name_id,
            unit_id: item.unit_id,
            quantity: item.quantity,
            blend_count: item.blend_count,
            weight: item.weight,
          });

          if (!itemResult.success) {
            toast.error(`فشل في إضافة المادة: ${itemResult.error}`);
            return;
          }
        }
      }

      // Create expenses
      if (data.expenses && data.expenses.length > 0) {
        for (const expense of data.expenses) {
          const expenseResult = await createManufacturingExpense({
            manufacturing_invoice_id: invoiceId,
            expense_type_id: expense.expense_type_id,
            amount: expense.amount,
            account_name: expense.account_name,
          });

          if (!expenseResult.success) {
            toast.error(`فشل في إضافة المصروف: ${expenseResult.error}`);
            return;
          }
        }
      }

      // Upload attachments
      if (attachmentFiles.length > 0) {
        for (const uploadedFile of attachmentFiles) {
          const attachmentResult = await createManufacturingAttachment(
            invoiceId,
            uploadedFile.file
          );

          if (!attachmentResult.success) {
            toast.warning(`تم حفظ الفاتورة لكن فشل رفع الملف: ${uploadedFile.file.name}`);
          }
        }
      }

      toast.success('تم إنشاء فاتورة التصنيع بنجاح');
      router.push('/farmer');
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>المستودع</Label>
          <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
            {warehouseName}
          </div>
          <p className="text-xs text-muted-foreground">
            سيتم إضافة المنتج المصنع إلى هذا المستودع تلقائياً
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">رقم الفاتورة *</Label>
            <Input
              id="invoice_number"
              {...register('invoice_number')}
              disabled={isLoading}
            />
            {errors.invoice_number && (
              <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturing_date">تاريخ التصنيع *</Label>
            <Input
              id="manufacturing_date"
              type="date"
              {...register('manufacturing_date')}
              disabled={isLoading}
            />
            {errors.manufacturing_date && (
              <p className="text-sm text-destructive">{errors.manufacturing_date.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blend_name">اسم الخلطة (اختياري)</Label>
          <Input
            id="blend_name"
            placeholder="مثال: خلطة البياض"
            {...register('blend_name')}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            اسم الخلطة أو الصنف المصنع
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material_name_id">المادة الناتجة *</Label>
            <Combobox
              options={materialsNames.map((material) => ({
                value: material.id,
                label: material.material_name,
              }))}
              value={materialNameId}
              onValueChange={(value) => setValue('material_name_id', value)}
              placeholder="اختر المادة"
              searchPlaceholder="ابحث عن المادة..."
              emptyText="لا توجد مواد"
              disabled={isLoading}
            />
            {errors.material_name_id && (
              <p className="text-sm text-destructive">{errors.material_name_id.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              المادة التي سيتم إنتاجها (مثل: علف)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">الكمية المنتجة (محسوبة) *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
              disabled={true}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              مجموع أوزان المواد المدخلة: {watch('quantity')?.toFixed(2) || '0.00'} كجم
            </p>
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

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
              searchPlaceholder="ابحث عن الوحدة..."
              emptyText="لا توجد وحدات"
              disabled={isLoading}
            />
            {errors.unit_id && (
              <p className="text-sm text-destructive">{errors.unit_id.message}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Input Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">المواد المستخدمة (المدخلات)</h3>
              <p className="text-sm text-muted-foreground">المواد التي تم استهلاكها في التصنيع</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendInputItem({
                material_name_id: '',
                unit_id: '',
                quantity: 0,
                blend_count: 1,
                weight: 0,
              })}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة مادة
            </Button>
          </div>

          {inputItemFields.map((field, index) => {
            const quantity = watch(`inputItems.${index}.quantity`);
            const blendCount = watch(`inputItems.${index}.blend_count`);
            
            // Auto-calculate weight: weight = quantity × blend_count
            useEffect(() => {
              if (quantity && blendCount) {
                const calculatedWeight = quantity * blendCount;
                setValue(`inputItems.${index}.weight`, calculatedWeight);
              } else {
                setValue(`inputItems.${index}.weight`, 0);
              }
            }, [quantity, blendCount]);
            
            const calculatedWeight = quantity && blendCount ? quantity * blendCount : 0;
            
            return (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>المادة *</Label>
                <Combobox
                  options={materialsNames.map((material) => ({
                    value: material.id,
                    label: material.material_name,
                  }))}
                  value={watch(`inputItems.${index}.material_name_id`)}
                  onValueChange={(value) => setValue(`inputItems.${index}.material_name_id`, value)}
                  placeholder="اختر المادة"
                  searchPlaceholder="ابحث عن المادة..."
                  emptyText="لا توجد مواد"
                  disabled={isLoading}
                />
                {errors.inputItems?.[index]?.material_name_id && (
                  <p className="text-sm text-destructive">
                    {errors.inputItems[index]?.material_name_id?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`inputItems.${index}.quantity`, { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.inputItems?.[index]?.quantity && (
                  <p className="text-sm text-destructive">
                    {errors.inputItems[index]?.quantity?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>الوحدة *</Label>
                <Combobox
                  options={units.map((unit) => ({
                    value: unit.id,
                    label: unit.unit_name,
                  }))}
                  value={watch(`inputItems.${index}.unit_id`)}
                  onValueChange={(value) => setValue(`inputItems.${index}.unit_id`, value)}
                  placeholder="اختر الوحدة"
                  searchPlaceholder="ابحث عن الوحدة..."
                  emptyText="لا توجد وحدات"
                  disabled={isLoading}
                />
                {errors.inputItems?.[index]?.unit_id && (
                  <p className="text-sm text-destructive">
                    {errors.inputItems[index]?.unit_id?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>عدد الخلطات *</Label>
                <Input
                  type="number"
                  {...register(`inputItems.${index}.blend_count`, { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.inputItems?.[index]?.blend_count && (
                  <p className="text-sm text-destructive">
                    {errors.inputItems[index]?.blend_count?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>الوزن الكلي (محسوب)</Label>
                <Input
                  type="number"
                  value={calculatedWeight.toFixed(2)}
                  disabled={true}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {quantity || 0} × {blendCount || 0} = {calculatedWeight.toFixed(2)} كجم
                </p>
              </div>

              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeInputItem(index)}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            );
          })}
        </div>

        <Separator />

        {/* Expenses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">المصروفات</h3>
              <p className="text-sm text-muted-foreground">المصروفات المتعلقة بعملية التصنيع</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendExpense({
                expense_type_id: '',
                amount: 0,
                account_name: '',
              })}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة مصروف
            </Button>
          </div>

          {expenseFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>نوع المصروف *</Label>
                <Combobox
                  options={expenseTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  value={watch(`expenses.${index}.expense_type_id`)}
                  onValueChange={(value) => setValue(`expenses.${index}.expense_type_id`, value)}
                  placeholder="اختر نوع المصروف"
                  searchPlaceholder="ابحث عن نوع المصروف..."
                  emptyText="لا توجد أنواع مصروفات"
                  disabled={isLoading}
                />
                {errors.expenses?.[index]?.expense_type_id && (
                  <p className="text-sm text-destructive">
                    {errors.expenses[index]?.expense_type_id?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`expenses.${index}.amount`, { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.expenses?.[index]?.amount && (
                  <p className="text-sm text-destructive">
                    {errors.expenses[index]?.amount?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>اسم الحساب</Label>
                <Input
                  {...register(`expenses.${index}.account_name`)}
                  placeholder="اختياري"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeExpense(index)}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
            {...register('notes')}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <Separator />

        {/* File Attachments */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">المرفقات</h3>
            <p className="text-sm text-muted-foreground mb-4">
              قم بإرفاق الملفات ذات الصلة (صور، PDF، مستندات)
            </p>
          </div>
          <FileUpload
            onFilesSelected={setAttachmentFiles}
            maxFiles={5}
            maxSizeMB={10}
            disabled={isLoading}
          />
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ملاحظة مهمة
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            عند حفظ فاتورة التصنيع، سيتم تلقائياً:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
            <li>إضافة الكمية المنتجة (المخرجات) إلى المخزون</li>
            <li>خصم المواد المستخدمة (المدخلات) من المخزون</li>
            <li>زيادة رصيد المادة الناتجة في عمود "التصنيع"</li>
            <li>زيادة رصيد المواد المستهلكة في عمود "الاستهلاك"</li>
            <li>تحديث الرصيد الحالي لجميع المواد</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          حفظ فاتورة التصنيع
        </Button>
      </div>
    </form>
  );
}
