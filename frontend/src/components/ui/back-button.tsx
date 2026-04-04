"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ className, onClick }: { className?: string; onClick?: () => void }) {
    const router = useRouter()

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else {
            router.back()
        }
    }

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group ${className}`}
        >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back
        </button>
    )
}
