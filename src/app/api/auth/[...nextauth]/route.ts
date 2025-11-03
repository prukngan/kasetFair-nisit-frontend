import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const API_URL = process.env.API_URL || "http://localhost:8000"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // ครั้งแรกหลัง login เสร็จ (เอา id_token ไว้ให้ client ใช้)
      if (account?.id_token) token.id_token = account.id_token
      return token
    },
    async session({ session, token }) {
      // ให้ session ถือ id_token ไปใช้ fetch /auth/exchange เองที่ฝั่ง client
      (session as any).id_token = token.id_token
      return session
    },
  },
  debug: process.env.NODE_ENV === "development", // ให้แสดง log แค่ตอน dev
}


// export const authOptions: NextAuthOptions = {
//   session: { strategy: "jwt" },
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, account }) {
//       if (account?.id_token) {
//         try {
//           const res = await fetch(`${API_URL}/auth/exchange`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ id_token: account.id_token }),
//             cache: "no-store",
//             credentials: "include",   // <— สำคัญมาก
//             mode: "cors",
//           })

//           const data = res.ok ? await res.json().catch(() => ({})) : {}

//           ;(token as any).profileComplete = data?.profileComplete ?? null
//           ;(token as any).missing = Array.isArray(data?.missing) ? data.missing : null
//           ;(token as any).user = typeof data?.user === "object" ? data.user : undefined
//           ;(token as any).role = typeof data?.role === "string" ? data.role : undefined

//           return token
//         } catch (error) {
//           console.error("auth/exchange failed:", error)
//         }
//       }

//       return token
//     },

//     async session({ session, token }) {
//       // ไม่ต้องมี session.accessToken แล้ว
//       session.profileComplete = (token as any).profileComplete ?? null
//       session.missing = ((token as any).missing as string[] | null) ?? null
//       if (session.user && (token as any).user) {
//         session.user = { ...session.user, ...(token as any).user }
//       }
//       if ((token as any).role && session.user) {
//         ;(session.user as any).role = (token as any).role
//       }
//       return session
//     },
//   },

//   debug: process.env.NODE_ENV === "production",
// }

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
