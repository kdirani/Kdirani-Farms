'use client';

import { useState } from 'react';
import { Client, deleteClient, createClient, updateClient } from '@/actions/client.actions';
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients: initialClients }: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'provider'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'customer' as 'customer' | 'provider' });
  const [isLoading, setIsLoading] = useState(false);

  const filteredClients = initialClients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('اسم العميل مطلوب');
      return;
    }
    setIsLoading(true);
    const result = await createClient(formData);
    if (result.success) {
      toast.success('تم إنشاء العميل بنجاح');
      setFormData({ name: '', type: 'customer' });
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في إنشاء العميل');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedClient || !formData.name.trim()) return;
    setIsLoading(true);
    const result = await updateClient({ id: selectedClient.id, ...formData });
    if (result.success) {
      toast.success('تم تحديث العميل بنجاح');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في تحديث العميل');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setIsLoading(true);
    const result = await deleteClient(selectedClient.id);
    if (result.success) {
      toast.success('تم حذف العميل بنجاح');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'فشل في حذف العميل');
    }
    setIsLoading(false);
  };

  const getTypeBadge = (type: 'customer' | 'provider') => {
    return type === 'customer' ? (
      <Badge variant="default">عميل</Badge>
    ) : (
      <Badge variant="secondary">مورد</Badge>
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
              placeholder="البحث في العملاء..."
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
              <SelectItem value="customer">العملاء</SelectItem>
              <SelectItem value="provider">الموردين</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', type: 'customer' });
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة عميل
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم العميل</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  لم يتم العثور على عملاء
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{getTypeBadge(client.type)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedClient(client);
                          setFormData({ name: client.name, type: client.type });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedClient(client);
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
            <DialogTitle>إضافة عميل</DialogTitle>
            <DialogDescription>أدخل تفاصيل العميل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العميل *</Label>
              <Input
                id="name"
                placeholder="مثال: شركة ABC"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">نوع العميل *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'customer' | 'provider') => setFormData({ ...formData, type: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="provider">مورد</SelectItem>
                </SelectContent>
              </Select>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل العميل</DialogTitle>
            <DialogDescription>حدث تفاصيل العميل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">اسم العميل *</Label>
              <Input
                id="edit_name"
                placeholder="مثال: شركة ABC"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_type">نوع العميل *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'customer' | 'provider') => setFormData({ ...formData, type: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="provider">مورد</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>حذف العميل</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف "{selectedClient?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
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
