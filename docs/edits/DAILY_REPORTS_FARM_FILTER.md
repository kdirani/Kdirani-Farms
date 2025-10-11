# تغيير الفلترة في صفحة التقارير اليومية - من المستودع إلى المزرعة

**التاريخ:** 11 أكتوبر 2025  
**الصفحة:** `/admin/daily-reports`  
**الهدف:** تغيير الفلترة من المستودع إلى المزرعة لتوحيد طريقة العرض مع صفحة التقارير العامة

---

## 📋 ملخص التغييرات

تم تحويل صفحة التقارير اليومية للمسؤول من الفلترة حسب المستودع إلى الفلترة حسب المزرعة، بنفس الطريقة المستخدمة في صفحة التقارير العامة.

---

## 🔧 الملفات المعدلة

### 1. **actions/daily-report.actions.ts**

#### إضافة دالة جديدة: `getDailyReportsByFarm`

```typescript
export async function getDailyReportsByFarm(farmId: string, page: number = 1, limit: number = 10) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح" };
    }

    const supabase = await createClient();

    // Get warehouses for this farm
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('farm_id', farmId);

    if (!warehouses || warehouses.length === 0) {
      return {
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const warehouseIds = warehouses.map(w => w.id);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("daily_reports")
      .select("*", { count: "exact" })
      .in("warehouse_id", warehouseIds)
      .order("report_date", { ascending: false })
      .order("report_time", { ascending: false })
      .range(from, to);

    if (error) {
      return { success: false, error: "فشل في جلب التقارير" };
    }

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching daily reports by farm:", error);
    return { success: false, error: "حدث خطأ أثناء جلب التقارير" };
  }
}
```

**الآلية:**
1. جلب جميع المستودعات التابعة للمزرعة المحددة
2. استخدام `IN` clause للبحث في جميع المستودعات
3. إرجاع النتائج مع pagination

---

### 2. **app/(dashboard)/admin/daily-reports/page.tsx**

#### التغييرات الرئيسية:

**قبل:**
```typescript
import { getDailyReports } from '@/actions/daily-report.actions';
import { getWarehousesForMaterials } from '@/actions/material.actions';

async function DailyReportsContent({ warehouseId, page }: { warehouseId?: string; page: number }) {
  const warehousesResult = await getWarehousesForMaterials();
  const selectedWarehouseId = warehouseId || warehousesResult.data[0].id;
  const result = await getDailyReports(selectedWarehouseId, page);
  
  return (
    <DailyReportsView 
      reports={result.data || []} 
      warehouses={warehousesResult.data}
      selectedWarehouseId={selectedWarehouseId}
      pagination={result.pagination}
    />
  );
}

interface DailyReportsPageProps {
  searchParams: Promise<{ warehouse?: string; page?: string }>;
}
```

**بعد:**
```typescript
import { getDailyReportsByFarm } from '@/actions/daily-report.actions';
import { getFarms } from '@/actions/farm.actions';

async function DailyReportsContent({ farmId, page }: { farmId?: string; page: number }) {
  const farmsResult = await getFarms();
  const selectedFarmId = farmId || farmsResult.data[0].id;
  const result = await getDailyReportsByFarm(selectedFarmId, page);
  
  return (
    <DailyReportsView 
      reports={result.data || []} 
      farms={farmsResult.data}
      selectedFarmId={selectedFarmId}
      pagination={result.pagination}
    />
  );
}

interface DailyReportsPageProps {
  searchParams: Promise<{ farm?: string; page?: string }>;
}
```

---

### 3. **components/admin/daily-reports/daily-reports-view.tsx**

#### التغييرات:

**قبل:**
```typescript
interface Warehouse {
  id: string;
  name: string;
}

interface DailyReportsViewProps {
  reports: DailyReport[];
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  pagination?: Pagination;
}

export function DailyReportsView({ reports, warehouses, selectedWarehouseId, pagination }) {
  const handleWarehouseChange = (warehouseId: string) => {
    router.push(`/admin/daily-reports?warehouse=${warehouseId}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/daily-reports?warehouse=${selectedWarehouseId}&page=${page}`);
  };

  return (
    <Select value={selectedWarehouseId} onValueChange={handleWarehouseChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="اختر المستودع" />
      </SelectTrigger>
      <SelectContent>
        {warehouses.map((warehouse) => (
          <SelectItem key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**بعد:**
```typescript
interface Farm {
  id: string;
  name: string;
}

