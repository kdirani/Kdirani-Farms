'use client';

import { useMemo, useState, useDeferredValue, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Material } from '@/actions/material.actions';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Package, MoreHorizontal, Search, Plus, Filter } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { CreateMaterialDialog } from './create-material-dialog';
import { EditMaterialDialog } from './edit-material-dialog';
import { DeleteMaterialDialog } from './delete-material-dialog';

interface MaterialsTableProps {
  materials: Material[];
  isAggregated?: boolean;
  availableWarehouses?: Array<{ display: string }>;
}

export function MaterialsTable({ materials, isAggregated = false, availableWarehouses = [] }: MaterialsTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const selectedWarehouse = searchParams.get('warehouse') || 'all';
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // استخدام useDeferredValue للأداء الأفضل
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // استخدام قائمة المستودعات المتاحة من السيرفر
  const warehouses = useMemo(() => {
    return availableWarehouses.sort((a, b) => a.display.localeCompare(b.display));
  }, [availableWarehouses]);

  // تحديث URL عند تغيير المرشحات
  const updateURL = useCallback((warehouse: string, search: string) => {
    const params = new URLSearchParams();
    if (warehouse !== 'all') params.set('warehouse', warehouse);
    if (search.trim()) params.set('search', search);
    
    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newURL); // استخدام push بدلاً من replace لإعادة التحميل
  }, [pathname, router]);

  // معالج تغيير المستودع - سيؤدي لإعادة تحميل البيانات من السيرفر
  const handleWarehouseChange = useCallback((warehouse: string) => {
    updateURL(warehouse, searchTerm);
  }, [searchTerm, updateURL]);

  // معالج تغيير البحث - فلترة محلية فقط
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  // فلترة محلية للبحث والحالة (المستودع يأتي مفلتر من السيرفر)
  const filteredMaterials = useMemo(() => {
    let filtered = materials;
    
    // فلترة البحث
    if (deferredSearchTerm) {
      const s = deferredSearchTerm.toLowerCase();
      filtered = filtered.filter((material) => 
        material.material_name?.toLowerCase().includes(s) ||
        material.warehouse?.name.toLowerCase().includes(s) ||
        material.warehouse?.farm_name.toLowerCase().includes(s)
      );
    }
    
    // فلترة الحالة
    if (filterStatus === 'low') {
      filtered = filtered.filter(m => m.current_balance > 0 && m.current_balance < 100);
    } else if (filterStatus === 'out') {
      filtered = filtered.filter(m => m.current_balance === 0);
    } else if (filterStatus === 'good') {
      filtered = filtered.filter(m => m.current_balance >= 100);
    }
    
    return filtered;
  }, [materials, deferredSearchTerm, filterStatus]);


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="البحث في المواد..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {warehouses.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedWarehouse} onValueChange={handleWarehouseChange}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="تصفية حسب المستودع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">🏢 جميع المستودعات</span>
                      <span className="text-xs text-muted-foreground">(عرض مجمع)</span>
                    </div>
                  </SelectItem>
                  <div className="my-1 h-px bg-border" />
                  {warehouses.map((w) => (
                    <SelectItem key={w.display} value={w.display}>
                      {w.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="good">متوفر</SelectItem>
              <SelectItem value="low">مخزون قليل</SelectItem>
              <SelectItem value="out">نفد المخزون</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة مادة
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المادة</TableHead>
              <TableHead>المستودع</TableHead>
              <TableHead>المزرعة</TableHead>
              <TableHead>الوحدة</TableHead>
              <TableHead className="text-right">البداية</TableHead>
              <TableHead className="text-right">المشتريات</TableHead>
              <TableHead className="text-right">المبيعات</TableHead>
              <TableHead className="text-right">الاستهلاك</TableHead>
              <TableHead className="text-right">التصنيع</TableHead>
              <TableHead className="text-right">الحالي</TableHead>
              <TableHead>آخر تحديث</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                  {searchTerm || filterStatus !== 'all'
                    ? 'لم يتم العثور على مواد تطابق الفلاتر المحددة'
                    : 'لم يتم العثور على مواد في هذا المستودع'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {material.material_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>{material.warehouse?.name || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{material.warehouse?.farm_name || '-'}</TableCell>
                  <TableCell>{material.unit_name || '-'}</TableCell>
                  <TableCell className="text-right">{material.opening_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">+{material.purchases.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">-{material.sales.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-orange-600">-{material.consumption.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-blue-600">+{material.manufacturing.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-lg">{material.current_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{formatDate(new Date(material.updated_at))}</span>
                      <span className="text-[10px] opacity-70">{formatTime(new Date(material.updated_at))}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAggregated ? (
                      <span className="text-muted-foreground text-sm">-</span>
                    ) : (
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMaterial(material);
                              setEditDialogOpen(true);
                            }}
                          >
                            تعديل المادة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMaterial(material);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            حذف المادة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>عرض {filteredMaterials.length} من {materials.length} مادة</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span className="text-green-600">●</span> المشتريات تضيف للمخزون
          </span>
          <span className="flex items-center gap-2">
            <span className="text-red-600">●</span> المبيعات تقلل المخزون
          </span>
          <span className="flex items-center gap-2">
            <span className="text-orange-600">●</span> الاستهلاك يقلل المخزون
          </span>
          <span className="flex items-center gap-2">
            <span className="text-blue-600">●</span> التصنيع يضيف للمخزون
          </span>
        </div>
      </div>

      <CreateMaterialDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedMaterial && (
        <>
          <EditMaterialDialog
            material={selectedMaterial}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteMaterialDialog
            material={selectedMaterial}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
