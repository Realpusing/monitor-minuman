import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  BarChart3, ShieldCheck, Package, Coffee, TrendingUp,
  CheckCircle, AlertTriangle, Target, DollarSign, Save,
  ShoppingCart, ChevronRight, Zap, Crown, ArrowUpRight,
  Clock, Sparkles, RefreshCw, Wallet, PieChart,
  Menu as MenuIcon, X, ChevronLeft, ChevronDown,
  Activity, Layers, Box, Star, Flame
} from 'lucide-react'
import { rp } from '../utils/helpers'

import MonitoringTab from '../components/ceo/MonitoringTab'
import AuditTab from '../components/ceo/AuditTab'
import CupTab from '../components/ceo/CupTab'
import MenuTab from '../components/ceo/MenuTab'
import RingkasanTab from '../components/ceo/RingkasanTab'
import SimpanDataTab from '../components/ceo/SimpanDataTab'
import PembelianTab from '../components/ceo/PembelianTab'

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function CeoDashboard() {
  // ==================== STATE ====================
  const [cups, setCups] = useState([])
  const [menu, setMenu] = useState([])
  const [ringkasan, setRingkasan] = useState([])
  const [tab, setTab] = useState('monitoring')
  const [toast, setToast] = useState({ t: '', ok: true })
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    fetchCups()
    fetchMenu()
    fetchRingkasan()
    const timer = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(timer)
  }, [])

  // Close mobile sidebar on tab change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [tab])

  // Lock scroll when mobile sidebar open
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // ==================== DATA FETCHING ====================
  const fetchCups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_cup')
        .select('*')
        .order('id_cup')
      if (error) throw error
      setCups(data || [])
    } catch (err) {
      console.error('Fetch cups error:', err)
    }
  }, [])

  const fetchMenu = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_jualan')
        .select('*, inventory_cup(nama_cup)')
        .order('id_cup, harga_jual')
      if (error) throw error
      setMenu(data || [])
    } catch (err) {
      console.error('Fetch menu error:', err)
    }
  }, [])

  const fetchRingkasan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_ringkasan_harian')
        .select('*')
        .limit(50)
      if (error) throw error
      setRingkasan(data || [])
    } catch (err) {
      console.error('Fetch ringkasan error:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchCups(), fetchMenu(), fetchRingkasan()])
    } catch (err) {
      console.error('Refresh error:', err)
    }
    setTimeout(() => setRefreshing(false), 600)
  }, [fetchCups, fetchMenu, fetchRingkasan])

  // ==================== TOAST ====================
  const msg = useCallback((t, ok = true) => {
    setToast({ t, ok })
    setTimeout(() => setToast({ t: '', ok: true }), 3000)
  }, [])

  // ==================== COMPUTED ====================
  const totalTerjual = useMemo(
    () => cups.reduce((a, c) => a + (c.terjual_cup || 0), 0),
    [cups]
  )
  const totalPendapatan = useMemo(
    () => ringkasan.reduce((a, r) => a + (r.total_pendapatan || 0), 0),
    [ringkasan]
  )
  const totalStok = useMemo(
    () => cups.reduce((a, c) => a + (c.stok_sekarang || 0), 0),
    [cups]
  )
  const totalAwal = useMemo(
    () => cups.reduce((a, c) => a + (c.stok_awal || 0), 0),
    [cups]
  )
  const stokPct = totalAwal > 0 ? Math.round((totalStok / totalAwal) * 100) : 0
  const soldPct = totalAwal > 0 ? Math.round((totalTerjual / totalAwal) * 100) : 0

  // Stok health
  const health = useMemo(() => {
    if (stokPct >= 50) return { label: 'Sehat', color: 'emerald', dot: 'bg-emerald-400' }
    if (stokPct >= 20) return { label: 'Waspada', color: 'amber', dot: 'bg-amber-400' }
    return { label: 'Kritis', color: 'red', dot: 'bg-red-400' }
  }, [stokPct])

  // Low stock alerts
  const alerts = useMemo(() => {
    return cups.filter(c => {
      if (c.stok_awal <= 0) return false
      return (c.stok_sekarang / c.stok_awal) * 100 < 25
    })
  }, [cups])

  // Top seller
  const topSeller = useMemo(() => {
    if (cups.length === 0) return null
    return [...cups].sort((a, b) => (b.terjual_cup || 0) - (a.terjual_cup || 0))[0]
  }, [cups])

  // Cup distribution
  const cupColors = [
    { from: '#3b82f6', to: '#1d4ed8' },
    { from: '#8b5cf6', to: '#6d28d9' },
    { from: '#f59e0b', to: '#d97706' },
    { from: '#10b981', to: '#059669' },
    { from: '#ef4444', to: '#dc2626' },
    { from: '#ec4899', to: '#db2777' },
    { from: '#06b6d4', to: '#0891b2' },
    { from: '#f97316', to: '#ea580c' },
  ]

  const cupDist = useMemo(() => {
    return cups.map((c, i) => ({
      ...c,
      color: cupColors[i % cupColors.length],
      pct: totalStok > 0 ? Math.round((c.stok_sekarang / totalStok) * 100) : 0,
      soldPct: c.stok_awal > 0 ? Math.round((c.terjual_cup / c.stok_awal) * 100) : 0,
      isLow: c.stok_awal > 0 && (c.stok_sekarang / c.stok_awal) * 100 < 25,
      isEmpty: c.stok_sekarang <= 0,
      isTop: topSeller && c.id_cup === topSeller.id_cup,
    }))
  }, [cups, totalStok, topSeller])

  // ==================== TIME ====================
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam'
  const timeEmoji = hour < 6 ? '🌙' : hour < 12 ? '🌅' : hour < 15 ? '☀️' : hour < 18 ? '🌇' : '🌆'
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // ==================== TAB CONFIG ====================
  const tabs = useMemo(() => [
    {
      k: 'monitoring', l: 'Monitoring', ls: 'Monitor',
      i: Activity, desc: 'Pantau stok & penjualan',
      grad: 'from-blue-500 to-indigo-600',
      abg: 'bg-blue-50', atx: 'text-blue-700',
      section: 'overview'
    },
    {
      k: 'audit', l: 'Audit Stok', ls: 'Audit',
      i: ShieldCheck, desc: 'Verifikasi & audit inventory',
      grad: 'from-violet-500 to-purple-600',
      abg: 'bg-violet-50', atx: 'text-violet-700',
      section: 'overview'
    },
    {
      k: 'ringkasan', l: 'Laporan', ls: 'Laporan',
      i: TrendingUp, desc: 'Laporan penjualan harian',
      grad: 'from-rose-500 to-pink-600',
      abg: 'bg-rose-50', atx: 'text-rose-700',
      section: 'overview'
    },
    {
      k: 'cup', l: 'Kelola Cup', ls: 'Cup',
      i: Package, desc: 'Atur stok cup & inventory',
      grad: 'from-amber-500 to-orange-600',
      abg: 'bg-amber-50', atx: 'text-amber-700',
      section: 'manage'
    },
    {
      k: 'menu', l: 'Menu Jualan', ls: 'Menu',
      i: Coffee, desc: 'Kelola menu & harga jual',
      grad: 'from-emerald-500 to-green-600',
      abg: 'bg-emerald-50', atx: 'text-emerald-700',
      section: 'manage'
    },
    {
      k: 'simpan', l: 'Input Penjualan', ls: 'Input',
      i: Save, desc: 'Catat penjualan & transaksi',
      grad: 'from-cyan-500 to-teal-600',
      abg: 'bg-cyan-50', atx: 'text-cyan-700',
      section: 'action'
    },
    {
      k: 'pembelian', l: 'Pembelian Cup', ls: 'Beli',
      i: ShoppingCart, desc: 'Catat pembelian stok baru',
      grad: 'from-orange-500 to-red-500',
      abg: 'bg-orange-50', atx: 'text-orange-700',
      section: 'action'
    },
  ], [])

  const activeTab = tabs.find(t => t.k === tab) || tabs[0]

  const sections = useMemo(() => ({
    overview: { label: 'Overview', icon: BarChart3 },
    manage: { label: 'Kelola', icon: Layers },
    action: { label: 'Aksi', icon: Zap },
  }), [])

  const groupedTabs = useMemo(() => {
    const g = {}
    tabs.forEach(t => {
      if (!g[t.section]) g[t.section] = []
      g[t.section].push(t)
    })
    return g
  }, [tabs])

  // Handle tab change
  const changeTab = useCallback((k) => {
    setTab(k)
  }, [])

  // ==================== SIDEBAR CONTENT (reusable) ====================
  const renderSidebarNav = (isMobile = false) => (
    <div className={`flex-1 overflow-y-auto no-scrollbar ${isMobile ? 'py-2 px-2' : 'py-3 px-2'}`}>
      {Object.entries(groupedTabs).map(([sec, items]) => {
        const secInfo = sections[sec]
        return (
          <div key={sec} className="mb-3">
            {/* Section label */}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-1.5">
                <secInfo.icon size={10} className="text-gray-300" />
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                  {secInfo.label}
                </p>
              </div>
            )}
            {sidebarCollapsed && !isMobile && (
              <div className="flex justify-center mb-2">
                <div className="w-5 h-px bg-gray-200" />
              </div>
            )}

            <div className="space-y-0.5">
              {items.map(t => {
                const isActive = tab === t.k
                const showLabel = isMobile || !sidebarCollapsed

                return (
                  <button
                    key={t.k}
                    onClick={() => changeTab(t.k)}
                    title={!showLabel ? t.l : undefined}
                    className={`
                      group relative w-full flex items-center rounded-xl cursor-pointer
                      transition-all duration-200 ease-out
                      ${showLabel ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5'}
                      ${isActive
                        ? `${t.abg} ${t.atx} font-bold shadow-sm`
                        : 'text-gray-500 hover:bg-gray-50 font-medium'
                      }
                      active:scale-[0.97]
                    `}
                  >
                    {/* Left active bar */}
                    {isActive && showLabel && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b ${t.grad}`} />
                    )}

                    {/* Icon */}
                    <div className={`
                      flex items-center justify-center flex-shrink-0 rounded-xl
                      transition-all duration-200
                      ${showLabel ? 'w-8 h-8' : 'w-10 h-10'}
                      ${isActive
                        ? `bg-gradient-to-br ${t.grad} shadow-md`
                        : 'bg-gray-100 group-hover:bg-gray-200'
                      }
                    `}>
                      <t.i
                        size={showLabel ? 15 : 18}
                        className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                      />
                    </div>

                    {/* Label */}
                    {showLabel && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[13px] truncate leading-tight">{t.l}</p>
                        <p className={`text-[9px] truncate leading-tight mt-0.5 ${
                          isActive ? 'opacity-50' : 'text-gray-400'
                        }`}>
                          {t.desc}
                        </p>
                      </div>
                    )}

                    {/* Active chevron */}
                    {isActive && showLabel && (
                      <ChevronRight size={12} className="text-current opacity-40 flex-shrink-0" />
                    )}

                    {/* Collapsed tooltip */}
                    {!showLabel && !isMobile && (
                      <div className="
                        absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white
                        text-[11px] font-bold rounded-xl whitespace-nowrap z-50
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        transition-all duration-200 shadow-xl
                        translate-x-1 group-hover:translate-x-0
                      ">
                        <p>{t.l}</p>
                        <p className="text-[9px] text-gray-400 font-normal mt-0.5">{t.desc}</p>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-[10px] h-[10px] bg-gray-900 rotate-45 rounded-sm" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Navbar />

      {/* ======================================================== */}
      {/* STYLES                                                    */}
      {/* ======================================================== */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes barFill {
          from { width: 0; }
          to { width: var(--w); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        @keyframes slideLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .a-up { animation: fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .a-scale { animation: scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .a-toast { animation: toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .a-slide { animation: slideLeft 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        .a-fade { animation: fadeIn 0.2s ease-out both; }
        .a-count { animation: countUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }

        .d0 { animation-delay: 0s; }
        .d1 { animation-delay: 50ms; }
        .d2 { animation-delay: 100ms; }
        .d3 { animation-delay: 150ms; }
        .d4 { animation-delay: 200ms; }
        .d5 { animation-delay: 250ms; }
        .d6 { animation-delay: 300ms; }
        .d7 { animation-delay: 350ms; }

        .shimmer-line {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          background-size: 200% 100%;
          animation: shimmer 2.5s infinite;
        }
        .grad-shift {
          background-size: 200% 200%;
          animation: gradientShift 4s ease infinite;
        }
        .bar-fill { animation: barFill 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .dot-pulse { animation: dotPulse 2s ease-in-out infinite; }
        .float-anim { animation: float 5s ease-in-out infinite; }

        .card {
          background: white;
          border: 1px solid #e8eaed;
          border-radius: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .card-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        .card-lift:active {
          transform: translateY(0) scale(0.99);
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .sidebar-t { transition: width 0.3s cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      {/* ======================================================== */}
      {/* TOAST                                                     */}
      {/* ======================================================== */}
      {toast.t && (
        <div className="fixed top-4 inset-x-0 z-[99] flex justify-center px-4 pointer-events-none">
          <div className={`
            a-toast pointer-events-auto flex items-center gap-3
            px-5 py-3 rounded-2xl text-sm font-bold shadow-xl
            ${toast.ok
              ? 'bg-white text-emerald-700 border border-emerald-100 shadow-emerald-100/50'
              : 'bg-white text-red-700 border border-red-100 shadow-red-100/50'
            }
          `}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
              ${toast.ok ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {toast.ok
                ? <CheckCircle size={14} className="text-emerald-600" />
                : <AlertTriangle size={14} className="text-red-600" />
              }
            </div>
            {toast.t}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MOBILE SIDEBAR DRAWER                                     */}
      {/* ======================================================== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] a-fade" onClick={() => setSidebarOpen(false)} />

          <div className="absolute left-0 top-0 bottom-0 w-[275px] bg-white shadow-2xl a-slide flex flex-col">
            {/* Header */}
            <div className="px-4 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg grad-shift">
                    <Crown size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">CEO Panel</p>
                    <p className="text-[9px] text-gray-400 font-medium">{dateStr}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                >
                  <X size={15} className="text-gray-500" />
                </button>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Stok', v: totalStok, c: 'amber' },
                  { l: 'Sold', v: totalTerjual, c: 'emerald' },
                  { l: 'Menu', v: menu.length, c: 'blue' },
                ].map((s, i) => (
                  <div key={i} className={`bg-${s.c}-50 rounded-xl px-2 py-2 text-center`}>
                    <p className={`text-[8px] text-${s.c}-500 font-bold uppercase tracking-wider`}>{s.l}</p>
                    <p className={`text-sm font-black text-${s.c}-700 mt-0.5`}>{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            {renderSidebarNav(true)}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Revenue</span>
                  <span className="text-[10px] font-black text-gray-800">{rp(totalPendapatan)}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full bar-fill"
                    style={{ '--w': `${soldPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LAYOUT WRAPPER                                            */}
      {/* ======================================================== */}
      <div className="flex min-h-[calc(100vh-64px)]">

        {/* ====================================================== */}
        {/* DESKTOP SIDEBAR                                         */}
        {/* ====================================================== */}
        <aside className={`
          hidden lg:flex flex-col flex-shrink-0 sidebar-t
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[250px]'}
          h-[calc(100vh-64px)] sticky top-[64px]
          bg-white border-r border-gray-100 z-30
        `}>
          {/* Top */}
          <div className={`flex-shrink-0 border-b border-gray-50 ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md grad-shift">
                    <Crown size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-900 leading-tight">CEO Panel</p>
                    <p className="text-[9px] text-gray-400">{timeStr}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-6 h-6 bg-gray-50 hover:bg-gray-100 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                  title="Perkecil sidebar"
                >
                  <ChevronLeft size={12} className="text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md grad-shift">
                  <Crown size={15} className="text-white" />
                </div>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-6 h-6 bg-gray-50 hover:bg-gray-100 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                  title="Perbesar sidebar"
                >
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Nav */}
          {renderSidebarNav(false)}

          {/* Bottom */}
          {!sidebarCollapsed ? (
            <div className="flex-shrink-0 p-3 border-t border-gray-50">
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Revenue</span>
                  <span className="text-[10px] font-black text-gray-700">{rp(totalPendapatan)}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full shimmer-line"
                    style={{ width: `${Math.min(soldPct, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] text-gray-400">
                  <span>{totalTerjual} sold</span>
                  <span>{totalStok} sisa</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 p-2 border-t border-gray-50 flex flex-col items-center gap-1.5 py-3">
              {[
                { icon: Target, bg: 'bg-emerald-50', color: 'text-emerald-500', title: `Sold: ${totalTerjual}` },
                { icon: Package, bg: 'bg-amber-50', color: 'text-amber-500', title: `Sisa: ${totalStok}` },
              ].map((b, i) => (
                <div key={i} className={`w-9 h-9 ${b.bg} rounded-lg flex items-center justify-center`} title={b.title}>
                  <b.icon size={14} className={b.color} />
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ====================================================== */}
        {/* MAIN CONTENT                                            */}
        {/* ====================================================== */}
        <main className="flex-1 min-w-0 flex flex-col">

          {/* ============ TOP BAR ============ */}
          <div className="bg-white border-b border-gray-100 sticky top-[64px] z-20 flex-shrink-0">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Hamburger (mobile) */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                >
                  <MenuIcon size={16} className="text-gray-600" />
                </button>

                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeTab.grad} flex items-center justify-center shadow-sm`}>
                    <activeTab.i size={13} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                      {activeTab.l}
                    </h1>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 leading-tight hidden sm:block">
                      {activeTab.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Health indicator */}
                {cups.length > 0 && (
                  <div className={`hidden sm:flex items-center gap-1.5 bg-${health.color}-50 px-2.5 py-1.5 rounded-lg`}>
                    <div className={`w-1.5 h-1.5 ${health.dot} rounded-full dot-pulse`} />
                    <span className={`text-[9px] font-bold text-${health.color}-600 uppercase`}>{health.label}</span>
                  </div>
                )}

                {/* Alert badge */}
                {alerts.length > 0 && (
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center relative">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {alerts.length}
                    </span>
                  </div>
                )}

                {/* Refresh */}
                <button
                  onClick={refreshAll}
                  disabled={refreshing}
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                  title="Refresh semua data"
                >
                  <RefreshCw size={14} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                {/* Time */}
                <div className="hidden md:flex items-center gap-1.5 text-gray-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-semibold">{timeStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============ OVERVIEW STATS ============ */}
          <div className="bg-white border-b border-gray-100 flex-shrink-0">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

              {/* Toggle */}
              <button
                onClick={() => setStatsExpanded(!statsExpanded)}
                className="w-full py-2.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {timeEmoji} {greeting} — Quick Stats
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-300 transition-transform duration-300 group-hover:text-gray-500 ${statsExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Stats Content */}
              {statsExpanded && (
                <div className="pb-4 a-scale">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3">
                    {[
                      {
                        l: 'Sisa Cup', v: totalStok.toLocaleString(), ic: Package,
                        gr: 'from-amber-400 to-orange-500', sh: 'shadow-amber-200/40',
                        bg: 'bg-amber-50', tx: 'text-amber-600',
                        badge: `${stokPct}%`, sub: `${cups.length} jenis`
                      },
                      {
                        l: 'Terjual', v: totalTerjual.toLocaleString(), ic: Target,
                        gr: 'from-emerald-400 to-green-500', sh: 'shadow-emerald-200/40',
                        bg: 'bg-emerald-50', tx: 'text-emerald-600',
                        badge: `${soldPct}%`, bIcon: ArrowUpRight, sub: 'cup sold'
                      },
                      {
                        l: 'Menu', v: menu.length, ic: Coffee,
                        gr: 'from-blue-400 to-indigo-500', sh: 'shadow-blue-200/40',
                        bg: 'bg-blue-50', tx: 'text-blue-600',
                        badge: 'AKTIF', bIcon: Sparkles, sub: 'varian'
                      },
                      {
                        l: 'Revenue', v: rp(totalPendapatan), ic: Wallet,
                        gr: 'from-violet-400 to-purple-500', sh: 'shadow-violet-200/40',
                        bg: 'bg-violet-50', tx: 'text-violet-600',
                        badge: 'IDR', bIcon: DollarSign, sub: 'total', small: true
                      },
                    ].map((c, i) => (
                      <div key={i} className="card card-lift p-3.5 sm:p-4 relative overflow-hidden group">
                        {/* Deco */}
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-gray-100/60 to-transparent rounded-full blur-sm group-hover:scale-150 transition-transform duration-500" />

                        <div className="relative">
                          <div className="flex items-start justify-between mb-2.5">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br ${c.gr} rounded-xl flex items-center justify-center shadow-md ${c.sh}`}>
                              <c.ic size={16} className="text-white" />
                            </div>
                            <div className={`flex items-center gap-1 ${c.bg} px-1.5 py-0.5 rounded-md`}>
                              {c.bIcon && <c.bIcon size={8} className={c.tx} />}
                              <span className={`text-[8px] font-bold ${c.tx}`}>{c.badge}</span>
                            </div>
                          </div>

                          <p className={`${c.small ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-black text-gray-900 leading-none a-count break-all`}>
                            {c.v}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">{c.l}</p>
                          <p className="text-[8px] text-gray-300 mt-0.5">{c.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cup Distribution */}
                  {cups.length > 0 && (
                    <div className="card p-3.5 sm:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PieChart size={13} className="text-indigo-500" />
                          <span className="text-[11px] font-bold text-gray-700">Distribusi Stok</span>
                        </div>
                        {topSeller && (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                            <Flame size={9} className="text-amber-500" />
                            <span className="text-[8px] font-bold text-amber-600 truncate max-w-[60px] sm:max-w-none">
                              {topSeller.nama_cup}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stacked bar */}
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                        {cupDist.map((c, i) => {
                          const w = totalStok > 0 ? (c.stok_sekarang / totalStok) * 100 : 0
                          if (w < 0.5) return null
                          return (
                            <div
                              key={c.id_cup}
                              className="h-full relative group/bar cursor-pointer"
                              style={{
                                width: `${w}%`,
                                background: `linear-gradient(90deg, ${c.color.from}, ${c.color.to})`
                              }}
                              title={`${c.nama_cup}: ${c.stok_sekarang} (${Math.round(w)}%)`}
                            />
                          )
                        })}
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cupDist.map((c) => (
                          <div key={c.id_cup} className="flex items-center gap-2 py-1">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${c.color.from}, ${c.color.to})` }}
                            />
                            <span className="text-[10px] font-medium text-gray-600 truncate flex-1">{c.nama_cup}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {c.isTop && <Star size={8} className="text-amber-400" />}
                              <span className="text-[10px] font-bold text-gray-800">{c.stok_sekarang}</span>
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                                c.isEmpty ? 'bg-red-100 text-red-600' :
                                c.isLow ? 'bg-amber-100 text-amber-600' :
                                'bg-gray-100 text-gray-500'
                              }`}>{c.pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                          Total {cups.length} jenis
                        </span>
                        <span className="text-[11px] font-black text-gray-900">{totalStok.toLocaleString()} cup</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============ TAB CONTENT ============ */}
          <div className="flex-1">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
              <div className={mounted ? 'a-up d3' : 'opacity-0'}>
                {tab === 'monitoring' && (
                  <MonitoringTab cups={cups} fetchCups={fetchCups} />
                )}
                {tab === 'audit' && (
                  <AuditTab cups={cups} msg={msg} />
                )}
                {tab === 'cup' && (
                  <CupTab cups={cups} menu={menu} fetchCups={fetchCups} msg={msg} />
                )}
                {tab === 'menu' && (
                  <MenuTab cups={cups} menu={menu} fetchMenu={fetchMenu} msg={msg} />
                )}
                {tab === 'ringkasan' && (
                  <RingkasanTab ringkasan={ringkasan} fetchRingkasan={fetchRingkasan} />
                )}
                {tab === 'simpan' && (
                  <SimpanDataTab msg={msg} />
                )}
                {tab === 'pembelian' && (
                  <PembelianTab msg={msg} />
                )}
              </div>
            </div>
          </div>

          {/* ============ FOOTER ============ */}
          <footer className="border-t border-gray-100 bg-white flex-shrink-0">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded flex items-center justify-center">
                    <Zap size={10} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">CEO Dashboard</span>
                  <span className="text-[9px] text-gray-300">v2.1</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-gray-300 font-medium">
                  <span>{cups.length} Cups</span>
                  <span className="text-gray-200">·</span>
                  <span>{menu.length} Menu</span>
                  <span className="text-gray-200">·</span>
                  <span>{dateStr}</span>
                </div>
              </div>
            </div>
          </footer>

        </main>
      </div>
    </div>
  )
}