/**
 * Footer.tsx — Global Site Footer
 *
 * Displays branding, navigation, legal links, and contact information.
 * Features a modern 4-column layout for enhanced professionalism.
 * Automatically hides on dashboard and administrative routes. 
 *
 * @module components/layout/Footer
 */

"use client"

import { Container } from "./Container"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Globe, Mail, MapPin, ExternalLink, HelpCircle, User, Users, ShieldCheck } from "lucide-react"
import { UserGuideModal } from "../shared/UserGuideModal"
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const GUIDES = [
    {
        id: "candidate",
        title: "Candidate Guide",
        description: "Learn how to prepare for exams using LokAI.",
        icon: User,
        url: "https://embed.app.guidde.com/playbooks/paYQ2qm6g412bY7LFp5Czt?mode=videoOnly"
    },
    {
        id: "employee",
        title: "Employee Guide",
        description: "Learn how to access organization documents.",
        icon: Users,
        url: "https://embed.app.guidde.com/playbooks/ru5pVUi3wy8JmQQtcnCpvi?mode=videoOnly"
    },
    {
        id: "organization",
        title: "Organization Guide",
        description: "Learn how to manage your organization.",
        icon: ShieldCheck,
        url: "https://embed.app.guidde.com/playbooks/1NQxnuTM42sakawmh4B3Dr?mode=videoAndDoc"
    }
]

export function Footer() {
    const pathname = usePathname()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeGuide, setActiveGuide] = useState(GUIDES[0])

    // Hide footer on layouts that have their own navigation or auth flows
    const isAuthPage = pathname === "/reset-password" || pathname === "/forgot-password" || pathname?.startsWith("/auth/confirm")

    if (
        pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/super-admin") ||
        isAuthPage
    ) {
        return null
    }

    return (
        <footer className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 py-16">
            <Container>
                {/* User Guide Controlled Modal */}
                <UserGuideModal 
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    guideUrl={activeGuide.url}
                    title={activeGuide.title}
                    description={activeGuide.description}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* ... Brand Column unchanged ... */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                             <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                                LOK.AI
                            </span>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs">
                            Empowering Nepal&apos;s civil service aspirants with AI-driven document intelligence and specialized preparation tools.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all">
                                <Globe className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all">
                                <Globe className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all">
                                <Globe className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Platform Column */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="/#features" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Key Features</Link></li>
                            <li><Link href="/#pricing" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Pricing Plans</Link></li>
                             <li><Link href="/register-organization" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">For Organizations</Link></li>
                             <li>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-2 outline-none">
                                        <HelpCircle className="h-4 w-4" />
                                        User Guide
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="start" className="w-56 mb-2">
                                        <DropdownMenuLabel>Choose a Guide</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {GUIDES.map((guide) => (
                                            <DropdownMenuItem 
                                                key={guide.id}
                                                onClick={() => {
                                                    setActiveGuide(guide);
                                                    setIsModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 cursor-pointer py-2"
                                            >
                                                <guide.icon className="h-4 w-4 text-indigo-500" />
                                                <span>{guide.title}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </li>
                             <li><Link href="/login" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Start Prep</Link></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/privacy" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Cookie Policy</Link></li>
                            <li><Link href="/contact" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Billing Terms</Link></li>
                        </ul>
                    </div>

                    {/* Contact & Support Column */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6">Contact & Support</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 break-all">support@lokai.gov.np</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kathmandu, Nepal</span>
                            </div>
                        </div>
                        <div className="pt-2">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                Secure Payments via Khalti
                                <ExternalLink className="h-2 w-2" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm font-semibold text-slate-400">
                        © {new Date().getFullYear()} LokAI Project Team. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">Nepal Civil Service AI Integration</span>
                    </div>
                </div>
            </Container>
        </footer>
    )
}
