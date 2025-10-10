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
import { formatDate, formatNumber } from '@/lib/utils';

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
              <TableHead>تاريخ ميلاد الفراخ</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPoultry.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    {formatNumber(poultry.opening_chicks)}
                  </TableCell>
                  <TableCell>
                    {poultry.chick_birth_date ? (
                      <div className="text-sm">
                        <div>{formatDate(new Date(poultry.chick_birth_date))}</div>
                        <div className="text-xs text-muted-foreground">
                          عمر: {formatNumber(Math.floor((new Date().getTime() - new Date(poultry.chick_birth_date).getTime()) / (1000 * 60 * 60 * 24)))} يوم
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(new Date(poultry.created_at))}
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
