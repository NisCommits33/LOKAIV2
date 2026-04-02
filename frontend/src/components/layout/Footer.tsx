/**
 * Footer.tsx — Global Site Footer
 *
 * Displays branding and copyright information on public-facing pages.
 * Automatically hides on dashboard/admin routes that use sidebar layouts.
 *
 * @module components/layout/Footer
 */

"use client"

import { Container } from "./Container"
import { usePathname } from "next/navigation"

export function Footer() {
    const pathname = usePathname()

    // Hide footer on layouts that have their own navigation
    if (
        pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/super-admin")
    ) {
        return null
    }

    return (
        <footer className="border-t border-slate-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 py-12">
            <Container>
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-xs font-bold">
                                L
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">LokAI</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            AI-powered exam preparation for Nepal government employees.
                        </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        © {new Date().getFullYear()} LokAI. All rights reserved.
                    </p>
                </div>
            </Container>
        </footer>
    )
}
