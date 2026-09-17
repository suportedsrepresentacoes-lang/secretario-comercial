# CAMPOVISTA — CÓDIGO COMPLETO

Exportação fiel do estado atual do projeto (branch `main`, commit `9feb902`), gerada para uso no Google AI Studio ou qualquer outro ambiente.

> Cada arquivo abaixo é delimitado com til triplo (em vez de crase tripla) porque alguns arquivos do projeto (ex: README.md) já contêm blocos de código internos com crase tripla — usar o mesmo delimitador quebraria a formatação.

## ESTRUTURA DO PROJETO

~~~text
.github/workflows/deploy-pages.yml
.gitignore
.oxlintrc.json
README.md
index.html
package.json
public/.nojekyll
public/favicon.svg
public/pwa-192.png
public/pwa-512.png
src/App.tsx
src/components/layout/NavBar.tsx
src/components/layout/Shell.tsx
src/components/ui/Badge.tsx
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Field.tsx
src/components/ui/LocationButtons.tsx
src/components/ui/Sheet.tsx
src/components/ui/StatTile.tsx
src/data/seed.ts
src/data/segments.ts
src/index.css
src/lib/format.ts
src/lib/labels.ts
src/main.tsx
src/pages/Buscar.tsx
src/pages/Clientes.tsx
src/pages/Configuracoes.tsx
src/pages/Despesas.tsx
src/pages/Historico.tsx
src/pages/Home.tsx
src/pages/Relatorio.tsx
src/pages/Rotas.tsx
src/services/geocoding.ts
src/services/geolocation.ts
src/services/navigation.ts
src/services/places.ts
src/services/routing.ts
src/services/streetView.ts
src/store/appStore.ts
src/types/client.ts
src/types/expense.ts
src/types/index.ts
src/types/prospecting.ts
src/types/route.ts
src/types/vehicle.ts
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
~~~

> `package-lock.json` não está listado no conteúdo abaixo (é gerado automaticamente por `npm install` a partir do `package.json` — não deve ser copiado manualmente entre ambientes). `public/pwa-192.png` e `public/pwa-512.png` são imagens binárias (ícones do PWA) e também não entram como texto — veja a seção de pontos de atenção no fim.

## FILE: .github/workflows/deploy-pages.yml

~~~yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build -- --base=/secretario-comercial/

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist

~~~

## FILE: .gitignore

~~~
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

.claude/

.claude/

~~~

## FILE: .oxlintrc.json

~~~json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}

~~~

## FILE: README.md

~~~markdown
# CampoVista

O **copiloto do representante em campo**: geolocalização, prospecção por segmento, roteirização, Street View, navegação, registro de visitas e controle de combustível/despesas — para quem visita empresas e clientes presencialmente, em qualquer segmento B2B (materiais de construção, autopeças, agro, farmácias, distribuidoras, etc).

> Planeje sua rota. Encontre oportunidades. Visite mais clientes. Gaste menos.

Fluxo principal: **Início (resumo do dia) → Minha localização → Segmento → Buscar estabelecimentos → Ver fachada (Street View) → Selecionar → Adicionar clientes/prospects → Criar rota → Otimizar → Iniciar rota → Navegar até cada parada → Registrar visita → Finalizar → Histórico, despesas e relatório do dia.**

## Identidade

Interface **azul-claro + branco**, mobile-first, com poucas cores adicionais e função visual clara: azul para ações principais, verde para concluído, âmbar para atenção e vermelho para problema/cancelamento.

## Stack e arquitetura

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (tokens de cor em `src/index.css`)
- Zustand (estado global único, persistido em `localStorage`)
- React Router (navegação por hash)
- React Leaflet + OpenStreetMap (mapa e rotas, sem chave de API)
- Overpass API / OpenStreetMap (busca real de estabelecimentos por segmento — a cobertura depende do quanto a região está mapeada no OSM)
- @hello-pangea/dnd (reordenar paradas da rota)
- vite-plugin-pwa (aplicativo instalável / offline)

Arquitetura modular, separando claramente cada responsabilidade:

```
src/
  types/        modelo de dados (cliente, rota, despesa, veículo, prospecção)
  services/     geolocalização, geocodificação, busca de lugares (Overpass),
                roteirização/otimização, Street View, navegação — cada um
                isolado e reutilizável, sem depender de nenhuma API paga
  store/        estado global (Zustand), persistido no dispositivo
  data/         segmentos de prospecção e dados de demonstração
  lib/          formatação e rótulos/cores compartilhados
  components/   layout (topo/navegação) e UI genérica (botão, card, sheet…)
  pages/        cada tela do produto
```

Os dados ficam salvos no navegador via `localStorage` — protótipo sem backend, cada dispositivo tem sua própria base. A separação em camadas acima facilita trocar essa persistência por um backend/autenticação no futuro sem reescrever as telas.

## Módulos

- **Início** — saudação, resumo da operação do dia (visitas planejadas, km, combustível estimado, prospects próximos) e clientes próximos por geolocalização.
- **Buscar** — geolocalização, prospecção por segmento (categorias predefinidas + segmento personalizado) e mapa com Street View e navegação por marcador.
- **Rotas** — construção e otimização de rota (nearest-neighbor + 2-opt), edição de paradas, execução com **Modo Campo** (tela simplificada mostrando só a próxima parada), registro de visita com resultado estruturado (venda realizada, pedido em negociação, proposta enviada, retornar, sem interesse, não atendido, cliente não encontrado, outro), locais favoritos como ponto de partida (casa/escritório) e cálculo de combustível.
- **Histórico** — rotas em andamento, planejadas e concluídas, com totais de distância e combustível.
- **Clientes** — cadastro rápido (inclusive a partir de um prospect encontrado na busca), tags/etiquetas, filtro por status e por tag, histórico de visitas e ações de rota/navegação/Street View.
- **Despesas** — lançamento de gastos de campo (combustível, pedágio, estacionamento, alimentação, hospedagem, outros) com totais por categoria e por mês.
- **Relatório** — resumo do dia: visitas realizadas/pendentes/retornos, quilometragem planejada x realizada, combustível estimado x gasto real, custo total da operação, prospects encontrados e clientes cadastrados.
- **Configurações** — perfil, dados do veículo (tipo de combustível, consumo médio e preço), locais favoritos e exportação/reset de dados.

## Fora do escopo desta primeira versão

Para não transformar o produto num ERP/CRM gigantesco antes da hora: filtros combinados avançados (ex. distância + tags + segmento ao mesmo tempo), alerta automático de proximidade (exigiria rastreamento contínuo de localização, evitado de propósito) e rotas recorrentes por dia da semana. São evoluções naturais dos módulos de Clientes/Rotas já existentes.

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

~~~

## FILE: index.html

~~~html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#3B82F6" />
    <meta name="description" content="CampoVista — o copiloto do representante em campo: geolocalização, prospecção por segmento, roteirização, Street View, navegação, registro de visitas e controle de combustível e despesas." />
    <link rel="apple-touch-icon" href="%BASE_URL%pwa-192.png" />
    <title>CampoVista</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

~~~

## FILE: package.json

~~~json
{
  "name": "campovista",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hello-pangea/dnd": "^18.0.1",
    "leaflet": "^1.9.4",
    "lucide-react": "^1.46.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^7.18.4",
    "recharts": "^3.10.1",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/leaflet": "^1.9.22",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "autoprefixer": "^10.6.1",
    "oxlint": "^1.81.0",
    "postcss": "^8.5.28",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^8.3.0",
    "vite-plugin-pwa": "^1.3.0"
  }
}

~~~

## FILE: public/.nojekyll

~~~

~~~

## FILE: public/favicon.svg

~~~xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5.5" fill="#3B82F6"/>
  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="10" r="2.6" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
</svg>

~~~

## FILE: src/App.tsx

~~~tsx
import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'

const Home = lazy(() => import('./pages/Home'))
const Buscar = lazy(() => import('./pages/Buscar'))
const Rotas = lazy(() => import('./pages/Rotas'))
const Historico = lazy(() => import('./pages/Historico'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Despesas = lazy(() => import('./pages/Despesas'))
const Relatorio = lazy(() => import('./pages/Relatorio'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))

function PageLoader() {
  return <div className="flex h-64 items-center justify-center text-[13px] text-[#6B7F93]">Carregando…</div>
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/relatorio" element={<Relatorio />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

~~~

## FILE: src/components/layout/NavBar.tsx

~~~tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Compass, Route, Users, History, Wallet, ClipboardList, Settings, ChevronDown, MapPin } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { initials } from '../../lib/format'

const PRIMARY_TABS = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Buscar', icon: Compass, to: '/buscar' },
  { label: 'Rotas', icon: Route, to: '/rotas' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
]

const MORE_LINKS = [
  { label: 'Histórico', icon: History, to: '/historico' },
  { label: 'Despesas', icon: Wallet, to: '/despesas' },
  { label: 'Relatório', icon: ClipboardList, to: '/relatorio' },
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Compass }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
          isActive ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#33495E] hover:bg-[#EAF3FC]'
        }`
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  )
}

export function NavBar() {
  const navigate = useNavigate()
  const { repName, companyName, routes } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const emAndamento = routes.some((r) => r.status === 'em_andamento')

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#CFE0F5] bg-white px-4 py-3 sm:px-6">
        <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#3B82F6]">
            <MapPin size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-[14px] font-bold text-[#0F2A44]">CampoVista</div>
            <div className="text-[11px] text-[#6B7F93]">O copiloto do representante em campo</div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-[#CFE0F5] bg-[#F2F7FD] p-1 sm:flex">
          {PRIMARY_TABS.map((t) => (
            <TabLink key={t.to} to={t.to} label={t.label} icon={t.icon} />
          ))}
        </nav>

        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-[#CFE0F5] py-1 pl-1 pr-2.5 hover:bg-[#EAF3FC]">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-white">
              {initials(repName)}
              {emAndamento && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#3B82F6]" />}
            </span>
            <ChevronDown size={14} className="hidden text-[#6B7F93] sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-[10px] border border-[#CFE0F5] bg-white shadow-lg">
                <div className="border-b border-[#E1EDFB] px-3.5 py-3">
                  <div className="text-[13px] font-semibold text-[#0F2A44]">{repName}</div>
                  <div className="text-[11.5px] text-[#6B7F93]">{companyName}</div>
                </div>
                {MORE_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] ${isActive ? 'bg-[#EAF3FC] text-[#0F2A44]' : 'text-[#33495E] hover:bg-[#EAF3FC]'}`
                    }
                  >
                    <l.icon size={15} />
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[#CFE0F5] bg-white sm:hidden">
        {PRIMARY_TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-[#3B82F6]' : 'text-[#6B7F93]'}`}
          >
            <t.icon size={19} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

~~~

## FILE: src/components/layout/Shell.tsx

~~~tsx
import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'

export function Shell() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#F2F7FD] text-[#0F2A44]" style={{ fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" }}>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-20 sm:px-6 sm:py-6 sm:pb-6">
        <Outlet />
      </main>
    </div>
  )
}

~~~

## FILE: src/components/ui/Badge.tsx

~~~tsx
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: `${color}55`, background: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

export function Tag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCEAFB] px-2 py-0.5 text-[11px] text-[#0F2A44]">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="text-[#6B7F93] hover:text-[#EF4444]">
          ×
        </button>
      )}
    </span>
  )
}

~~~

## FILE: src/components/ui/Button.tsx

~~~tsx
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-[#3B82F6] text-white hover:bg-[#1D4ED8] font-semibold',
  secondary: 'border border-[#CFE0F5] bg-[#EAF3FC] text-[#0F2A44] hover:bg-[#DCEAFB]',
  ghost: 'text-[#6B7F93] hover:bg-[#EAF3FC] hover:text-[#0F2A44]',
  danger: 'border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] px-3.5 py-2 text-[13px] transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
    />
  )
}

~~~

## FILE: src/components/ui/Card.tsx

~~~tsx
import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={`rounded-xl border border-[#CFE0F5] bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {typeof title === 'string' ? <span className="text-[13px] font-medium text-[#33495E]">{title}</span> : title}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

~~~

## FILE: src/components/ui/Field.tsx

~~~tsx
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const baseClass =
  'w-full rounded-[6px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] placeholder:text-[#93A5BC] outline-none focus:border-[#3B82F6]/60'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">{children}</label>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseClass} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseClass} resize-none ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseClass} ${props.className ?? ''}`} />
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

~~~

## FILE: src/components/ui/LocationButtons.tsx

~~~tsx
import { useState } from 'react'
import { Navigation, Camera } from 'lucide-react'
import { Button } from './Button'
import { openStreetView } from '../../services/streetView'
import { openNavigation } from '../../services/navigation'

export function LocationButtons({
  lat,
  lng,
  size = 'md',
  className = '',
}: {
  lat?: number | null
  lng?: number | null
  size?: 'md' | 'sm'
  className?: string
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : ''

  function handleNavigate(app: 'google' | 'waze') {
    const res = openNavigation(lat, lng, app)
    setNotice(res.ok ? null : res.message ?? null)
  }

  function handleStreetView() {
    const res = openStreetView(lat, lng)
    setNotice(res.ok ? null : res.message ?? null)
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className={`flex-1 ${pad}`} onClick={() => handleNavigate('google')}>
          <Navigation size={13} /> Google Maps
        </Button>
        <Button variant="secondary" className={`flex-1 ${pad}`} onClick={() => handleNavigate('waze')}>
          <Navigation size={13} /> Waze
        </Button>
        <Button variant="secondary" className={`flex-1 ${pad}`} onClick={handleStreetView}>
          <Camera size={13} /> Street View
        </Button>
      </div>
      {notice && <p className="mt-1.5 text-[11px] text-[#F59E0B]">{notice}</p>}
    </div>
  )
}

~~~

## FILE: src/components/ui/Sheet.tsx

~~~tsx
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full flex-col border-l border-[#CFE0F5] bg-white shadow-2xl sm:w-auto" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between border-b border-[#CFE0F5] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#0F2A44]">{title}</h2>
          <button onClick={onClose} className="rounded-[6px] p-1.5 text-[#6B7F93] hover:bg-[#DCEAFB] hover:text-[#0F2A44]">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-[#CFE0F5] px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

~~~

## FILE: src/components/ui/StatTile.tsx

~~~tsx
import type { LucideIcon } from 'lucide-react'

export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon?: LucideIcon
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
      {Icon && <Icon size={15} className="mb-1.5 text-[#3B82F6]" />}
      <div className="text-[18px] font-bold text-[#0F2A44]">{value}</div>
      <div className="text-[11px] text-[#6B7F93]">{label}</div>
      {sub && <div className="mt-0.5 text-[10.5px] text-[#93A5BC]">{sub}</div>}
    </div>
  )
}

export function KpiCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'accent' | 'success' | 'danger' }) {
  const toneClass: Record<string, string> = {
    default: 'text-[#0F2A44]',
    accent: 'text-[#3B82F6]',
    success: 'text-[#16A34A]',
    danger: 'text-[#EF4444]',
  }
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#CFE0F5] bg-white p-5">
      <span className="text-[13px] text-[#6B7F93]">{label}</span>
      <div className="mt-6">
        <div className={`truncate text-[24px] font-semibold sm:text-[28px] ${toneClass[tone]}`}>{value}</div>
        {sub && <div className="mt-1 text-[12px] text-[#6B7F93]">{sub}</div>}
      </div>
    </div>
  )
}

~~~

## FILE: src/data/seed.ts

~~~typescript
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

~~~

## FILE: src/data/segments.ts

~~~typescript
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

~~~

## FILE: src/index.css

~~~css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: 'Manrope', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Identidade CampoVista: azul-claro + branco, com cores de apoio só quando têm função clara. */
  --color-bg: #F2F7FD;
  --color-surface: #FFFFFF;
  --color-surface-tint: #EAF3FC;
  --color-surface-tint-strong: #DCEAFB;
  --color-chip: #E1EDFB;

  --color-border: #CFE0F5;
  --color-border-soft: #E1EDFB;

  --color-ink: #0F2A44;
  --color-ink-soft: #33495E;
  --color-ink-muted: #6B7F93;

  --color-primary: #3B82F6;
  --color-primary-dark: #1D4ED8;
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-location: #5B8DEF;
}

html, body, #root {
  height: 100%;
}

body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

