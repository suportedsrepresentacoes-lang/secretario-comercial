import { haversineKm } from './geo'
import type { Segment, Establishment } from '../types'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// A instância pública principal do Overpass (overpass-api.de) fica sobrecarregada com frequência.
// Tentamos espelhos alternativos em sequência antes de desistir, para a busca ser confiável.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
]

function buildQuery(tags: { key: string; value: string }[], lat: number, lng: number, radiusMeters: number): string {
  const filters = tags
    .map(
      (t) =>
        `  node["${t.key}"="${t.value}"](around:${radiusMeters},${lat},${lng});\n` +
        `  way["${t.key}"="${t.value}"](around:${radiusMeters},${lat},${lng});\n`,
    )
    .join('')
  return `[out:json][timeout:20];\n(\n${filters});\nout center tags 200;`
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:street'], tags['addr:housenumber'], tags['addr:suburb'] ?? tags['addr:city']].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Endereço não informado no OpenStreetMap'
}

async function fetchWithTimeout(url: string, body: string, outerSignal: AbortSignal | undefined, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  outerSignal?.addEventListener('abort', onAbort)
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
    outerSignal?.removeEventListener('abort', onAbort)
  }
}

async function queryOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassElement[] }> {
  const body = `data=${encodeURIComponent(query)}`
  for (const endpoint of ENDPOINTS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    try {
      const res = await fetchWithTimeout(endpoint, body, signal, 18000)
      if (!res.ok) continue
      const json = await res.json()
      if (!Array.isArray(json.elements)) continue
      return json
    } catch {
      // tenta o próximo espelho
      continue
    }
  }
  throw new Error(
    'Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.',
  )
}

// Busca estabelecimentos reais próximos via Overpass API (OpenStreetMap), sem necessidade de chave.
// A cobertura depende do quanto a região está mapeada no OSM — pode variar por cidade.
export async function searchEstablishments(
  segments: Segment[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Establishment[]> {
  const tagSet = new Map<string, { key: string; value: string }>()
  const categoryLookup = new Map<string, string>()
  segments.forEach((s) =>
    s.osmTags.forEach((t) => {
      const key = `${t.key}=${t.value}`
      tagSet.set(key, t)
      if (!categoryLookup.has(key)) categoryLookup.set(key, s.label)
    }),
  )
  const tags = Array.from(tagSet.values())
  if (tags.length === 0) return []

  const query = buildQuery(tags, origin.lat, origin.lng, Math.round(radiusKm * 1000))
  const json = await queryOverpass(query, signal)
  const elements = json.elements ?? []

  const results: Establishment[] = []
  const seen = new Set<string>()
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null || !el.tags?.name) continue

    const dedupeKey = `${el.tags.name.toLowerCase()}-${lat.toFixed(4)}-${lon.toFixed(4)}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const tagKey = el.tags.shop ? `shop=${el.tags.shop}` : el.tags.craft ? `craft=${el.tags.craft}` : ''

    results.push({
      id: `${el.type}/${el.id}`,
      nome: el.tags.name,
      endereco: formatAddress(el.tags),
      lat,
      lng: lon,
      telefone: el.tags.phone ?? el.tags['contact:phone'],
      categoria: categoryLookup.get(tagKey) ?? 'Estabelecimento',
      horario: el.tags.opening_hours,
      distanciaKm: Math.round(haversineKm(origin, { lat, lng: lon }) * 10) / 10,
    })
  }

  return results.sort((a, b) => a.distanciaKm - b.distanciaKm)
}
