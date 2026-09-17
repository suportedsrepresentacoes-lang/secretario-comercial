import { newId } from '../lib/id'
import { addDays } from '../lib/date'
import type {
  Client, Industry, Product, Visit, Opportunity, Order, FollowUp, Conversation, Expense,
} from '../types'

export const HOME_BASE = { lat: -16.6799, lng: -49.255, cidade: 'Goiânia', uf: 'GO' }

const now = new Date()
const iso = (d: Date) => d.toISOString()

export const industries: Industry[] = [
  {
    id: 'ind-ferro-norte',
    nome: 'Metalúrgica Ferro Norte',
    cnpj: '12.345.678/0001-90',
    contatoNome: 'Renata Ávila',
    contatoTelefone: '(62) 3241-5566',
    comissaoPadrao: 6,
    categorias: ['Fechaduras', 'Dobradiças', 'Ferragens'],
    cor: '#3B82F6',
    condicaoPagamento: '30/60/90 dias',
    prazoEntregaDias: 12,
  },
  {
    id: 'ind-parafusos-cia',
    nome: 'Parafusos & Cia Indústria',
    cnpj: '23.456.789/0001-11',
    contatoNome: 'Eduardo Lima',
    contatoTelefone: '(62) 3251-8890',
    comissaoPadrao: 5,
    categorias: ['Parafusos', 'Fixadores', 'Abrasivos'],
    cor: '#16A34A',
    condicaoPagamento: '28 dias',
    prazoEntregaDias: 7,
  },
  {
    id: 'ind-coral-sul',
    nome: 'Tintas Coral Sul',
    cnpj: '34.567.890/0001-22',
    contatoNome: 'Patrícia Nunes',
    contatoTelefone: '(64) 3622-4410',
    comissaoPadrao: 7,
    categorias: ['Tintas', 'Vernizes', 'Solventes'],
    cor: '#5B8DEF',
    condicaoPagamento: '30/45 dias',
    prazoEntregaDias: 15,
  },
  {
    id: 'ind-eletrofix',
    nome: 'EletroFix Componentes',
    cnpj: '45.678.901/0001-33',
    contatoNome: 'Marcos Vinícius',
    contatoTelefone: '(62) 3299-1123',
    comissaoPadrao: 8,
    categorias: ['Elétrica', 'Iluminação'],
    cor: '#9B7FE0',
    condicaoPagamento: '30 dias',
    prazoEntregaDias: 10,
  },
]