.mono {
  font-family: var(--font-mono);
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #CFE0F5; border-radius: 4px; }
::-webkit-scrollbar-track { background: transparent; }

* {
  scrollbar-color: #CFE0F5 transparent;
  scrollbar-width: thin;
}

.leaflet-container {
  background: #EAF3FC !important;
  font-family: var(--font-sans);
}

.leaflet-tile-pane {
  filter: saturate(0.9) brightness(1.03) hue-rotate(2deg);
}

.leaflet-popup-content-wrapper {
  background: #FFFFFF !important;
  color: #0F2A44 !important;
  border: 1px solid #CFE0F5;
  border-radius: 8px;
}
.leaflet-popup-tip { background: #FFFFFF !important; }
.leaflet-control-zoom a {
  background: #FFFFFF !important;
  color: #0F2A44 !important;
  border-color: #CFE0F5 !important;
}
.leaflet-control-attribution {
  background: rgba(255,255,255,0.75) !important;
  color: #6B7F93 !important;
}
.leaflet-control-attribution a { color: #33495E !important; }

~~~

## FILE: src/lib/format.ts

~~~typescript
export function currency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string): string {
  const d = new Date(date)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function daysAgo(date: string): number {
  const ms = Date.now() - new Date(date).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function isToday(date: string): boolean {
  return new Date(date).toDateString() === new Date().toDateString()
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

~~~

## FILE: src/lib/labels.ts

~~~typescript
import type { ClientStatus, StopStatus, VisitResultado, ExpenseCategory, FuelType } from '../types'

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: 'Prospect',
  ativo: 'Cliente ativo',
  inativo: 'Cliente inativo',
  retorno: 'Retorno',
  sem_interesse: 'Sem interesse',
}

export const CLIENT_STATUS_COLOR: Record<ClientStatus, string> = {
  prospect: '#3B82F6',
  ativo: '#16A34A',
  inativo: '#6B7F93',
  retorno: '#F59E0B',
  sem_interesse: '#EF4444',
}

export const STOP_STATUS_LABEL: Record<StopStatus, string> = {
  pendente: 'Pendente',
  visitado: 'Visitado',
  nao_visitado: 'Não visitado',
}

export const STOP_STATUS_COLOR: Record<StopStatus, string> = {
  pendente: '#6B7F93',
  visitado: '#16A34A',
  nao_visitado: '#EF4444',
}

export const VISIT_RESULTADO_LABEL: Record<VisitResultado, string> = {
  venda_realizada: 'Venda realizada',
  pedido_negociacao: 'Pedido em negociação',
  proposta_enviada: 'Proposta enviada',
  retornar: 'Retornar',
  sem_interesse: 'Sem interesse',
  nao_atendido: 'Não atendido',
  cliente_nao_encontrado: 'Cliente não encontrado',
  outro: 'Outro',
}

const NEGATIVE_RESULTADOS: VisitResultado[] = ['nao_atendido', 'cliente_nao_encontrado']
export function stopStatusForResultado(r: VisitResultado): StopStatus {
  return NEGATIVE_RESULTADOS.includes(r) ? 'nao_visitado' : 'visitado'
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  pedagio: 'Pedágio',
  estacionamento: 'Estacionamento',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  outros: 'Outros',
}

export const EXPENSE_CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  combustivel: '#3B82F6',
  pedagio: '#F59E0B',
  estacionamento: '#9B7FE0',
  alimentacao: '#16A34A',
  hospedagem: '#5B8DEF',
  outros: '#6B7F93',
}

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  eletrico: 'Elétrico',
}

export const SUGGESTED_TAGS = ['Grande cliente', 'Potencial', 'Atacado', 'Varejo', 'Retorno', 'Negociação', 'Prioridade', 'Visitar esta semana']

~~~

## FILE: src/main.tsx

~~~tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

~~~

## FILE: src/pages/Buscar.tsx

~~~tsx
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, Search, Plus, Check, UserPlus, Phone, Clock, MapPin, Route, AlertCircle, Play, X, ChevronsUp } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { searchAddress, addressAt, type AddressMatch } from '../services/geocoding'
import { searchPlaces, overpassTurboUrl, overpassAnyShopDebugUrl } from '../services/places'
import { openNavigation } from '../services/navigation'
import { openStreetView } from '../services/streetView'
import { searchSegments, customSegment } from '../data/segments'
import type { Establishment, Segment } from '../types'

const EXPAND_MIN_RESULTS = 3
const EXPAND_MAX_KM = 80

const RADIUS_OPTIONS = [3, 5, 10, 20, 50]

const QUICK_LOCATIONS: { label: string; lat: number; lng: number }[] = [
  { label: 'Goiânia (Setor Bueno)', lat: -16.7069, lng: -49.2733 },
  { label: 'Anápolis (Centro)', lat: -16.3281, lng: -48.9531 },
  { label: 'Rio Verde (Centro)', lat: -17.7975, lng: -50.9264 },
  { label: 'Aparecida de Goiânia', lat: -16.8233, lng: -49.2437 },
  { label: 'Trindade (Centro)', lat: -16.6499, lng: -49.4889 },
]

const meIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #fff;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
function resultIcon(active: boolean) {
  const color = active ? '#16A34A' : '#3B82F6'
  return L.divIcon({ className: '', html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
}

export default function Buscar() {
  const navigate = useNavigate()
  const { draftOrigin, draftStops, favorites, setDraftOrigin, toggleDraftStop, addClient, clients, routes } = useAppStore()

  const [originLabel, setOriginLabel] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressMatch[]>([])
  const [addressSearching, setAddressSearching] = useState(false)

  const [segmentQuery, setSegmentQuery] = useState('')
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([])
  const [customSegmentText, setCustomSegmentText] = useState('')

  const [radiusKm, setRadiusKm] = useState(10)
  const [searchedRadiusKm, setSearchedRadiusKm] = useState<number | null>(null)

  const [searching, setSearching] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [slowSearch, setSlowSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<Establishment[]>([])
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const [tagsUsed, setTagsUsed] = useState<{ key: string; value: string; category: string }[]>([])
  const [partialResults, setPartialResults] = useState(false)
  const [savedAsClient, setSavedAsClient] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const filteredSegments = useMemo(() => searchSegments(segmentQuery), [segmentQuery])
  const selectedIds = new Set(selectedSegments.map((s) => s.id))
  const draftIds = new Set(draftStops.map((p) => p.id))
  const emAndamento = routes.find((r) => r.status === 'em_andamento')

  async function setOrigin(lat: number, lng: number, label?: string) {
    setDraftOrigin({ lat, lng })
    if (label) {
      setOriginLabel(label)
    } else {
      setOriginLabel(null)
      const addr = await addressAt(lat, lng)
      if (addr) setOriginLabel(addr)
    }
  }

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
      await setOrigin(pos.lat, pos.lng)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  async function handleAddressSearch() {
    if (addressQuery.trim().length < 3) return
    setAddressSearching(true)
    try {
      setAddressResults(await searchAddress(addressQuery))
    } catch {
      setAddressResults([])
    } finally {
      setAddressSearching(false)
    }
  }

  function toggleSegment(s: Segment) {
    setSelectedSegments((list) => (list.some((x) => x.id === s.id) ? list.filter((x) => x.id !== s.id) : [...list, s]))
  }

  function addCustomSegment() {
    const label = customSegmentText.trim()
    if (!label) return
    const seg = customSegment(label)
    if (!selectedSegments.some((s) => s.id === seg.id)) setSelectedSegments((list) => [...list, seg])
    setCustomSegmentText('')
  }

  async function runSearch(atRadiusKm: number, opts: { expand?: boolean } = {}) {
    if (!draftOrigin || selectedSegments.length === 0) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (opts.expand) setExpanding(true)
    else {
      setSearching(true)
      setResults([])
    }
    setSlowSearch(false)
    setSearchError(null)
    setPartialResults(false)
    const slowTimer = setTimeout(() => setSlowSearch(true), 4000)
    try {
      const { results: found, query, partial, tagsUsed: tags } = await searchPlaces(selectedSegments, draftOrigin, atRadiusKm, controller.signal)
      if (controller.signal.aborted) return
      setResults(found)
      setSearchedRadiusKm(atRadiusKm)
      setLastQuery(query)
      setTagsUsed(tags)
      setPartialResults(partial)
      if (found.length === 0) setSearchError('Nenhum estabelecimento encontrado nessa região. Tente aumentar o raio ou escolher outros segmentos.')
    } catch (err) {
      if (controller.signal.aborted) return
      const tags = (err as { tagsUsed?: typeof tagsUsed })?.tagsUsed
      if (tags) setTagsUsed(tags)
      setSearchError(err instanceof Error ? err.message : 'Falha ao buscar estabelecimentos. Tente novamente.')
    } finally {
      if (!controller.signal.aborted) {
        clearTimeout(slowTimer)
        setSlowSearch(false)
        setSearching(false)
        setExpanding(false)
      }
    }
  }

  function handleSearch() {
    runSearch(radiusKm)
  }

  function handleExpand() {
    const next = Math.min(searchedRadiusKm ? searchedRadiusKm * 2 : radiusKm * 2, EXPAND_MAX_KM)
    runSearch(next, { expand: true })
  }

  function handleAddToRoute(e: Establishment) {
    toggleDraftStop({ id: e.id, origem: 'prospect', nome: e.nome, endereco: e.endereco, lat: e.lat, lng: e.lng, telefone: e.telefone, segmento: e.categoria })
  }

  function handleSaveAsClient(e: Establishment) {
    addClient({
      nomeFantasia: e.nome,
      segmento: e.categoria,
      status: 'prospect',
      telefone: e.telefone,
      whatsapp: e.telefone,
      endereco: { logradouro: e.endereco, cidade: '', uf: '', lat: e.lat, lng: e.lng },
      observacoes: 'Encontrado via prospecção por segmento.',
    })
    setSavedAsClient((s) => new Set(s).add(e.id))
  }

  function isAlreadyClient(nome: string) {
    return clients.some((c) => c.nomeFantasia.toLowerCase() === nome.toLowerCase())
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Prospecção Comercial</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Geolocalização e busca de estabelecimentos por segmento</p>
      </div>

      {emAndamento && (
        <button onClick={() => navigate(`/rotas?id=${emAndamento.id}`)} className="mb-5 flex w-full items-center justify-between rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/10 px-4 py-3 text-left">
          <span className="flex items-center gap-2 text-[13px] font-medium text-[#0F2A44]">
            <Play size={14} className="text-[#16A34A]" /> Rota "{emAndamento.nome}" em andamento
          </span>
          <span className="text-[12px] font-medium text-[#16A34A]">continuar →</span>
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="1. Ponto de Partida da Prospecção">
            {draftOrigin ? (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2 text-[12.5px] text-[#16A34A]">
                <span className="flex min-w-0 items-center gap-1.5"><LocateFixed size={14} className="shrink-0" /> <span className="truncate">{originLabel ?? 'Localização definida'}</span></span>
                <button onClick={handleLocate} className="shrink-0 text-[11px] underline decoration-dotted">atualizar</button>
              </div>
            ) : (
              <Button variant="secondary" className="mb-3 w-full" onClick={handleLocate} disabled={locating}>
                <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual'}
              </Button>
            )}
            {locationError && <p className="mb-3 flex items-start gap-1.5 text-[11.5px] text-[#EF4444]"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {locationError}</p>}

            <div className="mb-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {favorites.map((f) => (
                <button key={f.id} onClick={() => setOrigin(f.lat, f.lng, f.nome)} className="shrink-0 whitespace-nowrap rounded-full border border-[#3B82F6]/40 bg-[#DCEAFB] px-2.5 py-1 text-[11px] text-[#1D4ED8]">
                  {f.nome}
                </button>
              ))}
              {QUICK_LOCATIONS.map((loc) => (
                <button key={loc.label} onClick={() => setOrigin(loc.lat, loc.lng, loc.label)} className="shrink-0 whitespace-nowrap rounded-full border border-[#CFE0F5] bg-[#EAF3FC] px-2.5 py-1 text-[11px] text-[#33495E] hover:bg-[#DCEAFB]">
                  {loc.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
                <Search size={14} />
                <input
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="Ou digite: endereço, bairro, cidade…"
                  className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
                />
                <button onClick={handleAddressSearch} className="shrink-0 text-[11px] font-medium text-[#3B82F6]">{addressSearching ? '...' : 'buscar'}</button>
              </div>
              {addressResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#CFE0F5] bg-white shadow-xl">
                  {addressResults.map((r, i) => (
                    <button key={i} onClick={() => { setOrigin(r.lat, r.lng, r.label); setAddressResults([]); setAddressQuery('') }} className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#EAF3FC]">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-[#6B7F93]" />
                      <span className="text-[#0F2A44]">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="2. Segmento(s) de Prospecção">
            <div className="mb-2 flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
              <Search size={14} />
              <input value={segmentQuery} onChange={(e) => setSegmentQuery(e.target.value)} placeholder="Pesquisar segmento…" className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
            </div>
            <div className="mb-2 flex gap-1.5">
              <input
                value={customSegmentText}
                onChange={(e) => setCustomSegmentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSegment()}
                placeholder="Outro segmento…"
                className="min-w-0 flex-1 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
              />
              <Button variant="secondary" onClick={addCustomSegment}><Plus size={13} /> Adicionar</Button>
            </div>
            <div className="flex max-h-[220px] flex-wrap gap-1.5 overflow-y-auto">
              {filteredSegments.map((s) => {
                const checked = selectedIds.has(s.id)
                return (
                  <button key={s.id} onClick={() => toggleSegment(s)} className={`rounded-full border px-2.5 py-1 text-[11.5px] ${checked ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#33495E] hover:bg-[#EAF3FC]'}`}>
                    {s.label}
                  </button>
                )
              })}
              {filteredSegments.length === 0 && <p className="text-[12px] text-[#6B7F93]">Nenhum segmento encontrado.</p>}
            </div>
            {selectedSegments.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#E1EDFB] pt-3">
                <span className="text-[11px] text-[#6B7F93]">Selecionados ({selectedSegments.length}):</span>
                {selectedSegments.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-full bg-[#DCEAFB] px-2 py-0.5 text-[11px] text-[#0F2A44]">
                    {s.label}
                    <button onClick={() => toggleSegment(s)}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card title="3. Raio de Busca">
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button key={r} onClick={() => setRadiusKm(r)} className={`rounded-full border px-3 py-1 text-[12px] ${radiusKm === r ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>
                  {r} km
                </button>
              ))}
            </div>
          </Card>

          {draftOrigin && (
            <div className="text-[12px] text-[#6B7F93]">
              <p className="flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" /> Buscando a partir de: <strong className="text-[#0F2A44]">{originLabel ?? 'local de partida definido'}</strong> · raio {radiusKm} km
              </p>
              <p className="mono mt-1 flex flex-wrap items-center gap-x-2 pl-[18px] text-[11px] text-[#93A5BC]">
                <span>coordenadas: {draftOrigin.lat.toFixed(5)}, {draftOrigin.lng.toFixed(5)}</span>
                <a
                  href={overpassAnyShopDebugUrl(draftOrigin, radiusKm)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans font-medium text-[#3B82F6] underline decoration-dotted"
                >
                  ver qualquer loja no OSM aqui perto
                </a>
              </p>
              {tagsUsed.length > 0 && (
                <p className="mono mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-[18px] text-[10.5px] text-[#93A5BC]">
                  <span className="font-sans">tags OSM usadas nesta busca:</span>
                  {tagsUsed.map((t, i) => (
                    <span key={i} className="rounded-full border border-[#CFE0F5] px-1.5 py-0.5" title={t.category}>
                      {t.key}={t.value}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

          <Button className="w-full" disabled={!draftOrigin || selectedSegments.length === 0 || searching} onClick={handleSearch}>
            <Search size={15} /> {searching ? 'Buscando…' : 'Buscar Clientes na Região'}
          </Button>
          {slowSearch && <p className="text-center text-[11.5px] text-[#6B7F93]">O OpenStreetMap está respondendo devagar agora — pode levar mais alguns segundos…</p>}

          {draftStops.length > 0 && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/rotas')}>
              <Route size={14} /> Ir para Rota ({draftStops.length} selecionados)
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-[320px] overflow-hidden rounded-xl border border-[#CFE0F5]">
            <MapContainer center={draftOrigin ? [draftOrigin.lat, draftOrigin.lng] : [-16.6799, -49.255]} zoom={draftOrigin ? 13 : 11} style={{ height: '100%', width: '100%' }} key={draftOrigin ? `${draftOrigin.lat}-${draftOrigin.lng}` : 'default'}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {draftOrigin && (
                <>
                  <Marker position={[draftOrigin.lat, draftOrigin.lng]} icon={meIcon}><Popup>Você está aqui</Popup></Marker>
                  <Circle center={[draftOrigin.lat, draftOrigin.lng]} radius={(searchedRadiusKm ?? radiusKm) * 1000} pathOptions={{ color: '#5B8DEF', fillOpacity: 0.04, weight: 1 }} />
                </>
              )}
              {results.map((r) => (
                <Marker key={r.id} position={[r.lat, r.lng]} icon={resultIcon(draftIds.has(r.id))}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong>{r.nome}</strong>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{r.categoria} · {r.distanciaKm} km</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => openNavigation(r.lat, r.lng)} style={{ fontSize: 11, color: '#3B82F6', border: '1px solid #CFE0F5', borderRadius: 999, padding: '3px 8px', background: '#fff' }}>Navegar</button>
                        <button onClick={() => openStreetView(r.lat, r.lng)} style={{ fontSize: 11, color: '#3B82F6', border: '1px solid #CFE0F5', borderRadius: 999, padding: '3px 8px', background: '#fff' }}>Street View</button>
                        <button onClick={() => handleAddToRoute(r)} style={{ fontSize: 11, color: '#fff', border: 'none', borderRadius: 999, padding: '3px 8px', background: '#3B82F6' }}>
                          {draftIds.has(r.id) ? 'Na rota' : 'Adicionar à rota'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E1EDFB] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium text-[#0F2A44]">
                <MapPin size={14} className="text-[#6B7F93]" /> Estabelecimentos Encontrados
                <span className="rounded-full bg-[#EAF3FC] px-1.5 py-0.5 text-[11px] text-[#33495E]">{results.length}</span>
              </span>
              {searchedRadiusKm != null && <span className="text-[11px] text-[#6B7F93]">raio usado: {searchedRadiusKm} km</span>}
            </div>
            {results.length > 0 && (
              <div className="flex items-center gap-3 border-b border-[#E1EDFB] px-4 py-2 text-[11.5px]">
                <button onClick={() => results.forEach((r) => { if (!draftIds.has(r.id)) handleAddToRoute(r) })} className="font-medium text-[#3B82F6] underline decoration-dotted">
                  selecionar todos
                </button>
                <button onClick={() => results.forEach((r) => { if (draftIds.has(r.id)) handleAddToRoute(r) })} className="font-medium text-[#6B7F93] underline decoration-dotted">
                  desmarcar todos
                </button>
                {draftStops.length > 0 && <span className="ml-auto text-[#6B7F93]">{draftStops.length} na rota</span>}
              </div>
            )}
            {!searching && searchedRadiusKm != null && results.length < EXPAND_MIN_RESULTS && (
              <div className="flex items-center justify-between gap-2 border-b border-[#E1EDFB] bg-[#EAF3FC] px-4 py-2.5 text-[12.5px] text-[#33495E]">
                <span>
                  {results.length === 0
                    ? `Nenhuma empresa encontrada em ${searchedRadiusKm} km.`
                    : `Encontramos apenas ${results.length} empresa${results.length > 1 ? 's' : ''} em ${searchedRadiusKm} km.`}
                </span>
                {searchedRadiusKm < EXPAND_MAX_KM ? (
                  <button onClick={handleExpand} disabled={expanding} className="flex shrink-0 items-center gap-1 font-medium text-[#3B82F6] disabled:opacity-60">
                    <ChevronsUp size={13} /> {expanding ? 'Ampliando…' : `Ampliar para ${Math.min(searchedRadiusKm * 2, EXPAND_MAX_KM)} km`}
                  </button>
                ) : (
                  <button onClick={() => runSearch(searchedRadiusKm)} className="shrink-0 font-medium text-[#3B82F6] underline decoration-dotted">tentar novamente</button>
                )}
              </div>
            )}
            {searchError && (
              <div className="flex items-start gap-2 border-b border-[#E1EDFB] px-4 py-3 text-[12.5px] text-[#B45309]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="flex-1">{searchError}</span>
              </div>
            )}
            {!searching && partialResults && (
              <div className="flex items-start gap-2 border-b border-[#E1EDFB] px-4 py-2.5 text-[12px] text-[#B45309]">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span className="flex-1">Algumas categorias não responderam (servidor sobrecarregado) — os resultados abaixo podem estar incompletos. <button onClick={() => runSearch(searchedRadiusKm ?? radiusKm)} className="font-medium text-[#3B82F6] underline decoration-dotted">tentar de novo</button></span>
              </div>
            )}
            {!searching && results.length === 0 && lastQuery && (
              <div className="border-b border-[#E1EDFB] px-4 py-3 text-[12px] text-[#6B7F93]">
                Se você sabe que existem empresas dessa categoria aqui perto, confira os dados brutos do OpenStreetMap para esta busca:{' '}
                <a href={overpassTurboUrl(lastQuery)} target="_blank" rel="noopener noreferrer" className="font-medium text-[#3B82F6] underline decoration-dotted">
                  abrir no Overpass Turbo
                </a>
                . Se aparecer vazio lá também, as empresas ainda não estão cadastradas no mapa livre (não é um problema do CampoVista); tente também "Outro segmento…" com o nome de uma loja específica.
              </div>
            )}
            <div className="max-h-[420px] divide-y divide-[#E1EDFB] overflow-y-auto">
              {results.map((r) => {
                const inDraft = draftIds.has(r.id)
                const already = isAlreadyClient(r.nome)
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-[#0F2A44]">{r.nome}</span>
                          {already && <span className="shrink-0 rounded-full border border-[#16A34A]/40 px-1.5 py-0.5 text-[10px] text-[#16A34A]">já é cliente</span>}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11.5px] text-[#6B7F93]"><MapPin size={11} /> {r.endereco} · {r.distanciaKm} km</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6B7F93]">
                          <span className="rounded-full border border-[#CFE0F5] px-2 py-0.5">{r.categoria}</span>
                          {r.telefone && <span className="flex items-center gap-1"><Phone size={11} /> {r.telefone}</span>}
                          {r.horario && <span className="flex items-center gap-1"><Clock size={11} /> {r.horario}</span>}
                        </div>
                      </div>
                    </div>
                    <LocationButtons lat={r.lat} lng={r.lng} size="sm" className="mt-3" />
                    <div className="mt-2 flex gap-2">
                      <Button variant={inDraft ? 'secondary' : 'primary'} onClick={() => handleAddToRoute(r)} className="flex-1">
                        {inDraft ? <Check size={13} /> : <Plus size={13} />} {inDraft ? 'Adicionado à rota' : 'Adicionar à Rota'}
                      </Button>
                      <Button variant="secondary" onClick={() => handleSaveAsClient(r)} disabled={savedAsClient.has(r.id) || already}>
                        <UserPlus size={13} /> {savedAsClient.has(r.id) ? 'Salvo' : 'Salvar como cliente'}
                      </Button>
                    </div>
                  </div>
                )
              })}
              {results.length === 0 && !searchError && (
                <div className="px-4 py-10 text-center text-[13px] text-[#6B7F93]">Defina sua localização, escolha os segmentos e busque estabelecimentos próximos.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

~~~

## FILE: src/pages/Clientes.tsx

~~~tsx
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, MapPin, Pencil, Trash2, Route as RouteIcon, Check, LocateFixed, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Sheet } from '../components/ui/Sheet'
import { Badge, Tag } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { searchAddress, type AddressMatch } from '../services/geocoding'
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR, STOP_STATUS_LABEL, SUGGESTED_TAGS } from '../lib/labels'
import { daysAgo, formatDate } from '../lib/format'
import type { Client, ClientStatus } from '../types'

const STATUS_FILTERS: (ClientStatus | 'todos')[] = ['todos', 'prospect', 'ativo', 'retorno', 'inativo', 'sem_interesse']

function emptyClient(): Omit<Client, 'id' | 'criadoEm'> {
  return {
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    segmento: '',
    status: 'prospect',
    telefone: '',
    whatsapp: '',
    endereco: { logradouro: '', cidade: '', uf: 'GO', lat: -16.6799, lng: -49.255 },
    tags: [],
  }
}

export default function Clientes() {
  const { clients, routes, addClient, updateClient, deleteClient, toggleDraftStop, draftStops } = useAppStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'todos'>('todos')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyClient())
  const [tagDraft, setTagDraft] = useState('')
  const [hasLocation, setHasLocation] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressMatch[]>([])
  const [addressSearching, setAddressSearching] = useState(false)

  const detailId = params.get('id')
  const detailClient = clients.find((c) => c.id === detailId) ?? null

  const allTags = useMemo(() => {
    const set = new Set<string>()
    clients.forEach((c) => c.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [clients])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter((c) => {
      const matchesQ = !q || c.nomeFantasia.toLowerCase().includes(q) || (c.cnpj ?? '').includes(q) || c.endereco.cidade.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'todos' || c.status === statusFilter
      const matchesTag = !tagFilter || c.tags.includes(tagFilter)
      return matchesQ && matchesStatus && matchesTag
    })
  }, [clients, search, statusFilter, tagFilter])

  function openDetail(id: string) { setParams({ id }) }
  function closeDetail() { params.delete('id'); setParams(params) }

  function resetLocationPicker() {
    setLocating(false)
    setLocationError(null)
    setAddressQuery('')
    setAddressResults([])
  }
  function openNewForm() { setEditing(null); setForm(emptyClient()); setHasLocation(false); resetLocationPicker(); setFormOpen(true) }
  function openEditForm(c: Client) { setEditing(c); setForm(c); setHasLocation(true); resetLocationPicker(); setFormOpen(true) }

  async function handleLocateForClient() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
      setForm((f) => ({ ...f, endereco: { ...f.endereco, lat: pos.lat, lng: pos.lng } }))
      setHasLocation(true)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  async function handleAddressSearchForClient() {
    if (addressQuery.trim().length < 3) return
    setAddressSearching(true)
    try {
      setAddressResults(await searchAddress(addressQuery))
    } catch {
      setAddressResults([])
    } finally {
      setAddressSearching(false)
    }
  }

  function pickAddressResult(r: AddressMatch) {
    setForm((f) => ({ ...f, endereco: { ...f.endereco, lat: r.lat, lng: r.lng } }))
    setHasLocation(true)
    setAddressResults([])
    setAddressQuery('')
  }

  function submitForm() {
    if (!form.nomeFantasia.trim() || !form.endereco.cidade.trim()) return
    if (!hasLocation) { setLocationError('Defina a localização (GPS ou busca de endereço) antes de salvar — sem isso o cliente não aparece certo no mapa e na rota.'); return }
    if (editing) updateClient(editing.id, form)
    else addClient(form)
    setFormOpen(false)
  }

  function addTagToForm() {
    const t = tagDraft.trim()
    if (!t || form.tags.includes(t)) return
    setForm({ ...form, tags: [...form.tags, t] })
    setTagDraft('')
  }
  function removeTagFromForm(t: string) {
    setForm({ ...form, tags: form.tags.filter((x) => x !== t) })
  }

  function addToRoute(c: Client) {
    toggleDraftStop({ id: c.id, origem: 'cliente', clientId: c.id, nome: c.nomeFantasia, endereco: `${c.endereco.logradouro}, ${c.endereco.cidade}/${c.endereco.uf}`, lat: c.endereco.lat, lng: c.endereco.lng, telefone: c.telefone, segmento: c.segmento })
  }

  const clientVisits = useMemo(() => {
    if (!detailClient) return []
    const rows: { rota: string; data: string; status: string; observacao?: string }[] = []
    routes.forEach((r) => {
      r.paradas.filter((p) => p.clientId === detailClient.id && p.status !== 'pendente').forEach((p) => rows.push({ rota: r.nome, data: r.finalizadaEm ?? r.iniciadaEm ?? r.criadoEm, status: p.status, observacao: p.observacao }))
    })
    return rows.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [detailClient, routes])

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Clientes</h1>
          <p className="mt-1 text-[13px] text-[#6B7F93]">{clients.length} clientes e prospects cadastrados</p>
        </div>
        <Button onClick={openNewForm}><Plus size={15} /> Novo cliente</Button>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93] sm:max-w-[320px] sm:flex-1">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ, cidade…" className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${statusFilter === s ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] bg-[#EAF3FC] text-[#6B7F93] hover:text-[#33495E]'}`}>
              {s === 'todos' ? 'Todos' : CLIENT_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#6B7F93]">Tags:</span>
          {allTags.map((t) => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} className={`rounded-full border px-2 py-0.5 text-[11px] ${tagFilter === t ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_100px] gap-3 border-b border-[#CFE0F5] px-5 py-3 text-[11.5px] font-medium text-[#6B7F93] md:grid">
          <span>Cliente</span><span>Segmento</span><span>Cidade</span><span>Status</span><span>Última visita</span><span />
        </div>
        <div className="divide-y divide-[#E1EDFB]">
          {filtered.map((c) => {
            const inDraft = draftStops.some((p) => p.id === c.id)
            return (
              <div key={c.id} className="grid grid-cols-2 gap-2 px-5 py-3.5 text-[13px] md:grid-cols-[2fr_1.1fr_1fr_0.8fr_0.9fr_100px] md:items-center md:gap-3">
                <button onClick={() => openDetail(c.id)} className="col-span-2 flex items-center gap-3 text-left md:col-span-1">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#0F2A44]">{c.nomeFantasia}</div>
                    <div className="truncate text-[11.5px] text-[#6B7F93]">{c.cnpj || 'sem CNPJ'}</div>
                  </div>
                </button>
                <span className="truncate text-[#33495E]">{c.segmento}</span>
                <span className="truncate text-[#33495E]">{c.endereco.cidade}/{c.endereco.uf}</span>
                <span><Badge label={CLIENT_STATUS_LABEL[c.status]} color={CLIENT_STATUS_COLOR[c.status]} /></span>
                <span className="mono text-[#6B7F93]">{c.ultimaVisitaEm ? `${daysAgo(c.ultimaVisitaEm)}d atrás` : '—'}</span>
                <button onClick={() => addToRoute(c)} className={`flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-[11px] ${inDraft ? 'border-[#16A34A]/50 bg-[#16A34A]/15 text-[#16A34A]' : 'border-[#CFE0F5] text-[#6B7F93] hover:text-[#33495E]'}`}>
                  {inDraft ? <Check size={12} /> : <RouteIcon size={12} />} {inDraft ? 'Na rota' : 'Add à rota'}
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#6B7F93]">Nenhum cliente encontrado.</div>}
        </div>
      </Card>

      <Sheet open={!!detailClient} onClose={closeDetail} title={detailClient?.nomeFantasia ?? ''} width={480}>
        {detailClient && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge label={CLIENT_STATUS_LABEL[detailClient.status]} color={CLIENT_STATUS_COLOR[detailClient.status]} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => addToRoute(detailClient)}><RouteIcon size={14} /> Adicionar à rota</Button>
                <Button variant="secondary" onClick={() => openEditForm(detailClient)}><Pencil size={14} /></Button>
              </div>
            </div>

            <div>
              <div className="text-[15px] font-semibold">{detailClient.razaoSocial || detailClient.nomeFantasia}</div>
              <div className="text-[12.5px] text-[#6B7F93]">{detailClient.cnpj || 'CNPJ não informado'} · {detailClient.segmento}</div>
            </div>

            {detailClient.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">{detailClient.tags.map((t) => <Tag key={t} label={t} />)}</div>
            )}

            <div className="flex items-start gap-2 text-[13px] text-[#33495E]">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#6B7F93]" />
              <span>
                {detailClient.endereco.logradouro}{detailClient.endereco.numero ? `, ${detailClient.endereco.numero}` : ''}
                {detailClient.endereco.bairro ? ` — ${detailClient.endereco.bairro}` : ''}, {detailClient.endereco.cidade}/{detailClient.endereco.uf}
              </span>
            </div>

            <LocationButtons lat={detailClient.endereco.lat} lng={detailClient.endereco.lng} />

            {(detailClient.telefone || detailClient.whatsapp) && (
              <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#33495E]">{detailClient.telefone}</div>
            )}

            {detailClient.observacoes && (
              <div>
                <div className="mb-1 text-[12px] font-medium text-[#6B7F93]">Observações</div>
                <p className="text-[13px] text-[#33495E]">{detailClient.observacoes}</p>
              </div>
            )}

            <div>
              <div className="mb-2 text-[12px] font-medium text-[#6B7F93]">Histórico de visitas</div>
              <div className="space-y-1.5">
                {clientVisits.length === 0 && <span className="text-[12.5px] text-[#6B7F93]">Nenhuma visita registrada ainda.</span>}
                {clientVisits.map((v, idx) => (
                  <div key={idx} className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[12.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#33495E]">{v.rota} — {formatDate(v.data)}</span>
                      <span className={v.status === 'visitado' ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{STOP_STATUS_LABEL[v.status as 'visitado' | 'nao_visitado']}</span>
                    </div>
                    {v.observacao && <div className="mt-1 text-[#6B7F93]">{v.observacao}</div>}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="danger" className="w-full" onClick={() => { if (confirm('Remover este cliente? Essa ação não pode ser desfeita.')) { deleteClient(detailClient.id); closeDetail() } }}>
              <Trash2 size={14} /> Remover cliente
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setFormOpen(false)}>Cancelar</Button><Button className="flex-1" onClick={submitForm}>Salvar</Button></div>}
      >
        <Field label="Nome fantasia"><Input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} /></Field>
        <Field label="Razão social"><Input value={form.razaoSocial ?? ''} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} /></Field>
        <Field label="CNPJ"><Input value={form.cnpj ?? ''} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></Field>
        <Field label="Segmento"><Input value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} placeholder="Ex: Loja de ferragens" /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
            {(['prospect', 'ativo', 'inativo', 'retorno', 'sem_interesse'] as ClientStatus[]).map((s) => <option key={s} value={s}>{CLIENT_STATUS_LABEL[s]}</option>)}
          </Select>
        </Field>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Endereço</div>

        <div className="mb-3">
          {hasLocation ? (
            <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2 text-[12px] text-[#16A34A]">
              <span className="flex items-center gap-1.5"><MapPin size={13} /> Localização definida ({form.endereco.lat.toFixed(5)}, {form.endereco.lng.toFixed(5)})</span>
              <button onClick={() => setHasLocation(false)} className="shrink-0 text-[11px] underline decoration-dotted">alterar</button>
            </div>
          ) : (
            <>
              <Button type="button" variant="secondary" className="mb-2 w-full" onClick={handleLocateForClient} disabled={locating}>
                <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual (estou no local)'}
              </Button>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
                  <Search size={14} />
                  <input
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearchForClient())}
                    placeholder="Ou buscar endereço para localizar…"
                    className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]"
                  />
                  <button type="button" onClick={handleAddressSearchForClient} className="shrink-0 text-[11px] font-medium text-[#3B82F6]">{addressSearching ? '...' : 'buscar'}</button>
                </div>
                {addressResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#CFE0F5] bg-white shadow-xl">
                    {addressResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => pickAddressResult(r)} className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#EAF3FC]">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-[#6B7F93]" />
                        <span className="text-[#0F2A44]">{r.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {locationError && <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-[#EF4444]"><AlertCircle size={12} className="mt-0.5 shrink-0" /> {locationError}</p>}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Logradouro"><Input value={form.endereco.logradouro} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, logradouro: e.target.value } })} /></Field>
          <Field label="Número"><Input value={form.endereco.numero ?? ''} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, numero: e.target.value } })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade"><Input value={form.endereco.cidade} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cidade: e.target.value } })} /></Field>
          <Field label="UF"><Input value={form.endereco.uf} maxLength={2} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, uf: e.target.value.toUpperCase() } })} /></Field>
        </div>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Contato</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone"><Input value={form.telefone ?? ''} onChange={(e) => setForm({ ...form, telefone: e.target.value, whatsapp: e.target.value })} /></Field>
          <Field label="WhatsApp"><Input value={form.whatsapp ?? ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        </div>

        <div className="mb-1.5 mt-2 text-[12px] font-medium text-[#6B7F93]">Tags</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {form.tags.map((t) => <Tag key={t} label={t} onRemove={() => removeTagFromForm(t)} />)}
        </div>
        <div className="mb-2 flex gap-1.5">
          <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTagToForm()} placeholder="Nova tag…" className="min-w-0 flex-1 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
          <Button variant="secondary" onClick={addTagToForm}><Plus size={13} /></Button>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
            <button key={t} onClick={() => setForm({ ...form, tags: [...form.tags, t] })} className="rounded-full border border-dashed border-[#CFE0F5] px-2 py-0.5 text-[11px] text-[#6B7F93] hover:border-[#3B82F6]/50 hover:text-[#3B82F6]">
              + {t}
            </button>
          ))}
        </div>

        <Field label="Observações"><Textarea rows={3} value={form.observacoes ?? ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
      </Sheet>
    </>
  )
}

~~~

## FILE: src/pages/Configuracoes.tsx

~~~tsx
import { useState } from 'react'
import { Download, RotateCcw, Smartphone, Fuel, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { initials } from '../lib/format'
import { FUEL_TYPE_LABEL } from '../lib/labels'
import type { FuelType } from '../types'

export default function Configuracoes() {
  const store = useAppStore()
  const [repName, setRepName] = useState(store.repName)
  const [companyName, setCompanyName] = useState(store.companyName)
  const [tipo, setTipo] = useState<FuelType>(store.vehicle.combustivel)
  const [consumo, setConsumo] = useState(String(store.vehicle.consumoKmL))
  const [preco, setPreco] = useState(String(store.vehicle.precoLitro))

  function saveProfile() {
    store.updateProfile({ repName, companyName })
  }

  function saveVehicle() {
    store.updateVehicle({ combustivel: tipo, consumoKmL: consumo === '' ? 0 : Number(consumo), precoLitro: preco === '' ? 0 : Number(preco) })
  }

  function exportData() {
    const data = localStorage.getItem('campovista-store') ?? '{}'
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campovista-dados.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-[20px] font-bold">Configurações</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Perfil, veículo, locais favoritos e dados do aplicativo</p>
      </div>

      <Card title="Perfil">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A] text-[14px] font-bold text-white">{initials(repName)}</div>
          <div>
            <div className="text-[14px] font-semibold">{repName}</div>
            <div className="text-[12px] text-[#6B7F93]">{companyName}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome do representante"><Input value={repName} onChange={(e) => setRepName(e.target.value)} /></Field>
          <Field label="Empresa / Razão social"><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
        </div>
        <Button onClick={saveProfile}>Salvar perfil</Button>
      </Card>

      <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Meu veículo</span>}>
        <p className="mb-3 text-[12.5px] text-[#6B7F93]">Usado como ponto de partida ao criar uma nova rota. Cada rota permite ajustar esses valores individualmente.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Combustível">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as FuelType)}>
              {Object.entries(FUEL_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Consumo médio (km/L)"><Input type="number" step="0.1" value={consumo} onChange={(e) => setConsumo(e.target.value)} /></Field>
          <Field label="Preço do combustível (R$/L)"><Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} /></Field>
        </div>
        <Button onClick={saveVehicle}>Salvar veículo</Button>
      </Card>

      <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Star size={14} /> Locais favoritos</span>}>
        <p className="mb-3 text-[12.5px] text-[#6B7F93]">Salvos em Buscar/Rota ao definir sua localização (ex: casa, escritório). Usados como ponto de partida rápido.</p>
        {store.favorites.length === 0 ? (
          <p className="text-[12.5px] text-[#6B7F93]">Nenhum local favorito salvo ainda.</p>
        ) : (
          <div className="space-y-2">
            {store.favorites.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px]">
                <span className="text-[#0F2A44]">{f.nome}</span>
                <button onClick={() => store.deleteFavorite(f.id)} className="text-[#6B7F93] hover:text-[#EF4444]"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Aplicativo (PWA)">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#3B82F6]/15 text-[#3B82F6]"><Smartphone size={17} /></div>
          <div className="text-[12.5px] text-[#6B7F93]">
            Este aplicativo pode ser instalado no celular ou computador. No Chrome/Edge, use o ícone de instalação na barra de
            endereço; no celular, use "Adicionar à tela inicial" no menu do navegador. Depois de instalado, funciona
            offline para as telas já visitadas.
          </div>
        </div>
      </Card>

      <Card title="Dados">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={exportData}><Download size={14} /> Exportar dados</Button>
          <Button variant="danger" className="flex-1" onClick={() => confirm('Restaurar dados de demonstração? Isso substitui os dados atuais.') && store.resetDemoData()}>
            <RotateCcw size={14} /> Restaurar dados de demonstração
          </Button>
        </div>
      </Card>
    </div>
  )
}

~~~

## FILE: src/pages/Despesas.tsx

~~~tsx
import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Sheet } from '../components/ui/Sheet'
import { KpiCard } from '../components/ui/StatTile'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { currency, formatDate, isToday } from '../lib/format'
import { EXPENSE_CATEGORY_LABEL, EXPENSE_CATEGORY_COLOR } from '../lib/labels'
import type { Expense, ExpenseCategory } from '../types'

function isSameMonth(date: string): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function empty(): Omit<Expense, 'id'> {
  return { data: new Date().toISOString(), categoria: 'combustivel', valor: 0, descricao: '' }
}

export default function Despesas() {
  const { expenses, clients, addExpense, deleteExpense } = useAppStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty())

  const thisMonth = expenses.filter((e) => isSameMonth(e.data))
  const today = expenses.filter((e) => isToday(e.data))
  const totalThisMonth = thisMonth.reduce((s, e) => s + e.valor, 0)
  const totalToday = today.reduce((s, e) => s + e.valor, 0)

  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>()
    thisMonth.forEach((e) => map.set(e.categoria, (map.get(e.categoria) ?? 0) + e.valor))
    return Array.from(map.entries()).map(([categoria, valor]) => ({ categoria, valor }))
  }, [thisMonth])

  const sorted = [...expenses].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  function submit() {
    if (!form.valor || !form.descricao.trim()) return
    addExpense(form)
    setForm(empty())
    setOpen(false)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">Despesas de Campo</h1>
          <p className="mt-1 text-[13px] text-[#6B7F93]">Combustível, pedágio, alimentação, hospedagem e outros gastos</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={15} /> Nova despesa</Button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="Despesas de hoje" value={currency(totalToday)} sub={`${today.length} lançamentos`} tone="accent" />
        <KpiCard label="Despesas do mês" value={currency(totalThisMonth)} sub={`${thisMonth.length} lançamentos`} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1" title="Por categoria (mês)">
          {byCategory.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-[#6B7F93]">Sem despesas este mês.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byCategory} dataKey="valor" nameKey="categoria" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {byCategory.map((c) => <Cell key={c.categoria} fill={EXPENSE_CATEGORY_COLOR[c.categoria]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#EAF3FC', border: '1px solid #CFE0F5', borderRadius: 6, fontSize: 12 }} formatter={(v) => currency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {byCategory.map((c) => (
                  <div key={c.categoria} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-[#33495E]"><span className="h-2 w-2 rounded-full" style={{ background: EXPENSE_CATEGORY_COLOR[c.categoria] }} /> {EXPENSE_CATEGORY_LABEL[c.categoria]}</span>
                    <span className="mono text-[#6B7F93]">{currency(c.valor)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="hidden grid-cols-[0.8fr_1fr_1.4fr_0.8fr_40px] gap-3 border-b border-[#CFE0F5] px-5 py-3 text-[11.5px] font-medium text-[#6B7F93] md:grid">
            <span>Data</span><span>Categoria</span><span>Descrição</span><span>Valor</span><span />
          </div>
          <div className="max-h-[380px] divide-y divide-[#E1EDFB] overflow-y-auto">
            {sorted.map((e) => (
              <div key={e.id} className="grid grid-cols-2 gap-2 px-5 py-3 text-[13px] md:grid-cols-[0.8fr_1fr_1.4fr_0.8fr_40px] md:items-center md:gap-3">
                <span className="text-[#6B7F93]">{formatDate(e.data)}</span>
                <span className="flex items-center gap-1.5 text-[#33495E]"><span className="h-2 w-2 rounded-full" style={{ background: EXPENSE_CATEGORY_COLOR[e.categoria] }} /> {EXPENSE_CATEGORY_LABEL[e.categoria]}</span>
                <span className="truncate text-[#33495E]">{e.descricao}</span>
                <span className="mono text-[#EF4444]">{currency(e.valor)}</span>
                <button onClick={() => deleteExpense(e.id)} className="justify-self-end text-[#6B7F93] hover:text-[#EF4444]"><Trash2 size={13} /></button>
              </div>
            ))}
            {sorted.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-[#6B7F93]">Nenhuma despesa registrada.</div>}
          </div>
        </Card>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nova despesa" footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button><Button className="flex-1" onClick={submit}>Salvar</Button></div>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><Input type="date" value={form.data.slice(0, 10)} onChange={(e) => setForm({ ...form, data: new Date(e.target.value).toISOString() })} /></Field>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as ExpenseCategory })}>
              {Object.entries(EXPENSE_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></Field>
        <Field label="Descrição"><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field>
        <Field label="Cliente relacionado (opcional)">
          <Select value={form.clientId ?? ''} onChange={(e) => setForm({ ...form, clientId: e.target.value || undefined })}>
            <option value="">Nenhum</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
          </Select>
        </Field>
      </Sheet>
    </>
  )
}

~~~

## FILE: src/pages/Historico.tsx

~~~tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Fuel, Gauge, MapPin, CheckCircle2, Play, Bookmark, Compass } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { KpiCard } from '../components/ui/StatTile'
import { Button } from '../components/ui/Button'
import { currency, formatDate, daysAgo } from '../lib/format'

type Period = 'todas' | '7dias' | 'mes'

export default function Historico() {
  const navigate = useNavigate()
  const { routes } = useAppStore()
  const [period, setPeriod] = useState<Period>('todas')

  const active = routes.filter((r) => r.status === 'em_andamento')
  const planned = routes.filter((r) => r.status === 'planejada')
  const concluded = routes.filter((r) => r.status === 'concluida')

  const filtered = useMemo(() => {
    return concluded.filter((r) => {
      if (period === 'todas') return true
      const finished = r.finalizadaEm ?? r.criadoEm
      const days = daysAgo(finished)
      return period === '7dias' ? days <= 7 : days <= 30
    })
  }, [concluded, period])

  const sorted = [...filtered].sort((a, b) => new Date(b.finalizadaEm ?? b.criadoEm).getTime() - new Date(a.finalizadaEm ?? a.criadoEm).getTime())

  const totalDistancia = filtered.reduce((s, r) => s + r.distanciaKm, 0)
  const totalCusto = filtered.reduce((s, r) => s + r.combustivel.custoEstimado, 0)
  const totalLitros = filtered.reduce((s, r) => s + r.combustivel.litrosEstimados, 0)

  const nothingAtAll = active.length === 0 && planned.length === 0 && concluded.length === 0

  if (nothingAtAll) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#3B82F6]"><Bookmark size={28} /></div>
        <h1 className="text-[18px] font-bold">Nenhum roteiro no histórico</h1>
        <p className="text-[13.5px] text-[#6B7F93]">Você ainda não criou nenhuma rota comercial. Monte sua rota em <strong>Buscar</strong> e ela aparece aqui.</p>
        <Button onClick={() => navigate('/buscar')}><Compass size={14} /> Ir para Buscar</Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Histórico de Rotas</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Rotas em andamento, planejadas e concluídas</p>
      </div>

      {active.length > 0 && (
        <Card className="mb-4" title="Em andamento">
          <div className="space-y-2">
            {active.map((r) => (
              <button key={r.id} onClick={() => navigate(`/rotas?id=${r.id}`)} className="flex w-full items-center justify-between rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2.5 text-left">
                <span className="flex items-center gap-2 text-[13px] text-[#0F2A44]"><Play size={13} className="text-[#16A34A]" /> {r.nome}</span>
                <span className="text-[11.5px] text-[#16A34A]">continuar →</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {planned.length > 0 && (
        <Card className="mb-4" title="Planejadas">
          <div className="space-y-2">
            {planned.map((r) => (
              <button key={r.id} onClick={() => navigate(`/rotas?id=${r.id}`)} className="flex w-full items-center justify-between rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2.5 text-left hover:bg-[#DCEAFB]">
                <div>
                  <div className="text-[13px] text-[#0F2A44]">{r.nome}</div>
                  <div className="text-[11px] text-[#6B7F93]">{r.paradas.length} paradas · {r.distanciaKm} km</div>
                </div>
                <span className="mono text-[11.5px] text-[#3B82F6]">{currency(r.combustivel.custoEstimado)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {concluded.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {([['todas', 'Todas'], ['7dias', 'Últimos 7 dias'], ['mes', 'Este mês']] as [Period, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)} className={`rounded-full border px-3 py-1 text-[12px] ${period === v ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>{l}</button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="Rotas concluídas" value={String(filtered.length)} />
            <KpiCard label="Distância total" value={`${Math.round(totalDistancia * 10) / 10} km`} />
            <KpiCard label="Combustível estimado" value={currency(totalCusto)} sub={`${totalLitros.toFixed(1)} L`} tone="accent" />
          </div>

          <Card className="!p-0 overflow-hidden">
            {sorted.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[#6B7F93]">Nenhuma rota concluída nesse período.</div>
            ) : (
              <div className="divide-y divide-[#E1EDFB]">
                {sorted.map((r) => {
                  const visitados = r.paradas.filter((p) => p.status === 'visitado').length
                  return (
                    <button key={r.id} onClick={() => navigate(`/rotas?id=${r.id}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[#EAF3FC]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#16A34A]/15 text-[#16A34A]"><CheckCircle2 size={16} /></div>
                        <div>
                          <div className="text-[13px] font-medium text-[#0F2A44]">{r.nome}</div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-[#6B7F93]">
                            <span>{formatDate(r.finalizadaEm ?? r.criadoEm)}</span>
                            <span className="flex items-center gap-1"><MapPin size={11} /> {visitados}/{r.paradas.length} visitados</span>
                            <span className="flex items-center gap-1"><Gauge size={11} /> {r.distanciaKm} km</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="mono flex items-center gap-1 text-[12.5px] text-[#3B82F6]"><Fuel size={12} /> {currency(r.combustivel.custoEstimado)}</span>
                        <ChevronRight size={15} className="text-[#6B7F93]" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}

~~~

## FILE: src/pages/Home.tsx

~~~tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, MapPin, Route as RouteIcon, Fuel, Users, AlertCircle, LocateFixed, ChevronRight, Compass, Gauge } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { cityAt } from '../services/geocoding'
import { haversineKm } from '../services/routing'
import { currency } from '../lib/format'

const NEARBY_RADIUS_KM = 15

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Home() {
  const navigate = useNavigate()
  const { repName, clients, routes, toggleDraftStop, draftStops } = useAppStore()

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [cityLabel, setCityLabel] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
      setLocation({ lat: pos.lat, lng: pos.lng })
      setCityLabel(await cityAt(pos.lat, pos.lng))
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  const activeRoute = routes.find((r) => r.status === 'em_andamento')
  const openRoutes = useMemo(() => routes.filter((r) => r.status !== 'concluida'), [routes])

  const visitsPlanned = openRoutes.reduce((s, r) => s + r.paradas.length, 0)
  const pendingVisits = openRoutes.reduce((s, r) => s + r.paradas.filter((p) => p.status === 'pendente').length, 0)
  const kmPlanned = Math.round(openRoutes.reduce((s, r) => s + r.distanciaKm, 0) * 10) / 10
  const fuelEstimate = openRoutes.reduce((s, r) => s + r.combustivel.custoEstimado, 0)

  const nearbyClients = useMemo(() => {
    if (!location) return []
    return clients
      .map((c) => ({ client: c, distanciaKm: Math.round(haversineKm(location, c.endereco) * 10) / 10 }))
      .filter((c) => c.distanciaKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .slice(0, 5)
  }, [location, clients])

  const nearbyProspects = useMemo(() => nearbyClients.filter((c) => c.client.status === 'prospect').length, [nearbyClients])

  function handleStartRoute() {
    if (activeRoute) return navigate(`/rotas?id=${activeRoute.id}`)
    const planned = routes.find((r) => r.status === 'planejada')
    if (planned) return navigate(`/rotas?id=${planned.id}`)
    if (draftStops.length > 0) return navigate('/rotas')
    navigate('/buscar')
  }

  function addNearbyToRoute(c: (typeof nearbyClients)[number]) {
    toggleDraftStop({
      id: c.client.id,
      origem: 'cliente',
      clientId: c.client.id,
      nome: c.client.nomeFantasia,
      endereco: `${c.client.endereco.logradouro}, ${c.client.endereco.cidade}/${c.client.endereco.uf}`,
      lat: c.client.endereco.lat,
      lng: c.client.endereco.lng,
      telefone: c.client.telefone,
      segmento: c.client.segmento,
    })
  }

  const firstName = repName.split(' ')[0]

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-[#0F2A44]">{greeting()}, {firstName}!</h1>
        {location ? (
          <p className="mt-1 flex items-center gap-1 text-[13px] text-[#6B7F93]">
            <MapPin size={13} /> Você está em {cityLabel ?? 'localização definida'}
          </p>
        ) : (
          <button onClick={handleLocate} disabled={locating} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#3B82F6] disabled:opacity-60">
            <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização'}
          </button>
        )}
        {locationError && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-[#EF4444]"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {locationError}</p>
        )}
      </div>

      {activeRoute && (
        <button onClick={() => navigate(`/rotas?id=${activeRoute.id}`)} className="mb-5 flex w-full items-center justify-between rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/10 px-4 py-3 text-left">
          <span className="flex items-center gap-2 text-[13px] font-medium text-[#0F2A44]">
            <Play size={14} className="text-[#16A34A]" /> Rota "{activeRoute.nome}" em andamento
          </span>
          <span className="text-[12px] font-medium text-[#16A34A]">continuar →</span>
        </button>
      )}

      <Card className="mb-5" title="Sua operação de hoje">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <RouteIcon size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{visitsPlanned}</div>
            <div className="text-[11px] text-[#6B7F93]">visitas planejadas</div>
          </div>
          <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <Gauge size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{kmPlanned} km</div>
            <div className="text-[11px] text-[#6B7F93]">km planejados</div>
          </div>
          <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <Fuel size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{currency(fuelEstimate)}</div>
            <div className="text-[11px] text-[#6B7F93]">combustível estimado</div>
          </div>
          <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
            <Users size={15} className="mb-1.5 text-[#3B82F6]" />
            <div className="text-[18px] font-bold text-[#0F2A44]">{location ? nearbyProspects : '—'}</div>
            <div className="text-[11px] text-[#6B7F93]">prospects próximos</div>
          </div>
        </div>
        {pendingVisits > 0 && (
          <p className="mt-3 text-[12.5px] text-[#6B7F93]">
            <strong className="text-[#0F2A44]">{pendingVisits}</strong> visita{pendingVisits > 1 ? 's' : ''} pendente{pendingVisits > 1 ? 's' : ''} nas rotas em aberto.
          </p>
        )}
      </Card>

      <Button className="mb-5 w-full !py-3.5 text-[15px]" onClick={handleStartRoute}>
        <Play size={16} /> Começar rota
      </Button>

      <Card
        title="Clientes próximos"
        action={
          <button onClick={() => navigate('/buscar')} className="flex items-center gap-1 text-[12px] font-medium text-[#3B82F6]">
            <Compass size={13} /> Prospectar
          </button>
        }
      >
        {!location ? (
          <div className="py-6 text-center">
            <p className="mb-3 text-[13px] text-[#6B7F93]">Ative sua localização para ver quem está perto de você agora.</p>
            <Button variant="secondary" onClick={handleLocate} disabled={locating}>
              <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização'}
            </Button>
          </div>
        ) : nearbyClients.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[#6B7F93]">Nenhum cliente cadastrado em até {NEARBY_RADIUS_KM} km. Que tal prospectar a região?</p>
        ) : (
          <div className="space-y-2">
            {nearbyClients.map((c) => {
              const inDraft = draftStops.some((p) => p.id === c.client.id)
              return (
                <div key={c.client.id} className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
                  <button onClick={() => navigate(`/clientes?id=${c.client.id}`)} className="flex w-full items-center justify-between gap-2 text-left">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[#0F2A44]">{c.client.nomeFantasia}</div>
                      <div className="truncate text-[11.5px] text-[#6B7F93]">{c.distanciaKm} km · {c.client.segmento}</div>
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-[#6B7F93]" />
                  </button>
                  <div className="mt-2 flex gap-2">
                    <LocationButtons lat={c.client.endereco.lat} lng={c.client.endereco.lng} size="sm" className="flex-1" />
                    <Button variant={inDraft ? 'secondary' : 'primary'} className="!px-3" onClick={() => addNearbyToRoute(c)}>
                      <RouteIcon size={13} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}

~~~

## FILE: src/pages/Relatorio.tsx

~~~tsx
import { useMemo } from 'react'
import { CalendarCheck, Gauge, Fuel, Wallet, UserPlus, Users, RotateCcw } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { KpiCard } from '../components/ui/StatTile'
import { currency, isToday } from '../lib/format'

export default function Relatorio() {
  const { routes, expenses, clients } = useAppStore()

  const todaysRoutes = useMemo(
    () => routes.filter((r) => (r.iniciadaEm && isToday(r.iniciadaEm)) || (r.finalizadaEm && isToday(r.finalizadaEm))),
    [routes],
  )
  const todaysStops = useMemo(() => todaysRoutes.flatMap((r) => r.paradas), [todaysRoutes])

  const visitasRealizadas = todaysStops.filter((p) => p.status === 'visitado').length
  const visitasNaoRealizadas = todaysStops.filter((p) => p.status === 'nao_visitado').length
  const visitasPendentes = todaysStops.filter((p) => p.status === 'pendente').length
  const retornosNecessarios = todaysStops.filter((p) => p.resultado === 'retornar').length

  const kmPlanejado = Math.round(todaysRoutes.reduce((s, r) => s + r.distanciaKm, 0) * 10) / 10
  const kmReal = todaysRoutes.some((r) => r.kmRealPercorrido != null)
    ? Math.round(todaysRoutes.reduce((s, r) => s + (r.kmRealPercorrido ?? 0), 0) * 10) / 10
    : null

  const combustivelEstimado = todaysRoutes.reduce((s, r) => s + r.combustivel.custoEstimado, 0)

  const todaysExpenses = useMemo(() => expenses.filter((e) => isToday(e.data)), [expenses])
  const combustivelReal = todaysExpenses.filter((e) => e.categoria === 'combustivel').reduce((s, e) => s + e.valor, 0)
  const outrasDespesas = todaysExpenses.filter((e) => e.categoria !== 'combustivel').reduce((s, e) => s + e.valor, 0)
  const custoTotalDia = (combustivelReal || combustivelEstimado) + outrasDespesas

  const prospectsEncontrados = useMemo(() => clients.filter((c) => isToday(c.criadoEm) && c.status === 'prospect').length, [clients])
  const clientesCadastrados = useMemo(() => clients.filter((c) => isToday(c.criadoEm)).length, [clients])

  const hasActivityToday = todaysRoutes.length > 0 || todaysExpenses.length > 0 || clientesCadastrados > 0

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Relatório do Dia</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
      </div>

      {!hasActivityToday ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-16 text-center">
          <CalendarCheck size={28} className="text-[#3B82F6]" />
          <p className="text-[13.5px] text-[#6B7F93]">Nenhuma atividade registrada hoje ainda. Comece uma rota ou registre uma despesa para ver o resumo aqui.</p>
        </div>
      ) : (
        <>
          <Card className="mb-4" title="Visitas de hoje">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Realizadas" value={String(visitasRealizadas)} tone="success" />
              <KpiCard label="Não realizadas" value={String(visitasNaoRealizadas)} tone="danger" />
              <KpiCard label="Pendentes" value={String(visitasPendentes)} />
              <KpiCard label="Retornos necessários" value={String(retornosNecessarios)} tone="accent" />
            </div>
          </Card>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Gauge size={14} /> Quilometragem</span>}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Planejado</span>
                <span className="mono font-medium text-[#0F2A44]">{kmPlanejado} km</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Realizado</span>
                <span className="mono font-medium text-[#0F2A44]">{kmReal != null ? `${kmReal} km` : '—'}</span>
              </div>
              {kmReal != null && (
                <div className="mt-1.5 flex items-center justify-between border-t border-[#E1EDFB] pt-1.5 text-[12.5px]">
                  <span className="text-[#6B7F93]">Diferença</span>
                  <span className={`mono font-medium ${kmReal > kmPlanejado ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>{kmReal > kmPlanejado ? '+' : ''}{Math.round((kmReal - kmPlanejado) * 10) / 10} km</span>
                </div>
              )}
            </Card>

            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Combustível</span>}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Estimado pela rota</span>
                <span className="mono font-medium text-[#0F2A44]">{currency(combustivelEstimado)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px]">
                <span className="text-[#6B7F93]">Gasto real (despesas)</span>
                <span className="mono font-medium text-[#0F2A44]">{combustivelReal > 0 ? currency(combustivelReal) : '—'}</span>
              </div>
            </Card>
          </div>

          <Card className="mb-4" title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Wallet size={14} /> Custo da operação hoje</span>}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6B7F93]">Outras despesas (pedágio, alimentação, etc.)</span>
              <span className="mono font-medium text-[#0F2A44]">{currency(outrasDespesas)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#E1EDFB] pt-2 text-[15px]">
              <span className="font-semibold text-[#33495E]">Custo total do dia</span>
              <span className="mono font-bold text-[#3B82F6]">{currency(custoTotalDia)}</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard label="Prospects encontrados" value={String(prospectsEncontrados)} tone="accent" />
            <KpiCard label="Clientes cadastrados" value={String(clientesCadastrados)} />
          </div>

          {(prospectsEncontrados > 0 || clientesCadastrados > 0) && (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6B7F93]">
              <UserPlus size={13} /> Continue prospectando para manter o funil de clientes ativo.
            </p>
          )}
          {retornosNecessarios > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#6B7F93]">
              <RotateCcw size={13} /> {retornosNecessarios} cliente{retornosNecessarios > 1 ? 's' : ''} pediu retorno — confira em <Users size={12} className="inline" /> Clientes.
            </p>
          )}
        </>
      )}
    </>
  )
}

~~~

## FILE: src/pages/Rotas.tsx

~~~tsx
import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import {
  Plus, Trash2, GripVertical, Wand2, Play, Flag, LocateFixed, Search,
  Gauge, Clock, Fuel, Pencil, X, Check, MinusCircle, Route as RouteEmptyIcon, Compass,
  Smartphone, List, PartyPopper, Star,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Field'
import { LocationButtons } from '../components/ui/LocationButtons'
import { getCurrentPosition } from '../services/geolocation'
import { currency, formatDateTime } from '../lib/format'
import { STOP_STATUS_COLOR, STOP_STATUS_LABEL, VISIT_RESULTADO_LABEL, stopStatusForResultado } from '../lib/labels'
import { HOME_BASE } from '../data/seed'
import type { RouteStop, Client, DraftStop, VisitResultado } from '../types'

function numberIcon(n: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}
const homeIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#5B8DEF;border:3px solid #fff;box-shadow:0 0 0 4px #5B8DEF33"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function clientAddress(c: Client): string {
  const e = c.endereco
  return [`${e.logradouro}${e.numero ? `, ${e.numero}` : ''}`, e.bairro, `${e.cidade}/${e.uf}`].filter(Boolean).join(' — ')
}

function clientToStop(c: Client): DraftStop {
  return { id: c.id, origem: 'cliente', clientId: c.id, nome: c.nomeFantasia, endereco: clientAddress(c), lat: c.endereco.lat, lng: c.endereco.lng, telefone: c.telefone, segmento: c.segmento }
}

type StopStatusPatch = Partial<Pick<RouteStop, 'status' | 'observacao' | 'resultado'>>

function StopVisitCard({
  routeId, stop, index, big, onStartVisit, onUpdateStatus,
}: {
  routeId: string
  stop: RouteStop
  index: number
  big?: boolean
  onStartVisit: (routeId: string, stopId: string) => void
  onUpdateStatus: (routeId: string, stopId: string, patch: StopStatusPatch) => void
}) {
  const finished = stop.status !== 'pendente'
  const [editing, setEditing] = useState(!finished)
  const [resultado, setResultado] = useState<VisitResultado | undefined>(stop.resultado)
  const [obs, setObs] = useState(stop.observacao ?? '')
  const started = !!stop.chegadaEm

  function finalize() {
    if (!resultado) return
    onUpdateStatus(routeId, stop.id, { status: stopStatusForResultado(resultado), resultado, observacao: obs })
    setEditing(false)
  }

  return (
    <div className={`rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] ${big ? 'p-5' : 'p-3'}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`mono flex shrink-0 items-center justify-center rounded-full font-bold ${big ? 'h-9 w-9 text-[13px] text-white' : 'h-6 w-6 text-[11px] text-[#0F2A44]'}`}
          style={{ background: STOP_STATUS_COLOR[stop.status], color: big ? '#FFFFFF' : undefined }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[#0F2A44] ${big ? 'text-[16px] font-semibold' : 'text-[13px]'}`}>{stop.nome}</div>
          <div className={`truncate text-[#6B7F93] ${big ? 'text-[12.5px]' : 'text-[11px]'}`}>{stop.endereco}</div>
        </div>
        {finished && !editing && (
          <button onClick={() => setEditing(true)} className="shrink-0 text-[#6B7F93] hover:text-[#0F2A44]"><Pencil size={13} /></button>
        )}
      </div>

      <LocationButtons lat={stop.lat} lng={stop.lng} size={big ? 'md' : 'sm'} className="mt-3" />

      {editing ? (
        <div className="mt-3 space-y-2">
          {!started ? (
            <Button className="w-full" onClick={() => onStartVisit(routeId, stop.id)}><Play size={13} /> Iniciar visita</Button>
          ) : (
            <>
              <div className="text-[11px] font-medium text-[#6B7F93]">Resultado da visita</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(VISIT_RESULTADO_LABEL) as VisitResultado[]).map((rOpt) => (
                  <button key={rOpt} onClick={() => setResultado(rOpt)} className={`rounded-full border px-2.5 py-1 text-[11px] ${resultado === rOpt ? 'border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#3B82F6]' : 'border-[#CFE0F5] text-[#6B7F93]'}`}>
                    {VISIT_RESULTADO_LABEL[rOpt]}
                  </button>
                ))}
              </div>
              <Textarea rows={2} placeholder="Observações da visita (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
              <Button className="w-full" disabled={!resultado} onClick={finalize}><Flag size={13} /> Finalizar visita</Button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-2.5 flex items-center justify-between rounded-[8px] bg-white px-3 py-2 text-[11.5px]">
          <span className="font-medium" style={{ color: STOP_STATUS_COLOR[stop.status] }}>
            {stop.resultado ? VISIT_RESULTADO_LABEL[stop.resultado] : STOP_STATUS_LABEL[stop.status]}
          </span>
        </div>
      )}
      {!editing && stop.observacao && <p className="mt-1.5 text-[11.5px] text-[#6B7F93]">{stop.observacao}</p>}
    </div>
  )
}

export default function Rotas() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const {
    routes, clients, draftOrigin, draftStops, favorites,
    setDraftOrigin, toggleDraftStop, removeDraftStop, clearDraft, addFavorite,
    createRoute, optimizeRoute, reorderRouteStops, removeStopFromRoute,
    updateRouteFuel, startRoute, startStopVisit, updateStopStatus, finishRoute, deleteRoute, renameRoute,
  } = useAppStore()

  const [routeName, setRouteName] = useState('Rota de hoje')
  const [clientQuery, setClientQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [modoCampo, setModoCampo] = useState(false)
  const [kmRealInput, setKmRealInput] = useState('')

  const routeId = params.get('id')
  const active = routes.filter((r) => r.status === 'em_andamento')
  const selectedRoute = routes.find((r) => r.id === routeId) ?? (!routeId ? active[0] : undefined)

  const matchingClients = useMemo(() => {
    if (!clientQuery.trim()) return []
    const q = clientQuery.toLowerCase()
    const draftIds = new Set(draftStops.map((p) => p.id))
    return clients.filter((c) => !draftIds.has(c.id) && c.nomeFantasia.toLowerCase().includes(q)).slice(0, 6)
  }, [clientQuery, clients, draftStops])

  async function handleLocate() {
    setLocating(true)
    setLocationError(null)
    try {
      const pos = await getCurrentPosition()
      setDraftOrigin({ lat: pos.lat, lng: pos.lng })
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.')
    } finally {
      setLocating(false)
    }
  }

  function handleCreateRoute() {
    if (draftStops.length === 0) return
    const origin = draftOrigin ?? { lat: HOME_BASE.lat, lng: HOME_BASE.lng }
    const route = createRoute({ nome: routeName.trim() || 'Rota de hoje', origemLat: origin.lat, origemLng: origin.lng, paradas: draftStops })
    clearDraft()
    setParams({ id: route.id })
  }

  function onDragEnd(result: DropResult) {
    if (!selectedRoute || !result.destination) return
    const ids = selectedRoute.paradas.map((p) => p.id)
    const [moved] = ids.splice(result.source.index, 1)
    ids.splice(result.destination.index, 0, moved)
    reorderRouteStops(selectedRoute.id, ids)
  }

  function handleFinishRoute(routeId: string) {
    const km = kmRealInput.trim() === '' ? undefined : Number(kmRealInput)
    finishRoute(routeId, km)
    navigate('/historico')
  }

  if (selectedRoute) {
    const r = selectedRoute
    const polyline: [number, number][] = [[r.origemLat, r.origemLng], ...r.paradas.map((p) => [p.lat, p.lng] as [number, number])]
    const isPlanned = r.status === 'planejada'
    const isActive = r.status === 'em_andamento'
    const isDone = r.status === 'concluida'
    const visitedCount = r.paradas.filter((p) => p.status !== 'pendente').length

    return (
      <>
        <button onClick={() => navigate('/historico')} className="mb-3 text-[12.5px] text-[#6B7F93] hover:text-[#33495E]">← Ver histórico de rotas</button>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="!w-56" />
                <button onClick={() => { renameRoute(r.id, nameDraft.trim() || r.nome); setEditingName(false) }} className="text-[#16A34A]"><Check size={16} /></button>
                <button onClick={() => setEditingName(false)} className="text-[#6B7F93]"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold">{r.nome}</h1>
                {!isDone && <button onClick={() => { setNameDraft(r.nome); setEditingName(true) }} className="text-[#6B7F93] hover:text-[#0F2A44]"><Pencil size={14} /></button>}
              </div>
            )}
            <p className="mt-1 text-[13px] text-[#6B7F93]">
              {r.paradas.length} paradas · {r.distanciaKm} km · ~{Math.round((r.duracaoMin / 60) * 10) / 10}h
              {isActive && <> · {visitedCount}/{r.paradas.length} registradas</>}
            </p>
          </div>
          <div className="flex gap-2">
            {isPlanned && (
              <>
                <Button variant="secondary" onClick={() => optimizeRoute(r.id)}><Wand2 size={14} /> Otimizar rota</Button>
                <Button onClick={() => startRoute(r.id)}><Play size={14} /> Iniciar rota</Button>
              </>
            )}
            {isActive && (
              <>
                <Button variant="secondary" onClick={() => setModoCampo((v) => !v)}>
                  {modoCampo ? <List size={14} /> : <Smartphone size={14} />} {modoCampo ? 'Ver todas as paradas' : 'Modo Campo'}
                </Button>
                <Button onClick={() => handleFinishRoute(r.id)}><Flag size={14} /> Finalizar rota</Button>
              </>
            )}
          </div>
        </div>

        {isActive && (
          <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2.5">
            <Gauge size={14} className="shrink-0 text-[#6B7F93]" />
            <span className="shrink-0 text-[12px] text-[#33495E]">Km real percorrido (opcional, ao finalizar)</span>
            <Input type="number" step="0.1" placeholder={`${r.distanciaKm} km planejados`} value={kmRealInput} onChange={(e) => setKmRealInput(e.target.value)} className="!w-32" />
          </div>
        )}

        {isActive && modoCampo ? (
          <div className="mx-auto max-w-md">
            {(() => {
              const nextIdx = r.paradas.findIndex((p) => p.status === 'pendente')
              const nextStop = nextIdx >= 0 ? r.paradas[nextIdx] : null
              if (!nextStop) {
                return (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-[#CFE0F5] bg-[#EAF3FC] p-8 text-center">
                    <PartyPopper size={28} className="text-[#16A34A]" />
                    <div className="text-[15px] font-semibold text-[#0F2A44]">Todas as paradas foram registradas!</div>
                    <p className="text-[12.5px] text-[#6B7F93]">Você concluiu {visitedCount} de {r.paradas.length} paradas desta rota.</p>
                    <Button onClick={() => handleFinishRoute(r.id)}><Flag size={14} /> Finalizar rota</Button>
                  </div>
                )
              }
              return (
                <>
                  <div className="mb-3 text-center text-[12px] font-medium text-[#6B7F93]">
                    Próxima parada · {nextIdx + 1} de {r.paradas.length} · {visitedCount}/{r.paradas.length} registradas
                  </div>
                  <StopVisitCard key={nextStop.id} routeId={r.id} stop={nextStop} index={nextIdx} big onStartVisit={startStopVisit} onUpdateStatus={updateStopStatus} />
                </>
              )
            })()}
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <div className="h-[300px] overflow-hidden rounded-xl border border-[#CFE0F5]">
              <MapContainer center={[r.origemLat, r.origemLng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <Marker position={[r.origemLat, r.origemLng]} icon={homeIcon}><Popup>Ponto de partida</Popup></Marker>
                {r.paradas.map((p, idx) => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={numberIcon(idx + 1, STOP_STATUS_COLOR[p.status])}><Popup>{idx + 1}. {p.nome}</Popup></Marker>
                ))}
                <Polyline positions={polyline} pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.75, dashArray: '6 6' }} />
              </MapContainer>
            </div>

            <Card title={isPlanned ? 'Paradas (arraste para reordenar)' : 'Paradas'}>
              {isPlanned ? (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="stops">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                        {r.paradas.map((p, idx) => (
                          <Draggable draggableId={p.id} index={idx} key={p.id}>
                            {(dragProvided) => (
                              <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2.5">
                                <span {...dragProvided.dragHandleProps} className="text-[#93A5BC]"><GripVertical size={15} /></span>
                                <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-[11px] font-bold text-white">{idx + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] text-[#0F2A44]">{p.nome}</div>
                                  <div className="truncate text-[11px] text-[#6B7F93]">{p.endereco}</div>
                                </div>
                                <button onClick={() => removeStopFromRoute(r.id, p.id)} className="text-[#6B7F93] hover:text-[#EF4444]"><Trash2 size={14} /></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : isActive ? (
                <div className="space-y-2">
                  {r.paradas.map((p, idx) => (
                    <StopVisitCard key={p.id} routeId={r.id} stop={p} index={idx} onStartVisit={startStopVisit} onUpdateStatus={updateStopStatus} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {r.paradas.map((p, idx) => (
                    <div key={p.id} className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] p-3">
                      <div className="flex items-center gap-2">
                        <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#0F2A44]" style={{ background: STOP_STATUS_COLOR[p.status] }}>{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[#0F2A44]">{p.nome}</div>
                          <div className="truncate text-[11px] text-[#6B7F93]">{p.endereco}</div>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium" style={{ color: STOP_STATUS_COLOR[p.status] }}>
                          {p.resultado ? VISIT_RESULTADO_LABEL[p.resultado] : STOP_STATUS_LABEL[p.status]}
                        </span>
                      </div>
                      {p.observacao && <p className="mt-2 text-[11.5px] text-[#6B7F93]">{p.observacao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card title="Resumo">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] py-3">
                  <Gauge size={15} className="mx-auto mb-1 text-[#16A34A]" />
                  <div className="text-[15px] font-semibold">{r.distanciaKm} km</div>
                  <div className="text-[10.5px] text-[#6B7F93]">distância total</div>
                </div>
                <div className="rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] py-3">
                  <Clock size={15} className="mx-auto mb-1 text-[#3B82F6]" />
                  <div className="text-[15px] font-semibold">{Math.round((r.duracaoMin / 60) * 10) / 10}h</div>
                  <div className="text-[10.5px] text-[#6B7F93]">tempo estimado</div>
                </div>
              </div>
              {r.kmRealPercorrido != null && (
                <div className="mt-3 flex items-center justify-between border-t border-[#E1EDFB] pt-3 text-[12.5px]">
                  <span className="text-[#6B7F93]">Km real percorrido</span>
                  <span className="mono font-medium text-[#0F2A44]">{r.kmRealPercorrido} km</span>
                </div>
              )}
            </Card>

            <Card title={<span className="flex items-center gap-1.5 text-[13px] font-medium text-[#33495E]"><Fuel size={14} /> Combustível</span>}>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#6B7F93]">Consumo (km/L)</label>
                  <Input type="number" step="0.1" value={r.combustivel.consumoKmL} onChange={(e) => updateRouteFuel(r.id, { consumoKmL: e.target.value === '' ? 0 : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] text-[#6B7F93]">Preço (R$/L)</label>
                  <Input type="number" step="0.01" value={r.combustivel.precoLitro} onChange={(e) => updateRouteFuel(r.id, { precoLitro: e.target.value === '' ? 0 : Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#E1EDFB] pt-3 text-[13px]">
                <span className="text-[#6B7F93]">Litros estimados</span>
                <span className="mono text-[#33495E]">{r.combustivel.litrosEstimados.toFixed(2)} L</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[14px]">
                <span className="font-medium text-[#33495E]">Custo estimado</span>
                <span className="mono font-semibold text-[#3B82F6]">{currency(r.combustivel.custoEstimado)}</span>
              </div>
            </Card>

            {r.iniciadaEm && (
              <Card>
                <div className="text-[11.5px] text-[#6B7F93]">Iniciada em {formatDateTime(r.iniciadaEm)}</div>
                {r.finalizadaEm && <div className="mt-1 text-[11.5px] text-[#6B7F93]">Finalizada em {formatDateTime(r.finalizadaEm)}</div>}
              </Card>
            )}

            {isPlanned && (
              <Button variant="danger" className="w-full" onClick={() => { if (confirm('Excluir esta rota?')) { deleteRoute(r.id); setParams({}) } }}>
                <Trash2 size={14} /> Excluir rota
              </Button>
            )}
          </div>
        </div>
        )}
      </>
    )
  }

  if (draftStops.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FC] text-[#3B82F6]"><RouteEmptyIcon size={28} /></div>
        <h1 className="text-[18px] font-bold">Seu roteiro está vazio</h1>
        <p className="text-[13.5px] text-[#6B7F93]">
          Nenhuma parada foi selecionada ainda. Vá até <strong>Buscar</strong>, defina sua localização e segmentos, e clique em{' '}
          <strong>"+ Adicionar à Rota"</strong> nos estabelecimentos e clientes que deseja visitar.
        </p>
        <Button onClick={() => navigate('/buscar')}><Compass size={14} /> Ir para Buscar</Button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold">Rota</h1>
        <p className="mt-1 text-[13px] text-[#6B7F93]">Revise as paradas, defina a origem e crie a rota otimizada</p>
      </div>

      <Card title="Nova rota" className="mx-auto max-w-xl">
        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Ponto de partida</label>
          {draftOrigin ? (
            <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 py-2 text-[12.5px] text-[#16A34A]">
              <span className="flex items-center gap-1.5"><LocateFixed size={14} /> Você está aqui</span>
              <div className="flex items-center gap-2">
                <button onClick={() => { const nome = prompt('Nome deste local (ex: Casa, Escritório)'); if (nome) addFavorite({ nome, lat: draftOrigin.lat, lng: draftOrigin.lng }) }} className="flex items-center gap-1 text-[11px] underline decoration-dotted"><Star size={11} /> salvar</button>
                <button onClick={handleLocate} className="text-[11px] underline decoration-dotted">atualizar</button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={handleLocate} disabled={locating}>
              <LocateFixed size={14} /> {locating ? 'Localizando…' : 'Usar minha localização atual'}
            </Button>
          )}
          {favorites.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {favorites.map((f) => (
                <button key={f.id} onClick={() => setDraftOrigin({ lat: f.lat, lng: f.lng })} className="rounded-full border border-[#CFE0F5] bg-[#EAF3FC] px-2.5 py-1 text-[11px] text-[#33495E] hover:bg-[#DCEAFB]">{f.nome}</button>
              ))}
            </div>
          )}
          {locationError && <p className="mt-1.5 text-[11px] text-[#EF4444]">{locationError}</p>}
          {!draftOrigin && <p className="mt-1.5 text-[11px] text-[#6B7F93]">Sem localização definida, a rota usa um ponto de partida padrão.</p>}
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Paradas selecionadas ({draftStops.length})</label>
          <div className="space-y-1.5">
            {draftStops.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-2.5 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-[#0F2A44]">{p.nome}</div>
                  <div className="truncate text-[10.5px] text-[#6B7F93]">{p.origem === 'cliente' ? 'cliente cadastrado' : 'prospecção'}</div>
                </div>
                <button onClick={() => removeDraftStop(p.id)} className="shrink-0 text-[#6B7F93] hover:text-[#EF4444]"><MinusCircle size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Adicionar cliente cadastrado</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-[8px] border border-[#CFE0F5] bg-[#EAF3FC] px-3 py-2 text-[13px] text-[#6B7F93]">
              <Search size={14} />
              <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder="Buscar por nome…" className="w-full bg-transparent text-[#0F2A44] outline-none placeholder:text-[#6B7F93]" />
            </div>
            {matchingClients.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[8px] border border-[#CFE0F5] bg-white shadow-xl">
                {matchingClients.map((c) => (
                  <button key={c.id} onClick={() => { toggleDraftStop(clientToStop(c)); setClientQuery('') }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[#DCEAFB]">
                    <Plus size={13} className="text-[#3B82F6]" /> {c.nomeFantasia}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-[#6B7F93]">Nome da rota</label>
          <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Ex: Rota Goiânia" />
        </div>

        <Button className="w-full" disabled={draftStops.length === 0} onClick={handleCreateRoute}>
          <Wand2 size={14} /> Criar e otimizar rota
        </Button>
      </Card>
    </>
  )
}

~~~

## FILE: src/services/geocoding.ts

~~~typescript
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

~~~

## FILE: src/services/geolocation.ts

~~~typescript
export interface Coordinates {
  lat: number
  lng: number
  accuracyM: number
}

// Pede a localização atual uma única vez (sem rastreamento contínuo em segundo plano).
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este navegador não suporta geolocalização.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy }),
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

~~~

## FILE: src/services/navigation.ts

~~~typescript
// Serviço próprio de navegação: encaminha o representante para o app de navegação já instalado
// no aparelho (Google Maps ou Waze), sem manter nenhuma lógica de rota própria.

export type NavigationApp = 'google' | 'waze'

export interface NavigationResult {
  ok: boolean
  message?: string
}

function hasValidCoords(lat?: number | null, lng?: number | null): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
}

export function openNavigation(lat?: number | null, lng?: number | null, app: NavigationApp = 'google'): NavigationResult {
  if (!hasValidCoords(lat, lng)) {
    return { ok: false, message: 'Sem coordenadas para traçar a navegação até este local.' }
  }
  const url =
    app === 'waze'
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) return { ok: false, message: 'Não foi possível abrir o app de navegação. Verifique o bloqueador de pop-ups.' }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Não foi possível abrir o app de navegação.' }
  }
}

~~~

## FILE: src/services/places.ts

~~~typescript
// Busca de estabelecimentos reais via Overpass API (dados do OpenStreetMap), sem chave de API.
// A cobertura depende do quanto a região está mapeada no OSM — pode variar por cidade.
import { haversineKm } from './routing'
import type { Segment, Establishment } from '../types'

interface OverpassNode {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Os espelhos públicos do Overpass variam muito de latência momento a momento. Em vez de tentar
// um de cada vez (o que soma os timeouts), disparamos todos em paralelo e usamos o primeiro que
// responder — muito mais rápido na prática, ao custo de eventualmente aceitar um espelho com
// menos dados do que outro mais lento traria.
const MIRRORS = [
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const MIRROR_TIMEOUT_MS = 8000

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&')
}

// "nwr" busca nos três tipos de elemento do OpenStreetMap de uma vez (node + way + relation) —
// um estabelecimento pode estar cadastrado em qualquer um dos três, e usar só "node"+"way" deixava
// de fora o que estivesse mapeado como relation.
function buildQuery(tags: { key: string; value: string }[], freeText: string[], lat: number, lng: number, radiusM: number): string {
  const byTag = tags.map((t) => `  nwr["${t.key}"="${t.value}"](around:${radiusM},${lat},${lng});\n`).join('')
  // Segmentos personalizados (sem tag OSM conhecida) caem para busca por nome do local.
  const byName = freeText
    .map((term) => {
      const re = escapeRegex(term)
      return `  nwr["name"~"${re}",i](around:${radiusM},${lat},${lng});\n`
    })
    .join('')
  return `[out:json][timeout:15];\n(\n${byTag}${byName});\nout center tags 200;`
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:street'], tags['addr:housenumber'], tags['addr:suburb'] ?? tags['addr:city']].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Endereço não informado no OpenStreetMap'
}

function fetchMirror(url: string, body: string, outerSignal: AbortSignal | undefined): Promise<{ elements: OverpassNode[] }> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  outerSignal?.addEventListener('abort', onAbort)
  const timer = setTimeout(() => controller.abort(), MIRROR_TIMEOUT_MS)
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) throw new Error(`mirror ${url} respondeu ${res.status}`)
      return res.json()
    })
    .then((json) => {
      if (!Array.isArray(json.elements)) throw new Error(`mirror ${url} resposta inválida`)
      return json as { elements: OverpassNode[] }
    })
    .finally(() => {
      clearTimeout(timer)
      outerSignal?.removeEventListener('abort', onAbort)
    })
}

// Dispara os espelhos todos em paralelo (nunca um de cada vez — isso é o que tornava a busca
// lenta). Usa o primeiro que trouxer resultados de verdade; um espelho que responde rápido mas
// vazio não pode "vencer" antes que os outros tenham chance de responder, senão perderíamos dados
// que outro espelho teria. Só aceita "zero resultados" quando TODOS os espelhos concordarem.
async function queryOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassNode[] }> {
  const body = `data=${encodeURIComponent(query)}`
  const settled = MIRRORS.map((mirror) => fetchMirror(mirror, body, signal).then((v) => ({ ok: true as const, v }), (e) => ({ ok: false as const, e })))

  return new Promise((resolve, reject) => {
    let pending = settled.length
    let emptyFallback: { elements: OverpassNode[] } | null = null
    settled.forEach((p) => {
      p.then((result) => {
        pending--
        if (result.ok) {
          if (result.v.elements.length > 0) {
            resolve(result.v)
            return
          }
          emptyFallback = result.v
        }
        if (pending === 0) {
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'))
          } else if (emptyFallback) {
            resolve(emptyFallback)
          } else {
            reject(new Error('Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.'))
          }
        }
      })
    })
  })
}

function establishmentsFrom(json: { elements: OverpassNode[] }, origin: { lat: number; lng: number }, categoryByTag: Map<string, string>): Establishment[] {
  const results: Establishment[] = []
  const seen = new Set<string>()
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) continue

    const tagKey = el.tags?.shop
      ? `shop=${el.tags.shop}`
      : el.tags?.craft
        ? `craft=${el.tags.craft}`
        : el.tags?.office
          ? `office=${el.tags.office}`
          : el.tags?.amenity
            ? `amenity=${el.tags.amenity}`
            : el.tags?.man_made
              ? `man_made=${el.tags.man_made}`
              : ''
    const categoria = categoryByTag.get(tagKey) ?? 'Estabelecimento'
    // Muitos estabelecimentos pequenos aparecem no OpenStreetMap com a categoria certa mas sem o
    // campo "nome" preenchido — mostramos mesmo assim (com a categoria como nome) em vez de
    // descartar um cliente real só porque falta esse dado no mapa.
    const nome = el.tags?.name ?? categoria

    // Deduplica por nome+coordenadas: o mesmo local pode aparecer como node e way ao mesmo tempo.
    const dedupeKey = `${nome.toLowerCase()}-${lat.toFixed(4)}-${lon.toFixed(4)}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    results.push({
      id: `${el.type}/${el.id}`,
      nome,
      endereco: formatAddress(el.tags ?? {}),
      lat,
      lng: lon,
      telefone: el.tags?.phone ?? el.tags?.['contact:phone'],
      categoria,
      horario: el.tags?.opening_hours,
      distanciaKm: Math.round(haversineKm(origin, { lat, lng: lon }) * 10) / 10,
    })
  }
  return results.sort((a, b) => a.distanciaKm - b.distanciaKm)
}

export interface PlacesSearchResult {
  results: Establishment[]
  /** Consulta Overpass QL combinada — útil só para depurar abrindo no Overpass Turbo. */
  query: string | null
  /** true quando pelo menos uma categoria pesquisada não respondeu (mas outras trouxeram dados). */
  partial: boolean
  /** Toda tag OSM realmente pesquisada nesta busca (união de todos os segmentos selecionados) — exibida na tela para conferência. */
  tagsUsed: { key: string; value: string; category: string }[]
}

// Monta o link do Overpass Turbo (ferramenta oficial do projeto OpenStreetMap) já com a mesma
// consulta usada pela busca, para conferir visualmente no mapa se existem dados cadastrados
// naquela região — sem depender do nosso código.
export function overpassTurboUrl(query: string): string {
  return `https://overpass-turbo.eu/?Q=${encodeURIComponent(query)}&R`
}

// Consulta ampla (qualquer shop=*, sem filtrar categoria) — diagnóstico independente da busca do
// app: mostra se o OpenStreetMap tem alguma loja cadastrada na região, ponto.
export function overpassAnyShopDebugUrl(origin: { lat: number; lng: number }, radiusKm: number): string {
  const radiusM = Math.round(radiusKm * 1000)
  const query = `[out:json][timeout:25];\n(\n  nwr["shop"](around:${radiusM},${origin.lat},${origin.lng});\n);\nout center tags 100;`
  return overpassTurboUrl(query)
}

// Busca estabelecimentos num raio exato a partir da origem informada — sem nenhuma expansão
// automática. O raio buscado é sempre exatamente o raio pedido pelo usuário.
//
// Cada tag/categoria pesquisada vira uma consulta Overpass PEQUENA e SEPARADA, todas disparadas em
// paralelo. Uma única consulta combinando várias tags de uma vez (ex: 3 segmentos = 5 tags = 10
// cláusulas "around") é pesada o bastante para os servidores públicos do Overpass — sobrecarregados
// — travarem com timeout de runtime, mesmo com poucos segundos de espera configurados. Consultas
// menores respondem muito mais rápido e, se uma categoria falhar, as outras continuam valendo.
export async function searchPlaces(
  segments: Segment[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  signal?: AbortSignal,
): Promise<PlacesSearchResult> {
  const tagSet = new Map<string, { key: string; value: string }>()
  const categoryByTag = new Map<string, string>()
  const freeText: string[] = []
  segments.forEach((s) => {
    if (s.osmTags.length === 0) {
      freeText.push(s.label)
      return
    }
    s.osmTags.forEach((t) => {
      const key = `${t.key}=${t.value}`
      tagSet.set(key, t)
      if (!categoryByTag.has(key)) categoryByTag.set(key, s.label)
    })
  })
  const tags = Array.from(tagSet.values())
  const tagsUsed = tags.map((t) => ({ ...t, category: categoryByTag.get(`${t.key}=${t.value}`) ?? '' }))
  if (tags.length === 0 && freeText.length === 0) return { results: [], query: null, partial: false, tagsUsed: [] }

  const radiusM = Math.round(radiusKm * 1000)
  // Consulta combinada guardada só para o link de diagnóstico (Overpass Turbo) — a execução real é
  // sempre dividida em consultas menores, abaixo.
  const combinedQuery = buildQuery(tags, freeText, origin.lat, origin.lng, radiusM)

  const clauseLabels = [...tags.map((t) => `${t.key}=${t.value}`), ...freeText.map((term) => `nome~"${term}"`)]
  const clauseQueries = [
    ...tags.map((t) => buildQuery([t], [], origin.lat, origin.lng, radiusM)),
    ...freeText.map((term) => buildQuery([], [term], origin.lat, origin.lng, radiusM)),
  ]
  console.log('[CampoVista] busca de estabelecimentos', {
    origem: origin,
    raioKm: radiusKm,
    segmentos: segments.map((s) => s.label),
    tagsGeradas: tagsUsed,
    termosLivres: freeText,
  })
  const settled = await Promise.all(
    clauseQueries.map((q, i) =>
      queryOverpass(q, signal).then(
        (v) => {
          console.log(`[CampoVista] "${clauseLabels[i]}" → ${v.elements.length} elemento(s)`)
          return v
        },
        (e) => {
          console.log(`[CampoVista] "${clauseLabels[i]}" → falhou (${e instanceof Error ? e.message : e})`)
          return null
        },
      ),
    ),
  )
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  if (settled.every((s) => s === null)) {
    const err = new Error('Não foi possível buscar estabelecimentos agora — os servidores públicos do OpenStreetMap podem estar sobrecarregados. Tente novamente em instantes.') as Error & { tagsUsed?: typeof tagsUsed }
    err.tagsUsed = tagsUsed
    throw err
  }

  const merged: OverpassNode[] = []
  settled.forEach((s) => { if (s) merged.push(...s.elements) })
  const results = establishmentsFrom({ elements: merged }, origin, categoryByTag)
  console.log('[CampoVista] resultado final', { elementosRecebidos: merged.length, resultadoFinal: results.length, algumaCategoriaFalhou: settled.some((s) => s === null) })
  return {
    results,
    query: combinedQuery,
    partial: settled.some((s) => s === null),
    tagsUsed,
  }
}

~~~

## FILE: src/services/routing.ts

~~~typescript
import type { FuelEstimate } from '../types'

export interface LatLng {
  lat: number
  lng: number
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

function routeLength(origin: LatLng, points: LatLng[]): number {
  let total = 0
  let current = origin
  for (const p of points) {
    total += haversineKm(current, p)
    current = p
  }
  return total
}

function reversedSegment<T>(arr: T[], i: number, j: number): T[] {
  return arr.slice(0, i).concat(arr.slice(i, j + 1).reverse(), arr.slice(j + 1))
}

// Monta a sequência de paradas: parte de nearest-neighbor e refina com 2-opt (busca local que
// desfaz cruzamentos no trajeto), considerando o conjunto todo dos pontos.
export function optimizeStopOrder<T extends LatLng>(origin: LatLng, points: T[]): { ordered: T[]; distanciaKm: number } {
  if (points.length <= 1) {
    const dist = points.length ? haversineKm(origin, points[0]) : 0
    return { ordered: [...points], distanciaKm: Math.round(dist * 10) / 10 }
  }

  const remaining = [...points]
  let current: LatLng = origin
  const nearestNeighborOrder: T[] = []
  while (remaining.length) {
    let bestIdx = 0
    let bestDist = Infinity
    remaining.forEach((p, idx) => {
      const d = haversineKm(current, p)
      if (d < bestDist) {
        bestDist = d
        bestIdx = idx
      }
    })
    const [next] = remaining.splice(bestIdx, 1)
    nearestNeighborOrder.push(next)
    current = next
  }

  let best = nearestNeighborOrder
  let bestLen = routeLength(origin, best)
  let improved = true
  let iterations = 0
  const maxIterations = 60
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = reversedSegment(best, i, j)
        const len = routeLength(origin, candidate)
        if (len + 1e-6 < bestLen) {
          best = candidate
          bestLen = len
          improved = true
        }
      }
    }
  }

  return { ordered: best, distanciaKm: Math.round(bestLen * 10) / 10 }
}

const AVG_SPEED_KMH = 28 // trânsito urbano/regional
const MINUTES_PER_STOP = 35

export function estimateDurationMin(distanceKm: number, stopsCount: number): number {
  return Math.round((distanceKm / AVG_SPEED_KMH) * 60 + stopsCount * MINUTES_PER_STOP)
}

export function estimateFuel(distanciaKm: number, consumoKmL: number, precoLitro: number): FuelEstimate {
  const consumo = consumoKmL > 0 ? consumoKmL : 0
  const litrosEstimados = consumo > 0 ? Math.round((distanciaKm / consumo) * 100) / 100 : 0
  const custoEstimado = Math.round(litrosEstimados * precoLitro * 100) / 100
  return { distanciaKm, consumoKmL, precoLitro, litrosEstimados, custoEstimado }
}

~~~

## FILE: src/services/streetView.ts

~~~typescript
// Serviço próprio de visualização de fachada (Street View): não depende de nenhuma API paga,
// só abre o Google Maps no modo Street View a partir de latitude/longitude.

export interface StreetViewResult {
  ok: boolean
  message?: string
}

function hasValidCoords(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  )
}

export function openStreetView(lat?: number | null, lng?: number | null): StreetViewResult {
  if (!hasValidCoords(lat, lng)) {
    return { ok: false, message: 'Street View não disponível para este local.' }
  }
  try {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) return { ok: false, message: 'Não foi possível abrir o Street View. Verifique o bloqueador de pop-ups.' }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Street View não disponível para este local.' }
  }
}

~~~

## FILE: src/store/appStore.ts

~~~typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { optimizeStopOrder, estimateDurationMin, estimateFuel, haversineKm } from '../services/routing'
import * as seed from '../data/seed'
import type {
  Client, ClientStatus, Expense, RoutePlan, RouteStop, StopStatus, DraftStop,
  VehicleSettings, FavoritePlace,
} from '../types'

function newId(): string {
  return crypto.randomUUID()
}

function nowISO(): string {
  return new Date().toISOString()
}

interface AppState {
  clients: Client[]
  routes: RoutePlan[]
  expenses: Expense[]
  favorites: FavoritePlace[]
  vehicle: VehicleSettings
  repName: string
  companyName: string

  draftOrigin: { lat: number; lng: number } | null
  draftStops: DraftStop[]

  addClient: (c: Omit<Client, 'id' | 'criadoEm' | 'tags'> & { tags?: string[] }) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  setClientStatus: (id: string, status: ClientStatus) => void

  addExpense: (e: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void

  addFavorite: (f: Omit<FavoritePlace, 'id'>) => void
  deleteFavorite: (id: string) => void

  updateVehicle: (patch: Partial<VehicleSettings>) => void
  updateProfile: (patch: { repName?: string; companyName?: string }) => void

  createRoute: (input: { nome: string; origemLat: number; origemLng: number; paradas: DraftStop[] }) => RoutePlan
  renameRoute: (routeId: string, nome: string) => void
  optimizeRoute: (routeId: string) => void
  reorderRouteStops: (routeId: string, orderedIds: string[]) => void
  removeStopFromRoute: (routeId: string, stopId: string) => void
  updateRouteFuel: (routeId: string, patch: Partial<Pick<VehicleSettings, 'consumoKmL' | 'precoLitro'>>) => void
  startRoute: (routeId: string) => void
  startStopVisit: (routeId: string, stopId: string) => void
  updateStopStatus: (routeId: string, stopId: string, patch: Partial<Pick<RouteStop, 'status' | 'observacao' | 'resultado'>>) => void
  finishRoute: (routeId: string, kmRealPercorrido?: number) => void
  deleteRoute: (routeId: string) => void

  setDraftOrigin: (origin: { lat: number; lng: number } | null) => void
  toggleDraftStop: (stop: DraftStop) => void
  removeDraftStop: (id: string) => void
  clearDraft: () => void

  resetDemoData: () => void
}

function stopFromDraft(d: DraftStop): RouteStop {
  return { ...d, status: 'pendente' }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: seed.clients,
      routes: [],
      expenses: seed.expenses,
      favorites: [],
      vehicle: { combustivel: 'gasolina', consumoKmL: 10, precoLitro: 6.2 },
      repName: 'Diego Silva',
      companyName: 'DS Representações',

      draftOrigin: null,
      draftStops: [],

      addClient: (c) => {
        const client: Client = { ...c, id: newId(), criadoEm: nowISO(), tags: c.tags ?? [] }
        set((s) => ({ clients: [client, ...s.clients] }))
        return client
      },
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      setClientStatus: (id, status) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, status } : c)) })),

      addExpense: (e) => set((s) => ({ expenses: [{ ...e, id: newId() }, ...s.expenses] })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addFavorite: (f) => set((s) => ({ favorites: [...s.favorites, { ...f, id: newId() }] })),
      deleteFavorite: (id) => set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),

      updateVehicle: (patch) => set((s) => ({ vehicle: { ...s.vehicle, ...patch } })),
      updateProfile: (patch) => set(patch),

      createRoute: ({ nome, origemLat, origemLng, paradas }) => {
        const origin = { lat: origemLat, lng: origemLng }
        const stops = paradas.map(stopFromDraft)
        const { ordered, distanciaKm } = optimizeStopOrder(origin, stops)
        const duracaoMin = estimateDurationMin(distanciaKm, ordered.length)
        const { consumoKmL, precoLitro } = get().vehicle
        const route: RoutePlan = {
          id: newId(),
          nome,
          origemLat,
          origemLng,
          paradas: ordered,
          distanciaKm,
          duracaoMin,
          status: 'planejada',
          combustivel: estimateFuel(distanciaKm, consumoKmL, precoLitro),
          criadoEm: nowISO(),
        }
        set((s) => ({ routes: [route, ...s.routes] }))
        return route
      },

      renameRoute: (routeId, nome) => set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, nome } : r)) })),

      optimizeRoute: (routeId) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const origin = { lat: r.origemLat, lng: r.origemLng }
            const { ordered, distanciaKm } = optimizeStopOrder(origin, r.paradas)
            return {
              ...r,
              paradas: ordered,
              distanciaKm,
              duracaoMin: estimateDurationMin(distanciaKm, ordered.length),
              combustivel: estimateFuel(distanciaKm, r.combustivel.consumoKmL, r.combustivel.precoLitro),
            }
          }),
        })),

      reorderRouteStops: (routeId, orderedIds) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const byId = new Map(r.paradas.map((p) => [p.id, p]))
            const paradas = orderedIds.map((id) => byId.get(id)).filter((p): p is RouteStop => !!p)
            const origin = { lat: r.origemLat, lng: r.origemLng }
            let current = origin
            let distanciaKm = 0
            for (const p of paradas) {
              distanciaKm += haversineKm(current, p)
              current = p
            }
            distanciaKm = Math.round(distanciaKm * 10) / 10
            return {
              ...r,
              paradas,
              distanciaKm,
              duracaoMin: estimateDurationMin(distanciaKm, paradas.length),
              combustivel: estimateFuel(distanciaKm, r.combustivel.consumoKmL, r.combustivel.precoLitro),
            }
          }),
        })),

      removeStopFromRoute: (routeId, stopId) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (!route) return
        const orderedIds = route.paradas.filter((p) => p.id !== stopId).map((p) => p.id)
        set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, paradas: r.paradas.filter((p) => p.id !== stopId) } : r)) }))
        get().reorderRouteStops(routeId, orderedIds)
      },

      updateRouteFuel: (routeId, patch) =>
        set((s) => ({
          routes: s.routes.map((r) => {
            if (r.id !== routeId) return r
            const consumoKmL = patch.consumoKmL ?? r.combustivel.consumoKmL
            const precoLitro = patch.precoLitro ?? r.combustivel.precoLitro
            return { ...r, combustivel: estimateFuel(r.distanciaKm, consumoKmL, precoLitro) }
          }),
        })),

      startRoute: (routeId) =>
        set((s) => ({ routes: s.routes.map((r) => (r.id === routeId ? { ...r, status: 'em_andamento', iniciadaEm: nowISO() } : r)) })),

      startStopVisit: (routeId, stopId) =>
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? { ...r, paradas: r.paradas.map((p) => (p.id === stopId ? { ...p, chegadaEm: nowISO() } : p)) } : r,
          ),
        })),

      updateStopStatus: (routeId, stopId, patch) =>
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId
              ? {
                  ...r,
                  paradas: r.paradas.map((p) =>
                    p.id === stopId
                      ? { ...p, ...patch, saidaEm: patch.status && patch.status !== 'pendente' ? nowISO() : p.saidaEm }
                      : p,
                  ),
                }
              : r,
          ),
        })),

      finishRoute: (routeId, kmRealPercorrido) => {
        const route = get().routes.find((r) => r.id === routeId)
        if (route) {
          route.paradas
            .filter((p) => p.status === 'visitado' && p.origem === 'cliente' && p.clientId)
            .forEach((p) => get().updateClient(p.clientId!, { ultimaVisitaEm: nowISO() }))
        }
        set((s) => ({
          routes: s.routes.map((r) =>
            r.id === routeId ? { ...r, status: 'concluida', finalizadaEm: nowISO(), kmRealPercorrido } : r,
          ),
        }))
      },

      deleteRoute: (routeId) => set((s) => ({ routes: s.routes.filter((r) => r.id !== routeId) })),

      setDraftOrigin: (origin) => set({ draftOrigin: origin }),
      toggleDraftStop: (stop) =>
        set((s) => {
          const exists = s.draftStops.some((p) => p.id === stop.id)
          return exists ? { draftStops: s.draftStops.filter((p) => p.id !== stop.id) } : { draftStops: [...s.draftStops, stop] }
        }),
      removeDraftStop: (id) => set((s) => ({ draftStops: s.draftStops.filter((p) => p.id !== id) })),
      clearDraft: () => set({ draftStops: [] }),

      resetDemoData: () =>
        set({
          clients: seed.clients,
          expenses: seed.expenses,
          favorites: [],
          routes: [],
          vehicle: { combustivel: 'gasolina', consumoKmL: 10, precoLitro: 6.2 },
          draftOrigin: null,
          draftStops: [],
        }),
    }),
    { name: 'campovista-store' },
  ),
)

