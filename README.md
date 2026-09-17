# Secretário Comercial

O **copiloto do representante na rua**: geolocalização, prospecção por segmento, roteirização, Street View, navegação, registro de visitas e controle de combustível/despesas — para quem visita empresas e clientes presencialmente, em qualquer segmento B2B (materiais de construção, autopeças, agro, farmácias, distribuidoras, etc).

> Planeje sua rota. Encontre oportunidades. Visite mais clientes. Gaste menos.

Fluxo principal: **Início (resumo do dia) → Minha localização → Segmento → Buscar estabelecimentos → Ver fachada (Street View) → Selecionar → Adicionar clientes/prospects → Criar rota → Otimizar → Iniciar rota → Navegar até cada parada → Registrar visita → Finalizar → Histórico e custos.**

## Identidade

Interface **azul-claro + branco**, mobile-first, com poucas cores adicionais e função visual clara: azul para ações principais, verde para concluído, âmbar para atenção e vermelho para problema/cancelamento.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (estado global, persistido em `localStorage`)
- React Router (navegação por hash)
- React Leaflet + OpenStreetMap (mapa e rotas, sem chave de API)
- Overpass API / OpenStreetMap (busca real de estabelecimentos por segmento, sem chave de API — a cobertura depende do quanto a região está mapeada no OSM)
- Serviços próprios `src/services/streetView.ts` e `src/services/navigation.ts` — abrem o Google Maps (Street View e navegação turn-by-turn) ou o Waze usando apenas latitude/longitude, sem depender de nenhuma API paga
- @hello-pangea/dnd (reordenar paradas da rota)
- vite-plugin-pwa (aplicativo instalável / offline)

Os dados ficam salvos no navegador via `localStorage` (protótipo sem backend — cada dispositivo tem sua própria base). A arquitetura já está organizada em camadas (`components/`, `pages/`, `services/`, `lib/`, `store/`) para facilitar uma futura integração com backend/autenticação.

## Módulos ativos (MVP)

- **Início** — saudação, resumo da operação do dia (visitas planejadas, km, combustível estimado, prospects próximos) e clientes próximos por geolocalização.
- **Buscar** — geolocalização, prospecção por segmento (com categorias predefinidas e segmento personalizado) e mapa com Street View e navegação por marcador.
- **Rota** — construção e otimização de rota (nearest-neighbor + 2-opt), edição de paradas, execução com **Modo Campo** (tela simplificada mostrando só a próxima parada), registro de visita com resultado estruturado (venda realizada, pedido em negociação, proposta enviada, retornar, sem interesse, não atendido, cliente não encontrado, outro) e cálculo de combustível.
- **Salvas** — rotas em andamento, planejadas e concluídas, com totais de distância e combustível.
- **Clientes** — cadastro rápido (inclusive a partir de um prospect encontrado na busca), histórico de visitas e ações de rota/navegação/Street View.
- **Despesas** — lançamento de gastos de campo (combustível, pedágio, estacionamento, alimentação, hospedagem, outros) com totais por categoria e por mês.
- **Configurações** — perfil, dados do veículo (tipo de combustível, consumo médio e preço) e exportação/reset de dados.

## Módulos preservados para o futuro

O projeto nasceu como um CRM completo. Os módulos abaixo continuam em `src/pages/` (Dashboard, Mapa, Agenda, Visitas, Crm, WhatsApp, IaComercial, FollowUps, Pedidos, Produtos, Industrias, Comissoes, Relatorios) e seus tipos/ações continuam no store (`src/store/useAppStore.ts`), mas **não estão roteados nem visíveis na navegação** desta versão.

Também ficam deliberadamente fora da primeira versão (para não inchar o produto antes da hora): tags/etiquetas de clientes, filtros avançados combinados, alerta automático de proximidade (que exigiria rastreamento contínuo de localização), rotas recorrentes por dia da semana e comparação planejado × realizado de quilometragem. São evoluções naturais do módulo de Rotas/Despesas já existente.

## Como rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:5173.

## Build de produção

```bash
npm run build
npm run preview
```

Para publicar em subpasta (ex: GitHub Pages), gere o build com o base path correspondente:

```bash
npm run build -- --base=/nome-do-repositorio/
```