export const products: Product[] = [
  { id: newId(), industriaId: 'ind-ferro-norte', nome: 'Fechadura Externa Cromada 40mm', sku: 'FN-1042', categoria: 'Fechaduras', precoTabela: 68.9, unidade: 'un', comissaoPercentual: 6 },
  { id: newId(), industriaId: 'ind-ferro-norte', nome: 'Fechadura Interna Roseta', sku: 'FN-1055', categoria: 'Fechaduras', precoTabela: 42.5, unidade: 'un', comissaoPercentual: 6 },
  { id: newId(), industriaId: 'ind-ferro-norte', nome: 'Dobradiça 3.5" Inox', sku: 'FN-2210', categoria: 'Dobradiças', precoTabela: 9.9, unidade: 'un', comissaoPercentual: 6 },
  { id: newId(), industriaId: 'ind-ferro-norte', nome: 'Dobradiça Reforçada 4"', sku: 'FN-2231', categoria: 'Dobradiças', precoTabela: 14.3, unidade: 'un', comissaoPercentual: 6 },
  { id: newId(), industriaId: 'ind-ferro-norte', nome: 'Trinco de Segurança', sku: 'FN-3301', categoria: 'Ferragens', precoTabela: 22.4, unidade: 'un', comissaoPercentual: 6 },
  { id: newId(), industriaId: 'ind-parafusos-cia', nome: 'Parafuso Chipboard 4x40mm (cx 500)', sku: 'PC-4040', categoria: 'Parafusos', precoTabela: 38.0, unidade: 'cx', comissaoPercentual: 5 },
  { id: newId(), industriaId: 'ind-parafusos-cia', nome: 'Parafuso Drywall 3.5x25mm (cx 1000)', sku: 'PC-3525', categoria: 'Parafusos', precoTabela: 54.9, unidade: 'cx', comissaoPercentual: 5 },
  { id: newId(), industriaId: 'ind-parafusos-cia', nome: 'Bucha de Nylon S6 (cx 250)', sku: 'PC-S6', categoria: 'Fixadores', precoTabela: 19.9, unidade: 'cx', comissaoPercentual: 5 },
  { id: newId(), industriaId: 'ind-parafusos-cia', nome: 'Disco de Corte 7"', sku: 'PC-DC7', categoria: 'Abrasivos', precoTabela: 8.7, unidade: 'un', comissaoPercentual: 5 },
  { id: newId(), industriaId: 'ind-coral-sul', nome: 'Tinta Acrílica Fosca 18L', sku: 'CS-AC18', categoria: 'Tintas', precoTabela: 289.0, unidade: 'lata', comissaoPercentual: 7 },
  { id: newId(), industriaId: 'ind-coral-sul', nome: 'Esmalte Sintético Brilhante 3.6L', sku: 'CS-ES36', categoria: 'Tintas', precoTabela: 112.5, unidade: 'lata', comissaoPercentual: 7 },
  { id: newId(), industriaId: 'ind-coral-sul', nome: 'Verniz Marítimo 3.6L', sku: 'CS-VM36', categoria: 'Vernizes', precoTabela: 98.0, unidade: 'lata', comissaoPercentual: 7 },
  { id: newId(), industriaId: 'ind-coral-sul', nome: 'Thinner 5L', sku: 'CS-TH5', categoria: 'Solventes', precoTabela: 45.3, unidade: 'galão', comissaoPercentual: 7 },
  { id: newId(), industriaId: 'ind-eletrofix', nome: 'Lâmpada LED Bulbo 12W', sku: 'EF-LED12', categoria: 'Iluminação', precoTabela: 11.9, unidade: 'un', comissaoPercentual: 8 },
  { id: newId(), industriaId: 'ind-eletrofix', nome: 'Disjuntor Bipolar 32A', sku: 'EF-DB32', categoria: 'Elétrica', precoTabela: 27.6, unidade: 'un', comissaoPercentual: 8 },
  { id: newId(), industriaId: 'ind-eletrofix', nome: 'Cabo Flexível 2.5mm (rolo 100m)', sku: 'EF-CB25', categoria: 'Elétrica', precoTabela: 189.9, unidade: 'rolo', comissaoPercentual: 8 },
]

function client(partial: Omit<Client, 'id' | 'criadoEm'> & { id?: string }): Client {
  return { id: partial.id ?? newId(), criadoEm: iso(addDays(now, -Math.floor(Math.random() * 240) - 30)), ...partial }
}

