"use client"

// Skip static prerendering to avoid build-time context issues
export const dynamic = "force-dynamic"
export const revalidate = 0

// Keep this component dependency-free to avoid context issues during global error rendering
// This component must not use any React context or hooks that depend on providers
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Use inline event handlers to avoid any hook dependencies
  const handleReset = () => {
    try {
      if (typeof reset === "function") {
        reset()
      }
    } catch (e) {
      // Fallback: reload the page
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }
  }

  const handleGoHome = () => {
    try {
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
    } catch (e) {
      // Silently fail if window is not available
    }
  }

  // Safely get error message
  const errorMessage = error?.message || error?.toString() || "An unknown error occurred"

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Kaset Fair</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ecfdf3, #d5f5ee)",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            borderRadius: 24,
            background: "#fff",
            boxShadow: "0 20px 70px rgba(16, 185, 129, 0.15)",
            border: "1px solid #e2f4ea",
            padding: 24,
          }}
        >
          <p style={{ margin: "0 0 6px", color: "#047857", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
            SOMETHING WENT WRONG
          </p>
          <h1 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: 24 }}>We couldn&apos;t load this page</h1>
          <p style={{ margin: "0 0 12px", color: "#334155", fontSize: 14, lineHeight: 1.5 }}>
            An unexpected error occurred while rendering this page. You can try again or go back to the homepage.
          </p>
          {errorMessage ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#ecfdf3",
                border: "1px solid #d1fae5",
                color: "#065f46",
                borderRadius: 12,
                padding: 12,
                fontSize: 12,
                margin: "0 0 14px",
              }}
            >
              {errorMessage}
            </pre>
          ) : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: "10px 16px",
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleGoHome}
              style={{
                padding: "10px 16px",
                background: "#fff",
                color: "#065f46",
                border: "1px solid #d1fae5",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
