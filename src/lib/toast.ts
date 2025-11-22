"use client"

import { toast as sonner } from "sonner"

type ToastVariant = "default" | "success" | "warning" | "error" | "destructive"

export function toast(opts: {
  title?: string
  description?: string
  variant?: ToastVariant
}) {
  const msg = opts.description || opts.title || ""

  switch (opts.variant) {
    case "success":
      return sonner.success(msg)
    case "warning":
      return sonner.warning(msg)
    case "error":
    case "destructive":
      return sonner.error(msg)
    default:
      return sonner(msg)
  }
}
