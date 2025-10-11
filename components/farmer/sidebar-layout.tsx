"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FarmerNav } from "./farmer-nav";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Main Content - يتحرك حسب حالة القائمة */}
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        {children}
      </div>

      {/* Sidebar - ثابت على اليمين */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-screen w-64 bg-white border-l shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto z-40",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">القائمة الرئيسية</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div onClick={() => setSidebarOpen(false)}>
            <FarmerNav />
          </div>
        </div>
      </aside>

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-20 z-30 bg-white shadow-md transition-all duration-300",
          sidebarOpen ? "left-[270px]" : "left-4"
        )}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}
