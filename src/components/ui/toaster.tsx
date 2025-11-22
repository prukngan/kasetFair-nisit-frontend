"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"  // เด้งแบบมือถือ
      expand                      // auto stack
      closeButton                 // ให้ user ปิดเองได้
      offset={24}                 // เลี่ยง bottom bar ของมือถือ
      richColors                  // สีสวยแบบ mobile app
      toastOptions={{
        className:
          "max-w-[90vw] rounded-xl px-4 py-3 shadow-lg border border-black/10",
        style: {
          fontSize: "16px",        // ขนาดตัวอักษรเหมาะกับนิ้วจิ้ม
          lineHeight: "1.4",
        },
      }}
    />
  )
}