export type { StopStatus }

~~~

## FILE: src/types/client.ts

~~~typescript
export type ClientStatus = 'prospect' | 'ativo' | 'inativo' | 'retorno' | 'sem_interesse'

export interface Address {
  logradouro: string
  numero?: string
  bairro?: string
  cidade: string
  uf: string
  lat: number
  lng: number
}

export interface Client {
  id: string
  nomeFantasia: string
  razaoSocial?: string
  cnpj?: string
  segmento: string
  status: ClientStatus
  telefone?: string
  whatsapp?: string
  endereco: Address
  observacoes?: string
  tags: string[]
  criadoEm: string
  ultimaVisitaEm?: string
}

~~~

## FILE: src/types/expense.ts

~~~typescript
export type ExpenseCategory = 'combustivel' | 'pedagio' | 'estacionamento' | 'alimentacao' | 'hospedagem' | 'outros'

export interface Expense {
  id: string
  data: string
  categoria: ExpenseCategory
  valor: number
  descricao: string
  clientId?: string
}

~~~

## FILE: src/types/index.ts

~~~typescript
export * from './client'
export * from './route'
export * from './expense'
export * from './vehicle'
export * from './prospecting'

~~~

## FILE: src/types/prospecting.ts

~~~typescript
export interface Segment {
  id: string
  label: string
  osmTags: { key: string; value: string }[]
}

