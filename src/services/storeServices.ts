import { http } from "@/lib/http"
import { AxiosError } from "axios";
import { CreateStoreRequestDto } from "./dto/store-info.dto";

const STORE_ENDPOINT_API = "/api/store"

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

export async function createNisitInfo(payload: CreateStoreRequestDto) {
  try {
    const res = await http.post(`${STORE_ENDPOINT_API}/create`, payload)

    if (res.status === 201 || res.status === 200) return res.data
    
    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    console.error(error)
  }
}
