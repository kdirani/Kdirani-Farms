'use client';

import { Invoice } from '@/actions/invoice.actions';
import { InvoiceItem } from '@/actions/invoice-item.actions';
import { InvoiceExpense } from '@/actions/invoice-expense.actions';
import { formatDate, formatCurrency } from '@/lib/utils';
import { forwardRef } from 'react';

interface InvoicePrintableProps {
  invoice: Invoice;
  items?: InvoiceItem[];
  expenses?: InvoiceExpense[];
}

export const InvoicePrintable = forwardRef<HTMLDivElement, InvoicePrintableProps>(
  ({ invoice, items = [], expenses = [] }, ref) => {
    return (
      <div ref={ref} className="print-container p-6 bg-white" dir="rtl">
        <div className="invoice-header text-center mb-6">
          <img src="/logos/logo-alqudairani.svg" alt="شعار الشركة" className="h-16 mx-auto mb-2" />
          <p>{invoice.invoice_type === 'buy' ? 'فاتورة شراء' : 'فاتورة بيع'} - {invoice.invoice_number}</p>
        </div>
        
        <div className="invoice-info grid grid-cols-2 gap-4 mb-6 border rounded-md p-4">
          <div>
            <div className="mb-2">
              <strong className="inline-block min-w-32">التاريخ:</strong> {formatDate(new Date(invoice.invoice_date))}
            </div>
            <div className="mb-2">
              <strong className="inline-block min-w-32">المستودع:</strong> {invoice.warehouse?.name || '-'}
            </div>
            <div className="mb-2">
              <strong className="inline-block min-w-32">المزرعة:</strong> {invoice.warehouse?.farm_name || '-'}
            </div>
          </div>
          <div>
            <div className="mb-2">
              <strong className="inline-block min-w-32">العميل:</strong> {invoice.client?.name || '-'}
            </div>
            <div className="mb-2">
              <strong className="inline-block min-w-32">نوع العميل:</strong> {invoice.client?.type || '-'}
            </div>
            <div className="mb-2">
              <strong className="inline-block min-w-32">الحالة:</strong> {invoice.checked ? 'تم التحقق' : 'قيد المراجعة'}
            </div>
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2 text-center">بنود الفاتورة</h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-right font-bold">المادة/الدواء/المنتج</th>
                <th className="border border-gray-300 p-3 text-right font-bold">وزن البيض</th>
                <th className="border border-gray-300 p-3 text-right font-bold">الكمية</th>
                <th className="border border-gray-300 p-3 text-right font-bold">الوحدة</th>
                <th className="border border-gray-300 p-3 text-right font-bold">السعر</th>
                <th className="border border-gray-300 p-3 text-right font-bold">القيمة</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-3">{item.material_name || item.medicine_name || '-'}</td>
                    <td className="border border-gray-300 p-3">{item.egg_weight || '-'}</td>
                    <td className="border border-gray-300 p-3">{item.quantity.toLocaleString('en-US')}</td>
                    <td className="border border-gray-300 p-3">{item.unit_name || '-'}</td>
                    <td className="border border-gray-300 p-3">{formatCurrency(item.price)}</td>
                    <td className="border border-gray-300 p-3">{formatCurrency(item.value)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border border-gray-300 p-3 text-center">لا توجد بيانات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {expenses.length > 0 && (
          <>
            <h2 className="text-lg font-bold mb-2 text-center">المصاريف</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-right font-bold">نوع المصروف</th>
                    <th className="border border-gray-300 p-3 text-right font-bold">الحساب</th>
                    <th className="border border-gray-300 p-3 text-right font-bold">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-3">{expense.expense_type_name || '-'}</td>
                      <td className="border border-gray-300 p-3">{expense.account_name || '-'}</td>
                      <td className="border border-gray-300 p-3">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        <div className="totals mr-0 ml-auto w-64 mt-6 text-right">
          <div className="flex justify-between py-1 font-bold">
            <span dir="ltr">{formatCurrency(invoice.total_items_value)}</span>
            <span>إجمالي قيمة العناصر:</span>
          </div>
          <div className="flex justify-between py-1 font-bold">
            <span dir="ltr">{formatCurrency(invoice.total_expenses_value)}</span>
            <span>إجمالي المصاريف:</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-300 mt-2">
            <span dir="ltr" className="text-primary">{formatCurrency(invoice.total_items_value + invoice.total_expenses_value)}</span>
            <span>القيمة الصافية:</span>
          </div>
        </div>
        
        {invoice.notes && (
          <div className="notes mt-6 pt-4 border-t">
            <h3 className="font-bold mb-2">ملاحظات:</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
        
        <div className="footer text-center mt-8 pt-4 border-t">
          <p className="text-sm text-muted-foreground">مزارع القديراني للدواجن - جميع الحقوق محفوظة</p>
        </div>
      </div>
    );
  }
);

InvoicePrintable.displayName = 'InvoicePrintable';