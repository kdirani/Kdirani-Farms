'use client';

import { useState } from 'react';
import { EggWeight, deleteEggWeight, createEggWeight, updateEggWeight } from '@/actions/egg-weight.actions';
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

interface EggWeightsTableProps {
  eggWeights: EggWeight[];
}

export function EggWeightsTable({ eggWeights: initialEggWeights }: EggWeightsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEggWeight, setSelectedEggWeight] = useState<EggWeight | null>(null);
  const [weightRange, setWeightRange] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredEggWeights = initialEggWeights.filter((eggWeight) =>
    eggWeight.weight_range.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!weightRange.trim()) {
      toast.error('نطاق الوزن مطلوب');
      return;
    }
    setIsLoading(true);
    const result = await createEggWeight({ weight_range: weightRange });
    if (result.success) {
      toast.success('تم إنشاء وزن البيض بنجاح');
      setWeightRange('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في إنشاء وزن البيض');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedEggWeight || !weightRange.trim()) return;
    setIsLoading(true);
    const result = await updateEggWeight({ id: selectedEggWeight.id, weight_range: weightRange });
    if (result.success) {
      toast.success('تم تحديث وزن البيض بنجاح');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في تحديث وزن البيض');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedEggWeight) return;
    setIsLoading(true);
    const result = await deleteEggWeight(selectedEggWeight.id);
    if (result.success) {
      toast.success('تم حذف وزن البيض بنجاح');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف وزن البيض');
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
            placeholder="البحث في أوزان البيض..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setWeightRange('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة وزن بيض
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نطاق الوزن</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>تاريخ التعديل</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEggWeights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  لم يتم العثور على أوزان بيض
                </TableCell>
              </TableRow>
            ) : (
              filteredEggWeights.map((eggWeight) => (
                <TableRow key={eggWeight.id}>
                  <TableCell className="font-medium">{eggWeight.weight_range}</TableCell>
                  <TableCell>{formatDate(new Date(eggWeight.created_at))}</TableCell>
                  <TableCell>{formatDate(new Date(eggWeight.updated_at))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEggWeight(eggWeight);
                          setWeightRange(eggWeight.weight_range);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEggWeight(eggWeight);
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
            <DialogTitle>إضافة وزن بيض</DialogTitle>
            <DialogDescription>أدخل نطاق وزن بيض جديد لإضافته إلى النظام</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="weight_range">نطاق الوزن</Label>
            <Input
              id="weight_range"
              placeholder="مثال: كبير، متوسط، 60-65جم، 1850/1800"
              value={weightRange}
              onChange={(e) => setWeightRange(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              أمثلة: كبير، متوسط، صغير، 60-65جم، 1850/1800
            </p>
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
            <DialogTitle>تعديل وزن البيض</DialogTitle>
            <DialogDescription>حدث نطاق وزن البيض</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_weight_range">نطاق الوزن</Label>
            <Input
              id="edit_weight_range"
              placeholder="مثال: كبير، متوسط، 60-65جم، 1850/1800"
              value={weightRange}
              onChange={(e) => setWeightRange(e.target.value)}
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
            <DialogTitle>حذف وزن البيض</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف "{selectedEggWeight?.weight_range}"؟ هذا الإجراء لا يمكن التراجع عنه.
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
