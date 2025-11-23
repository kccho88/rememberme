'use client'

import Link from 'next/link'
import { Heart, MessageCircle, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Memory, toggleLike, getCurrentUserId } from '@/lib/db'
import { useState } from 'react'

interface MemoryThumbnailProps {
  memory: Memory
  onLikeToggle?: () => void
}

export function MemoryThumbnail({ memory, onLikeToggle }: MemoryThumbnailProps) {
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

  const renderThumbnail = () => {
    if (memory.type === 'image' && memory.mediaUrl) {
      return (
        <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl">
          <img
            src={memory.mediaUrl}
            alt={memory.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <p className="text-sm font-semibold line-clamp-1">{memory.title}</p>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-warm-orange/20 to-warm-pink/20 rounded-t-2xl flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center px-2">{memory.title}</p>
      </div>
    )
  }

  return (
    <Link href={`/memory/${memory.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {renderThumbnail()}
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(memory.date)}</span>
            </div>
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

