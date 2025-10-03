'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createManufacturingInvoice, addOutputMaterialToInventory, rollbackManufacturingInvoice } from '@/actions/manufacturing.actions';
import { createManufacturingItem, validateInputMaterialsStock } from '@/actions/manufacturing-item.actions';
import { createManufacturingExpense } from '@/actions/manufacturing-expense.actions';
import { createManufacturingAttachment } from '@/actions/manufacturing-attachment.actions';
import { getWarehousesForMaterials, getMaterialInventory } from '@/actions/material.actions';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { getExpenseTypes } from '@/actions/expense-type.actions';
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
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const manufacturingSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  manufacturing_date: z.string().min(1, 'تاريخ التصنيع مطلوب'),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  blend_name: z.string().optional(),
  material_name_id: z.string().min(1, 'المادة الناتجة مطلوبة'),
  unit_id: z.string().min(1, 'الوحدة مطلوبة'),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
  notes: z.string().optional(),
});

type ManufacturingFormData = z.infer<typeof manufacturingSchema>;

type ManufacturingItemInput = {
  material_name_id: string;
  unit_id: string;
  quantity: number;
  blend_count?: number;
  weight?: number;
};

type ManufacturingExpenseInput = {
  expense_type_id: string;
  amount: number;
  account_name?: string;
};

