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
        toast.success('تم حذف دفعة الدواجن بنجاح');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في حذف دفعة الدواجن');
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
            حذف دفعة الدواجن
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في حذف دفعة الدواجن هذه؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">الدفعة:</span>
            <span className="text-sm">{poultry.batch_name || 'بدون اسم'}</span>
          </div>
          {poultry.farm && (
            <>
              <div className="flex justify-between">
                <span className="text-sm font-medium">المزرعة:</span>
                <span className="text-sm">{poultry.farm.name}</span>
              </div>
              {poultry.farm.user_name && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">المزارع:</span>
                  <span className="text-sm">{poultry.farm.user_name}</span>
                </div>
              )}
            </>
          )}
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-sm font-medium">عدد الكتاكيت الافتتاحي:</span>
              <span className="text-sm">{poultry.opening_chicks.toLocaleString('en-US')}</span>
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
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حذف الدفعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
