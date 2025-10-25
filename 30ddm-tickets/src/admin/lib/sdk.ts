import Medusa from "@medusajs/js-sdk"

// Environment variable access that works in both Node.js and browser
const getEnvVar = (key: string, defaultValue: string = "") => {
  if (typeof window !== "undefined") {
    // Browser environment - try import.meta first, then fallback
    try {
      return (import.meta as any).env?.[key] || defaultValue
    } catch {
      return defaultValue
    }
  } else {
    // Node.js environment
    return process.env[key] || defaultValue
  }
}

export const sdk = new Medusa({
  baseUrl: getEnvVar("VITE_BACKEND_URL", "/"),
  debug: getEnvVar("NODE_ENV") === "development" || getEnvVar("DEV") === "true",
  auth: {
    type: "session",
  },
})