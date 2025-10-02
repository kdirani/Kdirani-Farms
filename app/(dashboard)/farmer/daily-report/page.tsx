import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DailyReportForm from "@/components/farmer/daily-report-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "التقرير اليومي - نظام إدارة المزارع",
  description: "إضافة تقرير يومي جديد للإنتاج",
};

export default async function DailyReportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Get user's farm and warehouse
  const { data: farm } = await supabase
    .from("farms")
    .select("id, name, warehouses(id, name)")
    .eq("user_id", session.user.id)
    .single();

  if (!farm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">التقرير اليومي</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              لا توجد مزرعة مرتبطة بحسابك. يرجى التواصل مع المدير.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get egg weights for invoices
  const { data: eggWeights } = await supabase
    .from("egg_weights")
    .select("*")
    .order("weight_range");

  // Get materials names
  const { data: materialsNames } = await supabase
    .from("materials_names")
    .select("*")
    .order("material_name");

  // Get measurement units
  const { data: units } = await supabase
    .from("measurement_units")
    .select("*")
    .order("unit_name");

  // Get expense types
  const { data: expenseTypes } = await supabase
    .from("expense_types")
    .select("*")
    .order("name");

  // Get clients
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  // Get medicines
  const { data: medicines } = await supabase
    .from("medicines")
    .select("*")
    .order("name");

  // Get poultry status
  const { data: poultryStatus } = await supabase
    .from("poultry_status")
    .select("*")
    .eq("farm_id", farm.id)
    .order("batch_name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقرير اليومي</h1>
          <p className="text-muted-foreground mt-1">
            أضف تقرير الإنتاج اليومي مع إمكانية إدخال الفواتير مباشرة
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إضافة تقرير يومي جديد</CardTitle>
          <CardDescription>
            املأ جميع الحقول المطلوبة. يمكنك إضافة فواتير بيع البيض والسواد والأدوية مباشرة من النموذج.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyReportForm
            warehouseId={farm.warehouses?.[0]?.id || ""}
            warehouseName={farm.warehouses?.[0]?.name || ""}
            farmId={farm.id}
            eggWeights={eggWeights || []}
            materialsNames={materialsNames || []}
            units={units || []}
            expenseTypes={expenseTypes || []}
            clients={clients || []}
            medicines={medicines || []}
            poultryStatus={poultryStatus || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
