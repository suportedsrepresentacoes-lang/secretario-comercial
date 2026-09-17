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
