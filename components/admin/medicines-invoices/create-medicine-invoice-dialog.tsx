'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createMedicineInvoice } from '@/actions/medicine-invoice.actions';
import { createMedicineItem } from '@/actions/medicine-item.actions';
import { createMedicineExpense } from '@/actions/medicine-expense.actions';
import { createMedicineConsumptionAttachment } from '@/actions/medicine-consumption-attachment.actions';
import { getWarehousesForMaterials } from '@/actions/material.actions';
import { getMedicines } from '@/actions/medicine.actions';
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

const medicineInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  invoice_date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
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

interface CreateMedicineInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMedicineInvoiceDialog({ open, onOpenChange }: CreateMedicineInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; farm_name: string }>>([]);
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [items, setItems] = useState<MedicineItemInput[]>([]);
  const [expenses, setExpenses] = useState<MedicineExpenseInput[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  
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
    if (open) {
      loadData();
      const invoiceNum = `MED-${Date.now()}`;
      setValue('invoice_number', invoiceNum);
      setItems([]);
      setExpenses([]);
      setNewItem({ quantity: 0, price: 0 });
      setNewExpense({ amount: 0 });
    }
  }, [open]);

  const loadData = async () => {
    const [warehousesResult, medicinesResult, unitsResult, expenseTypesResult] = await Promise.all([
      getWarehousesForMaterials(),
      getMedicines(),
      getMeasurementUnits(),
      getExpenseTypes(),
    ]);

    if (warehousesResult.success && warehousesResult.data) {
      setWarehouses(warehousesResult.data);
    }
    if (medicinesResult.success && medicinesResult.data) {
      setMedicines(medicinesResult.data);
    }
    if (unitsResult.success && unitsResult.data) {
      setUnits(unitsResult.data);
    }
    if (expenseTypesResult.success && expenseTypesResult.data) {
      setExpenseTypes(expenseTypesResult.data);
    }
  };

  const onSubmit = async (data: MedicineInvoiceFormData) => {
    setIsLoading(true);
    try {
      const invoiceResult = await createMedicineInvoice(data);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        toast.error(invoiceResult.error || 'فشل في إنشاء فاتورة الأدوية');
        setIsLoading(false);
        return;
      }

      const invoiceId = invoiceResult.data.id;

      for (const item of items) {
        await createMedicineItem({
          consumption_invoice_id: invoiceId,
          ...item,
        });
      }

      for (const expense of expenses) {
        await createMedicineExpense({
          consumption_invoice_id: invoiceId,
          ...expense,
        });
      }

      // Upload attachments
      if (attachmentFiles.length > 0) {
        for (const uploadedFile of attachmentFiles) {
          const attachmentResult = await createMedicineConsumptionAttachment(
            invoiceId,
            uploadedFile.file
          );

          if (!attachmentResult.success) {
            toast.warning(`تم حفظ الفاتورة ولكن فشل رفع الملف: ${uploadedFile.file.name}`);
          }
        }
      }

      toast.success('تم إنشاء فاتورة الأدوية بنجاح');
      reset();
      setItems([]);
      setExpenses([]);
      setAttachmentFiles([]);
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const [newItem, setNewItem] = useState<Partial<MedicineItemInput>>({
    quantity: 0,
    price: 0,
  });
  const [newExpense, setNewExpense] = useState<Partial<MedicineExpenseInput>>({
    amount: 0,
  });

  const handleAddItem = () => {
    if (!newItem.medicine_id || !newItem.unit_id) {
      toast.error('الدواء والوحدة مطلوبة');
      return;
    }
    if (newItem.quantity === undefined || newItem.quantity <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    setItems([...items, newItem as MedicineItemInput]);
    setNewItem({ quantity: 0, price: 0 });
    toast.success('تم إضافة الدواء');
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

    setExpenses([...expenses, newExpense as MedicineExpenseInput]);
    setNewExpense({ amount: 0 });
    toast.success('تم إضافة المصروف');
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return itemsTotal + expensesTotal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة استهلاك أدوية</DialogTitle>
          <DialogDescription>
            إضافة معلومات الفاتورة، عناصر الأدوية، والمصاريف
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
              <Label htmlFor="invoice_date">تاريخ الفاتورة *</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register('invoice_date')}
                disabled={isLoading}
              />
              {errors.invoice_date && (
                <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
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

          {/* Medicine Items Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">عناصر الأدوية ({items.length})</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="col-span-2">
                  <Combobox
                    options={medicines.map((m) => ({
                      value: m.id,
                      label: m.name,
                    }))}
                    value={newItem.medicine_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, medicine_id: value })}
                    placeholder="الدواء"
                    searchPlaceholder="البحث عن الأدوية..."
                    emptyText="لم يتم العثور على أدوية"
                  />
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
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="السعر"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  />
                  <Button type="button" size="sm" onClick={handleAddItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {medicines.find(m => m.id === item.medicine_id)?.name} - 
                        {item.quantity} {units.find(u => u.id === item.unit_id)?.unit_name} @ ${item.price}
                        <strong className="ml-2">${(item.quantity * item.price).toFixed(2)}</strong>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItems(items.filter((_, i) => i !== index));
                          toast.success('تم حذف العنصر');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medicine Expenses Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">المصاريف ({expenses.length})</h3>
              
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
                        onClick={() => {
                          setExpenses(expenses.filter((_, i) => i !== index));
                          toast.success('تم حذف المصروف');
                        }}
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

          {/* Total */}
          {(items.length > 0 || expenses.length > 0) && (
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي تقريبي</p>
                <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          )}

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
              إنشاء فاتورة أدوية
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
