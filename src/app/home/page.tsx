"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { http } from "@/lib/http"
import {
  Building2,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Store,
  Users2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getStoreValidate, leaveStore } from "@/services/storeServices"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// --- Types ---
type Invitation = {
  id: string
  storeName: string
  inviterName: string
  inviteeEmail: string
  role?: string
  createdAt?: string
  message?: string | null
}

// CHANGED: Full Validation DTO
type StoreValidateResponseDto = {
  store: {
    id: number;
    storeName: string;
    type: string;
    state: string;
    boothNumber: string;
    storeAdminNisitId: string | null;
  };
  isValid: boolean;
  sections: {
    key: "members" | "clubInfo" | "storeDetail" | "goods";
    label: string;
    ok: boolean;
    items: {
      key: string;
      label: string;
      ok: boolean;
      message?: string;
    }[];
  }[];
};

const draftStates = ["CreateStore", "ClubInfo", "StoreDetails", "ProductDetails"]

export const convertStateToLabel = (state: string): string => {
  if (!state) return "ไม่ระบุ"
  switch (state) {
    case "CreateStore": return "สร้างร้านค้า"
    case "StoreDetails": return "รายละเอียดร้านค้า"
    case "ProductDetails": return "รายละเอียดสินค้า"
    case "Pending": return "รอการพิจารณา"
    default: return "ไม่ระบุ"
  }
}

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [selectingStoreType, setSelectingStoreType] = useState(false)

  // CHANGED: State to hold the full validation object
  const [validationData, setValidationData] = useState<StoreValidateResponseDto | null>(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [storeError, setStoreError] = useState<string | null>(null)
  
  // UI State for expanding validation details
  const [showValidationDetails, setShowValidationDetails] = useState(true)

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const displayName = useMemo(
    () => session?.user?.name || session?.user?.email || "Kaset Fair Member",
    [session?.user?.email, session?.user?.name]
  )
  const displayInitial = useMemo(
    () => (displayName?.charAt(0)?.toUpperCase() ?? "U"),
    [displayName]
  )

  const fetchInvitations = useCallback(async () => {
    setLoadingInvites(true)
    setInviteError(null)
    try {
      const res = await http.get<Invitation[]>("/shops/invitations")
      const data = Array.isArray(res.data) ? res.data : []
      setInvitations(data)
    } catch (error) {
      console.error("Failed to load invitations", error)
      setInviteError("โหลดคำเชิญไม่สำเร็จ")
      setInvitations([])
    } finally {
      setLoadingInvites(false)
    }
  }, [])

  // CHANGED: Fetch Validation Data
  const fetchStoreData = useCallback(async () => {
    setLoadingStore(true)
    setStoreError(null)
    try {
      const res = await getStoreValidate()
      setValidationData(res || null)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      if (status === 404) {
        setValidationData(null)
        setStoreError(null)
      } else {
        console.error("Failed to load store status", err)
        setValidationData(null)
        setStoreError("โหลดข้อมูลร้านไม่สำเร็จ")
      }
    } finally {
      setLoadingStore(false)
    }
  }, [])

  useEffect(() => {
    fetchInvitations()
    fetchStoreData()
  }, [fetchInvitations, fetchStoreData])

  useEffect(() => {    
    const onFocus = () => fetchStoreData()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetchStoreData])

  const handleLeaveStoreClick = useCallback(() => {
    setLeaveDialogOpen(true)
  }, [])

  const handleLeaveStore = useCallback(async () => {
    setLoadingStore(true)
    setStoreError(null)
    try {
      await leaveStore()
      setValidationData(null)
      setLeaveDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to leave store", err)
      setStoreError("ไม่สามารถออกจากร้านได้ กรุณาลองใหม่")
    } finally {
      setLeaving(false)
      setLoadingStore(false)
    }
  }, [])

  const selectorRef = useRef<HTMLDivElement>(null)
  const handleCreateStore = () => {
    setSelectingStoreType((v) => !v)
  }
  useEffect(() => {
    if (selectingStoreType) {
      selectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [selectingStoreType])

  const handleSelectStoreType = (type: "Nisit" | "Club") => {
    if (type === "Club") {
      router.push(`/store/create/club-info`)
    } else {
      router.push(`/store/create?type=Nisit`)
    }
  }

  // --- Helper Logic for Validation UI ---
  const getRouteForSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "members":
      case "clubInfo":
        return "/store/info" // ข้อมูลร้านค้า
      case "storeDetail":
        return "/store/layout" // ไฟล์ร้านค้า
      case "goods":
        return "/store/goods" // สินค้า
      default:
        return "/store/info"
    }
  }

  const calculateProgress = () => {
    if (!validationData) return 0
    const totalItems = validationData.sections.reduce((acc, curr) => acc + curr.items.length, 0)
    const completedItems = validationData.sections.reduce(
      (acc, curr) => acc + curr.items.filter((i) => i.ok).length, 
      0
    )
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)
  }

  // Extract store from validation data for easier access
  const store = validationData?.store
  const progress = calculateProgress()
  const isReady = validationData?.isValid

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6">
      {/* Header */}
      <header className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">{displayName}</h1>
            <p className="mt-1 text-sm text-emerald-700">
              จัดการร้านและคำเชิญของคุณ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/info"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-800 shadow hover:ring-2 hover:ring-emerald-200"
            >
              <span className="text-sm font-semibold">{displayInitial}</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 border-emerald-200 text-emerald-700"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto mt-4 grid w-full max-w-3xl gap-4 md:mt-6 md:grid-cols-2">
        
        {/* My Store Card */}
        <Card className="border-emerald-100 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Store className="h-5 w-5" />
              ร้านของฉัน
            </CardTitle>
            <CardDescription className="text-sm">
              {store ? "สถานะความพร้อมและข้อมูลร้านค้า" : "สร้างร้านเพื่อจัดการบูธและทีมงาน"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            
            {/* Loading State */}
            {loadingStore && (
              <div className="flex items-center justify-center py-8 text-emerald-700">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังโหลดข้อมูลร้าน...
              </div>
            )}

            {/* Error State */}
            {!loadingStore && storeError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{storeError}</p>
                <Button variant="outline" size="sm" onClick={fetchStoreData} className="mt-2 border-red-200">
                  ลองใหม่
                </Button>
              </div>
            )}

            {/* STORE EXISTS: SHOW VALIDATION DASHBOARD */}
            {!loadingStore && !storeError && validationData && store && (
              <div className="space-y-4">
                {/* Store Header */}
                <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-emerald-900">
                        {store.storeName}
                      </h3>
                      <p className="text-xs text-emerald-600">
                        {store.type} | บูธ: {store.boothNumber || "-"}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                      {convertStateToLabel(store.state)}
                    </Badge>
                  </div>
                </div>

                {/* --- VALIDATION / PROGRESS SECTION --- */}
                <div className={cn(
                  "rounded-lg border transition-all overflow-hidden",
                  isReady ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"
                )}>
                  {/* Progress Header */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
                    onClick={() => setShowValidationDetails(!showValidationDetails)}
                  >
                    <div className="flex items-center gap-3">
                      {isReady ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      ) : (
                        <div className="relative">
                           <AlertCircle className="h-8 w-8 text-amber-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {isReady ? "ข้อมูลครบถ้วน" : "ข้อมูลยังไม่ครบ"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ความคืบหน้า {progress}%
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {showValidationDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Progress Line */}
                  <div className="h-1 w-full bg-white/50">
                    <div 
                      className={cn("h-full transition-all duration-1000", isReady ? "bg-emerald-500" : "bg-amber-500")} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Detail List (Collapsible) */}
                  <AnimatePresence>
                    {showValidationDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2 bg-white/40 border-t border-black/5">
                          {validationData.sections.map((section) => (
                            <div key={section.key} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                  {section.ok ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                                  )}
                                  {section.label}
                                </span>
                                {!section.ok && (
                                  <Link 
                                    href={getRouteForSection(section.key)}
                                    className="text-[10px] bg-white border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full hover:bg-emerald-50 flex items-center"
                                  >
                                    แก้ไข <ArrowRight className="ml-1 h-2 w-2" />
                                  </Link>
                                )}
                              </div>
                              
                              {/* Updated: Show X icon before each error item */}
                              {!section.ok && (
                                <div className="pl-5 space-y-1">
                                  {section.items.filter(i => !i.ok).map(item => (
                                    <div key={item.key} className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50/50 px-2 py-1 rounded">
                                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                      <span>{item.message || item.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                   <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleLeaveStoreClick}
                    disabled={leaving}
                  >
                     ออกจากร้าน
                  </Button>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    onClick={() => {
                      // If valid, go to info, otherwise go to first invalid section? 
                      // Or just default to dashboard hub
                      router.push("/store") 
                    }}
                  >
                    จัดการร้าน
                  </Button>
                </div>
              </div>
            )}

            {/* NO STORE: CREATE UI */}
            {!loadingStore && !storeError && !store && (
              <div className="space-y-4">
                 <Button
                  className={`w-full ${
                    selectingStoreType 
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                  onClick={handleCreateStore}
                >
                  {selectingStoreType ? (
                     <>ยกเลิก</> 
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" /> สร้างร้านค้าใหม่
                    </>
                  )}
                </Button>
                
                {!selectingStoreType && (
                  <p className="text-center text-xs text-gray-400">
                    หรือรอรับคำเชิญจากเพื่อนของคุณ
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {selectingStoreType && (
                    <motion.div
                      ref={selectorRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                        <p className="mb-3 text-sm font-medium text-emerald-800">
                          เลือกประเภทร้านค้า
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            className="w-full justify-start gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            variant="outline"
                            onClick={() => handleSelectStoreType("Nisit")}
                          >
                            <GraduationCap className="h-4 w-4" />
                            ร้านนิสิต
                          </Button>
                          <Button
                            className="w-full justify-start gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            variant="outline"
                            onClick={() => handleSelectStoreType("Club")}
                          >
                            <Building2 className="h-4 w-4" />
                            ร้านชมรม/องค์กร
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Leave Dialog */}
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>ออกจากร้านนี้?</DialogTitle>
                  <DialogDescription>
                    คุณจะไม่สามารถจัดการร้านนี้ได้อีก จนกว่าจะได้รับคำเชิญใหม่
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setLeaveDialogOpen(false)} disabled={leaving}>
                    ยกเลิก
                  </Button>
                  <Button variant="destructive" onClick={handleLeaveStore} disabled={leaving}>
                    {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยัน"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Invitations Column (Currently Commented Out in your original code, kept as placeholder or uncomment if needed) */}
        {/* <Card className="border-emerald-100">...</Card> */}
      </main>
    </div>
  )
}