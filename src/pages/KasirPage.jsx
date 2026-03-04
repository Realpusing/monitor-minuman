import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  ShoppingBag, Plus, Minus, Send, Clock, CheckCircle,
  Coffee, Trash2, Receipt, TrendingUp, FileText, X, Eye
} from 'lucide-react'

export default function KasirPage() {
  const { user } = useAuth()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [resepModal, setResepModal] = useState(null) // item yang resepnya ditampilkan
  const [cups, setCups] = useState([])

  useEffect(() => {
    fetchMenu()
    fetchRiwayat()
    fetchCups()
  }, [])

  const fetchCups = async () => {
    const { data } = await supabase
      .from('inventory_cup')
      .select('*')
      .order('id_cup')
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

      const { error } = await supabase
        .from('transaksi_penjualan')
        .insert(inserts)

      if (error) throw error

      setSuccess(`${totalItem} item berhasil dicatat!`)
      setCart({})
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Success Toast */}
      {success && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-200 flex items-center gap-2 font-medium">
            <CheckCircle size={18} />
            {success}
          </div>
        </div>
      )}

      {/* ==================== RESEP MODAL ==================== */}
      {resepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setResepModal(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <button
                onClick={() => setResepModal(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer transition-all"
              >
                <X size={18} />
              </button>

              <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-3 ${
                resepModal.id_cup === 1
                  ? 'bg-white/30 text-white'
                  : 'bg-white/30 text-white'
              }`}>
                {resepModal.inventory_cup?.nama_cup || (resepModal.id_cup === 1 ? 'Cup 16oz' : 'Cup 22oz')}
              </span>

              <h3 className="text-2xl font-bold">{resepModal.nama_item}</h3>
              <p className="text-amber-100 text-lg font-semibold mt-1">
                {formatRp(resepModal.harga_jual)}
              </p>
            </div>

            {/* Body - Resep */}
            <div className="p-6">
              {resepModal.keterangan && resepModal.keterangan.trim() !== '' ? (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-amber-500" />
                    Resep / Cara Buat
                  </h4>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
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

              {/* Quick Add to Cart */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Tambah ke keranjang</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateCart(resepModal.id_menu, -1)}
                      disabled={(cart[resepModal.id_menu] || 0) === 0}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer btn-press ${
                        (cart[resepModal.id_menu] || 0) > 0
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-2xl font-bold text-gray-800 w-10 text-center">
                      {cart[resepModal.id_menu] || 0}
                    </span>
                    <button
                      onClick={() => updateCart(resepModal.id_menu, 1)}
                      className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center cursor-pointer btn-press"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Receipt className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Transaksi Hari Ini</p>
                <p className="text-lg font-bold text-gray-800">{riwayat.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Pendapatan</p>
                <p className="text-lg font-bold text-gray-800">{formatRp(todayTotal)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Coffee className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Cup Terjual</p>
                <p className="text-lg font-bold text-gray-800">{todayItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Di Keranjang</p>
                <p className="text-lg font-bold text-gray-800">{totalItem} item</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ==================== MENU SECTION ==================== */}
          <div className="lg:col-span-2 space-y-4">

            {/* Category Filter */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Menu</h2>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory === cat.key
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredMenu.map(item => {
                const qty = cart[item.id_menu] || 0
                const isJumbo = item.id_cup === 2
                const hasResep = item.keterangan && item.keterangan.trim() !== ''

                return (
                  <div
                    key={item.id_menu}
                    className={`bg-white rounded-2xl border-2 transition-all card-hover overflow-hidden ${
                      qty > 0
                        ? 'border-amber-400 shadow-lg shadow-amber-100'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Card Body */}
                    <div className="p-4">
                      {/* Top Row: Badge + Qty + Resep */}
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isJumbo
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isJumbo ? '22oz' : '16oz'}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Resep Button */}
                          {hasResep && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setResepModal(item)
                              }}
                              className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-200 cursor-pointer transition-all"
                              title="Lihat Resep"
                            >
                              <FileText size={13} />
                            </button>
                          )}

                          {/* Qty Badge */}
                          {qty > 0 && (
                            <span className="w-7 h-7 bg-amber-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                              {qty}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <h3
                        className="font-semibold text-gray-800 text-sm leading-tight mb-1 cursor-pointer hover:text-amber-600 transition-colors"
                        onClick={() => setResepModal(item)}
                      >
                        {item.nama_item}
                      </h3>

                      {/* Resep Preview (1 line) */}
                      {hasResep && (
                        <p
                          className="text-xs text-gray-400 truncate mb-1 cursor-pointer hover:text-amber-500"
                          onClick={() => setResepModal(item)}
                        >
                          📝 {item.keterangan}
                        </p>
                      )}

                      {/* Price */}
                      <p className="text-amber-600 font-bold text-lg">
                        {formatRp(item.harga_jual)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => updateCart(item.id_menu, -1)}
                          disabled={qty === 0}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer btn-press ${
                            qty > 0
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <Minus size={16} />
                        </button>

                        <span className="font-bold text-xl text-gray-800 w-10 text-center">
                          {qty}
                        </span>

                        <button
                          onClick={() => updateCart(item.id_menu, 1)}
                          className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all cursor-pointer btn-press"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom: Lihat Resep Full Button */}
                    <button
                      onClick={() => setResepModal(item)}
                      className={`w-full py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        hasResep
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-t border-amber-100'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border-t border-gray-100'
                      }`}
                    >
                      <Eye size={13} />
                      {hasResep ? 'Lihat Resep' : 'Detail'}
                    </button>
                  </div>
                )
              })}
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coffee className="text-gray-300" size={24} />
                </div>
                <p className="text-gray-400">Tidak ada menu di kategori ini</p>
              </div>
            )}
          </div>

          {/* ==================== SIDEBAR ==================== */}
          <div className="space-y-4">

            {/* Cart */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-20">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-amber-500" />
                  Keranjang
                </h3>
                {totalItem > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Hapus Semua
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto">
                {totalItem === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="text-gray-300" size={24} />
                    </div>
                    <p className="text-gray-400 text-sm">Keranjang kosong</p>
                    <p className="text-gray-300 text-xs mt-1">Pilih menu untuk mulai</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = menu.find(m => m.id_menu === parseInt(id))
                      if (!item) return null
                      return (
                        <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {item.nama_item}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {qty} × {formatRp(item.harga_jual)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <p className="text-sm font-bold text-amber-600">
                              {formatRp(item.harga_jual * qty)}
                            </p>
                            {/* Remove item */}
                            <button
                              onClick={() => updateCart(item.id_menu, -qty)}
                              className="p-1 text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                              title="Hapus item"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Checkout */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Subtotal ({totalItem} item)</span>
                  <span className="text-sm text-gray-500">{formatRp(totalHarga)}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-800 font-bold text-lg">Total</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {formatRp(totalHarga)}
                  </span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading || totalItem === 0}
                  className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer btn-press ${
                    totalItem > 0
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Catat Penjualan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-gray-400" />
                  Transaksi Terakhir
                </h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                  {riwayat.length} transaksi
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {riwayat.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="text-gray-300" size={20} />
                    </div>
                    <p className="text-gray-400 text-sm">Belum ada transaksi hari ini</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {riwayat.slice(0, 15).map(trx => (
                      <div key={trx.id_transaksi} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {trx.menu_jualan?.nama_item}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {new Date(trx.tanggal_jam).toLocaleTimeString('id-ID', {
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="text-xs text-gray-400">
                                {trx.jumlah_beli} cup
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600 ml-2">
                            +{formatRp(trx.total_bayar)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Hari Ini */}
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
    </div>
  )
}