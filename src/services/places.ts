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

// "nwr" busca nos três tipos de elemento do OpenStreetMap de uma vez (node + way + relation) —
// um estabelecimento pode estar cadastrado em qualquer um dos três, e usar só "node"+"way" deixava
// de fora o que estivesse mapeado como relation.
function buildQuery(tags: { key: string; value: string }[], freeText: string[], lat: number, lng: number, radiusM: number): string {
  const byTag = tags.map((t) => `  nwr["${t.key}"="${t.value}"](around:${radiusM},${lat},${lng});\n`).join('')
  // Segmentos personalizados (sem tag OSM conhecida) caem para busca por nome do local.
  const byName = freeText
    .map((term) => {
      const re = escapeRegex(term)
      return `  nwr["name"~"${re}",i](around:${radiusM},${lat},${lng});\n`
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

// Dispara os espelhos todos em paralelo (nunca um de cada vez — isso é o que tornava a busca
// lenta). Usa o primeiro que trouxer resultados de verdade; um espelho que responde rápido mas
// vazio não pode "vencer" antes que os outros tenham chance de responder, senão perderíamos dados
// que outro espelho teria. Só aceita "zero resultados" quando TODOS os espelhos concordarem.
async function queryOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassNode[] }> {
  const body = `data=${encodeURIComponent(query)}`
  const settled = MIRRORS.map((mirror) => fetchMirror(mirror, body, signal).then((v) => ({ ok: true as const, v }), (e) => ({ ok: false as const, e })))

  return new Promise((resolve, reject) => {
    let pending = settled.length
    let emptyFallback: { elements: OverpassNode[] } | null = null
    settled.forEach((p) => {
      p.then((result) => {
        pending--
        if (result.ok) {
          if (result.v.elements.length > 0) {
            resolve(result.v)
            return
          }
          emptyFallback = result.v
        }
        if (pending === 0) {
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'))
          } else if (emptyFallback) {
            resolve(emptyFallback)
          } else {
            reject(new Error('Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.'))
          }
        }
      })
    })
  })
}

function establishmentsFrom(json: { elements: OverpassNode[] }, origin: { lat: number; lng: number }, categoryByTag: Map<string, string>): Establishment[] {
  const results: Establishment[] = []
  const seen = new Set<string>()
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) continue

    const tagKey = el.tags?.shop
      ? `shop=${el.tags.shop}`
      : el.tags?.craft
        ? `craft=${el.tags.craft}`
        : el.tags?.office
          ? `office=${el.tags.office}`
          : el.tags?.amenity
            ? `amenity=${el.tags.amenity}`
            : el.tags?.man_made
              ? `man_made=${el.tags.man_made}`
              : ''
    const categoria = categoryByTag.get(tagKey) ?? 'Estabelecimento'
    // Muitos estabelecimentos pequenos aparecem no OpenStreetMap com a categoria certa mas sem o
    // campo "nome" preenchido — mostramos mesmo assim (com a categoria como nome) em vez de
    // descartar um cliente real só porque falta esse dado no mapa.
    const nome = el.tags?.name ?? categoria

    // Deduplica por nome+coordenadas: o mesmo local pode aparecer como node e way ao mesmo tempo.
    const dedupeKey = `${nome.toLowerCase()}-${lat.toFixed(4)}-${lon.toFixed(4)}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    results.push({
      id: `${el.type}/${el.id}`,
      nome,
      endereco: formatAddress(el.tags ?? {}),
      lat,
      lng: lon,
      telefone: el.tags?.phone ?? el.tags?.['contact:phone'],
      categoria,
      horario: el.tags?.opening_hours,
      distanciaKm: Math.round(haversineKm(origin, { lat, lng: lon }) * 10) / 10,
    })
  }
  return results.sort((a, b) => a.distanciaKm - b.distanciaKm)
}

export interface PlacesSearchResult {
  results: Establishment[]
  /** Consulta Overpass QL combinada — útil só para depurar abrindo no Overpass Turbo. */
  query: string | null
  /** true quando pelo menos uma categoria pesquisada não respondeu (mas outras trouxeram dados). */
  partial: boolean
  /** Toda tag OSM realmente pesquisada nesta busca (união de todos os segmentos selecionados) — exibida na tela para conferência. */
  tagsUsed: { key: string; value: string; category: string }[]
}

// Monta o link do Overpass Turbo (ferramenta oficial do projeto OpenStreetMap) já com a mesma
// consulta usada pela busca, para conferir visualmente no mapa se existem dados cadastrados
// naquela região — sem depender do nosso código.
export function overpassTurboUrl(query: string): string {
  return `https://overpass-turbo.eu/?Q=${encodeURIComponent(query)}&R`
}

