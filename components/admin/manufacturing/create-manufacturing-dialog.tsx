'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createManufacturingInvoice } from '@/actions/manufacturing.actions';
import { createManufacturingItem } from '@/actions/manufacturing-item.actions';
import { createManufacturingExpense } from '@/actions/manufacturing-expense.actions';
import { createManufacturingAttachment } from '@/actions/manufacturing-attachment.actions';
import { getWarehousesForMaterials } from '@/actions/material.actions';
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
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const manufacturingSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  manufacturing_date: z.string().min(1, 'Manufacturing date is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  blend_name: z.string().optional(),
  material_name_id: z.string().optional(),
  unit_id: z.string().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
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
      quantity: 0,
    },
  });

  const warehouseId = watch('warehouse_id');
  const materialNameId = watch('material_name_id');
  const unitId = watch('unit_id');

  useEffect(() => {
    if (open) {
      loadData();
      const invoiceNum = `MFG-${Date.now()}`;
      setValue('invoice_number', invoiceNum);
      setItems([]);
      setExpenses([]);
      setNewItem({ quantity: 0, blend_count: 1 });
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
      const invoiceResult = await createManufacturingInvoice(data);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        toast.error(invoiceResult.error || 'Failed to create manufacturing invoice');
        setIsLoading(false);
        return;
      }

      const invoiceId = invoiceResult.data.id;

      for (const item of items) {
        await createManufacturingItem({
          manufacturing_invoice_id: invoiceId,
          ...item,
        });
      }

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
            toast.warning(`Invoice saved but failed to upload file: ${uploadedFile.file.name}`);
          }
        }
      }

      toast.success('Manufacturing invoice created successfully');
      reset();
      setItems([]);
      setExpenses([]);
      setAttachmentFiles([]);
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      toast.error('An unexpected error occurred');
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
  });
  const [newExpense, setNewExpense] = useState<Partial<ManufacturingExpenseInput>>({
    amount: 0,
  });

  const handleAddItem = () => {
    if (!newItem.material_name_id || !newItem.unit_id) {
      toast.error('Material and unit are required');
      return;
    }
    if (newItem.quantity === undefined || newItem.quantity < 0) {
      toast.error('Valid quantity is required');
      return;
    }

    addItem(newItem as ManufacturingItemInput);
    setNewItem({ quantity: 0, blend_count: 1 });
  };

  const handleAddExpense = () => {
    if (!newExpense.expense_type_id) {
      toast.error('Expense type is required');
      return;
    }
    if (newExpense.amount === undefined || newExpense.amount < 0) {
      toast.error('Valid amount is required');
      return;
    }

    addExpense(newExpense as ManufacturingExpenseInput);
    setNewExpense({ amount: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manufacturing Invoice</DialogTitle>
          <DialogDescription>
            Add manufacturing information, input items, and expenses
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number *</Label>
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
              <Label htmlFor="manufacturing_date">Manufacturing Date *</Label>
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
            <Label htmlFor="warehouse_id">Warehouse *</Label>
            <Select
              value={warehouseId}
              onValueChange={(value) => setValue('warehouse_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
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
              <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="blend_name">Blend Name</Label>
            <Input
              id="blend_name"
              placeholder="e.g., Feed Mix A"
              {...register('blend_name')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_name_id">Output Material</Label>
              <Select
                value={materialNameId}
                onValueChange={(value) => setValue('material_name_id', value === 'none' ? undefined : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No material</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.material_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit</Label>
              <Select
                value={unitId}
                onValueChange={(value) => setValue('unit_id', value === 'none' ? undefined : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No unit</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes"
              {...register('notes')}
              disabled={isLoading}
            />
          </div>

          {/* Manufacturing Items Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Input Materials ({items.length})</h3>
              
              <div className="grid grid-cols-6 gap-2 mb-4">
                <div className="col-span-2">
                  <Select
                    value={newItem.material_name_id || ''}
                    onValueChange={(value) => setNewItem({ ...newItem, material_name_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.material_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                />
                <Select
                  value={newItem.unit_id || ''}
                  onValueChange={(value) => setNewItem({ ...newItem, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.unit_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Blend Count"
                  value={newItem.blend_count || ''}
                  onChange={(e) => setNewItem({ ...newItem, blend_count: parseInt(e.target.value) })}
                />
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
              <h3 className="text-lg font-semibold mb-4">Manufacturing Expenses ({expenses.length})</h3>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="col-span-2">
                  <Select
                    value={newExpense.expense_type_id || ''}
                    onValueChange={(value) => setNewExpense({ ...newExpense, expense_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Expense Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
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

          {/* File Attachments */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Attachments</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload related files (images, PDFs, documents)
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
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Manufacturing Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
