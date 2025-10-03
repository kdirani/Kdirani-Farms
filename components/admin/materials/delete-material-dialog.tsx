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
        toast.success('تم حذف المادة بنجاح');
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'فشل في حذف المادة');
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
            حذف المادة
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من رغبتك في حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">المادة:</span>
            <span className="text-sm">{material.material_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">المستودع:</span>
            <span className="text-sm">{material.warehouse?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">الرصيد الحالي:</span>
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
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حذف المادة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
