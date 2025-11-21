"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useRef } from "react"
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  Utensils,
  ImageIcon,
  Pencil,
  X,
  Check,
  AlertCircle,
  UploadCloud
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GoogleFileUpload } from "@/components/uploadFile"
import { MediaPurpose } from "@/services/dto/media.dto"
import { getMediaUrl, uploadMediaViaPresign } from "@/services/mediaService"
import type { GoodsResponseDto, GoodsType } from "@/services/dto/goods.dto"
import { createGood, deleteGood, listGoods, updateGood, extractErrorMessage } from "@/services/storeServices"

// --- Types ---
type GoodDraft = {
  name: string
  price: string
  type: GoodsType
  goodMediaId?: string | null
}

type DraftNewGood = {
  tempId: string
  name: string
  price: string
}

const createDraftNewGood = (): DraftNewGood => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  price: "",
})

export default function StoreGoodsPage() {
  // --- State ---
  const [goods, setGoods] = useState<GoodsResponseDto[]>([])
  const [goodDrafts, setGoodDrafts] = useState<Record<string, GoodDraft>>({})
  const [goodImageUrls, setGoodImageUrls] = useState<Record<string, string>>({})
  const [loadingGoods, setLoadingGoods] = useState(true)
  
  // Error/Feedback State
  const [goodsError, setGoodsError] = useState<string | null>(null)
  const [goodsMessage, setGoodsMessage] = useState<string | null>(null)
  
  // Action States
  const [savingGoodsMap, setSavingGoodsMap] = useState<Record<string, boolean>>({})
  const [deletingGoodsMap, setDeletingGoodsMap] = useState<Record<string, boolean>>({})
  const [draftNewGoods, setDraftNewGoods] = useState<DraftNewGood[]>([])
  const [goodFieldErrors, setGoodFieldErrors] = useState<Record<string, { name?: string; price?: string }>>({})
  const [goodRowErrors, setGoodRowErrors] = useState<Record<string, string>>({})
  
  // Editing Focus
  const [editingId, setEditingId] = useState<string | null>(null)
  const [goodUploadingMap, setGoodUploadingMap] = useState<Record<string, boolean>>({})
  const [goodUploadErrors, setGoodUploadErrors] = useState<Record<string, string | null>>({})

  const router = useRouter()
  const nameInputRef = useRef<HTMLInputElement>(null)

  // --- Effects & Data Loading ---

  const loadGoodImages = useCallback(async (items: GoodsResponseDto[]) => {
    const goodsWithMedia = items.filter((item) => item.goodMediaId)
    if (goodsWithMedia.length === 0) {
      setGoodImageUrls({})
      return
    }

    try {
      const entries = await Promise.all(
        goodsWithMedia.map(async (item) => {
          try {
            const media = await getMediaUrl(item.goodMediaId as string)
            return { id: item.id, url: media.link ?? "" }
          } catch (error) {
            console.error(`Failed to load media for good ${item.goodMediaId}`, error)
            return { id: item.id, url: "" }
          }
        }),
      )

      setGoodImageUrls(
        entries.reduce<Record<string, string>>((acc, entry) => {
          if (entry.url) {
            acc[entry.id] = entry.url
          }
          return acc
        }, {}),
      )
    } catch (error) {
      console.error("Failed to load goods media", error)
    }
  }, [])

  const fetchGoods = useCallback(async () => {
    setLoadingGoods(true)
    setGoodsError(null)
    setGoodsMessage(null)
    try {
      const data = await listGoods()
      setGoods(data)
      setGoodDrafts(
        data.reduce<Record<string, GoodDraft>>((acc, item) => {
          acc[item.id] = {
            name: item.name ?? "",
            price: item.price?.toString() ?? "",
            type: item.type,
            goodMediaId: item.goodMediaId,
          }
          return acc
        }, {}),
      )
      await loadGoodImages(data)
      setGoodFieldErrors({})
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ไม่สามารถโหลดสินค้าของร้านได้"))
    } finally {
      setLoadingGoods(false)
    }
  }, [loadGoodImages])

  useEffect(() => {
    fetchGoods()
  }, [fetchGoods])

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (editingId && nameInputRef.current) {
        nameInputRef.current.focus();
    }
  }, [editingId])


  // --- Handlers ---

  const handleGoodFileChange = useCallback(
    async (goodId: string, files: File[]) => {
      if (!files || files.length === 0) return

      const file = files[0]
      setGoodUploadErrors((prev) => ({ ...prev, [goodId]: null }))
      setGoodUploadingMap((prev) => ({ ...prev, [goodId]: true }))

      try {
        const uploadRes = await uploadMediaViaPresign({
          purpose: MediaPurpose.STORE_GOODS,
          file,
        })

        if (!uploadRes?.mediaId) {
          throw new Error("อัปโหลดไฟล์สำเร็จ แต่ระบบไม่ส่ง mediaId กลับมา")
        }

        setGoodDrafts((prev) => ({
          ...prev,
          [goodId]: {
            ...(prev[goodId] ?? { name: "", price: "", type: "Food", goodMediaId: null }),
            goodMediaId: uploadRes.mediaId,
          },
        }))

        setGoodImageUrls((prev) => ({
          ...prev,
          [goodId]: URL.createObjectURL(file),
        }))
      } catch (error) {
        console.error("Failed to upload good image", error)
        setGoodUploadErrors((prev) => ({
          ...prev,
          [goodId]: extractErrorMessage(error, "อัปโหลดรูปล้มเหลว"),
        }))
      } finally {
        setGoodUploadingMap((prev) => ({ ...prev, [goodId]: false }))
      }
    },
    [],
  )

  const handleGoodDraftChange = useCallback(<K extends keyof GoodDraft>(id: string, field: K, value: GoodDraft[K]) => {
    setGoodRowErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setGoodFieldErrors((prev) => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id][field as keyof typeof next[typeof id]]
      }
      return next
    })

    setGoodDrafts((prev) => {
      const existing = prev[id] ?? { name: "", price: "", type: "Food", goodMediaId: null }
      return {
        ...prev,
        [id]: { ...existing, [field]: value },
      }
    })
  }, [])

  const handleStartEdit = (id: string) => {
    setEditingId(id)
    setGoodsError(null)
  }

  const handleCancelEdit = (id: string) => {
    setEditingId(null)
    const original = goods.find((g) => g.id === id)
    if (original) {
      setGoodDrafts((prev) => ({
        ...prev,
        [id]: {
          name: original.name,
          price: original.price.toString(),
          type: original.type,
          goodMediaId: original.goodMediaId,
        },
      }))
    }
    setGoodFieldErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
    })
  }

  const handleSaveGood = async (goodId: string) => {
    const draft = goodDrafts[goodId]
    if (!draft) return

    const trimmedName = draft.name.trim()
    const parsedPrice = Number(draft.price)

    const errors: { name?: string; price?: string } = {}
    if (!trimmedName) errors.name = "กรุณากรอกชื่อ"
    if (Number.isNaN(parsedPrice)) errors.price = "ราคาไม่ถูกต้อง"

    if (Object.keys(errors).length > 0) {
      setGoodFieldErrors((prev) => ({ ...prev, [goodId]: errors }))
      return
    }

    setSavingGoodsMap((prev) => ({ ...prev, [goodId]: true }))

    try {
      const updated = await updateGood(goodId, {
        name: trimmedName,
        price: parsedPrice,
        type: draft.type,
        goodMediaId: draft.goodMediaId,
      })

      setGoods((prev) => prev.map((good) => (good.id === goodId ? updated : good)))
      loadGoodImages([updated]) // Reload just to be safe/consistent
      setEditingId(null)
      setGoodMessageWithTimeout("บันทึกข้อมูลเรียบร้อย")
    } catch (error) {
      setGoodRowErrors((prev) => ({
        ...prev,
        [goodId]: extractErrorMessage(error, "บันทึกไม่สำเร็จ"),
      }))
    } finally {
      setSavingGoodsMap((prev) => ({ ...prev, [goodId]: false }))
    }
  }

  const handleDeleteGood = async (goodId: string) => {
    if (!window.confirm("ยืนยันการลบสินค้านี้?")) return
    setDeletingGoodsMap((prev) => ({ ...prev, [goodId]: true }))

    try {
      await deleteGood(goodId)
      setGoods((prev) => prev.filter((good) => good.id !== goodId))
      setGoodDrafts((prev) => {
        const next = { ...prev }
        delete next[goodId]
        return next
      })
      setGoodMessageWithTimeout("ลบสินค้าเรียบร้อย")
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ลบสินค้าไม่สำเร็จ"))
    } finally {
      setDeletingGoodsMap((prev) => ({ ...prev, [goodId]: false }))
    }
  }

  // --- New Good Draft Logic ---

  const handleAddDraftNewGood = () => {
    setDraftNewGoods((prev) => [...prev, createDraftNewGood()])
  }

  const handleRemoveDraftNewGood = (tempId: string) => {
    setDraftNewGoods((prev) => prev.filter((draft) => draft.tempId !== tempId))
    setGoodFieldErrors((prev) => {
      const next = { ...prev }
      delete next[tempId]
      return next
    })
  }

  const handleDraftNewGoodChange = (tempId: string, key: keyof Omit<DraftNewGood, "tempId">, value: string) => {
    setGoodFieldErrors((prev) => {
        const next = { ...prev }
        if(next[tempId]) delete next[tempId][key as 'name' | 'price']
        return next
    })
    setDraftNewGoods((prev) =>
      prev.map((draft) => (draft.tempId === tempId ? { ...draft, [key]: value } : draft))
    )
  }

  const handleCreateSingleDraft = async (draft: DraftNewGood) => {
    const trimmedName = draft.name.trim()
    const parsedPrice = Number(draft.price)

    const errors: { name?: string; price?: string } = {}
    if (!trimmedName) errors.name = "กรุณากรอกชื่อ"
    if (Number.isNaN(parsedPrice) || draft.price === "") errors.price = "ระบุราคา"

    if (Object.keys(errors).length > 0) {
      setGoodFieldErrors((prev) => ({ ...prev, [draft.tempId]: errors }))
      return
    }

    setSavingGoodsMap((prev) => ({ ...prev, [draft.tempId]: true }))

    try {
      const created = await createGood({
        name: trimmedName,
        price: parsedPrice,
        type: "Food",
      })

      setGoods((prev) => [...prev, created])
      setGoodDrafts((prev) => ({
        ...prev,
        [created.id]: {
          name: created.name,
          price: created.price.toString(),
          type: created.type,
          goodMediaId: created.goodMediaId,
        },
      }))

      // Remove the draft from the temporary list
      setDraftNewGoods((prev) => prev.filter((item) => item.tempId !== draft.tempId))
      setGoodMessageWithTimeout("เพิ่มเมนูใหม่เรียบร้อย")
    } catch (error) {
      setGoodRowErrors((prev) => ({
        ...prev,
        [draft.tempId]: extractErrorMessage(error, "สร้างสินค้าไม่สำเร็จ"),
      }))
    } finally {
      setSavingGoodsMap((prev) => ({ ...prev, [draft.tempId]: false }))
    }
  }

  const setGoodMessageWithTimeout = (msg: string) => {
    setGoodsMessage(msg)
    setTimeout(() => setGoodsMessage(null), 3000)
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-emerald-50 text-emerald-700"
              onClick={() => router.push("/store")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการเมนูอาหาร</h1>
              <p className="text-xs text-gray-500">{goods.length} รายการในร้าน</p>
            </div>
          </div>
          <Button
            onClick={handleAddDraftNewGood}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <Plus className="mr-1 h-4 w-4" /> เพิ่มเมนู
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="mx-auto max-w-6xl px-4 mt-4 space-y-2">
        {goodsError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" /> {goodsError}
          </div>
        )}
        {goodsMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-100 animate-in slide-in-from-top-2">
            <Check className="h-4 w-4" /> {goodsMessage}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="mx-auto mt-6 w-full max-w-6xl px-4">
        {loadingGoods ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm">กำลังโหลดรายการอาหาร...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            
            {/* 1. Existing Goods */}
            {goods.map((good) => {
              const isEditing = editingId === good.id
              const draft = goodDrafts[good.id] ?? { name: good.name, price: good.price.toString() }
              const imageUrl = goodImageUrls[good.id]
              const fieldError = goodFieldErrors[good.id]
              const rowError = goodRowErrors[good.id]
              const isSaving = savingGoodsMap[good.id]
              const isDeleting = deletingGoodsMap[good.id]
              const isUploading = goodUploadingMap[good.id]

              if (isEditing) {
                return (
                  <Card key={good.id} className="relative overflow-hidden border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl z-10">
                    {/* Edit Mode Card */}
                    <div className="group relative aspect-[4/3] w-full bg-gray-100">
                      {imageUrl ? (
                        <img src={imageUrl} className="h-full w-full object-cover opacity-50" alt="" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Utensils className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Upload Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="relative overflow-hidden rounded-full bg-emerald-600 px-4 py-2 text-xs text-white shadow hover:bg-emerald-700 cursor-pointer">
                            <span className="flex items-center gap-2">
                                {isUploading ? <Loader2 className="h-3 w-3 animate-spin"/> : <UploadCloud className="h-3 w-3"/>}
                                {isUploading ? "กำลังอัปโหลด" : "เปลี่ยนรูป"}
                            </span>
                            <GoogleFileUpload
                                maxFiles={1}
                                accept="image/png,image/jpeg,image/jpg"
                                onFilesChange={(files) => handleGoodFileChange(good.id, files)}
                                disabled={isUploading}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                         </div>
                      </div>
                    </div>

                    <CardContent className="p-3 space-y-3 bg-white">
                       <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ชื่อเมนู</label>
                          <Input
                             ref={nameInputRef}
                             value={draft.name}
                             onChange={(e) => handleGoodDraftChange(good.id, "name", e.target.value)}
                             className={`h-8 text-sm ${fieldError?.name ? 'border-red-500' : ''}`}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ราคา</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">฿</span>
                            <Input
                                inputMode="decimal"
                                value={draft.price}
                                onChange={(e) => handleGoodDraftChange(good.id, "price", e.target.value)}
                                className={`h-8 pl-6 text-sm font-medium ${fieldError?.price ? 'border-red-500' : ''}`}
                            />
                          </div>
                       </div>
                       
                       {rowError && <p className="text-xs text-red-500">{rowError}</p>}
                       {goodUploadErrors[good.id] && <p className="text-xs text-red-500">{goodUploadErrors[good.id]}</p>}

                       <div className="flex items-center gap-2 pt-1">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                            onClick={() => handleSaveGood(good.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin"/> : "บันทึก"}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8"
                            onClick={() => handleDeleteGood(good.id)}
                            disabled={isDeleting}
                          >
                             {isDeleting ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3"/>}
                          </Button>
                          <Button 
                             size="icon" 
                             variant="ghost" 
                             className="h-8 w-8 text-gray-400 hover:text-gray-600"
                             onClick={() => handleCancelEdit(good.id)}
                          >
                             <X className="h-4 w-4"/>
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                )
              }

              // View Mode Card
              return (
                <Card
                  key={good.id}
                  className="group relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleStartEdit(good.id)}
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={good.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50/30">
                        <Utensils className="h-10 w-10 text-emerald-200" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 text-emerald-700 hover:bg-white backdrop-blur shadow-sm text-xs font-bold px-2">
                            ฿{good.price.toLocaleString()}
                        </Badge>
                    </div>

                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100">
                       <div className="rounded-full bg-white p-2 shadow-lg">
                          <Pencil className="h-4 w-4 text-emerald-600" />
                       </div>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-medium text-gray-900 line-clamp-1 text-sm" title={good.name}>
                      {good.name || <span className="italic text-gray-400">ไม่มีชื่อ</span>}
                    </h3>
                  </CardContent>
                </Card>
              )
            })}

            {/* 2. New Draft Cards */}
            {draftNewGoods.map((draft) => {
              const fieldError = goodFieldErrors[draft.tempId]
              const rowError = goodRowErrors[draft.tempId]
              const isSaving = savingGoodsMap[draft.tempId]

              return (
                <Card key={draft.tempId} className="border-2 border-dashed border-emerald-300 bg-emerald-50/30 shadow-none relative">
                   <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white text-gray-400 shadow hover:text-red-500 hover:bg-red-50 z-20"
                        onClick={() => handleRemoveDraftNewGood(draft.tempId)}
                    >
                        <X className="h-3 w-3"/>
                    </Button>

                    <div className="aspect-[4/3] flex items-center justify-center bg-emerald-100/50 text-emerald-600/30">
                        <ImageIcon className="h-10 w-10" />
                    </div>
                    
                    <CardContent className="p-3 space-y-3">
                        <div>
                            <Input 
                                autoFocus 
                                placeholder="ชื่อเมนูใหม่" 
                                className={`h-8 bg-white text-sm ${fieldError?.name ? 'border-red-400' : ''}`}
                                value={draft.name}
                                onChange={(e) => handleDraftNewGoodChange(draft.tempId, 'name', e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">฿</span>
                            <Input 
                                placeholder="0" 
                                inputMode="decimal"
                                className={`h-8 pl-6 bg-white text-sm ${fieldError?.price ? 'border-red-400' : ''}`}
                                value={draft.price}
                                onChange={(e) => handleDraftNewGoodChange(draft.tempId, 'price', e.target.value)}
                            />
                        </div>
                        
                        {rowError && <p className="text-xs text-red-500 leading-tight">{rowError}</p>}

                        <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                            onClick={() => handleCreateSingleDraft(draft)}
                            disabled={isSaving}
                        >
                             {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Save className="h-3 w-3 mr-1"/>}
                             บันทึก
                        </Button>
                    </CardContent>
                </Card>
              )
            })}

            {/* 3. Add Button (Big Card) */}
            <button
              onClick={handleAddDraftNewGood}
              className="group flex aspect-[3/4] sm:aspect-auto sm:h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-transparent text-gray-400 transition-all hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-600"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">เพิ่มรายการ</span>
            </button>

          </div>
        )}
      </div>
    </div>
  )
}