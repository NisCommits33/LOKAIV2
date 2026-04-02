/**
 * Header.tsx — Global Navigation Header
 *
 * Renders the sticky top navigation bar with:
 * - LokAI branding and logo
 * - Authenticated: role-based navigation links + user avatar dropdown
 * - Unauthenticated: Sign In / Get Started CTAs
 *
 * Automatically hides on dashboard/admin routes that have their own sidebar navigation.
 *
 * @module components/layout/Header
 */

"use client"

import { Button } from "@/components/ui/button"
import { Container } from "./Container"
import Link from "next/link"
import { useAuth } from "@/components/providers/auth-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, LogOut, User, Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

export function Header() {
    const { supabaseUser, dbUser, signOut } = useAuth()
    const pathname = usePathname()

    // Hide header on layouts that provide their own navigation sidebar
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin") || pathname?.startsWith("/super-admin")) {
        return null
    }

    return (
        <header className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-50">
            <Container>
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 transition-colors group-hover:text-primary">
                                LokAI
                            </span>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1">
                            {supabaseUser ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all"
                                    >
                                        Dashboard
                                    </Link>
                                    {dbUser?.role === "super_admin" && (
                                        <Link
                                            href="/super-admin"
                                            className="px-4 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all"
                                        >
                                            System Admin
                                        </Link>
                                    )}
                                    {dbUser?.role === "org_admin" && (
                                        <Link
                                            href="/admin"
                                            className="px-4 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all"
                                        >
                                            Org Admin
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link href="/#features" className="px-4 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all">Features</Link>
                                </>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        {supabaseUser ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={supabaseUser.user_metadata?.avatar_url} alt={dbUser?.full_name ?? ""} />
                                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
                                                {dbUser?.full_name?.charAt(0) || supabaseUser.email?.charAt(0)?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden sm:block text-left mr-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none capitalize truncate max-w-[100px]">
                                                {dbUser?.full_name || "User"}
                                            </p>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-2 p-1.5 rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl" align="end" forceMount>
                                    <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-lg font-medium text-sm focus:bg-slate-50 dark:focus:bg-slate-900" asChild>
                                        <Link href="/dashboard" className="flex items-center">
                                            <LayoutDashboard className="mr-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-lg font-medium text-sm focus:bg-slate-50 dark:focus:bg-slate-900" asChild>
                                        <Link href="/profile-setup" className="flex items-center">
                                            <User className="mr-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                    <DropdownMenuItem
                                        className="cursor-pointer py-2 px-3 rounded-lg font-medium text-sm text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-500"
                                        onClick={signOut}
                                    >
                                        <LogOut className="mr-2.5 h-4 w-4" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-3">
                                    <Link href="/login">
                                        <Button variant="ghost" className="font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl h-9 px-4">Sign In</Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button className="font-semibold px-5 h-9 rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-all shadow-none">
                                            Get Started
                                        </Button>
                                    </Link>
                                </div>
                                
                                {/* Mobile Hamburger Menu */}
                                <div className="lg:hidden">
                                    <Sheet>
                                        <SheetTrigger className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                            <Menu className="h-5 w-5" />
                                        </SheetTrigger>
                                        <SheetContent side="right" className="w-[300px] flex flex-col bg-white dark:bg-slate-950">
                                            <SheetHeader className="text-left border-b dark:border-slate-800 pb-4">
                                                <SheetTitle className="text-xl font-bold dark:text-slate-50">LokAI</SheetTitle>
                                            </SheetHeader>
                                            <nav className="flex flex-col gap-4 mt-8">
                                                <Link href="/#features" className="text-lg font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 px-2 transition-colors">
                                                    Features
                                                </Link>
                                                <Separator className="bg-slate-100 dark:bg-slate-800" />
                                                <Link href="/login" className="text-lg font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 px-2 transition-colors">
                                                    Sign In
                                                </Link>
                                                <Link href="/register-organization" className="text-lg font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-slate-50 px-2 transition-colors">
                                                    Register Organization
                                                </Link>
                                                <Link href="/login">
                                                    <Button className="w-full font-bold h-12 rounded-xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-none mt-4">
                                                        Get Started
                                                    </Button>
                                                </Link>
                                            </nav>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </header>
    )
}