export interface Establishment {
  id: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  categoria: string
  horario?: string
  distanciaKm: number
}

~~~

## FILE: src/types/route.ts

~~~typescript
export type StopStatus = 'pendente' | 'visitado' | 'nao_visitado'
export type StopOrigin = 'cliente' | 'prospect'

export type VisitResultado =
  | 'venda_realizada'
  | 'pedido_negociacao'
  | 'proposta_enviada'
  | 'retornar'
  | 'sem_interesse'
  | 'nao_atendido'
  | 'cliente_nao_encontrado'
  | 'outro'

export interface RouteStop {
  id: string
  origem: StopOrigin
  clientId?: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  segmento?: string
  status: StopStatus
  resultado?: VisitResultado
  observacao?: string
  chegadaEm?: string
  saidaEm?: string
}

export type RouteStatus = 'planejada' | 'em_andamento' | 'concluida'

export interface FuelEstimate {
  distanciaKm: number
  consumoKmL: number
  precoLitro: number
  litrosEstimados: number
  custoEstimado: number
}

export interface RoutePlan {
  id: string
  nome: string
  origemLat: number
  origemLng: number
  paradas: RouteStop[]
  distanciaKm: number
  duracaoMin: number
  status: RouteStatus
  combustivel: FuelEstimate
  criadoEm: string
  iniciadaEm?: string
  finalizadaEm?: string
  kmRealPercorrido?: number
}

