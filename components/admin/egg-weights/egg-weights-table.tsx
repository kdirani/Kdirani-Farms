'use client';

import { useState } from 'react';
import { EggWeight, deleteEggWeight, createEggWeight, updateEggWeight } from '@/actions/egg-weight.actions';
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

interface EggWeightsTableProps {
  eggWeights: EggWeight[];
}

export function EggWeightsTable({ eggWeights: initialEggWeights }: EggWeightsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEggWeight, setSelectedEggWeight] = useState<EggWeight | null>(null);
  const [weightRange, setWeightRange] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredEggWeights = initialEggWeights.filter((eggWeight) =>
    eggWeight.weight_range.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!weightRange.trim()) {
      toast.error('Weight range is required');
      return;
    }
    setIsLoading(true);
    const result = await createEggWeight({ weight_range: weightRange });
    if (result.success) {
      toast.success('Egg weight created successfully');
      setWeightRange('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to create egg weight');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedEggWeight || !weightRange.trim()) return;
    setIsLoading(true);
    const result = await updateEggWeight({ id: selectedEggWeight.id, weight_range: weightRange });
    if (result.success) {
      toast.success('Egg weight updated successfully');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update egg weight');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedEggWeight) return;
    setIsLoading(true);
    const result = await deleteEggWeight(selectedEggWeight.id);
    if (result.success) {
      toast.success('Egg weight deleted successfully');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete egg weight');
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
            placeholder="Search egg weights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setWeightRange('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Egg Weight
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Weight Range</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEggWeights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No egg weights found
                </TableCell>
              </TableRow>
            ) : (
              filteredEggWeights.map((eggWeight) => (
                <TableRow key={eggWeight.id}>
                  <TableCell className="font-medium">{eggWeight.weight_range}</TableCell>
                  <TableCell>{format(new Date(eggWeight.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(eggWeight.updated_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEggWeight(eggWeight);
                          setWeightRange(eggWeight.weight_range);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEggWeight(eggWeight);
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
            <DialogTitle>Add Egg Weight</DialogTitle>
            <DialogDescription>Enter a new egg weight range to add to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="weight_range">Weight Range</Label>
            <Input
              id="weight_range"
              placeholder="e.g., Large, Medium, 60-65g, 1850/1800"
              value={weightRange}
              onChange={(e) => setWeightRange(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Examples: Large, Medium, Small, 60-65g, 1850/1800
            </p>
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
            <DialogTitle>Edit Egg Weight</DialogTitle>
            <DialogDescription>Update the egg weight range</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_weight_range">Weight Range</Label>
            <Input
              id="edit_weight_range"
              placeholder="e.g., Large, Medium, 60-65g, 1850/1800"
              value={weightRange}
              onChange={(e) => setWeightRange(e.target.value)}
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
            <DialogTitle>Delete Egg Weight</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEggWeight?.weight_range}"? This action cannot be undone.
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
