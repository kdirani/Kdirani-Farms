import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntegratedDailyReportForm from "@/components/farmer/integrated-daily-report-form";
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

  // Get user's farm
  const { data: farm } = await supabase
    .from("farms")
    .select("id, name")
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

  // Get warehouse for this farm
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("farm_id", farm.id)
    .limit(1);

  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">التقرير اليومي</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              لا يوجد مستودع مرتبط بمزرعتك. يرجى التواصل مع المدير.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const warehouse = warehouses[0];

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

  // Get clients (remove duplicates if any)
  const { data: clientsData } = await supabase
    .from("clients")
    .select("*")
    .order("name");
  
  // Remove duplicate clients by name
  const clients = clientsData?.filter((client, index, self) => 
    index === self.findIndex((c) => c.name === client.name && c.type === client.type)
  ) || [];

  // Get medicines
  const { data: medicines } = await supabase
    .from("medicines")
    .select("*")
    .order("name");

  // Get poultry status (one per farm)
  const { data: poultryStatus } = await supabase
    .from("poultry_status")
    .select("*")
    .eq("farm_id", farm.id)
    .maybeSingle();


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
          <IntegratedDailyReportForm
            warehouseId={warehouse.id}
            warehouseName={warehouse.name}
            farmId={farm.id}
            eggWeights={eggWeights || []}
            materialsNames={materialsNames || []}
            units={units || []}
            expenseTypes={expenseTypes || []}
            clients={clients || []}
            medicines={medicines || []}
            poultryStatus={poultryStatus || null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
