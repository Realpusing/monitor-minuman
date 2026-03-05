import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  ShoppingBag, Plus, Minus, Send, Clock, CheckCircle,
  Coffee, Trash2, Receipt, TrendingUp, FileText, X, Eye,
  ChevronUp, Calendar, AlertTriangle, RefreshCw
} from 'lucide-react'

export default function SimpanDataTab({ msg }) {
  const { user } = useAuth()
  const dateInputRef = useRef(null)
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [resepModal, setResepModal] = useState(null)
  const [cups, setCups] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchMenu()
    fetchCups()
  }, [])

  useEffect(() => {
    fetchRiwayat()
  }, [tanggal])

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

  const fetchRiwayat = async () => {
    const startOfDay = `${tanggal}T00:00:00`
    const endOfDay = `${tanggal}T23:59:59`

    const { data } = await supabase
      .from('transaksi_penjualan')
      .select('*, menu_jualan(nama_item, harga_jual)')
      .gte('tanggal_jam', startOfDay)
      .lte('tanggal_jam', endOfDay)
      .order('tanggal_jam', { ascending: false })
      .limit(50)
    setRiwayat(data || [])
  }

  const updateCart = (id_menu, delta) => {
    setCart(prev => {
      const current = prev[id_menu] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [id_menu]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id_menu]: next }
    })
  }

  const clearCart = () => setCart({})

  const totalItem = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalHarga = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id_menu === parseInt(id))
    return sum + (item?.harga_jual || 0) * qty
  }, 0)

  const handleSubmit = async () => {
    if (totalItem === 0) return
    setLoading(true)

    try {
      const now = new Date()
      const customDate = new Date(tanggal)
      customDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())

      const inserts = Object.entries(cart).map(([id_menu, jumlah]) => ({
        id_menu: parseInt(id_menu),
        jumlah_beli: jumlah,
        kasir_id: user.id,
        tanggal_jam: customDate.toISOString()
      }))

      const { error } = await supabase.from('transaksi_penjualan').insert(inserts)
      if (error) throw error

      msg(`${totalItem} item dicatat untuk ${formatTanggal(tanggal)}!`)
      setCart({})
      setShowCart(false)
      fetchRiwayat()
    } catch (err) {
      msg('Gagal: ' + err.message, false)
    }
    setLoading(false)
  }

  const handleDeleteTransaksi = async (id) => {
    const { error } = await supabase
      .from('transaksi_penjualan')
      .delete()
      .eq('id_transaksi', id)

    if (error) {
      msg(error.message, false)
    } else {
      msg('Transaksi dihapus!')
      fetchRiwayat()
    }
  }

  // ===== Buka date picker secara programmatik =====
  const openDatePicker = () => {
    if (dateInputRef.current) {
      // Coba showPicker() dulu (modern browsers)
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker()
      } else {
        // Fallback: focus + click
        dateInputRef.current.focus()
        dateInputRef.current.click()
      }
    }
  }

  const formatRp = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(n)

  const formatTanggal = (d) =>
    new Date(d).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

  const formatTanggalShort = (d) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

  const isToday = tanggal === new Date().toISOString().split('T')[0]

  const categories = [
    { key: 'all', label: 'Semua', count: menu.length },
    ...cups.map(c => ({
      key: c.id_cup,
      label: c.nama_cup.replace('Cup ', '').replace(' (Regular)', '').replace(' (Jumbo)', ''),
      count: menu.filter(m => m.id_cup === c.id_cup).length
    }))
  ]

  const filteredMenu = activeCategory === 'all'
    ? menu
    : menu.filter(m => m.id_cup === activeCategory)

  const dayTotal = riwayat.reduce((sum, r) => sum + (r.total_bayar || 0), 0)
  const dayItems = riwayat.reduce((sum, r) => sum + (r.jumlah_beli || 0), 0)

  return (
    <div className="pb-24 lg:pb-6 animate-slideUp">

      {/* ==================== RESEP MODAL ==================== */}
      {resepModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResepModal(null)} />

          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slideUp overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 sm:p-6 text-white flex-shrink-0">
              <button
                onClick={() => setResepModal(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer"
              >
                <X size={18} />
              </button>

              <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-2 bg-white/25">
                {resepModal.inventory_cup?.nama_cup || (resepModal.id_cup === 1 ? 'Cup 16oz' : 'Cup 22oz')}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">{resepModal.nama_item}</h3>
              <p className="text-amber-100 text-lg font-semibold mt-1">{formatRp(resepModal.harga_jual)}</p>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {resepModal.keterangan && resepModal.keterangan.trim() !== '' ? (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <FileText size={18} className="text-amber-500" />
                    Resep / Cara Buat
                  </h4>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 sm:p-5">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                      {resepModal.keterangan}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="text-gray-300" size={24} />
                  </div>
                  <p className="text-gray-400 text-sm">Belum ada resep untuk menu ini</p>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Tambah ke keranjang</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateCart(resepModal.id_menu, -1)}
                      disabled={(cart[resepModal.id_menu] || 0) === 0}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer ${
                        (cart[resepModal.id_menu] || 0) > 0
                          ? 'bg-red-100 text-red-600 active:bg-red-200'
                          : 'bg-gray-100 text-gray-300'
                      }`}
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold text-gray-800 w-10 text-center">
                      {cart[resepModal.id_menu] || 0}
                    </span>
                    <button
                      onClick={() => updateCart(resepModal.id_menu, 1)}
                      className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 active:bg-emerald-200 flex items-center justify-center cursor-pointer"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CART BOTTOM SHEET (MOBILE) ==================== */}
      {showCart && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />

          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl animate-slideUp max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <ShoppingBag size={20} className="text-amber-500" />
                Keranjang ({totalItem})
              </h3>
              <div className="flex items-center gap-3">
                {totalItem > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-500 flex items-center gap-1 cursor-pointer">
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <Calendar size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                Data untuk: {formatTanggalShort(tanggal)}
              </span>
              {!isToday && (
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                  Backdate
                </span>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {totalItem === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="text-gray-300" size={24} />
                  </div>
                  <p className="text-gray-400 text-sm">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = menu.find(m => m.id_menu === parseInt(id))
                    if (!item) return null
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_item}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatRp(item.harga_jual)} / cup</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCart(item.id_menu, -1)}
                            className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center active:bg-red-200 cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-gray-800 w-6 text-center text-sm">{qty}</span>
                          <button
                            onClick={() => updateCart(item.id_menu, 1)}
                            className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center active:bg-emerald-200 cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-amber-600 min-w-[70px] text-right">
                          {formatRp(item.harga_jual * qty)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {totalItem > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-800 font-bold text-lg">Total</span>
                  <span className="text-2xl font-bold text-gray-800">{formatRp(totalHarga)}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Simpan ke {formatTanggalShort(tanggal)}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== HISTORY BOTTOM SHEET (MOBILE) ==================== */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />

          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl animate-slideUp max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <Clock size={20} className="text-gray-400" />
                Riwayat {formatTanggalShort(tanggal)}
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {riwayat.length === 0 ? (
                <div className="py-8 text-center">
                  <Receipt size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Belum ada data di tanggal ini</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {riwayat.map(trx => (
                    <div key={trx.id_transaksi} className="px-5 py-3 group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{trx.menu_jualan?.nama_item}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {new Date(trx.tanggal_jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-xs text-gray-400">{trx.jumlah_beli} cup</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600">+{formatRp(trx.total_bayar)}</span>
                          <button
                            onClick={() => {
                              if (confirm('Hapus transaksi ini?')) handleDeleteTransaksi(trx.id_transaksi)
                            }}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {riwayat.length > 0 && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700">Total {formatTanggalShort(tanggal)}</span>
                  <span className="text-lg font-bold text-emerald-700">{formatRp(dayTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TANGGAL PICKER (FIXED) ==================== */}
      {/* ==================== TANGGAL PICKER (FIXED - SIMPLE) ==================== */}
        <div className={`rounded-2xl p-4 mb-4 border-2 ${
        isToday ? 'bg-white border-gray-100' : 'bg-amber-50 border-amber-200'
        }`}>
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                isToday
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
            }`}>
                <span className="text-lg font-extrabold leading-none">
                {new Date(tanggal).getDate()}
                </span>
                <span className="text-[8px] font-medium uppercase">
                {new Date(tanggal).toLocaleDateString('id-ID', { month: 'short' })}
                </span>
            </div>
            <div>
                <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800 text-sm">
                    {new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long' })}
                </p>
                {isToday ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                    Hari Ini
                    </span>
                ) : (
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    Backdate
                    </span>
                )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                {formatTanggalShort(tanggal)}
                </p>
            </div>
            </div>

            {/* ===== INPUT DATE LANGSUNG (PASTI BISA DIKLIK) ===== */}
            <input
            type="date"
            value={tanggal}
            onChange={(e) => {
                if (e.target.value) setTanggal(e.target.value)
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border-none outline-none flex-shrink-0 w-[130px] sm:w-[160px]"
            />
        </div>

        {!isToday && (
            <div className="mt-3 flex items-center gap-2 bg-amber-100 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">
                Data akan disimpan ke tanggal {formatTanggalShort(tanggal)}, bukan hari ini
            </p>
            </div>
        )}
        </div>

      {/* ==================== STATS ==================== */}
      <div className="flex gap-3 overflow-x-auto pb-3 mb-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 lg:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
          { icon: Receipt, color: 'amber', label: 'Transaksi', value: riwayat.length, action: () => setShowHistory(true) },
          { icon: TrendingUp, color: 'emerald', label: 'Pendapatan', value: formatRp(dayTotal) },
          { icon: Coffee, color: 'blue', label: 'Cup Terjual', value: dayItems },
          { icon: ShoppingBag, color: 'purple', label: 'Keranjang', value: `${totalItem} item`, action: () => setShowCart(true) }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={stat.action}
            className={`bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 flex-shrink-0 w-[140px] sm:w-auto lg:w-auto ${
              stat.action ? 'cursor-pointer active:scale-[0.98]' : ''
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: stat.color === 'amber' ? '#fef3c7' :
                    stat.color === 'emerald' ? '#d1fae5' :
                    stat.color === 'blue' ? '#dbeafe' : '#f3e8ff'
                }}
              >
                <stat.icon size={18} style={{
                  color: stat.color === 'amber' ? '#d97706' :
                    stat.color === 'emerald' ? '#059669' :
                    stat.color === 'blue' ? '#2563eb' : '#9333ea'
                }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{stat.label}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-800 truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== MAIN GRID ==================== */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

        {/* ===== MENU SECTION ===== */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">

          <div className="flex items-center gap-3 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95 ${
                  activeCategory === cat.key
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {filteredMenu.map(item => {
              const qty = cart[item.id_menu] || 0
              const isJumbo = item.id_cup === 2
              const hasResep = item.keterangan && item.keterangan.trim() !== ''

              return (
                <div
                  key={item.id_menu}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                    qty > 0
                      ? 'border-amber-400 shadow-lg shadow-amber-100'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold ${
                        isJumbo ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {isJumbo ? '22oz' : '16oz'}
                      </span>

                      <div className="flex items-center gap-1">
                        {hasResep && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setResepModal(item) }}
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center active:bg-amber-200 cursor-pointer"
                          >
                            <FileText size={11} />
                          </button>
                        )}
                        {qty > 0 && (
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold">
                            {qty}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3
                      className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight mb-0.5 sm:mb-1 cursor-pointer active:text-amber-600 line-clamp-2"
                      onClick={() => setResepModal(item)}
                    >
                      {item.nama_item}
                    </h3>

                    <p className="text-amber-600 font-bold text-base sm:text-lg">
                      {formatRp(item.harga_jual)}
                    </p>

                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                      <button
                        onClick={() => updateCart(item.id_menu, -1)}
                        disabled={qty === 0}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center cursor-pointer active:scale-90 ${
                          qty > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-lg sm:text-xl text-gray-800 w-8 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateCart(item.id_menu, 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-600 active:bg-emerald-200 flex items-center justify-center cursor-pointer active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setResepModal(item)}
                    className={`w-full py-2 text-[10px] sm:text-xs font-medium flex items-center justify-center gap-1 cursor-pointer ${
                      hasResep
                        ? 'bg-amber-50 text-amber-600 active:bg-amber-100 border-t border-amber-100'
                        : 'bg-gray-50 text-gray-400 active:bg-gray-100 border-t border-gray-100'
                    }`}
                  >
                    <Eye size={11} />
                    {hasResep ? 'Lihat Resep' : 'Detail'}
                  </button>
                </div>
              )
            })}
          </div>

          {filteredMenu.length === 0 && (
            <div className="text-center py-12">
              <Coffee className="text-gray-300 mx-auto mb-2" size={32} />
              <p className="text-gray-400 text-sm">Tidak ada menu</p>
            </div>
          )}
        </div>

        {/* ===== DESKTOP SIDEBAR ===== */}
        <div className="hidden lg:block space-y-4">

          {/* Desktop Cart */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-20">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag size={18} className="text-amber-500" />
                Keranjang
              </h3>
              {totalItem > 0 && (
                <button onClick={clearCart} className="text-xs text-red-500 flex items-center gap-1 cursor-pointer">
                  <Trash2 size={12} /> Hapus
                </button>
              )}
            </div>

            <div className={`px-4 py-2 flex items-center gap-2 ${
              isToday ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-amber-50 border-b border-amber-100'
            }`}>
              <Calendar size={13} className={isToday ? 'text-emerald-600' : 'text-amber-600'} />
              <span className={`text-xs font-semibold ${isToday ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatTanggalShort(tanggal)}
              </span>
              {!isToday && (
                <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                  Backdate
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {totalItem === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingBag className="text-gray-300 mx-auto mb-2" size={32} />
                  <p className="text-gray-400 text-sm">Keranjang kosong</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = menu.find(m => m.id_menu === parseInt(id))
                    if (!item) return null
                    return (
                      <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_item}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{qty} × {formatRp(item.harga_jual)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <p className="text-sm font-bold text-amber-600">{formatRp(item.harga_jual * qty)}</p>
                          <button onClick={() => updateCart(item.id_menu, -qty)}
                            className="p-1 text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-800 font-bold">Total</span>
                <span className="text-2xl font-bold text-gray-800">{formatRp(totalHarga)}</span>
              </div>
              <button onClick={handleSubmit} disabled={loading || totalItem === 0}
                className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  totalItem > 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                {loading ? 'Menyimpan...' : `Simpan ke ${formatTanggalShort(tanggal)}`}
              </button>
            </div>
          </div>

          {/* Desktop History */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Data {formatTanggalShort(tanggal)}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{riwayat.length}</span>
                <button onClick={fetchRiwayat} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <RefreshCw size={13} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {riwayat.length === 0 ? (
                <div className="p-6 text-center">
                  <Receipt size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Belum ada data</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {riwayat.map(trx => (
                    <div key={trx.id_transaksi} className="px-4 py-3 hover:bg-gray-50 group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{trx.menu_jualan?.nama_item}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {new Date(trx.tanggal_jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-xs text-gray-400">{trx.jumlah_beli} cup</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600">+{formatRp(trx.total_bayar)}</span>
                          <button
                            onClick={() => {
                              if (confirm('Hapus transaksi ini?')) handleDeleteTransaksi(trx.id_transaksi)
                            }}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {riwayat.length > 0 && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700">Total</span>
                  <span className="text-lg font-bold text-emerald-700">{formatRp(dayTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MOBILE FLOATING BAR ==================== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        {totalItem > 0 && (
          <div className="mx-3 mb-2">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-amber-200/50 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{totalItem} item</p>
                  <p className="text-xs text-amber-100">→ {formatTanggalShort(tanggal)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatRp(totalHarga)}</p>
                <ChevronUp size={14} className="ml-auto text-amber-200" />
              </div>
            </button>
          </div>
        )}

        <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-around">
          <button
            onClick={() => setShowHistory(true)}
            className="flex flex-col items-center gap-0.5 py-1 cursor-pointer"
          >
            <Clock size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Riwayat</span>
          </button>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex flex-col items-center gap-0.5 py-1 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag size={20} className="text-amber-500" />
              {totalItem > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {totalItem}
                </span>
              )}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">Keranjang</span>
          </button>

          <button
            className="flex flex-col items-center gap-0.5 py-1 cursor-pointer"
            onClick={fetchRiwayat}
          >
            <RefreshCw size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  )
}