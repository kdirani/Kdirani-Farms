"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Warehouse,
  Package,
  FileText,
  Receipt,
  Factory,
  Pill,
  Home,
  BarChart3,
  Settings,
  Database,
  Layers,
  Scale,
  Tag,
  UserCog,
  LogOut,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const navSections = [
  {
    title: "الرئيسية",
    items: [
      {
        title: "لوحة التحكم",
        href: "/admin",
        icon: Home,
      },
      {
        title: "إعداد مزرعة كاملة",
        href: "/admin/setup",
        icon: Zap,
      },
      {
        title: "التقارير والإحصائيات",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "إدارة النظام",
    items: [
      {
        title: "المستخدمين",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "المزارع",
        href: "/admin/farms",
        icon: Building2,
      },
      {
        title: "المستودعات",
        href: "/admin/warehouses",
        icon: Warehouse,
      },
      {
        title: "القطعان",
        href: "/admin/poultry",
        icon: UserCog,
      },
    ],
  },
  {
    title: "المخزون والمواد",
    items: [
      {
        title: "المواد",
        href: "/admin/materials",
        icon: Package,
      },
      {
        title: "أسماء المواد",
        href: "/admin/materials-names",
        icon: Tag,
      },
      {
        title: "وحدات القياس",
        href: "/admin/units",
        icon: Scale,
      },
    ],
  },
  {
    title: "الفواتير والعمليات",
    items: [
      {
        title: "فواتير البيع والشراء",
        href: "/admin/invoices",
        icon: Receipt,
      },
      {
        title: "فواتير التصنيع",
        href: "/admin/manufacturing",
        icon: Factory,
      },
      {
        title: "فواتير الأدوية",
        href: "/admin/medicines-invoices",
        icon: Pill,
      },
    ],
  },
  {
    title: "التقارير",
    items: [
      {
        title: "التقارير اليومية",
        href: "/admin/daily-reports",
        icon: FileText,
      },
      {
        title: "تقارير المخزون",
        href: "/admin/inventory-reports",
        icon: Database,
      },
    ],
  },
  {
    title: "القوائم الأساسية",
    items: [
      {
        title: "أوزان البيض",
        href: "/admin/egg-weights",
        icon: Layers,
      },
      {
        title: "الأدوية واللقاحات",
        href: "/admin/medicines",
        icon: Pill,
      },
      {
        title: "أنواع المصاريف",
        href: "/admin/expense-types",
        icon: Tag,
      },
      {
        title: "العملاء والموردين",
        href: "/admin/clients",
        icon: Users,
      },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      {
        title: "إعدادات النظام",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6 flex flex-col h-full">
      <div className="flex-1 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-primary/10",
                      isActive
                        ? "bg-primary text-white hover:bg-primary hover:text-white"
                        : "text-gray-700 hover:text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 mt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </nav>
  );
}
