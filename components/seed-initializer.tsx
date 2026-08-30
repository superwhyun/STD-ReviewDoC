"use client"

import { useEffect } from "react"
import { initializeSeedData } from "@/lib/storage/seed-loader"
import { migrateLegacyApiKey } from "@/lib/storage/local-storage"

export function SeedInitializer() {
  useEffect(() => {
    migrateLegacyApiKey()
    initializeSeedData().catch((error) => {
      console.warn("Failed to initialize seed data:", error)
    })
  }, [])

  return null
}
