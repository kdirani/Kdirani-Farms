'use client';

import { useState } from 'react';
import { deleteWarehouse, Warehouse } from '@/actions/warehouse.actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteWarehouseDialogProps {
  warehouse: Warehouse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteWarehouseDialog({ warehouse, open, onOpenChange }: DeleteWarehouseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteWarehouse(warehouse.id);
      
      if (result.success) {
        toast.success('Warehouse deleted successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete warehouse');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Warehouse
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this warehouse? This will also delete all associated materials, daily reports, and invoices. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Warehouse:</span>
            <span className="text-sm">{warehouse.name}</span>
          </div>
          {warehouse.farm && (
            <>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Farm:</span>
                <span className="text-sm">{warehouse.farm.name}</span>
              </div>
              {warehouse.farm.user_name && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Farmer:</span>
                  <span className="text-sm">{warehouse.farm.user_name}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Warehouse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
