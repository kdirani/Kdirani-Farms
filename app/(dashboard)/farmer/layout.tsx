import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FarmerNav } from "@/components/farmer/farmer-nav";
import { UserNav } from "@/components/layout/user-nav";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary">
              نظام المزارع - {session.user.name}
            </h1>
          </div>
          <UserNav user={session.user} />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 border-l bg-white p-4 lg:block">
          <FarmerNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="container max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
