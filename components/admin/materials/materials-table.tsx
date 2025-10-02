'use client';

import { useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Package, MoreHorizontal, Search, Plus } from 'lucide-react';
import { CreateMaterialDialog } from './create-material-dialog';
import { EditMaterialDialog } from './edit-material-dialog';
import { DeleteMaterialDialog } from './delete-material-dialog';

interface MaterialsTableProps {
  materials: Material[];
}

export function MaterialsTable({ materials }: MaterialsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const filteredMaterials = materials.filter(
    (material) =>
      material.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.warehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.warehouse?.farm_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (current: number, opening: number) => {
    if (current === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    const percentage = (current / opening) * 100;
    if (percentage < 20) return <Badge variant="destructive">Low Stock</Badge>;
    if (percentage < 50) return <Badge variant="warning">Medium Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Purchases</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Consumption</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No materials found
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
                            setSelectedMaterial(material);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit Material
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMaterial(material);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          Delete Material
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
