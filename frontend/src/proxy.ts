/**
 * proxy.ts — Route Protection Middleware
 *
 * Next.js middleware that runs before every matching request to enforce:
 * 1. Public route access (login, callback, landing page)
 * 2. Authentication — unauthenticated users are redirected to /login
 * 3. Profile completion — incomplete profiles are redirected to /profile-setup
 * 4. Verification status — pending users are redirected to /pending-approval
 * 5. Role-based access — admin routes restricted by user role
 *
 * @module proxy
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes accessible without authentication */
const publicRoutes = ["/login", "/auth/callback", "/"];

/** Route prefixes accessible without authentication (prefix match) */
const publicPrefixes = ["/register-organization", "/api/organizations/apply"];

/** Route prefixes mapped to the roles that may access them */
const roleRoutes: Record<string, string[]> = {
  "/admin": ["org_admin", "super_admin"],
  "/super-admin": ["super_admin"],
};

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client that can read/write cookies on the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session to keep tokens valid
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // --- Public Routes ---
  if (
    publicRoutes.some((route) => pathname === route) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    // Redirect authenticated users away from login based on their role
    if (pathname === "/login" && user) {
      let loginRole: string | null = null;
      const { data: loginUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single<{ role: string }>();

      if (loginUser) {
        loginRole = loginUser.role;
      } else {
        const { data: rpcRole } = await supabase.rpc("get_user_role", { user_id: user.id });
        loginRole = rpcRole as string | null;
      }

      if (loginRole === "super_admin") {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      } else if (loginRole === "org_admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // --- Authentication Gate ---
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname); // Preserve intended destination
    return NextResponse.redirect(redirectUrl);
  }

  // --- Profile & Verification Checks ---
  // Skip these checks for API routes (they handle their own auth)
  if (
    pathname !== "/profile-setup" &&
    pathname !== "/pending-approval" &&
    !pathname.startsWith("/api/")
  ) {
    let userRole: string | null = null;
    const { data: dbUser } = await supabase
      .from("users")
      .select("profile_completed, verification_status, role")
      .eq("id", user.id)
      .single<{ profile_completed: boolean; verification_status: string; role: string }>();

    if (dbUser) {
      userRole = dbUser.role;
    } else {
      // Fallback: use SECURITY DEFINER function to bypass RLS
      const { data: rpcRole } = await supabase.rpc("get_user_role", { user_id: user.id });
      userRole = rpcRole as string | null;
    }

    // Super admins bypass profile/verification checks
    if (userRole === "super_admin") {
      // Just enforce role access control below
    } else {
      // Enforce profile completion before accessing protected content
      if (dbUser && !dbUser.profile_completed && pathname !== "/profile-setup") {
        return NextResponse.redirect(new URL("/profile-setup", request.url));
      }

      // Redirect pending-verification users to the waiting page
      if (dbUser && dbUser.verification_status === "pending" && pathname !== "/pending-approval") {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
      }
    }

    // --- Role-Based Access Control ---
    for (const [routePrefix, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(routePrefix)) {
        if (!userRole || !allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  }

  return supabaseResponse;
}

/**
 * Matcher config — excludes static assets, images, and Next.js internals
 * from middleware processing for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
