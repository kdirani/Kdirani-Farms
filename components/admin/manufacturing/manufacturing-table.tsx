'use client';

import { ManufacturingInvoice, deleteManufacturingInvoice } from '@/actions/manufacturing.actions';
import { toast } from 'sonner';

import { formatDate } from '@/lib/utils';
import { CreateManufacturingDialog } from './create-manufacturing-dialog';
import { MoreHorizontal, Search, Plus } from 'lucide-react';
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
import Link from 'next/link';
import { useState } from 'react';

interface ManufacturingTableProps {
  invoices: ManufacturingInvoice[];
}
export function ManufacturingTable({ invoices }: ManufacturingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    return (
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.blend_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.warehouse?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف فاتورة ${invoiceNumber}؟`)) return;

    const result = await deleteManufacturingInvoice(id);
    if (result.success) {
      toast.success('تم حذف فاتورة التصنيع بنجاح');
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
          إنشاء فاتورة تصنيع
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>المستودع</TableHead>
              <TableHead>اسم الخلطة</TableHead>
              <TableHead>المادة المنتجة</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  لم يتم العثور على فواتير تصنيع
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatDate(new Date(invoice.manufacturing_date))}</TableCell>
                  <TableCell>
                    {invoice.warehouse ? (
                      <div>
                        <div className="font-medium">{invoice.warehouse.name}</div>
                        <div className="text-xs text-muted-foreground">{invoice.warehouse.farm_name}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{invoice.blend_name || '-'}</TableCell>
                  <TableCell>
                    {invoice.material_name ? (
                      <div>
                        <div className="font-medium">{invoice.material_name}</div>
                        <div className="text-xs text-muted-foreground">{invoice.unit_name}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {invoice.quantity.toLocaleString()}
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
                          <Link href={`/admin/manufacturing/${invoice.id}`}>عرض التفاصيل</Link>
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

      <CreateManufacturingDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
