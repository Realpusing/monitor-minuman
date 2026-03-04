import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import {
  BarChart3, ShieldCheck, Package, Coffee, TrendingUp,
  Search, RefreshCw, Pencil, Trash2, Plus, X, CheckCircle,
  AlertTriangle, Target, DollarSign, ChevronDown, ChevronUp,
  FileText, Eye, EyeOff
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
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchCups()
    fetchMenu()
    fetchRingkasan()
  }, [])

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

  const showMessage = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  const formatRp = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  // ==================== AUDIT ====================
  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuditResult(null)
    const { data, error } = await supabase.rpc('fn_audit_cup', {
      p_id_cup: parseInt(auditForm.id_cup),
      p_cup_fisik: parseInt(auditForm.cup_fisik)
    })
    if (error) showMessage(error.message, 'error')
    else setAuditResult(data?.[0])
    setLoading(false)
  }

  // ==================== CUP ====================
  const handleAddCup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('inventory_cup').insert({
      nama_cup: cupForm.nama_cup,
      stok_awal: parseInt(cupForm.stok_awal),
      stok_sekarang: parseInt(cupForm.stok_sekarang || cupForm.stok_awal),
      terjual_cup: 0
    })
    if (error) showMessage(error.message, 'error')
    else {
      showMessage(`Cup "${cupForm.nama_cup}" ditambah!`)
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
    if (error) showMessage(error.message, 'error')
    else {
      showMessage('Cup diupdate!')
      setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
      setEditingCup(null)
      setShowCupForm(false)
      fetchCups()
    }
    setLoading(false)
  }

  const handleDeleteCup = async (cup) => {
    const menuPakaiCup = menu.filter(m => m.id_cup === cup.id_cup)
    if (menuPakaiCup.length > 0) {
      showMessage(`Ada ${menuPakaiCup.length} menu pakai cup ini!`, 'error')
      return
    }
    if (!confirm(`Hapus "${cup.nama_cup}"?`)) return
    const { error } = await supabase.from('inventory_cup').delete().eq('id_cup', cup.id_cup)
    if (error) showMessage(error.message, 'error')
    else { showMessage('Cup dihapus!'); fetchCups() }
  }

  const handleQuickRestock = async (cup) => {
    if (!restockAmount || parseInt(restockAmount) <= 0) {
      showMessage('Jumlah tidak valid!', 'error')
      return
    }
    setLoading(true)
    const tambah = parseInt(restockAmount)
    const { error } = await supabase.from('inventory_cup').update({
      stok_awal: cup.stok_awal + tambah,
      stok_sekarang: cup.stok_sekarang + tambah,
      terjual_cup: 0
    }).eq('id_cup', cup.id_cup)
    if (error) showMessage(error.message, 'error')
    else {
      showMessage(`+${tambah} ${cup.nama_cup}!`)
      setRestockMode(null)
      setRestockAmount('')
      fetchCups()
    }
    setLoading(false)
  }

  const handleResetTerjual = async (cup) => {
    if (!confirm(`Reset counter "${cup.nama_cup}"?`)) return
    const { error } = await supabase.from('inventory_cup').update({
      stok_awal: cup.stok_sekarang,
      terjual_cup: 0
    }).eq('id_cup', cup.id_cup)
    if (error) showMessage(error.message, 'error')
    else { showMessage('Counter direset!'); fetchCups() }
  }

  const startEditCup = (cup) => {
    setEditingCup(cup)
    setCupForm({
      nama_cup: cup.nama_cup,
      stok_awal: cup.stok_awal.toString(),
      stok_sekarang: cup.stok_sekarang.toString()
    })
    setShowCupForm(true)
  }

  // ==================== MENU ====================
  const handleAddMenu = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('menu_jualan').insert({
      nama_item: menuForm.nama_item,
      harga_jual: parseInt(menuForm.harga_jual),
      id_cup: parseInt(menuForm.id_cup),
      keterangan: menuForm.keterangan || null
    })
    if (error) showMessage(error.message, 'error')
    else {
      showMessage(`Menu "${menuForm.nama_item}" ditambah!`)
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
    if (error) showMessage(error.message, 'error')
    else {
      showMessage('Menu diupdate!')
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
    if (error) showMessage(error.message, 'error')
    else { showMessage('Menu dihapus!'); fetchMenu() }
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

  const filteredMenu = menuFilter === 'all'
    ? menu
    : menu.filter(m => m.id_cup === parseInt(menuFilter))

  const totalTerjual = cups.reduce((a, c) => a + c.terjual_cup, 0)
  const totalPendapatan = ringkasan.reduce((a, r) => a + (r.total_pendapatan || 0), 0)

  const tabs = [
    { key: 'monitoring', label: 'Monitoring', icon: BarChart3, color: 'amber' },
    { key: 'audit', label: 'Audit', icon: ShieldCheck, color: 'blue' },
    { key: 'cup', label: 'Kelola Cup', icon: Package, color: 'purple' },
    { key: 'menu', label: 'Kelola Menu', icon: Coffee, color: 'emerald' },
    { key: 'ringkasan', label: 'Ringkasan', icon: TrendingUp, color: 'rose' },
  ]

  const getTabGradient = (color) => {
    const map = {
      amber: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      blue: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      purple: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
      emerald: 'linear-gradient(135deg, #10b981, #14b8a6)',
      rose: 'linear-gradient(135deg, #f43f5e, #ec4899)',
    }
    return map[color]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Toast */}
      {msg.text && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium ${
            msg.type === 'error'
              ? 'bg-red-500 text-white shadow-red-200'
              : 'bg-emerald-500 text-white shadow-emerald-200'
          }`}>
            {msg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            {msg.text}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 lg:p-6">

        {/* Header Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Cup</p>
                <p className="text-3xl font-bold mt-1">{cups.reduce((a, c) => a + c.stok_sekarang, 0)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Terjual</p>
                <p className="text-3xl font-bold mt-1">{totalTerjual}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Target size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-5 text-white card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Menu</p>
                <p className="text-3xl font-bold mt-1">{menu.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Coffee size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Pendapatan</p>
                <p className="text-2xl font-bold mt-1">{formatRp(totalPendapatan)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 mb-6 flex gap-2 overflow-x-auto shadow-sm border border-gray-100">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                tab === t.key ? 'text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
              }`}
              style={tab === t.key ? { background: getTabGradient(t.color) } : {}}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ==================== MONITORING ==================== */}
        {tab === 'monitoring' && (
          <div className="space-y-6 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Monitoring Cup</h2>
                <p className="text-gray-500 mt-1">Pantau stok cup secara real-time</p>
              </div>
              <button onClick={fetchCups} className="p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <RefreshCw size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {cups.map(cup => {
                const persen = cup.stok_awal > 0 ? Math.round((cup.terjual_cup / cup.stok_awal) * 100) : 0
                const sisaPersen = cup.stok_awal > 0 ? Math.round((cup.stok_sekarang / cup.stok_awal) * 100) : 100
                const isLow = sisaPersen < 20

                return (
                  <div key={cup.id_cup} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{cup.nama_cup}</h3>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full mt-2 pulse-warning">
                            <AlertTriangle size={12} /> Stok Menipis!
                          </span>
                        )}
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                        isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {sisaPersen}%
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Terjual {cup.terjual_cup}</span>
                        <span className="font-medium text-gray-800">Sisa {cup.stok_sekarang}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isLow ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                          }`}
                          style={{ width: `${Math.min(persen, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">Stok Awal</p>
                        <p className="text-lg font-bold text-gray-800">{cup.stok_awal}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-xs text-emerald-500 mb-1">Terjual</p>
                        <p className="text-lg font-bold text-emerald-600">{cup.terjual_cup}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${isLow ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <p className={`text-xs mb-1 ${isLow ? 'text-red-500' : 'text-blue-500'}`}>Sisa</p>
                        <p className={`text-lg font-bold ${isLow ? 'text-red-600' : 'text-blue-600'}`}>{cup.stok_sekarang}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ==================== AUDIT ==================== */}
        {tab === 'audit' && (
          <div className="space-y-6 animate-slideUp">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Audit Cup</h2>
              <p className="text-gray-500 mt-1">Bandingkan stok sistem dengan stok fisik untuk deteksi kecurangan</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Search className="text-blue-500" size={20} /> Form Audit
                </h3>
                <form onSubmit={handleAudit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Cup</label>
                    <select
                      value={auditForm.id_cup}
                      onChange={(e) => setAuditForm(p => ({ ...p, id_cup: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-400 focus:bg-white"
                      required
                    >
                      <option value="">-- Pilih Cup --</option>
                      {cups.map(c => (
                        <option key={c.id_cup} value={c.id_cup}>{c.nama_cup} (Sistem: {c.stok_sekarang})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Cup Fisik</label>
                    <input
                      type="number"
                      value={auditForm.cup_fisik}
                      onChange={(e) => setAuditForm(p => ({ ...p, cup_fisik: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-400 focus:bg-white"
                      placeholder="Hitung manual cup di rak"
                      min="0"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer btn-press">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search size={18} /> Jalankan Audit</>}
                  </button>
                </form>
              </div>

              {auditResult && (
                <div className={`rounded-2xl p-6 border-2 animate-slideUp ${
                  auditResult.selisih > 0 ? 'bg-red-50 border-red-200' :
                  auditResult.selisih < 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      auditResult.selisih > 0 ? 'bg-red-500' : auditResult.selisih < 0 ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}>
                      {auditResult.selisih !== 0 ? <AlertTriangle className="text-white" size={24} /> : <CheckCircle className="text-white" size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">
                        {auditResult.selisih > 0 ? 'KECURANGAN TERDETEKSI!' : auditResult.selisih < 0 ? 'ANOMALI' : 'AMAN'}
                      </h3>
                      <p className="text-sm text-gray-500">{auditResult.nama_cup}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: 'Sistem', value: auditResult.stok_sistem },
                      { label: 'Fisik', value: auditResult.stok_fisik },
                      { label: 'Selisih', value: auditResult.selisih }
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${
                          s.label === 'Selisih' ? (s.value > 0 ? 'text-red-600' : s.value < 0 ? 'text-yellow-600' : 'text-emerald-600') : 'text-gray-800'
                        }`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{auditResult.status}</p>
                  {auditResult.estimasi_kerugian > 0 && (
                    <div className="bg-red-100 rounded-xl p-4 flex items-center gap-3">
                      <DollarSign className="text-red-500" size={24} />
                      <div>
                        <p className="text-sm text-red-600">Estimasi Kerugian</p>
                        <p className="text-xl font-bold text-red-700">{formatRp(auditResult.estimasi_kerugian)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== KELOLA CUP ==================== */}
        {tab === 'cup' && (
          <div className="space-y-6 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Kelola Cup</h2>
                <p className="text-gray-500 mt-1">Tambah, edit, dan kelola stok cup</p>
              </div>
              <button onClick={() => { setShowCupForm(true); setEditingCup(null); setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' }) }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-purple-200 cursor-pointer btn-press">
                <Plus size={18} /> Tambah Cup
              </button>
            </div>

            {showCupForm && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-slideUp">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">{editingCup ? '✏️ Edit Cup' : '➕ Tambah Cup Baru'}</h3>
                  <button onClick={() => { setShowCupForm(false); setEditingCup(null) }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
                </div>
                <form onSubmit={editingCup ? handleUpdateCup : handleAddCup} className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Cup</label>
                    <input type="text" value={cupForm.nama_cup} onChange={(e) => setCupForm(p => ({ ...p, nama_cup: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-purple-400" placeholder="Cup 12oz" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stok Awal</label>
                    <input type="number" value={cupForm.stok_awal} onChange={(e) => setCupForm(p => ({ ...p, stok_awal: e.target.value, stok_sekarang: editingCup ? p.stok_sekarang : e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-purple-400" placeholder="100" min="0" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stok Sekarang</label>
                    <input type="number" value={cupForm.stok_sekarang} onChange={(e) => setCupForm(p => ({ ...p, stok_sekarang: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-purple-400" placeholder="100" min="0" required />
                  </div>
                  <div className="flex items-end gap-2">
                    <button type="submit" disabled={loading} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-xl cursor-pointer">{loading ? '...' : 'Simpan'}</button>
                    <button type="button" onClick={() => { setShowCupForm(false); setEditingCup(null) }} className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600 cursor-pointer">Batal</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nama Cup</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Awal</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Terjual</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Sisa</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Restock</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cups.map(cup => {
                    const isLow = cup.stok_sekarang < cup.stok_awal * 0.2
                    return (
                      <tr key={cup.id_cup} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">{cup.nama_cup}</span>
                          {isLow && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Low</span>}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-600">{cup.stok_awal}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{cup.terjual_cup}</td>
                        <td className={`px-6 py-4 text-center font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{cup.stok_sekarang}</td>
                        <td className="px-6 py-4 text-center">
                          {restockMode === cup.id_cup ? (
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)}
                                className="w-16 border-2 border-purple-200 rounded-lg px-2 py-1 text-center text-sm" placeholder="Qty" min="1" autoFocus />
                              <button onClick={() => handleQuickRestock(cup)} className="p-1.5 bg-emerald-500 text-white rounded-lg cursor-pointer"><CheckCircle size={14} /></button>
                              <button onClick={() => { setRestockMode(null); setRestockAmount('') }} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg cursor-pointer"><X size={14} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setRestockMode(cup.id_cup)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-200 cursor-pointer font-medium">+ Restock</button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => startEditCup(cup)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 cursor-pointer"><Pencil size={14} /></button>
                            <button onClick={() => handleResetTerjual(cup)} className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 cursor-pointer" title="Reset"><RefreshCw size={14} /></button>
                            <button onClick={() => handleDeleteCup(cup)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 cursor-pointer"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== KELOLA MENU + RESEP ==================== */}
        {tab === 'menu' && (
          <div className="space-y-6 animate-slideUp">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Kelola Menu</h2>
                <p className="text-gray-500 mt-1">Atur menu minuman beserta resep pembuatannya</p>
              </div>
              <button
                onClick={() => { setShowMenuForm(true); setEditingMenu(null); setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' }) }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 cursor-pointer btn-press"
              >
                <Plus size={18} /> Tambah Menu
              </button>
            </div>

            {/* Form Tambah/Edit Menu */}
            {showMenuForm && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-slideUp shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    {editingMenu ? <><Pencil size={18} className="text-blue-500" /> Edit Menu</> : <><Plus size={18} className="text-emerald-500" /> Tambah Menu Baru</>}
                  </h3>
                  <button onClick={cancelMenuForm} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={editingMenu ? handleUpdateMenu : handleAddMenu} className="space-y-5">
                  {/* Row 1: Nama, Harga, Cup */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Menu</label>
                      <input
                        type="text"
                        value={menuForm.nama_item}
                        onChange={(e) => setMenuForm(p => ({ ...p, nama_item: e.target.value }))}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-emerald-400 focus:bg-white transition-all"
                        placeholder="Contoh: Matcha Latte"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Harga (Rp)</label>
                      <input
                        type="number"
                        value={menuForm.harga_jual}
                        onChange={(e) => setMenuForm(p => ({ ...p, harga_jual: e.target.value }))}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-emerald-400 focus:bg-white transition-all"
                        placeholder="15000"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ukuran Cup</label>
                      <select
                        value={menuForm.id_cup}
                        onChange={(e) => setMenuForm(p => ({ ...p, id_cup: e.target.value }))}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-emerald-400 focus:bg-white transition-all"
                        required
                      >
                        <option value="">-- Pilih Cup --</option>
                        {cups.map(c => (
                          <option key={c.id_cup} value={c.id_cup}>{c.nama_cup}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Keterangan / Resep */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-amber-500" />
                      Keterangan / Resep Pembuatan
                    </label>
                    <textarea
                      value={menuForm.keterangan}
                      onChange={(e) => setMenuForm(p => ({ ...p, keterangan: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-emerald-400 focus:bg-white transition-all resize-none"
                      rows={4}
                      placeholder="Contoh:&#10;- 2 sdm bubuk taro&#10;- 100ml air panas (aduk rata)&#10;- Tambah es batu&#10;- 2 sdm susu kental manis&#10;- Aduk rata, sajikan"
                    />
                    <p className="text-xs text-gray-400 mt-1">Opsional. Tulis langkah-langkah membuat minuman ini.</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-200 cursor-pointer btn-press"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      {loading ? 'Menyimpan...' : editingMenu ? 'Update Menu' : 'Simpan Menu'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelMenuForm}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl cursor-pointer transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">Filter:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMenuFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    menuFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Semua ({menu.length})
                </button>
                {cups.map(cup => (
                  <button
                    key={cup.id_cup}
                    onClick={() => setMenuFilter(cup.id_cup.toString())}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                      menuFilter === cup.id_cup.toString()
                        ? cup.id_cup === 1 ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cup.nama_cup} ({menu.filter(m => m.id_cup === cup.id_cup).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map(item => {
                const isExpanded = expandedMenu === item.id_menu
                const hasResep = item.keterangan && item.keterangan.trim() !== ''

                return (
                  <div
                    key={item.id_menu}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover group"
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          {/* Badge */}
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-2 ${
                            item.id_cup === 1
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}>
                            {item.inventory_cup?.nama_cup || (item.id_cup === 1 ? '16oz' : '22oz')}
                          </span>

                          {/* Name */}
                          <h4 className="font-bold text-gray-800 text-lg leading-tight">
                            {item.nama_item}
                          </h4>
                        </div>

                        {/* Actions - visible on hover */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
                          <button
                            onClick={() => startEditMenu(item)}
                            className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 cursor-pointer transition-all"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteMenu(item)}
                            className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 cursor-pointer transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <p className="text-2xl font-bold gradient-text">
                        {formatRp(item.harga_jual)}
                      </p>
                    </div>

                    {/* Recipe Section */}
                    {hasResep && (
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => setExpandedMenu(isExpanded ? null : item.id_menu)}
                          className="w-full px-5 py-3 flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 transition-all"
                        >
                          <span className="flex items-center gap-2 text-amber-600 font-semibold">
                            <FileText size={15} />
                            Resep / Keterangan
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-4 animate-slideUp">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {item.keterangan}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Recipe Indicator */}
                    {!hasResep && (
                      <div className="border-t border-gray-100 px-5 py-3">
                        <p className="text-xs text-gray-300 flex items-center gap-1">
                          <FileText size={12} />
                          Belum ada resep
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coffee className="text-gray-300" size={24} />
                </div>
                <p className="text-gray-400 font-medium">Tidak ada menu di kategori ini</p>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center card-hover">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Coffee className="text-amber-600" size={20} />
                </div>
                <p className="text-xs text-gray-400 font-medium">Total Menu</p>
                <p className="text-2xl font-bold text-gray-800">{menu.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center card-hover">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <FileText className="text-emerald-600" size={20} />
                </div>
                <p className="text-xs text-gray-400 font-medium">Punya Resep</p>
                <p className="text-2xl font-bold text-emerald-600">{menu.filter(m => m.keterangan).length}</p>
              </div>
              {cups.map(cup => (
                <div key={cup.id_cup} className="bg-white rounded-2xl border border-gray-100 p-5 text-center card-hover">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                    cup.id_cup === 1 ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <Package size={20} className={cup.id_cup === 1 ? 'text-blue-600' : 'text-purple-600'} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{cup.nama_cup}</p>
                  <p className="text-2xl font-bold text-gray-800">{menu.filter(m => m.id_cup === cup.id_cup).length}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== RINGKASAN ==================== */}
        {tab === 'ringkasan' && (
          <div className="space-y-6 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Ringkasan Harian</h2>
                <p className="text-gray-500 mt-1">Laporan penjualan per hari</p>
              </div>
              <button onClick={fetchRingkasan} className="p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <RefreshCw size={18} className="text-gray-500" />
              </button>
            </div>

            {ringkasan.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-5 text-white card-hover">
                  <p className="text-rose-100 text-sm font-medium">Total Transaksi</p>
                  <p className="text-3xl font-bold mt-1">{ringkasan.length}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white card-hover">
                  <p className="text-amber-100 text-sm font-medium">Cup Terjual</p>
                  <p className="text-3xl font-bold mt-1">{ringkasan.reduce((a, r) => a + (r.total_cup || 0), 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white card-hover col-span-2 lg:col-span-1">
                  <p className="text-emerald-100 text-sm font-medium">Total Pendapatan</p>
                  <p className="text-3xl font-bold mt-1">{formatRp(totalPendapatan)}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tanggal</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Kasir</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Menu</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Cup</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ringkasan.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="text-gray-300" size={24} />
                          </div>
                          <p className="text-gray-400 font-medium">Belum ada data transaksi</p>
                        </td>
                      </tr>
                    ) : (
                      ringkasan.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                <span className="text-xs font-bold text-rose-600">
                                  {new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit' })}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">
                                  {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                {r.kasir?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-700 text-sm">{r.kasir}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">{r.nama_item}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-lg font-bold text-sm">{r.total_cup}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-emerald-600">{formatRp(r.total_pendapatan)}</span>
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