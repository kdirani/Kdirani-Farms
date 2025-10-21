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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/utils';

import { getFarmerWarehouses } from '@/actions/warehouse.actions';
import { getFarmerMaterials } from '@/actions/material.actions';
import { getFarmerMedicines } from '@/actions/medicine.actions';
import { getFarmerMeasurementUnits } from '@/actions/unit.actions';
import { getFarmerExpenseTypes } from '@/actions/expense-type.actions';
import { getFarmerClients } from '@/actions/client.actions';
import { getFarmerEggWeights } from '@/actions/egg-weight.actions';
import { createFarmerInvoice } from '@/actions/invoice.actions';
import { createInvoiceItem } from '@/actions/invoice-item.actions';
import { createInvoiceExpense } from '@/actions/invoice-expense.actions';

const invoiceSchema = z.object({
  invoice_type: z.enum(['buy', 'sell']),
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  invoice_date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
  invoice_time: z.string().optional(),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  client_id: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

type InvoiceItemInput = {
  material_name_id?: string;
  medicine_id?: string;
  unit_id: string;
  egg_weight_id?: string;
  quantity: number;
  weight?: number;
  price: number;
};

type InvoiceExpenseInput = {
  expense_type_id: string;
  amount: number;
  account_name?: string;
};

export function FarmerInvoiceForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; material_name: string }>>([]);
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [eggWeights, setEggWeights] = useState<Array<{ id: string; weight_range: string }>>([]);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [items, setItems] = useState<InvoiceItemInput[]>([]);
  const [expenses, setExpenses] = useState<InvoiceExpenseInput[]>([]);
  const [itemType, setItemType] = useState<'material' | 'medicine' | 'egg'>('material');
  
  const [newItem, setNewItem] = useState<Partial<InvoiceItemInput>>({
    quantity: 0,
    price: 0,
  });
  
  const [newExpense, setNewExpense] = useState<Partial<InvoiceExpenseInput>>({
    amount: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_type: 'sell',
      invoice_date: new Date().toISOString().split('T')[0],
    },
  });

  const invoiceType = watch('invoice_type');

  useEffect(() => {
    loadData();
    const invoiceNum = `INV-${Date.now()}`;
    setValue('invoice_number', invoiceNum);
  }, [setValue]);

  const loadData = async () => {
    try {
      // Load warehouses
      const warehousesResult = await getFarmerWarehouses();
      if (warehousesResult.success && warehousesResult.data) {
        // تم إزالة الشرط الذي يتحقق من طول المصفوفة لأن المزارع موجودة بالفعل
        setWarehouses(warehousesResult.data);
        
        // تعيين المستودع تلقائيًا إذا كان هناك مستودع واحد فقط
        if (warehousesResult.data.length === 1) {
          setValue('warehouse_id', warehousesResult.data[0].id);
        }
      } else if (!warehousesResult.success) {
        toast.error('لم يتم العثور على مزارع مرتبطة بحسابك. يرجى التواصل مع المسؤول لإضافة مزرعة لحسابك');
        router.push('/farmer');
        return;
      }

      // Load clients
      const clientsResult = await getFarmerClients();
      if (clientsResult.success && clientsResult.data) {
        setClients(clientsResult.data);
      }

      // Load materials
      const materialsResult = await getFarmerMaterials();
      if (materialsResult.success && materialsResult.data) {
        setMaterials(materialsResult.data.map((material: any) => ({
          id: material.id,
          material_name: material.material_name || ''
        })));
      }

      // Load medicines
      const medicinesResult = await getFarmerMedicines();
      if (medicinesResult.success && medicinesResult.data) {
        setMedicines(medicinesResult.data);
      }

      // Load units
      const unitsResult = await getFarmerMeasurementUnits();
      if (unitsResult.success && unitsResult.data) {
        setUnits(unitsResult.data);
      }

      // Load egg weights
      const eggWeightsResult = await getFarmerEggWeights();
      if (eggWeightsResult.success && eggWeightsResult.data) {
        setEggWeights(eggWeightsResult.data);
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

  // إضافة أنواع البيانات للمعلمات
  const handleAddItem = () => {
    if (!newItem.unit_id || !newItem.quantity || !newItem.price) {
      toast.error('يرجى إدخال الوحدة والكمية والسعر');
      return;
    }

    if (itemType === 'material' && !newItem.material_name_id) {
      toast.error('يرجى اختيار المادة');
      return;
    }

    if (itemType === 'medicine' && !newItem.medicine_id) {
      toast.error('يرجى اختيار الدواء');
      return;
    }

    if (itemType === 'egg' && !newItem.egg_weight_id) {
      toast.error('يرجى اختيار وزن البيض');
      return;
    }

    setItems([...items, newItem as InvoiceItemInput]);
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

    setExpenses([...expenses, newExpense as InvoiceExpenseInput]);
    setNewExpense({ amount: 0 });
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (items.length === 0) {
      toast.error('يجب إضافة عنصر واحد على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      // Create invoice
      const invoiceResult = await createFarmerInvoice({
        ...data,
      });

      if (!invoiceResult.success || !invoiceResult.data) {
        throw new Error(invoiceResult.error || 'فشل إنشاء الفاتورة');
      }

      const invoiceId = invoiceResult.data.id;

      // Add invoice items
      for (const item of items) {
        const itemResult = await createInvoiceItem({
          invoice_id: invoiceId,
          material_name_id: item.material_name_id,
          medicine_id: item.medicine_id,
          unit_id: item.unit_id,
          egg_weight_id: item.egg_weight_id,
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
        });

        if (!itemResult.success) {
          throw new Error(itemResult.error || 'فشل إضافة عنصر للفاتورة');
        }
      }

      // Add invoice expenses
      for (const expense of expenses) {
        const expenseResult = await createInvoiceExpense({
          invoice_id: invoiceId,
          expense_type_id: expense.expense_type_id,
          amount: expense.amount,
          account_name: expense.account_name,
        });

        if (!expenseResult.success) {
          throw new Error(expenseResult.error || 'فشل إضافة مصروف للفاتورة');
        }
      }

      toast.success('تم إنشاء الفاتورة بنجاح');
      router.push('/farmer/invoices');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الفاتورة');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum: number, item: InvoiceItemInput) => sum + (item.quantity * item.price), 0);
    const expensesTotal = expenses.reduce((sum: number, exp: InvoiceExpenseInput) => sum + exp.amount, 0);
    return itemsTotal + expensesTotal;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-full px-2 sm:px-4">
      <Card className="w-full">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center sm:text-right">معلومات الفاتورة</h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="space-y-2">
              <Label>نوع الفاتورة *</Label>
              <RadioGroup
                value={invoiceType}
                onValueChange={(value) => setValue('invoice_type', value as 'buy' | 'sell')}
                className="flex flex-row-reverse sm:flex-row justify-center sm:justify-start gap-6 sm:gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sell" id="sell" />
                  <Label htmlFor="sell" className="cursor-pointer">بيع</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="buy" id="buy" />
                  <Label htmlFor="buy" className="cursor-pointer">شراء</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

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
              <Label htmlFor="invoice_date">تاريخ الفاتورة *</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register('invoice_date')}
                disabled={isLoading}
                className="w-full"
              />
              {errors.invoice_date && (
                <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_time">وقت الفاتورة</Label>
              <Input
                id="invoice_time"
                type="time"
                {...register('invoice_time')}
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
              <Label htmlFor="client_id">العميل</Label>
              <Combobox
                options={clients.map((client) => ({
                  value: client.id,
                  label: `${client.name} (${client.type === 'supplier' ? 'مورد' : 'عميل'})`,
                }))}
                value={watch('client_id') || ''}
                onValueChange={(value) => setValue('client_id', value)}
                placeholder="اختر العميل"
                searchPlaceholder="البحث عن العملاء..."
                emptyText="لم يتم العثور على عملاء"
                disabled={isLoading}
                className="w-full"
              />
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

      {/* Invoice Items Section */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center sm:text-right">العناصر ({items.length})</h3>
          
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
            <Button
              type="button"
              variant={itemType === 'material' ? 'default' : 'outline'}
              onClick={() => setItemType('material')}
              disabled={isLoading}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              مواد
            </Button>
            <Button
              type="button"
              variant={itemType === 'medicine' ? 'default' : 'outline'}
              onClick={() => setItemType('medicine')}
              disabled={isLoading}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              أدوية
            </Button>
            <Button
              type="button"
              variant={itemType === 'egg' ? 'default' : 'outline'}
              onClick={() => setItemType('egg')}
              disabled={isLoading}
              className="flex-1 sm:flex-none min-w-[80px]"
            >
              بيض
            </Button>
          </div>
          
          {/* Column Labels */}
          <div className="grid grid-cols-6 gap-2 text-sm font-medium text-muted-foreground mb-2 overflow-x-auto">
            <div className="col-span-2">العنصر</div>
            <div>الكمية</div>
            <div>الوحدة</div>
            <div>السعر</div>
            <div>القيمة</div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-2">
                {itemType === 'material' && (
                  <Combobox
                    options={materials.map((material) => ({
                      value: material.id,
                      label: material.material_name,
                    }))}
                    value={newItem.material_name_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, material_name_id: value, medicine_id: undefined, egg_weight_id: undefined })}
                    placeholder="اختر المادة"
                    searchPlaceholder="البحث عن المواد..."
                    emptyText="لم يتم العثور على مواد"
                    disabled={isLoading}
                    className="w-full"
                  />
                )}
                {itemType === 'medicine' && (
                  <Combobox
                    options={medicines.map((medicine) => ({
                      value: medicine.id,
                      label: medicine.name,
                    }))}
                    value={newItem.medicine_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, medicine_id: value, material_name_id: undefined, egg_weight_id: undefined })}
                    placeholder="اختر الدواء"
                    searchPlaceholder="البحث عن الأدوية..."
                    emptyText="لم يتم العثور على أدوية"
                    disabled={isLoading}
                    className="w-full"
                  />
                )}
                {itemType === 'egg' && (
                  <Combobox
                    options={eggWeights.map((weight) => ({
                      value: weight.id,
                      label: weight.weight_range,
                    }))}
                    value={newItem.egg_weight_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, egg_weight_id: value, material_name_id: undefined, medicine_id: undefined })}
                    placeholder="اختر وزن البيض"
                    searchPlaceholder="البحث عن أوزان البيض..."
                    emptyText="لم يتم العثور على أوزان بيض"
                    disabled={isLoading}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div>
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
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm">{newItem.quantity && newItem.price ? formatCurrency(newItem.quantity * newItem.price) : '-'}</span>
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
            
            <div className="overflow-x-auto">
              {items.map((item, index) => {
                let itemName = '';
                if (item.material_name_id) {
                  itemName = materials.find(m => m.id === item.material_name_id)?.material_name || '';
                } else if (item.medicine_id) {
                  itemName = medicines.find(m => m.id === item.medicine_id)?.name || '';
                } else if (item.egg_weight_id) {
                  itemName = eggWeights.find(w => w.id === item.egg_weight_id)?.weight_range || '';
                }
                
                const unitName = units.find(u => u.id === item.unit_id)?.unit_name || '';
                
                return (
                  <div key={index} className="grid grid-cols-6 gap-2 items-center border-t pt-2">
                    <div className="col-span-2 text-xs sm:text-base">{itemName}</div>
                    <div className="text-xs sm:text-base">{item.quantity}</div>
                    <div className="text-xs sm:text-base">{unitName}</div>
                    <div className="text-xs sm:text-base">{formatCurrency(item.price)}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-base">{formatCurrency(item.quantity * item.price)}</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Invoice Expenses Section */}
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
            onClick={() => router.push('/farmer/invoices')}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إنشاء الفاتورة
          </Button>
        </div>
      </div>
    </form>
  );
}