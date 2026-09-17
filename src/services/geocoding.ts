// Geocodificação via Nominatim (OpenStreetMap) — gratuita, sem chave de API.

export interface AddressMatch {
  label: string
  lat: number
  lng: number
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressMatch[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&countrycodes=br&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Não foi possível buscar esse endereço agora. Tente novamente.')
  const json: Array<{ display_name: string; lat: string; lon: string }> = await res.json()
  return json.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }))
}

export async function addressAt(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
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

// Versão curta (cidade/bairro), usada na Home em vez do endereço completo.
export async function cityAt(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=12`
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const json: { address?: Record<string, string> } = await res.json()
    const a = json.address ?? {}
    const city = a.city || a.town || a.village || a.municipality || a.suburb
    if (!city) return null
    return a.state ? `${city}, ${a.state}` : city
  } catch {
    return null
  }
}
