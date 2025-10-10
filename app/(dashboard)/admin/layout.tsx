import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";

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
    <AdminLayoutWrapper session={session}>
      {children}
    </AdminLayoutWrapper>
  );
}
