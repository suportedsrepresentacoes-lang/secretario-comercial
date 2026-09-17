import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

// MVP: foco em geolocalização, prospecção, roteirização, Street View, navegação,
// registro de visitas e controle de combustível/despesas. Os demais módulos de CRM
// completo (agenda, pedidos, produtos, indústrias, comissões, WhatsApp, IA, relatórios
// financeiros) seguem preservados em src/pages/ para evoluções futuras, mas ficam fora
// da navegação e das rotas desta primeira versão.
const Home = lazy(() => import('./pages/Home'))
const Prospeccao = lazy(() => import('./pages/Prospeccao'))
const Rotas = lazy(() => import('./pages/Rotas'))
const Salvas = lazy(() => import('./pages/Salvas'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Despesas = lazy(() => import('./pages/Despesas'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-[13px] text-[#6B7F93]">
      Carregando…
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/buscar" element={<Prospeccao />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/salvas" element={<Salvas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
