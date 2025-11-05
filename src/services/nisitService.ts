import { http } from "@/lib/http"
import { AxiosError } from "axios";
import { NisitInfo } from "./dto/nisit-info.dto";
import { UpdateNisitInfoPayload } from "./dto/nisit-info.dto";

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

export async function createNisitInfo(payload: NisitInfo) {
  try {
    const res = await http.post("/api/nisit/register", payload)

    if (res.status === 201 || res.status === 200) return res.data
    
    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    console.error(error)
  }
}

export async function updateNisitInfo(payload: UpdateNisitInfoPayload) {
  try {
    const res = await http.patch("/api/nisit/info", payload)

    if (res.status === 201 || res.status === 200) return res.data
    
    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    console.error(error)
  }

}

export async function getNisitInfo() {
    try {
      const res = await http.get("/api/nisit/info")

      if (res.status === 201 || res.status === 200) return res.data
      
      throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
    } catch (error) {
      console.error(error)
    }
}