'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createFarmerMedicineInvoice } from '@/actions/medicine-invoice.actions';
import { createMedicineItem } from '@/actions/medicine-item.actions';
import { createMedicineExpense } from '@/actions/medicine-expense.actions';
import { getFarmerWarehouses } from '@/actions/warehouse.actions';
import { getFarmerMedicines } from '@/actions/medicine.actions';
import { getFarmerMeasurementUnits } from '@/actions/unit.actions';
import { getFarmerExpenseTypes } from '@/actions/expense-type.actions';
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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const medicineInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  invoice_date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
  invoice_time: z.string().optional(),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  poultry_status_id: z.string().optional(),
  notes: z.string().optional(),
});

type MedicineInvoiceFormData = z.infer<typeof medicineInvoiceSchema>;

type MedicineItemInput = {
  medicine_id: string;
  unit_id: string;
  administration_day?: number;
  administration_date?: string;
  quantity: number;
  price: number;
};

type MedicineExpenseInput = {
  expense_type_id: string;
  amount: number;
  account_name?: string;
};

export function FarmerMedicineInvoiceForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; farm_name: string }>>([]);
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [items, setItems] = useState<MedicineItemInput[]>([]);
  const [expenses, setExpenses] = useState<MedicineExpenseInput[]>([]);
  
  const [newItem, setNewItem] = useState<Partial<MedicineItemInput>>({
    quantity: 0,
    price: 0,
  });
  
  const [newExpense, setNewExpense] = useState<Partial<MedicineExpenseInput>>({
    amount: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MedicineInvoiceFormData>({
    resolver: zodResolver(medicineInvoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
    },
  });

  const warehouseId = watch('warehouse_id');

  useEffect(() => {
    loadData();
    const invoiceNum = `MED-${Date.now()}`;
    setValue('invoice_number', invoiceNum);
  }, [setValue]);

  async function loadData() {
    try {
      // تحميل المستودعات
      const warehousesResult = await getFarmerWarehouses();
      if (warehousesResult.success && warehousesResult.data) {
        setWarehouses(warehousesResult.data.map(w => ({
          id: w.id,
          name: w.name,
          farm_name: ''
        })));
      if (warehousesResult.data.length === 1) {
          setValue('warehouse_id', warehousesResult.data[0].id);
        }
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

      // Load expense types
      const expenseTypesResult = await getFarmerExpenseTypes();
      if (expenseTypesResult.success && expenseTypesResult.data) {
        setExpenseTypes(expenseTypesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    }
  }

  const handleAddItem = () => {
    if (!newItem.medicine_id || !newItem.unit_id || !newItem.quantity || !newItem.price) {
      toast.error('يرجى إدخال جميع بيانات المادة');
      return;
    }

    setItems([...items, newItem as MedicineItemInput]);
    setNewItem({ quantity: 0, price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleAddExpense = () => {
    if (!newExpense.expense_type_id || !newExpense.amount) {
      toast.error('يرجى إدخال جميع بيانات المصروف');
      return;
    }

    setExpenses([...expenses, newExpense as MedicineExpenseInput]);
    setNewExpense({ amount: 0 });
  };

  const handleRemoveExpense = (index: number) => {
    const updatedExpenses = [...expenses];
    updatedExpenses.splice(index, 1);
    setExpenses(updatedExpenses);
  };

  const onSubmit = async (data: MedicineInvoiceFormData) => {
    if (items.length === 0) {
      toast.error('يجب إضافة مادة واحدة على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      // Create invoice
      const result = await createFarmerMedicineInvoice(data);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'فشل إنشاء الفاتورة');
      }

      const invoiceId = result.data.id;

      // Add items
      for (const item of items) {
        const itemResult = await createMedicineItem({
          consumption_invoice_id: invoiceId,
          medicine_id: item.medicine_id,
          unit_id: item.unit_id,
          administration_day: item.administration_day,
          administration_date: item.administration_date,
          quantity: item.quantity,
          price: item.price,
        });

        if (!itemResult.success) {
          throw new Error(itemResult.error || 'فشل إضافة المادة');
        }
      }

      // Add expenses
      for (const expense of expenses) {
        const expenseResult = await createMedicineExpense({
          consumption_invoice_id: invoiceId,
          expense_type_id: expense.expense_type_id,
          amount: expense.amount,
          account_name: expense.account_name,
        });

        if (!expenseResult.success) {
          throw new Error(expenseResult.error || 'فشل إضافة المصروف');
        }
      }

      toast.success('تم إنشاء الفاتورة بنجاح');
      router.push('/farmer/medicine-invoices');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الفاتورة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">رقم الفاتورة</Label>
            <Input
              id="invoice_number"
              {...register('invoice_number')}
              placeholder="رقم الفاتورة"
              className={errors.invoice_number ? 'border-red-500' : ''}
            />
            {errors.invoice_number && (
              <p className="text-red-500 text-sm">{errors.invoice_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_date">تاريخ الفاتورة</Label>
            <Input
              id="invoice_date"
              type="date"
              {...register('invoice_date')}
              className={errors.invoice_date ? 'border-red-500' : ''}
            />
            {errors.invoice_date && (
              <p className="text-red-500 text-sm">{errors.invoice_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_time">وقت الفاتورة (اختياري)</Label>
            <Input
              id="invoice_time"
              type="time"
              {...register('invoice_time')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse_id">المستودع</Label>
            <Select
              value={warehouseId}
              onValueChange={(value) => setValue('warehouse_id', value)}
            >
              <SelectTrigger className={errors.warehouse_id ? 'border-red-500' : ''}>
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
              <p className="text-red-500 text-sm">{errors.warehouse_id.message}</p>
            )}
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="ملاحظات إضافية"
              className="min-h-[100px]"
            />
          </div>
        </div>

        {/* Medicine Items Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">المواد الطبية</h3>
          
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Label htmlFor="medicine_id">الدواء</Label>
                  <Select
                    value={newItem.medicine_id}
                    onValueChange={(value) => setNewItem({ ...newItem, medicine_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدواء" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((medicine) => (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {medicine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="unit_id">الوحدة</Label>
                  <Select
                    value={newItem.unit_id}
                    onValueChange={(value) => setNewItem({ ...newItem, unit_id: value })}
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
                </div>
                
                <div>
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="الكمية"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">السعر</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                    placeholder="السعر"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> إضافة
                  </Button>
                </div>
              </div>
              
              {items.length > 0 && (
                <div className="border rounded-md p-4 mt-4">
                  <h4 className="font-medium mb-2">المواد المضافة</h4>
                  <div className="space-y-2">
                    {items.map((item, index) => {
                      const medicineName = medicines.find(m => m.id === item.medicine_id)?.name || '';
                      const unitName = units.find(u => u.id === item.unit_id)?.unit_name || '';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div>
                            <span className="font-medium">{medicineName}</span>
                            <span className="text-sm text-muted-foreground"> - {item.quantity} {unitName} × {item.price} = {item.quantity * item.price}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-right">
                    <p className="font-medium">
                      المجموع: {items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">المصروفات (اختياري)</h3>
          
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="expense_type_id">نوع المصروف</Label>
                  <Select
                    value={newExpense.expense_type_id}
                    onValueChange={(value) => setNewExpense({ ...newExpense, expense_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="المبلغ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="account_name">اسم الحساب (اختياري)</Label>
                  <Input
                    id="account_name"
                    value={newExpense.account_name || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, account_name: e.target.value })}
                    placeholder="اسم الحساب"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddExpense} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> إضافة
                  </Button>
                </div>
              </div>
              
              {expenses.length > 0 && (
                <div className="border rounded-md p-4 mt-4">
                  <h4 className="font-medium mb-2">المصروفات المضافة</h4>
                  <div className="space-y-2">
                    {expenses.map((expense, index) => {
                      const typeName = expenseTypes.find(t => t.id === expense.expense_type_id)?.name || '';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div>
                            <span className="font-medium">{typeName}</span>
                            <span className="text-sm text-muted-foreground"> - {expense.amount} {expense.account_name ? `(${expense.account_name})` : ''}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExpense(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-right">
                    <p className="font-medium">
                      المجموع: {expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/farmer/medicine-invoices')}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إنشاء الفاتورة
          </Button>
        </div>
      </form>
    </div>
  );
}