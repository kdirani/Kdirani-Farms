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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddInvoiceItemDialog } from './add-invoice-item-dialog';

interface InvoiceItemsSectionProps {
  invoiceId: string;
  items: InvoiceItem[];
}

export function InvoiceItemsSection({ invoiceId, items }: InvoiceItemsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setIsDeleting(itemId);
    const result = await deleteInvoiceItem(itemId);
    
    if (result.success) {
      toast.success('Item deleted successfully');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete item');
    }
    setIsDeleting(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>Materials and products in this invoice</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No items added yet. Click "Add Item" to get started.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material/Product</TableHead>
                  <TableHead>Egg Weight</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.material_name || '-'}</TableCell>
                    <TableCell>{item.egg_weight || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.weight ? item.weight.toLocaleString() : '-'}</TableCell>
                    <TableCell>{item.unit_name || '-'}</TableCell>
                    <TableCell className="text-right">${item.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">${item.value.toLocaleString()}</TableCell>
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
