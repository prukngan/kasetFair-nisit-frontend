
import axios from "axios"

export const http = axios.create({
  baseURL:
    typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.status === 401 || error.status === 403) {
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);