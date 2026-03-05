import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  BarChart3, ShieldCheck, Package, Coffee, TrendingUp,
  CheckCircle, AlertTriangle, Target, DollarSign, Save,
  ShoppingCart
} from 'lucide-react'
import { rp } from '../utils/helpers'

// Import Tab Components
import MonitoringTab from '../components/ceo/MonitoringTab'
import AuditTab from '../components/ceo/AuditTab'
import CupTab from '../components/ceo/CupTab'
import MenuTab from '../components/ceo/MenuTab'
import RingkasanTab from '../components/ceo/RingkasanTab'
import SimpanDataTab from '../components/ceo/SimpanDataTab'
import PembelianTab from '../components/ceo/PembelianTab'

export default function CeoDashboard() {
  const [cups, setCups] = useState([])
  const [menu, setMenu] = useState([])
  const [ringkasan, setRingkasan] = useState([])
  const [tab, setTab] = useState('monitoring')
  const [toast, setToast] = useState({ t: '', ok: true })

  useEffect(() => {
    fetchCups()
    fetchMenu()
    fetchRingkasan()
  }, [])

  // ==================== FETCH ====================
  const fetchCups = async () => {
    const { data } = await supabase.from('inventory_cup').select('*').order('id_cup')
    setCups(data || [])
  }

  const fetchMenu = async () => {
    const { data } = await supabase
      .from('menu_jualan')
      .select('*, inventory_cup(nama_cup)')
      .order('id_cup, harga_jual')
    setMenu(data || [])
  }

  const fetchRingkasan = async () => {
    const { data } = await supabase.from('v_ringkasan_harian').select('*').limit(50)
    setRingkasan(data || [])
  }

  // ==================== HELPERS ====================
  const msg = (t, ok = true) => {
    setToast({ t, ok })
    setTimeout(() => setToast({ t: '', ok: true }), 3000)
  }

  // ==================== COMPUTED ====================
  const totalTerjual = cups.reduce((a, c) => a + c.terjual_cup, 0)
  const totalPendapatan = ringkasan.reduce((a, r) => a + (r.total_pendapatan || 0), 0)

  // ==================== TABS ====================
  const tabs = [
    { k: 'monitoring', l: 'Monitoring', i: BarChart3 },
    { k: 'audit', l: 'Audit', i: ShieldCheck },
    { k: 'cup', l: 'Cup', i: Package },
    { k: 'menu', l: 'Menu', i: Coffee },
    { k: 'ringkasan', l: 'Laporan', i: TrendingUp },
    { k: 'simpan', l: 'Input Data', i: Save },
    { k: 'pembelian', l: 'Pembelian', i: ShoppingCart },
  ]

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* ===== TOAST ===== */}
      {toast.t && (
        <div className="fixed top-16 inset-x-0 z-50 flex justify-center animate-slideDown pointer-events-none">
          <div className={`text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 ${
            toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {toast.t}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-8">

        {/* ===== STATS CARDS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { l: 'Sisa Cup', v: cups.reduce((a, c) => a + c.stok_sekarang, 0), from: '#f59e0b', to: '#ea580c', i: Package },
            { l: 'Terjual', v: totalTerjual, from: '#10b981', to: '#14b8a6', i: Target },
            { l: 'Menu', v: menu.length, from: '#3b82f6', to: '#6366f1', i: Coffee },
            { l: 'Pendapatan', v: rp(totalPendapatan), from: '#8b5cf6', to: '#ec4899', i: DollarSign },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 sm:p-5 text-white"
              style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-[11px] sm:text-xs font-medium">{s.l}</p>
                  <p className="text-xl sm:text-2xl font-extrabold mt-0.5">{s.v}</p>
                </div>
                <s.i size={22} className="text-white/25" />
              </div>
            </div>
          ))}
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
          {tabs.map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap cursor-pointer press transition-all ${
                tab === t.k
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
              }`}
            >
              <t.i size={15} />
              {t.l}
            </button>
          ))}
        </div>

        {/* ===== TAB CONTENT ===== */}
        {tab === 'monitoring' && <MonitoringTab cups={cups} fetchCups={fetchCups} />}
        {tab === 'audit' && <AuditTab cups={cups} msg={msg} />}
        {tab === 'cup' && <CupTab cups={cups} menu={menu} fetchCups={fetchCups} msg={msg} />}
        {tab === 'menu' && <MenuTab cups={cups} menu={menu} fetchMenu={fetchMenu} msg={msg} />}
        {tab === 'ringkasan' && <RingkasanTab ringkasan={ringkasan} fetchRingkasan={fetchRingkasan} />}
        {tab === 'simpan' && <SimpanDataTab msg={msg} />}
        {tab === 'pembelian' && <PembelianTab msg={msg} />}

      </div>
    </div>
  )
}