interface CreateManufacturingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateManufacturingDialog({ open, onOpenChange }: CreateManufacturingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; farm_name: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; material_name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [items, setItems] = useState<ManufacturingItemInput[]>([]);
  const [expenses, setExpenses] = useState<ManufacturingExpenseInput[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ManufacturingFormData>({
    resolver: zodResolver(manufacturingSchema),
    defaultValues: {
      manufacturing_date: new Date().toISOString().split('T')[0],
    },
  });

  const warehouseId = watch('warehouse_id');
  const materialNameId = watch('material_name_id');
  const unitId = watch('unit_id');

  // Auto-calculate output quantity from sum of all input item weights
  useEffect(() => {
    if (items && items.length > 0) {
      const totalWeight = items.reduce((sum, item) => {
        return sum + (item.weight || 0);
      }, 0);
      setValue('quantity', totalWeight);
    } else {
      setValue('quantity', 0);
    }
  }, [items, setValue]);

  useEffect(() => {
    if (open) {
      loadData();
      const invoiceNum = `MFG-${Date.now()}`;
      setValue('invoice_number', invoiceNum);
      setItems([]);
      setExpenses([]);
      setNewItem({ quantity: 0, blend_count: 1, weight: 0 });
      setNewExpense({ amount: 0 });
    }
  }, [open]);

  const loadData = async () => {
    const [warehousesResult, materialsResult, unitsResult, expenseTypesResult] = await Promise.all([
      getWarehousesForMaterials(),
      getMaterialNames(),
      getMeasurementUnits(),
      getExpenseTypes(),
    ]);

    if (warehousesResult.success && warehousesResult.data) {
      setWarehouses(warehousesResult.data);
    }
    if (materialsResult.success && materialsResult.data) {
      setMaterials(materialsResult.data);
    }
    if (unitsResult.success && unitsResult.data) {
      setUnits(unitsResult.data);
    }
    if (expenseTypesResult.success && expenseTypesResult.data) {
      setExpenseTypes(expenseTypesResult.data);
    }
  };

  const onSubmit = async (data: ManufacturingFormData) => {
    setIsLoading(true);
    
    try {
      // Validation: Ensure at least one input material is added
      if (items.length === 0) {
        toast.error('يجب إضافة مادة مدخلة واحدة على الأقل');
        setIsLoading(false);
        return;
      }

      // Validation: Check if all input materials have sufficient stock
      const stockValidation = await validateInputMaterialsStock(data.warehouse_id, items);
      
      if (!stockValidation.success) {
        const insufficientItems = stockValidation.data || [];
        const errorMessages = insufficientItems.map(
          item => `${item.material_name}: متوفر ${item.available}, مطلوب ${item.required}`
        );
        toast.error(`مخزون غير كافٍ:\\n${errorMessages.join('\\n')}`);
        setIsLoading(false);
        return;
      }

      // Create invoice first (without adding output material to inventory yet)
      const invoiceResult = await createManufacturingInvoice(data);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        toast.error(invoiceResult.error || 'فشل في إنشاء فاتورة التصنيع');
        setIsLoading(false);
        return;
      }

      const invoiceId = invoiceResult.data.id;
      let itemsAdded = 0;

      // Add manufacturing items (input materials - decreases inventory)
      try {
        for (const item of items) {
          const itemResult = await createManufacturingItem({
            manufacturing_invoice_id: invoiceId,
            ...item,
          });
          
          if (!itemResult.success) {
            throw new Error(itemResult.error || 'فشل في إضافة المادة المدخلة');
          }
          itemsAdded++;
        }

        // Now add output material to inventory (only after all input items succeed)
        const outputResult = await addOutputMaterialToInventory(invoiceId);
        
        if (!outputResult.success) {
          toast.warning('تم إضافة المواد المدخلة ولكن فشل في إضافة المادة الناتجة');
        }
      } catch (itemError: any) {
        // Rollback: Delete the invoice if items fail
        toast.error(itemError.message || 'فشل في إضافة المواد المدخلة');
        
        // Rollback the invoice creation
        const rollbackResult = await rollbackManufacturingInvoice(invoiceId);
        
        if (!rollbackResult.success) {
          toast.error('فشل في التراجع عن العملية. يرجى حذف الفاتورة يدوياً.');
        } else {
          toast.info('تم التراجع عن إنشاء الفاتورة');
        }
        
        setIsLoading(false);
        return;
      }

      // Add manufacturing expenses
      for (const expense of expenses) {
        await createManufacturingExpense({
          manufacturing_invoice_id: invoiceId,
          ...expense,
        });
      }

      // Upload attachments
      if (attachmentFiles.length > 0) {
        for (const uploadedFile of attachmentFiles) {
          const attachmentResult = await createManufacturingAttachment(
            invoiceId,
            uploadedFile.file
          );

          if (!attachmentResult.success) {
            toast.warning(`تم حفظ الفاتورة ولكن فشل رفع الملف: ${uploadedFile.file.name}`);
          }
        }
      }

      toast.success('تم إنشاء فاتورة التصنيع بنجاح');
      reset();
      setItems([]);
      setExpenses([]);
      setAttachmentFiles([]);
      onOpenChange(false);
      
      // Use revalidation instead of full page reload
      // The parent component should handle revalidation
    } catch (error) {
      console.error('Error creating manufacturing invoice:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (item: ManufacturingItemInput) => {
    setItems([...items, item]);
    toast.success('Item added');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Item removed');
  };

  const addExpense = (expense: ManufacturingExpenseInput) => {
    setExpenses([...expenses, expense]);
    toast.success('Expense added');
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    toast.success('Expense removed');
  };

  const [newItem, setNewItem] = useState<Partial<ManufacturingItemInput>>({
    quantity: 0,
    blend_count: 1,
    weight: 0,
  });
  const [newExpense, setNewExpense] = useState<Partial<ManufacturingExpenseInput>>({
    amount: 0,
  });
  
  // State for displaying current stock
  const [currentStock, setCurrentStock] = useState<{ balance: number; unitName: string } | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Fetch current stock when material or warehouse changes
  useEffect(() => {
    const fetchStock = async () => {
      if (newItem.material_name_id && warehouseId) {
        setIsLoadingStock(true);
        try {
          const result = await getMaterialInventory(warehouseId, newItem.material_name_id);
          if (result.success && result.data) {
            setCurrentStock({
              balance: result.data.current_balance,
              unitName: result.data.unit_name,
            });
          } else {
            setCurrentStock({ balance: 0, unitName: '' });
          }
        } catch (error) {
          setCurrentStock(null);
        } finally {
          setIsLoadingStock(false);
        }
      } else {
        setCurrentStock(null);
      }
    };

    fetchStock();
  }, [newItem.material_name_id, warehouseId]);

  // Auto-calculate weight: weight = quantity × blend_count
  useEffect(() => {
    if (newItem.quantity && newItem.blend_count) {
      const calculatedWeight = newItem.quantity * newItem.blend_count;
      setNewItem(prev => ({ ...prev, weight: calculatedWeight }));
    } else {
      setNewItem(prev => ({ ...prev, weight: 0 }));
    }
  }, [newItem.quantity, newItem.blend_count]);

  const handleAddItem = () => {
    if (!newItem.material_name_id || !newItem.unit_id) {
      toast.error('المادة والوحدة مطلوبة');
      return;
    }
    if (newItem.quantity === undefined || newItem.quantity < 0) {
      toast.error('الكمية الصحيحة مطلوبة');
      return;
    }

    // Check if quantity exceeds available stock
    if (currentStock && newItem.quantity > currentStock.balance) {
      toast.error(`الكمية المطلوبة (${newItem.quantity}) تتجاوز المخزون المتوفر (${currentStock.balance})`);
      return;
    }

    addItem(newItem as ManufacturingItemInput);
    setNewItem({ quantity: 0, blend_count: 1, weight: 0 });
    setCurrentStock(null); // Reset stock display
  };

  const handleAddExpense = () => {
    if (!newExpense.expense_type_id) {
      toast.error('نوع المصروف مطلوب');
      return;
    }
    if (newExpense.amount === undefined || newExpense.amount < 0) {
      toast.error('المبلغ الصحيح مطلوب');
      return;
    }

    addExpense(newExpense as ManufacturingExpenseInput);
    setNewExpense({ amount: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة تصنيع</DialogTitle>
          <DialogDescription>
            إضافة معلومات التصنيع، المواد المدخلة، والمصاريف
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="warehouse_id">المستودع *</Label>
            <Combobox
              options={warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: `${warehouse.name} (${warehouse.farm_name})`,
              }))}
              value={warehouseId}
              onValueChange={(value) => setValue('warehouse_id', value)}
              placeholder="اختر المستودع"
              searchPlaceholder="البحث عن المستودعات..."
              emptyText="لم يتم العثور على مستودعات"
              disabled={isLoading}
            />
            {errors.warehouse_id && (
              <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blend_name">اسم الخلطة</Label>
            <Input
              id="blend_name"
              placeholder="مثال: خلطة علف أ"
              {...register('blend_name')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_name_id">المادة الناتجة *</Label>
              <Combobox
                options={materials
                  .filter((material) => material.material_name.startsWith('علف'))
                  .map((material) => ({
                    value: material.id,
                    label: material.material_name,
                  }))}
                value={materialNameId || ''}
                onValueChange={(value) => setValue('material_name_id', value)}
                placeholder="اختر المادة"
                searchPlaceholder="البحث عن المواد..."
                emptyText="لم يتم العثور على مواد تبدأ بـ 'علف'"
                disabled={isLoading}
              />
              {errors.material_name_id && (
                <p className="text-sm text-destructive">{errors.material_name_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">الوحدة *</Label>
              <Combobox
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.unit_name,
                }))}
                value={unitId || ''}
                onValueChange={(value) => setValue('unit_id', value)}
                placeholder="اختر الوحدة"
                searchPlaceholder="البحث عن الوحدات..."
                emptyText="لم يتم العثور على وحدات"
                disabled={isLoading}
              />
              {errors.unit_id && (
                <p className="text-sm text-destructive">{errors.unit_id.message}</p>
              )}
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
          </div>

          {/* Manufacturing Items Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">المواد المدخلة ({items.length})</h3>
              
              <div className="grid grid-cols-6 gap-2 mb-4">
                <div className="col-span-2 space-y-1">
                  <Combobox
                    options={materials.map((m) => ({
                      value: m.id,
                      label: m.material_name,
                    }))}
                    value={newItem.material_name_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, material_name_id: value })}
                    placeholder="المادة"
                    searchPlaceholder="البحث عن المواد..."
                    emptyText="لم يتم العثور على مواد"
                  />
                  {newItem.material_name_id && currentStock !== null && (
                    <p className={`text-xs ${currentStock.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {isLoadingStock ? (
                        'جاري التحميل...'
                      ) : (
                        <>
                          المخزون: {currentStock.balance.toFixed(2)} {currentStock.unitName}
                        </>
                      )}
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="الكمية"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                />
                <Combobox
                  options={units.map((u) => ({
                    value: u.id,
                    label: u.unit_name,
                  }))}
                  value={newItem.unit_id || ''}
                  onValueChange={(value) => setNewItem({ ...newItem, unit_id: value })}
                  placeholder="الوحدة"
                  searchPlaceholder="البحث عن الوحدات..."
                  emptyText="لم يتم العثور على وحدات"
                />
                <Input
                  type="number"
                  placeholder="عدد الخلطات"
                  value={newItem.blend_count || ''}
                  onChange={(e) => setNewItem({ ...newItem, blend_count: parseInt(e.target.value) })}
                />
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={newItem.weight?.toFixed(2) || '0.00'}
                    disabled={true}
                    className="bg-muted text-sm"
                    title="الوزن الكلي = الكمية × عدد الخلطات"
                  />
                  <p className="text-xs text-muted-foreground">
                    {newItem.quantity || 0} × {newItem.blend_count || 0} = {(newItem.weight || 0).toFixed(2)}
                  </p>
                </div>
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {materials.find(m => m.id === item.material_name_id)?.material_name} - 
                        {item.quantity} {units.find(u => u.id === item.unit_id)?.unit_name}
                        {item.blend_count && <span> (x{item.blend_count})</span>}
                        {item.weight && <span className="text-muted-foreground"> [{item.weight}كجم]</span>}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manufacturing Expenses Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">مصاريف التصنيع ({expenses.length})</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="col-span-2">
                  <Combobox
                    options={expenseTypes.map((e) => ({
                      value: e.id,
                      label: e.name,
                    }))}
                    value={newExpense.expense_type_id || ''}
                    onValueChange={(value) => setNewExpense({ ...newExpense, expense_type_id: value })}
                    placeholder="نوع المصروف"
                    searchPlaceholder="البحث عن أنواع المصاريف..."
                    emptyText="لم يتم العثور على أنواع مصاريف"
                  />
                </div>
                <Input
                  type="number"
                  placeholder="المبلغ"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                />
                <Input
                  type="text"
                  placeholder="الحساب المقابل"
                  value={newExpense.account_name || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, account_name: e.target.value })}
                />
                <Button type="button" size="sm" onClick={handleAddExpense}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {expenses.length > 0 && (
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {expenseTypes.find(e => e.id === expense.expense_type_id)?.name}
                        <strong className="ml-2">${expense.amount.toFixed(2)}</strong>
                        {expense.account_name && (
                          <span className="text-muted-foreground mr-2">({expense.account_name})</span>
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpense(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  placeholder="ملاحظات اختيارية"
                  {...register('notes')}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">المرفقات</h3>
              <p className="text-sm text-muted-foreground mb-4">
                تحميل الملفات ذات الصلة (صور، ملفات PDF، مستندات)
              </p>
              <FileUpload
                onFilesSelected={setAttachmentFiles}
                maxFiles={5}
                maxSizeMB={10}
                disabled={isLoading}
              />
            </CardContent>
          </Card>

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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إنشاء فاتورة تصنيع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