export const clients: Client[] = [
  client({
    razaoSocial: 'Mercadinho Bela Vista Ltda',
    nomeFantasia: 'Mercadinho Bela Vista',
    cnpj: '11.222.333/0001-44',
    segmento: 'Mercado / Conveniência',
    status: 'ativo',
    prioridade: 'alta',
    contatos: [{ id: newId(), nome: 'João Pereira', cargo: 'Proprietário', telefone: '(62) 99811-2233', whatsapp: '5562998112233', principal: true }],
    endereco: { logradouro: 'Rua T-27', numero: '450', bairro: 'Setor Bueno', cidade: 'Goiânia', uf: 'GO', lat: -16.7069, lng: -49.2733 },
    industriaIds: ['ind-ferro-norte', 'ind-parafusos-cia'],
    ultimaCompraEm: iso(addDays(now, -12)),
    ultimaVisitaEm: iso(addDays(now, -12)),
  }),
  client({
    razaoSocial: 'Distribuidora Rio Verde Materiais Ltda',
    nomeFantasia: 'Distribuidora Rio Verde',
    cnpj: '22.333.444/0001-55',
    segmento: 'Distribuidor de materiais de construção',
    status: 'ativo',
    prioridade: 'alta',
    contatos: [{ id: newId(), nome: 'Marta Sales', cargo: 'Compras', telefone: '(64) 99655-4321', whatsapp: '5564996554321', principal: true }],
    endereco: { logradouro: 'Av. Presidente Vargas', numero: '1200', bairro: 'Centro', cidade: 'Rio Verde', uf: 'GO', lat: -17.7975, lng: -50.9264 },
    industriaIds: ['ind-ferro-norte', 'ind-eletrofix'],
    ultimaCompraEm: iso(addDays(now, -5)),
    ultimaVisitaEm: iso(addDays(now, -20)),
  }),
  client({
    razaoSocial: 'Ferragens Anápolis Comércio Ltda',
    nomeFantasia: 'Ferragens Anápolis',
    cnpj: '33.444.555/0001-66',
    segmento: 'Loja de ferragens',
    status: 'inativo',
    prioridade: 'media',
    contatos: [{ id: newId(), nome: 'Carlos Nunes', cargo: 'Gerente', telefone: '(62) 99722-8899', whatsapp: '5562997228899', principal: true }],
    endereco: { logradouro: 'Av. Brasil Norte', numero: '880', bairro: 'Jundiaí', cidade: 'Anápolis', uf: 'GO', lat: -16.3281, lng: -48.9531 },
    industriaIds: ['ind-ferro-norte'],
    ultimaCompraEm: iso(addDays(now, -65)),
    ultimaVisitaEm: iso(addDays(now, -65)),
  }),
  client({
    razaoSocial: 'Casa & Construção GO Ltda',
    nomeFantasia: 'Casa & Construção GO',
    cnpj: '44.555.666/0001-77',
    segmento: 'Home center',
    status: 'inativo',
    prioridade: 'media',
    contatos: [{ id: newId(), nome: 'Fernanda Costa', cargo: 'Compradora', telefone: '(62) 99633-1122', whatsapp: '5562996331122', principal: true }],
    endereco: { logradouro: 'Av. Goiás', numero: '2340', bairro: 'Centro', cidade: 'Aparecida de Goiânia', uf: 'GO', lat: -16.8233, lng: -49.2437 },
    industriaIds: ['ind-coral-sul', 'ind-parafusos-cia'],
    ultimaCompraEm: iso(addDays(now, -41)),
    ultimaVisitaEm: iso(addDays(now, -41)),
  }),
  client({
    razaoSocial: 'Lojão do Parafuso Ltda',
    nomeFantasia: 'Lojão do Parafuso',
    cnpj: '55.666.777/0001-88',
    segmento: 'Loja de ferragens',
    status: 'perdido',
    prioridade: 'baixa',
    contatos: [{ id: newId(), nome: 'Roberto Dias', cargo: 'Proprietário', telefone: '(62) 99544-7766', whatsapp: '5562995447766', principal: true }],
    endereco: { logradouro: 'Rua 44', numero: '120', bairro: 'Setor Central', cidade: 'Trindade', uf: 'GO', lat: -16.6499, lng: -49.4889 },
    industriaIds: ['ind-parafusos-cia'],
    ultimaCompraEm: iso(addDays(now, -88)),
    observacoes: 'Migrou para concorrente com prazo maior.',
  }),
  client({
    razaoSocial: 'Construmax Materiais de Construção Ltda',
    nomeFantasia: 'Construmax',
    cnpj: '66.777.888/0001-99',
    segmento: 'Home center',
    status: 'ativo',
    prioridade: 'alta',
    contatos: [{ id: newId(), nome: 'Juliana Prado', cargo: 'Compras', telefone: '(62) 99877-3344', whatsapp: '5562998773344', principal: true }],
    endereco: { logradouro: 'Av. Perimetral Norte', numero: '3400', bairro: 'Vila João Vaz', cidade: 'Goiânia', uf: 'GO', lat: -16.6231, lng: -49.2841 },
    industriaIds: ['ind-ferro-norte', 'ind-coral-sul', 'ind-eletrofix'],
    ultimaCompraEm: iso(addDays(now, -3)),
    ultimaVisitaEm: iso(addDays(now, -9)),
  }),
  client({
    razaoSocial: 'Elétrica Senador Ltda',
    nomeFantasia: 'Elétrica Senador',
    cnpj: '77.888.999/0001-10',
    segmento: 'Loja de material elétrico',
    status: 'novo',
    prioridade: 'alta',
    contatos: [{ id: newId(), nome: 'André Bittencourt', cargo: 'Sócio', telefone: '(62) 99311-5588', whatsapp: '5562993115588', principal: true }],
    endereco: { logradouro: 'Av. Perimetral', numero: '560', bairro: 'Centro', cidade: 'Senador Canedo', uf: 'GO', lat: -16.701, lng: -49.0937 },
    industriaIds: ['ind-eletrofix'],
    ultimaCompraEm: iso(addDays(now, -8)),
    ultimaVisitaEm: iso(addDays(now, -8)),
  }),
  client({
    razaoSocial: 'Pintou Bem Tintas e Acessórios Ltda',
    nomeFantasia: 'Pintou Bem',
    cnpj: '88.999.000/0001-21',
    segmento: 'Loja de tintas',
    status: 'potencial',
    prioridade: 'media',
    contatos: [{ id: newId(), nome: 'Simone Alves', cargo: 'Proprietária', telefone: '(62) 99244-9911', whatsapp: '5562992449911', principal: true }],
    endereco: { logradouro: 'Rua Goiânia', numero: '77', bairro: 'Centro', cidade: 'Goianira', uf: 'GO', lat: -16.5286, lng: -49.4267 },
    industriaIds: ['ind-coral-sul'],
  }),
  client({
    razaoSocial: 'Depósito Inhumas Construção Ltda',
    nomeFantasia: 'Depósito Inhumas',
    cnpj: '99.000.111/0001-32',
    segmento: 'Depósito de materiais',
    status: 'lead',
    prioridade: 'media',
    contatos: [{ id: newId(), nome: 'Wellington Moura', cargo: 'Comprador', telefone: '(62) 99155-3300', whatsapp: '5562991553300', principal: true }],
    endereco: { logradouro: 'Av. Contorno', numero: '900', bairro: 'Centro', cidade: 'Inhumas', uf: 'GO', lat: -16.3597, lng: -49.4956 },
    industriaIds: [],
  }),
  client({
    razaoSocial: 'Ferro & Cia Ferragens Ltda',
    nomeFantasia: 'Ferro & Cia',
    cnpj: '10.111.222/0001-43',
    segmento: 'Loja de ferragens',
    status: 'ativo',
    prioridade: 'media',
    contatos: [{ id: newId(), nome: 'Paulo Henrique', cargo: 'Gerente', telefone: '(62) 99688-2211', whatsapp: '5562996882211', principal: true }],
    endereco: { logradouro: 'Rua 90', numero: '215', bairro: 'Setor Sul', cidade: 'Goiânia', uf: 'GO', lat: -16.6989, lng: -49.2547 },
    industriaIds: ['ind-ferro-norte', 'ind-parafusos-cia'],
    ultimaCompraEm: iso(addDays(now, -18)),
    ultimaVisitaEm: iso(addDays(now, -18)),
  }),
  client({
    razaoSocial: 'Obra Fácil Materiais Ltda',
    nomeFantasia: 'Obra Fácil',
    cnpj: '20.222.333/0001-54',
    segmento: 'Home center',
    status: 'potencial',
    prioridade: 'alta',
    contatos: [{ id: newId(), nome: 'Kelly Ferreira', cargo: 'Compradora', telefone: '(62) 99433-6677', whatsapp: '5562994336677', principal: true }],
    endereco: { logradouro: 'Av. T-63', numero: '1500', bairro: 'Setor Bueno', cidade: 'Goiânia', uf: 'GO', lat: -16.7145, lng: -49.2685 },
    industriaIds: ['ind-eletrofix', 'ind-coral-sul'],
    observacoes: 'Orçamento em aberto de iluminação — decisão prevista para o fim do mês.',
  }),
  client({
    razaoSocial: 'Aparecida Ferragens e Tintas Ltda',
    nomeFantasia: 'Aparecida Ferragens',
    cnpj: '30.333.444/0001-65',
    segmento: 'Loja de ferragens',
    status: 'ativo',
    prioridade: 'baixa',
    contatos: [{ id: newId(), nome: 'Sérgio Melo', cargo: 'Proprietário', telefone: '(62) 99522-4433', whatsapp: '5562995224433', principal: true }],
    endereco: { logradouro: 'Av. Independência', numero: '650', bairro: 'Jardim Tiradentes', cidade: 'Aparecida de Goiânia', uf: 'GO', lat: -16.8412, lng: -49.2701 },
    industriaIds: ['ind-ferro-norte', 'ind-coral-sul'],
    ultimaCompraEm: iso(addDays(now, -27)),
    ultimaVisitaEm: iso(addDays(now, -27)),
  }),
  client({
    razaoSocial: 'Rio Verde Elétrica Distribuidora Ltda',
    nomeFantasia: 'Rio Verde Elétrica',
    cnpj: '40.444.555/0001-76',
    segmento: 'Distribuidor de material elétrico',
    status: 'novo',
    prioridade: 'media',
    contatos: [{ id: newId(), nome: 'Bianca Rezende', cargo: 'Compras', telefone: '(64) 99277-8811', whatsapp: '5564992778811', principal: true }],
    endereco: { logradouro: 'Rod. BR-060, km 4', bairro: 'Distrito Industrial', cidade: 'Rio Verde', uf: 'GO', lat: -17.79, lng: -50.9401 },
    industriaIds: ['ind-eletrofix'],
    ultimaCompraEm: iso(addDays(now, -15)),
  }),
  client({
    razaoSocial: 'Trindade Materiais Básicos Ltda',
    nomeFantasia: 'Trindade Materiais',
    cnpj: '50.555.666/0001-87',
    segmento: 'Depósito de materiais',
    status: 'lead',
    prioridade: 'baixa',
    contatos: [{ id: newId(), nome: 'Douglas Amorim', cargo: 'Comprador', telefone: '(62) 99911-2200', whatsapp: '5562999112200', principal: true }],
    endereco: { logradouro: 'Av. Urias Magalhães', numero: '310', bairro: 'Centro', cidade: 'Trindade', uf: 'GO', lat: -16.6558, lng: -49.4903 },
    industriaIds: [],
  }),
]

