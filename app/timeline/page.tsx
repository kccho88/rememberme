'use client'

import { useEffect, useState } from 'react'
import { MemoryCard } from '@/components/MemoryCard'
import { MemoryThumbnail } from '@/components/MemoryThumbnail'
import { MemoryGrid } from '@/components/MemoryGrid'
import { BottomNav } from '@/components/BottomNav'
import { getMemories, Memory } from '@/lib/db'
import { Heart, List, Grid, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewMode = 'list' | 'thumbnail' | 'grid'

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    loadMemories()
    // 로컬 스토리지에서 뷰 모드 불러오기
    const savedViewMode = localStorage.getItem('timeline_view_mode') as ViewMode
    if (savedViewMode && ['list', 'thumbnail', 'grid'].includes(savedViewMode)) {
      setViewMode(savedViewMode)
    }
  }, [])

  const loadMemories = () => {
    const allMemories = getMemories()
    const sorted = allMemories.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    setMemories(sorted)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('timeline_view_mode', mode)
  }

  const allTags = Array.from(
    new Set(memories.flatMap((m) => m.tags))
  ).sort()

  const filteredMemories = selectedTag
    ? memories.filter((m) => m.tags.includes(selectedTag))
    : memories

  const renderMemories = () => {
    if (filteredMemories.length === 0) {
      return (
        <div className="text-center py-20">
          <Heart className="w-20 h-20 text-warm-orange/30 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            {selectedTag
              ? '해당 태그의 추억이 없습니다'
              : '아직 등록된 추억이 없습니다'}
          </p>
          <p className="text-lg text-gray-400">
            첫 번째 추억을 등록해보세요!
          </p>
        </div>
      )
    }

    switch (viewMode) {
      case 'thumbnail':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMemories.map((memory) => (
              <MemoryThumbnail
                key={memory.id}
                memory={memory}
                onLikeToggle={loadMemories}
              />
            ))}
          </div>
        )
      case 'grid':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMemories.map((memory) => (
              <MemoryGrid
                key={memory.id}
                memory={memory}
                onLikeToggle={loadMemories}
              />
            ))}
          </div>
        )
      case 'list':
      default:
        return (
          <div>
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onLikeToggle={loadMemories}
                onCommentAdd={loadMemories}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-white border-b-2 border-warm-orange/20 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-warm-orange flex items-center gap-3">
              <Heart className="w-8 h-8 fill-current" />
              추억 타임라인
            </h1>
            {/* 뷰 모드 선택 */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="h-10 w-10 p-0"
              >
                <List className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'thumbnail' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('thumbnail')}
                className="h-10 w-10 p-0"
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="h-10 w-10 p-0"
              >
                <Grid className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {renderMemories()}
      </main>

      {allTags.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t-2 border-warm-orange/20 z-30 pb-4">
          <div className="container mx-auto px-6 pt-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-lg font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-warm-orange text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                전체
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-lg font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-warm-pink text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
