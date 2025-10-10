'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { MobileNav } from '@/components/admin/mobile-nav';
import { HeaderLogo } from '@/components/layout/header-logo';
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
            sticky top-0 h-screen bg-white border-l shadow-lg transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}
            hidden lg:block
          `}
        >
          <div className={`p-6 w-64 h-full overflow-y-auto transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
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
                    <HeaderLogo href="/admin" width={100} height={35} />
                  </div>
                  <div className="flex items-center gap-4">
                    <MobileNav sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            <div className="mx-auto max-w-6xl animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
