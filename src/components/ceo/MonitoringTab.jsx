import { useState, useEffect, useMemo } from 'react'
import {
  RefreshCw, Package, AlertTriangle, TrendingUp,
  ChevronDown, ChevronRight, Coffee, Target, Layers,
  ArrowUpRight, ArrowDownRight, Activity, Eye, EyeOff,
  BarChart3, PieChart, Zap, Flame, ShieldCheck, Star,
  CheckCircle, XCircle, Info, Box, Droplets, Clock
} from 'lucide-react'

export default function MonitoringTab({ cups, fetchCups }) {
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('cards') // cards | compact
  const [expandedCup, setExpandedCup] = useState(null)
  const [showDistribution, setShowDistribution] = useState(true)
  const [showAlerts, setShowAlerts] = useState(true)
  const [sortBy, setSortBy] = useState('default') // default | stock-asc | stock-desc | sold-desc | name
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
  }, [])

  // ==================== REFRESH ====================
  const handleRefresh = async () => {
    setLoading(true)
    await fetchCups()
    setTimeout(() => setLoading(false), 600)
  }

  // ==================== COMPUTED ====================
  const totalStok = cups.reduce((a, c) => a + (c.stok_sekarang || 0), 0)
  const totalTerjual = cups.reduce((a, c) => a + (c.terjual_cup || 0), 0)
  const totalAwal = cups.reduce((a, c) => a + (c.stok_awal || 0), 0)
  const avgSold = cups.length > 0 ? Math.round(totalTerjual / cups.length) : 0

  const overallSisaPct = totalAwal > 0 ? Math.round((totalStok / totalAwal) * 100) : 100
  const overallTerjualPct = totalAwal > 0 ? Math.round((totalTerjual / totalAwal) * 100) : 0

  // Health status
  const healthStatus = useMemo(() => {
    if (overallSisaPct >= 50) return { label: 'Sehat', color: 'emerald', emoji: '✅', desc: 'Stok dalam kondisi baik' }
    if (overallSisaPct >= 25) return { label: 'Waspada', color: 'amber', emoji: '⚠️', desc: 'Stok mulai menipis' }
    return { label: 'Kritis', color: 'red', emoji: '🚨', desc: 'Segera restok!' }
  }, [overallSisaPct])

  // Alerts
  const lowStockCups = cups.filter(c => {
    const pct = c.stok_awal > 0 ? (c.stok_sekarang / c.stok_awal) * 100 : 100
    return pct < 25
  })

  const emptyStockCups = cups.filter(c => c.stok_sekarang <= 0)

  // Top seller
  const topSeller = cups.length > 0
    ? [...cups].sort((a, b) => b.terjual_cup - a.terjual_cup)[0]
    : null

  // Color palette
  const cupColors = [
    { from: '#3b82f6', to: '#1d4ed8', light: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-100', gradient: 'from-blue-500 to-blue-600' },
    { from: '#8b5cf6', to: '#6d28d9', light: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', ring: 'ring-violet-100', gradient: 'from-violet-500 to-violet-600' },
    { from: '#f59e0b', to: '#d97706', light: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-100', gradient: 'from-amber-500 to-amber-600' },
    { from: '#10b981', to: '#059669', light: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-100', gradient: 'from-emerald-500 to-emerald-600' },
    { from: '#ef4444', to: '#dc2626', light: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', ring: 'ring-red-100', gradient: 'from-red-500 to-red-600' },
    { from: '#ec4899', to: '#db2777', light: 'pink', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', ring: 'ring-pink-100', gradient: 'from-pink-500 to-pink-600' },
    { from: '#06b6d4', to: '#0891b2', light: 'cyan', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', ring: 'ring-cyan-100', gradient: 'from-cyan-500 to-cyan-600' },
    { from: '#f97316', to: '#ea580c', light: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-100', gradient: 'from-orange-500 to-orange-600' },
  ]

  // Sorted cups
  const sortedCups = useMemo(() => {
    const arr = [...cups]
    switch (sortBy) {
      case 'stock-asc': return arr.sort((a, b) => a.stok_sekarang - b.stok_sekarang)
      case 'stock-desc': return arr.sort((a, b) => b.stok_sekarang - a.stok_sekarang)
      case 'sold-desc': return arr.sort((a, b) => b.terjual_cup - a.terjual_cup)
      case 'name': return arr.sort((a, b) => a.nama_cup.localeCompare(b.nama_cup))
      default: return arr
    }
  }, [cups, sortBy])

  // Per cup data enrichment
  const enrichedCups = useMemo(() => {
    return sortedCups.map((cup, i) => {
      const color = cupColors[i % cupColors.length]
      const sisaPct = cup.stok_awal > 0 ? Math.round((cup.stok_sekarang / cup.stok_awal) * 100) : 100
      const terjualPct = cup.stok_awal > 0 ? Math.round((cup.terjual_cup / cup.stok_awal) * 100) : 0
      const shareOfTotal = totalTerjual > 0 ? Math.round((cup.terjual_cup / totalTerjual) * 100) : 0
      const isLow = sisaPct < 25
      const isEmpty = cup.stok_sekarang <= 0
      const isTop = topSeller && cup.id_cup === topSeller.id_cup

      let status = { label: 'Aman', color: 'emerald', icon: CheckCircle }
      if (isEmpty) status = { label: 'Habis', color: 'red', icon: XCircle }
      else if (isLow) status = { label: 'Menipis', color: 'amber', icon: AlertTriangle }

      return { ...cup, color, sisaPct, terjualPct, shareOfTotal, isLow, isEmpty, isTop, status, idx: i }
    })
  }, [sortedCups, totalTerjual, topSeller])

  // ==================== STYLES ====================
  const styles = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes barFill {
      from { width: 0%; }
      to { width: var(--fill); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.6; }
    }
    @keyframes countUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 600px; }
    }
    @keyframes ring-pulse {
      0% { box-shadow: 0 0 0 0 var(--ring-color); }
      70% { box-shadow: 0 0 0 6px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }

    .anim-up { animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    .anim-scale { animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    .anim-count { animation: countUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    .anim-slide-down { animation: slideDown 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }

    .bar-fill {
      animation: barFill 1s cubic-bezier(0.16,1,0.3,1) forwards;
    }
    .shimmer-line {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
    .dot-pulse {
      animation: pulse-dot 2s ease-in-out infinite;
    }
    .ring-pulse-anim {
      animation: ring-pulse 2s ease-in-out infinite;
    }

    .d1 { animation-delay: 0.05s; }
    .d2 { animation-delay: 0.1s; }
    .d3 { animation-delay: 0.15s; }
    .d4 { animation-delay: 0.2s; }
    .d5 { animation-delay: 0.25s; }
    .d6 { animation-delay: 0.3s; }
    .d7 { animation-delay: 0.35s; }
    .d8 { animation-delay: 0.4s; }

    .card-lift {
      transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .card-lift:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px -8px rgba(0,0,0,0.1);
    }
    .card-lift:active {
      transform: translateY(-1px) scale(0.99);
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .gradient-text {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `

  // ==================== RENDER ====================
  return (
    <div className="space-y-5 pb-4">
      <style>{styles}</style>

      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}
      <div className={`flex items-center justify-between ${mounted ? 'anim-up' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Monitoring Cup</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Pantau stok & penjualan real-time</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Layers size={14} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === 'compact' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <BarChart3 size={14} />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
          >
            <RefreshCw size={15} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HEALTH STATUS BAR                                            */}
      {/* ============================================================ */}
      {cups.length > 0 && (
        <div className={`${mounted ? 'anim-up d1' : 'opacity-0'}`}>
          <div className={`relative overflow-hidden rounded-2xl border ${
            healthStatus.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-400' :
            healthStatus.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400' :
            'bg-gradient-to-r from-red-500 to-rose-500 border-red-400'
          }`}>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            <div className="relative px-4 sm:px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{healthStatus.emoji} Status: {healthStatus.label}</span>
                    <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                      {overallSisaPct}% tersisa
                    </span>
                  </div>
                  <p className="text-white/70 text-[10px] sm:text-xs mt-0.5">{healthStatus.desc}</p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{totalStok}</p>
                  <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wider">Sisa</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{totalTerjual}</p>
                  <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wider">Terjual</p>
                </div>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="px-4 sm:px-5 pb-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full bar-fill relative overflow-hidden"
                  style={{ '--fill': `${overallTerjualPct}%` }}
                >
                  <div className="absolute inset-0 shimmer-line" />
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-white/50 font-medium">0%</span>
                <span className="text-[9px] text-white/50 font-medium">{overallTerjualPct}% terjual</span>
                <span className="text-[9px] text-white/50 font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUMMARY STATS ROW                                            */}
      {/* ============================================================ */}
      {cups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Stok', value: totalStok.toLocaleString(), sub: `dari ${totalAwal} awal`,
              icon: Box, gradient: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
              delay: 'd2'
            },
            {
              label: 'Terjual', value: totalTerjual.toLocaleString(), sub: `${overallTerjualPct}% dari total`,
              icon: TrendingUp, gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
              delay: 'd3'
            },
            {
              label: 'Jenis Cup', value: cups.length, sub: `${lowStockCups.length} menipis`,
              icon: Layers, gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
              delay: 'd4'
            },
            {
              label: 'Rata-rata', value: avgSold, sub: 'terjual per jenis',
              icon: Target, gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
              delay: 'd5'
            },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 shadow-sm card-lift ${mounted ? `anim-up ${stat.delay}` : 'opacity-0'}`}>
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <stat.icon size={16} className={stat.iconColor} />
                </div>
                {i === 1 && (
                  <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <ArrowUpRight size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-bold text-emerald-600">{overallTerjualPct}%</span>
                  </div>
                )}
                {i === 2 && lowStockCups.length > 0 && (
                  <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-md">
                    <AlertTriangle size={10} className="text-red-500" />
                    <span className="text-[8px] font-bold text-red-600">{lowStockCups.length}</span>
                  </div>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none anim-count">{stat.value}</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-[9px] text-gray-300 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* ALERTS SECTION                                               */}
      {/* ============================================================ */}
      {(lowStockCups.length > 0 || emptyStockCups.length > 0) && (
        <div className={`${mounted ? 'anim-up d5' : 'opacity-0'}`}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center relative">
                <AlertTriangle size={16} className="text-red-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold">{lowStockCups.length + emptyStockCups.length}</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800">Peringatan Stok</p>
                <p className="text-[10px] text-gray-400">
                  {emptyStockCups.length > 0 && `${emptyStockCups.length} habis`}
                  {emptyStockCups.length > 0 && lowStockCups.length > 0 && ' · '}
                  {lowStockCups.length > 0 && `${lowStockCups.length} menipis`}
                </p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${showAlerts ? 'rotate-180' : ''}`} />
          </button>

          {showAlerts && (
            <div className="mt-2 space-y-2 anim-slide-down">
              {emptyStockCups.map(cup => (
                <div key={`empty-${cup.id_cup}`} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XCircle size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-700">{cup.nama_cup} — HABIS!</p>
                    <p className="text-[10px] text-red-500 mt-0.5">Stok 0 dari {cup.stok_awal}. Segera restok.</p>
                  </div>
                  <span className="text-lg font-black text-red-400">0</span>
                </div>
              ))}
              {lowStockCups.filter(c => c.stok_sekarang > 0).map(cup => {
                const pct = cup.stok_awal > 0 ? Math.round((cup.stok_sekarang / cup.stok_awal) * 100) : 0
                return (
                  <div key={`low-${cup.id_cup}`} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-700">{cup.nama_cup} — Menipis</p>
                      <p className="text-[10px] text-amber-500 mt-0.5">Tersisa {cup.stok_sekarang} dari {cup.stok_awal} ({pct}%)</p>
                    </div>
                    <span className="text-lg font-black text-amber-500">{cup.stok_sekarang}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* DISTRIBUTION CHART                                           */}
      {/* ============================================================ */}
      {cups.length > 0 && (
        <div className={`${mounted ? 'anim-up d6' : 'opacity-0'}`}>
          <button
            onClick={() => setShowDistribution(!showDistribution)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <PieChart size={16} className="text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800">Distribusi & Perbandingan</p>
                <p className="text-[10px] text-gray-400">{cups.length} jenis cup · {totalStok} total sisa</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${showDistribution ? 'rotate-180' : ''}`} />
          </button>

          {showDistribution && (
            <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden anim-scale">
              {/* Visual bar chart */}
              <div className="p-4 sm:p-5">
                {/* Stacked bar */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Proporsi Sisa Stok</p>
                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden flex">
                    {enrichedCups.map((cup, i) => {
                      const w = totalStok > 0 ? (cup.stok_sekarang / totalStok) * 100 : 0
                      if (w < 1) return null
                      return (
                        <div
                          key={cup.id_cup}
                          className="h-full relative group bar-fill cursor-pointer"
                          style={{
                            '--fill': `${w}%`,
                            background: `linear-gradient(90deg, ${cup.color.from}, ${cup.color.to})`,
                            animationDelay: `${i * 0.1}s`
                          }}
                          title={`${cup.nama_cup}: ${cup.stok_sekarang} (${Math.round(w)}%)`}
                        >
                          {w > 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white truncate px-1">
                              {Math.round(w)}%
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Legend + detail bars */}
                <div className="space-y-3">
                  {enrichedCups.map((cup, idx) => {
                    const sisaBarW = cup.stok_awal > 0 ? (cup.stok_sekarang / cup.stok_awal) * 100 : 0
                    const terjualBarW = cup.stok_awal > 0 ? (cup.terjual_cup / cup.stok_awal) * 100 : 0

                    return (
                      <div key={cup.id_cup} className="flex items-center gap-3">
                        {/* Color dot + name */}
                        <div className="flex items-center gap-2 min-w-[80px] sm:min-w-[120px] flex-shrink-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1"
                            style={{
                              background: `linear-gradient(135deg, ${cup.color.from}, ${cup.color.to})`,
                              '--tw-ring-color': cup.color.from + '25'
                            }}
                          />
                          <span className="text-xs font-semibold text-gray-700 truncate">{cup.nama_cup}</span>
                        </div>

                        {/* Dual bar */}
                        <div className="flex-1 space-y-1">
                          {/* Sisa */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bar-fill"
                                style={{
                                  '--fill': `${sisaBarW}%`,
                                  background: `linear-gradient(90deg, ${cup.color.from}, ${cup.color.to})`,
                                  animationDelay: `${idx * 0.08}s`
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold w-14 text-right">{cup.stok_sekarang} sisa</span>
                          </div>
                          {/* Terjual */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bar-fill opacity-40"
                                style={{
                                  '--fill': `${terjualBarW}%`,
                                  background: `linear-gradient(90deg, ${cup.color.from}, ${cup.color.to})`,
                                  animationDelay: `${idx * 0.08 + 0.3}s`
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 font-medium w-14 text-right">{cup.terjual_cup} sold</span>
                          </div>
                        </div>

                        {/* Percentage */}
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          cup.sisaPct >= 50 ? 'bg-emerald-50 text-emerald-600' :
                          cup.sisaPct >= 25 ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {cup.sisaPct}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Best seller highlight */}
              {topSeller && (
                <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">Terlaris</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800">{topSeller.nama_cup}</span>
                    <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                      {topSeller.terjual_cup} cup
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SORT BAR                                                     */}
      {/* ============================================================ */}
      {cups.length > 1 && (
        <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar ${mounted ? 'anim-up d6' : 'opacity-0'}`}>
          <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0 uppercase tracking-wider">Urutkan:</span>
          {[
            { k: 'default', l: 'Default' },
            { k: 'stock-asc', l: 'Stok ↑' },
            { k: 'stock-desc', l: 'Stok ↓' },
            { k: 'sold-desc', l: 'Terlaris' },
            { k: 'name', l: 'Nama' },
          ].map(s => (
            <button
              key={s.k}
              onClick={() => setSortBy(s.k)}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold cursor-pointer whitespace-nowrap transition-all ${
                sortBy === s.k
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-400 border border-gray-200 active:bg-gray-100'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* CUP CARDS — CARD VIEW                                        */}
      {/* ============================================================ */}
      {viewMode === 'cards' && (
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {enrichedCups.map((cup) => {
            const isExpanded = expandedCup === cup.id_cup

            return (
              <div
                key={cup.id_cup}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden card-lift ${
                  cup.isEmpty ? 'border-red-200' :
                  cup.isLow ? 'border-amber-200' :
                  'border-gray-100'
                } ${mounted ? `anim-up d${Math.min(cup.idx + 3, 8)}` : 'opacity-0'}`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Cup icon */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${cup.color.from}, ${cup.color.to})` }}
                      >
                        <Package size={20} className="text-white relative z-10" />
                        <div className="absolute inset-0 shimmer-line" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-gray-900">{cup.nama_cup}</h3>
                          {cup.isTop && (
                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                              <Star size={8} /> TOP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <cup.status.icon size={10} className={`text-${cup.status.color}-500`} />
                          <span className={`text-[10px] font-bold text-${cup.status.color}-600`}>{cup.status.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Percentage badge */}
                    <div className={`text-right`}>
                      <span className={`text-2xl font-black leading-none ${
                        cup.isEmpty ? 'text-red-500' :
                        cup.isLow ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {cup.sisaPct}%
                      </span>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5">tersisa</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full bar-fill relative overflow-hidden"
                        style={{
                          '--fill': `${cup.terjualPct}%`,
                          background: cup.isEmpty
                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                            : cup.isLow
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : `linear-gradient(90deg, ${cup.color.from}, ${cup.color.to})`,
                          animationDelay: `${cup.idx * 0.1}s`
                        }}
                      >
                        <div className="absolute inset-0 shimmer-line" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px] text-gray-400 font-medium">Terjual {cup.terjualPct}%</span>
                      <span className="text-[9px] text-gray-400 font-medium">Sisa {cup.sisaPct}%</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl py-2.5 px-2 text-center">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Awal</p>
                      <p className="text-base sm:text-lg font-black text-gray-800 mt-0.5 leading-none">{cup.stok_awal}</p>
                    </div>
                    <div className={`rounded-xl py-2.5 px-2 text-center ${cup.color.bg}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${cup.color.text} opacity-70`}>Terjual</p>
                      <p className={`text-base sm:text-lg font-black mt-0.5 leading-none ${cup.color.text}`}>{cup.terjual_cup}</p>
                    </div>
                    <div className={`rounded-xl py-2.5 px-2 text-center ${
                      cup.isEmpty ? 'bg-red-50' : cup.isLow ? 'bg-amber-50' : 'bg-emerald-50'
                    }`}>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${
                        cup.isEmpty ? 'text-red-400' : cup.isLow ? 'text-amber-400' : 'text-emerald-400'
                      }`}>Sisa</p>
                      <p className={`text-base sm:text-lg font-black mt-0.5 leading-none ${
                        cup.isEmpty ? 'text-red-600' : cup.isLow ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{cup.stok_sekarang}</p>
                    </div>
                  </div>
                </div>

                {/* Expandable detail section */}
                <button
                  onClick={() => setExpandedCup(isExpanded ? null : cup.id_cup)}
                  className="w-full px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1.5 cursor-pointer active:bg-gray-100 transition-colors"
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail'}
                  </span>
                  <ChevronDown size={12} className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 py-4 border-t border-gray-100 space-y-3 anim-slide-down bg-gray-50/50">
                    {/* Detail rows */}
                    {[
                      { icon: Box, label: 'Stok Awal', value: `${cup.stok_awal} cup`, color: 'gray' },
                      { icon: Target, label: 'Total Terjual', value: `${cup.terjual_cup} cup`, color: cup.color.light },
                      { icon: Package, label: 'Sisa Stok', value: `${cup.stok_sekarang} cup`, color: cup.isEmpty ? 'red' : cup.isLow ? 'amber' : 'emerald' },
                      { icon: BarChart3, label: 'Persentase Terjual', value: `${cup.terjualPct}%`, color: 'blue' },
                      { icon: PieChart, label: 'Kontribusi Penjualan', value: `${cup.shareOfTotal}% dari total`, color: 'violet' },
                    ].map((row, ri) => (
                      <div key={ri} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 bg-${row.color}-100 rounded-lg flex items-center justify-center`}>
                            <row.icon size={12} className={`text-${row.color}-500`} />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-800">{row.value}</span>
                      </div>
                    ))}

                    {/* Visual breakdown */}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Komposisi Stok</p>
                      <div className="flex items-center gap-1">
                        <div
                          className="h-8 rounded-lg flex items-center justify-center"
                          style={{
                            width: `${cup.terjualPct}%`,
                            minWidth: cup.terjualPct > 0 ? '30px' : '0',
                            background: `linear-gradient(135deg, ${cup.color.from}, ${cup.color.to})`
                          }}
                        >
                          {cup.terjualPct >= 15 && (
                            <span className="text-[8px] font-bold text-white">{cup.terjualPct}% sold</span>
                          )}
                        </div>
                        <div
                          className={`h-8 rounded-lg flex items-center justify-center ${
                            cup.isEmpty ? 'bg-red-200' : cup.isLow ? 'bg-amber-200' : 'bg-gray-200'
                          }`}
                          style={{
                            width: `${cup.sisaPct}%`,
                            minWidth: cup.sisaPct > 0 ? '30px' : '0'
                          }}
                        >
                          {cup.sisaPct >= 15 && (
                            <span className={`text-[8px] font-bold ${
                              cup.isEmpty ? 'text-red-700' : cup.isLow ? 'text-amber-700' : 'text-gray-600'
                            }`}>{cup.sisaPct}% sisa</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* CUP CARDS — COMPACT VIEW                                     */}
      {/* ============================================================ */}
      {viewMode === 'compact' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {enrichedCups.map((cup, idx) => (
            <div
              key={cup.id_cup}
              className={`px-4 py-3.5 flex items-center gap-3 ${idx > 0 ? 'border-t border-gray-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
              onClick={() => setExpandedCup(expandedCup === cup.id_cup ? null : cup.id_cup)}
            >
              {/* Color bar */}
              <div className="w-1 h-10 rounded-full" style={{ background: `linear-gradient(to bottom, ${cup.color.from}, ${cup.color.to})` }} />

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${cup.color.from}20, ${cup.color.to}20)` }}
              >
                <Package size={14} style={{ color: cup.color.from }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-800 truncate">{cup.nama_cup}</span>
                  {cup.isTop && <Star size={10} className="text-amber-500 flex-shrink-0" />}
                </div>
                {/* Inline bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                    <div
                      className="h-full rounded-full bar-fill"
                      style={{
                        '--fill': `${cup.terjualPct}%`,
                        background: `linear-gradient(90deg, ${cup.color.from}, ${cup.color.to})`,
                        animationDelay: `${idx * 0.05}s`
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">{cup.terjualPct}%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs font-black text-gray-800">{cup.terjual_cup}</p>
                  <p className="text-[8px] text-gray-400 font-medium">sold</p>
                </div>
                <div className="text-center">
                  <p className={`text-xs font-black ${cup.isEmpty ? 'text-red-500' : cup.isLow ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {cup.stok_sekarang}
                  </p>
                  <p className="text-[8px] text-gray-400 font-medium">sisa</p>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  cup.isEmpty ? 'bg-red-100 text-red-600' :
                  cup.isLow ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {cup.sisaPct}%
                </div>
              </div>
            </div>
          ))}

          {/* Compact total */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-medium">Terjual:</span>
                <span className="text-xs font-black text-gray-800">{totalTerjual}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-medium">Sisa:</span>
                <span className="text-xs font-black text-emerald-600">{totalStok}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EMPTY STATE                                                  */}
      {/* ============================================================ */}
      {cups.length === 0 && (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center ${mounted ? 'anim-up' : 'opacity-0'}`}>
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Package size={36} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-600 mb-1.5">Belum Ada Data Cup</h3>
          <p className="text-sm text-gray-400 max-w-[250px] mx-auto leading-relaxed mb-6">
            Tambahkan data cup di tab <strong>Cup</strong> untuk mulai monitoring stok.
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl cursor-pointer active:scale-95 transition-transform shadow-lg"
          >
            <RefreshCw size={14} />
            Refresh Data
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* BOTTOM SUMMARY                                               */}
      {/* ============================================================ */}
      {cups.length > 0 && (
        <div className={`${mounted ? 'anim-up d8' : 'opacity-0'}`}>
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 relative overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ringkasan Monitoring</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Stok Awal', value: totalAwal, color: 'text-gray-300' },
                  { label: 'Terjual', value: totalTerjual, color: 'text-blue-400' },
                  { label: 'Sisa', value: totalStok, color: 'text-emerald-400' },
                  { label: 'Efisiensi', value: `${overallTerjualPct}%`, color: 'text-amber-400' },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{item.label}</p>
                    <p className={`text-xl sm:text-2xl font-black ${item.color} mt-0.5 leading-none`}>
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    healthStatus.color === 'emerald' ? 'bg-emerald-400' :
                    healthStatus.color === 'amber' ? 'bg-amber-400' :
                    'bg-red-400'
                  } dot-pulse`} />
                  <span className="text-[10px] text-gray-500 font-medium">
                    Status: <strong className={`text-${healthStatus.color}-400`}>{healthStatus.label}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-gray-600 font-medium">
                  {cups.length} jenis cup
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}