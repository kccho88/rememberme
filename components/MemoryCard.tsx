'use client'

import Link from 'next/link'
import { Heart, MessageCircle, Calendar, User, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Memory, toggleLike, getCurrentUserId, addComment, getFamilyMembers } from '@/lib/db'
import { useState } from 'react'

interface MemoryCardProps {
  memory: Memory
  onLikeToggle?: () => void
  onCommentAdd?: () => void
}

export function MemoryCard({ memory, onLikeToggle, onCommentAdd }: MemoryCardProps) {
  const [isLiked, setIsLiked] = useState(
    memory.likes.includes(getCurrentUserId())
  )
  const [likeCount, setLikeCount] = useState(memory.likes.length)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [currentMemory, setCurrentMemory] = useState(memory)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentUserId = getCurrentUserId()
  const currentUser = getFamilyMembers().find((m) => m.id === currentUserId) || {
    id: currentUserId,
    name: '사용자',
    relationship: '',
  }

  const handleLike = () => {
    const updated = toggleLike(currentMemory.id, getCurrentUserId())
    if (updated) {
      setCurrentMemory(updated)
      setIsLiked(updated.likes.includes(getCurrentUserId()))
      setLikeCount(updated.likes.length)
      onLikeToggle?.()
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const updated = addComment(currentMemory.id, {
        authorId: currentUserId,
        authorName: currentUser.name,
        content: commentText.trim(),
      })

      if (updated) {
        setCurrentMemory(updated)
        setCommentText('')
        setShowComments(true)
        onCommentAdd?.()
      }
    } catch (error) {
      console.error('Comment error:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderMedia = () => {
    switch (memory.type) {
      case 'image':
        return memory.mediaUrl ? (
          <div className="w-full h-64 rounded-2xl overflow-hidden mb-4">
            <img
              src={memory.mediaUrl}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null
      case 'video':
        return memory.mediaUrl ? (
          <div className="w-full mb-4 rounded-2xl overflow-hidden">
            <video
              src={memory.mediaUrl}
              controls
              className="w-full h-64 object-cover"
            />
          </div>
        ) : null
      case 'audio':
        return memory.mediaUrl ? (
          <div className="w-full mb-4 p-4 bg-warm-orange/10 rounded-2xl">
            <audio src={memory.mediaUrl} controls className="w-full" />
          </div>
        ) : null
      default:
        return null
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-4 mb-2">
          <Avatar>
            <AvatarImage src={undefined} />
            <AvatarFallback>{memory.authorName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-warm-orange" />
              <span className="font-semibold">{memory.authorName}</span>
            </div>
            <div className="flex items-center gap-2 text-base text-gray-500 mt-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(memory.date)}</span>
            </div>
          </div>
        </div>
        <CardTitle className="text-2xl mt-4">{memory.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderMedia()}
        <p className="text-lg mb-4 whitespace-pre-wrap">{memory.content}</p>
        
        {memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-warm-pink/20 text-warm-pink-dark rounded-full text-base"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={isLiked ? 'text-warm-pink' : ''}
          >
            <Heart
              className={`w-6 h-6 mr-2 ${isLiked ? 'fill-current' : ''}`}
            />
            <span className="text-lg">{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-6 h-6 mr-2" />
            <span className="text-lg">{currentMemory.comments.length}</span>
          </Button>
          <Link href={`/memory/${currentMemory.id}`}>
            <Button variant="ghost" size="sm">
              상세보기
            </Button>
          </Link>
        </div>

        {/* 댓글 섹션 */}
        {showComments && (
          <div className="pt-4 border-t mt-4 space-y-4">
            {/* 댓글 작성 폼 */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={undefined} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="h-12"
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" size="icon" className="h-12 w-12" disabled={isSubmitting}>
                <Send className="w-5 h-5" />
              </Button>
            </form>

            {/* 댓글 목록 */}
            {currentMemory.comments.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {currentMemory.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-sm">
                        {comment.authorName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-base text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

