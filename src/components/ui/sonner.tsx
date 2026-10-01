"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { cn } from "cn"

function ToastIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full [&_svg]:size-4",
        className
      )}
    >
      {children}
    </span>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-sans!"
      icons={{
        success: (
          <ToastIcon className="bg-success/12 text-success">
            <CircleCheckIcon />
          </ToastIcon>
        ),
        info: (
          <ToastIcon className="bg-primary/12 text-primary">
            <InfoIcon />
          </ToastIcon>
        ),
        warning: (
          <ToastIcon className="bg-warning/12 text-warning">
            <TriangleAlertIcon />
          </ToastIcon>
        ),
        error: (
          <ToastIcon className="bg-destructive/12 text-destructive">
            <OctagonXIcon />
          </ToastIcon>
        ),
        loading: (
          <ToastIcon className="bg-muted text-muted-foreground">
            <Loader2Icon className="animate-spin" />
          </ToastIcon>
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          // Garis tipis seperti Card (ring-foreground/10)
          "--normal-border": "color-mix(in oklch, var(--foreground) 10%, transparent)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        // CSS Sonner tidak berada di layer Tailwind, jadi ukuran & jarak dipaksa dengan `!`
        classNames: {
          toast:
            "cn-toast gap-3! p-3! pr-4! text-sm! shadow-lg! shadow-black/5! dark:shadow-black/30!",
          content: "gap-0.5!",
          title: "font-medium! leading-snug!",
          description: "text-xs! leading-normal! text-muted-foreground!",
          icon: "m-0! size-8! justify-center! [&_svg]:m-0!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
