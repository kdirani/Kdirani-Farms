
```sql
--------------------- ENUMs ---------------------
-- أدوار المستخدمين
CREATE TYPE user_role_enum AS ENUM ('admin', 'sub_admin', 'farmer');
-- أنواع العملاء
CREATE TYPE client_type_enum AS ENUM ('customer', 'provider');
--------------------- المستخدمين ---------------------
-- مرتبط بجدول المستخدمين الأساسي
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- معرف المستخدم من نوع uuid

  -- بيانات المستخدم
  fname text NOT NULL, -- الاسم الكامل
  user_role user_role_enum NOT NULL DEFAULT 'farmer', -- نوع المستخدم

  -- الطوابع الزمنية
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- تاريخ الإنشاء
  updated_at TIMESTAMP WITH TIME ZONE -- تاريخ التعديل
);


-- ================================
-- دالة لإنشاء بروفايل تلقائي عند إضافة مستخدم جديد
-- ================================
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تحقق إذا كان البروفايل موجود مسبقًا لتجنب التكرار
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id,
      fname,
      user_role,
      created_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'fname', '')::text,  -- الاسم الافتراضي من بيانات المستخدم
      'farmer',  -- الدور الافتراضي
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ================================
-- التريغر لتفعيل الدالة بعد إضافة مستخدم جديد
-- ================================
CREATE TRIGGER trg_create_profile_after_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();

-- ================================
-- فهرس لتسريع البحث على عمود id في جدول البروفايلات
-- ================================
CREATE INDEX IF NOT EXISTS idx_profiles_id
ON public.profiles(id);

-----------------------------------القوائم--------------------------------------------

-- جدول أوزان البيض
CREATE TABLE public.egg_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_range VARCHAR(50) NOT NULL UNIQUE, -- مثل "1850/1800" أو "كبير" أو "متوسط"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول أسماء المواد الغذائية
CREATE TABLE public.materials_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name VARCHAR(255) NOT NULL UNIQUE, -- اسم المادة مثل "ذرة" أو "علف 1"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول وحدات القياس
CREATE TABLE public.measurement_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name VARCHAR(50) NOT NULL UNIQUE, -- اسم الوحدة
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- انواع المصاريف
CREATE TABLE public.expense_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف نوع المصروف uuid
  name VARCHAR(100) UNIQUE NOT NULL,-- اسم نوع المصروف
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فقط يحوي أسماء الأدوية ومتى تُؤخذ
CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف الدواء uuid
  name VARCHAR(255) NOT NULL UNIQUE, -- اسم الدواء
  description TEXT, -- وصف الدواء
  day_of_age VARCHAR(255) NOT NULL, -- يوم إعطاء الدواء
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-----------------------------------القوائم--------------------------------------------











------------------------------ المزرعة والمستودع ------------------------------------
-- مزرعة واحدة لكل مستخدم
CREATE TABLE public.farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف المزرعة uuid
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE, -- معرف المستخدم
  name VARCHAR(255) NOT NULL, -- اسم المزرعة
  location VARCHAR(255), -- موقع المزرعة
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- حالة النشاط
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- تاريخ الإنشاء
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()  -- تاريخ التعديل
);

CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف المستودع uuid
  farm_id uuid UNIQUE REFERENCES public.farms(id) ON DELETE CASCADE, -- معرف المزرعة
  name VARCHAR(255) NOT NULL, -- اسم المستودع
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- المستودع يحوي مواد التصنيع ومواد الأعلاف ومواد الأدوية واللقاحات والكرتون
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف المادة uuid
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE, -- معرف المستودع
  material_name_id uuid REFERENCES public.materials_names(id), -- مرجع لاسم المادة
  unit_id uuid REFERENCES public.measurement_units(id), -- مرجع لوحدة القياس
  opening_balance DECIMAL(10,2) DEFAULT 0, -- الرصيد الافتتاحي
  purchases DECIMAL(10,2) DEFAULT 0, -- المشتريات
  sales DECIMAL(10,2) DEFAULT 0, -- المبيعات
  consumption DECIMAL(10,2) DEFAULT 0, -- كمية المادة المستهلكة
  manufacturing DECIMAL(10,2) DEFAULT 0, -- التصنيع
  current_balance DECIMAL(10,2) DEFAULT 0, -- الرصيد الحالي
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_warehouse_material UNIQUE (warehouse_id, material_name_id)
);

-- القطيع أو الدجاج يحوي العدد الأولي والنفوق والمتبقي
-- علاقة واحد لواحد: كل مزرعة لها قطيع واحد فقط
CREATE TABLE public.poultry_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف القطيع uuid
  farm_id uuid UNIQUE REFERENCES public.farms(id) ON DELETE CASCADE, -- معرف المزرعة (UNIQUE لضمان قطيع واحد لكل مزرعة)
  batch_name VARCHAR(255), -- اسم قطيع الدجاج
  opening_chicks INTEGER DEFAULT 0, -- عدد الدجاج الابتدائي
  dead_chicks INTEGER DEFAULT 0, -- النفوق
  remaining_chicks INTEGER DEFAULT 0, -- الدجاج المتبقي
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


------------------------------ المزرعة والمستودع ------------------------------------





------------------------------ التقارير اليومية -------------------------------------
-- تقارير الإنتاج اليومي
CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف التقرير uuid
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE, -- معرف المستودع
  report_date DATE NOT NULL, -- تاريخ التقرير
  report_time TIME WITHOUT TIME ZONE NOT NULL, -- توقيت التقرير
  production_eggs_healthy DECIMAL DEFAULT 0, -- إنتاج البيض السليم
  production_eggs_deformed DECIMAL DEFAULT 0, -- إنتاج البيض المشوه
  production_eggs DECIMAL DEFAULT 0, -- إنتاج البيض الكلي
  production_egg_rate DECIMAL DEFAULT 0, -- نسبة إنتاج البيض
  eggs_sold DECIMAL DEFAULT 0, -- كمية البيض المباع
  eggs_gift DECIMAL DEFAULT 0, -- كمية البيض المصروف كهدايا
  previous_eggs_balance DECIMAL DEFAULT 0, -- الرصيد التراكمي السابق
  current_eggs_balance DECIMAL DEFAULT 0, -- الرصيد الحالي بعد الإنتاج والبيع
  carton_consumption DECIMAL DEFAULT 0, -- استهلاك الكرتون
  chicks_before INT DEFAULT 0, -- عدد الدجاج قبل الإنتاج
  chicks_dead INT DEFAULT 0, -- عدد الدجاج النافق
  chicks_after INT DEFAULT 0, -- عدد الدجاج بعد الإنتاج
  feed_daily_kg DECIMAL(10,2) DEFAULT 0, -- كمية العلف اليومي
  feed_monthly_kg DECIMAL(10,2) DEFAULT 0, -- كمية العلف الشهري
  feed_ratio DECIMAL(6,2) DEFAULT 0, -- نسبة استهلاك العلف
  production_droppings DECIMAL(10,2) DEFAULT 0, -- كمية السواد المنتج
  notes TEXT, -- الملاحظات
  checked BOOLEAN DEFAULT FALSE, -- هل تم تدقيق التقرير؟
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.daily_report_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف المرفق uuid
  report_id uuid REFERENCES public.daily_reports(id) ON DELETE CASCADE, -- معرف التقرير اليومي
  file_url TEXT, -- رابط الملف
  file_name TEXT, -- اسم الملف
  file_type TEXT -- نوع الملف
);

------------------------------ التقارير اليومية -------------------------------------














--------------------- العملاء والفواتير التجارية ---------------------
-- بيانات العميل
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف العميل uuid
  name VARCHAR(255) NOT NULL, -- اسم العميل
  type client_type_enum NOT NULL -- نوع العميل
);

-- الفواتير التجارية
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف الفاتورة uuid
  invoice_type VARCHAR(10) CHECK (invoice_type IN ('buy', 'sell')), -- نوع الفاتورة
  invoice_date DATE NOT NULL, -- تاريخ الفاتورة
  invoice_time TIME WITHOUT TIME ZONE DEFAULT null, -- وقت الفاتورة
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- رقم الفاتورة --my del
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE, -- معرف المستودع
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL, -- معرف العميل
  total_items_value DECIMAL(12,2) DEFAULT 0, -- إجمالي قيمة المواد
  total_expenses_value DECIMAL(12,2) DEFAULT 0, -- إجمالي المصاريف
  net_value DECIMAL(12,2) DEFAULT 0, -- القيمة النهائية
  checked BOOLEAN DEFAULT FALSE, -- هل تم التدقيق؟
  notes TEXT -- ملاحظات
);

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف بند الفاتورة uuid
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE, -- معرف الفاتورة
  material_name_id uuid REFERENCES public.materials_names(id), -- مرجع لاسم المادة
  unit_id uuid REFERENCES public.measurement_units(id), -- مرجع لوحدة القياس
  egg_weight_id uuid REFERENCES public.egg_weights(id), -- مرجع لوزن البيض
  quantity DECIMAL(10,2) DEFAULT 0, -- الكمية
  price DECIMAL(10,2) DEFAULT 0, -- السعر
  value DECIMAL(12,2) DEFAULT 0 -- القيمة
);


CREATE TABLE public.invoice_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف مصروف الفاتورة uuid
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE, -- معرف الفاتورة
  expense_type_id uuid REFERENCES public.expense_types(id), -- نوع المصروف
  amount DECIMAL(10,2) DEFAULT 0, -- قيمة المصروف
  account_name VARCHAR(255) -- اسم الحساب المرتبط
);

CREATE TABLE public.invoice_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف المرفق uuid
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE, -- معرف الفاتورة
  file_url TEXT, -- رابط الملف
  file_name TEXT, -- اسم الملف
  file_type TEXT -- نوع الملف
);



















--------------------- التصنيع ---------------------
-- فواتير التصنيع
CREATE TABLE public.manufacturing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف فاتورة التصنيع uuid
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- رقم الفاتورة
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE, -- معرف المستودع
  blend_name VARCHAR(255), -- اسم الخلطة
  material_name_id uuid REFERENCES public.materials_names(id), -- مرجع لاسم المادة
  unit_id uuid REFERENCES public.measurement_units(id), -- مرجع لوحدة القياس
  quantity DECIMAL(10,2) DEFAULT 0, -- الكمية
  manufacturing_date DATE NOT NULL, -- تاريخ التصنيع
  manufacturing_time TIME WITHOUT TIME ZONE DEFAULT null, -- وقت التصنيع
  notes TEXT -- ملاحظات
);

CREATE TABLE public.manufacturing_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف بند التصنيع uuid
  manufacturing_invoice_id uuid REFERENCES public.manufacturing_invoices(id) ON DELETE CASCADE, -- معرف فاتورة التصنيع
  material_name_id uuid REFERENCES public.materials_names(id), -- مرجع لاسم المادة
  unit_id uuid REFERENCES public.measurement_units(id), -- مرجع لوحدة القياس
  quantity DECIMAL(10,2) DEFAULT 0, -- الكمية
  blend_count INT DEFAULT 1, -- عدد الخلطات
  weight DECIMAL(10,2) -- الوزن
);

CREATE TABLE public.manufacturing_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف مصروف التصنيع uuid
  manufacturing_invoice_id uuid REFERENCES public.manufacturing_invoices(id) ON DELETE CASCADE, -- معرف فاتورة التصنيع
  expense_type_id uuid REFERENCES public.expense_types(id), -- نوع المصروف
  amount DECIMAL(10,2), -- القيمة
  account_name VARCHAR(255) -- اسم الحساب المرتبط
);

CREATE TABLE public.manufacturing_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف مرفق التصنيع uuid
  manufacturing_invoice_id uuid REFERENCES public.manufacturing_invoices(id) ON DELETE CASCADE, -- معرف فاتورة التصنيع
  file_url TEXT, -- رابط الملف
  file_name TEXT, -- اسم الملف
  file_type TEXT -- نوع الملف
);





















--------------------- فواتير استهلاك الأدوية واللقاحات ---------------------
-- فواتير استهلاك الأدوية واللقاحات
CREATE TABLE public.medicine_consumption_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف فاتورة الاستهلاك uuid
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- رقم الفاتورة
  invoice_date DATE NOT NULL, -- تاريخ الفاتورة
  invoice_time TIME WITHOUT TIME ZONE DEFAULT now(), -- توقيت الفاتورة
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE, -- معرف المستودع
  poultry_status_id uuid REFERENCES public.poultry_status(id) ON DELETE CASCADE, -- معرف القطيع
  total_value DECIMAL(12,2) DEFAULT 0, -- إجمالي قيمة الاستهلاك
  notes TEXT, -- ملاحظات
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- تاريخ الإنشاء
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- تاريخ التعديل
);

CREATE TABLE public.medicine_consumption_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف بند الاستهلاك uuid
  consumption_invoice_id uuid REFERENCES public.medicine_consumption_invoices(id) ON DELETE CASCADE, -- معرف فاتورة الاستهلاك
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE, -- معرف الدواء
  unit_id uuid REFERENCES public.measurement_units(id), -- مرجع لوحدة القياس
  administration_day INTEGER, -- يوم إعطاء الدواء
  administration_date DATE, -- تاريخ إعطاء الدواء
  quantity DECIMAL(10,2) DEFAULT 0, -- الكمية المستهلكة
  price DECIMAL(10,2) DEFAULT 0, -- سعر الوحدة
  value DECIMAL(12,2) DEFAULT 0 -- القيمة النهائية
);

CREATE TABLE public.medicine_consumption_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف مصروف الاستهلاك uuid
  consumption_invoice_id uuid REFERENCES public.medicine_consumption_invoices(id) ON DELETE CASCADE, -- معرف فاتورة الاستهلاك
  expense_type_id uuid REFERENCES public.expense_types(id), -- نوع المصروف
  amount DECIMAL(10,2) DEFAULT 0, -- قيمة المصروف
  account_name VARCHAR(255) -- اسم الحساب المرتبط
);

CREATE TABLE public.medicine_consumption_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف مرفق الاستهلاك uuid
  consumption_invoice_id uuid REFERENCES public.medicine_consumption_invoices(id) ON DELETE CASCADE, -- معرف فاتورة الاستهلاك
  file_url TEXT, -- رابط الملف
  file_name TEXT, -- اسم الملف
  file_type TEXT -- نوع الملف
);

















--------------------- إدراج بيانات تجريبية ---------------------
-- وحدات القياس الأساسية
INSERT INTO public.measurement_units (unit_name) VALUES
('كيلو جرام'), ('جرام'), ('طن'), ('قطعة'), ('متر'), ('لتر'), ('كيس'), ('كرتونة'), ('مليلتر'), ('سنتيمتر');

-- أوزان البيض
INSERT INTO public.egg_weights (weight_range) VALUES
('1850/1800'), ('1750/1700'), ('1650/1600'), ('كبير'), ('متوسط'), ('صغير');

-- أسماء المواد
INSERT INTO public.materials_names (material_name) VALUES
('ذرة'), ('علف 1'), ('علف 2'), ('علف 3'), ('فول صويا'), ('نخالة قمح'), ('كرتون'), ('أدوية'), ('لقاحات');

-- أنواع المصاريف
INSERT INTO public.expense_types (name) VALUES
('نقل'), ('عمالة'), ('تأمين'), ('ضرائب'), ('صيانة'), ('مصاريف إدارية');

INSERT INTO public.medicines (name, description, day_of_age) VALUES
('مضاد حيوي + انرو فلوكساسين + مجموعة فيتامين + ه س', '', '1+2+3'),
('برايمر (قطرة)', '', '4'),
('كلون + زيتى مولتى + انفلونزا', '', '6'),
('جامبورو 2500 سيفا 2512', '', '10'),
('برونشيت 4/91 (قطرة أورش)', '', '14'),
('قص منقار', '', '18'),
('جمبورو E228 إنترفيت', '', '20'),
('كلون (رش أو قطرة)', '', '22'),
('كلون 30 + برونشيت إنترفنت', '', '40'),
('كلون', '', '60'),
('جدري + زيتى مولتى + برونشيت 4/91', '', '70'),
('برونشيت برايمر', '', '100'),
('كلون رش أو لاسوتا', '', '105'),
('زيتى ثلاثى + قص منقار', '', '107');

```
