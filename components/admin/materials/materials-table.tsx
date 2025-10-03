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
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(searchParams.get('warehouse') || 'all');
  
  // استخدام useDeferredValue للأداء الأفضل
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredWarehouse = useDeferredValue(selectedWarehouse);
  
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

  // معالج تغيير المستودع - سيؤدي لإعادة تحميل البيانات
  const handleWarehouseChange = useCallback((warehouse: string) => {
    setSelectedWarehouse(warehouse);
    updateURL(warehouse, searchTerm);
  }, [searchTerm, updateURL]);

  // معالج تغيير البحث - فلترة محلية فقط
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const s = deferredSearchTerm.toLowerCase();
      const matchesSearch = !s || (
        material.material_name?.toLowerCase().includes(s) ||
        material.warehouse?.name.toLowerCase().includes(s) ||
        material.warehouse?.farm_name.toLowerCase().includes(s)
      );

      return matchesSearch;
    });
  }, [materials, deferredSearchTerm]);

  const getStockStatus = (current: number, opening: number) => {
    if (current === 0) return <Badge variant="destructive">نفد من المخزون</Badge>;
    const percentage = (current / opening) * 100;
    if (percentage < 20) return <Badge variant="destructive">مخزون قليل</Badge>;
    if (percentage < 50) return <Badge variant="warning">مخزون متوسط</Badge>;
    return <Badge variant="success">متوفر في المخزون</Badge>;
  };

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
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedWarehouse} onValueChange={handleWarehouseChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="تصفية حسب المستودع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستودعات (عرض مجمع)</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.display} value={w.display}>
                    {w.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <TableHead className="text-right">الحالي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  {selectedWarehouse !== 'all' || searchTerm
                    ? 'لم يتم العثور على مواد تطابق المعايير المحددة'
                    : 'لم يتم العثور على مواد'}
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
                  <TableCell>{material.warehouse?.farm_name || '-'}</TableCell>
                  <TableCell>{material.unit_name || '-'}</TableCell>
                  <TableCell className="text-right">{material.opening_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">{material.purchases.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-blue-600">{material.sales.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-orange-600">{material.consumption.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{material.current_balance.toLocaleString()}</TableCell>
                  <TableCell>{getStockStatus(material.current_balance, material.opening_balance)}</TableCell>
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
