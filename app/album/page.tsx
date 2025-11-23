'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { getMemories, Memory } from '@/lib/db'
import { Camera, Video, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AlbumPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = () => {
    const allMemories = getMemories()
    const sorted = allMemories.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    setMemories(sorted)
  }

  const filteredMemories = memories.filter((m) => {
    if (filter === 'all') return m.type === 'image' || m.type === 'video'
    if (filter === 'image') return m.type === 'image'
    if (filter === 'video') return m.type === 'video'
    return false
  })

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b-2 border-warm-orange/20 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-warm-orange flex items-center gap-3">
            <Camera className="w-8 h-8" />
            앨범
          </h1>
        </div>
      </header>

      {/* 필터 */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-warm-orange text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-4 py-2 rounded-full text-lg font-medium transition-colors ${
              filter === 'image'
                ? 'bg-warm-pink text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            사진
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-4 py-2 rounded-full text-lg font-medium transition-colors ${
              filter === 'video'
                ? 'bg-warm-pink text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            영상
          </button>
        </div>
      </div>

      <main className="container mx-auto px-6 py-6">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="w-20 h-20 text-warm-orange/30 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">
              {filter === 'all'
                ? '등록된 사진이나 영상이 없습니다'
                : filter === 'image'
                ? '등록된 사진이 없습니다'
                : '등록된 영상이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMemories.map((memory) => (
              <Link
                key={memory.id}
                href={`/memory/${memory.id}`}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                {memory.type === 'image' && memory.mediaUrl ? (
                  <img
                    src={memory.mediaUrl}
                    alt={memory.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : memory.type === 'video' && memory.mediaUrl ? (
                  <div className="relative w-full h-full">
                    <video
                      src={memory.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Video className="w-12 h-12 text-white" />
                    </div>
                  </div>
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                      {memory.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(memory.date)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

