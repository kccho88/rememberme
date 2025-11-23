// AI API 키 관리 및 내용 생성 기능

const AI_API_KEY_KEY = 'rememberme_ai_api_key'

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AI_API_KEY_KEY)
}

export function setApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AI_API_KEY_KEY, apiKey)
}

export function hasApiKey(): boolean {
  return getApiKey() !== null && getApiKey() !== ''
}

// OpenAI API를 사용하여 이미지 분석 및 감성적인 내용 생성
export async function generateContentFromImage(
  imageBase64: string,
  title?: string
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('AI API 키가 설정되지 않았습니다.')
  }

  try {
    // base64 이미지를 OpenAI Vision API 형식으로 변환
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 따뜻하고 감성적인 추억 기록을 도와주는 AI 어시스턴트입니다. 사진을 보고 그 순간의 감정과 추억을 아름답고 따뜻하게 표현해주세요. 가족, 사랑, 소중한 순간들을 강조하며 감성적인 문체로 작성해주세요.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: title
                  ? `이 사진의 제목은 "${title}"입니다. 이 사진을 보고 감성적이고 따뜻한 추억 기록을 작성해주세요. 2-3문단 정도로 작성해주세요.`
                  : '이 사진을 보고 감성적이고 따뜻한 추억 기록을 작성해주세요. 2-3문단 정도로 작성해주세요.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'API 요청 실패' } }))
      throw new Error(error.error?.message || 'AI 내용 생성에 실패했습니다.')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || '내용을 생성할 수 없습니다.'
  } catch (error) {
    console.error('AI content generation error:', error)
    throw error instanceof Error ? error : new Error('AI 내용 생성 중 오류가 발생했습니다.')
  }
}

// 텍스트 기반 감성적인 내용 생성
export async function generateContentFromText(
  text: string,
  title?: string
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('AI API 키가 설정되지 않았습니다.')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 따뜻하고 감성적인 추억 기록을 도와주는 AI 어시스턴트입니다. 사용자가 제공한 내용을 바탕으로 더욱 감성적이고 아름답게 다듬어주세요. 가족, 사랑, 소중한 순간들을 강조하며 감성적인 문체로 작성해주세요.',
          },
          {
            role: 'user',
            content: title
              ? `제목: "${title}"\n\n내용: "${text}"\n\n위 내용을 바탕으로 더욱 감성적이고 따뜻한 추억 기록으로 다듬어주세요. 2-3문단 정도로 작성해주세요.`
              : `내용: "${text}"\n\n위 내용을 바탕으로 더욱 감성적이고 따뜻한 추억 기록으로 다듬어주세요. 2-3문단 정도로 작성해주세요.`,
          },
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'API 요청 실패' } }))
      throw new Error(error.error?.message || 'AI 내용 생성에 실패했습니다.')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || '내용을 생성할 수 없습니다.'
  } catch (error) {
    console.error('AI content generation error:', error)
    throw error instanceof Error ? error : new Error('AI 내용 생성 중 오류가 발생했습니다.')
  }
}

