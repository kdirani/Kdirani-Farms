import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Egg,
  Bird,
  Package,
  TrendingUp,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "لوحة التحكم - نظام إدارة المزارع",
  description: "لوحة تحكم المزارع",
};

export default async function FarmerDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Get user's farm
  const { data: farm } = await supabase
    .from("farms")
    .select(`
      id,
      name,
      location,
      warehouses (
        id,
        name
      )
    `)
    .eq("user_id", session.user.id)
    .single();

  let warehouseId = farm?.warehouses?.[0]?.id;
  let poultryData = null;
  let todayReport = null;
  let recentReports = null;
  let inventorySummary = null;

  if (farm) {
    // Get poultry status
    const { data: poultry } = await supabase
      .from("poultry_status")
      .select("*")
      .eq("farm_id", farm.id)
      .single();

    poultryData = poultry;

    // Get today's report if exists
    const today = new Date().toISOString().split("T")[0];
    const { data: report } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("report_date", today)
      .single();

    todayReport = report;

    // Get recent reports (last 7 days)
    const { data: reports } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .order("report_date", { ascending: false })
      .limit(7);

    recentReports = reports;

    // Get inventory summary
    const { data: materials } = await supabase
      .from("materials")
      .select(`
        id,
        current_balance,
        material_name_id,
        materials_names (
          material_name
        )
      `)
      .eq("warehouse_id", warehouseId);

    inventorySummary = materials;
  }

  if (!farm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">مرحباً، {session.user.name}</h1>
          <p className="text-muted-foreground mt-1">
            لوحة التحكم الخاصة بك
          </p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              لا توجد مزرعة مرتبطة
            </CardTitle>
            <CardDescription>
              لم يتم ربط حسابك بأي مزرعة. يرجى التواصل مع المدير لإنشاء مزرعة ومستودع لحسابك.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate statistics from recent reports
  const avgProduction = recentReports?.length
    ? recentReports.reduce((sum, r) => sum + (r.production_eggs || 0), 0) / recentReports.length
    : 0;

  const avgProductionRate = recentReports?.length
    ? recentReports.reduce((sum, r) => sum + (r.production_egg_rate || 0), 0) / recentReports.length
    : 0;

  const totalDeadChicks = recentReports?.length
    ? recentReports.reduce((sum, r) => sum + (r.chicks_dead || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">مرحباً، {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">
          مزرعة {farm.name} - {farm.location || "لم يتم تحديد الموقع"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              التقرير اليومي
            </CardTitle>
            <CardDescription className="text-blue-700">
              {todayReport
                ? "تم إضافة التقرير اليوم"
                : "لم يتم إضافة تقرير اليوم بعد"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/farmer/daily-report">
              <Button className="w-full" variant={todayReport ? "outline" : "default"}>
                {todayReport ? "عرض التقرير اليومي" : "إضافة تقرير يومي"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Package className="h-5 w-5" />
              فاتورة تصنيع
            </CardTitle>
            <CardDescription className="text-green-700">
              إنشاء فاتورة تصنيع علف جديدة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/farmer/manufacturing">
              <Button className="w-full" variant="default">
                إنشاء فاتورة تصنيع
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الدجاج</CardTitle>
            <Bird className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {poultryData?.remaining_chicks?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              من أصل {poultryData?.opening_chicks?.toLocaleString("ar-IQ") || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الإنتاج اليومي</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgProduction.toLocaleString("ar-IQ", {
                maximumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              آخر 7 أيام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة الإنتاج</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgProductionRate.toLocaleString("ar-IQ", {
                maximumFractionDigits: 1,
              })}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              متوسط آخر 7 أيام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النفوق (7 أيام)</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalDeadChicks.toLocaleString("ar-IQ")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              آخر أسبوع
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>التقارير الأخيرة</CardTitle>
            <CardDescription>آخر 7 تقارير يومية</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports && recentReports.length > 0 ? (
              <div className="space-y-2">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {new Date(report.report_date).toLocaleDateString("ar-IQ", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        إنتاج: {report.production_eggs?.toLocaleString("ar-IQ")} بيضة
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {report.production_egg_rate?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد تقارير حتى الآن
              </p>
            )}
            <Link href="/farmer/reports">
              <Button variant="outline" className="w-full mt-4">
                عرض جميع التقارير
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملخص المخزون</CardTitle>
            <CardDescription>المواد الموجودة في المستودع</CardDescription>
          </CardHeader>
          <CardContent>
            {inventorySummary && inventorySummary.length > 0 ? (
              <div className="space-y-2">
                {inventorySummary.slice(0, 7).map((material: any) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">
                      {material.materials_names?.material_name || "مادة"}
                    </span>
                    <span className="font-bold text-primary">
                      {material.current_balance?.toLocaleString("ar-IQ", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد مواد في المخزون
              </p>
            )}
            <Link href="/farmer/inventory">
              <Button variant="outline" className="w-full mt-4">
                عرض المخزون الكامل
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
