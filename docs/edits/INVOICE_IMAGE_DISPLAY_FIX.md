# إصلاح مشكلة عرض الصور في صفحة تفاصيل الفاتورة

## المشكلة
كانت الصور المرفقة بالفواتير لا تُعرض بشكل صحيح في صفحة تفاصيل الفاتورة.

## الأسباب المحتملة

### 1. استخدام `<img>` بدلاً من `<Image>` من Next.js
- كان المكون يستخدم عنصر HTML العادي `<img>` بدلاً من مكون `Image` المحسّن من Next.js
- مكون `Image` من Next.js يوفر:
  - تحسين تلقائي للصور
  - lazy loading
  - معالجة أفضل للأخطاء
  - دعم أفضل لـ responsive images

### 2. عدم وجود معالجة للأخطاء
- لم يكن هناك معالج `onError` للصور
- في حالة فشل تحميل الصورة، كانت تظهر صورة مكسورة بدون بديل

### 3. عدم وجود حالة تحميل
- لم يكن هناك مؤشر لحالة تحميل الصورة
- المستخدم لا يعرف إذا كانت الصورة قيد التحميل أم فشلت

## الحل المطبق

### التغييرات في `invoice-attachments-section.tsx`:

1. **إضافة استيراد مكون Image من Next.js**
   ```tsx
   import Image from 'next/image';
   ```

2. **إضافة state لتتبع أخطاء الصور**
   ```tsx
   const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
   ```

3. **إضافة دالة معالجة الأخطاء**
   ```tsx
   const handleImageError = (attachmentId: string) => {
     setImageErrors(prev => new Set(prev).add(attachmentId));
   };
   ```

4. **تحديث عرض الصورة**
   - استخدام مكون `Image` من Next.js بدلاً من `<img>`
   - إضافة معالج `onError` للتعامل مع فشل التحميل
   - إضافة `unoptimized` لتجنب مشاكل التحسين مع Supabase Storage
   - استخدام `fill` مع `sizes` للتحكم في حجم الصورة
   - عرض أيقونة ملف بديلة في حالة فشل التحميل

   ```tsx
   {isImage(attachment.file_type) && !imageErrors.has(attachment.id) ? (
     <div className="relative w-16 h-16 rounded overflow-hidden bg-background border">
       <Image
         src={attachment.file_url}
         alt={attachment.file_name}
         fill
         className="object-cover"
         sizes="64px"
         onError={() => handleImageError(attachment.id)}
         unoptimized
       />
     </div>
   ) : (
     <div className="w-16 h-16 rounded bg-background flex items-center justify-center border">
       <FileIcon className="h-8 w-8 text-muted-foreground" />
     </div>
   )}
   ```

## التحقق من الإعدادات

### إعدادات Next.js (`next.config.js`)
تم التأكد من وجود إعدادات `remotePatterns` الصحيحة لـ Supabase:

```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
    {
      protocol: 'https',
      hostname: 'supabase.com',
    },
  ],
}
```

### متغيرات البيئة (`.env.local`)
تم التأكد من وجود URL الصحيح لـ Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://ypkiauidgvjsygwwdsqk.supabase.co
```

## خطوات إضافية للتحقق

إذا استمرت المشكلة، تحقق من:

1. **إعدادات Supabase Storage**
   - تأكد من أن bucket `files` موجود
   - تأكد من أن الـ bucket عام (public)
   - تحقق من إعدادات CORS

2. **صلاحيات الملفات**
   - تأكد من أن الملفات المرفوعة لها صلاحيات قراءة عامة
   - تحقق من RLS policies على جدول `invoice_attachments`

3. **تنسيق الملفات**
   - تأكد من أن نوع الملف (file_type) صحيح
   - تأكد من أن URL الملف صحيح ويبدأ بـ `https://`

4. **Console Errors**
   - افتح Developer Tools في المتصفح
   - تحقق من وجود أخطاء في Console
   - تحقق من Network tab لرؤية حالة طلبات الصور

## الفوائد

1. **تجربة مستخدم أفضل**: عرض أيقونة بديلة بدلاً من صورة مكسورة
2. **أداء محسّن**: استخدام مكون Image من Next.js
3. **معالجة أخطاء قوية**: تتبع الصور الفاشلة وعرض بديل مناسب
4. **صيانة أسهل**: كود أكثر وضوحاً وسهولة في الصيانة

## التاريخ
- **تاريخ الإصلاح**: 2025-10-02
- **المطور**: Cascade AI
