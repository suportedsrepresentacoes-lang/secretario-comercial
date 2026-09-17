import type { Client, Expense } from '../types'

export const HOME_BASE = { lat: -16.6799, lng: -49.255, cidade: 'Goiânia', uf: 'GO' }

const now = new Date()
function daysAgoISO(days: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function client(partial: Omit<Client, 'id' | 'criadoEm' | 'tags'> & { id: string; tags?: string[] }): Client {
  return { criadoEm: daysAgoISO(60 + Math.floor(Math.random() * 200)), tags: [], ...partial }
}

export const clients: Client[] = [
  client({
    id: 'cli-bela-vista',
    nomeFantasia: 'Mercadinho Bela Vista',
    razaoSocial: 'Mercadinho Bela Vista Ltda',
    cnpj: '11.222.333/0001-44',
    segmento: 'Mercado / Conveniência',
    status: 'ativo',
    telefone: '(62) 99811-2233',
    whatsapp: '5562998112233',
    endereco: { logradouro: 'Rua T-27', numero: '450', bairro: 'Setor Bueno', cidade: 'Goiânia', uf: 'GO', lat: -16.7069, lng: -49.2733 },
    tags: ['prioridade'],
    ultimaVisitaEm: daysAgoISO(12),
  }),
  client({
    id: 'cli-rio-verde',
    nomeFantasia: 'Distribuidora Rio Verde',
    razaoSocial: 'Distribuidora Rio Verde Materiais Ltda',
    cnpj: '22.333.444/0001-55',
    segmento: 'Distribuidor de materiais de construção',
    status: 'ativo',
    telefone: '(64) 99655-4321',
    whatsapp: '5564996554321',
    endereco: { logradouro: 'Av. Presidente Vargas', numero: '1200', bairro: 'Centro', cidade: 'Rio Verde', uf: 'GO', lat: -17.7975, lng: -50.9264 },
    tags: ['atacado'],
    ultimaVisitaEm: daysAgoISO(20),
  }),
  client({
    id: 'cli-ferragens-anapolis',
    nomeFantasia: 'Ferragens Anápolis',
    razaoSocial: 'Ferragens Anápolis Comércio Ltda',
    cnpj: '33.444.555/0001-66',
    segmento: 'Loja de ferragens',
    status: 'retorno',
    telefone: '(62) 99722-8899',
    whatsapp: '5562997228899',
    endereco: { logradouro: 'Av. Brasil Norte', numero: '880', bairro: 'Jundiaí', cidade: 'Anápolis', uf: 'GO', lat: -16.3281, lng: -48.9531 },
    tags: ['retorno'],
    ultimaVisitaEm: daysAgoISO(65),
  }),
  client({
    id: 'cli-casa-construcao',
    nomeFantasia: 'Casa & Construção GO',
    razaoSocial: 'Casa & Construção GO Ltda',
    cnpj: '44.555.666/0001-77',
    segmento: 'Home center',
    status: 'inativo',
    telefone: '(62) 99633-1122',
    whatsapp: '5562996331122',
    endereco: { logradouro: 'Av. Goiás', numero: '2340', bairro: 'Centro', cidade: 'Aparecida de Goiânia', uf: 'GO', lat: -16.8233, lng: -49.2437 },
    tags: [],
    ultimaVisitaEm: daysAgoISO(41),
  }),
  client({
    id: 'cli-construmax',
    nomeFantasia: 'Construmax',
    razaoSocial: 'Construmax Materiais de Construção Ltda',
    cnpj: '66.777.888/0001-99',
    segmento: 'Home center',
    status: 'ativo',
    telefone: '(62) 99877-3344',
    whatsapp: '5562998773344',
    endereco: { logradouro: 'Av. Perimetral Norte', numero: '3400', bairro: 'Vila João Vaz', cidade: 'Goiânia', uf: 'GO', lat: -16.6231, lng: -49.2841 },
    tags: ['grande-cliente', 'prioridade'],
    ultimaVisitaEm: daysAgoISO(9),
  }),
  client({
    id: 'cli-eletrica-senador',
    nomeFantasia: 'Elétrica Senador',
    razaoSocial: 'Elétrica Senador Ltda',
    cnpj: '77.888.999/0001-10',
    segmento: 'Loja de material elétrico',
    status: 'prospect',
    telefone: '(62) 99311-5588',
    whatsapp: '5562993115588',
    endereco: { logradouro: 'Av. Perimetral', numero: '560', bairro: 'Centro', cidade: 'Senador Canedo', uf: 'GO', lat: -16.701, lng: -49.0937 },
    tags: ['potencial'],
  }),
  client({
    id: 'cli-pintou-bem',
    nomeFantasia: 'Pintou Bem',
    razaoSocial: 'Pintou Bem Tintas e Acessórios Ltda',
    cnpj: '88.999.000/0001-21',
    segmento: 'Loja de tintas',
    status: 'prospect',
    telefone: '(62) 99244-9911',
    whatsapp: '5562992449911',
    endereco: { logradouro: 'Rua Goiânia', numero: '77', bairro: 'Centro', cidade: 'Goianira', uf: 'GO', lat: -16.5286, lng: -49.4267 },
    tags: ['potencial'],
  }),
  client({
    id: 'cli-lojao-parafuso',
    nomeFantasia: 'Lojão do Parafuso',
    razaoSocial: 'Lojão do Parafuso Ltda',
    cnpj: '55.666.777/0001-88',
    segmento: 'Loja de ferragens',
    status: 'sem_interesse',
    telefone: '(62) 99544-7766',
    whatsapp: '5562995447766',
    endereco: { logradouro: 'Rua 44', numero: '120', bairro: 'Setor Central', cidade: 'Trindade', uf: 'GO', lat: -16.6499, lng: -49.4889 },
    tags: [],
    observacoes: 'Migrou para concorrente com prazo maior.',
  }),
]

export const expenses: Expense[] = [
  { id: 'exp-1', data: daysAgoISO(1), categoria: 'combustivel', valor: 180, descricao: 'Abastecimento — rota Goiânia/Anápolis' },
  { id: 'exp-2', data: daysAgoISO(2), categoria: 'alimentacao', valor: 42, descricao: 'Almoço — visita Rio Verde' },
  { id: 'exp-3', data: daysAgoISO(2), categoria: 'hospedagem', valor: 165, descricao: 'Hotel Rio Verde' },
  { id: 'exp-4', data: daysAgoISO(5), categoria: 'pedagio', valor: 28.4, descricao: 'Pedágio BR-060' },
  { id: 'exp-5', data: daysAgoISO(14), categoria: 'combustivel', valor: 210, descricao: 'Abastecimento — rota Trindade/Inhumas' },
  { id: 'exp-6', data: daysAgoISO(20), categoria: 'alimentacao', valor: 38, descricao: 'Almoço — visita Construmax' },
]
