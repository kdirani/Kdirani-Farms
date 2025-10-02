'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUser, CreateUserInput } from '@/actions/user.actions';
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

const userSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fname: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  user_role: z.enum(['admin', 'sub_admin', 'farmer']),
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      user_role: 'farmer',
    },
  });

  const userRole = watch('user_role');

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const result = await createUser(data as CreateUserInput);
      
      if (result.success) {
        toast.success('تم إنشاء المستخدم بنجاح');
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'فشل في إنشاء المستخدم');
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
          <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
          <DialogDescription>
أضف مستخدمًا جديدًا إلى النظام. سيتلقى بيانات الدخول عبر البريد الإلكتروني.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fname">الاسم الكامل</Label>
            <Input
              id="fname"
              placeholder="أحمد محمد"
              {...register('fname')}
              disabled={isLoading}
            />
            {errors.fname && (
              <p className="text-sm text-destructive">{errors.fname.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="ahmed@example.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_role">الدور</Label>
            <Select
              value={userRole}
              onValueChange={(value) => setValue('user_role', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر دورًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">مزارع</SelectItem>
                <SelectItem value="sub_admin">مدير مساعد</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
              </SelectContent>
            </Select>
            {errors.user_role && (
              <p className="text-sm text-destructive">{errors.user_role.message}</p>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إنشاء المستخدم
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
