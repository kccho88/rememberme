'use client'

import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Memory, toggleLike, getCurrentUserId } from '@/lib/db'
import { useState } from 'react'

interface MemoryGridProps {
  memory: Memory
  onLikeToggle?: () => void
}

export function MemoryGrid({ memory, onLikeToggle }: MemoryGridProps) {
  const [isLiked, setIsLiked] = useState(
    memory.likes.includes(getCurrentUserId())
  )
  const [likeCount, setLikeCount] = useState(memory.likes.length)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = toggleLike(memory.id, getCurrentUserId())
    if (updated) {
      setIsLiked(updated.likes.includes(getCurrentUserId()))
      setLikeCount(updated.likes.length)
      onLikeToggle?.()
    }
  }

  const renderMedia = () => {
    if (memory.type === 'image' && memory.mediaUrl) {
      return (
        <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
          <img
            src={memory.mediaUrl}
            alt={memory.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="text-base font-semibold mb-1 line-clamp-1">{memory.title}</h3>
              <p className="text-xs text-white/80 line-clamp-2">{memory.content}</p>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-warm-orange/20 to-warm-pink/20 rounded-2xl flex flex-col items-center justify-center p-4">
        <h3 className="text-base font-semibold mb-2 text-center">{memory.title}</h3>
        <p className="text-sm text-gray-600 text-center line-clamp-3">{memory.content}</p>
      </div>
    )
  }

  return (
    <Link href={`/memory/${memory.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          {renderMedia()}
          <div className="p-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatDate(memory.date)}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`h-8 px-2 ${isLiked ? 'text-warm-pink' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs ml-1">{likeCount}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs ml-1">{memory.comments.length}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

