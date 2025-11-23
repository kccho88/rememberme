import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "추억 기록 플랫폼",
  description: "시니어를 위한 따뜻한 추억 기록 서비스",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-warm-orange/5 via-white to-warm-pink/5 pb-24">
          {children}
        </div>
      </body>
    </html>
  )
}

