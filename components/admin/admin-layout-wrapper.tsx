'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { MobileNav } from '@/components/admin/mobile-nav';
import { UserNav } from '@/components/layout/user-nav';
import { HeaderLogo } from '@/components/layout/header-logo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Session } from 'next-auth';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  session: Session;
}

export function AdminLayoutWrapper({ children, session }: AdminLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // تحميل حالة القائمة من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // حفظ حالة القائمة في localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('adminSidebarOpen', String(newState));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Sidebar Navigation - على اليمين في الشاشات الكبيرة */}
        <aside
          className={`
            sticky top-0 h-screen bg-white border-l shadow-lg overflow-hidden transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}
            hidden lg:block
          `}
        >
          <div className={`p-6 w-64 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <AdminNav />
          </div>
        </aside>

        {/* المحتوى الرئيسي مع الهيدر */}
        <div className="flex-1 min-h-screen">
          {/* Header عائم حديث */}
          <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
            <div className="mx-auto max-w-6xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* زر فتح/إغلاق القائمة الجانبية - فقط للشاشات الكبيرة */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="hidden lg:flex"
                      title={sidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}
                    >
                      {sidebarOpen ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Menu className="h-5 w-5" />
                      )}
                    </Button>
                    <MobileNav />
                    <HeaderLogo href="/admin" width={100} height={35} />
                  </div>
                  <UserNav user={session.user} />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
