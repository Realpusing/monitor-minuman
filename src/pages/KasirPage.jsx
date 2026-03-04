import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  Plus, Minus, Send, Clock, CheckCircle, ShoppingBag,
  Trash2, FileText, X, Eye, Coffee
} from 'lucide-react'

export default function KasirPage() {
  const { user } = useAuth()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) // resep modal
  const [sheet, setSheet] = useState(null) // 'cart' | 'history' | null
  const [cups, setCups] = useState([])

  useEffect(() => { load() }, [])
  const load = () => { fetchMenu(); fetchRiwayat(); fetchCups() }

  const fetchCups = async () => { const { data } = await supabase.from('inventory_cup').select('*').order('id_cup'); setCups(data || []) }
  const fetchMenu = async () => { const { data } = await supabase.from('menu_jualan').select('*, inventory_cup(nama_cup)').order('id_cup, harga_jual'); setMenu(data || []) }
  const fetchRiwayat = async () => {
    const { data } = await supabase.from('transaksi_penjualan').select('*, menu_jualan(nama_item, harga_jual)')
      .eq('kasir_id', user.id).gte('tanggal_jam', new Date().toISOString().split('T')[0])
      .order('tanggal_jam', { ascending: false }).limit(30)
    setRiwayat(data || [])
  }

  const setQty = (id, delta) => {
    setCart(prev => {
      const n = Math.max(0, (prev[id] || 0) + delta)
      if (n === 0) { const { [id]: _, ...rest } = prev; return rest }
      return { ...prev, [id]: n }
    })
  }

  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalPrice = Object.entries(cart).reduce((s, [id, q]) => {
    const m = menu.find(x => x.id_menu === +id)
    return s + (m?.harga_jual || 0) * q
  }, 0)

  const submit = async () => {
    if (!totalQty) return
    setLoading(true)
    try {
      const rows = Object.entries(cart).map(([id, q]) => ({ id_menu: +id, jumlah_beli: q, kasir_id: user.id }))
      const { error } = await supabase.from('transaksi_penjualan').insert(rows)
      if (error) throw error
      setToast(`${totalQty} cup tercatat ✓`)
      setCart({}); setSheet(null); fetchRiwayat()
      setTimeout(() => setToast(''), 3000)
    } catch (e) { alert(e.message) }
    setLoading(false)
  }

  const rp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const todayTotal = riwayat.reduce((s, r) => s + (r.total_bayar || 0), 0)
  const filtered = filter === 'all' ? menu : menu.filter(m => m.id_cup === filter)

  return (
    <div className="min-h-screen bg-stone-50 pb-20 lg:pb-0">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 inset-x-0 z-50 flex justify-center animate-slideDown pointer-events-none">
          <div className="bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg">{toast}</div>
        </div>
      )}

      {/* ===== RESEP MODAL ===== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slideFromBottom sm:animate-scaleIn max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white relative">
              <button onClick={() => setModal(null)} className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-full cursor-pointer"><X size={16} /></button>
              <p className="text-xs font-medium bg-white/20 inline-block px-2 py-0.5 rounded-full mb-2">{modal.inventory_cup?.nama_cup}</p>
              <h3 className="text-xl font-bold">{modal.nama_item}</h3>
              <p className="text-lg font-semibold text-white/80 mt-1">{rp(modal.harga_jual)}</p>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {modal.keterangan?.trim() ? (
                <>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FileText size={13} /> Resep</p>
                  <div className="bg-amber-50 rounded-2xl p-4 text-sm text-stone-700 whitespace-pre-line leading-relaxed">{modal.keterangan}</div>
                </>
              ) : (
                <p className="text-center text-stone-300 text-sm py-6">Belum ada resep</p>
              )}
              {/* Quick Add */}
              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm text-stone-500">Jumlah</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(modal.id_menu, -1)} disabled={!(cart[modal.id_menu])}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center press cursor-pointer ${cart[modal.id_menu] ? 'bg-red-100 text-red-500' : 'bg-stone-100 text-stone-300'}`}><Minus size={18} /></button>
                  <span className="text-xl font-bold text-stone-800 w-8 text-center">{cart[modal.id_menu] || 0}</span>
                  <button onClick={() => setQty(modal.id_menu, 1)}
                    className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center press cursor-pointer"><Plus size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CART SHEET ===== */}
      {sheet === 'cart' && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden animate-fadeIn">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSheet(null)} />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl animate-slideFromBottom max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-2 pb-1"><div className="w-8 h-1 bg-stone-200 rounded-full" /></div>
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-800">Keranjang ({totalQty})</h3>
              <div className="flex gap-3">
                {totalQty > 0 && <button onClick={() => setCart({})} className="text-xs text-red-400 cursor-pointer">Hapus</button>}
                <button onClick={() => setSheet(null)} className="cursor-pointer"><X size={18} className="text-stone-400" /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {totalQty === 0 ? <p className="text-center text-stone-300 py-10 text-sm">Kosong</p> : (
                Object.entries(cart).map(([id, q]) => {
                  const m = menu.find(x => x.id_menu === +id)
                  if (!m) return null
                  return (
                    <div key={id} className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">{m.nama_item}</p>
                        <p className="text-xs text-stone-400">{rp(m.harga_jual)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setQty(m.id_menu, -1)} className="w-7 h-7 rounded-lg bg-red-100 text-red-500 flex items-center justify-center cursor-pointer"><Minus size={12} /></button>
                        <span className="text-sm font-bold w-5 text-center">{q}</span>
                        <button onClick={() => setQty(m.id_menu, 1)} className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center cursor-pointer"><Plus size={12} /></button>
                      </div>
                      <p className="text-sm font-bold text-amber-600 min-w-[60px] text-right">{rp(m.harga_jual * q)}</p>
                    </div>
                  )
                })
              )}
            </div>
            {totalQty > 0 && (
              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <div className="flex justify-between mb-3">
                  <span className="font-bold text-stone-800">Total</span>
                  <span className="text-xl font-extrabold text-stone-800">{rp(totalPrice)}</span>
                </div>
                <button onClick={submit} disabled={loading}
                  className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200/50 flex items-center justify-center gap-2 cursor-pointer press">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Catat Penjualan</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== HISTORY SHEET ===== */}
      {sheet === 'history' && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden animate-fadeIn">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSheet(null)} />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl animate-slideFromBottom max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-2 pb-1"><div className="w-8 h-1 bg-stone-200 rounded-full" /></div>
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-800">Riwayat Hari Ini</h3>
              <button onClick={() => setSheet(null)} className="cursor-pointer"><X size={18} className="text-stone-400" /></button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-stone-50">
              {!riwayat.length ? <p className="text-center text-stone-300 py-10 text-sm">Belum ada</p> : (
                riwayat.map(t => (
                  <div key={t.id_transaksi} className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{t.menu_jualan?.nama_item}</p>
                      <p className="text-xs text-stone-400">{new Date(t.tanggal_jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {t.jumlah_beli} cup</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{rp(t.total_bayar)}</span>
                  </div>
                ))
              )}
            </div>
            {todayTotal > 0 && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-700">Total</span>
                <span className="text-lg font-bold text-emerald-700">{rp(todayTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PAGE CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4">

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer press ${
              filter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'
            }`}>Semua ({menu.length})</button>
          {cups.map(c => (
            <button key={c.id_cup} onClick={() => setFilter(c.id_cup)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer press ${
                filter === c.id_cup ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'
              }`}>{c.nama_cup} ({menu.filter(m => m.id_cup === c.id_cup).length})</button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr,340px] gap-5">

          {/* Menu Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 content-start">
            {filtered.map(item => {
              const q = cart[item.id_menu] || 0
              const hasR = item.keterangan?.trim()

              return (
                <div key={item.id_menu}
                  className={`card overflow-hidden ${q > 0 ? '!border-amber-300 shadow-lg shadow-amber-100/50' : ''}`}>
                  <div className="p-3 sm:p-4">
                    {/* Top */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.id_cup === 2 ? 'bg-violet-100 text-violet-600' : 'bg-sky-100 text-sky-600'
                      }`}>{item.id_cup === 2 ? 'JUMBO' : 'REG'}</span>
                      <div className="flex gap-1">
                        {hasR && <button onClick={() => setModal(item)} className="w-6 h-6 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center cursor-pointer"><FileText size={11} /></button>}
                        {q > 0 && <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">{q}</span>}
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold text-stone-800 text-xs sm:text-sm leading-tight line-clamp-2 cursor-pointer" onClick={() => setModal(item)}>{item.nama_item}</h3>
                    <p className="text-amber-600 font-bold text-[15px] sm:text-lg mt-1">{rp(item.harga_jual)}</p>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                      <button onClick={() => setQty(item.id_menu, -1)} disabled={!q}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center cursor-pointer press ${
                          q ? 'bg-red-100 text-red-500' : 'bg-stone-100 text-stone-300'
                        }`}><Minus size={14} /></button>
                      <span className="font-bold text-lg text-stone-800 w-8 text-center">{q}</span>
                      <button onClick={() => setQty(item.id_menu, 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center cursor-pointer press"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 sticky top-16 h-[calc(100vh-80px)]">

            {/* Cart */}
            <div className="card flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-stone-800 text-sm">Keranjang ({totalQty})</h3>
                {totalQty > 0 && <button onClick={() => setCart({})} className="text-xs text-red-400 cursor-pointer">Hapus</button>}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!totalQty ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-300">
                    <ShoppingBag size={28} />
                    <p className="text-xs mt-2">Kosong</p>
                  </div>
                ) : Object.entries(cart).map(([id, q]) => {
                  const m = menu.find(x => x.id_menu === +id)
                  if (!m) return null
                  return (
                    <div key={id} className="flex items-center gap-2 bg-stone-50 rounded-xl p-2.5 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800 truncate">{m.nama_item}</p>
                        <p className="text-[10px] text-stone-400">{q} × {rp(m.harga_jual)}</p>
                      </div>
                      <p className="text-xs font-bold text-amber-600">{rp(m.harga_jual * q)}</p>
                      <button onClick={() => setQty(m.id_menu, -q)} className="text-stone-300 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"><X size={12} /></button>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-stone-100 flex-shrink-0">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-stone-500">Total</span>
                  <span className="text-lg font-extrabold text-stone-800">{rp(totalPrice)}</span>
                </div>
                <button onClick={submit} disabled={loading || !totalQty}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer press text-sm ${
                    totalQty ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200/40' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  }`}>
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Catat</>}
                </button>
              </div>
            </div>

            {/* History */}
            <div className="card max-h-[280px] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5"><Clock size={14} className="text-stone-400" /> Riwayat</h3>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{riwayat.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
                {!riwayat.length ? <p className="text-center text-stone-300 text-xs py-6">Belum ada</p> : (
                  riwayat.slice(0, 8).map(t => (
                    <div key={t.id_transaksi} className="px-4 py-2.5 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-stone-700 truncate">{t.menu_jualan?.nama_item}</p>
                        <p className="text-[10px] text-stone-400">{new Date(t.tanggal_jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {t.jumlah_beli} cup</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{rp(t.total_bayar)}</span>
                    </div>
                  ))
                )}
              </div>
              {todayTotal > 0 && (
                <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex justify-between flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-700">Total</span>
                  <span className="text-sm font-bold text-emerald-700">{rp(todayTotal)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM ===== */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden safe-area-bottom">
        {totalQty > 0 && (
          <div className="mx-3 mb-1.5">
            <button onClick={() => setSheet('cart')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xl shadow-amber-500/30 cursor-pointer press">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><ShoppingBag size={16} /></div>
                <span className="text-sm font-semibold">{totalQty} item</span>
              </div>
              <span className="text-base font-bold">{rp(totalPrice)}</span>
            </button>
          </div>
        )}
        <div className="bg-white border-t border-stone-100 flex justify-around py-1.5 px-4">
          <button onClick={() => setSheet('history')} className="flex flex-col items-center gap-0.5 py-1 cursor-pointer">
            <Clock size={18} className="text-stone-400" />
            <span className="text-[10px] text-stone-500">Riwayat</span>
          </button>
          <button onClick={() => setSheet('cart')} className="flex flex-col items-center gap-0.5 py-1 cursor-pointer relative">
            <ShoppingBag size={18} className="text-amber-500" />
            {totalQty > 0 && <span className="absolute -top-0.5 right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">{totalQty}</span>}
            <span className="text-[10px] text-amber-600 font-semibold">Keranjang</span>
          </button>
          <button onClick={fetchRiwayat} className="flex flex-col items-center gap-0.5 py-1 cursor-pointer">
            <Coffee size={18} className="text-stone-400" />
            <span className="text-[10px] text-stone-500">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  )
}