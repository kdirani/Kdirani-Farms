'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MedicineInvoice } from '@/actions/medicine-invoice.actions';
import { MedicineItem, deleteMedicineItem } from '@/actions/medicine-item.actions';
import { MedicineExpense, deleteMedicineExpense } from '@/actions/medicine-expense.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MedicineInvoiceDetailViewProps {
  invoice: MedicineInvoice;
  items: MedicineItem[];
  expenses: MedicineExpense[];
}

export function MedicineInvoiceDetailView({ invoice, items, expenses }: MedicineInvoiceDetailViewProps) {
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setDeletingItem(id);
    const result = await deleteMedicineItem(id);
    if (result.success) {
      toast.success('Item deleted successfully');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete item');
    }
    setDeletingItem(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    setDeletingExpense(id);
    const result = await deleteMedicineExpense(id);
    if (result.success) {
      toast.success('Expense deleted successfully');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete expense');
    }
    setDeletingExpense(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/medicines-invoices">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Medicine Invoice {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(invoice.invoice_date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Invoice Information */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                <p className="text-lg font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                <p className="text-lg">{format(new Date(invoice.invoice_date), 'MMMM dd, yyyy')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warehouse</label>
                {invoice.warehouse ? (
                  <div>
                    <p className="text-lg font-semibold">{invoice.warehouse.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.warehouse.farm_name}</p>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">Not assigned</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Poultry Status</label>
                {invoice.poultry_status ? (
                  <p className="text-lg font-semibold">{invoice.poultry_status.status_name}</p>
                ) : (
                  <p className="text-lg text-muted-foreground">Not specified</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                <p className="text-2xl font-bold text-primary">${invoice.total_value.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <p className="text-base mt-1">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicine Items */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medicine items added yet
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Admin Day</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.medicine_name || '-'}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.unit_name || '-'}</TableCell>
                      <TableCell className="text-right">${item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">${item.value.toLocaleString()}</TableCell>
                      <TableCell>{item.administration_day || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingItem === item.id}
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
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses added yet
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
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deletingExpense === expense.id}
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
      </Card>
    </div>
  );
}