export interface DraftStop {
  id: string
  origem: StopOrigin
  clientId?: string
  nome: string
  endereco: string
  lat: number
  lng: number
  telefone?: string
  segmento?: string
}

~~~

## FILE: src/types/vehicle.ts

~~~typescript
export type FuelType = 'gasolina' | 'etanol' | 'diesel' | 'gnv' | 'eletrico'

export interface VehicleSettings {
  combustivel: FuelType
  consumoKmL: number
  precoLitro: number
}

export interface FavoritePlace {
  id: string
  nome: string
  lat: number
  lng: number
}

~~~

## FILE: tsconfig.app.json

~~~json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}

~~~

## FILE: tsconfig.json

~~~json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

~~~

## FILE: tsconfig.node.json

~~~json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}

~~~

## FILE: vite.config.ts

~~~typescript
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CampoVista',
        short_name: 'CampoVista',
        description: 'O copiloto do representante em campo: geolocalização, prospecção por segmento, roteirização, Street View, navegação, registro de visitas e controle de combustível e despesas.',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})

~~~

## DEPENDÊNCIAS

Do `package.json` (arquivo completo já incluído acima):

**dependencies**: `@hello-pangea/dnd`, `leaflet`, `lucide-react`, `react`, `react-dom`, `react-leaflet`, `react-router-dom`, `recharts`, `zustand`

