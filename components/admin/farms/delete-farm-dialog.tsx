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
        toast.success('تم حذف المزرعة بنجاح');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في حذف المزرعة');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
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
            حذف المزرعة
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف هذه المزرعة؟ سيؤدي هذا أيضًا إلى حذف جميع المستودعات والمواد والتقارير المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">المزرعة:</span>
            <span className="text-sm">{farm.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">الموقع:</span>
            <span className="text-sm">{farm.location || 'غير متوفر'}</span>
          </div>
          {farm.user && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">المزارع:</span>
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
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حذف المزرعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
