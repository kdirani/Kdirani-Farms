'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateFarm, getUsersWithoutFarms, Farm } from '@/actions/farm.actions';
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

const farmSchema = z.object({
  name: z.string().min(2, 'اسم المزرعة يجب أن يكون حرفين على الأقل'),
  location: z.string().optional(),
  user_id: z.string().optional(),
  is_active: z.boolean(),
});

type FarmFormData = z.infer<typeof farmSchema>;

interface EditFarmDialogProps {
  farm: Farm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFarmDialog({ farm, open, onOpenChange }: EditFarmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; fname: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
  });

  const userId = watch('user_id');

  useEffect(() => {
    if (farm && open) {
      reset({
        name: farm.name,
        location: farm.location || '',
        user_id: farm.user_id || undefined,
        is_active: farm.is_active,
      });
      loadAvailableUsers();
    }
  }, [farm, open, reset]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    const result = await getUsersWithoutFarms();
    if (result.success && result.data) {
      // Include current user if farm is assigned
      let users = result.data;
      if (farm.user_id && farm.user) {
        users = [
          { id: farm.user_id, fname: farm.user.fname, email: farm.user.email },
          ...users
        ];
      }
      setAvailableUsers(users);
    }
    setLoadingUsers(false);
  };

  const onSubmit = async (data: FarmFormData) => {
    setIsLoading(true);
    try {
      const result = await updateFarm({
        id: farm.id,
        name: data.name,
        location: data.location,
        user_id: data.user_id,
        is_active: data.is_active,
      });
      
      if (result.success) {
        toast.success('تم تحديث المزرعة بنجاح');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في تحديث المزرعة');
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعديل المزرعة</DialogTitle>
          <DialogDescription>
            تحديث معلومات المزرعة والتعيين.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المزرعة *</Label>
            <Input
              id="name"
              placeholder="مثال: مزرعة الوادي الأخضر"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">الموقع</Label>
            <Input
              id="location"
              placeholder="مثال: منطقة القديراني"
              {...register('location')}
              disabled={isLoading}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_id">تعيين إلى مزارع</Label>
            <Select
              value={userId}
              onValueChange={(value) => setValue('user_id', value === 'none' ? undefined : value)}
              disabled={isLoading || loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? 'جاري تحميل المزارعين...' : 'اختر مزارعًا'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">لا يوجد مزارع (غير معين)</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fname} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              disabled={isLoading}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer mr-2">
              المزرعة نشطة
            </Label>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
