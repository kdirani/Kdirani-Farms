import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  AlertCircle
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
      <div className="grid gap-4 md:grid-cols-1 max-w-2xl">
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
      </div>
    </div>
  );
}
