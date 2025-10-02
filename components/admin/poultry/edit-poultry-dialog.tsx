'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updatePoultryStatus, PoultryStatus } from '@/actions/poultry.actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const poultrySchema = z.object({
  batch_name: z.string().min(2, 'Batch name must be at least 2 characters'),
  opening_chicks: z.number().min(1, 'Opening chicks must be at least 1'),
  dead_chicks: z.number().min(0, 'Dead chicks cannot be negative'),
});

type PoultryFormData = z.infer<typeof poultrySchema>;

interface EditPoultryDialogProps {
  poultry: PoultryStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPoultryDialog({ poultry, open, onOpenChange }: EditPoultryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PoultryFormData>({
    resolver: zodResolver(poultrySchema),
  });

  const openingChicks = watch('opening_chicks');
  const deadChicks = watch('dead_chicks');
  const remainingChicks = openingChicks - deadChicks;

  useEffect(() => {
    if (poultry && open) {
      reset({
        batch_name: poultry.batch_name || '',
        opening_chicks: poultry.opening_chicks,
        dead_chicks: poultry.dead_chicks,
      });
    }
  }, [poultry, open, reset]);

  const onSubmit = async (data: PoultryFormData) => {
    setIsLoading(true);
    try {
      const result = await updatePoultryStatus({
        id: poultry.id,
        batch_name: data.batch_name,
        opening_chicks: data.opening_chicks,
        dead_chicks: data.dead_chicks,
      });
      
      if (result.success) {
        toast.success('Poultry batch updated successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to update poultry batch');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Poultry Batch</DialogTitle>
          <DialogDescription>
            Update batch information and chick counts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {poultry.farm && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Farm:</span> {poultry.farm.name}
                {poultry.farm.location && <span className="text-muted-foreground"> ({poultry.farm.location})</span>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="batch_name">Batch Name *</Label>
            <Input
              id="batch_name"
              placeholder="e.g., Batch 2024-01"
              {...register('batch_name')}
              disabled={isLoading}
            />
            {errors.batch_name && (
              <p className="text-sm text-destructive">{errors.batch_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_chicks">Opening Chicks Count *</Label>
            <Input
              id="opening_chicks"
              type="number"
              min="1"
              placeholder="e.g., 1000"
              {...register('opening_chicks', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.opening_chicks && (
              <p className="text-sm text-destructive">{errors.opening_chicks.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dead_chicks">Dead Chicks Count *</Label>
            <Input
              id="dead_chicks"
              type="number"
              min="0"
              placeholder="e.g., 50"
              {...register('dead_chicks', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.dead_chicks && (
              <p className="text-sm text-destructive">{errors.dead_chicks.message}</p>
            )}
          </div>

          {!isNaN(remainingChicks) && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remaining Chicks:</span>
                <span className="text-lg font-bold">
                  {remainingChicks >= 0 ? remainingChicks.toLocaleString() : (
                    <span className="text-destructive">Invalid (negative)</span>
                  )}
                </span>
              </div>
              {remainingChicks >= 0 && openingChicks > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Mortality Rate: {((deadChicks / openingChicks) * 100).toFixed(2)}%
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || remainingChicks < 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