function byName(fantasia: string): Client {
  const c = clients.find((c) => c.nomeFantasia === fantasia)
  if (!c) throw new Error(`client not found: ${fantasia}`)
  return c
}

export const visits: Visit[] = [
  { id: newId(), clientId: byName('Mercadinho Bela Vista').id, dataHora: iso(addDays(now, 0.2)), status: 'agendada', criadoEm: iso(addDays(now, -3)), proximaAcao: 'Levar tabela nova de fechaduras' },
  { id: newId(), clientId: byName('Distribuidora Rio Verde').id, dataHora: iso(addDays(now, 0.35)), status: 'agendada', criadoEm: iso(addDays(now, -2)), proximaAcao: 'Confirmar pedido de dobradiças' },
  { id: newId(), clientId: byName('Ferragens Anápolis').id, dataHora: iso(addDays(now, 1)), status: 'agendada', criadoEm: iso(addDays(now, -1)), proximaAcao: 'Reativação — 65 dias sem comprar' },
  { id: newId(), clientId: byName('Construmax').id, dataHora: iso(addDays(now, 2)), status: 'agendada', criadoEm: iso(addDays(now, -1)) },
  { id: newId(), clientId: byName('Elétrica Senador').id, dataHora: iso(addDays(now, 2.3)), status: 'agendada', criadoEm: iso(addDays(now, -1)) },
  { id: newId(), clientId: byName('Ferro & Cia').id, dataHora: iso(addDays(now, -18)), status: 'realizada', criadoEm: iso(addDays(now, -20)), resultado: 'Pedido fechado de ferragens', produtosApresentadosIds: [products[0].id, products[2].id], proximaAcao: 'Follow-up em 30 dias' },
  { id: newId(), clientId: byName('Aparecida Ferragens').id, dataHora: iso(addDays(now, -27)), status: 'realizada', criadoEm: iso(addDays(now, -29)), resultado: 'Cliente comprou linha de tintas', produtosApresentadosIds: [products[9].id] },
  { id: newId(), clientId: byName('Casa & Construção GO').id, dataHora: iso(addDays(now, -41)), status: 'realizada', criadoEm: iso(addDays(now, -43)), resultado: 'Sem pedido — negociando prazo', proximaAcao: 'Retornar com condição especial' },
]

