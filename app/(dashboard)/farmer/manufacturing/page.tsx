import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ManufacturingForm } from "@/components/farmer/manufacturing-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "فاتورة تصنيع - نظام إدارة المزارع",
  description: "إنشاء فاتورة تصنيع علف جديدة",
};

export default async function FarmerManufacturingPage() {
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
          <h1 className="text-3xl font-bold">فاتورة تصنيع</h1>
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
          <h1 className="text-3xl font-bold">فاتورة تصنيع</h1>
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

  // Get materials names for output
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">فاتورة تصنيع</h1>
          <p className="text-muted-foreground mt-1">
            إنشاء فاتورة تصنيع علف جديدة
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إضافة فاتورة تصنيع جديدة</CardTitle>
          <CardDescription>
            قم بإنشاء فاتورة تصنيع العلف وسيتم إضافة الكمية تلقائياً للمخزون
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManufacturingForm
            warehouseId={warehouse.id}
            warehouseName={warehouse.name}
            farmId={farm.id}
            materialsNames={materialsNames || []}
            units={units || []}
            expenseTypes={expenseTypes || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
