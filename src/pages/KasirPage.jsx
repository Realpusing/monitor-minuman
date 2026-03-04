import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  ShoppingBag, Plus, Minus, Send, Clock, CheckCircle,
  Coffee, Trash2, Receipt, TrendingUp, FileText, X, Eye,
  ChevronUp
} from 'lucide-react'

export default function KasirPage() {
  const { user } = useAuth()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [resepModal, setResepModal] = useState(null)
  const [cups, setCups] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchMenu()
    fetchRiwayat()
    fetchCups()
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

  const fetchRiwayat = async () => {
    const { data } = await supabase
      .from('transaksi_penjualan')
      .select('*, menu_jualan(nama_item, harga_jual)')
      .eq('kasir_id', user.id)
      .gte('tanggal_jam', new Date().toISOString().split('T')[0])
      .order('tanggal_jam', { ascending: false })
      .limit(20)
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
    setSuccess('')

    try {
      const inserts = Object.entries(cart).map(([id_menu, jumlah]) => ({
        id_menu: parseInt(id_menu),
        jumlah_beli: jumlah,
        kasir_id: user.id
      }))

      const { error } = await supabase.from('transaksi_penjualan').insert(inserts)
      if (error) throw error

      setSuccess(`${totalItem} item berhasil dicatat!`)
      setCart({})
      setShowCart(false)
      fetchRiwayat()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      alert('Gagal: ' + err.message)
    }
    setLoading(false)
  }

  const formatRp = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(n)

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

  const todayTotal = riwayat.reduce((sum, r) => sum + (r.total_bayar || 0), 0)
  const todayItems = riwayat.reduce((sum, r) => sum + (r.jumlah_beli || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: totalItem > 0 ? '140px' : '80px' }}>
      <Navbar />

      {/* SUCCESS TOAST */}
      {success && (
        <div className="fixed top-20 left-1/2 z-50 w-11/12 max-w-sm" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-medium text-sm">
            <CheckCircle size={18} />
            {success}
          </div>
        </div>
      )}

      {/* RESEP MODAL */}
      {resepModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResepModal(null)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex-shrink-0">
              <button
                onClick={() => setResepModal(null)}
                className="absolute top-3 right-3 p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer"
              >
                <X size={18} />
              </button>
              <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-2 bg-white/25">
                {resepModal.inventory_cup?.nama_cup || (resepModal.id_cup === 1 ? 'Cup 16oz' : 'Cup 22oz')}
              </span>
              <h3 className="text-xl font-bold">{resepModal.nama_item}</h3>
              <p className="text-amber-100 text-lg font-semibold mt-1">{formatRp(resepModal.harga_jual)}</p>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {resepModal.keterangan && resepModal.keterangan.trim() !== '' ? (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <FileText size={16} className="text-amber-500" />
                    Resep / Cara Buat
                  </h4>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
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
                          ? 'bg-red-100 text-red-600'
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
                      className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center cursor-pointer"
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

      {/* CART BOTTOM SHEET */}
      {showCart && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                <ShoppingBag size={18} className="text-amber-500" />
                Keranjang ({totalItem})
              </h3>
              <div className="flex items-center gap-3">
                {totalItem > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-500 flex items-center gap-1 cursor-pointer">
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
                <button onClick={() => setShowCart(false)} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {totalItem === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingBag className="text-gray-300 mx-auto mb-2" size={28} />
                  <p className="text-gray-400 text-sm">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = menu.find(m => m.id_menu === parseInt(id))
                    if (!item) return null
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_item}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatRp(item.harga_jual)} / cup</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCart(item.id_menu, -1)} className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center cursor-pointer">
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-gray-800 w-5 text-center text-sm">{qty}</span>
                          <button onClick={() => updateCart(item.id_menu, 1)} className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center cursor-pointer">
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-amber-600 min-w-[60px] text-right">
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
                  <span className="text-gray-800 font-bold">Total</span>
                  <span className="text-xl font-bold text-gray-800">{formatRp(totalHarga)}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Send size={17} />}
                  {loading ? 'Memproses...' : 'Catat Penjualan'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY BOTTOM SHEET */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                <Clock size={18} className="text-gray-400" />
                Riwayat Hari Ini
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {riwayat.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">Belum ada transaksi hari ini</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {riwayat.map(trx => (
                    <div key={trx.id_transaksi} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">{trx.menu_jualan?.nama_item}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {new Date(trx.tanggal_jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-xs text-gray-400">{trx.jumlah_beli} cup</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 flex-shrink-0">+{formatRp(trx.total_bayar)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {riwayat.length > 0 && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700">Total Hari Ini</span>
                  <span className="text-lg font-bold text-emerald-700">{formatRp(todayTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-3 lg:pt-6">

        {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 lg:mb-6">
          {[
            { icon: Receipt, color: 'amber', label: 'Transaksi', value: riwayat.length, onClick: () => setShowHistory(true) },
            { icon: TrendingUp, color: 'emerald', label: 'Pendapatan', value: formatRp(todayTotal) },
            { icon: Coffee, color: 'blue', label: 'Cup Terjual', value: todayItems },
            { icon: ShoppingBag, color: 'purple', label: 'Di Keranjang', value: `${totalItem} item`, onClick: () => setShowCart(true) }
          ].map((stat, i) => (
            <div
              key={i}
              onClick={stat.onClick}
              className={`bg-white rounded-2xl p-3 border border-gray-100 ${stat.onClick ? 'cursor-pointer active:scale-[0.97]' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      stat.color === 'amber' ? '#fef3c7' :
                      stat.color === 'emerald' ? '#d1fae5' :
                      stat.color === 'blue' ? '#dbeafe' : '#f3e8ff'
                  }}
                >
                  <stat.icon size={15} style={{
                    color:
                      stat.color === 'amber' ? '#d97706' :
                      stat.color === 'emerald' ? '#059669' :
                      stat.color === 'blue' ? '#2563eb' : '#9333ea'
                  }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">{stat.label}</p>
                  <p className="text-sm font-bold text-gray-800 truncate leading-tight mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

          {/* MENU SECTION */}
          <div className="lg:col-span-2 space-y-3">

            {/* Category Filter - horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    activeCategory === cat.key
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Menu Grid - 2 columns always on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {filteredMenu.map(item => {
                const qty = cart[item.id_menu] || 0
                const isJumbo = item.id_cup === 2
                const hasResep = item.keterangan && item.keterangan.trim() !== ''

                return (
                  <div
                    key={item.id_menu}
                    className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                      qty > 0 ? 'border-amber-400 shadow-md shadow-amber-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-3">
                      {/* Top Row */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isJumbo ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isJumbo ? '22oz' : '16oz'}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasResep && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setResepModal(item) }}
                              className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center cursor-pointer"
                            >
                              <FileText size={10} />
                            </button>
                          )}
                          {qty > 0 && (
                            <span className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-bold">
                              {qty}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <h3
                        className="font-semibold text-gray-800 text-xs leading-snug mb-1 cursor-pointer line-clamp-2"
                        onClick={() => setResepModal(item)}
                      >
                        {item.nama_item}
                      </h3>

                      {/* Price */}
                      <p className="text-amber-600 font-bold text-sm mb-2">
                        {formatRp(item.harga_jual)}
                      </p>

                      {/* Qty Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button
                          onClick={() => updateCart(item.id_menu, -1)}
                          disabled={qty === 0}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer ${
                            qty > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-bold text-base text-gray-800 w-7 text-center">{qty}</span>
                        <button
                          onClick={() => updateCart(item.id_menu, 1)}
                          className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Lihat Resep */}
                    <button
                      onClick={() => setResepModal(item)}
                      className={`w-full py-1.5 text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer ${
                        hasResep
                          ? 'bg-amber-50 text-amber-600 border-t border-amber-100'
                          : 'bg-gray-50 text-gray-400 border-t border-gray-100'
                      }`}
                    >
                      <Eye size={10} />
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

          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:block space-y-4">
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
                  {loading ? 'Memproses...' : 'Catat Penjualan'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-gray-400" />
                  Transaksi Terakhir
                </h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{riwayat.length}</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {riwayat.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-400 text-sm">Belum ada transaksi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {riwayat.slice(0, 10).map(trx => (
                      <div key={trx.id_transaksi} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{trx.menu_jualan?.nama_item}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {new Date(trx.tanggal_jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="text-xs text-gray-400">{trx.jumlah_beli} cup</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 flex-shrink-0">+{formatRp(trx.total_bayar)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {riwayat.length > 0 && (
                <div className="p-4 bg-emerald-50 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700">Total Hari Ini</span>
                    <span className="text-lg font-bold text-emerald-700">{formatRp(todayTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        {totalItem > 0 && (
          <div className="mx-3 mb-2">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{totalItem} item dipilih</p>
                  <p className="text-xs text-amber-100">Tap untuk checkout</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold">{formatRp(totalHarga)}</p>
                <ChevronUp size={13} className="ml-auto text-amber-200" />
              </div>
            </button>
          </div>
        )}

        <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-around safe-area-bottom">
          <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-0.5 py-1 cursor-pointer">
            <Clock size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Riwayat</span>
          </button>
          <button onClick={() => setShowCart(true)} className="relative flex flex-col items-center gap-0.5 py-1 cursor-pointer">
            <div className="relative">
              <ShoppingBag size={20} className="text-amber-500" />
              {totalItem > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {totalItem > 9 ? '9+' : totalItem}
                </span>
              )}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">Keranjang</span>
          </button>
          <button onClick={fetchRiwayat} className="flex flex-col items-center gap-0.5 py-1 cursor-pointer">
            <Receipt size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  )
}