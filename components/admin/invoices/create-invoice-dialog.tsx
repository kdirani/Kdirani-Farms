'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoice } from '@/actions/invoice.actions';
import { createInvoiceItem } from '@/actions/invoice-item.actions';
import { createInvoiceExpense } from '@/actions/invoice-expense.actions';
import { createInvoiceAttachment } from '@/actions/invoice-attachment.actions';
import { getWarehousesForMaterials, getMaterialInventory } from '@/actions/material.actions';
import { getClients } from '@/actions/client.actions';
import { getMaterialNames } from '@/actions/material-name.actions';
import { getMeasurementUnits } from '@/actions/unit.actions';
import { getEggWeights } from '@/actions/egg-weight.actions';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, PackageCheck, AlertTriangle } from 'lucide-react';

const invoiceSchema = z.object({
  invoice_type: z.enum(['buy', 'sell']),
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  invoice_date: z.string().min(1, 'تاريخ الفاتورة مطلوب'),
  warehouse_id: z.string().min(1, 'المستودع مطلوب'),
  client_id: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type InvoiceItemInput = {
  material_name_id?: string;
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

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; farm_name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; material_name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unit_name: string }>>([]);
  const [eggWeights, setEggWeights] = useState<Array<{ id: string; weight_range: string }>>([]);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [items, setItems] = useState<InvoiceItemInput[]>([]);
  const [expenses, setExpenses] = useState<InvoiceExpenseInput[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [currentItemInventory, setCurrentItemInventory] = useState<{ current_balance: number; unit_name: string } | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  
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
      invoice_type: 'buy',
      invoice_date: new Date().toISOString().split('T')[0],
    },
  });

  const invoiceType = watch('invoice_type');
  const warehouseId = watch('warehouse_id');
  const clientId = watch('client_id');

  useEffect(() => {
    if (open) {
      loadData();
      // Generate invoice number
      const invoiceNum = `INV-${Date.now()}`;
      setValue('invoice_number', invoiceNum);
      // Reset items and expenses
      setItems([]);
      setExpenses([]);
      setNewItem({ quantity: 1, price: 0 });
      setNewExpense({ amount: 0 });
    }
  }, [open]);

  const loadData = async () => {
    const [
      warehousesResult, 
      clientsResult, 
      materialsResult, 
      unitsResult, 
      eggWeightsResult,
      expenseTypesResult
    ] = await Promise.all([
      getWarehousesForMaterials(),
      getClients(),
      getMaterialNames(),
      getMeasurementUnits(),
      getEggWeights(),
      getExpenseTypes(),
    ]);

    if (warehousesResult.success && warehousesResult.data) {
      setWarehouses(warehousesResult.data);
    }
    if (clientsResult.success && clientsResult.data) {
      setClients(clientsResult.data);
    }
    if (materialsResult.success && materialsResult.data) {
      setMaterials(materialsResult.data);
    }
    if (unitsResult.success && unitsResult.data) {
      setUnits(unitsResult.data);
    }
    if (eggWeightsResult.success && eggWeightsResult.data) {
      setEggWeights(eggWeightsResult.data);
    }
    if (expenseTypesResult.success && expenseTypesResult.data) {
      setExpenseTypes(expenseTypesResult.data);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    // Validate that at least one item is added
    if (items.length === 0) {
      toast.error('يجب إضافة بند واحد على الأقل للفاتورة');
      return;
    }

    setIsLoading(true);
    try {
      // Create invoice first
      const invoiceResult = await createInvoice(data);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        toast.error(invoiceResult.error || 'فشل في إنشاء الفاتورة');
        setIsLoading(false);
        return;
      }

      const invoiceId = invoiceResult.data.id;

      // Add items
      for (const item of items) {
        await createInvoiceItem({
          invoice_id: invoiceId,
          ...item,
        });
      }

      // Add expenses
      for (const expense of expenses) {
        await createInvoiceExpense({
          invoice_id: invoiceId,
          ...expense,
        });
      }

      // Upload attachments
      if (attachmentFiles.length > 0) {
        for (const uploadedFile of attachmentFiles) {
          const attachmentResult = await createInvoiceAttachment(
            invoiceId,
            uploadedFile.file,
            data.invoice_type
          );

          if (!attachmentResult.success) {
            toast.warning(`تم حفظ الفاتورة ولكن فشل في رفع الملف: ${uploadedFile.file.name}`);
          }
        }
      }

      toast.success('تم إنشاء الفاتورة بنجاح مع البنود والمصروفات والمرفقات');
      reset();
      setItems([]);
      setExpenses([]);
      setAttachmentFiles([]);
      setActiveTab('info');
      onOpenChange(false);

      // Delay page reload to allow user to see success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (item: InvoiceItemInput) => {
    setItems([...items, item]);
    toast.success('تمت إضافة البند إلى الفاتورة');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('تم حذف البند');
  };

  const addExpense = (expense: InvoiceExpenseInput) => {
    setExpenses([...expenses, expense]);
    toast.success('تمت إضافة المصروف إلى الفاتورة');
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    toast.success('تم حذف المصروف');
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return itemsTotal + expensesTotal;
  };

  // Form states for adding items/expenses
  const [newItem, setNewItem] = useState<Partial<InvoiceItemInput>>({
    quantity: 1,
    price: 0,
  });
  const [newExpense, setNewExpense] = useState<Partial<InvoiceExpenseInput>>({
    amount: 0,
  });

  // Load inventory when material changes in new item form
  useEffect(() => {
    if (newItem.material_name_id && warehouseId && invoiceType === 'sell') {
      loadInventoryForItem(warehouseId, newItem.material_name_id);
    } else {
      setCurrentItemInventory(null);
    }
  }, [newItem.material_name_id, warehouseId, invoiceType]);

  const loadInventoryForItem = async (warehouseId: string, materialNameId: string) => {
    setLoadingInventory(true);
    const result = await getMaterialInventory(warehouseId, materialNameId);
    if (result.success && result.data) {
      setCurrentItemInventory(result.data);
    }
    setLoadingInventory(false);
  };

  const handleAddItem = () => {
    if (!newItem.unit_id) {
      toast.error('الوحدة مطلوبة');
      return;
    }
    if (!newItem.quantity || newItem.quantity <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من 0');
      return;
    }
    if (newItem.price === undefined || newItem.price < 0) {
      toast.error('السعر لا يمكن أن يكون سالباً');
      return;
    }

    // Validate inventory for sell invoices
    if (invoiceType === 'sell' && newItem.material_name_id && currentItemInventory) {
      if (currentItemInventory.current_balance <= 0) {
        toast.error('لا يوجد مخزون متاح لهذه المادة');
        return;
      }
      if (newItem.quantity > currentItemInventory.current_balance) {
        toast.error(`المخزون غير كافي. المتاح: ${currentItemInventory.current_balance} ${currentItemInventory.unit_name}`);
        return;
      }
    }

    addItem(newItem as InvoiceItemInput);
    setNewItem({ quantity: 1, price: 0 });
    setCurrentItemInventory(null);
  };

  const handleAddExpense = () => {
    if (!newExpense.expense_type_id) {
      toast.error('نوع المصروف مطلوب');
      return;
    }
    if (newExpense.amount === undefined || newExpense.amount < 0) {
      toast.error('المبلغ لا يمكن أن يكون سالباً');
      return;
    }

    addExpense(newExpense as InvoiceExpenseInput);
    setNewExpense({ amount: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
          <DialogDescription>
            إضافة معلومات الفاتورة والبنود والمصروفات
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_type">نوع الفاتورة *</Label>
              <Select
                value={invoiceType}
                onValueChange={(value: 'buy' | 'sell') => setValue('invoice_type', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">شراء</SelectItem>
                  <SelectItem value="sell">بيع</SelectItem>
                </SelectContent>
              </Select>
              {errors.invoice_type && (
                <p className="text-sm text-destructive">{errors.invoice_type.message}</p>
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
            <Label htmlFor="invoice_number">رقم الفاتورة *</Label>
            <Input
              id="invoice_number"
              placeholder="INV-001"
              {...register('invoice_number')}
              disabled={isLoading}
            />
            {errors.invoice_number && (
              <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
            )}
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
              searchPlaceholder="البحث في المستودعات..."
              emptyText="لا توجد مستودعات"
              disabled={isLoading}
            />
            {errors.warehouse_id && (
              <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">العميل (اختياري)</Label>
            <Combobox
              options={[
                { value: 'none', label: 'بدون عميل' },
                ...clients.map((client) => ({
                  value: client.id,
                  label: `${client.name} (${client.type})`,
                }))
              ]}
              value={clientId || 'none'}
              onValueChange={(value) => setValue('client_id', value === 'none' ? undefined : value)}
              placeholder="اختر العميل"
              searchPlaceholder="البحث في العملاء..."
              emptyText="لا يوجد عملاء"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              placeholder="ملاحظات اختيارية"
              {...register('notes')}
              disabled={isLoading}
            />
          </div>

          {/* Invoice Items Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">بنود الفاتورة ({items.length})</h3>
              
              {/* Add Item Form */}
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <Combobox
                      options={[
                        { value: 'none', label: '-' },
                        ...materials.map((m) => ({
                          value: m.id,
                          label: m.material_name,
                        }))
                      ]}
                      value={newItem.material_name_id || 'none'}
                      onValueChange={(value) => setNewItem({ ...newItem, material_name_id: value === 'none' ? undefined : value })}
                      placeholder="المادة"
                      searchPlaceholder="ابحث عن المواد..."
                      emptyText="لم يتم العثور على مواد"
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
                    searchPlaceholder="ابحث عن الوحدات..."
                    emptyText="لم يتم العثور على وحدات"
                  />
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
                
                {/* Show inventory for sell invoices */}
                {invoiceType === 'sell' && newItem.material_name_id && newItem.material_name_id !== 'none' && (
                  <div>
                    {loadingInventory ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>جاري تحميل المخزون...</span>
                      </div>
                    ) : currentItemInventory ? (
                      <Alert variant={currentItemInventory.current_balance > 0 ? "default" : "destructive"}>
                        <PackageCheck className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>المخزون المتاح:</span>
                          <span className="font-bold">
                            {currentItemInventory.current_balance} {currentItemInventory.unit_name}
                          </span>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    
                    {currentItemInventory && newItem.quantity && newItem.quantity > currentItemInventory.current_balance && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          الكمية المطلوبة أكبر من المخزون المتاح
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {materials.find(m => m.id === item.material_name_id)?.material_name || 'البند'} - 
                        {item.quantity} {units.find(u => u.id === item.unit_id)?.unit_name} @ ${item.price}
                        <strong className="ml-2">${(item.quantity * item.price).toFixed(2)}</strong>
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

          {/* Invoice Expenses Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">مصروفات الفاتورة ({expenses.length})</h3>
              
              {/* Add Expense Form */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="col-span-2">
                  <Combobox
                    options={expenseTypes.map((e) => ({
                      value: e.id,
                      label: e.name,
                    }))}
                    value={newExpense.expense_type_id || ''}
                    onValueChange={(value) => setNewExpense({ ...newExpense, expense_type_id: value })}
                    placeholder="نوع المصروف"
                    searchPlaceholder="البحث في أنواع المصروفات..."
                    emptyText="لا توجد أنواع مصروفات"
                  />
                </div>
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

              {/* Expenses List */}
              {expenses.length > 0 && (
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {expenseTypes.find(e => e.id === expense.expense_type_id)?.name || 'المصروف'}
                        <strong className="ml-2">${expense.amount.toFixed(2)}</strong>
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

          {/* Total */}
          {(items.length > 0 || expenses.length > 0) && (
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">الإجمالي المقدر</p>
                <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* File Attachments */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">المرفقات</h3>
              <p className="text-sm text-muted-foreground mb-4">
                رفع الملفات ذات الصلة (صور، ملفات PDF، مستندات)
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
              إنشاء الفاتورة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
