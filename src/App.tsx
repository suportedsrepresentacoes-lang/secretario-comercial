import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

// MVP: foco em roteirização, prospecção, clientes, visitas e custo de combustível.
// Os demais módulos (CRM, WhatsApp, IA, pedidos, produtos, indústrias, comissões,
// despesas, relatórios) seguem preservados em src/pages/ para evoluções futuras,
// mas ficam fora da navegação e das rotas desta primeira versão.
const Prospeccao = lazy(() => import('./pages/Prospeccao'))
const Rotas = lazy(() => import('./pages/Rotas'))
const Salvas = lazy(() => import('./pages/Salvas'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-[13px] text-[#8F8676]">
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
            <Route path="/" element={<Prospeccao />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/salvas" element={<Salvas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
