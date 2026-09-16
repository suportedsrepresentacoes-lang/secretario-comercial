export interface GeocodeResult {
  label: string
  lat: number
  lng: number
}

// Geocodificação de endereço via Nominatim (OpenStreetMap), gratuita e sem chave.
export async function geocodeAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&countrycodes=br&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Não foi possível buscar esse endereço agora. Tente novamente.')
  const json: Array<{ display_name: string; lat: string; lon: string }> = await res.json()
  return json.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }))
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const json: { display_name?: string } = await res.json()
    return json.display_name ?? null
  } catch {
    return null
  }
}
