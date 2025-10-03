'use client';

import { useState } from 'react';
import { ExpenseType, deleteExpenseType, createExpenseType, updateExpenseType } from '@/actions/expense-type.actions';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface ExpenseTypesTableProps {
  expenseTypes: ExpenseType[];
}

export function ExpenseTypesTable({ expenseTypes: initialExpenseTypes }: ExpenseTypesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState<ExpenseType | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredExpenseTypes = initialExpenseTypes.filter((expenseType) =>
    expenseType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('اسم نوع المصروف مطلوب');
      return;
    }
    setIsLoading(true);
    const result = await createExpenseType({ name });
    if (result.success) {
      toast.success('تم إنشاء نوع المصروف بنجاح');
      setName('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في إنشاء نوع المصروف');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedExpenseType || !name.trim()) return;
    setIsLoading(true);
    const result = await updateExpenseType({ id: selectedExpenseType.id, name });
    if (result.success) {
      toast.success('تم تحديث نوع المصروف بنجاح');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في تحديث نوع المصروف');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedExpenseType) return;
    setIsLoading(true);
    const result = await deleteExpenseType(selectedExpenseType.id);
    if (result.success) {
      toast.success('تم حذف نوع المصروف بنجاح');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف نوع المصروف');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث في أنواع المصروفات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setName('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة نوع مصروف
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم نوع المصروف</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>تاريخ التعديل</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenseTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  لم يتم العثور على أنواع مصروفات
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenseTypes.map((expenseType) => (
                <TableRow key={expenseType.id}>
                  <TableCell className="font-medium">{expenseType.name}</TableCell>
                  <TableCell>{formatDate(new Date(expenseType.created_at))}</TableCell>
                  <TableCell>{formatDate(new Date(expenseType.updated_at))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedExpenseType(expenseType);
                          setName(expenseType.name);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedExpenseType(expenseType);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة نوع مصروف</DialogTitle>
            <DialogDescription>أدخل نوع مصروف جديد لإضافته إلى النظام</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="name">اسم نوع المصروف</Label>
            <Input
              id="name"
              placeholder="مثال: النقل، العمالة، المرافق"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل نوع المصروف</DialogTitle>
            <DialogDescription>حدث اسم نوع المصروف</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_name">اسم نوع المصروف</Label>
            <Input
              id="edit_name"
              placeholder="مثال: النقل، العمالة، المرافق"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف نوع المصروف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف "{selectedExpenseType?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
