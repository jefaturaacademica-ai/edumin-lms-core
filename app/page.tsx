import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const cookieStore = await cookies();
  const activeView = cookieStore.get("edumin_active_view")?.value;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (activeView === "admin") {
    redirect("/admin/catalogo");
  }

  redirect("/dashboard");
}
