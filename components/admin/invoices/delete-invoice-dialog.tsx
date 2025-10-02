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
        toast.success('Invoice deleted successfully');
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
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
            Delete Invoice
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this invoice? This will also delete all associated items and expenses. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Invoice #:</span>
            <span className="text-sm">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Type:</span>
            <span className="text-sm capitalize">{invoice.invoice_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Date:</span>
            <span className="text-sm">{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
          </div>
          {invoice.client && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Client:</span>
              <span className="text-sm">{invoice.client.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium">Net Value:</span>
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
