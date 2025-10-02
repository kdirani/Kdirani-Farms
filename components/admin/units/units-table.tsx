'use client';

import { useState } from 'react';
import { MeasurementUnit, deleteMeasurementUnit, createMeasurementUnit, updateMeasurementUnit } from '@/actions/unit.actions';
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
import { format } from 'date-fns';

interface UnitsTableProps {
  units: MeasurementUnit[];
}

export function UnitsTable({ units: initialUnits }: UnitsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredUnits = initialUnits.filter((unit) =>
    unit.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!unitName.trim()) {
      toast.error('Unit name is required');
      return;
    }
    setIsLoading(true);
    const result = await createMeasurementUnit({ unit_name: unitName });
    if (result.success) {
      toast.success('Measurement unit created successfully');
      setUnitName('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to create measurement unit');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedUnit || !unitName.trim()) return;
    setIsLoading(true);
    const result = await updateMeasurementUnit({ id: selectedUnit.id, unit_name: unitName });
    if (result.success) {
      toast.success('Measurement unit updated successfully');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update measurement unit');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;
    setIsLoading(true);
    const result = await deleteMeasurementUnit(selectedUnit.id);
    if (result.success) {
      toast.success('Measurement unit deleted successfully');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete measurement unit');
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
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setUnitName('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No measurement units found
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_name}</TableCell>
                  <TableCell>{format(new Date(unit.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(unit.updated_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setUnitName(unit.unit_name);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUnit(unit);
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
            <DialogTitle>Add Measurement Unit</DialogTitle>
            <DialogDescription>Enter a new measurement unit to add to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="unit_name">Unit Name</Label>
            <Input
              id="unit_name"
              placeholder="e.g., kg, ton, liter, piece"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Measurement Unit</DialogTitle>
            <DialogDescription>Update the measurement unit</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_unit_name">Unit Name</Label>
            <Input
              id="edit_unit_name"
              placeholder="e.g., kg, ton, liter, piece"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Measurement Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedUnit?.unit_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
