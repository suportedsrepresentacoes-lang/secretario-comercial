import type { Segment } from '../types'

// Segmentos de prospecção e as tags OpenStreetMap usadas para localizar
// estabelecimentos compatíveis via Overpass API (dados livres, sem chave).
export const SEGMENTS: Segment[] = [
  {
    id: 'material-construcao',
    label: 'Material de construção',
    osmTags: [
      { key: 'shop', value: 'doityourself' },
      { key: 'shop', value: 'hardware' },
      { key: 'shop', value: 'trade' },
    ],
  },
  {
    id: 'ferragens',
    label: 'Loja de ferragens',
    osmTags: [{ key: 'shop', value: 'hardware' }],
  },
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
  {
    id: 'tintas',
    label: 'Tintas',
    osmTags: [{ key: 'shop', value: 'paint' }],
  },
  {
    id: 'forros-acabamentos',
    label: 'Forros e acabamentos',
    osmTags: [
      { key: 'shop', value: 'doityourself' },
      { key: 'shop', value: 'tiles' },
    ],
  },
  {
    id: 'madeireira',
    label: 'Madeireira',
    osmTags: [
      { key: 'shop', value: 'doityourself' },
      { key: 'craft', value: 'carpenter' },
      { key: 'shop', value: 'craft' },
    ],
  },
  {
    id: 'construcao-geral',
    label: 'Materiais para construção em geral',
    osmTags: [
      { key: 'shop', value: 'doityourself' },
      { key: 'shop', value: 'hardware' },
      { key: 'shop', value: 'trade' },
    ],
  },
  {
    id: 'ferramentas',
    label: 'Ferramentas',
    osmTags: [{ key: 'shop', value: 'tool_hire' }],
  },
  {
    id: 'vidracaria',
    label: 'Vidraçaria',
    osmTags: [{ key: 'shop', value: 'glaziery' }],
  },
]

export function findSegment(id: string): Segment | undefined {
  return SEGMENTS.find((s) => s.id === id)
}

export function searchSegments(query: string): Segment[] {
  const q = query.trim().toLowerCase()
  if (!q) return SEGMENTS
  return SEGMENTS.filter((s) => s.label.toLowerCase().includes(q))
}
