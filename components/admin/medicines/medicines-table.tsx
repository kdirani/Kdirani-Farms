'use client';

import { useState } from 'react';
import { Medicine, deleteMedicine, createMedicine, updateMedicine } from '@/actions/medicine.actions';
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MedicinesTableProps {
  medicines: Medicine[];
}

export function MedicinesTable({ medicines: initialMedicines }: MedicinesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', day_of_age: '' });
  const [isLoading, setIsLoading] = useState(false);

  const filteredMedicines = initialMedicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.day_of_age.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.day_of_age.trim()) {
      toast.error('الاسم ويوم العمر مطلوبين');
      return;
    }
    setIsLoading(true);
    const result = await createMedicine(formData);
    if (result.success) {
      toast.success('تم إنشاء الدواء بنجاح');
      setFormData({ name: '', description: '', day_of_age: '' });
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في إنشاء الدواء');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedMedicine || !formData.name.trim() || !formData.day_of_age.trim()) return;
    setIsLoading(true);
    const result = await updateMedicine({ id: selectedMedicine.id, ...formData });
    if (result.success) {
      toast.success('تم تحديث الدواء بنجاح');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في تحديث الدواء');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedMedicine) return;
    setIsLoading(true);
    const result = await deleteMedicine(selectedMedicine.id);
    if (result.success) {
      toast.success('تم حذف الدواء بنجاح');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف الدواء');
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
            placeholder="البحث في الأدوية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setFormData({ name: '', description: '', day_of_age: '' });
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة دواء
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الدواء</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>يوم العمر</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  لم يتم العثور على أدوية
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.description || '-'}</TableCell>
                  <TableCell>{medicine.day_of_age}</TableCell>
                  <TableCell>{format(new Date(medicine.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMedicine(medicine);
                          setFormData({
                            name: medicine.name,
                            description: medicine.description || '',
                            day_of_age: medicine.day_of_age,
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMedicine(medicine);
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>إضافة دواء</DialogTitle>
            <DialogDescription>أدخل تفاصيل الدواء أو اللقاح</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الدواء *</Label>
              <Input
                id="name"
                placeholder="مثال: لقاح مرض نيوكاسل"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                placeholder="وصف اختياري"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day_of_age">يوم العمر *</Label>
              <Input
                id="day_of_age"
                placeholder="مثال: اليوم الأول، الأسبوع الثاني"
                value={formData.day_of_age}
                onChange={(e) => setFormData({ ...formData, day_of_age: e.target.value })}
                disabled={isLoading}
              />
            </div>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل الدواء</DialogTitle>
            <DialogDescription>حدث تفاصيل الدواء أو اللقاح</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">اسم الدواء *</Label>
              <Input
                id="edit_name"
                placeholder="مثال: لقاح مرض نيوكاسل"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">الوصف</Label>
              <Input
                id="edit_description"
                placeholder="وصف اختياري"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_day_of_age">يوم العمر *</Label>
              <Input
                id="edit_day_of_age"
                placeholder="مثال: اليوم الأول، الأسبوع الثاني"
                value={formData.day_of_age}
                onChange={(e) => setFormData({ ...formData, day_of_age: e.target.value })}
                disabled={isLoading}
              />
            </div>
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
            <DialogTitle>حذف الدواء</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف "{selectedMedicine?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
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
