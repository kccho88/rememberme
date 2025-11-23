import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-orange/5 via-white to-warm-pink/5">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-warm-orange mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Link href="/timeline">
          <Button size="lg" className="text-lg">
            <Home className="w-6 h-6 mr-2" />
            타임라인으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  )
}

