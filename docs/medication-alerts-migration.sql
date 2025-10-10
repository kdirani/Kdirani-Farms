-- ==================================================================================
-- استعلامات إضافة نظام التنبيهات الدوائية بناءً على عمر الفراخ
-- ==================================================================================
-- 
-- الملخص:
-- 1. إضافة حقل تاريخ ميلاد الفراخ (chick_birth_date) إلى جدول farms
-- 2. إنشاء جدول التنبيهات الدوائية (medication_alerts)
-- 3. إنشاء دالة لحساب عمر الفراخ باليوم
-- 4. إنشاء دالة لإنشاء التنبيهات تلقائياً عند إنشاء المزرعة
-- 5. إنشاء دالة لجلب التنبيهات النشطة
-- 6. إنشاء دالة لتحديث حالة التنبيهات
-- 
-- ==================================================================================

-- ==================================================================================
-- 1. إضافة حقل تاريخ ميلاد الفراخ (chick_birth_date) إلى جدول farms
-- ==================================================================================

-- إضافة عمود تاريخ ميلاد الفراخ
ALTER TABLE public.farms 
ADD COLUMN chick_birth_date DATE;

-- إضافة تعليق على العمود
COMMENT ON COLUMN public.farms.chick_birth_date IS 'تاريخ ميلاد/فقس الفراخ في المزرعة، يستخدم لحساب عمر الفراخ وتحديد مواعيد الأدوية';

-- ==================================================================================
-- 2. إنشاء جدول التنبيهات الدوائية (medication_alerts)
-- ==================================================================================

-- جدول التنبيهات الدوائية
CREATE TABLE public.medication_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- معرف التنبيه
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE, -- معرف المزرعة
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE, -- معرف الدواء
  
  -- معلومات التنبيه
  scheduled_day INTEGER NOT NULL, -- اليوم المجدول لإعطاء الدواء (عمر الفرخة باليوم)
  scheduled_date DATE NOT NULL, -- التاريخ المجدول لإعطاء الدواء
  alert_date DATE NOT NULL, -- تاريخ التنبيه (قد يكون قبل scheduled_date بيوم)
  
  -- حالة التنبيه
  is_administered BOOLEAN NOT NULL DEFAULT FALSE, -- هل تم إعطاء الدواء؟
  administered_at TIMESTAMP WITH TIME ZONE, -- تاريخ ووقت إعطاء الدواء
  administered_by uuid REFERENCES public.profiles(id), -- من قام بإعطاء الدواء
  
  -- ملاحظات
  notes TEXT, -- ملاحظات حول التنبيه أو إعطاء الدواء
  
  -- الطوابع الزمنية
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- قيود
  CONSTRAINT unique_farm_medicine_day UNIQUE (farm_id, medicine_id, scheduled_day)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_medication_alerts_farm_id ON public.medication_alerts(farm_id);
CREATE INDEX idx_medication_alerts_medicine_id ON public.medication_alerts(medicine_id);
CREATE INDEX idx_medication_alerts_scheduled_date ON public.medication_alerts(scheduled_date);
CREATE INDEX idx_medication_alerts_is_administered ON public.medication_alerts(is_administered);
CREATE INDEX idx_medication_alerts_alert_date ON public.medication_alerts(alert_date);

-- إضافة تعليقات
COMMENT ON TABLE public.medication_alerts IS 'جدول التنبيهات الدوائية للمزارع بناءً على عمر الفراخ';
COMMENT ON COLUMN public.medication_alerts.scheduled_day IS 'عمر الفرخة باليوم عند إعطاء الدواء';
COMMENT ON COLUMN public.medication_alerts.scheduled_date IS 'التاريخ الفعلي المجدول لإعطاء الدواء';
COMMENT ON COLUMN public.medication_alerts.alert_date IS 'تاريخ ظهور التنبيه (قد يكون قبل التاريخ المجدول)';
COMMENT ON COLUMN public.medication_alerts.is_administered IS 'حالة إعطاء الدواء: true = تم الإعطاء، false = لم يتم بعد';

