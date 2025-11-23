'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BottomNav } from '@/components/BottomNav'
import {
  getMemoryById,
  addComment,
  toggleLike,
  getCurrentUserId,
  getFamilyMembers,
  Memory,
} from '@/lib/db'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Calendar,
  User,
  Send,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function MemoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memoryId = params.id as string

  const [memory, setMemory] = useState<Memory | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const currentUserId = getCurrentUserId()
  const currentUser = getFamilyMembers().find((m) => m.id === currentUserId) || {
    id: currentUserId,
    name: '사용자',
    relationship: '',
  }

  useEffect(() => {
    const loadMemory = () => {
      const mem = getMemoryById(memoryId)
      if (mem) {
        setMemory(mem)
        setIsLiked(mem.likes.includes(currentUserId))
        setLikeCount(mem.likes.length)
      }
    }
    loadMemory()
  }, [memoryId, currentUserId])

  const handleLike = () => {
    if (!memory) return
    const updated = toggleLike(memory.id, currentUserId)
    if (updated) {
      setIsLiked(updated.likes.includes(currentUserId))
      setLikeCount(updated.likes.length)
      setMemory(updated)
    }
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!memory || !commentText.trim()) return

    const updated = addComment(memory.id, {
      authorId: currentUserId,
      authorName: currentUser.name,
      content: commentText.trim(),
    })

    if (updated) {
      setMemory(updated)
      setCommentText('')
    }
  }

  if (!memory) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-500">추억을 찾을 수 없습니다</p>
          <Link href="/timeline">
            <Button className="mt-4">타임라인으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  const renderMedia = () => {
    switch (memory.type) {
      case 'image':
        return memory.mediaUrl ? (
          <div className="w-full h-96 rounded-2xl overflow-hidden mb-6">
            <img
              src={memory.mediaUrl}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null
      case 'video':
        return memory.mediaUrl ? (
          <div className="w-full mb-6 rounded-2xl overflow-hidden">
            <video
              src={memory.mediaUrl}
              controls
              className="w-full h-96 object-cover"
            />
          </div>
        ) : null
      case 'audio':
        return memory.mediaUrl ? (
          <div className="w-full mb-6 p-6 bg-warm-orange/10 rounded-2xl">
            <audio src={memory.mediaUrl} controls className="w-full" />
          </div>
        ) : null
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b-2 border-warm-orange/20 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/timeline">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-warm-orange">추억 상세</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
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
            <CardTitle className="text-3xl mt-4">{memory.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMedia()}
            <p className="text-xl mb-6 whitespace-pre-wrap leading-relaxed">
              {memory.content}
            </p>

            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-warm-pink/20 text-warm-pink-dark rounded-full text-lg font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="lg"
                onClick={handleLike}
                className={isLiked ? 'text-warm-pink' : ''}
              >
                <Heart
                  className={`w-7 h-7 mr-2 ${isLiked ? 'fill-current' : ''}`}
                />
                <span className="text-xl">{likeCount}</span>
              </Button>
              <Button variant="ghost" size="lg">
                <MessageCircle className="w-7 h-7 mr-2" />
                <span className="text-xl">{memory.comments.length}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">댓글 ({memory.comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 댓글 작성 폼 */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <Button type="submit" size="icon" className="h-16 w-16">
                <Send className="w-6 h-6" />
              </Button>
            </form>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {memory.comments.length === 0 ? (
                <p className="text-lg text-gray-500 text-center py-8">
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                </p>
              ) : (
                memory.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                  >
                    <Avatar>
                      <AvatarImage src={undefined} />
                      <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">
                          {comment.authorName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-lg text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}

