'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createMedicineInvoice } from '@/actions/medicine-invoice.actions';
import { createMedicineItem } from '@/actions/medicine-item.actions';
import { createMedicineExpense } from '@/actions/medicine-expense.actions';
import { createMedicineConsumptionAttachment } from '@/actions/medicine-consumption-attachment.actions';
import { getWarehousesForMaterials, getMaterialInventory } from '@/actions/material.actions';
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
import { Loader2, Plus, Trash2, PackageCheck, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [medicineInventory, setMedicineInventory] = useState<{ current_balance: number; unit_name: string } | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  
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

  // Define newItem and newExpense states before using them in useEffect
  const [newItem, setNewItem] = useState<Partial<MedicineItemInput>>({
    quantity: 0,
    price: 0,
  });
  const [newExpense, setNewExpense] = useState<Partial<MedicineExpenseInput>>({
    amount: 0,
    account_name: '',
  });

  // Load inventory when medicine or warehouse changes
  useEffect(() => {
    if (newItem.medicine_id && warehouseId) {
      loadMedicineInventory(warehouseId, newItem.medicine_id);
    } else {
      setMedicineInventory(null);
    }
  }, [newItem.medicine_id, warehouseId]);

  const loadMedicineInventory = async (warehouseId: string, medicineId: string) => {
    setLoadingInventory(true);
    const result = await getMaterialInventory(warehouseId, medicineId);
    if (result.success && result.data) {
      setMedicineInventory(result.data);
    } else {
      setMedicineInventory(null);
    }
    setLoadingInventory(false);
  };

  useEffect(() => {
    if (open) {
      loadData();
      const invoiceNum = `MED-${Date.now()}`;
      setValue('invoice_number', invoiceNum);
      // Set current time
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setValue('invoice_time', `${hours}:${minutes}`);
      setItems([]);
      setExpenses([]);
      setNewItem({ quantity: 0, price: 0 });
      setNewExpense({ amount: 0, account_name: '' });
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
      
      // Revalidation is handled by server actions (revalidatePath)
      // No need for full page reload
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.medicine_id || !newItem.unit_id) {
      toast.error('الدواء والوحدة مطلوبة');
      return;
    }
    if (newItem.quantity === undefined || newItem.quantity <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    // Check if enough inventory available
    if (medicineInventory) {
      if (medicineInventory.current_balance <= 0) {
        toast.error('لا يوجد مخزون متاح لهذا الدواء');
        return;
      }
      if (newItem.quantity > medicineInventory.current_balance) {
        toast.error(`المخزون غير كافي. المتاح: ${medicineInventory.current_balance} ${medicineInventory.unit_name}`);
        return;
      }
    }

    setItems([...items, newItem as MedicineItemInput]);
    setNewItem({ quantity: 0, price: 0 });
    setMedicineInventory(null);
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
    setNewExpense({ amount: 0, account_name: '' });
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
          <div className="grid grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="invoice_time">وقت الفاتورة</Label>
              <Input
                id="invoice_time"
                type="time"
                {...register('invoice_time')}
                disabled={isLoading}
              />
              {errors.invoice_time && (
                <p className="text-sm text-destructive">{errors.invoice_time.message}</p>
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
              
              {/* Column Labels */}
              <div className="grid grid-cols-6 gap-2 text-sm font-medium text-muted-foreground mb-2">
                <div className="col-span-2">الدواء</div>
                <div>الكمية</div>
                <div>الوحدة</div>
                <div>السعر</div>
                <div>القيمة</div>
                <div></div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <Combobox
                      options={medicines.map((m) => ({
                        value: m.id,
                        label: m.name,
                      }))}
                      value={newItem.medicine_id || ''}
                      onValueChange={(value) => setNewItem({ ...newItem, medicine_id: value })}
                      placeholder="اختر الدواء"
                      searchPlaceholder="البحث عن الأدوية..."
                      emptyText="لم يتم العثور على أدوية"
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
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
                    placeholder="اختر الوحدة"
                    searchPlaceholder="البحث عن الوحدات..."
                    emptyText="لم يتم العثور على وحدات"
                  />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  />
                  <Input
                    type="text"
                    value={formatCurrency((newItem.quantity || 0) * (newItem.price || 0))}
                    readOnly
                    disabled
                    className="bg-muted text-center font-semibold"
                  />
                  <Button type="button" size="sm" onClick={handleAddItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Show inventory information */}
                {newItem.medicine_id && warehouseId && (
                  <div className="bg-muted p-3 rounded-md">
                    {loadingInventory ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>جاري تحميل معلومات المخزون...</span>
                      </div>
                    ) : medicineInventory ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <PackageCheck className={`h-5 w-5 ${
                            medicineInventory.current_balance <= 0 || 
                            (newItem.quantity && newItem.quantity > medicineInventory.current_balance)
                              ? 'text-destructive' 
                              : 'text-primary'
                          }`} />
                          <span className="text-sm font-medium">
                            المخزون المتاح: <strong>{medicineInventory.current_balance}</strong> {medicineInventory.unit_name}
                          </span>
                        </div>
                        {!!(newItem.quantity && newItem.quantity > medicineInventory.current_balance) && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              الكمية المطلوبة أكبر من المخزون المتاح
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-5 w-5" />
                        <span>لا يوجد مخزون لهذا الدواء في المستودع</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">العناصر المضافة:</div>
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">
                            {medicines.find(m => m.id === item.medicine_id)?.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          الكمية: {item.quantity} {units.find(u => u.id === item.unit_id)?.unit_name}
                          <span className="mx-2">•</span>
                          السعر: {formatCurrency(item.price)}
                          <span className="mx-2">•</span>
                          <span className="font-semibold text-foreground">
                            القيمة: {formatCurrency(item.quantity * item.price)}
                          </span>
                        </div>
                      </div>
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
              
              <div className="grid grid-cols-4 gap-2 mb-4">
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
                <Input
                  type="text"
                  placeholder="الحساب المقابل (اختياري)"
                  value={newExpense.account_name || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, account_name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="المبلغ"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                />
                <Button type="button" size="sm" onClick={handleAddExpense}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {expenses.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">المصاريف المضافة:</div>
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">
                            {expenseTypes.find(e => e.id === expense.expense_type_id)?.name}
                          </span>
                          {expense.account_name && (
                            <span className="text-muted-foreground mx-2">
                              ({expense.account_name})
                            </span>
                          )}
                          <strong className="ml-2">{formatCurrency(expense.amount)}</strong>
                        </div>
                      </div>
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

          {/* Totals Summary */}
          {(items.length > 0 || expenses.length > 0) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">ملخص الفاتورة</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2">
                    <Label className="text-muted-foreground">إجمالي قيمة العناصر</Label>
                    <Input
                      value={formatCurrency(items.reduce((sum, item) => sum + (item.quantity * item.price), 0))}
                      readOnly
                      disabled
                      className="w-48 text-right font-semibold bg-background"
                    />
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <Label className="text-muted-foreground">إجمالي المصاريف</Label>
                    <Input
                      value={formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                      readOnly
                      disabled
                      className="w-48 text-right font-semibold bg-background"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <Label className="text-lg font-bold">القيمة الصافية (الإجمالي)</Label>
                    <Input
                      value={formatCurrency(calculateTotal())}
                      readOnly
                      disabled
                      className="w-48 text-right text-lg font-bold bg-background border-2 border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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