-- ==================================================================================
-- 3. دالة لحساب عمر الفراخ باليوم
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.calculate_chick_age_in_days(
  birth_date DATE,
  reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- إذا كان تاريخ الميلاد null، نعيد null
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- حساب الفرق بالأيام
  RETURN reference_date - birth_date;
END;
$$;

COMMENT ON FUNCTION public.calculate_chick_age_in_days IS 'دالة لحساب عمر الفراخ بالأيام من تاريخ الميلاد';

-- ==================================================================================
-- 4. دالة لتحليل أيام الدواء من النص (مثل "1+2+3" أو "6" أو "70")
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.parse_medicine_days(day_of_age_text TEXT)
RETURNS INTEGER[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  days_array INTEGER[] := ARRAY[]::INTEGER[];
  day_part TEXT;
  day_num INTEGER;
BEGIN
  -- تقسيم النص حسب علامة +
  FOREACH day_part IN ARRAY string_to_array(day_of_age_text, '+')
  LOOP
    BEGIN
      -- محاولة تحويل النص إلى رقم
      day_num := trim(day_part)::INTEGER;
      days_array := array_append(days_array, day_num);
    EXCEPTION WHEN OTHERS THEN
      -- تجاهل القيم غير الرقمية
      NULL;
    END;
  END LOOP;
  
  RETURN days_array;
END;
$$;

COMMENT ON FUNCTION public.parse_medicine_days IS 'دالة لتحليل نص أيام إعطاء الدواء مثل "1+2+3" إلى مصفوفة أرقام';

-- ==================================================================================
-- 5. دالة لإنشاء التنبيهات الدوائية للمزرعة
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.create_medication_alerts_for_farm(
  p_farm_id uuid,
  p_chick_birth_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  medicine_record RECORD;
  medicine_days INTEGER[];
  medicine_day INTEGER;
  scheduled_date DATE;
  alert_date DATE;
BEGIN
  -- التحقق من وجود المزرعة وتاريخ الميلاد
  IF p_chick_birth_date IS NULL THEN
    RAISE EXCEPTION 'يجب تحديد تاريخ ميلاد الفراخ';
  END IF;
  
  -- حذف التنبيهات القديمة للمزرعة إذا كانت موجودة
  DELETE FROM public.medication_alerts WHERE farm_id = p_farm_id;
  
  -- المرور على جميع الأدوية
  FOR medicine_record IN 
    SELECT id, name, day_of_age 
    FROM public.medicines 
    WHERE day_of_age IS NOT NULL AND day_of_age != ''
  LOOP
    -- تحليل أيام الدواء
    medicine_days := public.parse_medicine_days(medicine_record.day_of_age);
    
    -- إنشاء تنبيه لكل يوم
    FOREACH medicine_day IN ARRAY medicine_days
    LOOP
      -- حساب التاريخ المجدول
      scheduled_date := p_chick_birth_date + medicine_day;
      
      -- حساب تاريخ التنبيه (يوم واحد قبل التاريخ المجدول)
      -- إذا كان اليوم هو اليوم 0 أو 1، نجعل التنبيه في نفس اليوم
      IF medicine_day <= 1 THEN
        alert_date := scheduled_date;
      ELSE
        alert_date := scheduled_date - 1;
      END IF;
      
      -- إدراج التنبيه
      INSERT INTO public.medication_alerts (
        farm_id,
        medicine_id,
        scheduled_day,
        scheduled_date,
        alert_date,
        is_administered,
        created_at
      )
      VALUES (
        p_farm_id,
        medicine_record.id,
        medicine_day,
        scheduled_date,
        alert_date,
        FALSE,
        NOW()
      )
      ON CONFLICT (farm_id, medicine_id, scheduled_day) DO NOTHING;
    END LOOP;
  END LOOP;
  
END;
$$;

COMMENT ON FUNCTION public.create_medication_alerts_for_farm IS 'دالة لإنشاء جميع التنبيهات الدوائية لمزرعة بناءً على تاريخ ميلاد الفراخ';

-- ==================================================================================
-- 6. Trigger لإنشاء التنبيهات تلقائياً عند إضافة أو تحديث تاريخ ميلاد الفراخ
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.auto_create_medication_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- إذا تم إضافة أو تحديث تاريخ الميلاد
  IF NEW.chick_birth_date IS NOT NULL AND 
     (OLD.chick_birth_date IS NULL OR OLD.chick_birth_date != NEW.chick_birth_date) THEN
    
    -- إنشاء التنبيهات
    PERFORM public.create_medication_alerts_for_farm(NEW.id, NEW.chick_birth_date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء Trigger
DROP TRIGGER IF EXISTS trg_auto_create_medication_alerts ON public.farms;

CREATE TRIGGER trg_auto_create_medication_alerts
AFTER INSERT OR UPDATE OF chick_birth_date ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_medication_alerts();

COMMENT ON FUNCTION public.auto_create_medication_alerts IS 'Trigger function لإنشاء التنبيهات الدوائية تلقائياً عند إضافة أو تحديث تاريخ ميلاد الفراخ';

-- ==================================================================================
-- 7. دالة لجلب التنبيهات النشطة للمزرعة
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.get_active_alerts_for_farm(
  p_farm_id uuid,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  alert_id uuid,
  medicine_id uuid,
  medicine_name TEXT,
  medicine_description TEXT,
  scheduled_day INTEGER,
  scheduled_date DATE,
  alert_date DATE,
  is_administered BOOLEAN,
  days_until_scheduled INTEGER,
  is_overdue BOOLEAN,
  priority TEXT,
  notes TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id AS alert_id,
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.description AS medicine_description,
    ma.scheduled_day,
    ma.scheduled_date,
    ma.alert_date,
    ma.is_administered,
    (ma.scheduled_date - CURRENT_DATE) AS days_until_scheduled,
    (ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered) AS is_overdue,
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered THEN 'عاجل - متأخر'
      WHEN ma.scheduled_date = CURRENT_DATE AND NOT ma.is_administered THEN 'عاجل - اليوم'
      WHEN ma.scheduled_date = CURRENT_DATE + 1 AND NOT ma.is_administered THEN 'مهم - غداً'
      WHEN ma.scheduled_date <= CURRENT_DATE + p_days_ahead AND NOT ma.is_administered THEN 'عادي'
      ELSE 'غير عاجل'
    END AS priority,
    ma.notes
  FROM public.medication_alerts ma
  INNER JOIN public.medicines m ON ma.medicine_id = m.id
  WHERE ma.farm_id = p_farm_id
    AND NOT ma.is_administered -- فقط التنبيهات التي لم يتم تنفيذها
    AND ma.alert_date <= CURRENT_DATE + p_days_ahead -- التنبيهات خلال الفترة المحددة
  ORDER BY 
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE THEN 1 -- المتأخرة أولاً
      WHEN ma.scheduled_date = CURRENT_DATE THEN 2 -- اليوم
      WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 3 -- غداً
      ELSE 4 -- البقية
    END,
    ma.scheduled_date ASC;
END;
$$;

COMMENT ON FUNCTION public.get_active_alerts_for_farm IS 'دالة لجلب التنبيهات النشطة للمزرعة مع تصنيف الأولوية';

-- ==================================================================================
-- 8. دالة لتحديث حالة التنبيه (تم إعطاء الدواء)
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.mark_alert_as_administered(
  p_alert_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.medication_alerts
  SET 
    is_administered = TRUE,
    administered_at = NOW(),
    administered_by = p_user_id,
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_alert_id
    AND NOT is_administered; -- فقط إذا لم يتم تحديثه مسبقاً
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$;

COMMENT ON FUNCTION public.mark_alert_as_administered IS 'دالة لتحديث حالة التنبيه إلى "تم إعطاء الدواء"';

-- ==================================================================================
-- 9. دالة لإلغاء تحديد التنبيه (إلغاء إعطاء الدواء)
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.unmark_alert_as_administered(
  p_alert_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.medication_alerts
  SET 
    is_administered = FALSE,
    administered_at = NULL,
    administered_by = NULL,
    updated_at = NOW()
  WHERE id = p_alert_id
    AND is_administered; -- فقط إذا كان محدداً مسبقاً
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$;

COMMENT ON FUNCTION public.unmark_alert_as_administered IS 'دالة لإلغاء تحديد التنبيه (إذا تم إعطاء الدواء بالخطأ)';

-- ==================================================================================
-- 10. View لعرض ملخص التنبيهات لجميع المزارع
-- ==================================================================================

CREATE OR REPLACE VIEW public.v_medication_alerts_summary AS
SELECT 
  f.id AS farm_id,
  f.name AS farm_name,
  f.chick_birth_date,
  public.calculate_chick_age_in_days(f.chick_birth_date, CURRENT_DATE) AS current_chick_age,
  COUNT(ma.id) AS total_alerts,
  COUNT(CASE WHEN ma.is_administered THEN 1 END) AS completed_alerts,
  COUNT(CASE WHEN NOT ma.is_administered THEN 1 END) AS pending_alerts,
  COUNT(CASE WHEN ma.scheduled_date < CURRENT_DATE AND NOT ma.is_administered THEN 1 END) AS overdue_alerts,
  COUNT(CASE WHEN ma.scheduled_date = CURRENT_DATE AND NOT ma.is_administered THEN 1 END) AS today_alerts,
  COUNT(CASE WHEN ma.scheduled_date = CURRENT_DATE + 1 AND NOT ma.is_administered THEN 1 END) AS tomorrow_alerts
FROM public.farms f
LEFT JOIN public.medication_alerts ma ON f.id = ma.farm_id
WHERE f.chick_birth_date IS NOT NULL
GROUP BY f.id, f.name, f.chick_birth_date;

COMMENT ON VIEW public.v_medication_alerts_summary IS 'عرض ملخص التنبيهات الدوائية لجميع المزارع';

-- ==================================================================================
-- 11. دالة للحصول على التنبيهات القادمة (للصفحة الرئيسية)
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.get_upcoming_alerts(
  p_user_id uuid,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  alert_id uuid,
  farm_id uuid,
  farm_name TEXT,
  medicine_name TEXT,
  scheduled_date DATE,
  days_until INTEGER,
  priority TEXT,
  urgency_level INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id AS alert_id,
    f.id AS farm_id,
    f.name AS farm_name,
    m.name AS medicine_name,
    ma.scheduled_date,
    (ma.scheduled_date - CURRENT_DATE) AS days_until,
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE THEN 'متأخر'
      WHEN ma.scheduled_date = CURRENT_DATE THEN 'اليوم'
      WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 'غداً'
      ELSE 'قادم'
    END AS priority,
    CASE 
      WHEN ma.scheduled_date < CURRENT_DATE THEN 1
      WHEN ma.scheduled_date = CURRENT_DATE THEN 2
      WHEN ma.scheduled_date = CURRENT_DATE + 1 THEN 3
      ELSE 4
    END AS urgency_level
  FROM public.medication_alerts ma
  INNER JOIN public.farms f ON ma.farm_id = f.id
  INNER JOIN public.medicines m ON ma.medicine_id = m.id
  WHERE f.user_id = p_user_id
    AND NOT ma.is_administered
    AND ma.scheduled_date >= CURRENT_DATE - 7 -- إظهار المتأخرة لآخر 7 أيام
  ORDER BY urgency_level ASC, ma.scheduled_date ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_upcoming_alerts IS 'دالة للحصول على التنبيهات القادمة للمزارع (للصفحة الرئيسية)';

-- ==================================================================================
-- تم إنشاء جميع الاستعلامات بنجاح
-- ==================================================================================

-- ملاحظات مهمة:
-- 1. يجب تشغيل هذه الاستعلامات بالترتيب
-- 2. بعد إضافة حقل chick_birth_date للمزارع الحالية، يمكن تشغيل:
--    SELECT public.create_medication_alerts_for_farm(farm_id, chick_birth_date) FROM farms WHERE chick_birth_date IS NOT NULL;
-- 3. التنبيهات تُنشأ تلقائياً عند إضافة أو تحديث تاريخ ميلاد الفراخ
-- 4. يمكن للمزارع رؤية التنبيهات باستخدام: SELECT * FROM public.get_active_alerts_for_farm('farm_id');
-- 5. يمكن للمزارع رؤية التنبيهات القادمة باستخدام: SELECT * FROM public.get_upcoming_alerts('user_id');
