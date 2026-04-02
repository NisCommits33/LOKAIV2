import { cn } from "@/lib/utils"

interface PageIconProps {
  children: React.ReactNode
  className?: string
}

export function PageIcon({ children, className }: PageIconProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 [&_svg]:h-5 [&_svg]:w-5",
        className
      )}
    >
      {children}
    </div>
  )
}
