import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LOGIN_PATH = "/login";
const UPDATE_CREDENTIALS_PATH = "/actualizar-credenciales";

export async function proxy(request: NextRequest) {
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
  const isAdminRoute = pathname.startsWith("/admin");

  if (!user) {
    if (pathname === "/" || isDashboardRoute || isAdminRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("roles, debe_cambiar_password")
      .eq("id", user.id)
      .maybeSingle();

    const rolesObj = profile?.roles && typeof profile.roles === "object" ? (profile.roles as any) : null;
    const adminRole = rolesObj?.administrativo;
    const isPrivilegedAdmin = Boolean(adminRole);
    const activeViewCookie = request.cookies.get("edumin_active_view")?.value;

    // Determinar la vista activa (admin vs estudiante)
    let targetHome = "/dashboard";
    if (isPrivilegedAdmin) {
      if (activeViewCookie === "admin") {
        targetHome = "/admin/catalogo";
      } else if (activeViewCookie === "estudiante") {
        targetHome = "/dashboard";
      } else {
        // Por defecto si es admin y no ha seleccionado estudiante
        targetHome = "/admin/catalogo";
      }
    }

    // Redirección de raíz (/) y de /login para usuarios con sesión activa
    if (pathname === "/" || pathname === LOGIN_PATH) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = targetHome;
      const redirectResponse = NextResponse.redirect(redirectUrl);
      const cookieValue = targetHome.startsWith("/admin") ? "admin" : "estudiante";
      redirectResponse.cookies.set("edumin_active_view", cookieValue, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax"
      });
      return redirectResponse;
    }

    // Si un estudiante o usuario sin privilegios intenta entrar a /admin, bloquear y redirigir al aula virtual
    if (isAdminRoute && !isPrivilegedAdmin) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }

    // Proteger rutas exclusivas de Superadministrador (/admin/configuracion, /admin/auditoria)
    const isSuperAdminRoute = pathname.startsWith("/admin/configuracion") || pathname.startsWith("/admin/auditoria");
    if (isSuperAdminRoute && adminRole !== "SUPERADMIN") {
      const adminHomeUrl = request.nextUrl.clone();
      adminHomeUrl.pathname = "/admin/catalogo";
      return NextResponse.redirect(adminHomeUrl);
    }

    // Mantener sincronizada la cookie según la ruta que el usuario está navegando
    if (isAdminRoute) {
      response.cookies.set("edumin_active_view", "admin", {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax"
      });
    } else if (isDashboardRoute) {
      response.cookies.set("edumin_active_view", "estudiante", {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax"
      });
    }
  } catch (err) {
    console.error("Error en validación de roles en proxy:", err);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
