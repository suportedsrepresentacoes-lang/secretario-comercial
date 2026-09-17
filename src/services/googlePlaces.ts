// Busca de estabelecimentos via Google Places API (Text Search). Cobertura muito melhor que o
// OpenStreetMap em cidades pequenas, porque as próprias empresas mantêm o cadastro atualizado no
// Google — ao custo de depender de uma chave de API (ver VITE_GOOGLE_PLACES_API_KEY).
import { haversineKm } from './routing'
import type { Segment, Establishment } from '../types'

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined
const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.currentOpeningHours.openNow',
].join(',')

interface GooglePlace {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  currentOpeningHours?: { openNow?: boolean }
}

export function hasGooglePlacesKey(): boolean {
  return !!API_KEY
}

export interface TermDebugInfo {
  term: string
  status: number
  body: string
}

async function searchOneTerm(
  term: string,
  categoryLabel: string,
  origin: { lat: number; lng: number },
  radiusM: number,
  signal?: AbortSignal,
): Promise<{ items: Establishment[]; debug: TermDebugInfo }> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY as string,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: term,
      languageCode: 'pt-BR',
      regionCode: 'BR',
      maxResultCount: 20,
      locationBias: { circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: radiusM } },
    }),
    signal,
  })
  const bodyText = await res.text()
  const debug: TermDebugInfo = { term, status: res.status, body: bodyText.slice(0, 800) }
  if (!res.ok) {
    const err = new Error(`Google Places respondeu ${res.status}${bodyText ? `: ${bodyText.slice(0, 300)}` : ''}`) as Error & { debug?: TermDebugInfo }
    err.debug = debug
    throw err
  }
  let json: { places?: GooglePlace[] }
  try {
    json = bodyText ? JSON.parse(bodyText) : {}
  } catch {
    const err = new Error('Google Places devolveu uma resposta que não é JSON válido.') as Error & { debug?: TermDebugInfo }
    err.debug = debug
    throw err
  }
  const items = (json.places ?? [])
    .filter((p) => p.location)
    .map((p) => ({
      id: `google:${p.id}`,
      nome: p.displayName?.text ?? categoryLabel,
      endereco: p.formattedAddress ?? 'Endereço não informado',
      lat: p.location!.latitude,
      lng: p.location!.longitude,
      telefone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
      categoria: categoryLabel,
      horario: p.currentOpeningHours?.openNow != null ? (p.currentOpeningHours.openNow ? 'Aberto agora' : 'Fechado agora') : undefined,
      distanciaKm: Math.round(haversineKm(origin, { lat: p.location!.latitude, lng: p.location!.longitude }) * 10) / 10,
    }))
  return { items, debug }
}

export interface GooglePlacesSearchResult {
  results: Establishment[]
  partial: boolean
  /** Status bruto da 1ª categoria pesquisada — usado só pra depurar problemas de configuração da API. */
  debug: TermDebugInfo[]
}

// Uma busca de texto por segmento (ex: "material de construção perto de mim"), todas em paralelo —
// mesma filosofia de resiliência da busca via OpenStreetMap: se uma categoria falhar, as outras
// continuam valendo.
export async function searchGooglePlaces(
  segments: Segment[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  signal?: AbortSignal,
): Promise<GooglePlacesSearchResult> {
  if (!API_KEY) {
    throw new Error('Chave da API do Google Places não configurada. Peça para configurar o segredo VITE_GOOGLE_MAPS_API_KEY no GitHub.')
  }
  if (segments.length === 0) return { results: [], partial: false, debug: [] }

  const radiusM = Math.round(radiusKm * 1000)
  const settled = await Promise.all(
    segments.map((s) =>
      searchOneTerm(s.label, s.label, origin, radiusM, signal).then(
        (v) => ({ ok: true as const, v }),
        (e) => ({ ok: false as const, e: e as Error & { debug?: TermDebugInfo } }),
      ),
    ),
  )
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const debug: TermDebugInfo[] = settled.map((s, i) => (s.ok ? s.v.debug : (s.e.debug ?? { term: segments[i].label, status: 0, body: s.e.message })))

  if (settled.every((s) => !s.ok)) {
    const firstError = settled[0]
    const err = (firstError && !firstError.ok && firstError.e instanceof Error
      ? firstError.e
      : new Error('Não foi possível buscar estabelecimentos agora. Tente novamente em instantes.')) as Error & { debug?: TermDebugInfo[] }
    err.debug = debug
    throw err
  }

  const merged: Establishment[] = []
  const seen = new Set<string>()
  settled.forEach((s) => {
    if (!s.ok) return
    s.v.items.forEach((e) => {
      if (seen.has(e.id)) return
      seen.add(e.id)
      merged.push(e)
    })
  })
  merged.sort((a, b) => a.distanciaKm - b.distanciaKm)
  return { results: merged, partial: settled.some((s) => !s.ok), debug }
}
