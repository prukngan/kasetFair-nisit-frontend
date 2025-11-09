"use client"

import { useCallback, useEffect, useState } from "react"
import { MediaPurpose } from "@/services/dto/media.dto"
import { uploadMedia } from "@/services/mediaService"
import { extractErrorMessage, updateClubInfo } from "@/services/storeServices"
import { CLUB_INFO_REQUEST_FIELD_MAP, type ClubInfoFieldKey } from "./store-wizard.config"
import type { StoreWizardCore } from "./store-wizard.core"
import { STORE_ID_STORAGE_KEY, type StoreProgress } from "./store-wizard.core"

const CLUB_INFO_STORAGE_KEY = "kasetfair-club-info-draft"

type ClubInfoBaseState = Record<Exclude<ClubInfoFieldKey, "clubApplicationMediaId">, string> & {
  clubApplicationMediaId: string | null
}

export type ClubInfoState = ClubInfoBaseState & {
  applicationFileName: string | null
  applicationFile: File | null
}

const emptyClubInfo: ClubInfoState = {
  organizationName: "",
  presidentFirstName: "",
  presidentLastName: "",
  presidentNisitId: "",
  presidentEmail: "",
  presidentPhone: "",
  applicationFileName: null,
  applicationFile: null,
  clubApplicationMediaId: null,
}

type UpdateClubInfoPayload = Parameters<typeof updateClubInfo>[0]

const clubInfoFieldEntries = Object.entries(CLUB_INFO_REQUEST_FIELD_MAP) as Array<
  [ClubInfoFieldKey, keyof UpdateClubInfoPayload]
>

const mapClubInfoToPayload = (info: ClubInfoState): UpdateClubInfoPayload =>
  clubInfoFieldEntries.reduce((acc, [stateKey, requestKey]) => {
    const value = info[stateKey]
    if (typeof value !== "string") return acc
    const normalized = value.trim()
    if (normalized.length) {
      acc[requestKey] = normalized
    }
    return acc
  }, {} as UpdateClubInfoPayload)

const getClubInfoDraftKey = () => {
  if (typeof window === "undefined") return null
  const storeId = window.sessionStorage.getItem(STORE_ID_STORAGE_KEY)
  if (!storeId) return null
  return `${CLUB_INFO_STORAGE_KEY}-${storeId}`
}

export type UseClubInfoStepResult = {
  clubInfo: ClubInfoState
  isSubmitting: boolean
  updateField: (key: ClubInfoFieldKey, value: string) => void
  updateApplicationFile: (file: File | null) => void
  submitClubInfo: () => Promise<void>
}

export function useClubInfoStep(core: StoreWizardCore): UseClubInfoStepResult {
  const [clubInfo, setClubInfoState] = useState<ClubInfoState>(emptyClubInfo)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const persistDraft = useCallback((next: ClubInfoState) => {
    if (core.storeType !== "Club") return
    const key = getClubInfoDraftKey()
    if (!key) return
    const { applicationFile, ...serializable } = next
    try {
      window.sessionStorage.setItem(key, JSON.stringify(serializable))
    } catch (error) {
      console.warn("Failed to persist club info draft", error)
    }
  }, [core.storeType])

  const clearDraft = useCallback(() => {
    const key = getClubInfoDraftKey()
    if (!key) return
    window.sessionStorage.removeItem(key)
  }, [])

  const setClubInfo = useCallback(
    (valueOrUpdater: ClubInfoState | ((prev: ClubInfoState) => ClubInfoState)) => {
      setClubInfoState((prev) => {
        const next =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as (prev: ClubInfoState) => ClubInfoState)(prev)
            : valueOrUpdater
        persistDraft(next)
        return next
      })
    },
    [persistDraft]
  )

  useEffect(() => {
    if (core.storeType !== "Club") {
      setClubInfoState(emptyClubInfo)
      clearDraft()
      return
    }

    const snapshot = core.storeStatus as StoreProgress | null
    if (snapshot?.type === "Club" && snapshot.clubInfo) {
      const ci = snapshot.clubInfo
      setClubInfo({
        organizationName: ci.clubName ?? "",
        presidentFirstName: ci.leaderFirstName ?? "",
        presidentLastName: ci.leaderLastName ?? "",
        presidentNisitId: ci.leaderNisitId ?? "",
        presidentEmail: ci.leaderEmail ?? "",
        presidentPhone: ci.leaderPhone ?? "",
        applicationFileName: ci.applicationFileName ?? null,
        applicationFile: null,
        clubApplicationMediaId: ci.clubApplicationMediaId ?? ci.applicationFileId ?? null,
      })
    }
  }, [core.storeStatus, core.storeType, setClubInfo])

  useEffect(() => {
    if (core.storeType !== "Club") return
    const key = getClubInfoDraftKey()
    if (!key) return
    const cached = window.sessionStorage.getItem(key)
    if (!cached) return
    try {
      const parsed = JSON.parse(cached) as Omit<ClubInfoState, "applicationFile">
      setClubInfo((prev) => ({
        ...prev,
        ...parsed,
        applicationFile: null,
      }))
    } catch (error) {
      console.warn("Failed to restore club info draft", error)
    }
  }, [core.storeType, core.storeStatus?.id, setClubInfo])

  useEffect(() => {
    setClubInfoState(emptyClubInfo)
    clearDraft()
  }, [clearDraft, core.resetSignal])

  const updateField = useCallback((key: ClubInfoFieldKey, value: string) => {
    setClubInfo((prev) => ({ ...prev, [key]: value }))
  }, [setClubInfo])

  const updateApplicationFile = useCallback((file: File | null) => {
    setClubInfo((prev) => ({
      ...prev,
      applicationFileName: file ? file.name : null,
      applicationFile: file,
      clubApplicationMediaId: prev.clubApplicationMediaId,
    }))
  }, [setClubInfo])

  const submitClubInfo = useCallback(async () => {
    if (core.storeType !== "Club") {
      core.goNextStep({ clamp: false })
      return
    }

    if (!core.storeStatus || core.storeStatus.state === "CreateStore") {
      core.setStepError("Please create a store before submitting club information.")
      core.goToStep(1, { clamp: false })
      return
    }

    setIsSubmitting(true)
    core.setStepError(null)

    try {
      let nextMediaId = clubInfo.clubApplicationMediaId ?? null

      if (clubInfo.applicationFile) {
        const media = await uploadMedia({
          purpose: MediaPurpose.CLUB_APPLICATION,
          file: clubInfo.applicationFile,
        })
        nextMediaId = media.id
        setClubInfo((prev) => ({
          ...prev,
          clubApplicationMediaId: media.id,
          applicationFile: null,
        }))
      }

      const payload = mapClubInfoToPayload(clubInfo)
      if (nextMediaId) {
        payload.clubApplicationMediaId = nextMediaId
      }

      const response = await updateClubInfo(payload)
      core.applyStoreSnapshot(response)
      clearDraft()
      core.goNextStep({ clamp: false })
    } catch (error) {
      core.setStepError(extractErrorMessage(error, "Failed to save club information"))
    } finally {
      setIsSubmitting(false)
    }
  }, [clearDraft, clubInfo, core, setClubInfo])

  return {
    clubInfo,
    isSubmitting,
    updateField,
    updateApplicationFile,
    submitClubInfo,
  }
}
