/**
 * super/layout.tsx — Super Admin Layout
 *
 * Wraps super admin pages with the shared dashboard sidebar layout.
 * Route protection is handled by the middleware (middleware.ts).
 *
 * @module app/super/layout
 */

import DashboardLayout from "@/app/dashboard/layout";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
