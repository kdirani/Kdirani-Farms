'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, FileText, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { MedicineAttachmentsSection } from './medicine-attachments-section';
import { EditMedicineInvoiceDialog } from './edit-medicine-invoice-dialog';

interface MedicineInvoiceDetailViewProps {
  invoice: MedicineInvoice;
  items: MedicineItem[];
  expenses: MedicineExpense[];
}

export function MedicineInvoiceDetailView({ invoice, items, expenses }: MedicineInvoiceDetailViewProps) {
  const router = useRouter();
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    setDeletingItem(id);
    const result = await deleteMedicineItem(id);
    if (result.success) {
      toast.success('تم حذف العنصر بنجاح');
      router.refresh();
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
      router.refresh();
    } else {
      toast.error(result.error || 'فشل في حذف المصروف');
    }
    setDeletingExpense(null);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        
        {/* Edit Button */}
        <Button onClick={() => setEditDialogOpen(true)} variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          تعديل الفاتورة
        </Button>
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
              <p className="text-base mt-1 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicine Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>عناصر الأدوية ({items.length})</CardTitle>
          {items.length > 0 && (
            <div className="text-sm text-muted-foreground">
              الإجمالي: <span className="font-semibold text-foreground">
                {formatCurrency(items.reduce((sum, item) => sum + item.value, 0))}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لم يتم إضافة أدوية بعد</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
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
                          className="hover:bg-destructive/10"
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>المصاريف ({expenses.length})</CardTitle>
          {expenses.length > 0 && (
            <div className="text-sm text-muted-foreground">
              الإجمالي: <span className="font-semibold text-foreground">
                {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لم يتم إضافة مصاريف بعد</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
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
                          className="hover:bg-destructive/10"
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

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">قيمة الأدوية</p>
              <p className="text-2xl font-bold">
                {formatCurrency(items.reduce((sum, item) => sum + item.value, 0))}
              </p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">المصاريف</p>
              <p className="text-2xl font-bold">
                {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
              </p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">الإجمالي الكلي</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(invoice.total_value)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medicine Attachments */}
      <MedicineAttachmentsSection invoiceId={invoice.id} />

      {/* Edit Dialog */}
      <EditMedicineInvoiceDialog 
        invoiceId={invoice.id}
        open={editDialogOpen} 
        onOpenChange={handleEditDialogClose} 
      />
    </div>
  );
}