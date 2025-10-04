'use client';

import { useState } from 'react';
import { InvoiceItem, deleteInvoiceItem } from '@/actions/invoice-item.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { AddInvoiceItemDialog } from './add-invoice-item-dialog';
import { formatCurrency } from '@/lib/utils';

interface InvoiceItemsSectionProps {
  invoiceId: string;
  items: InvoiceItem[];
}

export function InvoiceItemsSection({ invoiceId, items }: InvoiceItemsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العنصر؟')) return;
    
    setIsDeleting(itemId);
    const result = await deleteInvoiceItem(itemId);
    
    if (result.success) {
      toast.success('تم حذف العنصر بنجاح');
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف العنصر');
    }
    setIsDeleting(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>عناصر الفاتورة</CardTitle>
            <CardDescription>المواد والأدوية والمنتجات في هذه الفاتورة</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            إضافة عنصر
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لم يتم إضافة عناصر بعد. انقر على "إضافة عنصر" للبدء.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المادة/الدواء/المنتج</TableHead>
                  <TableHead>تفاصيل إضافية</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الوزن</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.medicine_id && (
                          <Pill className="h-4 w-4 text-primary" />
                        )}
                        <span>
                          {item.material_name || item.medicine_name || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.medicine_day_of_age ? (
                        <span className="text-sm text-muted-foreground">
                          اليوم: {item.medicine_day_of_age}
                        </span>
                      ) : item.egg_weight ? (
                        <span>{item.egg_weight}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.weight ? item.weight.toLocaleString() : '-'}</TableCell>
                    <TableCell>{item.unit_name || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.value)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddInvoiceItemDialog 
        invoiceId={invoiceId} 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
      />
    </Card>
  );
}
