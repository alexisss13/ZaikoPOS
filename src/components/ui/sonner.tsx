"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset="16px"
      toastOptions={{
        style: isMobile ? {
          width: 'calc(100vw - 2rem)',
          maxWidth: 'calc(100vw - 2rem)',
        } : {},
        classNames: {
          toast: isMobile 
            ? "!z-[9999] group toast !bg-white !text-slate-900 !border-2 !border-slate-200 !shadow-2xl !rounded-2xl !p-4 !font-sans"
            : "!z-[9999] group toast !bg-white !text-slate-900 !border-2 !border-slate-200 !shadow-xl !rounded-xl !p-4 !font-sans",
          title: "!text-sm !font-bold !text-slate-900",
          description: "!text-xs !text-slate-500 !mt-1",
          actionButton: "!bg-slate-900 !text-white !text-xs !font-bold !rounded-lg !px-3 !py-1.5",
          cancelButton: "!bg-slate-100 !text-slate-600 !text-xs !font-bold !rounded-lg !px-3 !py-1.5",
          success: "!bg-emerald-50 !border-emerald-500 !text-emerald-900",
          error: "!bg-red-50 !border-red-500 !text-red-900",
          warning: "!bg-amber-50 !border-amber-500 !text-amber-900",
          info: "!bg-blue-50 !border-blue-500 !text-blue-900",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-emerald-600" />,
        info: <InfoIcon className="size-5 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-5 text-amber-600" />,
        error: <OctagonXIcon className="size-5 text-red-600" />,
        loading: <Loader2Icon className="size-5 animate-spin text-slate-600" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
