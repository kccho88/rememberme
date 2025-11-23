// 간단한 로컬 스토리지 기반 데이터베이스
// 프로덕션에서는 Supabase나 다른 DB로 교체 가능

export interface Memory {
  id: string
  title: string
  content: string
  date: string
  tags: string[]
  type: 'text' | 'image' | 'audio' | 'video'
  mediaUrl?: string
  authorId: string
  authorName: string
  createdAt: string
  likes: string[] // 사용자 ID 배열
  comments: Comment[]
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  avatar?: string
}

// 로컬 스토리지 키
const MEMORIES_KEY = 'rememberme_memories'
const FAMILY_KEY = 'rememberme_family'
const CURRENT_USER_KEY = 'rememberme_current_user'

// 초기 데이터 설정
const defaultFamily: FamilyMember[] = [
  { id: '1', name: '할머니', relationship: '본인' },
  { id: '2', name: '아들', relationship: '자녀' },
  { id: '3', name: '딸', relationship: '자녀' },
]

// 메모리 데이터 관리
export function getMemories(): Memory[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(MEMORIES_KEY)
  return data ? JSON.parse(data) : []
}

export function saveMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'likes' | 'comments'>): Memory {
  if (typeof window === 'undefined') {
    throw new Error('saveMemory can only be called on the client side')
  }
  
  try {
    const memories = getMemories()
    const newMemory: Memory = {
      ...memory,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    }
    
    // mediaUrl이 빈 문자열이거나 null인 경우 undefined로 처리
    if (newMemory.mediaUrl === '' || newMemory.mediaUrl === null) {
      newMemory.mediaUrl = undefined
    }
    
    memories.push(newMemory)
    
    // JSON 직렬화 테스트
    const testString = JSON.stringify(memories)
    if (!testString) {
      throw new Error('데이터를 직렬화할 수 없습니다.')
    }
    
    localStorage.setItem(MEMORIES_KEY, testString)
    return newMemory
  } catch (error) {
    console.error('saveMemory error:', error)
    // localStorage 용량 초과 등의 경우
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('저장 공간이 부족합니다. 이미지 크기를 줄이거나 다른 이미지를 선택해주세요.')
    }
    // JSON 직렬화 오류
    if (error instanceof TypeError) {
      throw new Error('데이터 형식 오류가 발생했습니다. 미디어 파일이 손상되었을 수 있습니다.')
    }
    // 기타 오류
    throw new Error(error instanceof Error ? error.message : '추억을 저장하는 중 오류가 발생했습니다.')
  }
}

export function getMemoryById(id: string): Memory | undefined {
  const memories = getMemories()
  return memories.find(m => m.id === id)
}

export function updateMemory(id: string, updates: Partial<Memory>): Memory | null {
  if (typeof window === 'undefined') return null
  const memories = getMemories()
  const index = memories.findIndex(m => m.id === id)
  if (index === -1) return null
  
  memories[index] = { ...memories[index], ...updates }
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories))
  return memories[index]
}

export function deleteMemory(id: string): boolean {
  if (typeof window === 'undefined') return false
  const memories = getMemories()
  const filtered = memories.filter(m => m.id !== id)
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(filtered))
  return filtered.length < memories.length
}

// 좋아요 관리
export function toggleLike(memoryId: string, userId: string): Memory | null {
  const memory = getMemoryById(memoryId)
  if (!memory) return null
  
  const likes = memory.likes.includes(userId)
    ? memory.likes.filter(id => id !== userId)
    : [...memory.likes, userId]
  
  return updateMemory(memoryId, { likes })
}

// 댓글 관리
export function addComment(memoryId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Memory | null {
  const memory = getMemoryById(memoryId)
  if (!memory) return null
  
  const newComment: Comment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  
  return updateMemory(memoryId, {
    comments: [...memory.comments, newComment]
  })
}

// 가족 구성원 관리
export function getFamilyMembers(): FamilyMember[] {
  if (typeof window === 'undefined') return defaultFamily
  const data = localStorage.getItem(FAMILY_KEY)
  return data ? JSON.parse(data) : defaultFamily
}

export function saveFamilyMember(member: Omit<FamilyMember, 'id'>): FamilyMember {
  if (typeof window === 'undefined') {
    throw new Error('saveFamilyMember can only be called on the client side')
  }
  
  try {
    const members = getFamilyMembers()
    const newMember: FamilyMember = {
      ...member,
      id: Date.now().toString(),
    }
    
    // avatar가 빈 문자열이거나 null인 경우 undefined로 처리
    if (newMember.avatar === '' || newMember.avatar === null) {
      newMember.avatar = undefined
    }
    
    members.push(newMember)
    
    // JSON 직렬화 테스트
    const testString = JSON.stringify(members)
    if (!testString) {
      throw new Error('데이터를 직렬화할 수 없습니다.')
    }
    
    localStorage.setItem(FAMILY_KEY, testString)
    return newMember
  } catch (error) {
    console.error('saveFamilyMember error:', error)
    // localStorage 용량 초과 등의 경우
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('저장 공간이 부족합니다. 이미지 크기를 줄이거나 다른 이미지를 선택해주세요.')
    }
    // JSON 직렬화 오류
    if (error instanceof TypeError) {
      throw new Error('데이터 형식 오류가 발생했습니다. 이미지 파일이 손상되었을 수 있습니다.')
    }
    // 기타 오류
    throw new Error(error instanceof Error ? error.message : '가족 구성원을 추가하는 중 오류가 발생했습니다.')
  }
}

export function updateFamilyMember(id: string, updates: Partial<FamilyMember>): FamilyMember | null {
  if (typeof window === 'undefined') return null
  
  try {
    const members = getFamilyMembers()
    const index = members.findIndex(m => m.id === id)
    if (index === -1) {
      console.error('Family member not found:', id)
      return null
    }
    
    // avatar가 빈 문자열이거나 null인 경우 undefined로 처리
    const cleanUpdates = { ...updates }
    if ('avatar' in cleanUpdates) {
      if (cleanUpdates.avatar === '' || cleanUpdates.avatar === null) {
        cleanUpdates.avatar = undefined
      }
    }
    
    // 업데이트 적용
    const updatedMember = { ...members[index], ...cleanUpdates }
    members[index] = updatedMember
    
    // JSON 직렬화 테스트
    const testString = JSON.stringify(members)
    if (!testString) {
      throw new Error('데이터를 직렬화할 수 없습니다.')
    }
    
    // localStorage에 저장
    localStorage.setItem(FAMILY_KEY, testString)
    return updatedMember
  } catch (error) {
    console.error('updateFamilyMember error:', error)
    // localStorage 용량 초과 등의 경우
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('저장 공간이 부족합니다. 이미지 크기를 줄이거나 다른 이미지를 선택해주세요.')
    }
    // JSON 직렬화 오류
    if (error instanceof TypeError) {
      throw new Error('데이터 형식 오류가 발생했습니다. 이미지 파일이 손상되었을 수 있습니다.')
    }
    // 기타 오류
    throw new Error(error instanceof Error ? error.message : '가족 구성원 정보를 저장하는 중 오류가 발생했습니다.')
  }
}

export function deleteFamilyMember(id: string): boolean {
  if (typeof window === 'undefined') return false
  const members = getFamilyMembers()
  const filtered = members.filter(m => m.id !== id)
  localStorage.setItem(FAMILY_KEY, JSON.stringify(filtered))
  return filtered.length < members.length
}

export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return '1'
  const userId = localStorage.getItem(CURRENT_USER_KEY)
  return userId || '1'
}

export function setCurrentUserId(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_USER_KEY, userId)
}

