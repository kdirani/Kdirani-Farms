import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
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
  let todayReport = null;

  if (farm) {
    // Get today's report if exists
    const today = new Date().toISOString().split("T")[0];
    const { data: report } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("report_date", today)
      .single();

    todayReport = report;
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
    </div>
  );
}
