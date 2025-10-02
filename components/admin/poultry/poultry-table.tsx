'use client';

import { useState } from 'react';
import { PoultryStatus } from '@/actions/poultry.actions';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCog, MoreHorizontal, Search, Plus } from 'lucide-react';
import { CreatePoultryDialog } from './create-poultry-dialog';
import { EditPoultryDialog } from './edit-poultry-dialog';
import { DeletePoultryDialog } from './delete-poultry-dialog';
import { format } from 'date-fns';

interface PoultryTableProps {
  poultryStatuses: PoultryStatus[];
}

export function PoultryTable({ poultryStatuses }: PoultryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPoultry, setSelectedPoultry] = useState<PoultryStatus | null>(null);

  const filteredPoultry = poultryStatuses.filter(
    (poultry) =>
      poultry.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poultry.farm?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poultry.farm?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (poultry: PoultryStatus) => {
    const mortalityRate = (poultry.dead_chicks / poultry.opening_chicks) * 100;
    
    if (mortalityRate === 0) {
      return <Badge variant="success">ممتاز</Badge>;
    } else if (mortalityRate < 5) {
      return <Badge variant="success">جيد</Badge>;
    } else if (mortalityRate < 10) {
      return <Badge variant="warning">مقبول</Badge>;
    } else {
      return <Badge variant="destructive">ضعيف</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث في الدفعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة دفعة قطعان
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الدفعة</TableHead>
              <TableHead>المزرعة</TableHead>
              <TableHead>المزارع</TableHead>
              <TableHead className="text-right">البداية</TableHead>
              <TableHead className="text-right">الميت</TableHead>
              <TableHead className="text-right">المتبقي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPoultry.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  لم يتم العثور على دفعات قطعان
                </TableCell>
              </TableRow>
            ) : (
              filteredPoultry.map((poultry) => (
                <TableRow key={poultry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {poultry.batch_name || 'دفعة غير مسماة'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {poultry.farm ? (
                      <div>
                        <div className="font-medium">{poultry.farm.name}</div>
                        {poultry.farm.location && (
                          <div className="text-xs text-muted-foreground">{poultry.farm.location}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">لا توجد مزرعة</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {poultry.farm?.user_name || (
                      <span className="text-muted-foreground">غير معين</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {poultry.opening_chicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {poultry.dead_chicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {poultry.remaining_chicks.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(poultry)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(poultry.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
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
                            setSelectedPoultry(poultry);
                            setEditDialogOpen(true);
                          }}
                        >
                          تعديل الدفعة
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPoultry(poultry);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          حذف الدفعة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreatePoultryDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedPoultry && (
        <>
          <EditPoultryDialog
            poultry={selectedPoultry}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeletePoultryDialog
            poultry={selectedPoultry}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
