import { http } from "@/lib/http"
import { AxiosError } from "axios";
import { NisitInfo } from "./dto/nisitInfo.dto";

export type RegisterPayload = {
  firstName: string
  lastName: string
  nisitId: string
  phone: string
  nisitCardLink: string | null
}

export type RegisterResponse = {
  id: string
  profileComplete: boolean
  // เพิ่ม field อื่น ๆ ตาม backend
}

function isAxiosError(err: unknown): err is AxiosError {
  return !!(err as AxiosError)?.isAxiosError;
}

export function extractErrorMessage(
  error: unknown,
  fallback: string = "Unexpected error"
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function createNisitInfo(payload: RegisterPayload) {
    try {
        const res = await http.post("/api/nisit/register", payload)

        // console.log(res)

        if (res.status === 201 || res.status === 200) return res.data
        
        throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
    } catch (error) {
      console.error(error)
        // throw new Error(extractErrorMessage(error, "Failed to create order"))
    }
}

export async function getNisitInfo(payload: RegisterPayload) {
    try {
        const res = await http.post("/api/nisit/info", payload)

        // console.log(res)

        if (res.status === 201 || res.status === 200) return res.data
        
        throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
    } catch (error) {
      console.error(error)
        // throw new Error(extractErrorMessage(error, "Failed to create order"))
    }
}