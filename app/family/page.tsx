'use client'

import { useEffect, useState, useRef } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getFamilyMembers,
  saveFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  FamilyMember,
  setCurrentUserId,
  getCurrentUserId,
} from '@/lib/db'
import { Users, Plus, User, Edit2, Trash2, Camera, X, Settings, Sparkles } from 'lucide-react'
import { getApiKey, setApiKey, hasApiKey } from '@/lib/ai'

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [newName, setNewName] = useState('')
  const [newRelationship, setNewRelationship] = useState('')
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined)
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRelationship, setEditRelationship] = useState('')
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [apiKey, setApiKeyValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const newFileInputRef = useRef<HTMLInputElement>(null)
  const currentUserId = getCurrentUserId()

  useEffect(() => {
    loadMembers()
    // API 키 불러오기
    const savedApiKey = getApiKey()
    if (savedApiKey) {
      setApiKeyValue(savedApiKey)
    }
  }, [])

  const loadMembers = () => {
    const allMembers = getFamilyMembers()
    setMembers(allMembers)
  }

  const handleAddMember = async () => {
    if (!newName.trim() || !newRelationship.trim()) {
      alert('이름과 관계를 입력해주세요.')
      return
    }

    try {
      let avatarToSave = newAvatar
      // 이미지가 너무 크면 압축
      if (newAvatar && newAvatar.length > 500000) { // 약 500KB 이상이면 압축
        avatarToSave = await compressImage(newAvatar)
      }

      saveFamilyMember({
        name: newName.trim(),
        relationship: newRelationship.trim(),
        avatar: avatarToSave,
      })

      setNewName('')
      setNewRelationship('')
      setNewAvatar(undefined)
      setNewAvatarPreview(null)
      setIsAdding(false)
      loadMembers()
    } catch (error) {
      console.error('Add member error:', error)
      const errorMessage = error instanceof Error ? error.message : '가족 구성원 추가 중 오류가 발생했습니다.'
      alert(errorMessage)
    }
  }

  const handleSelectUser = (userId: string) => {
    setCurrentUserId(userId)
    alert('사용자가 변경되었습니다.')
    loadMembers()
  }

  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member)
    setEditName(member.name)
    setEditRelationship(member.relationship)
    setEditAvatar(member.avatar)
    setAvatarPreview(member.avatar || null)
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    if (!editingMember || !editName.trim() || !editRelationship.trim()) {
      alert('이름과 관계를 입력해주세요.')
      return
    }

    try {
      const updates: Partial<FamilyMember> = {
        name: editName.trim(),
        relationship: editRelationship.trim(),
      }

      // avatar가 변경된 경우에만 업데이트
      // editAvatar가 undefined가 아니고, 원본과 다른 경우에만 업데이트
      if (editAvatar !== undefined && editAvatar !== editingMember.avatar) {
        // 이미지가 너무 크면 압축
        let avatarToSave = editAvatar
        if (editAvatar && editAvatar.length > 500000) { // 약 500KB 이상이면 압축
          avatarToSave = await compressImage(editAvatar)
        }
        updates.avatar = avatarToSave || undefined
      }

      const updated = updateFamilyMember(editingMember.id, updates)

      if (updated) {
        setIsEditing(false)
        setEditingMember(null)
        setEditName('')
        setEditRelationship('')
        setEditAvatar(undefined)
        setAvatarPreview(null)
        loadMembers()
      } else {
        alert('가족 구성원 정보를 저장하는 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Save error:', error)
      const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
      alert(errorMessage)
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
        
        // 최대 크기 800x800으로 제한
        const maxSize = 800
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
        
        // JPEG 품질 0.8로 압축
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        resolve(compressed)
      }
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'))
      }
      img.src = base64
    })
  }

  const handleDelete = (memberId: string) => {
    if (confirm('정말 이 가족 구성원을 삭제하시겠습니까?')) {
      if (memberId === currentUserId) {
        alert('현재 사용 중인 계정은 삭제할 수 없습니다.')
        return
      }
      deleteFamilyMember(memberId)
      loadMembers()
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = true) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일 크기는 5MB 이하여야 합니다.')
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      alert('이미지를 읽는 중 오류가 발생했습니다.')
    }
    reader.onloadend = () => {
      try {
        const base64 = reader.result as string
        if (base64) {
          if (isEdit) {
            setEditAvatar(base64)
            setAvatarPreview(base64)
          } else {
            setNewAvatar(base64)
            setNewAvatarPreview(base64)
          }
        }
      } catch (error) {
        console.error('Avatar change error:', error)
        alert('이미지 처리 중 오류가 발생했습니다.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleNewAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAvatarChange(e, false)
  }

  const handleRemoveNewAvatar = () => {
    setNewAvatar(undefined)
    setNewAvatarPreview(null)
    if (newFileInputRef.current) {
      newFileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = () => {
    setEditAvatar(undefined)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleApiKeySave = () => {
    if (!apiKey.trim()) {
      alert('API 키를 입력해주세요.')
      return
    }
    setApiKey(apiKey.trim())
    setIsApiKeyDialogOpen(false)
    alert('AI API 키가 저장되었습니다. 이제 AI 기능을 사용할 수 있습니다.')
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b-2 border-warm-orange/20 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-warm-orange flex items-center gap-3">
            <Users className="w-8 h-8" />
            가족 구성원
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* 현재 사용자 표시 */}
        <Card className="mb-6 bg-warm-orange/10 border-warm-orange">
          <CardHeader>
            <CardTitle className="text-xl">현재 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            {members
              .filter((m) => m.id === currentUserId)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl"
                >
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-2xl">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xl font-semibold">{member.name}</p>
                    <p className="text-lg text-gray-600">{member.relationship}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* AI API 키 설정 */}
        <Card className="mb-6 border-2 border-warm-pink/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-warm-pink" />
                AI 감성 내용 생성 설정
              </CardTitle>
              <Button
                onClick={() => setIsApiKeyDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="w-5 h-5 mr-2" />
                {hasApiKey() ? 'API 키 변경' : 'API 키 설정'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base text-gray-600 mb-2">
              {hasApiKey() 
                ? '✅ AI API 키가 설정되어 있습니다. 추억 등록 시 AI가 감성적인 내용을 자동으로 작성해드립니다.'
                : 'AI 기능을 사용하려면 OpenAI API 키를 설정해주세요. 한 번 설정하면 모든 가족 구성원이 사용할 수 있습니다.'}
            </p>
            <p className="text-sm text-gray-500">
              OpenAI API 키는 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-warm-orange underline">여기</a>에서 발급받을 수 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* 가족 구성원 목록 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">가족 목록</h2>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              추가
            </Button>
          </div>

          {isAdding && (
            <Card className="mb-4 border-2 border-warm-pink">
              <CardHeader>
                <CardTitle className="text-xl">새 가족 구성원 추가</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 프로필 사진 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={newAvatarPreview || undefined} />
                      <AvatarFallback className="text-3xl">
                        {newName[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {newAvatarPreview && (
                      <button
                        onClick={handleRemoveNewAvatar}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <input
                      ref={newFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleNewAvatarChange}
                      className="hidden"
                      id="new-avatar-upload"
                    />
                    <Label htmlFor="new-avatar-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => newFileInputRef.current?.click()}
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        {newAvatarPreview ? '사진 변경' : '사진 추가'}
                      </Button>
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name" className="text-lg mb-2 block">
                    이름
                  </Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship" className="text-lg mb-2 block">
                    관계
                  </Label>
                  <Input
                    id="relationship"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    placeholder="예: 자녀, 손자, 손녀"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddMember} className="flex-1">
                    추가하기
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAdding(false)
                      setNewName('')
                      setNewRelationship('')
                      setNewAvatar(undefined)
                      setNewAvatarPreview(null)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-warm-orange/30 mx-auto mb-4" />
                <p className="text-xl text-gray-500">가족 구성원이 없습니다</p>
              </div>
            ) : (
              members.map((member) => (
                <Card
                  key={member.id}
                  className={`transition-all hover:shadow-lg ${
                    member.id === currentUserId
                      ? 'border-2 border-warm-orange bg-warm-orange/5'
                      : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xl">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-semibold">{member.name}</p>
                          {member.id === currentUserId && (
                            <span className="px-2 py-1 bg-warm-orange text-white text-sm rounded-full">
                              현재
                            </span>
                          )}
                        </div>
                        <p className="text-lg text-gray-600">
                          {member.relationship}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(member)}
                          className="h-12 w-12"
                        >
                          <Edit2 className="w-5 h-5 text-warm-orange" />
                        </Button>
                        {member.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(member.id)}
                            className="h-12 w-12 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                        {member.id !== currentUserId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectUser(member.id)}
                          >
                            선택
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">가족 구성원 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 프로필 사진 */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-3xl">
                    {editName[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label htmlFor="avatar-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {avatarPreview ? '사진 변경' : '사진 추가'}
                  </Button>
                </Label>
              </div>
            </div>

            {/* 이름 */}
            <div>
              <Label htmlFor="edit-name" className="text-lg mb-2 block">
                이름
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </div>

            {/* 관계 */}
            <div>
              <Label htmlFor="edit-relationship" className="text-lg mb-2 block">
                관계
              </Label>
              <Input
                id="edit-relationship"
                value={editRelationship}
                onChange={(e) => setEditRelationship(e.target.value)}
                placeholder="예: 자녀, 손자, 손녀"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditingMember(null)
                setEditName('')
                setEditRelationship('')
                setEditAvatar(undefined)
                setAvatarPreview(null)
              }}
            >
              취소
            </Button>
            <Button onClick={handleEditSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API 키 설정 다이얼로그 */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-warm-pink" />
              AI API 키 설정
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="api-key" className="text-lg mb-2 block">
                OpenAI API 키
              </Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="sk-..."
                className="font-mono"
              />
              <p className="text-sm text-gray-500 mt-2">
                API 키는 안전하게 저장되며, 모든 가족 구성원이 사용할 수 있습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApiKeyDialogOpen(false)
                setApiKeyValue(getApiKey() || '')
              }}
            >
              취소
            </Button>
            <Button onClick={handleApiKeySave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}
