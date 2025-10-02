'use client';

import { useState } from 'react';
import { deleteFarm, Farm } from '@/actions/farm.actions';
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

interface DeleteFarmDialogProps {
  farm: Farm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFarmDialog({ farm, open, onOpenChange }: DeleteFarmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteFarm(farm.id);
      
      if (result.success) {
        toast.success('Farm deleted successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete farm');
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
            Delete Farm
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this farm? This will also delete all associated warehouses, materials, and reports. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Farm:</span>
            <span className="text-sm">{farm.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Location:</span>
            <span className="text-sm">{farm.location || 'N/A'}</span>
          </div>
          {farm.user && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Farmer:</span>
              <span className="text-sm">{farm.user.fname}</span>
            </div>
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
            Delete Farm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
