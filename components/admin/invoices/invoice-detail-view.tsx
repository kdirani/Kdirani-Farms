'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Invoice, toggleInvoiceStatus } from '@/actions/invoice.actions';
import { InvoiceItem } from '@/actions/invoice-item.actions';
import { InvoiceExpense } from '@/actions/invoice-expense.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils'; 
import { InvoiceItemsSection } from './invoice-items-section';
import { InvoiceExpensesSection } from './invoice-expenses-section';
import { InvoiceAttachmentsSection } from './invoice-attachments-section';
import { toast } from 'sonner';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  expenses: InvoiceExpense[];
}

export function InvoiceDetailView({ invoice, items, expenses }: InvoiceDetailViewProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const result = await toggleInvoiceStatus(invoice.id);
      if (result.success) {
        toast.success(
          result.data?.checked ? 'تم وضع علامة مدققة على الفاتورة' : 'تم إلغاء علامة التدقيق'
        );
        router.refresh();
      } else {
        toast.error(result.error || 'فشل تحديث حالة الفاتورة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الفاتورة');
    } finally {
      setIsToggling(false);
    }
  };

  const getTypeBadge = (type: 'buy' | 'sell') => {
    return type === 'buy' ? (
      <Badge variant="default">فاتورة شراء</Badge>
    ) : (
      <Badge variant="secondary">فاتورة بيع</Badge>
    );
  };

  const getStatusBadge = (checked: boolean) => {
    return checked ? (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        مدققة
      </Badge>
    ) : (
      <Badge variant="warning" className="gap-1">
        <XCircle className="h-3 w-3" />
        غير مدققة
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/invoices">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">فاتورة {invoice.invoice_number}</h1>
              {getTypeBadge(invoice.invoice_type)}
              {getStatusBadge(invoice.checked)}
            </div>
            <p className="text-muted-foreground mt-1">
              {format(new Date(invoice.invoice_date), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <Button
          onClick={handleToggleStatus}
          disabled={isToggling}
          variant={invoice.checked ? "outline" : "default"}
          className="gap-2"
        >
          {invoice.checked ? (
            <>
              <XCircle className="h-4 w-4" />
              إلغاء التدقيق
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              تعيين كمدققة
            </>
          )}
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
                <label className="text-sm font-medium text-muted-foreground">نوع الفاتورة</label>
                <p className="text-lg capitalize">{invoice.invoice_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ الفاتورة</label>
                <p className="text-lg">{format(new Date(invoice.invoice_date), 'MMMM dd, yyyy')}</p>
              </div>
              {invoice.invoice_time && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">وقت الفاتورة</label>
                  <p className="text-lg">{invoice.invoice_time}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">العميل</label>
                {invoice.client ? (
                  <div>
                    <p className="text-lg font-semibold">{invoice.client.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{invoice.client.type}</p>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">غير محدد</p>
                )}
              </div>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                <p className="text-base mt-1">{invoice.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <InvoiceItemsSection invoiceId={invoice.id} items={items} />

      {/* Invoice Expenses */}
      <InvoiceExpensesSection invoiceId={invoice.id} expenses={expenses} />

      {/* Invoice Attachments */}
      <InvoiceAttachmentsSection invoiceId={invoice.id} />

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الفاتورة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">إجمالي قيمة العناصر:</span>
              <span className="font-semibold">{formatCurrency(invoice.total_items_value)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-muted-foreground">إجمالي المصاريف:</span>
              <span className="font-semibold">{formatCurrency(invoice.total_expenses_value)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>القيمة الصافية:</span>
              <span className="text-primary">{formatCurrency(invoice.net_value)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
