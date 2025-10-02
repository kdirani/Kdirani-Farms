"use client";

import { Menu } from "lucide-react";
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

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">فتح القائمة</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-4 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-right">القائمة الرئيسية</SheetTitle>
        </SheetHeader>
        <div onClick={() => setOpen(false)}>
          <AdminNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
