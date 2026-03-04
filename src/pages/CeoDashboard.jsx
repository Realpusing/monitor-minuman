import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  BarChart3, ShieldCheck, Package, Coffee, TrendingUp,
  Search, RefreshCw, Pencil, Trash2, Plus, X, CheckCircle,
  AlertTriangle, Target, DollarSign, ChevronDown, ChevronUp, FileText
} from 'lucide-react'

export default function CeoDashboard() {
  const [cups, setCups] = useState([])
  const [menu, setMenu] = useState([])
  const [ringkasan, setRingkasan] = useState([])
  const [auditResult, setAuditResult] = useState(null)
  const [auditForm, setAuditForm] = useState({ id_cup: '', cup_fisik: '' })
  const [cupForm, setCupForm] = useState({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
  const [editingCup, setEditingCup] = useState(null)
  const [showCupForm, setShowCupForm] = useState(false)
  const [restockMode, setRestockMode] = useState(null)
  const [restockAmount, setRestockAmount] = useState('')
  const [menuForm, setMenuForm] = useState({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
  const [editingMenu, setEditingMenu] = useState(null)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [menuFilter, setMenuFilter] = useState('all')
  const [tab, setTab] = useState('monitoring')
  const [loading, setLoading] = useState(false)
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

  const rp = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(n)

  const inputClass =
    'w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none text-sm'

  const btnPrimary =
    'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 py-3 rounded-xl shadow-md shadow-amber-200/40 cursor-pointer press flex items-center gap-2 text-sm'

  // ==================== AUDIT ====================
  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuditResult(null)

    const { data, error } = await supabase.rpc('fn_audit_cup', {
      p_id_cup: parseInt(auditForm.id_cup),
      p_cup_fisik: parseInt(auditForm.cup_fisik)
    })

    if (error) msg(error.message, false)
    else setAuditResult(data?.[0])
    setLoading(false)
  }

  // ==================== CUP HANDLERS ====================
  const handleAddCup = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('inventory_cup').insert({
      nama_cup: cupForm.nama_cup,
      stok_awal: parseInt(cupForm.stok_awal),
      stok_sekarang: parseInt(cupForm.stok_sekarang || cupForm.stok_awal),
      terjual_cup: 0
    })

    if (error) {
      msg(error.message, false)
    } else {
      msg('Cup berhasil ditambah!')
      setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
      setShowCupForm(false)
      fetchCups()
    }
    setLoading(false)
  }

  const handleUpdateCup = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('inventory_cup').update({
      nama_cup: cupForm.nama_cup,
      stok_awal: parseInt(cupForm.stok_awal),
      stok_sekarang: parseInt(cupForm.stok_sekarang)
    }).eq('id_cup', editingCup.id_cup)

    if (error) {
      msg(error.message, false)
    } else {
      msg('Cup diupdate!')
      setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
      setEditingCup(null)
      setShowCupForm(false)
      fetchCups()
    }
    setLoading(false)
  }

  const handleDeleteCup = async (cup) => {
    const used = menu.filter(m => m.id_cup === cup.id_cup)
    if (used.length > 0) {
      msg(`Ada ${used.length} menu pakai cup ini!`, false)
      return
    }
    if (!confirm(`Hapus "${cup.nama_cup}"?`)) return

    const { error } = await supabase.from('inventory_cup').delete().eq('id_cup', cup.id_cup)
    if (error) msg(error.message, false)
    else { msg('Cup dihapus!'); fetchCups() }
  }

  const handleQuickRestock = async (cup) => {
    if (!restockAmount || parseInt(restockAmount) <= 0) {
      msg('Jumlah tidak valid!', false)
      return
    }
    setLoading(true)
    const tambah = parseInt(restockAmount)

    const { error } = await supabase.from('inventory_cup').update({
      stok_awal: cup.stok_awal + tambah,
      stok_sekarang: cup.stok_sekarang + tambah,
      terjual_cup: 0
    }).eq('id_cup', cup.id_cup)

    if (error) {
      msg(error.message, false)
    } else {
      msg(`+${tambah} ${cup.nama_cup}!`)
      setRestockMode(null)
      setRestockAmount('')
      fetchCups()
    }
    setLoading(false)
  }

  const handleResetTerjual = async (cup) => {
    if (!confirm(`Reset counter "${cup.nama_cup}"? Stok awal = sisa sekarang, terjual = 0`)) return

    const { error } = await supabase.from('inventory_cup').update({
      stok_awal: cup.stok_sekarang,
      terjual_cup: 0
    }).eq('id_cup', cup.id_cup)

    if (error) msg(error.message, false)
    else { msg('Counter direset!'); fetchCups() }
  }

  const startEditCup = (cup) => {
    setEditingCup(cup)
    setCupForm({
      nama_cup: cup.nama_cup,
      stok_awal: cup.stok_awal.toString(),
      stok_sekarang: cup.stok_sekarang.toString()
    })
    setShowCupForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ==================== MENU HANDLERS ====================
  const handleAddMenu = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('menu_jualan').insert({
      nama_item: menuForm.nama_item,
      harga_jual: parseInt(menuForm.harga_jual),
      id_cup: parseInt(menuForm.id_cup),
      keterangan: menuForm.keterangan || null
    })

    if (error) {
      msg(error.message, false)
    } else {
      msg(`Menu "${menuForm.nama_item}" ditambah!`)
      setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
      setShowMenuForm(false)
      fetchMenu()
    }
    setLoading(false)
  }

  const handleUpdateMenu = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('menu_jualan').update({
      nama_item: menuForm.nama_item,
      harga_jual: parseInt(menuForm.harga_jual),
      id_cup: parseInt(menuForm.id_cup),
      keterangan: menuForm.keterangan || null
    }).eq('id_menu', editingMenu.id_menu)

    if (error) {
      msg(error.message, false)
    } else {
      msg('Menu diupdate!')
      setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
      setEditingMenu(null)
      setShowMenuForm(false)
      fetchMenu()
    }
    setLoading(false)
  }

  const handleDeleteMenu = async (item) => {
    if (!confirm(`Hapus "${item.nama_item}"?`)) return

    const { error } = await supabase.from('menu_jualan').delete().eq('id_menu', item.id_menu)
    if (error) msg(error.message, false)
    else { msg('Menu dihapus!'); fetchMenu() }
  }

  const startEditMenu = (item) => {
    setEditingMenu(item)
    setMenuForm({
      nama_item: item.nama_item,
      harga_jual: item.harga_jual.toString(),
      id_cup: item.id_cup.toString(),
      keterangan: item.keterangan || ''
    })
    setShowMenuForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelMenuForm = () => {
    setShowMenuForm(false)
    setEditingMenu(null)
    setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
  }

  // ==================== COMPUTED ====================
  const totalTerjual = cups.reduce((a, c) => a + c.terjual_cup, 0)
  const totalPendapatan = ringkasan.reduce((a, r) => a + (r.total_pendapatan || 0), 0)
  const filteredMenu = menuFilter === 'all' ? menu : menu.filter(m => m.id_cup === parseInt(menuFilter))

  const tabs = [
    { k: 'monitoring', l: 'Monitoring', i: BarChart3 },
    { k: 'audit', l: 'Audit', i: ShieldCheck },
    { k: 'cup', l: 'Cup', i: Package },
    { k: 'menu', l: 'Menu', i: Coffee },
    { k: 'ringkasan', l: 'Laporan', i: TrendingUp },
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

        {/* ============================================================ */}
        {/* ==================== TAB: MONITORING ======================= */}
        {/* ============================================================ */}
        {tab === 'monitoring' && (
          <div className="animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Monitoring Cup</h2>
                <p className="text-xs text-stone-400 mt-0.5">Pantau stok cup real-time</p>
              </div>
              <button
                onClick={fetchCups}
                className="p-2.5 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer press"
              >
                <RefreshCw size={15} className="text-stone-400" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {cups.map(cup => {
                const persen = cup.stok_awal > 0 ? Math.round((cup.terjual_cup / cup.stok_awal) * 100) : 0
                const sisaPersen = cup.stok_awal > 0 ? Math.round((cup.stok_sekarang / cup.stok_awal) * 100) : 100
                const isLow = sisaPersen < 20

                return (
                  <div key={cup.id_cup} className="card p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-stone-800">{cup.nama_cup}</h3>
                        {isLow && (
                          <p className="text-xs text-red-500 font-semibold mt-1 animate-pulse-soft">
                            ⚠ Stok Menipis!
                          </p>
                        )}
                      </div>
                      <span className={`text-xl font-extrabold ${isLow ? 'text-red-500' : 'text-emerald-500'}`}>
                        {sisaPersen}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-stone-100 rounded-full mb-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isLow ? 'bg-red-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'
                        }`}
                        style={{ width: `${Math.min(persen, 100)}%` }}
                      />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 text-center gap-2">
                      <div className="bg-stone-50 rounded-xl py-2.5">
                        <p className="text-[10px] text-stone-400 font-medium">Awal</p>
                        <p className="font-bold text-stone-800 mt-0.5">{cup.stok_awal}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl py-2.5">
                        <p className="text-[10px] text-emerald-500 font-medium">Terjual</p>
                        <p className="font-bold text-emerald-600 mt-0.5">{cup.terjual_cup}</p>
                      </div>
                      <div className={`rounded-xl py-2.5 ${isLow ? 'bg-red-50' : 'bg-sky-50'}`}>
                        <p className={`text-[10px] font-medium ${isLow ? 'text-red-400' : 'text-sky-500'}`}>Sisa</p>
                        <p className={`font-bold mt-0.5 ${isLow ? 'text-red-600' : 'text-sky-600'}`}>{cup.stok_sekarang}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {cups.length === 0 && (
              <div className="text-center py-16">
                <Package size={32} className="text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">Belum ada data cup</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ==================== TAB: AUDIT ============================ */}
        {/* ============================================================ */}
        {tab === 'audit' && (
          <div className="animate-slideUp">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-stone-800">Audit Cup</h2>
              <p className="text-xs text-stone-400 mt-0.5">Bandingkan stok sistem vs fisik untuk deteksi kecurangan</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Form */}
              <div className="card p-5">
                <h3 className="font-bold text-stone-800 mb-4 text-sm flex items-center gap-2">
                  <Search size={16} className="text-blue-500" />
                  Form Audit
                </h3>
                <form onSubmit={handleAudit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Pilih Cup</label>
                    <select
                      value={auditForm.id_cup}
                      onChange={(e) => setAuditForm(p => ({ ...p, id_cup: e.target.value }))}
                      className={inputClass}
                      required
                    >
                      <option value="">-- Pilih Cup --</option>
                      {cups.map(c => (
                        <option key={c.id_cup} value={c.id_cup}>
                          {c.nama_cup} (Sistem: {c.stok_sekarang})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Jumlah Cup Fisik</label>
                    <input
                      type="number"
                      value={auditForm.cup_fisik}
                      onChange={(e) => setAuditForm(p => ({ ...p, cup_fisik: e.target.value }))}
                      className={inputClass}
                      placeholder="Hitung manual cup di rak"
                      min="0"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${btnPrimary} w-full justify-center`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Search size={15} /> Jalankan Audit</>
                    )}
                  </button>
                </form>
              </div>

              {/* Result */}
              {auditResult && (
                <div className={`card p-5 !border-2 animate-scaleIn ${
                  auditResult.selisih > 0
                    ? '!border-red-200 !bg-red-50'
                    : auditResult.selisih < 0
                    ? '!border-yellow-200 !bg-yellow-50'
                    : '!border-emerald-200 !bg-emerald-50'
                }`}>
                  {/* Status Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      auditResult.selisih > 0 ? 'bg-red-500' :
                      auditResult.selisih < 0 ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}>
                      {auditResult.selisih !== 0
                        ? <AlertTriangle size={20} className="text-white" />
                        : <CheckCircle size={20} className="text-white" />
                      }
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-lg">
                        {auditResult.selisih > 0 ? 'KECURANGAN TERDETEKSI!' :
                         auditResult.selisih < 0 ? 'ANOMALI' : 'AMAN ✓'}
                      </h3>
                      <p className="text-xs text-stone-500">{auditResult.nama_cup}</p>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { l: 'Sistem', v: auditResult.stok_sistem },
                      { l: 'Fisik', v: auditResult.stok_fisik },
                      { l: 'Selisih', v: auditResult.selisih }
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 text-center">
                        <p className="text-[10px] text-stone-400 font-medium">{s.l}</p>
                        <p className={`text-2xl font-extrabold ${
                          s.l === 'Selisih'
                            ? (s.v > 0 ? 'text-red-600' : s.v < 0 ? 'text-yellow-600' : 'text-emerald-600')
                            : 'text-stone-800'
                        }`}>{s.v}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-stone-600 mb-3">{auditResult.status}</p>

                  {auditResult.estimasi_kerugian > 0 && (
                    <div className="bg-red-100 rounded-xl p-4 text-center">
                      <p className="text-xs text-red-500 font-medium">Estimasi Kerugian</p>
                      <p className="text-xl font-extrabold text-red-700 mt-0.5">
                        {rp(auditResult.estimasi_kerugian)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ==================== TAB: KELOLA CUP ======================= */}
        {/* ============================================================ */}
        {tab === 'cup' && (
          <div className="space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Kelola Cup</h2>
                <p className="text-xs text-stone-400 mt-0.5">Tambah, edit, restock & hapus cup</p>
              </div>
              <button
                onClick={() => {
                  setShowCupForm(true)
                  setEditingCup(null)
                  setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
                }}
                className={btnPrimary}
              >
                <Plus size={15} /> Tambah
              </button>
            </div>

            {/* Form */}
            {showCupForm && (
              <div className="card p-5 animate-scaleIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-800 text-sm">
                    {editingCup ? '✏️ Edit Cup' : '➕ Tambah Cup Baru'}
                  </h3>
                  <button
                    onClick={() => { setShowCupForm(false); setEditingCup(null) }}
                    className="p-1 cursor-pointer"
                  >
                    <X size={18} className="text-stone-400" />
                  </button>
                </div>
                <form
                  onSubmit={editingCup ? handleUpdateCup : handleAddCup}
                  className="grid sm:grid-cols-4 gap-3"
                >
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Nama</label>
                    <input
                      type="text"
                      value={cupForm.nama_cup}
                      onChange={(e) => setCupForm(p => ({ ...p, nama_cup: e.target.value }))}
                      className={inputClass}
                      placeholder="Cup 12oz"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Stok Awal</label>
                    <input
                      type="number"
                      value={cupForm.stok_awal}
                      onChange={(e) => setCupForm(p => ({
                        ...p,
                        stok_awal: e.target.value,
                        stok_sekarang: editingCup ? p.stok_sekarang : e.target.value
                      }))}
                      className={inputClass}
                      placeholder="100"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Stok Sekarang</label>
                    <input
                      type="number"
                      value={cupForm.stok_sekarang}
                      onChange={(e) => setCupForm(p => ({ ...p, stok_sekarang: e.target.value }))}
                      className={inputClass}
                      placeholder="100"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button type="submit" disabled={loading} className={`${btnPrimary} flex-1 justify-center`}>
                      {loading ? '...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCupForm(false); setEditingCup(null) }}
                      className="px-4 py-3 bg-stone-100 text-stone-500 rounded-xl text-sm font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 text-xs">
                      <th className="px-4 py-3 text-left font-semibold">Cup</th>
                      <th className="px-4 py-3 text-center font-semibold">Awal</th>
                      <th className="px-4 py-3 text-center font-semibold">Terjual</th>
                      <th className="px-4 py-3 text-center font-semibold">Sisa</th>
                      <th className="px-4 py-3 text-center font-semibold">Restock</th>
                      <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cups.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-10 text-center text-stone-300 text-xs">
                          Belum ada cup
                        </td>
                      </tr>
                    ) : (
                      cups.map(cup => {
                        const isLow = cup.stok_sekarang < cup.stok_awal * 0.2
                        return (
                          <tr key={cup.id_cup} className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-semibold text-stone-800">{cup.nama_cup}</span>
                              {isLow && (
                                <span className="ml-2 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                                  Low
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-stone-500">{cup.stok_awal}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{cup.terjual_cup}</td>
                            <td className={`px-4 py-3 text-center font-bold ${isLow ? 'text-red-600' : 'text-stone-800'}`}>
                              {cup.stok_sekarang}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {restockMode === cup.id_cup ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    value={restockAmount}
                                    onChange={(e) => setRestockAmount(e.target.value)}
                                    className="w-14 border border-stone-200 rounded-lg px-2 py-1 text-center text-xs focus:border-amber-400 outline-none"
                                    placeholder="Qty"
                                    min="1"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleQuickRestock(cup)}
                                    disabled={loading}
                                    className="p-1.5 bg-emerald-500 text-white rounded-lg cursor-pointer press"
                                  >
                                    <CheckCircle size={12} />
                                  </button>
                                  <button
                                    onClick={() => { setRestockMode(null); setRestockAmount('') }}
                                    className="p-1.5 bg-stone-200 text-stone-500 rounded-lg cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRestockMode(cup.id_cup)}
                                  className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg cursor-pointer font-medium hover:bg-emerald-200 transition-colors"
                                >
                                  + Restock
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => startEditCup(cup)}
                                  className="p-1.5 bg-blue-100 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => handleResetTerjual(cup)}
                                  className="p-1.5 bg-amber-100 text-amber-500 rounded-lg cursor-pointer hover:bg-amber-200 transition-colors"
                                  title="Reset Counter"
                                >
                                  <RefreshCw size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCup(cup)}
                                  className="p-1.5 bg-red-100 text-red-500 rounded-lg cursor-pointer hover:bg-red-200 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ==================== TAB: KELOLA MENU ====================== */}
        {/* ============================================================ */}
        {tab === 'menu' && (
          <div className="space-y-4 animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Kelola Menu</h2>
                <p className="text-xs text-stone-400 mt-0.5">Atur menu minuman beserta resep</p>
              </div>
              <button
                onClick={() => {
                  setShowMenuForm(true)
                  setEditingMenu(null)
                  setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
                }}
                className={btnPrimary}
              >
                <Plus size={15} /> Tambah
              </button>
            </div>

            {/* Form Tambah / Edit Menu */}
            {showMenuForm && (
              <div className="card p-5 animate-scaleIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                    {editingMenu ? <><Pencil size={14} className="text-blue-500" /> Edit Menu</> : <><Plus size={14} className="text-emerald-500" /> Menu Baru</>}
                  </h3>
                  <button onClick={cancelMenuForm} className="p-1 cursor-pointer">
                    <X size={18} className="text-stone-400" />
                  </button>
                </div>

                <form onSubmit={editingMenu ? handleUpdateMenu : handleAddMenu} className="space-y-3">
                  {/* Row 1 */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Nama Menu</label>
                      <input
                        type="text"
                        value={menuForm.nama_item}
                        onChange={(e) => setMenuForm(p => ({ ...p, nama_item: e.target.value }))}
                        className={inputClass}
                        placeholder="Matcha Latte"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Harga (Rp)</label>
                      <input
                        type="number"
                        value={menuForm.harga_jual}
                        onChange={(e) => setMenuForm(p => ({ ...p, harga_jual: e.target.value }))}
                        className={inputClass}
                        placeholder="15000"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Ukuran Cup</label>
                      <select
                        value={menuForm.id_cup}
                        onChange={(e) => setMenuForm(p => ({ ...p, id_cup: e.target.value }))}
                        className={inputClass}
                        required
                      >
                        <option value="">-- Pilih Cup --</option>
                        {cups.map(c => (
                          <option key={c.id_cup} value={c.id_cup}>{c.nama_cup}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Resep */}
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide flex items-center gap-1">
                      <FileText size={11} /> Resep / Keterangan
                    </label>
                    <textarea
                      value={menuForm.keterangan}
                      onChange={(e) => setMenuForm(p => ({ ...p, keterangan: e.target.value }))}
                      className={`${inputClass} resize-none`}
                      rows={4}
                      placeholder="Opsional. Tulis langkah pembuatan:&#10;- 2 sdm bubuk taro&#10;- 100ml air panas&#10;- Es batu&#10;- 2 sdm susu kental manis"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={loading} className={btnPrimary}>
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><CheckCircle size={15} /> {editingMenu ? 'Update' : 'Simpan'}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelMenuForm}
                      className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-medium cursor-pointer transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
              <button
                onClick={() => setMenuFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer press whitespace-nowrap ${
                  menuFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                Semua ({menu.length})
              </button>
              {cups.map(c => (
                <button
                  key={c.id_cup}
                  onClick={() => setMenuFilter(c.id_cup.toString())}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer press whitespace-nowrap ${
                    menuFilter === c.id_cup.toString() ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'
                  }`}
                >
                  {c.nama_cup} ({menu.filter(m => m.id_cup === c.id_cup).length})
                </button>
              ))}
            </div>

            {/* Menu Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMenu.map(item => {
                const isExpanded = expandedMenu === item.id_menu
                const hasResep = item.keterangan?.trim()

                return (
                  <div key={item.id_menu} className="card overflow-hidden group">
                    {/* Card Body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.id_cup === 2
                            ? 'bg-violet-100 text-violet-600'
                            : 'bg-sky-100 text-sky-600'
                        }`}>
                          {item.inventory_cup?.nama_cup || (item.id_cup === 1 ? '16oz' : '22oz')}
                        </span>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditMenu(item)}
                            className="p-1.5 bg-blue-50 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteMenu(item)}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-stone-800 text-sm leading-tight">{item.nama_item}</h4>
                      <p className="text-amber-600 font-bold text-lg mt-1">{rp(item.harga_jual)}</p>
                    </div>

                    {/* Resep Section */}
                    {hasResep ? (
                      <div className="border-t border-stone-100">
                        <button
                          onClick={() => setExpandedMenu(isExpanded ? null : item.id_menu)}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-600 cursor-pointer hover:bg-amber-50 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText size={12} />
                            Resep
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 animate-slideUp">
                            <div className="bg-amber-50 rounded-xl p-3.5 text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                              {item.keterangan}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-t border-stone-100 px-4 py-2.5">
                        <p className="text-[10px] text-stone-300 flex items-center gap-1">
                          <FileText size={10} /> Belum ada resep
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-16">
                <Coffee size={32} className="text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">Tidak ada menu</p>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-4 text-center">
                <Coffee size={18} className="text-amber-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-stone-400 font-medium">Total Menu</p>
                <p className="text-xl font-extrabold text-stone-800">{menu.length}</p>
              </div>
              <div className="card p-4 text-center">
                <FileText size={18} className="text-emerald-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-stone-400 font-medium">Punya Resep</p>
                <p className="text-xl font-extrabold text-emerald-600">{menu.filter(m => m.keterangan?.trim()).length}</p>
              </div>
              {cups.map(cup => (
                <div key={cup.id_cup} className="card p-4 text-center">
                  <Package size={18} className={`mx-auto mb-1.5 ${cup.id_cup === 1 ? 'text-sky-500' : 'text-violet-500'}`} />
                  <p className="text-[10px] text-stone-400 font-medium">{cup.nama_cup}</p>
                  <p className="text-xl font-extrabold text-stone-800">{menu.filter(m => m.id_cup === cup.id_cup).length}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ==================== TAB: RINGKASAN ======================== */}
        {/* ============================================================ */}
        {tab === 'ringkasan' && (
          <div className="space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Ringkasan Harian</h2>
                <p className="text-xs text-stone-400 mt-0.5">Laporan penjualan per hari</p>
              </div>
              <button
                onClick={fetchRingkasan}
                className="p-2.5 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer press"
              >
                <RefreshCw size={15} className="text-stone-400" />
              </button>
            </div>

            {/* Summary Cards */}
            {ringkasan.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Transaksi', v: ringkasan.length, from: '#f43f5e', to: '#ec4899' },
                  { l: 'Cup Terjual', v: ringkasan.reduce((a, r) => a + (r.total_cup || 0), 0), from: '#f59e0b', to: '#ea580c' },
                  { l: 'Pendapatan', v: rp(totalPendapatan), from: '#10b981', to: '#14b8a6' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 text-white"
                    style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
                  >
                    <p className="text-white/70 text-[10px] sm:text-xs font-medium">{s.l}</p>
                    <p className="text-lg sm:text-2xl font-extrabold mt-0.5">{s.v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 text-xs">
                      <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold">Kasir</th>
                      <th className="px-4 py-3 text-left font-semibold">Menu</th>
                      <th className="px-4 py-3 text-center font-semibold">Cup</th>
                      <th className="px-4 py-3 text-right font-semibold">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ringkasan.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-16 text-center">
                          <TrendingUp size={28} className="text-stone-200 mx-auto mb-2" />
                          <p className="text-stone-400 text-sm font-medium">Belum ada data transaksi</p>
                          <p className="text-stone-300 text-xs mt-1">Data muncul setelah ada penjualan</p>
                        </td>
                      </tr>
                    ) : (
                      ringkasan.map((r, i) => (
                        <tr key={i} className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-rose-600">
                                  {new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit' })}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-stone-700">
                                  {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'short' })}
                                </p>
                                <p className="text-[10px] text-stone-400">
                                  {new Date(r.tanggal).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center text-[9px] font-bold text-stone-600">
                                {r.kasir?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-stone-700">{r.kasir}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-600">{r.nama_item}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">
                              {r.total_cup}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-emerald-600 text-xs">
                              {rp(r.total_pendapatan)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}