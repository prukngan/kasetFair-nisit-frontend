"use client"

import { useCallback, useEffect, useState } from "react"
import type { StoreWizardCore, StoreProgress } from "./store-wizard.core"

export type UseStoreDetailsStepResult = {
  layoutDescription: string
  layoutFile: File | null
  isSaving: boolean
  setLayoutDescription: (value: string) => void
  setLayoutFile: (file: File | null) => void
  saveAndContinue: () => Promise<void>
}

export function useStoreDetailsStep(core: StoreWizardCore): UseStoreDetailsStepResult {
  const [layoutDescription, setLayoutDescription] = useState("")
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const reset = useCallback(() => {
    setLayoutDescription("")
    setLayoutFile(null)
    setIsSaving(false)
  }, [])

  useEffect(() => {
    reset()
  }, [reset, core.resetSignal])

  useEffect(() => {
    const snapshot = core.storeStatus as StoreProgress | null
    if (!snapshot) return

    if (typeof snapshot.layoutDescription === "string") {
      setLayoutDescription(snapshot.layoutDescription)
    }

    if (typeof snapshot.layoutFileName === "string" && snapshot.layoutFileName) {
      setLayoutFile(null)
    }
  }, [core.storeStatus])

  const saveAndContinue = useCallback(async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    setIsSaving(false)
    core.goNextStep({ clamp: false })
  }, [core])

  return {
    layoutDescription,
    layoutFile,
    isSaving,
    setLayoutDescription,
    setLayoutFile,
    saveAndContinue,
  }
}
