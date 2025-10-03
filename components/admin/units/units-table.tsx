'use client';

import { useState } from 'react';
import { MeasurementUnit, deleteMeasurementUnit, createMeasurementUnit, updateMeasurementUnit } from '@/actions/unit.actions';
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

interface UnitsTableProps {
  units: MeasurementUnit[];
}

export function UnitsTable({ units: initialUnits }: UnitsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredUnits = initialUnits.filter((unit) =>
    unit.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!unitName.trim()) {
      toast.error('اسم الوحدة مطلوب');
      return;
    }
    setIsLoading(true);
    const result = await createMeasurementUnit({ unit_name: unitName });
    if (result.success) {
      toast.success('تم إنشاء وحدة القياس بنجاح');
      setUnitName('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في إنشاء وحدة القياس');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedUnit || !unitName.trim()) return;
    setIsLoading(true);
    const result = await updateMeasurementUnit({ id: selectedUnit.id, unit_name: unitName });
    if (result.success) {
      toast.success('تم تحديث وحدة القياس بنجاح');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في تحديث وحدة القياس');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;
    setIsLoading(true);
    const result = await deleteMeasurementUnit(selectedUnit.id);
    if (result.success) {
      toast.success('تم حذف وحدة القياس بنجاح');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف وحدة القياس');
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
            placeholder="البحث في الوحدات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setUnitName('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة وحدة
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الوحدة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>تاريخ التحديث</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  لم يتم العثور على وحدات قياس
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_name}</TableCell>
                  <TableCell>{formatDate(new Date(unit.created_at))}</TableCell>
                  <TableCell>{formatDate(new Date(unit.updated_at))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setUnitName(unit.unit_name);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUnit(unit);
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
            <DialogTitle>إضافة وحدة قياس</DialogTitle>
            <DialogDescription>أدخل وحدة قياس جديدة لإضافتها للنظام</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="unit_name">اسم الوحدة</Label>
            <Input
              id="unit_name"
              placeholder="مثال: كجم، طن، لتر، قطعة"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
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
            <DialogTitle>تعديل وحدة القياس</DialogTitle>
            <DialogDescription>تحديث وحدة القياس</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_unit_name">اسم الوحدة</Label>
            <Input
              id="edit_unit_name"
              placeholder="مثال: كجم، طن، لتر، قطعة"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
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
            <DialogTitle>حذف وحدة القياس</DialogTitle>
            <DialogDescription>
هل أنت متأكد من حذف "{selectedUnit?.unit_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
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
