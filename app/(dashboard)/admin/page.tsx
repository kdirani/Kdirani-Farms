import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  Warehouse,
  FileText,
  Receipt,
  TrendingUp,
  AlertCircle,
  Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "لوحة التحكم - الإدارة",
  description: "لوحة تحكم المدير",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "farmer") {
    redirect("/farmer");
  }

  const supabase = await createClient();

  // Get statistics
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: farmsCount } = await supabase
    .from("farms")
    .select("*", { count: "exact", head: true });

  const { count: warehousesCount } = await supabase
    .from("warehouses")
    .select("*", { count: "exact", head: true });

  const { count: dailyReportsCount } = await supabase
    .from("daily_reports")
    .select("*", { count: "exact", head: true });

  const { count: invoicesCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true });

  const { count: materialsCount } = await supabase
    .from("materials")
    .select("*", { count: "exact", head: true });

  // Get recent daily reports
  const { data: recentReports } = await supabase
    .from("daily_reports")
    .select(`
      *,
      warehouses (
        name,
        farms (
          name
        )
      )
    `)
    .order("report_date", { ascending: false })
    .order("report_time", { ascending: false })
    .limit(5);


  // Get unchecked reports count
  const { count: uncheckedReportsCount } = await supabase
    .from("daily_reports")
    .select("*", { count: "exact", head: true })
    .eq("checked", false);

  // Get unchecked invoices count
  const { count: uncheckedInvoicesCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("checked", false);

  // Get low inventory items
  const { data: lowInventory } = await supabase
    .from("materials")
    .select(`
      id,
      current_balance,
      materials_names (
        material_name
      ),
      warehouses (
        name
      )
    `)
    .lt("current_balance", 100)
    .order("current_balance", { ascending: true })
    .limit(10);

  // Get medication alerts for admin
  const { data: medicationAlerts } = await supabase
    .from("medication_alerts")
    .select(`
      id,
      scheduled_date,
      is_administered,
      farms (
        name
      ),
      medicines (
        name
      )
    `)
    .eq("is_administered", false)
    .gte("scheduled_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .lte("scheduled_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order("scheduled_date", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">مرحباً، {session.user.name}</h1>
        <p className="text-muted-foreground mt-1">
          نظرة عامة على النظام والأداء
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي المستخدمين في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المزارع</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmsCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              عدد المزارع النشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستودعات</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehousesCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              المستودعات المسجلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التقارير اليومية</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyReportsCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي التقارير المسجلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoicesCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              فواتير البيع والشراء
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المواد</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materialsCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              المواد في المخزون
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تقارير غير مدققة</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {uncheckedReportsCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-orange-700 mt-1">
              بحاجة إلى المراجعة
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير غير المدققة</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {uncheckedInvoicesCount?.toLocaleString("ar-IQ") || 0}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              بحاجة إلى المراجعة والتدقيق
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>أحدث التقارير اليومية</CardTitle>
            <CardDescription>آخر 5 تقارير تم إضافتها</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports && recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {report.warehouses?.farms?.name || "مزرعة"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.report_date).toLocaleDateString("ar-IQ")} -{" "}
                        {report.report_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {report.production_eggs?.toLocaleString("ar-IQ")} بيضة
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.production_egg_rate?.toFixed(1)}% إنتاج
                      </p>
                    </div>
                    {!report.checked && (
                      <div className="mr-3">
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                          غير مدقق
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد تقارير حتى الآن
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medication Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>تنبيهات الأدوية</CardTitle>
            <CardDescription>التنبيهات القادمة للأدوية واللقاحات</CardDescription>
          </CardHeader>
          <CardContent>
            {medicationAlerts && medicationAlerts.length > 0 ? (
              <div className="space-y-3">
                {medicationAlerts.map((alert: any) => {
                  const today = new Date();
                  const scheduledDate = new Date(alert.scheduled_date);
                  const daysUntil = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  let priorityColor = "bg-blue-100 text-blue-700";
                  let priorityText = "قادم";
                  
                  if (daysUntil < 0) {
                    priorityColor = "bg-red-100 text-red-700";
                    priorityText = "متأخر";
                  } else if (daysUntil === 0) {
                    priorityColor = "bg-orange-100 text-orange-700";
                    priorityText = "اليوم";
                  } else if (daysUntil === 1) {
                    priorityColor = "bg-yellow-100 text-yellow-700";
                    priorityText = "غداً";
                  }

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{alert.medicines?.name || "دواء"}</p>
                        <p className="text-sm text-muted-foreground">
                          المزرعة: {alert.farms?.name || "غير محدد"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(alert.scheduled_date).toLocaleDateString("ar-IQ")}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColor}`}>
                          {priorityText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد تنبيهات أدوية حالياً
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Inventory Alert */}
      {lowInventory && lowInventory.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              تنبيه: مواد منخفضة في المخزون
            </CardTitle>
            <CardDescription>
              المواد التالية أقل من الحد الأدنى المطلوب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowInventory.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-red-900">
                      {item.materials_names?.material_name || "مادة"}
                    </p>
                    <p className="text-sm text-red-700">
                      المستودع: {item.warehouses?.name || "غير محدد"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {item.current_balance?.toLocaleString("ar-IQ", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