export const opportunities: Opportunity[] = [
  { id: newId(), clientId: byName('Depósito Inhumas').id, titulo: 'Primeira compra — linha de ferragens', valorEstimado: 3200, etapa: 'novo_lead', criadoEm: iso(addDays(now, -6)), atualizadoEm: iso(addDays(now, -6)) },
  { id: newId(), clientId: byName('Trindade Materiais').id, titulo: 'Abertura de conta — parafusos', valorEstimado: 1800, etapa: 'novo_lead', criadoEm: iso(addDays(now, -4)), atualizadoEm: iso(addDays(now, -4)) },
  { id: newId(), clientId: byName('Pintou Bem').id, titulo: 'Linha completa de tintas Coral Sul', valorEstimado: 5400, etapa: 'primeiro_contato', industriaId: 'ind-coral-sul', criadoEm: iso(addDays(now, -10)), atualizadoEm: iso(addDays(now, -2)) },
  { id: newId(), clientId: byName('Rio Verde Elétrica').id, titulo: 'Reposição de disjuntores e cabos', valorEstimado: 7600, etapa: 'interessado', industriaId: 'ind-eletrofix', criadoEm: iso(addDays(now, -14)), atualizadoEm: iso(addDays(now, -3)) },
  { id: newId(), clientId: byName('Elétrica Senador').id, titulo: 'Kit iluminação LED loja nova', valorEstimado: 4200, etapa: 'interessado', industriaId: 'ind-eletrofix', criadoEm: iso(addDays(now, -9)), atualizadoEm: iso(addDays(now, -1)) },
  { id: newId(), clientId: byName('Obra Fácil').id, titulo: 'Orçamento iluminação obra comercial', valorEstimado: 12800, etapa: 'orcamento_enviado', industriaId: 'ind-eletrofix', criadoEm: iso(addDays(now, -16)), atualizadoEm: iso(addDays(now, -4)) },
  { id: newId(), clientId: byName('Casa & Construção GO').id, titulo: 'Negociação de prazo — linha de tintas', valorEstimado: 6100, etapa: 'negociacao', industriaId: 'ind-coral-sul', criadoEm: iso(addDays(now, -22)), atualizadoEm: iso(addDays(now, -5)) },
  { id: newId(), clientId: byName('Construmax').id, titulo: 'Reposição trimestral completa', valorEstimado: 15300, etapa: 'negociacao', criadoEm: iso(addDays(now, -20)), atualizadoEm: iso(addDays(now, -2)) },
  { id: newId(), clientId: byName('Ferro & Cia').id, titulo: 'Pedido fechaduras + dobradiças', valorEstimado: 2400, etapa: 'venda_realizada', industriaId: 'ind-ferro-norte', criadoEm: iso(addDays(now, -25)), atualizadoEm: iso(addDays(now, -18)) },
  { id: newId(), clientId: byName('Lojão do Parafuso').id, titulo: 'Renovação de contrato anual', valorEstimado: 9000, etapa: 'perdido', criadoEm: iso(addDays(now, -60)), atualizadoEm: iso(addDays(now, -30)), observacoes: 'Perdido para concorrente com prazo maior.' },
]

