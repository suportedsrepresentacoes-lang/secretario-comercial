import type { Segment } from '../types'

// Segmentos de prospecção e as tags OpenStreetMap usadas para localizar
// estabelecimentos compatíveis via Overpass API (dados livres, sem chave).
// Lista genérica: serve qualquer representante, não só o ramo de construção.
export const SEGMENTS: Segment[] = [
  {
    id: 'material-construcao',
    label: 'Materiais de Construção',
    osmTags: [
      { key: 'shop', value: 'doityourself' },
      { key: 'shop', value: 'trade' },
    ],
  },
  {
    id: 'acabamentos',
    label: 'Acabamentos',
    osmTags: [
      { key: 'shop', value: 'tiles' },
      { key: 'shop', value: 'doityourself' },
    ],
  },
  { id: 'ferragens', label: 'Ferragens', osmTags: [{ key: 'shop', value: 'hardware' }] },
  {
    id: 'hidraulica',
    label: 'Hidráulica',
    osmTags: [
      { key: 'shop', value: 'bathroom_furnishing' },
      { key: 'craft', value: 'plumber' },
    ],
  },
  {
    id: 'eletrica',
    label: 'Elétrica',
    osmTags: [
      { key: 'shop', value: 'electrical' },
      { key: 'shop', value: 'lighting' },
    ],
  },
  { id: 'tintas', label: 'Tintas', osmTags: [{ key: 'shop', value: 'paint' }] },
  { id: 'ferramentas', label: 'Ferramentas', osmTags: [{ key: 'shop', value: 'tool_hire' }] },
  {
    id: 'madeireiras',
    label: 'Madeireiras',
    osmTags: [
      { key: 'craft', value: 'carpenter' },
      { key: 'shop', value: 'doityourself' },
    ],
  },
  { id: 'depositos', label: 'Depósitos', osmTags: [{ key: 'shop', value: 'wholesale' }] },
  { id: 'distribuidoras', label: 'Distribuidoras', osmTags: [{ key: 'shop', value: 'wholesale' }] },
  { id: 'construtoras', label: 'Construtoras', osmTags: [{ key: 'office', value: 'construction_company' }] },
  { id: 'condominios', label: 'Condomínios', osmTags: [{ key: 'landuse', value: 'residential' }] },
  { id: 'supermercados', label: 'Supermercados', osmTags: [{ key: 'shop', value: 'supermarket' }] },
  { id: 'lojas-roupas', label: 'Lojas de Roupas', osmTags: [{ key: 'shop', value: 'clothes' }] },
  { id: 'autopecas', label: 'Autopeças', osmTags: [{ key: 'shop', value: 'car_parts' }] },
  { id: 'farmacias', label: 'Farmácias', osmTags: [{ key: 'amenity', value: 'pharmacy' }] },
  {
    id: 'agropecuaria-pet',
    label: 'Agropecuária / Pet',
    osmTags: [
      { key: 'shop', value: 'pet' },
      { key: 'shop', value: 'agrarian' },
      { key: 'shop', value: 'farm' },
    ],
  },
  {
    id: 'padarias-mercados',
    label: 'Padarias e Mercados',
    osmTags: [
      { key: 'shop', value: 'bakery' },
      { key: 'shop', value: 'convenience' },
    ],
  },
  { id: 'papelarias', label: 'Papelarias', osmTags: [{ key: 'shop', value: 'stationery' }] },
  { id: 'industrias-fabricas', label: 'Indústrias e Fábricas', osmTags: [{ key: 'man_made', value: 'works' }] },
]

export function findSegment(id: string): Segment | undefined {
  return SEGMENTS.find((s) => s.id === id)
}

export function searchSegments(query: string): Segment[] {
  const q = query.trim().toLowerCase()
  if (!q) return SEGMENTS
  return SEGMENTS.filter((s) => s.label.toLowerCase().includes(q))
}

// Cria um segmento "personalizado" a partir de texto livre digitado pelo usuário.
// Sem uma tag OSM conhecida, a busca cai para correspondência pelo nome do local (ver overpass.ts).
export function customSegment(label: string): Segment {
  return { id: `custom-${label.toLowerCase().trim().replace(/\s+/g, '-')}`, label: label.trim(), osmTags: [] }
}
