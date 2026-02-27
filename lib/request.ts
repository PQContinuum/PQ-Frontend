type HeadersLike = {
  get(name: string): string | null
}

const HOST_HEADER_CANDIDATES = [
  "x-forwarded-host",
  "x-vercel-forwarded-host",
  "x-original-host",
  "host",
]

const PROTO_HEADER_CANDIDATES = [
  "x-forwarded-proto",
  "x-forwarded-protocol",
  "x-url-scheme",
  "x-forwarded-scheme",
]

function firstForwardedValue(value: string | null): string | null {
  if (!value) return null
  const first = value.split(",")[0]?.trim()
  return first || null
}

export function getRequestHost(headers: HeadersLike): string {
  for (const header of HOST_HEADER_CANDIDATES) {
    const value = firstForwardedValue(headers.get(header))
    if (value) return value
  }
  return ""
}

export function getRequestProto(headers: HeadersLike): string {
  for (const header of PROTO_HEADER_CANDIDATES) {
    const value = firstForwardedValue(headers.get(header))
    if (value) return value
  }
  return "https"
}

export function getRequestOrigin(headers: HeadersLike): string | null {
  const host = getRequestHost(headers)
  if (!host) return null
  const proto = getRequestProto(headers)
  return `${proto}://${host}`
}

export function isContinuumHost(host: string): boolean {
  const normalizedHost = host.split(":")[0] || ""
  return normalizedHost.endsWith("continuumai.app")
}