export const orders: Order[] = [
  { id: newId(), numero: 'PED-1042', clientId: byName('Ferro & Cia').id, industriaId: 'ind-ferro-norte', status: 'faturado', dataCriacao: iso(addDays(now, -18)), comissaoPercentual: 6, itens: [{ productId: products[0].id, quantidade: 20, precoUnitario: 68.9 }, { productId: products[2].id, quantidade: 60, precoUnitario: 9.9 }] },
  { id: newId(), numero: 'PED-1043', clientId: byName('Aparecida Ferragens').id, industriaId: 'ind-coral-sul', status: 'faturado', dataCriacao: iso(addDays(now, -27)), comissaoPercentual: 7, itens: [{ productId: products[9].id, quantidade: 10, precoUnitario: 289.0 }] },
  { id: newId(), numero: 'PED-1044', clientId: byName('Distribuidora Rio Verde').id, industriaId: 'ind-eletrofix', status: 'aprovado', dataCriacao: iso(addDays(now, -5)), comissaoPercentual: 8, itens: [{ productId: products[14].id, quantidade: 15, precoUnitario: 27.6 }, { productId: products[13].id, quantidade: 200, precoUnitario: 11.9 }] },
  { id: newId(), numero: 'PED-1045', clientId: byName('Construmax').id, industriaId: 'ind-ferro-norte', status: 'enviado', dataCriacao: iso(addDays(now, -3)), comissaoPercentual: 6, itens: [{ productId: products[1].id, quantidade: 30, precoUnitario: 42.5 }] },
  { id: newId(), numero: 'PED-1046', clientId: byName('Mercadinho Bela Vista').id, industriaId: 'ind-parafusos-cia', status: 'faturado', dataCriacao: iso(addDays(now, -12)), comissaoPercentual: 5, itens: [{ productId: products[5].id, quantidade: 8, precoUnitario: 38.0 }] },
  { id: newId(), numero: 'PED-1047', clientId: byName('Elétrica Senador').id, industriaId: 'ind-eletrofix', status: 'aprovado', dataCriacao: iso(addDays(now, -8)), comissaoPercentual: 8, itens: [{ productId: products[15].id, quantidade: 3, precoUnitario: 189.9 }] },
  { id: newId(), numero: 'PED-1048', clientId: byName('Rio Verde Elétrica').id, industriaId: 'ind-eletrofix', status: 'rascunho', dataCriacao: iso(addDays(now, -1)), comissaoPercentual: 8, itens: [{ productId: products[14].id, quantidade: 40, precoUnitario: 27.6 }] },
  { id: newId(), numero: 'PED-1049', clientId: byName('Construmax').id, industriaId: 'ind-coral-sul', status: 'faturado', dataCriacao: iso(addDays(now, -33)), comissaoPercentual: 7, itens: [{ productId: products[10].id, quantidade: 12, precoUnitario: 112.5 }] },
  { id: newId(), numero: 'PED-1050', clientId: byName('Ferro & Cia').id, industriaId: 'ind-parafusos-cia', status: 'faturado', dataCriacao: iso(addDays(now, -50)), comissaoPercentual: 5, itens: [{ productId: products[6].id, quantidade: 6, precoUnitario: 54.9 }] },
]

