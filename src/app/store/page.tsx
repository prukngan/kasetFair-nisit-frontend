"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Store, 
  ShoppingBag, 
  FileImage, 
  ArrowLeft, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStoreValidate } from "@/services/storeServices"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// --- Types based on your DTO ---
type StoreType = string
type StoreState = string

type StoreValidateResponseDto = {
  store: {
    id: number
    storeName: string
    type: StoreType
    state: StoreState
    boothNumber: string
    storeAdminNisitId: string | null
  }
  isValid: boolean
  sections: {
    key: "members" | "clubInfo" | "storeDetail" | "goods"
    label: string
    ok: boolean
    items: {
      key: string
      label: string
      ok: boolean
      message?: string
    }[]
  }[]
}

export default function StoreDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<StoreValidateResponseDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(true)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await getStoreValidate()
        setData(response)
      } catch (error) {
        console.error("Failed to fetch store info", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [])

  // --- UPDATED LOGIC HERE ---
  const getRouteForSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "members":
      case "clubInfo":
        // Maps to "ข้อมูลร้านค้า"
        return "/store/info"
        
      case "storeDetail":
        // Maps to "ไฟล์ร้านค้า" (Layout/Images)
        return "/store/layout"
        
      case "goods":
        // Maps to "จัดการสินค้า"
        return "/store/goods"
        
      default:
        return "/store/info"
    }
  }

  const calculateProgress = () => {
    if (!data) return 0
    const totalItems = data.sections.reduce((acc, curr) => acc + curr.items.length, 0)
    const completedItems = data.sections.reduce(
      (acc, curr) => acc + curr.items.filter((i) => i.ok).length, 
      0
    )
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)
  }

  const menuItems = [
    {
      title: "ข้อมูลร้านค้า",
      description: "จัดการสมาชิก และข้อมูลพื้นฐาน", // Updated description
      icon: Store,
      href: "/store/info",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "จัดการสินค้า",
      description: "เพิ่ม ลบ แก้ไขรายการสินค้าและราคา",
      icon: ShoppingBag,
      href: "/store/goods",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "ไฟล์ร้านค้า",
      description: "รายละเอียดร้านค้าและรูปโปรโมต", // Updated description
      icon: FileImage,
      href: "/store/layout",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const store = data?.store
  const progress = calculateProgress()
  const isReady = data?.isValid

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        
        {/* --- Header --- */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white/60 bg-white/40 shadow-sm backdrop-blur-sm"
              onClick={() => router.push("/home")}
            >
              <ArrowLeft className="h-6 w-6 text-emerald-900" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold text-emerald-900 leading-tight">
                จัดการร้านค้า
              </h1>
              <p className="mt-1 text-emerald-700 text-[15px]">
                ยินดีต้อนรับสู่ระบบจัดการร้านค้าของคุณ
              </p>
            </div>
          </div>
          {/* {store && (
            <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-900">
                  {store.storeName}
                </p>
                <p className="text-xs text-emerald-600">
                  สถานะ: {store.state} | บูธ: {store.boothNumber || "-"}
                </p>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {store.type}
              </Badge>
            </div>
          )} */}
        </header>

        {/* --- Menu Grid --- */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            // Check if this card requires attention based on the mapped sections
            const requiresAttention = !data?.isValid && data?.sections.some(s => 
              !s.ok && getRouteForSection(s.key) === item.href
            );

            return (
              <Card
                key={item.href}
                className={cn(
                  "group relative overflow-hidden border-emerald-100 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                  requiresAttention && "ring-2 ring-amber-400 ring-offset-2"
                )}
                onClick={() => {
                  router.push(item.href)
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    {requiresAttention && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent
                  className="
                    overflow-hidden transition-all duration-300
                    max-h-0 opacity-0 translate-y-2
                    group-hover:max-h-20 group-hover:opacity-100 group-hover:translate-y-0
                  "
                >
                  <div className="flex items-center text-sm font-medium text-emerald-600">
                    ไปที่หน้าจัดการ <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
          )})}
        </div>
      </div>
    </div>
  )
}