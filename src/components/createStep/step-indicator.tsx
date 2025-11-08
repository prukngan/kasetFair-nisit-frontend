"use client"

import { cn } from "@/lib/utils"

type StepStatus = "completed" | "current" | "upcoming"

export type Step = {
  id: number
  label: string
  status: StepStatus
}

type StepIndicatorProps = {
  steps: Step[]
}

const STATUS_COLORS: Record<StepStatus, string> = {
  completed: "bg-emerald-500 text-emerald-700",
  current: "bg-amber-500 text-amber-700",
  upcoming: "bg-gray-300 text-gray-500",
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/80 p-4 shadow-lg ring-1 ring-emerald-100">
      {steps.map((step) => {
        const tone = STATUS_COLORS[step.status]
        return (
          <div key={step.id} className="flex flex-1 min-w-[120px] flex-col items-center gap-2">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white transition-colors",
                tone
              )}
            >
              {step.id}
            </div>
            <span
              className={cn(
                "text-sm font-medium text-center",
                step.status === "upcoming" && "text-gray-500",
                step.status === "completed" && "text-emerald-700",
                step.status === "current" && "text-amber-700"
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