export const followUps: FollowUp[] = [
  { id: newId(), clientId: byName('Mercadinho Bela Vista').id, contexto: 'Retorno sobre orçamento de fechaduras enviado na visita.', dataAgendada: iso(addDays(now, 0.25)), criadoEm: iso(addDays(now, -3)), status: 'pendente', origem: 'manual' },
  { id: newId(), clientId: byName('Distribuidora Rio Verde').id, contexto: 'Confirmar pedido de dobradiças aprovado por telefone.', dataAgendada: iso(addDays(now, 0.4)), criadoEm: iso(addDays(now, -2)), status: 'pendente', origem: 'whatsapp' },
  { id: newId(), clientId: byName('Ferragens Anápolis').id, contexto: '65 dias sem comprar — reativação de conta.', dataAgendada: iso(addDays(now, 1)), criadoEm: iso(addDays(now, -1)), status: 'pendente', origem: 'ia' },
  { id: newId(), clientId: byName('Casa & Construção GO').id, contexto: 'Cliente pediu para retornar em 30 dias com nova condição de prazo.', dataAgendada: iso(addDays(now, -2)), criadoEm: iso(addDays(now, -32)), status: 'atrasado', origem: 'manual' },
  { id: newId(), clientId: byName('Obra Fácil').id, contexto: 'Aguardar decisão do orçamento de iluminação até o fim do mês.', dataAgendada: iso(addDays(now, 5)), criadoEm: iso(addDays(now, -4)), status: 'pendente', origem: 'ia' },
  { id: newId(), clientId: byName('Lojão do Parafuso').id, contexto: 'Tentativa final de resgate antes de marcar como perdido.', dataAgendada: iso(addDays(now, -15)), criadoEm: iso(addDays(now, -45)), status: 'concluido', origem: 'manual', resultado: 'Cliente confirmou migração para concorrente. Oportunidade marcada como perdida.' },
]

