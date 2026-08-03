const CDSC_BASE = 'https://backend.cdsc.com.np/api/meroShare'
const CDSC_ORIGIN = 'https://meroshare.cdsc.com.np'

interface ProxyResult {
  ok: boolean
  status: number
  data: unknown
  headers: Record<string, string>
  errorBody: string | null
}

export async function proxyToCDSC(
  path: string,
  options: {
    method?: string
    body?: unknown
    token?: string
    cookie?: string
  } = {},
): Promise<ProxyResult> {
  const { method = 'GET', body, token, cookie } = options

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Origin': CDSC_ORIGIN,
    'Referer': `${CDSC_ORIGIN}/`,
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = token
  }

  if (cookie) {
    headers['Cookie'] = cookie
  }

  const url = `${CDSC_BASE}${path}`

  console.log(`[proxy] → ${method} ${path}${token ? ' (auth)' : ''}`)

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()

  const responseHeaders: Record<string, string> = {}
  const cookieParts: string[] = []
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (lowerKey === 'set-cookie') {
      const nameValue = (value.split(';')[0] ?? '').trim()
      if (nameValue) cookieParts.push(nameValue)
    } else {
      responseHeaders[lowerKey] = value
    }
  })
  if (cookieParts.length > 0) {
    responseHeaders['set-cookie'] = cookieParts.join('; ')
  }

  const preview = text.length > 300 ? text.slice(0, 300) + '…' : text
  console.log(`[proxy] ← ${response.status} ${response.statusText} — ${preview}`)

  let data: unknown = null
  let errorBody: string | null = null
  if (text.length > 0) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!response.ok) {
        errorBody = text
      } else {
        data = text
      }
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? data : null,
    headers: responseHeaders,
    errorBody: response.ok ? null : ((errorBody ?? (typeof data === 'string' ? data : text)) || null),
  }
}
