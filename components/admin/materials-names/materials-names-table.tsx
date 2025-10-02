'use client';

import { useState } from 'react';
import { MaterialName, deleteMaterialName, createMaterialName, updateMaterialName } from '@/actions/material-name.actions';
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

interface MaterialNamesTableProps {
  materialNames: MaterialName[];
}

export function MaterialNamesTable({ materialNames: initialMaterialNames }: MaterialNamesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialName | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredMaterials = initialMaterialNames.filter((material) =>
    material.material_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!materialName.trim()) {
      toast.error('Material name is required');
      return;
    }
    setIsLoading(true);
    const result = await createMaterialName({ material_name: materialName });
    if (result.success) {
      toast.success('Material name created successfully');
      setMaterialName('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to create material name');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedMaterial || !materialName.trim()) return;
    setIsLoading(true);
    const result = await updateMaterialName({ id: selectedMaterial.id, material_name: materialName });
    if (result.success) {
      toast.success('Material name updated successfully');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update material name');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;
    setIsLoading(true);
    const result = await deleteMaterialName(selectedMaterial.id);
    if (result.success) {
      toast.success('Material name deleted successfully');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete material name');
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
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setMaterialName('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material Name
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No material names found
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.material_name}</TableCell>
                  <TableCell>{format(new Date(material.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(material.updated_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMaterial(material);
                          setMaterialName(material.material_name);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMaterial(material);
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
            <DialogTitle>Add Material Name</DialogTitle>
            <DialogDescription>Enter a new material name to add to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="material_name">Material Name</Label>
            <Input
              id="material_name"
              placeholder="e.g., Corn, Wheat, Feed Mix"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
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
            <DialogTitle>Edit Material Name</DialogTitle>
            <DialogDescription>Update the material name</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_material_name">Material Name</Label>
            <Input
              id="edit_material_name"
              placeholder="e.g., Corn, Wheat, Feed Mix"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
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
            <DialogTitle>Delete Material Name</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMaterial?.material_name}"? This action cannot be undone.
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