export const conversations: Conversation[] = [
  {
    id: newId(),
    clientId: byName('Mercadinho Bela Vista').id,
    naoLidas: 1,
    mensagens: [
      { id: newId(), autor: 'representante', texto: 'Bom dia, João! Consegui a tabela nova de fechaduras, posso passar aí hoje à tarde?', hora: iso(addDays(now, -0.4)) },
      { id: newId(), autor: 'cliente', texto: 'Bom dia Diego! Pode sim, estarei aqui até as 18h.', hora: iso(addDays(now, -0.35)) },
      { id: newId(), autor: 'cliente', texto: 'Aproveita e já traz um orçamento de dobradiças também', hora: iso(addDays(now, -0.1)) },
    ],
  },
  {
    id: newId(),
    clientId: byName('Distribuidora Rio Verde').id,
    naoLidas: 0,
    mensagens: [
      { id: newId(), autor: 'representante', texto: 'Marta, o pedido das dobradiças já está aprovado na fábrica, chega em até 12 dias úteis.', hora: iso(addDays(now, -1)) },
      { id: newId(), autor: 'cliente', texto: 'Perfeito, pode faturar!', hora: iso(addDays(now, -0.9)) },
    ],
  },
  {
    id: newId(),
    clientId: byName('Ferragens Anápolis').id,
    naoLidas: 2,
    mensagens: [
      { id: newId(), autor: 'representante', texto: 'Carlos, faz tempo que não passo aí! Como estão os estoques de fechaduras?', hora: iso(addDays(now, -1.2)) },
      { id: newId(), autor: 'cliente', texto: 'Oi Diego, tudo bem. Estamos precisando repor sim, bastante coisa em falta', hora: iso(addDays(now, -1.1)) },
      { id: newId(), autor: 'cliente', texto: 'Pode passar amanhã de manhã?', hora: iso(addDays(now, -1)) },
    ],
  },
  {
    id: newId(),
    clientId: byName('Obra Fácil').id,
    naoLidas: 0,
    mensagens: [
      { id: newId(), autor: 'representante', texto: 'Kelly, o orçamento de iluminação já está com vocês, qualquer dúvida me chama.', hora: iso(addDays(now, -4)) },
      { id: newId(), autor: 'cliente', texto: 'Obrigada! Vamos decidir até o fim do mês.', hora: iso(addDays(now, -3.8)) },
    ],
  },
]

export const expenses: Expense[] = [
  { id: newId(), data: iso(addDays(now, -1)), categoria: 'combustivel', valor: 180, descricao: 'Abastecimento — rota Goiânia/Anápolis' },
  { id: newId(), data: iso(addDays(now, -2)), categoria: 'alimentacao', valor: 42, descricao: 'Almoço — visita Rio Verde' },
  { id: newId(), data: iso(addDays(now, -2)), categoria: 'hospedagem', valor: 165, descricao: 'Hotel Rio Verde' },
  { id: newId(), data: iso(addDays(now, -5)), categoria: 'pedagio', valor: 28.4, descricao: 'Pedágio BR-060' },
  { id: newId(), data: iso(addDays(now, -9)), categoria: 'manutencao', valor: 320, descricao: 'Troca de óleo e revisão' },
  { id: newId(), data: iso(addDays(now, -14)), categoria: 'combustivel', valor: 210, descricao: 'Abastecimento — rota Trindade/Inhumas' },
  { id: newId(), data: iso(addDays(now, -20)), categoria: 'alimentacao', valor: 38, descricao: 'Almoço — visita Construmax' },
]
