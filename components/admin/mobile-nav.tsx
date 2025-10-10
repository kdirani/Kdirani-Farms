"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNav } from "./admin-nav";

interface MobileNavProps {
  sidebarOpen?: boolean;
  toggleSidebar?: () => void;
}

export function MobileNav({ sidebarOpen = false, toggleSidebar }: MobileNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* للشاشات الصغيرة - استخدام Sheet */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-4 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-right">القائمة الرئيسية</SheetTitle>
            </SheetHeader>
            <div onClick={() => setMobileOpen(false)}>
              <AdminNav />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* للشاشات الكبيرة - استخدام الزر العادي */}
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
          <span className="sr-only">{sidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}</span>
        </Button>
      </div>
    </>
  );
}
