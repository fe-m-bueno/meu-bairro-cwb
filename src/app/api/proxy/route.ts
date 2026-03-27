import { type NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['geocuritiba.ippuc.org.br']

const memoryCache = new Map<string, { data: unknown; timestamp: number }>()
const MEMORY_CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
    )
  }

  try {
    const parsed = new URL(url)
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
    }

    const cached = memoryCache.get(url)
    if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control':
            'public, max-age=86400, stale-while-revalidate=604800',
        },
      })
    }

    const response = await fetch(url)
    const data = await response.json()
    memoryCache.set(url, { data, timestamp: Date.now() })
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 })
  }
}
