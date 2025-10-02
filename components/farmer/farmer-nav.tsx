"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Factory,
  Home,
  FileText,
  Package,
} from "lucide-react";

const navItems = [
  {
    title: "الرئيسية",
    href: "/farmer",
    icon: Home,
  },
  {
    title: "التقرير اليومي",
    href: "/farmer/daily-report",
    icon: ClipboardList,
  },
  {
    title: "فاتورة تصنيع",
    href: "/farmer/manufacturing",
    icon: Factory,
  },
  {
    title: "التقارير",
    href: "/farmer/reports",
    icon: FileText,
  },
  {
    title: "المخزون",
    href: "/farmer/inventory",
    icon: Package,
  },
];

export function FarmerNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">القائمة الرئيسية</h2>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-primary/10",
              isActive
                ? "bg-primary text-white hover:bg-primary hover:text-white"
                : "text-gray-700 hover:text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
