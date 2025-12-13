"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface RequireRoleProps {
  children: ReactNode
  roles: string[]
  fallback?: ReactNode
}

export function RequireRole({ children, roles, fallback }: RequireRoleProps) {
  const { hasAnyRole, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!hasAnyRole(roles)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <p className="text-sm text-muted-foreground mt-2">Required roles: {roles.join(", ")}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
