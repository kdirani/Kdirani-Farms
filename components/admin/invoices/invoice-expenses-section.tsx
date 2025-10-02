'use client';

import { useState } from 'react';
import { InvoiceExpense, deleteInvoiceExpense } from '@/actions/invoice-expense.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddInvoiceExpenseDialog } from './add-invoice-expense-dialog';

interface InvoiceExpensesSectionProps {
  invoiceId: string;
  expenses: InvoiceExpense[];
}

export function InvoiceExpensesSection({ invoiceId, expenses }: InvoiceExpensesSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    setIsDeleting(expenseId);
    const result = await deleteInvoiceExpense(expenseId);
    
    if (result.success) {
      toast.success('Expense deleted successfully');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete expense');
    }
    setIsDeleting(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice Expenses</CardTitle>
            <CardDescription>Additional costs and expenses for this invoice</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses added yet. Click "Add Expense" to get started.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense Type</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.expense_type_name || '-'}</TableCell>
                    <TableCell>{expense.account_name || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">${expense.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                        disabled={isDeleting === expense.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddInvoiceExpenseDialog 
        invoiceId={invoiceId} 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
      />
    </Card>
  );
}
