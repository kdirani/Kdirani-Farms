'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoice } from '@/actions/invoice.actions';
import { createInvoiceItem } from '@/actions/invoice-item.actions';
import { createInvoiceExpense } from '@/actions/invoice-expense.actions';
import { getWarehousesForMaterials } from '@/actions/material.actions';
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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const invoiceSchema = z.object({
  invoice_type: z.enum(['buy', 'sell']),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
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
  const [activeTab, setActiveTab] = useState('info');
  
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
    setIsLoading(true);
    try {
      // Create invoice first
      const invoiceResult = await createInvoice(data);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        toast.error(invoiceResult.error || 'Failed to create invoice');
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

      toast.success('Invoice created successfully with items and expenses');
      reset();
      setItems([]);
      setExpenses([]);
      setActiveTab('info');
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (item: InvoiceItemInput) => {
    setItems([...items, item]);
    toast.success('Item added to invoice');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Item removed');
  };

  const addExpense = (expense: InvoiceExpenseInput) => {
    setExpenses([...expenses, expense]);
    toast.success('Expense added to invoice');
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    toast.success('Expense removed');
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

  const handleAddItem = () => {
    if (!newItem.unit_id) {
      toast.error('Unit is required for item');
      return;
    }
    if (!newItem.quantity || newItem.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (newItem.price === undefined || newItem.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    addItem(newItem as InvoiceItemInput);
    setNewItem({ quantity: 1, price: 0 });
  };

  const handleAddExpense = () => {
    if (!newExpense.expense_type_id) {
      toast.error('Expense type is required');
      return;
    }
    if (newExpense.amount === undefined || newExpense.amount < 0) {
      toast.error('Amount cannot be negative');
      return;
    }

    addExpense(newExpense as InvoiceExpenseInput);
    setNewExpense({ amount: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Add invoice information, items, and expenses
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_type">Invoice Type *</Label>
              <Select
                value={invoiceType}
                onValueChange={(value: 'buy' | 'sell') => setValue('invoice_type', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              {errors.invoice_type && (
                <p className="text-sm text-destructive">{errors.invoice_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date *</Label>
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
            <Label htmlFor="invoice_number">Invoice Number *</Label>
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
            <Label htmlFor="client_id">Client (Optional)</Label>
            <Select
              value={clientId}
              onValueChange={(value) => setValue('client_id', value === 'none' ? undefined : value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Invoice Items Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Invoice Items ({items.length})</h3>
              
              {/* Add Item Form */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                <Select
                  value={newItem.material_name_id || 'none'}
                  onValueChange={(value) => setNewItem({ ...newItem, material_name_id: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.material_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Price"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                />
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {materials.find(m => m.id === item.material_name_id)?.material_name || 'Item'} - 
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
              <h3 className="text-lg font-semibold mb-4">Invoice Expenses ({expenses.length})</h3>
              
              {/* Add Expense Form */}
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

              {/* Expenses List */}
              {expenses.length > 0 && (
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {expenseTypes.find(e => e.id === expense.expense_type_id)?.name || 'Expense'}
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
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          )}

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
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
