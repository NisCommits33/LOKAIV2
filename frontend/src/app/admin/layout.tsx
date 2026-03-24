/**
 * admin/layout.tsx — Organization Admin Layout
 *
 * Wraps org admin pages with the shared dashboard sidebar layout.
 * Route protection is handled by the middleware (proxy.ts).
 *
 * @module app/admin/layout
 */

import DashboardLayout from "@/app/dashboard/layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