**devDependencies**: `@tailwindcss/vite`, `@types/leaflet`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `autoprefixer`, `oxlint`, `postcss`, `tailwindcss`, `typescript`, `vite`, `vite-plugin-pwa`

Instale com `npm install` (isso regenera o `package-lock.json` corretamente para o novo ambiente).

## APIS E INTEGRAÇÕES — LEVANTAMENTO COMPLETO

### 1. OpenStreetMap / Overpass API (ATIVA hoje — é a fonte de busca de estabelecimentos em uso)
- **Arquivo**: `src/services/places.ts`
- **Endpoints usados** (3 espelhos públicos, disparados em paralelo, sem chave): `https://overpass.osm.ch/api/interpreter`, `https://overpass-api.de/api/interpreter`, `https://overpass.kumi.systems/api/interpreter`
- **Variável de ambiente**: nenhuma — API pública, sem autenticação.
- **O que faz**: recebe os segmentos selecionados (`Segment.osmTags`), monta uma consulta Overpass QL por tag (`nwr["key"="value"](around:raio,lat,lng)`), roda todas em paralelo, mescla e deduplica os resultados, calcula distância via Haversine (`haversineKm` em `src/services/routing.ts`).
- **Mapeamento de segmentos**: `src/data/segments.ts` — cada `Segment` tem um array `osmTags: {key, value}[]`. É o único lugar que define quais tags do OpenStreetMap correspondem a cada segmento do CampoVista.
- **Tratamento node/way/relation**: a consulta usa `nwr[...]`, que já cobre os três tipos de elemento do OSM de uma vez (node + way + relation) — implementado assim para não perder estabelecimentos cadastrados como `relation`.
- **Deduplicação**: por `${nome}-${lat.toFixed(4)}-${lng.toFixed(4)}` dentro de `establishmentsFrom()`.
- **Tratamento de erro**: cada mirror é isolado (`fetchMirror`); se todos falharem, lança erro explícito em vez de dizer "zero resultados"; se pelo menos uma tag falhar mas outras responderem, marca `partial: true` e avisa na UI.
- **Diagnóstico embutido**: `overpassTurboUrl()` e `overpassAnyShopDebugUrl()` geram links prontos para o usuário conferir a consulta direto no Overpass Turbo, fora do app.

