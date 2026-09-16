import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

export default function AppShell() {
  return (
    <div
      className="flex min-h-dvh w-full flex-col bg-[#F7F4EE] text-[#2B2620]"
      style={{ fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" }}
    >
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-20 sm:px-6 sm:py-6 sm:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
