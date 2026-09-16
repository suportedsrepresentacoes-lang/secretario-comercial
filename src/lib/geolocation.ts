export interface GeoResult {
  lat: number
  lng: number
  accuracyM: number
}

export function getCurrentLocation(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este navegador não suporta geolocalização.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Permissão de localização negada. Habilite o acesso à localização no navegador.'))
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Tempo esgotado ao obter localização. Tente novamente.'))
        } else {
          reject(new Error('Não foi possível obter sua localização.'))
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  })
}