interface DailyReportsViewProps {
  reports: DailyReport[];
  farms: Farm[];
  selectedFarmId: string;
  pagination?: Pagination;
}

export function DailyReportsView({ reports, farms, selectedFarmId, pagination }) {
  const handleFarmChange = (farmId: string) => {
    router.push(`/admin/daily-reports?farm=${farmId}`);
  };

  const handlePageChange = (page: number) => {
    router.push(`/admin/daily-reports?farm=${selectedFarmId}&page=${page}`);
  };

  return (
    <Select value={selectedFarmId} onValueChange={handleFarmChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="اختر المزرعة" />
      </SelectTrigger>
      <SelectContent>
        {farms.map((farm) => (
          <SelectItem key={farm.id} value={farm.id}>
            {farm.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

### 4. **components/admin/daily-reports/export-daily-reports-button.tsx**

#### التغييرات:

**قبل:**
```typescript
interface ExportDailyReportsButtonProps {
  warehouseId: string;
  warehouseName?: string;
}

export function ExportDailyReportsButton({ warehouseId, warehouseName }) {
  const handleExport = async () => {
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select(`*`)
      .eq('warehouse_id', warehouseId)
      .order('report_date', { ascending: false });
    
    const fileName = `تقارير_يومية_${warehouseName}_${date}.xlsx`;
  };
}
```

**بعد:**
```typescript
interface ExportDailyReportsButtonProps {
  farmId: string;
  farmName?: string;
}

export function ExportDailyReportsButton({ farmId, farmName }) {
  const handleExport = async () => {
    // جلب المستودعات التابعة للمزرعة
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('farm_id', farmId);

    if (!warehouses || warehouses.length === 0) {
      alert('لا توجد مستودعات لهذه المزرعة');
      return;
    }

    const warehouseIds = warehouses.map(w => w.id);

    // جلب بيانات التقارير اليومية للمزرعة المحددة
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select(`*`)
      .in('warehouse_id', warehouseIds)
      .order('report_date', { ascending: false });
    
    const fileName = `تقارير_يومية_${farmName}_${date}.xlsx`;
  };
}
```

---

## 🔄 آلية العمل

### قبل التعديل:
```
المستخدم → يختار مستودع → يعرض تقارير المستودع
```

### بعد التعديل:
```
المستخدم → يختار مزرعة → يجلب مستودعات المزرعة → يعرض تقارير جميع المستودعات
```

---

## 📊 الفوائد

1. **توحيد واجهة المستخدم:** نفس طريقة الفلترة في صفحة التقارير العامة
2. **رؤية شاملة:** عرض جميع تقارير المزرعة من جميع المستودعات
3. **سهولة الاستخدام:** المستخدم يفكر بمستوى المزرعة وليس المستودع
4. **مرونة:** يمكن للمزرعة أن تحتوي على عدة مستودعات

---

## 🧪 الاختبار

### اختبارات مطلوبة:

1. ✅ فتح صفحة `/admin/daily-reports`
2. ✅ التأكد من ظهور قائمة المزارع بدلاً من المستودعات
3. ✅ اختيار مزرعة وعرض تقاريرها
4. ✅ التأكد من عرض تقارير جميع مستودعات المزرعة
5. ✅ اختبار Pagination
6. ✅ اختبار زر التصدير
7. ✅ التأكد من أن الملف المصدر يحتوي على بيانات من جميع المستودعات

---

## 📝 ملاحظات

- الدالة القديمة `getDailyReports` لم يتم حذفها، لا تزال موجودة للاستخدامات الأخرى
- تم إنشاء دالة جديدة `getDailyReportsByFarm` للفلترة حسب المزرعة
- جميع التغييرات متوافقة مع البنية الحالية للقاعدة
- لا حاجة لتعديل قاعدة البيانات

---

## 🔗 العلاقات في قاعدة البيانات

```
farms (المزارع)
  ↓ (farm_id)
warehouses (المستودعات)
  ↓ (warehouse_id)
daily_reports (التقارير اليومية)
```

---

## ✅ Checklist

- [x] إضافة دالة `getDailyReportsByFarm`
- [x] تعديل `page.tsx` للاستخدام المزارع
- [x] تعديل `daily-reports-view.tsx`
- [x] تعديل `export-daily-reports-button.tsx`
- [x] توثيق التغييرات
- [ ] اختبار يدوي شامل
- [ ] مراجعة الكود

---

**تم التنفيذ بواسطة:** Cascade AI  
**التاريخ:** 11 أكتوبر 2025
