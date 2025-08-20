import React from 'react'
import DashboardCharts from './components/DashboardCharts.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600" />
            <span className="text-lg font-semibold">Sustentus — Dashboard Charts</span>
          </div>
        </div>
      </header>
      <DashboardCharts />
    </div>
  );
}