### 2. Google Places API (Text Search) — CÓDIGO REMOVIDO do estado atual, não está no export acima
Houve uma tentativa de usar o Google Places API (New) como alternativa ao OpenStreetMap (cobertura muito melhor em cidades pequenas, mas com custo). Essa integração foi implementada, testada em produção (chegou a bater num erro real de cota 429 do Google, confirmando que a integração funcionava), e depois **revertida a pedido do usuário**, que optou por voltar ao OpenStreetMap gratuito. O arquivo `src/services/googlePlaces.ts` foi deletado do projeto — por isso não aparece na exportação acima, que reflete fielmente o estado atual do código.

Se for reativado no futuro, a implementação seguia este formato (para referência, **não presente no código atual**):
- Endpoint: `POST https://places.googleapis.com/v1/places:searchText`
- Headers: `X-Goog-Api-Key` (a chave) e `X-Goog-FieldMask`
- Variável de ambiente: `VITE_GOOGLE_PLACES_API_KEY` (injetada no build a partir de um segredo do GitHub Actions)
- Uma requisição de texto por segmento selecionado, em paralelo, com a mesma filosofia de resiliência a falha parcial da busca via Overpass.

### 3. Nominatim / geocodificação de endereço
- **Arquivo**: `src/services/geocoding.ts`
- Usado para converter um endereço digitado em coordenadas (`searchAddress`) e coordenadas em endereço (`addressAt`), sem chave de API.

