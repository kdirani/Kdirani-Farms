'use client';

import { useState } from 'react';
import { Medicine, deleteMedicine, createMedicine, updateMedicine } from '@/actions/medicine.actions';
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MedicinesTableProps {
  medicines: Medicine[];
}

export function MedicinesTable({ medicines: initialMedicines }: MedicinesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', day_of_age: '' });
  const [isLoading, setIsLoading] = useState(false);

  const filteredMedicines = initialMedicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.day_of_age.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.day_of_age.trim()) {
      toast.error('Name and day of age are required');
      return;
    }
    setIsLoading(true);
    const result = await createMedicine(formData);
    if (result.success) {
      toast.success('Medicine created successfully');
      setFormData({ name: '', description: '', day_of_age: '' });
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to create medicine');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedMedicine || !formData.name.trim() || !formData.day_of_age.trim()) return;
    setIsLoading(true);
    const result = await updateMedicine({ id: selectedMedicine.id, ...formData });
    if (result.success) {
      toast.success('Medicine updated successfully');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update medicine');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedMedicine) return;
    setIsLoading(true);
    const result = await deleteMedicine(selectedMedicine.id);
    if (result.success) {
      toast.success('Medicine deleted successfully');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete medicine');
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
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setFormData({ name: '', description: '', day_of_age: '' });
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Day of Age</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No medicines found
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.description || '-'}</TableCell>
                  <TableCell>{medicine.day_of_age}</TableCell>
                  <TableCell>{format(new Date(medicine.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMedicine(medicine);
                          setFormData({
                            name: medicine.name,
                            description: medicine.description || '',
                            day_of_age: medicine.day_of_age,
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMedicine(medicine);
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
            <DialogDescription>Enter medicine or vaccine details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Newcastle Disease Vaccine"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day_of_age">Day of Age *</Label>
              <Input
                id="day_of_age"
                placeholder="e.g., Day 1, Day 7, Week 2"
                value={formData.day_of_age}
                onChange={(e) => setFormData({ ...formData, day_of_age: e.target.value })}
                disabled={isLoading}
              />
            </div>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Update medicine or vaccine details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Medicine Name *</Label>
              <Input
                id="edit_name"
                placeholder="e.g., Newcastle Disease Vaccine"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Input
                id="edit_description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_day_of_age">Day of Age *</Label>
              <Input
                id="edit_day_of_age"
                placeholder="e.g., Day 1, Day 7, Week 2"
                value={formData.day_of_age}
                onChange={(e) => setFormData({ ...formData, day_of_age: e.target.value })}
                disabled={isLoading}
              />
            </div>
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
            <DialogTitle>Delete Medicine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMedicine?.name}"? This action cannot be undone.
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
