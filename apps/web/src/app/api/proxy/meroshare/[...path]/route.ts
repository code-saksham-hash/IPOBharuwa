import { NextRequest, NextResponse } from 'next/server'
import { proxyToCDSC } from '@/lib/proxy'
import { getSession } from '@/lib/session'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS = 30
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_REQUESTS) {
    return false
  }
  entry.count++
  return true
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProxy(req, params.path)
}

async function handleProxy(req: NextRequest, pathSegments: string[]) {
  const session = await getSession()
  if (!session?.user) {
    console.log('[proxy] [N]  Session missing — user not logged into IPOBaje')
    return NextResponse.json(
      { data: null, error: 'Not logged in — your session may have expired' },
      { status: 401 },
    )
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests — try again in 1 minute' },
      { status: 429 },
    )
  }

  let cdsPath = '/' + pathSegments.join('/')
  if (req.nextUrl.pathname.endsWith('/') && !cdsPath.endsWith('/')) {
    cdsPath += '/'
  }
  const body = req.method === 'POST' ? await req.json().catch(() => undefined) : undefined

  if (cdsPath === '/auth/' && body) {
    const reqBody = body as Record<string, unknown>
    const { password: _, ...sanitized } = reqBody
    console.log('[proxy] ===> EXACT JSON SENT TO CDSC:')
    console.log(JSON.stringify(sanitized, null, 2))
  }

  try {
    const clientToken = req.headers.get('authorization') ?? undefined
    const clientCookie = req.headers.get('cookie') ?? undefined

    const result = await proxyToCDSC(cdsPath, {
      method: req.method,
      body,
      token: clientToken,
      cookie: clientCookie,
    })

    if (cdsPath === '/auth/' || cdsPath === '/ownDetail/' || cdsPath === '/myBankRequest/') {
      console.log(`[proxy] <=== EXACT CDSC RESPONSE for ${cdsPath}:`)
      console.log(`[proxy]   HTTP ${result.status} ${result.ok ? 'OK' : 'FAILED'}`)
      console.log('[proxy]   Body:', JSON.stringify(result.data))
      console.log('[proxy]   Raw error:', result.errorBody)
      console.log('[proxy]   Headers:', JSON.stringify(result.headers))
      if ((cdsPath === '/ownDetail/' || cdsPath === '/myBankRequest/') && result.data && typeof result.data === 'object') {
        console.log(`[proxy]   ${cdsPath} top-level keys:`, Object.keys(result.data))
        const keysAtDepth = (obj: unknown, depth: number): unknown => {
          if (depth === 0 || typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj
          const out: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            out[k] = keysAtDepth(v, depth - 1)
          }
          return out
        }
        console.log(`[proxy]   ${cdsPath} key-structure (depth 2):`, JSON.stringify(keysAtDepth(result.data, 2), null, 2))
      }
    }

    const responseHeaders: Record<string, string> = {}
    if (result.headers['set-cookie']) {
      responseHeaders['set-cookie'] = result.headers['set-cookie']!
    }
    if (result.headers['authorization']) {
      responseHeaders['x-cdsc-token'] = result.headers['authorization']
    }

    if (!result.ok) {
      const errorMessage = mapCDSCError(result.status, result.errorBody)
      return NextResponse.json(
        { data: null, error: errorMessage },
        { status: result.status, headers: responseHeaders },
      )
    }

    return NextResponse.json(
      { data: result.data, error: null },
      { status: result.status, headers: responseHeaders },
    )
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Proxy error' },
      { status: 502 },
    )
  }
}
