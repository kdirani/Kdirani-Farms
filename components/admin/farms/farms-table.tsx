'use client';

import { useState } from 'react';
import { Farm } from '@/actions/farm.actions';
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
import { Building2, MoreHorizontal, Search, Plus } from 'lucide-react';
import { CreateFarmDialog } from './create-farm-dialog';
import { EditFarmDialog } from './edit-farm-dialog';
import { DeleteFarmDialog } from './delete-farm-dialog';
import { formatDate } from '@/lib/utils';

interface FarmsTableProps {
  farms: Farm[];
}

export function FarmsTable({ farms }: FarmsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  const filteredFarms = farms.filter(
    (farm) =>
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.user?.fname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث في المزارع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة مزرعة
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المزرعة</TableHead>
              <TableHead>الموقع</TableHead>
              <TableHead>لوجستي </TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFarms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  لم يتم العثور على مزارع
                </TableCell>
              </TableRow>
            ) : (
              filteredFarms.map((farm) => (
                <TableRow key={farm.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {farm.name}
                    </div>
                  </TableCell>
                  <TableCell>{farm.location || '-'}</TableCell>
                  <TableCell>
                    {farm.user ? (
                      <div>
                        <div className="font-medium">{farm.user.fname}</div>
                        <div className="text-xs text-muted-foreground">{farm.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">غير معين</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={farm.is_active ? 'success' : 'secondary'}>
                      {farm.is_active ? 'نشطة' : 'غير نشطة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(new Date(farm.created_at))}
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
                            setSelectedFarm(farm);
                            setEditDialogOpen(true);
                          }}
                        >
                          تعديل المزرعة
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFarm(farm);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          حذف المزرعة
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

      <CreateFarmDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedFarm && (
        <>
          <EditFarmDialog
            farm={selectedFarm}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteFarmDialog
            farm={selectedFarm}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
