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

// A instância pública principal do Overpass fica sobrecarregada com frequência: tentamos espelhos
// alternativos em sequência antes de desistir. O espelho que respondeu por último fica "fixado" como
// primeira tentativa nas próximas buscas, para não perder tempo re-testando instâncias lentas.
const MIRRORS = [
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
let fastestMirror = MIRRORS[0]

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
  return `[out:json][timeout:20];\n(\n${byTag}${byName});\nout center tags 200;`
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:street'], tags['addr:housenumber'], tags['addr:suburb'] ?? tags['addr:city']].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Endereço não informado no OpenStreetMap'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchMirror(url: string, body: string, outerSignal: AbortSignal | undefined, timeoutMs: number): Promise<Response> {
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

async function queryOnePass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassNode[] } | null> {
  const body = `data=${encodeURIComponent(query)}`
  const order = [fastestMirror, ...MIRRORS.filter((m) => m !== fastestMirror)]
  // Um espelho pode responder 200 com lista vazia mesmo havendo resultados (instabilidade daquela
  // instância). Só aceitamos "zero resultados" se nenhum espelho trouxe nada; o primeiro que trouxer
  // resultados de verdade vence e vira preferido nas próximas buscas.
  let emptyFallback: { elements: OverpassNode[] } | null = null
  for (const mirror of order) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    try {
      const res = await fetchMirror(mirror, body, signal, 6000)
      if (!res.ok) continue
      const json = await res.json()
      if (!Array.isArray(json.elements)) continue
      if (json.elements.length > 0) {
        fastestMirror = mirror
        return json
      }
      emptyFallback = json
    } catch {
      continue
    }
  }
  return emptyFallback
}

// Os espelhos públicos do Overpass ficam instáveis momento a momento. Se a primeira rodada não
// trouxe nada de nenhum espelho, aguardamos um instante e tentamos de novo antes de aceitar
// "zero resultados" como resposta final.
async function queryOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassNode[] }> {
  const first = await queryOnePass(query, signal)
  if (first && first.elements.length > 0) return first
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await sleep(2500)
  const second = await queryOnePass(query, signal)
  if (second && second.elements.length > 0) return second
  if (first) return first
  if (second) return second
  throw new Error('Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.')
}

async function searchOnce(segments: Segment[], origin: { lat: number; lng: number }, radiusKm: number, signal?: AbortSignal): Promise<Establishment[]> {
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

  const query = buildQuery(tags, freeText, origin.lat, origin.lng, Math.round(radiusKm * 1000))
  const json = await queryOverpass(query, signal)

  const results: Establishment[] = []
  const seen = new Set<string>()
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null || !el.tags?.name) continue

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

const EXPANSION_MULTIPLIERS = [1, 2, 4]
const MAX_RADIUS_KM = 80

// Repete a busca ampliando o raio automaticamente se houver poucos resultados,
// até 4x o raio pedido ou 80 km, o que vier primeiro.
export async function searchNearbyPlaces(
  segments: Segment[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  options: { autoExpand: boolean; minResults?: number; signal?: AbortSignal } = { autoExpand: true },
): Promise<{ results: Establishment[]; usedRadiusKm: number }> {
  const minResults = options.minResults ?? 3
  const multipliers = options.autoExpand ? EXPANSION_MULTIPLIERS : [1]
  let last: Establishment[] = []
  let usedRadiusKm = radiusKm
  for (const multiplier of multipliers) {
    const r = Math.min(radiusKm * multiplier, MAX_RADIUS_KM)
    const results = await searchOnce(segments, origin, r, options.signal)
    last = results
    usedRadiusKm = r
    if (results.length >= minResults || r >= MAX_RADIUS_KM) break
  }
  return { results: last, usedRadiusKm }
}
