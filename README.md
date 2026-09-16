# Secretário Comercial

MVP focado em **roteirização e visitas para representantes comerciais**: o representante vê onde está, escolhe um segmento para prospectar, encontra estabelecimentos reais próximos, monta e otimiza a rota do dia, acompanha distância e custo de combustível, inicia a rota e registra as visitas realizadas.

Fluxo principal: **Minha localização → Segmento → Buscar estabelecimentos → Selecionar → Adicionar clientes/prospects → Criar rota → Otimizar → Mapa → Combustível → Iniciar rota → Registrar visitas → Finalizar → Histórico.**

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (estado global, persistido em `localStorage`)
- React Router (navegação por hash)
- React Leaflet + OpenStreetMap (mapa e rotas, sem chave de API)
- Overpass API / OpenStreetMap (busca real de estabelecimentos por segmento, sem chave de API — a cobertura depende do quanto a região está mapeada no OSM)
- @hello-pangea/dnd (reordenar paradas da rota)
- vite-plugin-pwa (aplicativo instalável / offline)

Os dados ficam salvos no navegador via `localStorage` (protótipo sem backend — cada dispositivo tem sua própria base).

## Módulos ativos (MVP)

Início, Mapa / Prospecção, Clientes, Rotas, Histórico e Configurações — únicos itens do menu lateral nesta primeira versão.

## Módulos preservados para o futuro

O projeto nasceu como um CRM completo. Os módulos abaixo continuam em `src/pages/` (Dashboard, Mapa, Agenda, Visitas, Crm, WhatsApp, IaComercial, FollowUps, Pedidos, Produtos, Industrias, Comissoes, Despesas, Relatorios) e seus tipos/ações continuam no store (`src/store/useAppStore.ts`), mas **não estão roteados nem visíveis na navegação** desta versão — ficam prontos para serem reativados em `src/App.tsx` quando fizer sentido evoluir o produto.

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
