import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  ShoppingBag, Plus, Minus, Send, Clock, CheckCircle,
  Coffee, Trash2, X, Search, ChevronUp, ChevronDown, 
  DollarSign, Receipt, RefreshCw, BookOpen, FileText, AlertTriangle, Info
} from 'lucide-react'

/* ================================================================
   HELPERS & CONSTANTS
   ================================================================ */
const RIWAYAT_LIMIT = 25

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const formatTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

/* ================================================================
   SUB-COMPONENTS (RESPONSIVE OPTIMIZED)
   ================================================================ */

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:flex-col sm:items-start transition-all">
      <div className={`w-10 h-10 sm:w-9 sm:h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm sm:text-lg font-black text-gray-900 truncate leading-tight">
          {value}
        </p>
      </div>
    </div>
  )
}

function FilterChips({ categories, active, onFilter }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onFilter(cat.key)}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            active === cat.key
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          {cat.label} <span className="ml-1 opacity-50 text-[10px]">{cat.count}</span>
        </button>
      ))}
    </div>
  )
}

function MenuListItem({ item, cup, quantity, hasResep, onAdd, onRemove, onViewResep }) {
  const isJumbo = item.id_cup === 2
  return (
    <div className={`group bg-white rounded-2xl border-2 transition-all ${
      quantity > 0 ? 'border-amber-400 shadow-amber-50' : 'border-gray-50 shadow-sm'
    }`}>
      <div className="p-3 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          quantity > 0 ? 'bg-amber-100' : 'bg-gray-50'
        }`}>
          <Coffee size={22} className={quantity > 0 ? 'text-amber-500' : 'text-gray-300'} />
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewResep(item)}>
          <h4 className="text-sm font-bold text-gray-800 truncate leading-snug">
            {item.nama_item}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
              isJumbo ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {cup?.nama_cup || 'Reguler'}
            </span>
            <span className="text-xs font-black text-amber-600">{formatRp(item.harga_jual)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
          {quantity > 0 && (
            <>
              <button 
                onClick={() => onRemove(item.id_menu)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-red-500 shadow-sm active:bg-red-50"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-sm font-black text-gray-900">{quantity}</span>
            </>
          )}
          <button 
            onClick={() => onAdd(item.id_menu)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg shadow-sm active:scale-95 transition-all ${
              quantity > 0 ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'
            }`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

export default function KasirPage() {
  const { user } = useAuth()
  
  // Data States
  const [menu, setMenu] = useState([])
  const [cups, setCups] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [resepModal, setResepModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, cRes, rRes] = await Promise.all([
        supabase.from('menu_jualan').select('*').order('nama_item'),
        supabase.from('inventory_cup').select('*'),
        supabase.from('transaksi_penjualan')
          .select('*, menu_jualan(nama_item, harga_jual)')
          .eq('kasir_id', user.id)
          .gte('tanggal_jam', new Date().toISOString().split('T')[0])
          .order('tanggal_jam', { ascending: false }).limit(RIWAYAT_LIMIT)
      ])
      setMenu(mRes.data || [])
      setCups(cRes.data || [])
      setRiwayat(rRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Cart Logic
  const updateCart = (id, delta) => {
    setCart(prev => {
      const val = (prev[id] || 0) + delta
      if (val <= 0) { const {[id]: _, ...rest} = prev; return rest }
      return { ...prev, [id]: val }
    })
  }

  const handleSubmit = async () => {
    if (Object.keys(cart).length === 0) return
    setActionLoading(true)
    try {
      const inserts = Object.entries(cart).map(([id, qty]) => ({
        id_menu: parseInt(id),
        jumlah_beli: qty,
        kasir_id: user.id
      }))
      await supabase.from('transaksi_penjualan').insert(inserts)
      setCart({}); setShowCart(false); fetchAll()
    } finally { setActionLoading(false) }
  }

  // Computed
  const totalItem = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalHarga = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id_menu === parseInt(id)); return sum + (item?.harga_jual || 0) * qty
  }, 0)
  const todayTotal = riwayat.reduce((s, r) => s + (r.total_bayar || 0), 0)
  const todayCups = riwayat.reduce((s, r) => s + (r.jumlah_beli || 0), 0)

  const filteredMenu = menu.filter(m => {
    const matchCat = activeCategory === 'all' || m.id_cup === activeCategory
    const matchSearch = m.nama_item.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const cupsMap = useMemo(() => Object.fromEntries(cups.map(c => [c.id_cup, c])), [cups])

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-bold">Memuat Kasir...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 space-y-6 pb-32 lg:pb-10">
        
        {/* STATS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Transaksi" value={riwayat.length} icon={Receipt} color="text-blue-500" bg="bg-blue-50" />
          <StatCard label="Terjual" value={`${todayCups} Cup`} icon={Coffee} color="text-amber-500" bg="bg-amber-50" />
          <StatCard label="Omzet" value={formatRp(todayTotal)} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-50" />
        </section>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* MENU SECTION */}
          <div className="lg:col-span-2 space-y-5">
            <div className="sticky top-2 z-10 space-y-3 bg-gray-50/80 backdrop-blur-md pb-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="text" placeholder="Cari menu minuman..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all text-sm font-medium"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <FilterChips 
                active={activeCategory} onFilter={setActiveCategory}
                categories={[{key: 'all', label: 'Semua', count: menu.length}, ...cups.map(c => ({key: c.id_cup, label: c.nama_cup, count: menu.filter(m => m.id_cup === c.id_cup).length}))]}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredMenu.map(item => (
                <MenuListItem 
                  key={item.id_menu} item={item} quantity={cart[item.id_menu] || 0}
                  cup={cupsMap[item.id_cup]} onAdd={() => updateCart(item.id_menu, 1)}
                  onRemove={() => updateCart(item.id_menu, -1)} onViewResep={setResepModal}
                />
              ))}
            </div>
          </div>

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block space-y-4 sticky top-24">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter"><ShoppingBag size={18} className="text-amber-500"/> Keranjang</h3>
                <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-black">{totalItem}</span>
              </div>
              <div className="p-4 max-h-[40vh] overflow-y-auto space-y-3">
                {Object.entries(cart).map(([id, qty]) => {
                  const itm = menu.find(m => m.id_menu === parseInt(id))
                  return (
                    <div key={id} className="flex justify-between items-center text-sm font-bold bg-gray-50 p-3 rounded-2xl">
                      <span className="truncate flex-1 pr-2">{itm?.nama_item}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">x{qty}</span>
                        <span className="text-amber-600 min-w-[70px] text-right">{formatRp((itm?.harga_jual || 0) * qty)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-5 bg-gray-900 text-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Total Bayar</span>
                  <span className="text-2xl font-black text-amber-400">{formatRp(totalHarga)}</span>
                </div>
                <button 
                  disabled={totalItem === 0 || actionLoading} onClick={handleSubmit}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {actionLoading ? <RefreshCw className="animate-spin"/> : <Send size={20}/>} CATAT PENJUALAN
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* MOBILE FLOATING ACTION */}
      {totalItem > 0 && (
        <div className="fixed bottom-20 left-4 right-4 lg:hidden z-40 animate-slideUp">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border-t border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><ShoppingBag size={20}/></div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-400 uppercase leading-none mb-1">Check Out</p>
                <p className="text-sm font-black">{totalItem} Item terpilih</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-amber-400">{formatRp(totalHarga)}</p>
              <ChevronUp size={16} className="ml-auto text-gray-500"/>
            </div>
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-8 py-3 flex items-center justify-between lg:hidden z-50">
        <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-1">
          <Clock size={22} className="text-gray-400"/>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Riwayat</span>
        </button>
        <button className="w-14 h-14 bg-amber-500 rounded-full -mt-10 border-4 border-gray-50 shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform">
          <Plus size={28}/>
        </button>
        <button onClick={fetchAll} className="flex flex-col items-center gap-1">
          <RefreshCw size={22} className="text-gray-400"/>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Refresh</span>
        </button>
      </nav>

      {/* MODAL KERANJANG MOBILE */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)}/>
          <div className="relative bg-white w-full rounded-t-[40px] shadow-2xl p-6 space-y-6 animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"/>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800">Detail Pesanan</h3>
              <button onClick={() => setShowCart(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-4">
              {Object.entries(cart).map(([id, qty]) => {
                const itm = menu.find(m => m.id_menu === parseInt(id))
                return (
                  <div key={id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-amber-500 shadow-sm">{qty}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{itm?.nama_item}</p>
                      <p className="text-xs text-gray-400">{formatRp(itm?.harga_jual || 0)} per cup</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">{formatRp((itm?.harga_jual || 0) * qty)}</p>
                      <button onClick={() => updateCart(id, -qty)} className="text-[10px] font-black text-red-400 uppercase mt-1">Hapus</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-gray-400 font-bold uppercase">Total Bayar</span>
                <span className="text-2xl font-black text-amber-600">{formatRp(totalHarga)}</span>
              </div>
              <button 
                onClick={handleSubmit} disabled={actionLoading}
                className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {actionLoading ? <RefreshCw className="animate-spin"/> : <CheckCircle size={24}/>} KONFIRMASI & CATAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT MOBILE */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}/>
          <div className="relative bg-white w-full h-[85vh] rounded-t-[40px] flex flex-col p-6 animate-slideUp">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"/>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Riwayat Hari Ini</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pb-10">
              {riwayat.map(trx => (
                <div key={trx.id_transaksi} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">{trx.menu_jualan?.nama_item}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-lg border border-gray-200">{trx.jumlah_beli} Cup</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatTime(trx.tanggal_jam)}</span>
                    </div>
                  </div>
                  <p className="font-black text-emerald-600">{formatRp(trx.total_bayar)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESEP */}
      {resepModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setResepModal(null)}/>
          <div className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-scaleIn">
             <div className="bg-amber-500 p-6 text-white text-center">
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><BookOpen size={32}/></div>
               <h3 className="text-xl font-black leading-tight">{resepModal.nama_item}</h3>
               <p className="text-amber-100 text-xs font-bold uppercase mt-1 tracking-widest">{cupsMap[resepModal.id_cup]?.nama_cup}</p>
             </div>
             <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-xs font-black text-gray-400 uppercase mb-2">Instruksi Racikan</p>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                    {resepModal.keterangan || "Resep belum ditambahkan oleh admin."}
                  </p>
                </div>
                <button onClick={() => setResepModal(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black">MENGERTI</button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}