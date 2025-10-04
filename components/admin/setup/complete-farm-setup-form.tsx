'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCompleteFarmSetup, FarmSetupInput } from '@/actions/farm-setup.actions';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const farmSetupSchema = z.object({
  user: z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    fname: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  }),
  farm: z.object({
    name: z.string().min(2, 'اسم المزرعة يجب أن يكون حرفين على الأقل'),
    location: z.string().optional(),
    is_active: z.boolean().default(true),
  }),
  warehouse: z.object({
    name: z.string().min(2, 'اسم المستودع يجب أن يكون حرفين على الأقل'),
  }),
  poultry: z.object({
    batch_name: z.string().min(2, 'اسم القطيع يجب أن يكون حرفين على الأقل'),
    opening_chicks: z.number().min(0, 'عدد الدجاج الابتدائي لا يمكن أن يكون سالباً'),
  }),
  materials: z.array(
    z.object({
      material_name_id: z.string().min(1, 'المادة مطلوبة'),
      unit_id: z.string().min(1, 'الوحدة مطلوبة'),
      opening_balance: z.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً'),
    })
  ).default([]),
});

type FarmSetupFormData = z.infer<typeof farmSetupSchema>;

interface CompleteFarmSetupFormProps {
  materialNames: Array<{ id: string; material_name: string }>;
  units: Array<{ id: string; unit_name: string }>;
}

