import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LOGIN_PATH = "/login";
const UPDATE_CREDENTIALS_PATH = "/actualizar-credenciales";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!user) {
    if (isDashboardRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // RLS del proyecto sólo da lectura propia al estudiante. Este acceso ocurre
  // tras validar el JWT y evita que DOCENTE quede bloqueado por esa política.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("debe_cambiar_password")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.debe_cambiar_password && pathname !== UPDATE_CREDENTIALS_PATH) {
    const updateCredentialsUrl = request.nextUrl.clone();
    updateCredentialsUrl.pathname = UPDATE_CREDENTIALS_PATH;
    return NextResponse.redirect(updateCredentialsUrl);
  }

  if (!profile?.debe_cambiar_password && pathname === LOGIN_PATH) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
