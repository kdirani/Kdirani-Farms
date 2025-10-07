'use client';

import { useState, useTransition } from 'react';
import { InvoiceItem, deleteInvoiceItem, updateInvoiceItem } from '@/actions/invoice-item.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Trash2, Pill, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { AddInvoiceItemDialog } from './add-invoice-item-dialog';
import { formatCurrency } from '@/lib/utils';

interface InvoiceItemsSectionProps {
  invoiceId: string;
  items: InvoiceItem[];
}

export function InvoiceItemsSection({ invoiceId, items }: InvoiceItemsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);

  const handleDelete = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العنصر؟')) return;
    
    setIsDeleting(itemId);
    
    startTransition(async () => {
      const result = await deleteInvoiceItem(itemId);
      
      if (result.success) {
        toast.success('تم حذف العنصر بنجاح');
      } else {
        toast.error(result.error || 'فشل في حذف العنصر');
      }
      setIsDeleting(null);
    });
  };

  const handleEditPrice = (item: InvoiceItem) => {
    setEditingItemId(item.id);
    setEditingPrice(item.price);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingPrice(0);
  };

  const handleSavePrice = (itemId: string) => {
    startTransition(async () => {
      try {
        const result = await updateInvoiceItem({
          id: itemId,
          price: editingPrice,
        });

        if (result.success) {
          toast.success('تم تحديث السعر بنجاح');
          setEditingItemId(null);
        } else {
          toast.error(result.error || 'فشل في تحديث السعر');
        }
      } catch (error) {
        toast.error('حدث خطأ أثناء تحديث السعر');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>عناصر الفاتورة</CardTitle>
            <CardDescription>المواد والأدوية والمنتجات في هذه الفاتورة - يمكنك تعديل الأسعار بالنقر على أيقونة التحرير</CardDescription>
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
                    <TableCell>{item.unit_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                            className="w-28 h-8"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSavePrice(item.id)}
                            disabled={isPending}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <span className={item.price === 0 ? 'text-orange-600 font-semibold' : ''}>
                            {formatCurrency(item.price)}
                            {item.price === 0 && <span className="text-xs mr-1">(غير محدد)</span>}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditPrice(item)}
                            title="تعديل السعر"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
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