### 4. Geolocalização do dispositivo
- **Arquivo**: `src/services/geolocation.ts`
- Usa a API nativa do navegador (`navigator.geolocation.getCurrentPosition`), sem serviço externo nem chave.

### 5. Street View
- **Arquivo**: `src/services/streetView.ts`
- Abre a URL pública do Google Maps Street View (`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=lat,lng`) numa nova aba — não requer chave de API porque não é uma chamada de API, é só um link.

### 6. Navegação (Google Maps / Waze)
- **Arquivo**: `src/services/navigation.ts`
- Abre `https://www.google.com/maps/dir/?api=1&destination=lat,lng&travelmode=driving` ou `https://waze.com/ul?ll=lat,lng&navigate=yes` numa nova aba — também apenas links públicos, sem chave.

### 7. Mapa (visualização)
- **Bibliotecas**: `leaflet` + `react-leaflet`
- **Tiles**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` — tiles públicos do OpenStreetMap, sem chave.

## VARIÁVEIS DE AMBIENTE

Nenhuma variável de ambiente é necessária no estado ATUAL do projeto (toda busca/mapa/navegação usa serviços públicos sem chave). O arquivo `.env.example` abaixo está preparado apenas para o caso de reativar o Google Places no futuro:

~~~
# Nenhuma variável é necessária hoje — o projeto usa OpenStreetMap/Overpass (sem chave).
# Deixe pronto apenas se for reativar a busca via Google Places no futuro:
# VITE_GOOGLE_PLACES_API_KEY=SUA_API_KEY_AQUI
~~~

## COMO EXECUTAR NO GOOGLE AI STUDIO

1. Criar um novo projeto e importar todos os arquivos listados na "ESTRUTURA DO PROJETO" acima, nos mesmos caminhos.
2. Rodar `npm install` para instalar as dependências do `package.json` (isso gera um novo `package-lock.json` — não é necessário copiar o antigo).
3. Criar um arquivo `.env.local` na raiz **somente se for reativar o Google Places** (ver seção anterior) — não é necessário para rodar o app como está hoje.
4. Rodar `npm run dev` e abrir a URL local indicada pelo Vite.
5. **Testar geolocalização**: na tela "Buscar", clicar em "Usar minha localização atual" — o navegador vai pedir permissão de geolocalização.
6. **Testar busca de estabelecimentos**: escolher um segmento (ex: "Farmácia"), definir raio e clicar em "Buscar Clientes na Região" — deve consultar o Overpass e listar resultados (ou mostrar zero, com o link de diagnóstico do Overpass Turbo, se a região tiver pouca cobertura no OpenStreetMap).
7. **Testar mapa**: confirmar que o mapa carrega os tiles do OpenStreetMap e mostra o marcador de origem e dos resultados.
8. **Testar criação de rota**: selecionar 2+ estabelecimentos com "Adicionar à Rota", ir em "Rotas" → "Criar e otimizar rota" — deve gerar uma única rota com todas as paradas otimizadas (nearest-neighbor + 2-opt).
9. **Testar navegação**: numa parada da rota, clicar em "Google Maps" ou "Waze" — deve abrir o app/site de navegação numa nova aba com o destino certo.
10. Para gerar build de produção: `npm run build` (ou `npm run build -- --base=/subpasta/` se for publicar em subcaminho).

## PONTOS DEPENDENTES DO AMBIENTE ATUAL

- **`package-lock.json`**: não incluído no export (é gerado automaticamente por `npm install`; não deve ser copiado manualmente entre ambientes/versões de Node diferentes).
- **`public/pwa-192.png` e `public/pwa-512.png`**: são arquivos binários (ícones do PWA). Não podem ser representados como texto neste arquivo `.md`. O Google AI Studio precisará desses dois PNGs (ou substitutos equivalentes) na pasta `public/` para o `vite-plugin-pwa` gerar o manifesto do PWA corretamente; sem eles, o build ainda funciona, mas o app instalável (PWA) fica sem ícone.
- **Deploy automático via GitHub Actions** (`.github/workflows/deploy-pages.yml`): esse workflow só funciona dentro de um repositório GitHub com GitHub Pages habilitado — não tem efeito nenhum rodando localmente ou no Google AI Studio. É só documentação de como o app é publicado hoje (`suportedsrepresentacoes-lang/secretario-comercial`, branch `gh-pages`).
- **Base path do build** (`--base=/secretario-comercial/`): esse parâmetro é específico do endereço atual no GitHub Pages (`https://suportedsrepresentacoes-lang.github.io/secretario-comercial/`). Rodando em outro domínio/ambiente, deve ser removido ou ajustado (ou simplesmente usar `npm run build` sem esse parâmetro para publicar na raiz).
- **Nenhum backend, nenhuma conta de usuário, nenhum banco de dados**: todo o estado (clientes, rotas, despesas, favoritos) é salvo só no `localStorage` do navegador via Zustand (`src/store/appStore.ts`, chave `campovista-store`). Isso significa que os dados **não** são compartilhados entre dispositivos nem persistem se o usuário limpar os dados do navegador — é assim no ambiente atual (GitHub Pages) e vai continuar assim igual no Google AI Studio, a não ser que um backend seja adicionado.
- **Overpass API (OpenStreetMap)**: são servidores públicos de terceiros, fora do controle deste projeto — podem ficar temporariamente indisponíveis ou lentos independentemente do ambiente de execução (isso já aconteceu durante o desenvolvimento e está tratado no código com múltiplos espelhos e mensagens de erro específicas, mas não pode ser eliminado por completo).
- **Nenhum caminho absoluto do ambiente atual do Claude Code** foi encontrado no código (todos os imports são relativos ou de pacotes npm) — não há nada que amarre o código a este ambiente específico além dos pontos listados acima.
