"use client"

import { useEffect } from "react"
import { initializeSeedData } from "@/lib/storage/seed-loader"

export function SeedInitializer() {
  useEffect(() => {
    initializeSeedData().catch((error) => {
      console.warn("Failed to initialize seed data:", error)
    })
  }, [])

  return null
}
