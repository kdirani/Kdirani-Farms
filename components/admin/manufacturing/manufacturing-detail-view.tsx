'use client';

import Link from 'next/link';
import { ManufacturingInvoice } from '@/actions/manufacturing.actions';
import { ManufacturingItem, deleteManufacturingItem } from '@/actions/manufacturing-item.actions';
import { ManufacturingExpense, deleteManufacturingExpense } from '@/actions/manufacturing-expense.actions';
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
import { useState } from 'react';
import { ManufacturingAttachmentsSection } from './manufacturing-attachments-section';

interface ManufacturingDetailViewProps {
  invoice: ManufacturingInvoice;
  items: ManufacturingItem[];
  expenses: ManufacturingExpense[];
}

export function ManufacturingDetailView({ invoice, items, expenses }: ManufacturingDetailViewProps) {
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setDeletingItem(id);
    const result = await deleteManufacturingItem(id);
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
    const result = await deleteManufacturingExpense(id);
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
        <Link href="/admin/manufacturing">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manufacturing Invoice {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(invoice.manufacturing_date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Invoice Information */}
      <Card>
        <CardHeader>
          <CardTitle>Manufacturing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                <p className="text-lg font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Manufacturing Date</label>
                <p className="text-lg">{format(new Date(invoice.manufacturing_date), 'MMMM dd, yyyy')}</p>
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
                <label className="text-sm font-medium text-muted-foreground">Blend Name</label>
                <p className="text-lg">{invoice.blend_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Output Material</label>
                {invoice.material_name ? (
                  <div>
                    <p className="text-lg font-semibold">{invoice.material_name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.unit_name}</p>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">Not specified</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Output Quantity</label>
                <p className="text-lg font-semibold">{invoice.quantity.toLocaleString()}</p>
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

      {/* Input Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Input Materials ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No input materials added yet
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Blend Count</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.material_name || '-'}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.unit_name || '-'}</TableCell>
                      <TableCell className="text-right">{item.blend_count}</TableCell>
                      <TableCell className="text-right">{item.weight ? item.weight.toLocaleString() : '-'}</TableCell>
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

      {/* Manufacturing Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Manufacturing Expenses ({expenses.length})</CardTitle>
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

      {/* Manufacturing Attachments */}
      <ManufacturingAttachmentsSection invoiceId={invoice.id} />

      {/* Summary */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xl font-bold">
              <span>Total Manufacturing Expenses:</span>
              <span className="text-primary">
                ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
