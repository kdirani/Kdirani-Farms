'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { InvoiceItem } from '@/actions/invoice-item.actions';
import { Invoice } from '@/actions/invoice.actions';
import { InvoiceExpense } from '@/actions/invoice-expense.actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrintable } from './invoice-printable';

interface PrintInvoiceButtonProps {
  invoice: Invoice;
  items?: InvoiceItem[];
  expenses?: InvoiceExpense[];
}

export function PrintInvoiceButton({ invoice, items = [], expenses = [] }: PrintInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `فاتورة-${invoice.invoice_number}`,
    onAfterPrint: () => {
      // console.log('تمت الطباعة بنجاح');
      setIsOpen(false); // إغلاق النافذة المنبثقة بعد الطباعة
    },
    // removeAfterPrint: true, // إزالة iframe بعد الطباعة - خاصية غير مدعومة
    pageStyle: '@page { size: A4; margin: 10mm; }', // تنسيق الصفحة
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <Printer className="h-4 w-4 ml-1" />
          طباعة الفاتورة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            فاتورة {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>
        
        {/* استخدام المكون المنفصل للطباعة */}
        <InvoicePrintable 
          ref={printRef} 
          invoice={invoice} 
          items={items} 
          expenses={expenses} 
        />
        
        {/* زر الطباعة */}
        <div className="flex justify-center mt-6">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}