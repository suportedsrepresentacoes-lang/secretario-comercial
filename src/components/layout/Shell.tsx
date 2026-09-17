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
