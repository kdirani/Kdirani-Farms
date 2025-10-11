import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeaderLogo } from "@/components/layout/header-logo";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "تسجيل الدخول - نظام إدارة المزارع",
  description: "تسجيل الدخول إلى نظام إدارة مزارع الدواجن",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "admin" || session.user.role === "sub_admin") {
      redirect("/admin");
    } else {
      redirect("/farmer");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <HeaderLogo href={null} width={200} height={200} className="mb-4" />
          <p className="text-lg text-blue-700">
            نظام إدارة مزارع الدواجن
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-center">
              أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-gray-600">
          © 2024 شركة القديراني - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
