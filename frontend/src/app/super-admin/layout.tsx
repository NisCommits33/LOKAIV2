/**
 * super-admin/layout.tsx — Super Admin Layout
 *
 * Wraps platform-wide admin pages with the shared dashboard sidebar layout.
 * Route protection is handled by the middleware (proxy.ts).
 *
 * @module app/super-admin/layout
 */

import DashboardLayout from "@/app/dashboard/layout";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
