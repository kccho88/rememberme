'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BottomNav } from '@/components/BottomNav'
import { saveMemory, getCurrentUserId, getFamilyMembers } from '@/lib/db'
import { generateContentFromImage, generateContentFromText, hasApiKey } from '@/lib/ai'
import { ArrowLeft, Image as ImageIcon, Video, Mic, Type, Sparkles } from 'lucide-react'
import Link from 'next/link'

type MemoryType = 'text' | 'image' | 'audio' | 'video'

export default function NewMemoryPage() {
  const router = useRouter()
  const [type, setType] = useState<MemoryType>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tags, setTags] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const currentUser = getFamilyMembers().find(
    (m) => m.id === getCurrentUserId()
  ) || { id: getCurrentUserId(), name: '사용자', relationship: '' }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setMediaFile(file)

    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onerror = () => {
        alert('이미지를 읽는 중 오류가 발생했습니다.')
        setMediaFile(null)
        setMediaPreview(null)
      }
      reader.onloadend = () => {
        try {
          const result = reader.result as string
          if (result) {
            setMediaPreview(result)
          }
        } catch (error) {
          console.error('Image preview error:', error)
          alert('이미지 미리보기 중 오류가 발생했습니다.')
        }
      }
      reader.readAsDataURL(file)
    } else if (type === 'video' && file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onerror = () => {
        alert('영상을 읽는 중 오류가 발생했습니다.')
        setMediaFile(null)
        setMediaPreview(null)
      }
      reader.onloadend = () => {
        try {
          const result = reader.result as string
          if (result) {
            setMediaPreview(result)
          }
        } catch (error) {
          console.error('Video preview error:', error)
          alert('영상 미리보기 중 오류가 발생했습니다.')
        }
      }
      reader.readAsDataURL(file)
    } else {
      alert('지원하지 않는 파일 형식입니다.')
      setMediaFile(null)
      setMediaPreview(null)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioRecorderRef.current = recorder
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        setMediaFile(file)
        setMediaPreview(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('녹음 시작 실패:', error)
      alert('마이크 권한이 필요합니다.')
    }
  }

  const stopRecording = () => {
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // 이미지 압축 함수
  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // 최대 크기 1200x1200으로 제한
        const maxSize = 1200
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // JPEG 품질 0.85로 압축
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        resolve(compressed)
      }
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'))
      }
      img.src = base64
    })
  }

  // 파일을 base64로 변환하는 Promise 래퍼
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => {
        reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
      }
      reader.onloadend = () => {
        const result = reader.result as string
        if (result) {
          resolve(result)
        } else {
          reject(new Error('파일 읽기 결과가 없습니다.'))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleGenerateContent = async () => {
    if (!hasApiKey()) {
      alert('AI API 키가 설정되지 않았습니다. 가족 페이지에서 설정해주세요.')
      return
    }

    setIsGenerating(true)
    try {
      let generatedContent = ''

      if (type === 'image' && mediaPreview) {
        // 이미지에서 내용 생성
        generatedContent = await generateContentFromImage(mediaPreview, title || undefined)
      } else if (content.trim()) {
        // 텍스트 기반 내용 생성
        generatedContent = await generateContentFromText(content, title || undefined)
      } else {
        alert('사진을 업로드하거나 내용을 입력한 후 AI 기능을 사용해주세요.')
        setIsGenerating(false)
        return
      }

      setContent(generatedContent)
    } catch (error) {
      console.error('AI generation error:', error)
      alert(error instanceof Error ? error.message : 'AI 내용 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      let mediaUrl: string | undefined

      if (mediaFile) {
        try {
          // 파일을 base64로 변환
          let base64 = await fileToBase64(mediaFile)
          
          // 이미지인 경우 압축 (500KB 이상일 때)
          if (type === 'image' && base64.length > 500000) {
            base64 = await compressImage(base64)
          }
          
          mediaUrl = base64
        } catch (error) {
          console.error('Media processing error:', error)
          throw new Error('미디어 파일 처리 중 오류가 발생했습니다.')
        }
      }

      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      saveMemory({
        title: title.trim(),
        content: content.trim(),
        date,
        tags: tagArray,
        type,
        mediaUrl,
        authorId: currentUser.id,
        authorName: currentUser.name,
      })

      router.push('/timeline')
    } catch (error) {
      console.error('저장 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '추억 저장에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
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
            <h1 className="text-3xl font-bold text-warm-orange">
              새 추억 등록
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 타입 선택 */}
          <div>
            <Label className="text-xl mb-4 block">추억 유형</Label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'text' as MemoryType, icon: Type, label: '텍스트' },
                { type: 'image' as MemoryType, icon: ImageIcon, label: '사진' },
                { type: 'audio' as MemoryType, icon: Mic, label: '음성' },
                { type: 'video' as MemoryType, icon: Video, label: '영상' },
              ].map(({ type: t, icon: Icon, label }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setMediaFile(null)
                    setMediaPreview(null)
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-colors ${
                    type === t
                      ? 'border-warm-orange bg-warm-orange/10'
                      : 'border-gray-200 hover:border-warm-orange/50'
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-lg font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 미디어 업로드 */}
          {(type === 'image' || type === 'video') && (
            <div>
              <Label className="text-xl mb-4 block">
                {type === 'image' ? '사진' : '영상'} 업로드
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {type === 'image' ? '사진 선택' : '영상 선택'}
              </Button>
              {mediaPreview && (
                <div className="mt-4 w-full h-64 rounded-2xl overflow-hidden">
                  {type === 'image' ? (
                    <img
                      src={mediaPreview}
                      alt="미리보기"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {type === 'audio' && (
            <div>
              <Label className="text-xl mb-4 block">음성 녹음</Label>
              <div className="flex gap-4">
                {!isRecording ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startRecording}
                    className="flex-1"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    녹음 시작
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopRecording}
                    className="flex-1"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    녹음 중지
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  파일 선택
                </Button>
              </div>
              {mediaPreview && (
                <div className="mt-4 p-4 bg-warm-orange/10 rounded-2xl">
                  <audio src={mediaPreview} controls className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* 제목 */}
          <div>
            <Label htmlFor="title" className="text-xl mb-2 block">
              제목
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="추억의 제목을 입력하세요"
              required
            />
          </div>

          {/* 내용 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content" className="text-xl block">
                내용
              </Label>
              {hasApiKey() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || (!mediaPreview && !content.trim())}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? '생성 중...' : 'AI로 작성하기'}
                </Button>
              )}
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="추억에 대해 자세히 적어주세요"
              rows={8}
              required
            />
            {!hasApiKey() && (
              <p className="text-sm text-gray-500 mt-2">
                💡 AI 기능을 사용하려면 <Link href="/family" className="text-warm-orange underline">가족 페이지</Link>에서 API 키를 설정해주세요.
              </p>
            )}
          </div>

          {/* 날짜 */}
          <div>
            <Label htmlFor="date" className="text-xl mb-2 block">
              날짜
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* 태그 */}
          <div>
            <Label htmlFor="tags" className="text-xl mb-2 block">
              태그 (쉼표로 구분)
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: 가족, 여행, 생일"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '추억 저장하기'}
            </Button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}

