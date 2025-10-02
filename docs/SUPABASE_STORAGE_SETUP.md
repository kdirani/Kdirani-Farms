# إعداد Supabase Storage للمشروع

## المشكلة
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

هذا الخطأ يعني أن bucket `files` غير موجود في Supabase Storage.

## الحل: إنشاء Storage Bucket

### الخطوات:

#### 1. الدخول إلى Supabase Dashboard
1. افتح [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر المشروع الخاص بك: `ypkiauidgvjsygwwdsqk`

#### 2. إنشاء Bucket جديد
1. من القائمة الجانبية، اختر **Storage**
2. اضغط على **"New bucket"** أو **"Create bucket"**
3. أدخل المعلومات التالية:
   - **Name**: `files`
   - **Public bucket**: ✅ **نعم** (مهم جداً لعرض الصور)
   - **File size limit**: اتركه على القيمة الافتراضية أو حدد حسب حاجتك (مثلاً 50MB)
   - **Allowed MIME types**: اتركه فارغاً للسماح بجميع الأنواع، أو حدد:
     - `image/*` للصور
     - `application/pdf` لملفات PDF
     - `application/vnd.openxmlformats-officedocument.*` لملفات Office
4. اضغط **"Create bucket"**

#### 3. إعداد Policies (اختياري لكن موصى به)

بعد إنشاء الـ bucket، يمكنك إعداد policies للتحكم في الوصول:

##### Policy للقراءة العامة (Public Read):
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'files' );
```

##### Policy للرفع (Upload) - للمستخدمين المصرح لهم فقط:
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'files' );
```

##### Policy للحذف - للمستخدمين المصرح لهم فقط:
```sql
CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'files' );
```

### 4. التحقق من الإعداد

بعد إنشاء الـ bucket، يمكنك التحقق من خلال:

1. **من Dashboard**:
   - اذهب إلى Storage → files
   - جرب رفع ملف تجريبي
   - انسخ الـ URL وافتحه في المتصفح للتأكد من أنه يعمل

2. **من التطبيق**:
   - جرب رفع صورة من صفحة الفاتورة
   - تحقق من أن الصورة تظهر بشكل صحيح

## هيكل المجلدات المستخدم في التطبيق

التطبيق يستخدم المجلدات التالية داخل bucket `files`:

```
files/
├── invoices/
│   ├── buy/          # مرفقات فواتير الشراء
│   └── sell/         # مرفقات فواتير البيع
├── daily-reports/    # مرفقات التقارير اليومية
└── manufacturing/    # مرفقات التصنيع
```

## إعدادات CORS (إذا لزم الأمر)

إذا واجهت مشاكل CORS، أضف هذه الإعدادات في Supabase Dashboard:

1. اذهب إلى **Settings** → **API**
2. في قسم **CORS**, أضف:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

## التحقق من الإعدادات الحالية

### تحقق من أن الـ bucket عام (Public):
1. اذهب إلى Storage → files
2. اضغط على أيقونة الإعدادات (⚙️) بجانب اسم الـ bucket
3. تأكد من أن **"Public bucket"** مفعّل ✅

### تحقق من الـ URL:
يجب أن يكون شكل الـ URL كالتالي:
```
https://ypkiauidgvjsygwwdsqk.supabase.co/storage/v1/object/public/files/[path-to-file]
```

## استكشاف الأخطاء

### الخطأ: "Bucket not found"
- **السبب**: الـ bucket غير موجود
- **الحل**: اتبع الخطوات أعلاه لإنشاء bucket باسم `files`

### الخطأ: "Access denied" أو 403
- **السبب**: الـ bucket ليس عاماً أو الـ policies غير صحيحة
- **الحل**: 
  1. تأكد من أن الـ bucket عام (Public)
  2. راجع الـ policies وتأكد من وجود policy للقراءة العامة

### الخطأ: CORS
- **السبب**: إعدادات CORS غير صحيحة
- **الحل**: أضف domain التطبيق في إعدادات CORS

## ملاحظات مهمة

1. **الأمان**: 
   - الـ bucket عام للقراءة فقط
   - الرفع والحذف محدود للمستخدمين المصرح لهم
   - لا تخزن معلومات حساسة في bucket عام

2. **الأداء**:
   - استخدم أسماء ملفات فريدة (timestamp + random string)
   - نظف الملفات القديمة بشكل دوري

3. **التكلفة**:
   - راقب حجم التخزين المستخدم
   - Supabase يوفر 1GB مجاناً في الخطة المجانية

## المراجع

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage CORS](https://supabase.com/docs/guides/storage/cors)

---

**تاريخ الإنشاء**: 2025-10-02  
**آخر تحديث**: 2025-10-02
