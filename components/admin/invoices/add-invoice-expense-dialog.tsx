'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoiceExpense } from '@/actions/invoice-expense.actions';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const expenseSchema = z.object({
  expense_type_id: z.string().min(1, 'Expense type is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  account_name: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface AddInvoiceExpenseDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInvoiceExpenseDialog({ invoiceId, open, onOpenChange }: AddInvoiceExpenseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const expenseTypeId = watch('expense_type_id');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const result = await getExpenseTypes();
    if (result.success && result.data) {
      setExpenseTypes(result.data);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true);
    try {
      const result = await createInvoiceExpense({
        invoice_id: invoiceId,
        expense_type_id: data.expense_type_id,
        amount: data.amount,
        account_name: data.account_name,
      });
      
      if (result.success) {
        toast.success('Expense added successfully');
        reset();
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to add expense');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Invoice Expense</DialogTitle>
          <DialogDescription>
            Add an additional expense to this invoice
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense_type_id">Expense Type *</Label>
            <Combobox
              options={expenseTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              value={expenseTypeId}
              onValueChange={(value) => setValue('expense_type_id', value)}
              placeholder="Select expense type"
              searchPlaceholder="Search expense types..."
              emptyText="No expense types found"
              disabled={isLoading}
            />
            {errors.expense_type_id && (
              <p className="text-sm text-destructive">{errors.expense_type_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name</Label>
            <Input
              id="account_name"
              placeholder="Optional account name"
              {...register('account_name')}
              disabled={isLoading}
            />
          </div>

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
              Add Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
