# إضافة فلترة الفواتير حسب المزرعة

**التاريخ:** 11 أكتوبر 2025  
**الصفحة:** `/admin/invoices`  
**الهدف:** إضافة فلترة للفواتير حسب المزرعة لتوحيد طريقة العرض مع باقي الصفحات

---

## 📋 ملخص التغييرات

تم إضافة فلترة للفواتير حسب المزرعة في صفحة إدارة الفواتير، بنفس الطريقة المستخدمة في صفحة التقارير اليومية والتقارير العامة.

---

## 🔧 الملفات المعدلة

### 1. **actions/invoice.actions.ts**

#### إضافة دالة جديدة: `getInvoicesByFarm`

```typescript
export async function getInvoicesByFarm(farmId: string): Promise<ActionResult<Invoice[]>> {
  try {
    const supabase = await createClient();

    // Authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.user_role !== 'admin' && profile.user_role !== 'sub_admin')) {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Get warehouses for this farm
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('farm_id', farmId);

    if (!warehouses || warehouses.length === 0) {
      return { success: true, data: [] };
    }

    const warehouseIds = warehouses.map(w => w.id);

    // Get invoices for all warehouses in this farm
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('warehouse_id', warehouseIds)
      .order('invoice_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Enrich invoices with warehouse and client info
    const enrichedInvoices: Invoice[] = [];
    
    for (const invoice of invoices || []) {
      let warehouseInfo = undefined;
      let clientInfo = undefined;

      if (invoice.warehouse_id) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select('name, farm_id')
          .eq('id', invoice.warehouse_id)
          .single();

        if (warehouse) {
          const { data: farm } = await supabase
            .from('farms')
            .select('name')
            .eq('id', warehouse.farm_id)
            .single();

          warehouseInfo = {
            name: warehouse.name,
            farm_name: farm?.name || 'Unknown',
          };
        }
      }

      if (invoice.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('name, type')
          .eq('id', invoice.client_id)
          .single();

        if (client) {
          clientInfo = {
            name: client.name,
            type: client.type,
          };
        }
      }

      enrichedInvoices.push({
        ...invoice,
        warehouse: warehouseInfo,
        client: clientInfo,
      });
    }

    return { success: true, data: enrichedInvoices };
  } catch (error) {
    console.error('Error getting invoices by farm:', error);
    return { success: false, error: 'Failed to get invoices' };
  }
}
```

**الآلية:**
1. جلب جميع المستودعات التابعة للمزرعة المحددة
2. استخدام `IN` clause للبحث في جميع المستودعات
3. إثراء البيانات بمعلومات المستودع والعميل

---

### 2. **app/(dashboard)/admin/invoices/page.tsx**

#### التغييرات الرئيسية:

**قبل:**
```typescript
import { getInvoices } from '@/actions/invoice.actions';

async function InvoicesContent() {
  const result = await getInvoices();
  return <InvoicesTable invoices={result.data} />;
}

export default function InvoicesPage() {
  return (
    <InvoicesContent />
  );
}
```

**بعد:**
```typescript
import { getInvoicesByFarm } from '@/actions/invoice.actions';
import { getFarms } from '@/actions/farm.actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function InvoicesContent({ farmId }: { farmId?: string }) {
  // Get farms first
  const farmsResult = await getFarms();
  
  if (!farmsResult.success || !farmsResult.data || farmsResult.data.length === 0) {
    return <Alert>لم يتم العثور على مزارع</Alert>;
  }

  // Use first farm if no farm selected
  const selectedFarmId = farmId || farmsResult.data[0].id;

  const result = await getInvoicesByFarm(selectedFarmId);

  return (
    <InvoicesTable 
      invoices={result.data} 
      farms={farmsResult.data}
      selectedFarmId={selectedFarmId}
    />
  );
}

interface InvoicesPageProps {
  searchParams: Promise<{ farm?: string }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  return (
    <InvoicesContent farmId={params.farm} />
  );
}
```

