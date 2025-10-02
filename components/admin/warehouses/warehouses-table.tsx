'use client';

import { useState } from 'react';
import { Warehouse } from '@/actions/warehouse.actions';
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
import { Warehouse as WarehouseIcon, MoreHorizontal, Search, Plus } from 'lucide-react';
import { CreateWarehouseDialog } from './create-warehouse-dialog';
import { EditWarehouseDialog } from './edit-warehouse-dialog';
import { DeleteWarehouseDialog } from './delete-warehouse-dialog';
import { format } from 'date-fns';

interface WarehousesTableProps {
  warehouses: Warehouse[];
}

export function WarehousesTable({ warehouses }: WarehousesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.farm?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.farm?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse Name</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Farmer</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWarehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No warehouses found
                </TableCell>
              </TableRow>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                      {warehouse.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {warehouse.farm ? (
                      <span className="font-medium">{warehouse.farm.name}</span>
                    ) : (
                      <span className="text-muted-foreground">No farm</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warehouse.farm?.location || '-'}
                  </TableCell>
                  <TableCell>
                    {warehouse.farm?.user_name || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(warehouse.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWarehouse(warehouse);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit Warehouse
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWarehouse(warehouse);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          Delete Warehouse
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

      <CreateWarehouseDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedWarehouse && (
        <>
          <EditWarehouseDialog
            warehouse={selectedWarehouse}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteWarehouseDialog
            warehouse={selectedWarehouse}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
