import { http } from "@/lib/http"
import { AxiosError } from "axios";

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

export type ExchangeResponseDto = {
  message: string;
  user: { email: string; profileComplete: boolean };
};

export async function exchangeWithGoogleIdToken(idToken: string) {
  const { data } = await http.post<ExchangeResponseDto>("/auth/exchange", {
    id_token: idToken,
  });
  return data;
}
