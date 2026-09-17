import type { Segment } from '../types'

// Segmentos de prospecção e as tags OpenStreetMap usadas para localizar estabelecimentos
// compatíveis via Overpass API (dados livres, sem chave). Lista genérica: serve representantes
// de qualquer ramo B2B, não só um setor específico.
export const SEGMENTS: Segment[] = [
  {
    id: 'material-construcao',
    label: 'Material de Construção',
    osmTags: [
      { key: 'shop', value: 'doityourself' },
      { key: 'shop', value: 'trade' },
      { key: 'shop', value: 'hardware' },
      { key: 'shop', value: 'building_materials' },
      { key: 'trade', value: 'building_supplies' },
    ],
  },
  { id: 'madeireira', label: 'Madeireira', osmTags: [{ key: 'craft', value: 'carpenter' }, { key: 'shop', value: 'doityourself' }] },
  { id: 'marcenaria', label: 'Marcenaria', osmTags: [{ key: 'craft', value: 'carpenter' }] },
  { id: 'moveis', label: 'Móveis', osmTags: [{ key: 'shop', value: 'furniture' }] },
  { id: 'ferragens', label: 'Ferragens', osmTags: [{ key: 'shop', value: 'hardware' }] },
  { id: 'tintas', label: 'Loja de Tintas', osmTags: [{ key: 'shop', value: 'paint' }] },
  { id: 'eletrica', label: 'Elétrica', osmTags: [{ key: 'shop', value: 'electrical' }, { key: 'shop', value: 'lighting' }] },
  { id: 'hidraulica', label: 'Hidráulica', osmTags: [{ key: 'shop', value: 'bathroom_furnishing' }, { key: 'craft', value: 'plumber' }] },
  { id: 'ferramentas', label: 'Ferramentas', osmTags: [{ key: 'shop', value: 'tool_hire' }] },
  { id: 'autopecas', label: 'Autopeças', osmTags: [{ key: 'shop', value: 'car_parts' }] },
  { id: 'farmacias', label: 'Farmácia', osmTags: [{ key: 'amenity', value: 'pharmacy' }] },
  { id: 'supermercados', label: 'Supermercado', osmTags: [{ key: 'shop', value: 'supermarket' }] },
  {
    id: 'agropecuaria',
    label: 'Agropecuária',
    osmTags: [{ key: 'shop', value: 'agrarian' }, { key: 'shop', value: 'farm' }, { key: 'shop', value: 'pet' }],
  },
  { id: 'distribuidora', label: 'Distribuidora', osmTags: [{ key: 'shop', value: 'wholesale' }] },
  { id: 'depositos', label: 'Depósito de Materiais', osmTags: [{ key: 'shop', value: 'wholesale' }] },
  { id: 'construtoras', label: 'Construtoras', osmTags: [{ key: 'office', value: 'construction_company' }] },
  { id: 'padarias-mercados', label: 'Padarias e Mercados', osmTags: [{ key: 'shop', value: 'bakery' }, { key: 'shop', value: 'convenience' }] },
  { id: 'papelarias', label: 'Papelarias', osmTags: [{ key: 'shop', value: 'stationery' }] },
  { id: 'cosmeticos', label: 'Cosméticos', osmTags: [{ key: 'shop', value: 'cosmetics' }] },
  { id: 'industrias', label: 'Indústrias e Fábricas', osmTags: [{ key: 'man_made', value: 'works' }] },
]

export function findSegment(id: string): Segment | undefined {
  return SEGMENTS.find((s) => s.id === id)
}

export function searchSegments(query: string): Segment[] {
  const q = query.trim().toLowerCase()
  if (!q) return SEGMENTS
  return SEGMENTS.filter((s) => s.label.toLowerCase().includes(q))
}

// Cria um segmento "Outro" a partir de texto livre digitado pelo usuário. Sem uma tag OSM
// conhecida, a busca cai para correspondência pelo nome do local (ver services/places.ts).
export function customSegment(label: string): Segment {
  return { id: `custom-${label.toLowerCase().trim().replace(/\s+/g, '-')}`, label: label.trim(), osmTags: [] }
}
