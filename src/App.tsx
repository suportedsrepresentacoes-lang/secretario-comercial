import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Mapa = lazy(() => import('./pages/Mapa'))
const Rotas = lazy(() => import('./pages/Rotas'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Visitas = lazy(() => import('./pages/Visitas'))
const Crm = lazy(() => import('./pages/Crm'))
const WhatsApp = lazy(() => import('./pages/WhatsApp'))
const IaComercial = lazy(() => import('./pages/IaComercial'))
const FollowUps = lazy(() => import('./pages/FollowUps'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Industrias = lazy(() => import('./pages/Industrias'))
const Comissoes = lazy(() => import('./pages/Comissoes'))
const Despesas = lazy(() => import('./pages/Despesas'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-[13px] text-[#8D95A3]">
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/visitas" element={<Visitas />} />
            <Route path="/crm" element={<Crm />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/ia" element={<IaComercial />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/industrias" element={<Industrias />} />
            <Route path="/comissoes" element={<Comissoes />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
