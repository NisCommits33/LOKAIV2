"use client"

import { useRouter } from "next/navigation"
import { Button } from "./button"
import { ArrowLeft } from "lucide-react"

export function BackButton({ className }: { className?: string }) {
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all group font-bold px-0 ${className}`}
        >
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            Back
        </Button>
    )
}
