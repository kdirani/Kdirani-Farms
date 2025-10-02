'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MedicineInvoice, deleteMedicineInvoice } from '@/actions/medicine-invoice.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Plus } from 'lucide-react';
import { CreateMedicineInvoiceDialog } from './create-medicine-invoice-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MedicineInvoicesTableProps {
  invoices: MedicineInvoice[];
}

export function MedicineInvoicesTable({ invoices }: MedicineInvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    return (
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.warehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.poultry_status?.status_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) return;

    const result = await deleteMedicineInvoice(id);
    if (result.success) {
      toast.success('Medicine invoice deleted successfully');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete invoice');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Medicine Invoice
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Poultry Status</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No medicine invoices found
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
                  <TableCell>
                    {invoice.poultry_status ? (
                      <div className="font-medium">{invoice.poultry_status.status_name}</div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${invoice.total_value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/medicines-invoices/${invoice.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                          className="text-destructive"
                        >
                          Delete Invoice
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
