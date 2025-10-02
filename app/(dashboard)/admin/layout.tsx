import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { MobileNav } from "@/components/admin/mobile-nav";
import { UserNav } from "@/components/layout/user-nav";
import { HeaderLogo } from "@/components/layout/header-logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "farmer") {
    redirect("/farmer");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Sidebar Navigation - على اليمين في الشاشات الكبيرة */}
        <aside className="sticky top-0 hidden h-screen w-64 bg-white border-l shadow-lg lg:block overflow-y-auto">
          <div className="p-6">
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
                    <MobileNav />
                    <HeaderLogo href="/admin" width={140} height={45} />
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
