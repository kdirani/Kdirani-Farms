"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';

import { getFarmerWarehouses } from '@/actions/warehouse.actions';
import { getFarmerMaterials } from '@/actions/material.actions';
import { getFarmerMeasurementUnits } from '@/actions/unit.actions';
import { getFarmerExpenseTypes } from '@/actions/expense-type.actions';
import { createManufacturingInvoice } from '@/actions/manufacturing.actions';
import { createManufacturingItem } from '@/actions/manufacturing-item.actions';
import { createManufacturingExpense } from '@/actions/manufacturing-expense.actions';
import { getFarmerMaterialNames } from '@/actions/material-name.actions';

const manufacturingInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  blend_name: z.string().optional(),
  material_name_id: z.string().min(1, 'المادة المنتجة مطلوبة'),
  unit_id: z.string().min(1, 'وحدة القياس مطلوبة'),
  quantity: z.coerce.number().min(0.01, 'الكمية مطلوبة'),
  manufacturing_date: z.string().min(1, 'تاريخ التصنيع مطلوب'),
  manufacturing_time: z.string().optional(),
  notes: z.string().optional(),
});

type ManufacturingInvoiceFormData = z.infer<typeof manufacturingInvoiceSchema>;

type ManufacturingItemInput = {
  material_name_id: string;
  unit_id: string;
  quantity: number;
  price: number;
};

type ManufacturingExpenseInput = {
  expense_type_id: string;
  amount: number;
  account_name?: string;
};

