'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { EditInvoiceDialog } from './edit-invoice-dialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Farm {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  type: string;
}

interface Warehouse {
  id: string;
  name: string;
  farm_id: string | null;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  farms: Farm[];
  clients: Client[];
  warehouses: Warehouse[];
  selectedFarmId: string;
}

export function InvoicesTable({ invoices, farms, clients, warehouses, selectedFarmId }: InvoicesTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleFarmChange = (farmId: string) => {
    router.push(`/admin/invoices?farm=${farmId}`);
  };

  const getClientTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'customer': 'زبون',
      'supplier': 'مورّد',
    };
    return types[type] || type;
  };

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
      <Badge variant="default">شراء</Badge>
    ) : (
      <Badge variant="secondary">بيع</Badge>
    );
  };

  const getStatusBadge = (checked: boolean) => {
    return checked ? (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        مدقق
      </Badge>
    ) : (
      <Badge variant="warning" className="gap-1">
        <XCircle className="h-3 w-3" />
        غير مدقق
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Select value={selectedFarmId} onValueChange={handleFarmChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر المزرعة" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="buy">شراء</SelectItem>
              <SelectItem value="sell">بيع</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة فاتورة
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>المستودع</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead className="text-right">القيمة الصافية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  لم يتم العثور على فواتير
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
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatDate(new Date(invoice.invoice_date))}</div>
                      {invoice.invoice_time && (
                        <div className="text-xs text-muted-foreground">{invoice.invoice_time}</div>
                      )}
                    </div>
                  </TableCell>
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
                        <div className="text-xs text-muted-foreground">{getClientTypeLabel(invoice.client.type)}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(invoice.net_value)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.checked)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/invoices/${invoice.id}`}>عرض التفاصيل</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setEditDialogOpen(true);
                          }}
                        >
                          تعديل الفاتورة
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setDeleteDialogOpen(true);
                          }}
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

      <CreateInvoiceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedInvoice && (
        <>
          <DeleteInvoiceDialog
            invoice={selectedInvoice}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
          <EditInvoiceDialog
            invoice={selectedInvoice}
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedInvoice(null);
            }}
            clients={clients}
            warehouses={warehouses}
          />
        </>
      )}
    </div>
  );
}
