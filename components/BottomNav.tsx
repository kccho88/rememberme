'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/timeline', icon: Home, label: '타임라인' },
    { href: '/album', icon: Camera, label: '앨범' },
    { href: '/family', icon: Users, label: '가족' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-warm-orange/20 z-50">
      <div className="flex items-center justify-around h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-2xl transition-colors",
                isActive
                  ? "text-warm-orange"
                  : "text-gray-500 hover:text-warm-orange"
              )}
            >
              <Icon className="w-8 h-8" />
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          )
        })}
        <Link
          href="/memory/new"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-warm-orange text-white shadow-lg hover:bg-warm-orange-dark transition-colors"
        >
          <Plus className="w-8 h-8" />
        </Link>
      </div>
    </nav>
  )
}