export function FarmerManufacturingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; material_name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [items, setItems] = useState<ManufacturingItemInput[]>([]);
  const [expenses, setExpenses] = useState<ManufacturingExpenseInput[]>([]);
  
  const [newItem, setNewItem] = useState<Partial<ManufacturingItemInput>>({
    quantity: 0,
    price: 0,
  });
  
  const [newExpense, setNewExpense] = useState<Partial<ManufacturingExpenseInput>>({
    amount: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ManufacturingInvoiceFormData>({
    resolver: zodResolver(manufacturingInvoiceSchema),
    defaultValues: {
      manufacturing_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadData();
    const invoiceNum = `MAN-${Date.now()}`;
    setValue('invoice_number', invoiceNum);
  }, []);

  const loadData = async () => {
    try {
      // Load warehouses
      const warehousesResult = await getFarmerWarehouses();
      if (warehousesResult.success && warehousesResult.data) {
        setWarehouses(warehousesResult.data);
      } else if (!warehousesResult.success) {
        toast.error('لم يتم العثور على مزارع مرتبطة بحسابك. يرجى التواصل مع المسؤول لإضافة مزرعة لحسابك');
        router.push('/farmer');
        return;
      }

      // تحميل أسماء المواد
      const materialNamesResult = await getFarmerMaterialNames();
      if (materialNamesResult.success && materialNamesResult.data) {
        setMaterials(materialNamesResult.data.map(m => ({
          id: m.id,
          material_name: m.material_name || ''
        })));
      }

      // Load units
      const unitsResult = await getFarmerMeasurementUnits();
      if (unitsResult.success && unitsResult.data) {
        setUnits(unitsResult.data);
      }

      // Load expense types
      const expenseTypesResult = await getFarmerExpenseTypes();
      if (expenseTypesResult.success && expenseTypesResult.data) {
        setExpenseTypes(expenseTypesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    }
  };

  const handleAddItem = () => {
    if (!newItem.material_name_id || !newItem.unit_id || !newItem.quantity || !newItem.price) {
      toast.error('يرجى إدخال جميع بيانات المادة');
      return;
    }

    setItems([...items, newItem as ManufacturingItemInput]);
    setNewItem({ quantity: 0, price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddExpense = () => {
    if (!newExpense.expense_type_id || !newExpense.amount) {
      toast.error('يرجى إدخال جميع بيانات المصروف');
      return;
    }

    setExpenses([...expenses, newExpense as ManufacturingExpenseInput]);
    setNewExpense({ amount: 0 });
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ManufacturingInvoiceFormData) => {
    if (items.length === 0) {
      toast.error('يجب إضافة مادة واحدة على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      // Create manufacturing invoice
      const invoiceResult = await createManufacturingInvoice({
        ...data,
        quantity: Number(data.quantity),
      });

      if (!invoiceResult.success || !invoiceResult.data) {
        throw new Error(invoiceResult.error || 'فشل إنشاء فاتورة التصنيع');
      }

      const invoiceId = invoiceResult.data.id;

      // Add manufacturing items
      for (const item of items) {
        // إزالة خاصية price غير المستخدمة
      const itemResult = await createManufacturingItem({
        manufacturing_invoice_id: invoiceId,
        material_name_id: item.material_name_id,
        unit_id: item.unit_id,
        quantity: item.quantity,
      });

        if (!itemResult.success) {
          throw new Error(itemResult.error || 'فشل إضافة مادة للفاتورة');
        }
      }

      // Add manufacturing expenses
      for (const expense of expenses) {
        const expenseResult = await createManufacturingExpense({
          manufacturing_invoice_id: invoiceId,
          expense_type_id: expense.expense_type_id,
          amount: expense.amount,
          account_name: expense.account_name,
        });

        if (!expenseResult.success) {
          throw new Error(expenseResult.error || 'فشل إضافة مصروف للفاتورة');
        }
      }

      toast.success('تم إنشاء فاتورة التصنيع بنجاح');
      router.push('/farmer/manufacturing');
    } catch (error: any) {
      console.error('Error creating manufacturing invoice:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء فاتورة التصنيع');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return itemsTotal + expensesTotal;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-full px-2 sm:px-4">
      <Card className="w-full">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center sm:text-right">معلومات الفاتورة</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">رقم الفاتورة *</Label>
              <Input
                id="invoice_number"
                {...register('invoice_number')}
                disabled={isLoading}
                className="w-full"
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
                className="w-full"
              />
              {errors.manufacturing_date && (
                <p className="text-sm text-destructive">{errors.manufacturing_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturing_time">وقت التصنيع</Label>
              <Input
                id="manufacturing_time"
                type="time"
                {...register('manufacturing_time')}
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse_id">المستودع *</Label>
              <Combobox
                options={warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                }))}
                value={watch('warehouse_id')}
                onValueChange={(value) => setValue('warehouse_id', value)}
                placeholder="اختر المستودع"
                searchPlaceholder="البحث عن المستودعات..."
                emptyText="لم يتم العثور على مستودعات"
                disabled={isLoading}
                className="w-full"
              />
              {errors.warehouse_id && (
                <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="blend_name">اسم الخلطة</Label>
              <Input
                id="blend_name"
                {...register('blend_name')}
                placeholder="اسم الخلطة (اختياري)"
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="material_name_id">المادة المنتجة *</Label>
              <Combobox
                options={materials.map((material) => ({
                  value: material.id,
                  label: material.material_name,
                }))}
                value={watch('material_name_id')}
                onValueChange={(value) => setValue('material_name_id', value)}
                placeholder="اختر المادة المنتجة"
                searchPlaceholder="البحث عن المواد..."
                emptyText="لم يتم العثور على مواد"
                disabled={isLoading}
                className="w-full"
              />
              {errors.material_name_id && (
                <p className="text-sm text-destructive">{errors.material_name_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">وحدة القياس *</Label>
              <Combobox
                options={units.map((unit) => ({
                  value: unit.id,
                  label: unit.unit_name,
                }))}
                value={watch('unit_id')}
                onValueChange={(value) => setValue('unit_id', value)}
                placeholder="اختر وحدة القياس"
                searchPlaceholder="البحث عن الوحدات..."
                emptyText="لم يتم العثور على وحدات"
                disabled={isLoading}
                className="w-full"
              />
              {errors.unit_id && (
                <p className="text-sm text-destructive">{errors.unit_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية المنتجة *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                {...register('quantity')}
                disabled={isLoading}
                className="w-full"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              placeholder="ملاحظات اختيارية"
              {...register('notes')}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Items Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">المواد المستخدمة ({items.length})</h3>
          
          {/* Column Labels */}
          <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground mb-2">
            <div className="col-span-2">المادة</div>
            <div>الكمية</div>
            <div>السعر</div>
            <div>القيمة</div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Combobox
                  options={materials.map((material) => ({
                    value: material.id,
                    label: material.material_name,
                  }))}
                  value={newItem.material_name_id || ''}
                  onValueChange={(value) => setNewItem({ ...newItem, material_name_id: value })}
                  placeholder="اختر المادة"
                  searchPlaceholder="البحث عن المواد..."
                  emptyText="لم يتم العثور على مواد"
                  disabled={isLoading}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                    disabled={isLoading}
                    className="w-full"
                  />
                  <Combobox
                    options={units.map((unit) => ({
                      value: unit.id,
                      label: unit.unit_name,
                    }))}
                    value={newItem.unit_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, unit_id: value })}
                    placeholder="الوحدة"
                    searchPlaceholder="البحث..."
                    emptyText="لا توجد وحدات"
                    disabled={isLoading}
                    className="w-24"
                  />
                </div>
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center">
                {newItem.quantity && newItem.price ? formatCurrency(newItem.quantity * newItem.price) : '-'}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {items.map((item, index) => {
              const materialName = materials.find(m => m.id === item.material_name_id)?.material_name || '';
              const unitName = units.find(u => u.id === item.unit_id)?.unit_name || '';
              
              return (
                <div key={index} className="grid grid-cols-5 gap-2 items-center border-t pt-2">
                  <div className="col-span-2">{materialName}</div>
                  <div>{item.quantity} {unitName}</div>
                  <div>{formatCurrency(item.price)}</div>
                  <div className="flex items-center justify-between">
                    <span>{formatCurrency(item.quantity * item.price)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Expenses Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">المصاريف ({expenses.length})</h3>
          
          {/* Column Labels */}
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground mb-2">
            <div className="col-span-2">نوع المصروف</div>
            <div>المبلغ</div>
            <div>الحساب</div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Combobox
                  options={expenseTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  value={newExpense.expense_type_id || ''}
                  onValueChange={(value) => setNewExpense({ ...newExpense, expense_type_id: value })}
                  placeholder="اختر نوع المصروف"
                  searchPlaceholder="البحث عن أنواع المصاريف..."
                  emptyText="لم يتم العثور على أنواع مصاريف"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="اسم الحساب (اختياري)"
                  value={newExpense.account_name || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, account_name: e.target.value })}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExpense}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {expenses.map((expense, index) => {
              const typeName = expenseTypes.find(t => t.id === expense.expense_type_id)?.name || '';
              
              return (
                <div key={index} className="grid grid-cols-4 gap-2 items-center border-t pt-2">
                  <div className="col-span-2">{typeName}</div>
                  <div>{formatCurrency(expense.amount)}</div>
                  <div className="flex items-center justify-between">
                    <span>{expense.account_name || '-'}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExpense(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          الإجمالي: {formatCurrency(calculateTotal())}
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/farmer/manufacturing')}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إنشاء فاتورة التصنيع
          </Button>
        </div>
      </div>
    </form>
  );
}