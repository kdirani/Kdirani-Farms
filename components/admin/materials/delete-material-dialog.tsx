'use client';

import { useState } from 'react';
import { deleteMaterial, Material } from '@/actions/material.actions';
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

interface DeleteMaterialDialogProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMaterialDialog({ material, open, onOpenChange }: DeleteMaterialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteMaterial(material.id);
      
      if (result.success) {
        toast.success('Material deleted successfully');
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to delete material');
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
            Delete Material
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this material? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Material:</span>
            <span className="text-sm">{material.material_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Warehouse:</span>
            <span className="text-sm">{material.warehouse?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Current Balance:</span>
            <span className="text-sm font-semibold">{material.current_balance} {material.unit_name}</span>
          </div>
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
            Delete Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
