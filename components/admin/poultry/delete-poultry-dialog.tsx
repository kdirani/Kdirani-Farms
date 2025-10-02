'use client';

import { useState } from 'react';
import { deletePoultryStatus, PoultryStatus } from '@/actions/poultry.actions';
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

interface DeletePoultryDialogProps {
  poultry: PoultryStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePoultryDialog({ poultry, open, onOpenChange }: DeletePoultryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deletePoultryStatus(poultry.id);
      
      if (result.success) {
        toast.success('Poultry batch deleted successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete poultry batch');
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
            Delete Poultry Batch
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this poultry batch? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Batch:</span>
            <span className="text-sm">{poultry.batch_name || 'Unnamed'}</span>
          </div>
          {poultry.farm && (
            <>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Farm:</span>
                <span className="text-sm">{poultry.farm.name}</span>
              </div>
              {poultry.farm.user_name && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Farmer:</span>
                  <span className="text-sm">{poultry.farm.user_name}</span>
                </div>
              )}
            </>
          )}
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Opening Chicks:</span>
              <span className="text-sm">{poultry.opening_chicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Dead Chicks:</span>
              <span className="text-sm text-destructive">{poultry.dead_chicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Remaining:</span>
              <span className="text-sm font-semibold">{poultry.remaining_chicks.toLocaleString()}</span>
            </div>
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
            Delete Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
