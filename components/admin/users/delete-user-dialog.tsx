'use client';

import { useState } from 'react';
import { deleteUser, User } from '@/actions/user.actions';
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

interface DeleteUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteUser(user.id);
      
      if (result.success) {
        toast.success('تم حذف المستخدم بنجاح');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في حذف المستخدم');
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
            حذف المستخدم
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">الاسم:</span>
            <span className="text-sm">{user.fname}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">البريد الإلكتروني:</span>
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">الدور:</span>
            <span className="text-sm capitalize">{user.user_role.replace('_', ' ')}</span>
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
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            حذف المستخدم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
