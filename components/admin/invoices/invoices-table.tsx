'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Invoice, deleteInvoice } from '@/actions/invoice.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, MoreHorizontal, Search, Plus, CheckCircle, XCircle } from 'lucide-react';
import { CreateInvoiceDialog } from './create-invoice-dialog';
import { DeleteInvoiceDialog } from './delete-invoice-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.warehouse?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || invoice.invoice_type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: 'buy' | 'sell') => {
    return type === 'buy' ? (
      <Badge variant="default">Buy</Badge>
    ) : (
      <Badge variant="secondary">Sell</Badge>
    );
  };

  const getStatusBadge = (checked: boolean) => {
    return checked ? (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Checked
      </Badge>
    ) : (
      <Badge variant="warning" className="gap-1">
        <XCircle className="h-3 w-3" />
        Unchecked
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
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
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Net Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {invoice.invoice_number}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(invoice.invoice_type)}</TableCell>
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
                    {invoice.client ? (
                      <div>
                        <div className="font-medium">{invoice.client.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{invoice.client.type}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${invoice.net_value.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.checked)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/invoices/${invoice.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setDeleteDialogOpen(true);
                          }}
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

      <CreateInvoiceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedInvoice && (
        <DeleteInvoiceDialog
          invoice={selectedInvoice}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
    </div>
  );
}
