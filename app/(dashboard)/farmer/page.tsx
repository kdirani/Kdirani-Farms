import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  Factory,
  Pill
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

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
          لوحة التحكم الخاصة بك
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-5 w-5 text-primary" />
              التقرير اليومي
            </CardTitle>
            <CardDescription className="text-slate-600">
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

        {/* فاتورة مبيع */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CreditCard className="h-5 w-5 text-green-600" />
              فاتورة مبيع
            </CardTitle>
            <CardDescription className="text-slate-600">
              إنشاء فاتورة بيع جديدة للمنتجات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/farmer/invoices/new?type=sales">
              <Button className="w-full">
                إنشاء فاتورة مبيع
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* فاتورة شراء */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              فاتورة شراء
            </CardTitle>
            <CardDescription className="text-slate-600">
              إنشاء فاتورة شراء جديدة للمواد والمستلزمات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/farmer/invoices/new?type=purchase">
              <Button className="w-full">
                إنشاء فاتورة شراء
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* فاتورة تصنيع */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Factory className="h-5 w-5 text-amber-600" />
              فاتورة تصنيع
            </CardTitle>
            <CardDescription className="text-slate-600">
              إنشاء فاتورة تصنيع جديدة للمنتجات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/farmer/manufacturing/new">
              <Button className="w-full">
                إنشاء فاتورة تصنيع
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* فاتورة أدوية */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Pill className="h-5 w-5 text-red-600" />
              فاتورة أدوية
            </CardTitle>
            <CardDescription className="text-slate-600">
              تسجيل استهلاك الأدوية للدواجن
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/farmer/medicine-invoices/new">
              <Button className="w-full">
                إنشاء فاتورة أدوية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
