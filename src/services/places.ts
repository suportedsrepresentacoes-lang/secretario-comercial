// Busca de estabelecimentos reais via Overpass API (dados do OpenStreetMap), sem chave de API.
// A cobertura depende do quanto a região está mapeada no OSM — pode variar por cidade.
import { haversineKm } from './routing'
import type { Segment, Establishment } from '../types'

interface OverpassNode {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Os espelhos públicos do Overpass variam muito de latência momento a momento. Em vez de tentar
// um de cada vez (o que soma os timeouts), disparamos todos em paralelo e usamos o primeiro que
// responder — muito mais rápido na prática, ao custo de eventualmente aceitar um espelho com
// menos dados do que outro mais lento traria.
const MIRRORS = [
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const MIRROR_TIMEOUT_MS = 8000

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&')
}

function buildQuery(tags: { key: string; value: string }[], freeText: string[], lat: number, lng: number, radiusM: number): string {
  const byTag = tags
    .map(
      (t) =>
        `  node["${t.key}"="${t.value}"](around:${radiusM},${lat},${lng});\n` +
        `  way["${t.key}"="${t.value}"](around:${radiusM},${lat},${lng});\n`,
    )
    .join('')
  // Segmentos personalizados (sem tag OSM conhecida) caem para busca por nome do local.
  const byName = freeText
    .map((term) => {
      const re = escapeRegex(term)
      return (
        `  node["name"~"${re}",i](around:${radiusM},${lat},${lng});\n` +
        `  way["name"~"${re}",i](around:${radiusM},${lat},${lng});\n`
      )
    })
    .join('')
  return `[out:json][timeout:15];\n(\n${byTag}${byName});\nout center tags 200;`
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:street'], tags['addr:housenumber'], tags['addr:suburb'] ?? tags['addr:city']].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Endereço não informado no OpenStreetMap'
}

function fetchMirror(url: string, body: string, outerSignal: AbortSignal | undefined): Promise<{ elements: OverpassNode[] }> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  outerSignal?.addEventListener('abort', onAbort)
  const timer = setTimeout(() => controller.abort(), MIRROR_TIMEOUT_MS)
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) throw new Error(`mirror ${url} respondeu ${res.status}`)
      return res.json()
    })
    .then((json) => {
      if (!Array.isArray(json.elements)) throw new Error(`mirror ${url} resposta inválida`)
      return json as { elements: OverpassNode[] }
    })
    .finally(() => {
      clearTimeout(timer)
      outerSignal?.removeEventListener('abort', onAbort)
    })
}

// Dispara os espelhos em paralelo e usa o primeiro que responder com sucesso (Promise.any ignora
// rejeições isoladas). Só falha se todos os espelhos falharem/expirarem.
async function queryOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassNode[] }> {
  const body = `data=${encodeURIComponent(query)}`
  try {
    return await Promise.any(MIRRORS.map((mirror) => fetchMirror(mirror, body, signal)))
  } catch {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    throw new Error('Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.')
  }
}

function establishmentsFrom(json: { elements: OverpassNode[] }, origin: { lat: number; lng: number }, categoryByTag: Map<string, string>): Establishment[] {
  const results: Establishment[] = []
  const seen = new Set<string>()
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null || !el.tags?.name) continue

    // Deduplica por nome+coordenadas: o mesmo local pode aparecer em mais de uma categoria
    // pesquisada, ou como node e way ao mesmo tempo.
    const dedupeKey = `${el.tags.name.toLowerCase()}-${lat.toFixed(4)}-${lon.toFixed(4)}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const tagKey = el.tags.shop
      ? `shop=${el.tags.shop}`
      : el.tags.craft
        ? `craft=${el.tags.craft}`
        : el.tags.office
          ? `office=${el.tags.office}`
          : el.tags.amenity
            ? `amenity=${el.tags.amenity}`
            : el.tags.man_made
              ? `man_made=${el.tags.man_made}`
              : ''

    results.push({
      id: `${el.type}/${el.id}`,
      nome: el.tags.name,
      endereco: formatAddress(el.tags),
      lat,
      lng: lon,
      telefone: el.tags.phone ?? el.tags['contact:phone'],
      categoria: categoryByTag.get(tagKey) ?? 'Estabelecimento',
      horario: el.tags.opening_hours,
      distanciaKm: Math.round(haversineKm(origin, { lat, lng: lon }) * 10) / 10,
    })
  }
  return results.sort((a, b) => a.distanciaKm - b.distanciaKm)
}

// Busca estabelecimentos num raio exato a partir da origem informada — sem nenhuma expansão
// automática. O raio buscado é sempre exatamente o raio pedido pelo usuário.
export async function searchPlaces(
  segments: Segment[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Establishment[]> {
  const tagSet = new Map<string, { key: string; value: string }>()
  const categoryByTag = new Map<string, string>()
  const freeText: string[] = []
  segments.forEach((s) => {
    if (s.osmTags.length === 0) {
      freeText.push(s.label)
      return
    }
    s.osmTags.forEach((t) => {
      const key = `${t.key}=${t.value}`
      tagSet.set(key, t)
      if (!categoryByTag.has(key)) categoryByTag.set(key, s.label)
    })
  })
  const tags = Array.from(tagSet.values())
  if (tags.length === 0 && freeText.length === 0) return []

  // Todos os segmentos entram numa única consulta Overpass (uma requisição, não uma por segmento)
  // — isso já é o jeito mais rápido de pesquisar vários segmentos ao mesmo tempo.
  const query = buildQuery(tags, freeText, origin.lat, origin.lng, Math.round(radiusKm * 1000))
  const json = await queryOverpass(query, signal)
  return establishmentsFrom(json, origin, categoryByTag)
}