export function CompleteFarmSetupForm({ materialNames, units }: CompleteFarmSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<FarmSetupFormData>({
    resolver: zodResolver(farmSetupSchema),
    defaultValues: {
      user: {
        email: '',
        password: '',
        fname: '',
      },
      farm: {
        name: '',
        location: '',
        is_active: true,
      },
      warehouse: {
        name: '',
      },
      poultry: {
        batch_name: '',
        opening_chicks: 0,
      },
      materials: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materials',
  });

  const onSubmit = async (data: FarmSetupFormData) => {
    setIsLoading(true);
    try {
      const result = await createCompleteFarmSetup(data as FarmSetupInput);
      
      if (result.success) {
        toast.success('تم إكمال إعداد المزرعة بنجاح!', {
          description: `تم إنشاء: المستخدم، المزرعة، المستودع، القطيع${data.materials.length > 0 ? '، والمواد' : ''}`,
        });
        setSetupComplete(true);
        reset();
        
        // Reset setup complete after 5 seconds
        setTimeout(() => {
          setSetupComplete(false);
        }, 5000);
      } else {
        toast.error('فشل الإعداد', {
          description: result.error || 'حدث خطأ أثناء الإعداد',
        });
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const addMaterial = () => {
    append({
      material_name_id: '',
      unit_id: '',
      opening_balance: 0,
    });
  };

  if (setupComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-900">تم الإعداد بنجاح!</h3>
              <p className="text-green-700 mt-2">
                تم تكوين المزرعة بنجاح مع جميع المكونات اللازمة.
              </p>
            </div>
            <Button onClick={() => setSetupComplete(false)} className="mt-4">
              إنشاء إعداد مزرعة جديد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Section */}
      <Card>
        <CardHeader>
          <CardTitle>1. بيانات المزارع</CardTitle>
          <CardDescription>إنشاء حساب مستخدم مزارع جديد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user.fname">الاسم الكامل *</Label>
              <Input
                id="user.fname"
                placeholder="مثال: أحمد محمد"
                {...register('user.fname')}
                disabled={isLoading}
              />
              {errors.user?.fname && (
                <p className="text-sm text-destructive">{errors.user.fname.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user.email">البريد الإلكتروني *</Label>
              <Input
                id="user.email"
                type="email"
                placeholder="ahmed@example.com"
                {...register('user.email')}
                disabled={isLoading}
              />
              {errors.user?.email && (
                <p className="text-sm text-destructive">{errors.user.email.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="user.password">كلمة المرور *</Label>
              <Input
                id="user.password"
                type="password"
                placeholder="6 أحرف على الأقل"
                {...register('user.password')}
                disabled={isLoading}
              />
              {errors.user?.password && (
                <p className="text-sm text-destructive">{errors.user.password.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Section */}
      <Card>
        <CardHeader>
          <CardTitle>2. بيانات المزرعة</CardTitle>
          <CardDescription>إنشاء مزرعة وتخصيصها للمزارع</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farm.name">اسم المزرعة *</Label>
              <Input
                id="farm.name"
                placeholder="مثال: مزرعة الوادي الأخضر"
                {...register('farm.name')}
                disabled={isLoading}
              />
              {errors.farm?.name && (
                <p className="text-sm text-destructive">{errors.farm.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm.location">الموقع</Label>
              <Input
                id="farm.location"
                placeholder="مثال: حي القديراني"
                {...register('farm.location')}
                disabled={isLoading}
              />
              {errors.farm?.location && (
                <p className="text-sm text-destructive">{errors.farm.location.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="farm.is_active"
                {...register('farm.is_active')}
                disabled={isLoading}
                defaultChecked
                className="rounded border-gray-300"
              />
              <Label htmlFor="farm.is_active" className="cursor-pointer">
                المزرعة نشطة
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Section */}
      <Card>
        <CardHeader>
          <CardTitle>3. بيانات المستودع</CardTitle>
          <CardDescription>إنشاء مستودع للمزرعة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse.name">اسم المستودع *</Label>
            <Input
              id="warehouse.name"
              placeholder="مثال: المستودع الرئيسي"
              {...register('warehouse.name')}
              disabled={isLoading}
            />
            {errors.warehouse?.name && (
              <p className="text-sm text-destructive">{errors.warehouse.name.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Poultry Section */}
      <Card>
        <CardHeader>
          <CardTitle>4. القطيع</CardTitle>
          <CardDescription>إنشاء قطيع أولي (دجاج)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poultry.batch_name">اسم القطيع *</Label>
              <Input
                id="poultry.batch_name"
                placeholder="مثال: قطيع 2024-01"
                {...register('poultry.batch_name')}
                disabled={isLoading}
              />
              {errors.poultry?.batch_name && (
                <p className="text-sm text-destructive">{errors.poultry.batch_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="poultry.opening_chicks">عدد الدجاج الابتدائي *</Label>
              <Input
                id="poultry.opening_chicks"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="مثال: 0"
                {...register('poultry.opening_chicks', { 
                  setValueAs: (value) => value === '' ? 0 : parseInt(value, 10) 
                })}
                disabled={isLoading}
              />
              {errors.poultry?.opening_chicks && (
                <p className="text-sm text-destructive">{errors.poultry.opening_chicks.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle>5. مواد الرصيد الافتتاحي (اختياري)</CardTitle>
          <CardDescription>
            إضافة مواد أولية إلى مخزون المستودع
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>لم تتم إضافة مواد بعد. انقر على الزر أدناه لإضافة المواد.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4 relative">
                  <div className="absolute top-2 left-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-12">
                    <div className="space-y-2">
                      <Label htmlFor={`materials.${index}.material_name_id`}>
                        المادة *
                      </Label>
                      <Select
                        value={watch(`materials.${index}.material_name_id`)}
                        onValueChange={(value) =>
                          setValue(`materials.${index}.material_name_id`, value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent>
                          {materialNames.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.material_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.materials?.[index]?.material_name_id && (
                        <p className="text-sm text-destructive">
                          {errors.materials[index]?.material_name_id?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`materials.${index}.unit_id`}>الوحدة *</Label>
                      <Select
                        value={watch(`materials.${index}.unit_id`)}
                        onValueChange={(value) =>
                          setValue(`materials.${index}.unit_id`, value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوحدة" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.materials?.[index]?.unit_id && (
                        <p className="text-sm text-destructive">
                          {errors.materials[index]?.unit_id?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`materials.${index}.opening_balance`}>
                        الرصيد الافتتاحي *
                      </Label>
                      <Input
                        id={`materials.${index}.opening_balance`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...register(`materials.${index}.opening_balance`, {
                          valueAsNumber: true,
                        })}
                        disabled={isLoading}
                      />
                      {errors.materials?.[index]?.opening_balance && (
                        <p className="text-sm text-destructive">
                          {errors.materials[index]?.opening_balance?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addMaterial}
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة مادة
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isLoading}
        >
          إعادة تعيين النموذج
        </Button>
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          إنشاء إعداد المزرعة الكامل
        </Button>
      </div>
    </form>
  );
}
