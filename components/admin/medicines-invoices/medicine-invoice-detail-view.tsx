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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { MedicineAttachmentsSection } from './medicine-attachments-section';

interface MedicineInvoiceDetailViewProps {
  invoice: MedicineInvoice;
  items: MedicineItem[];
  expenses: MedicineExpense[];
}

export function MedicineInvoiceDetailView({ invoice, items, expenses }: MedicineInvoiceDetailViewProps) {
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    setDeletingItem(id);
    const result = await deleteMedicineItem(id);
    if (result.success) {
      toast.success('تم حذف العنصر بنجاح');
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف العنصر');
    }
    setDeletingItem(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    
    setDeletingExpense(id);
    const result = await deleteMedicineExpense(id);
    if (result.success) {
      toast.success('تم حذف المصروف بنجاح');
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف المصروف');
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
            فاتورة أدوية {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(invoice.invoice_date), 'dd MMMM، yyyy')}
            {invoice.invoice_time && ` - ${invoice.invoice_time}`}
          </p>
        </div>
      </div>

      {/* Invoice Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الفاتورة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم الفاتورة</label>
                <p className="text-lg font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ الفاتورة</label>
                <p className="text-lg">{format(new Date(invoice.invoice_date), 'dd MMMM، yyyy')}</p>
              </div>
              {invoice.invoice_time && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">وقت الفاتورة</label>
                  <p className="text-lg">{invoice.invoice_time}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">المستودع</label>
                {invoice.warehouse ? (
                  <div>
                    <p className="text-lg font-semibold">{invoice.warehouse.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.warehouse.farm_name}</p>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">غير محدد</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">حالة الدواجن</label>
                {invoice.poultry_status ? (
                  <p className="text-lg font-semibold">{invoice.poultry_status.status_name}</p>
                ) : (
                  <p className="text-lg text-muted-foreground">غير محددة</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">إجمالي القيمة</label>
                <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.total_value)}</p>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6">
              <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
              <p className="text-base mt-1">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicine Items */}
      <Card>
        <CardHeader>
          <CardTitle>عناصر الأدوية ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لم يتم إضافة أدوية بعد
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الدواء</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead>الوحدة</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead>يوم الإعطاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.medicine_name || '-'}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.unit_name || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.value)}</TableCell>
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
          <CardTitle>المصاريف ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لم يتم إضافة مصاريف بعد
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع المصروف</TableHead>
                    <TableHead>الحساب المقابل</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.expense_type_name || '-'}</TableCell>
                      <TableCell>{expense.account_name || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
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

      {/* Medicine Attachments */}
      <MedicineAttachmentsSection invoiceId={invoice.id} />
    </div>
  );
}
