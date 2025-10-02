'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPoultryStatus, getActiveFarms } from '@/actions/poultry.actions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const poultrySchema = z.object({
  batch_name: z.string().min(2, 'Batch name must be at least 2 characters'),
  farm_id: z.string().min(1, 'Farm is required'),
  opening_chicks: z.number().min(1, 'Opening chicks must be at least 1'),
});

type PoultryFormData = z.infer<typeof poultrySchema>;

interface CreatePoultryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePoultryDialog({ open, onOpenChange }: CreatePoultryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableFarms, setAvailableFarms] = useState<Array<{ id: string; name: string; location: string | null }>>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PoultryFormData>({
    resolver: zodResolver(poultrySchema),
    defaultValues: {
      opening_chicks: 1000,
    },
  });

  const farmId = watch('farm_id');

  useEffect(() => {
    if (open) {
      loadAvailableFarms();
    }
  }, [open]);

  const loadAvailableFarms = async () => {
    setLoadingFarms(true);
    const result = await getActiveFarms();
    if (result.success && result.data) {
      setAvailableFarms(result.data);
    }
    setLoadingFarms(false);
  };

  const onSubmit = async (data: PoultryFormData) => {
    setIsLoading(true);
    try {
      const result = await createPoultryStatus({
        batch_name: data.batch_name,
        farm_id: data.farm_id,
        opening_chicks: data.opening_chicks,
      });
      
      if (result.success) {
        toast.success('Poultry batch created successfully');
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to create poultry batch');
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
          <DialogTitle>Create New Poultry Batch</DialogTitle>
          <DialogDescription>
            Add a new poultry batch and assign it to a farm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="farm_id">Assign to Farm *</Label>
            <Select
              value={farmId}
              onValueChange={(value) => setValue('farm_id', value)}
              disabled={isLoading || loadingFarms}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingFarms ? 'Loading farms...' : 'Select a farm'} />
              </SelectTrigger>
              <SelectContent>
                {availableFarms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name} {farm.location ? `- ${farm.location}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.farm_id && (
              <p className="text-sm text-destructive">{errors.farm_id.message}</p>
            )}
            {availableFarms.length === 0 && !loadingFarms && (
              <p className="text-xs text-muted-foreground">
                No farms available. Please create a farm first.
              </p>
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
            <p className="text-xs text-muted-foreground">
              Initial number of chicks in this batch
            </p>
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
            <Button type="submit" disabled={isLoading || availableFarms.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