// Consulta ampla (qualquer shop=*, sem filtrar categoria) — diagnóstico independente da busca do
// app: mostra se o OpenStreetMap tem alguma loja cadastrada na região, ponto.
export function overpassAnyShopDebugUrl(origin: { lat: number; lng: number }, radiusKm: number): string {
  const radiusM = Math.round(radiusKm * 1000)
  const query = `[out:json][timeout:25];\n(\n  nwr["shop"](around:${radiusM},${origin.lat},${origin.lng});\n);\nout center tags 100;`
  return overpassTurboUrl(query)
}

// Busca estabelecimentos num raio exato a partir da origem informada — sem nenhuma expansão
// automática. O raio buscado é sempre exatamente o raio pedido pelo usuário.
//
// Cada tag/categoria pesquisada vira uma consulta Overpass PEQUENA e SEPARADA, todas disparadas em
// paralelo. Uma única consulta combinando várias tags de uma vez (ex: 3 segmentos = 5 tags = 10
// cláusulas "around") é pesada o bastante para os servidores públicos do Overpass — sobrecarregados
// — travarem com timeout de runtime, mesmo com poucos segundos de espera configurados. Consultas
// menores respondem muito mais rápido e, se uma categoria falhar, as outras continuam valendo.
export async function searchPlaces(
  segments: Segment[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  signal?: AbortSignal,
): Promise<PlacesSearchResult> {
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
  const tagsUsed = tags.map((t) => ({ ...t, category: categoryByTag.get(`${t.key}=${t.value}`) ?? '' }))
  if (tags.length === 0 && freeText.length === 0) return { results: [], query: null, partial: false, tagsUsed: [] }

  const radiusM = Math.round(radiusKm * 1000)
  // Consulta combinada guardada só para o link de diagnóstico (Overpass Turbo) — a execução real é
  // sempre dividida em consultas menores, abaixo.
  const combinedQuery = buildQuery(tags, freeText, origin.lat, origin.lng, radiusM)

  const clauseLabels = [...tags.map((t) => `${t.key}=${t.value}`), ...freeText.map((term) => `nome~"${term}"`)]
  const clauseQueries = [
    ...tags.map((t) => buildQuery([t], [], origin.lat, origin.lng, radiusM)),
    ...freeText.map((term) => buildQuery([], [term], origin.lat, origin.lng, radiusM)),
  ]
  console.log('[CampoVista] busca de estabelecimentos', {
    origem: origin,
    raioKm: radiusKm,
    segmentos: segments.map((s) => s.label),
    tagsGeradas: tagsUsed,
    termosLivres: freeText,
  })
  const settled = await Promise.all(
    clauseQueries.map((q, i) =>
      queryOverpass(q, signal).then(
        (v) => {
          console.log(`[CampoVista] "${clauseLabels[i]}" → ${v.elements.length} elemento(s)`)
          return v
        },
        (e) => {
          console.log(`[CampoVista] "${clauseLabels[i]}" → falhou (${e instanceof Error ? e.message : e})`)
          return null
        },
      ),
    ),
  )
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  if (settled.every((s) => s === null)) {
    const err = new Error('Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.') as Error & { tagsUsed?: typeof tagsUsed }
    err.tagsUsed = tagsUsed
    throw err
  }

  const merged: OverpassNode[] = []
  settled.forEach((s) => { if (s) merged.push(...s.elements) })
  const results = establishmentsFrom({ elements: merged }, origin, categoryByTag)
  console.log('[CampoVista] resultado final', { elementosRecebidos: merged.length, resultadoFinal: results.length, algumaCategoriaFalhou: settled.some((s) => s === null) })
  return {
    results,
    query: combinedQuery,
    partial: settled.some((s) => s === null),
    tagsUsed,
  }
}
