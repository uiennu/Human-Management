import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
// <CHANGE> Added sidebar layout for employee portal
import SidebarLayout from "@/components/sidebar-layout"
import { AuthProvider } from "@/lib/hooks/use-auth"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LeaveFlow - Employee Portal",
  description: "Professional leave management system for employees",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <SidebarLayout>{children}</SidebarLayout>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
