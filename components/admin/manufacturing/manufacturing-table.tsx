'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ManufacturingInvoice, deleteManufacturingInvoice } from '@/actions/manufacturing.actions';
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
import { CreateManufacturingDialog } from './create-manufacturing-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) return;

    const result = await deleteManufacturingInvoice(id);
    if (result.success) {
      toast.success('Manufacturing invoice deleted successfully');
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
          Create Manufacturing Invoice
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Blend Name</TableHead>
              <TableHead>Output Material</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No manufacturing invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{format(new Date(invoice.manufacturing_date), 'MMM dd, yyyy')}</TableCell>
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/manufacturing/${invoice.id}`}>View Details</Link>
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

      <CreateManufacturingDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
