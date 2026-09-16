# Secretário Comercial

Sistema web/SaaS para representantes comerciais: CRM, clientes, mapa, rotas, agenda, visitas, pedidos, comissões, despesas, WhatsApp e IA comercial com follow-up automático — tudo em uma única plataforma responsiva (desktop, tablet e celular) e instalável como PWA.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (estado global, persistido em `localStorage`)
- React Router (navegação por hash)
- Recharts (gráficos)
- React Leaflet + OpenStreetMap (mapa e rotas)
- @hello-pangea/dnd (Kanban do CRM)
- vite-plugin-pwa (aplicativo instalável / offline)

Os dados são fictícios (seed de demonstração) e ficam salvos no navegador via `localStorage`. Não há backend: WhatsApp, IA comercial e follow-up automático são simulados na interface para demonstrar o fluxo completo.

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

## Módulos

Dashboard, Clientes, Mapa, Rotas, Agenda, Visitas, CRM/Funil, WhatsApp, IA Comercial, Follow-ups, Pedidos, Produtos, Indústrias, Comissões, Despesas, Relatórios e Configurações — acessíveis pelo menu lateral.
