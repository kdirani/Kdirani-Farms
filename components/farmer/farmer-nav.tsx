"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Home,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

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
];

export function FarmerNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2 flex flex-col h-full ">
      <div className="flex-1 space-y-2">
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
