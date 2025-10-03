'use client';

import { useState } from 'react';
import { deleteInvoice, Invoice } from '@/actions/invoice.actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DeleteInvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteInvoiceDialog({ invoice, open, onOpenChange }: DeleteInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteInvoice(invoice.id);
      
      if (result.success) {
        toast.success('تم حذف الفاتورة بنجاح');
        onOpenChange(false);

        // Delay page reload to allow user to see success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || 'فشل في حذف الفاتورة');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            حذف الفاتورة
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ سيؤدي ذلك أيضًا إلى حذف جميع البنود والمصروفات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">رقم الفاتورة:</span>
            <span className="text-sm">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">النوع:</span>
            <span className="text-sm capitalize">{invoice.invoice_type === 'buy' ? 'شراء' : 'بيع'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">التاريخ:</span>
            <span className="text-sm">{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
          </div>
          {invoice.client && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">العميل:</span>
              <span className="text-sm">{invoice.client.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium">القيمة الصافية:</span>
            <span className="text-sm font-semibold">${invoice.net_value.toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حذف الفاتورة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
