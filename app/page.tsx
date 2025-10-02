import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect based on user role
  if (session.user.role === "admin" || session.user.role === "sub_admin") {
    redirect("/admin");
  } else {
    redirect("/farmer");
  }
}
