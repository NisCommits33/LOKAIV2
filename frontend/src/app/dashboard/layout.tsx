/**
 * dashboard/layout.tsx — Dashboard Sidebar Layout
 *
 * Provides the authenticated layout shell with:
 * - Desktop: Fixed 64px-wide sidebar with scrollable navigation
 * - Mobile: Slide-out Sheet sidebar triggered by hamburger menu
 *
 * Navigation sections are role-filtered:
 * - Main: Dashboard, GK Quizzes, My Documents (all users)
 * - Org Admin: User management, departments, documents, analytics
 * - Super Admin: Platform overview, organizations, users, audit logs, settings
 *
 * Also reused by admin/ and super-admin/ layouts.
 *
 * @module app/dashboard/layout
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Upload,
  Users,
  Building2,
  BarChart3,
  Settings,
  Shield,
  ShieldCheck,
  UserCircle,
  LogOut,
  Menu,
  ChevronDown,
  Layers,
  CreditCard,
} from "lucide-react";
import type { UserRole } from "@/types/database";

/** Navigation item definition with role-based visibility */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

/** Main navigation items — visible to all authenticated users */
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["public", "employee"],
  },
  {
    label: "GK Quizzes",
    href: "/dashboard/quizzes",
    icon: BookOpen,
    roles: ["public", "employee"],
  },
  {
    label: "My Documents",
    href: "/dashboard/documents",
    icon: FileText,
    roles: ["public", "employee"],
  },
  {
    label: "Org Documents",
    href: "/dashboard/org-documents",
    icon: Layers,
    roles: ["employee"],
  },
  {
    label: "My Progress",
    href: "/dashboard/progress",
    icon: BarChart3,
    roles: ["employee"],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    roles: ["public", "employee"],
  },
];

/** Organization admin navigation items */
const adminNavItems: NavItem[] = [
  {
    label: "Admin Dashboard",
    href: "/admin",
    icon: Shield,
    roles: ["org_admin"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["org_admin"],
  },
  {
    label: "Departments",
    href: "/admin/departments",
    icon: Building2,
    roles: ["org_admin"],
  },
  {
    label: "Job Levels",
    href: "/admin/job-levels",
    icon: Layers,
    roles: ["org_admin"],
  },
  {
    label: "Document Library",
    href: "/admin/documents",
    icon: FileText,
    roles: ["org_admin"],
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: CreditCard,
    roles: ["org_admin"],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    roles: ["org_admin"],
  },
];

/** Super admin navigation items */
const superAdminNavItems: NavItem[] = [
  {
    label: "Platform Overview",
    href: "/super-admin",
    icon: Shield,
    roles: ["super_admin"],
  },
  {
    label: "Organizations",
    href: "/super-admin/organizations",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    label: "Users",
    href: "/super-admin/users",
    icon: Users,
    roles: ["super_admin"],
  },
  {
    label: "Quiz Manager",
    href: "/super-admin/quizzes",
    icon: BookOpen,
    roles: ["super_admin"],
  },
  {
    label: "Audit Logs",
    href: "/super-admin/audit-logs",
    icon: FileText,
    roles: ["super_admin"],
  },
  {
    label: "Billing",
    href: "/super-admin/billing",
    icon: CreditCard,
    roles: ["super_admin"],
  },
  {
    label: "Settings",
    href: "/super-admin/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    roles: ["super_admin"],
  },
];

/** Extracts initials from a user's full name for avatar fallback */
function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Reusable sidebar content rendered in both desktop and mobile views */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { dbUser, signOut } = useAuth();
  const userRole = (dbUser?.is_active === false) ? "public" : (dbUser?.role ?? "public");

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );
  const filteredAdminItems = adminNavItems.filter((item) =>
    item.roles.includes(userRole)
  );
  const filteredSuperAdminItems = superAdminNavItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-bold">
            L
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">LokAI</span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-50 text-slate-900 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {filteredAdminItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Organization Admin
            </p>
            {filteredAdminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-50 text-slate-900 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}

        {filteredSuperAdminItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Super Admin
            </p>
            {filteredSuperAdminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-50 text-slate-900 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User profile section */}
      <Separator />
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={dbUser?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(dbUser?.full_name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {dbUser?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {dbUser?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b border-slate-100 bg-white px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold">
              L
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">LokAI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
