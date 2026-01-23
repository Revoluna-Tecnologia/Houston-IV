import { NextRequest, NextResponse } from 'next/server'

// Proxy all auth requests to the NestJS API
// This solves the cross-domain cookie issue by keeping cookies on the same domain

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// #region agent log
const debugLog = (location: string, message: string, data: object, hypothesisId: string) => {
  fetch('http://127.0.0.1:7242/ingest/41fda97e-756c-42b1-9a82-abbcc64dfe44',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

async function proxyRequest(request: NextRequest, path: string[]) {
  const url = `${API_URL}/api/auth/${path.join('/')}`
  
  // #region agent log
  debugLog('route.ts:proxyRequest:entry', 'Proxy request started', { method: request.method, url, path: path.join('/') }, 'H1');
  // #endregion
  
  // Get request body if present
  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text()
    } catch {
      // No body
    }
  }

  // Forward the request to the API
  const response = await fetch(url, {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'Cookie': request.headers.get('Cookie') || '',
      'Origin': request.headers.get('Origin') || '',
      'User-Agent': request.headers.get('User-Agent') || '',
    },
    body,
    credentials: 'include',
  })

  // Get response data
  const data = await response.text()

  // #region agent log
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  debugLog('route.ts:proxyRequest:response', 'API response received', { status: response.status, hasSetCookie: setCookieHeaders.length > 0, setCookieCount: setCookieHeaders.length, dataLength: data.length }, 'H1');
  // #endregion

  // Create the response
  const proxyResponse = new NextResponse(data, {
    status: response.status,
    statusText: response.statusText,
  })

  // Copy headers from API response
  response.headers.forEach((value, key) => {
    // Skip some headers that shouldn't be copied
    if (key.toLowerCase() === 'transfer-encoding') return
    if (key.toLowerCase() === 'content-encoding') return
    
    proxyResponse.headers.set(key, value)
  })

  // #region agent log
  debugLog('route.ts:proxyRequest:exit', 'Proxy response created', { responseStatus: proxyResponse.status, headersSet: Array.from(proxyResponse.headers.keys()) }, 'H1');
  // #endregion

  return proxyResponse
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params
  return proxyRequest(request, all)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params
  return proxyRequest(request, all)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params
  return proxyRequest(request, all)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params
  return proxyRequest(request, all)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const { all } = await params
  return proxyRequest(request, all)
}
