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

async function searchOneTerm(
  term: string,
  categoryLabel: string,
  origin: { lat: number; lng: number },
  radiusM: number,
  signal?: AbortSignal,
): Promise<Establishment[]> {
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
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Google Places respondeu ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }
  const json: { places?: GooglePlace[] } = await res.json()
  return (json.places ?? [])
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
}

export interface GooglePlacesSearchResult {
  results: Establishment[]
  partial: boolean
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
    throw new Error('Chave da API do Google Places não configurada. Peça para configurar o segredo GOOGLE_PLACES_API_KEY no GitHub.')
  }
  if (segments.length === 0) return { results: [], partial: false }

  const radiusM = Math.round(radiusKm * 1000)
  const settled = await Promise.all(
    segments.map((s) =>
      searchOneTerm(s.label, s.label, origin, radiusM, signal).then(
        (v) => ({ ok: true as const, v }),
        (e) => ({ ok: false as const, e }),
      ),
    ),
  )
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  if (settled.every((s) => !s.ok)) {
    const firstError = settled[0]
    throw firstError && !firstError.ok && firstError.e instanceof Error
      ? firstError.e
      : new Error('Não foi possível buscar estabelecimentos agora. Tente novamente em instantes.')
  }

  const merged: Establishment[] = []
  const seen = new Set<string>()
  settled.forEach((s) => {
    if (!s.ok) return
    s.v.forEach((e) => {
      if (seen.has(e.id)) return
      seen.add(e.id)
      merged.push(e)
    })
  })
  merged.sort((a, b) => a.distanciaKm - b.distanciaKm)
  return { results: merged, partial: settled.some((s) => !s.ok) }
}
