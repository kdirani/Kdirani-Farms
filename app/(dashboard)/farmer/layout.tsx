import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FarmerNav } from "@/components/farmer/farmer-nav";
import { MobileNav } from "@/components/farmer/mobile-nav";
import { NotificationsIcon } from "@/components/farmer/notifications-icon";
import { UserNav } from "@/components/layout/user-nav";
import { HeaderLogo } from "@/components/layout/header-logo";

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "farmer") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Sidebar Navigation - على اليمين في الشاشات الكبيرة */}
        <aside className="sticky top-0 hidden h-screen w-64 bg-white border-l shadow-lg lg:block overflow-y-auto">
          <div className="p-6">
            <FarmerNav />
          </div>
        </aside>

        {/* المحتوى الرئيسي مع الهيدر */}
        <div className="flex-1 min-h-screen">
          {/* Header عائم حديث */}
          <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
            <div className="mx-auto max-w-6xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <HeaderLogo href="/farmer" width={100} height={35} />
                  <div className="flex items-center gap-2">
                    <NotificationsIcon userId={session.user.id} />
                    <MobileNav />
                  </div>
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
