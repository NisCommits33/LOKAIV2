"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

interface UserGuideModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    guideUrl: string;
    title: string;
    description: string;
}

export function UserGuideModal({ 
    isOpen, 
    onOpenChange, 
    guideUrl, 
    title, 
    description 
}: UserGuideModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-black/5 flex flex-col aspect-video">
                <DialogHeader className="p-4 bg-white dark:bg-slate-950 border-b dark:border-slate-800">
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-indigo-500" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="relative flex-1 bg-black">
                    {guideUrl === "#" ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white">
                            <HelpCircle className="h-12 w-12 text-slate-700 mb-4" />
                            <h3 className="font-bold">Coming Soon</h3>
                            <p className="text-slate-500 text-sm mt-2">The employee guide is being prepared and will be available shortly.</p>
                        </div>
                    ) : (
                        <iframe
                            src={guideUrl}
                            title={title}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
