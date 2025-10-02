'use client';

import { useState } from 'react';
import { InventoryReport } from '@/actions/inventory-report.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

interface InventoryReportTableProps {
  inventory: InventoryReport[];
}

export function InventoryReportTable({ inventory }: InventoryReportTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get unique warehouses for filter
  const warehouses = Array.from(new Set(inventory.map(item => item.warehouse_name)));

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farm_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = filterWarehouse === 'all' || item.warehouse_name === filterWarehouse;
    
    let matchesStatus = true;
    if (filterStatus === 'low') {
      matchesStatus = item.current_balance > 0 && item.current_balance < 100;
    } else if (filterStatus === 'out') {
      matchesStatus = item.current_balance === 0;
    } else if (filterStatus === 'good') {
      matchesStatus = item.current_balance >= 100;
    }
    
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const getStockBadge = (balance: number) => {
    if (balance === 0) {
      return <Badge variant="destructive">نفد المخزون</Badge>;
    } else if (balance < 100) {
      return <Badge variant="warning">مخزون قليل</Badge>;
    } else {
      return <Badge variant="success">متوفر</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث في المواد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المستودعات</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse} value={warehouse}>
                {warehouse}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
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

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المادة</TableHead>
              <TableHead>المستودع</TableHead>
              <TableHead>المزرعة</TableHead>
              <TableHead className="text-right">الرصيد الافتتاحي</TableHead>
              <TableHead className="text-right">المشتريات</TableHead>
              <TableHead className="text-right">المبيعات</TableHead>
              <TableHead className="text-right">الاستهلاك</TableHead>
              <TableHead className="text-right">التصنيع</TableHead>
              <TableHead className="text-right">الرصيد الحالي</TableHead>
              <TableHead>الوحدة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>آخر تحديث</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  لم يتم العثور على سجلات مخزون
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.material_name}</TableCell>
                  <TableCell>{item.warehouse_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.farm_name}</TableCell>
                  <TableCell className="text-right">{item.opening_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">+{item.purchases.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">-{item.sales.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-orange-600">-{item.consumption.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-blue-600">+{item.manufacturing.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-lg">{item.current_balance.toLocaleString()}</TableCell>
                  <TableCell>{item.unit_name}</TableCell>
                  <TableCell>{getStockBadge(item.current_balance)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(item.updated_at), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>عرض {filteredInventory.length} من {inventory.length} مادة</span>
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
    </div>
  );
}