---

### 3. **components/admin/invoices/invoices-table.tsx**

#### التغييرات:

**قبل:**
```typescript
interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="البحث في الفواتير..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectItem value="all">جميع الأنواع</SelectItem>
          <SelectItem value="buy">شراء</SelectItem>
          <SelectItem value="sell">بيع</SelectItem>
        </Select>
      </div>
    </div>
  );
}
```

**بعد:**
```typescript
import { useRouter } from 'next/navigation';

interface Farm {
  id: string;
  name: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  farms: Farm[];
  selectedFarmId: string;
}

export function InvoicesTable({ invoices, farms, selectedFarmId }: InvoicesTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');

  const handleFarmChange = (farmId: string) => {
    router.push(`/admin/invoices?farm=${farmId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedFarmId} onValueChange={handleFarmChange}>
          <SelectTrigger className="w-48">
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
        <Input
          placeholder="البحث في الفواتير..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectItem value="all">جميع الأنواع</SelectItem>
          <SelectItem value="buy">شراء</SelectItem>
          <SelectItem value="sell">بيع</SelectItem>
        </Select>
      </div>
    </div>
  );
}
```

---

## 🔄 آلية العمل

### قبل التعديل:
```
المستخدم → يرى جميع الفواتير من كل المستودعات
```

### بعد التعديل:
```
المستخدم → يختار مزرعة → يجلب مستودعات المزرعة → يعرض فواتير جميع المستودعات
```

---

## 📊 الفوائد

1. **توحيد واجهة المستخدم:** نفس طريقة الفلترة في جميع الصفحات
2. **رؤية منظمة:** عرض الفواتير حسب المزرعة بدلاً من خلطها
3. **سهولة الإدارة:** المستخدم يفكر بمستوى المزرعة
4. **أداء أفضل:** تحميل فواتير مزرعة واحدة بدلاً من الكل

---

## 🎯 الميزات

- **فلترة حسب المزرعة:** dropdown في أعلى الجدول
- **البحث:** البحث في رقم الفاتورة، اسم العميل، اسم المستودع
- **فلترة حسب النوع:** شراء / بيع / الكل
- **URL Parameters:** يتم حفظ المزرعة المختارة في URL (`?farm=xxx`)

---

## 🧪 الاختبار

### اختبارات مطلوبة:

1. ✅ فتح صفحة `/admin/invoices`
2. ✅ التأكد من ظهور قائمة المزارع
3. ✅ اختيار مزرعة وعرض فواتيرها
4. ✅ التأكد من عرض فواتير جميع مستودعات المزرعة
5. ✅ اختبار البحث
6. ✅ اختبار فلترة النوع (شراء/بيع)
7. ✅ التأكد من أن URL يتحدث عند تغيير المزرعة

---

## 📝 ملاحظات

- الدالة القديمة `getInvoices` لم يتم حذفها، لا تزال موجودة للاستخدامات الأخرى
- تم إضافة `dynamic = 'force-dynamic'` و `revalidate = 0` لضمان تحديث البيانات
- جميع التغييرات متوافقة مع البنية الحالية للقاعدة
- لا حاجة لتعديل قاعدة البيانات

---

## 🔗 العلاقات في قاعدة البيانات

```
farms (المزارع)
  ↓ (farm_id)
warehouses (المستودعات)
  ↓ (warehouse_id)
invoices (الفواتير)
```

---

## ✅ Checklist

- [x] إضافة دالة `getInvoicesByFarm`
- [x] تعديل `page.tsx` لاستخدام المزارع
- [x] تعديل `invoices-table.tsx` لإضافة dropdown المزارع
- [x] إضافة `useRouter` للتنقل
- [x] توثيق التغييرات
- [ ] اختبار يدوي شامل
- [ ] مراجعة الكود

---

**تم التنفيذ بواسطة:** Cascade AI  
**التاريخ:** 11 أكتوبر 2025
