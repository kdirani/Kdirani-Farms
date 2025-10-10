'use client';

import { MedicineInvoice, deleteMedicineInvoice } from '@/actions/medicine-invoice.actions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreateMedicineInvoiceDialog } from './create-medicine-invoice-dialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface MedicineInvoicesTableProps {
  invoices: MedicineInvoice[];
}
export function MedicineInvoicesTable({ invoices }: MedicineInvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    return (
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.warehouse?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف فاتورة ${invoiceNumber}؟`)) return;

    const result = await deleteMedicineInvoice(id);
    if (result.success) {
      toast.success('تم حذف فاتورة الأدوية بنجاح');
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف الفاتورة');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث في الفواتير..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إنشاء فاتورة أدوية
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>المستودع</TableHead>
              <TableHead className="text-right">القيمة الإجمالية</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  لم يتم العثور على فواتير أدوية
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {invoice.warehouse ? (
                      <div>
                        <div className="font-medium">{invoice.warehouse.name}</div>
                        <div className="text-xs text-muted-foreground">{invoice.warehouse.farm_name}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(invoice.total_value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/medicines-invoices/${invoice.id}`}>عرض التفاصيل</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                          className="text-destructive"
                        >
                          حذف الفاتورة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateMedicineInvoiceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
