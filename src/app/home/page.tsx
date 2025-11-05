"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { http } from "@/lib/http"
import { Loader2, LogOut, Mail, Plus, Store, Users2 } from "lucide-react"

type Invitation = {
  id: string
  storeName: string
  inviterName: string
  inviteeEmail: string
  role?: string
  createdAt?: string
  message?: string | null
}

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const displayName = useMemo(
    () => session?.user?.name || session?.user?.email || "Kaset Fair Member",
    [session?.user?.email, session?.user?.name]
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

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const handleCreateStore = () => {
    router.push("/store/create")
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6">
      {/* Header — compact, mobile-first */}
      <header className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              สวัสดี
            </p>
            <h1 className="text-2xl font-bold text-emerald-900">{displayName}</h1>
            <p className="mt-1 text-sm text-emerald-700">
              จัดการร้านและคำเชิญของคุณ
            </p>
          </div>
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
      </header>

      {/* Content — single column on mobile, two on md+ */}
      <main className="mx-auto mt-4 grid w-full max-w-3xl gap-4 md:mt-6 md:grid-cols-2">
        {/* My Store */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Store className="h-5 w-5" />
              ร้านของฉัน
            </CardTitle>
            <CardDescription className="text-sm">
              สร้างร้านเพื่อจัดการบูธและทีมงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleCreateStore}
            >
              <Plus className="h-5 w-5" />
              สร้างร้านใหม่
            </Button>
            <p className="text-[11px] text-emerald-600">
              หลังบันทึกข้อมูล ร้านจะต้องได้รับการอนุมัติจากผู้ดูแล
            </p>
          </CardContent>
        </Card>

        {/* Invitations */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Users2 className="h-5 w-5" />
              คำเชิญเข้าร่วมร้าน
            </CardTitle>
            <CardDescription className="text-sm">
              ตอบรับหรือปฏิเสธคำเชิญได้ที่นี่
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingInvites ? (
              <div className="flex items-center justify-center py-8 text-emerald-700">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                กำลังโหลด...
              </div>
            ) : inviteError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{inviteError}</p>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={fetchInvitations}
                >
                  ลองใหม่
                </Button>
              </div>
            ) : invitations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-emerald-200 bg-white p-4 text-center text-sm text-emerald-700">
                <Users2 className="mx-auto mb-2 h-7 w-7" />
                ยังไม่มีคำเชิญ
              </div>
            ) : (
              <ul className="space-y-3">
                {invitations.map((inv) => (
                  <li key={inv.id}>
                    <InvitationCard invitation={inv} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

type InvitationCardProps = { invitation: Invitation }

function InvitationCard({ invitation }: InvitationCardProps) {
  const formattedDate =
    invitation.createdAt && !Number.isNaN(new Date(invitation.createdAt).getTime())
      ? new Intl.DateTimeFormat("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(invitation.createdAt))
      : null

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-emerald-900">
            {invitation.storeName}
          </h3>
          <p className="mt-0.5 text-xs text-emerald-700">เชิญโดย {invitation.inviterName}</p>
        </div>
        {invitation.role && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            {invitation.role}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-700">
        <Mail className="h-3.5 w-3.5" />
        <span className="truncate">{invitation.inviteeEmail}</span>
        {formattedDate && (
          <>
            <span className="h-1 w-1 rounded-full bg-emerald-300" />
            <span>{formattedDate}</span>
          </>
        )}
      </div>

      {invitation.message && (
        <p className="mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
          {invitation.message}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
          ตอบรับ
        </Button>
        <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          ปฏิเสธ
        </Button>
      </div>
    </div>
  )
}
