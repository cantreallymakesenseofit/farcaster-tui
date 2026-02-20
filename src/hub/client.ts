let hubUrl = "https://hub.merv.fun"

export function setHubUrl(url: string) {
  hubUrl = url.replace(/\/+$/, "")
}

export function getHubUrl(): string {
  return hubUrl
}

export async function hubGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  const url = new URL(`/v1${path}`, hubUrl)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    let detail = response.statusText
    try {
      const err = (await response.json()) as Record<string, string>
      detail = err.errCode
        ? `${err.errCode}: ${err.detail || err.message}`
        : JSON.stringify(err)
    } catch {}
    throw new Error(`Hub API error (${response.status}): ${detail}`)
  }
  return response.json() as Promise<T>
}

export async function hubPost<T>(path: string, body: Uint8Array): Promise<T> {
  const url = new URL(`/v1${path}`, hubUrl)
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body,
  })
  if (!response.ok) {
    let detail = response.statusText
    try {
      const err = (await response.json()) as Record<string, string>
      detail = err.errCode
        ? `${err.errCode}: ${err.detail || err.message}`
        : JSON.stringify(err)
    } catch {}
    throw new Error(`Hub submit error (${response.status}): ${detail}`)
  }
  return response.json() as Promise<T>
}
