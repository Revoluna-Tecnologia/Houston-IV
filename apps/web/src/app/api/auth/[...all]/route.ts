import { NextRequest, NextResponse } from 'next/server'

// Proxy all auth requests to the NestJS API
// This solves the cross-domain cookie issue by keeping cookies on the same domain

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function proxyRequest(request: NextRequest, path: string[]) {
  const url = `${API_URL}/api/auth/${path.join('/')}`

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

  // Create the response
  const proxyResponse = new NextResponse(data, {
    status: response.status,
    statusText: response.statusText,
  })

  // Copy headers from API response
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    // Skip headers that shouldn't be copied
    if (lowerKey === 'transfer-encoding') return
    if (lowerKey === 'content-encoding') return
    // Skip set-cookie here — handled separately below
    if (lowerKey === 'set-cookie') return

    proxyResponse.headers.set(key, value)
  })

  // Forward ALL set-cookie headers (forEach merges them into one)
  const setCookies = response.headers.getSetCookie()
  for (const cookie of setCookies) {
    proxyResponse.headers.append('set-cookie', cookie)
  }

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
