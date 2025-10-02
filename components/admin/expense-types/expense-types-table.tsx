'use client';

import { useState } from 'react';
import { ExpenseType, deleteExpenseType, createExpenseType, updateExpenseType } from '@/actions/expense-type.actions';
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

interface ExpenseTypesTableProps {
  expenseTypes: ExpenseType[];
}

export function ExpenseTypesTable({ expenseTypes: initialExpenseTypes }: ExpenseTypesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState<ExpenseType | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredExpenseTypes = initialExpenseTypes.filter((expenseType) =>
    expenseType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Expense type name is required');
      return;
    }
    setIsLoading(true);
    const result = await createExpenseType({ name });
    if (result.success) {
      toast.success('Expense type created successfully');
      setName('');
      setCreateDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to create expense type');
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedExpenseType || !name.trim()) return;
    setIsLoading(true);
    const result = await updateExpenseType({ id: selectedExpenseType.id, name });
    if (result.success) {
      toast.success('Expense type updated successfully');
      setEditDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update expense type');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedExpenseType) return;
    setIsLoading(true);
    const result = await deleteExpenseType(selectedExpenseType.id);
    if (result.success) {
      toast.success('Expense type deleted successfully');
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to delete expense type');
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
            placeholder="Search expense types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => {
          setName('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense Type
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense Type Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenseTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No expense types found
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenseTypes.map((expenseType) => (
                <TableRow key={expenseType.id}>
                  <TableCell className="font-medium">{expenseType.name}</TableCell>
                  <TableCell>{format(new Date(expenseType.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(expenseType.updated_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedExpenseType(expenseType);
                          setName(expenseType.name);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedExpenseType(expenseType);
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
            <DialogTitle>Add Expense Type</DialogTitle>
            <DialogDescription>Enter a new expense type to add to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="name">Expense Type Name</Label>
            <Input
              id="name"
              placeholder="e.g., Transportation, Labor, Utilities"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <DialogTitle>Edit Expense Type</DialogTitle>
            <DialogDescription>Update the expense type name</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_name">Expense Type Name</Label>
            <Input
              id="edit_name"
              placeholder="e.g., Transportation, Labor, Utilities"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <DialogTitle>Delete Expense Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedExpenseType?.name}"? This action cannot be undone.
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
