import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  RefreshCw, TrendingUp, Trash2, Pencil, X, Send,
  Calendar, Coffee, DollarSign, Receipt, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp, Search, Filter
} from 'lucide-react'
import { rp } from '../../utils/helpers'

export default function RingkasanTab() {
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(false)
  const [menu, setMenu] = useState([])

  // Filter
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterMenu, setFilterMenu] = useState('all')

  // Edit
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({ jumlah_beli: '', tanggal_jam: '' })

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Detail mobile
  const [detailItem, setDetailItem] = useState(null)

  useEffect(() => {
    fetchTransaksi()
    fetchMenu()
  }, [])

  useEffect(() => {
    fetchTransaksi()
  }, [filterTanggal, filterMenu])

  // ==================== FETCH ====================
  const fetchTransaksi = async () => {
    setLoading(true)

    let query = supabase
      .from('transaksi_penjualan')
      .select('*, menu_jualan(nama_item, harga_jual, id_cup, inventory_cup(nama_cup))')
      .order('tanggal_jam', { ascending: false })
      .limit(200)

    if (filterTanggal) {
      query = query
        .gte('tanggal_jam', `${filterTanggal}T00:00:00`)
        .lte('tanggal_jam', `${filterTanggal}T23:59:59`)
    }

    if (filterMenu !== 'all') {
      query = query.eq('id_menu', parseInt(filterMenu))
    }

    const { data, error } = await query
    if (error) console.error(error)
    else setTransaksi(data || [])
    setLoading(false)
  }

  const fetchMenu = async () => {
    const { data } = await supabase
      .from('menu_jualan')
      .select('id_menu, nama_item')
      .order('nama_item')
    setMenu(data || [])
  }

  // ==================== DELETE ====================
  const handleDelete = async (id) => {
    setLoading(true)
    const { error } = await supabase
      .from('transaksi_penjualan')
      .delete()
      .eq('id_transaksi', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      setConfirmDelete(null)
      setDetailItem(null)
      fetchTransaksi()
    }
    setLoading(false)
  }

  // ==================== EDIT ====================
  const startEdit = (item) => {
    const dateObj = new Date(item.tanggal_jam)
    const localDate = dateObj.toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm

    setEditItem(item)
    setEditForm({
      jumlah_beli: item.jumlah_beli.toString(),
      tanggal_jam: localDate
    })
    setDetailItem(null)
  }

  const handleEdit = async () => {
    if (!editForm.jumlah_beli || parseInt(editForm.jumlah_beli) <= 0) {
      alert('Jumlah harus lebih dari 0')
      return
    }

    setLoading(true)

    const hargaSatuan = editItem.menu_jualan?.harga_jual || 0
    const jumlahBaru = parseInt(editForm.jumlah_beli)
    const totalBaru = jumlahBaru * hargaSatuan

    const { error } = await supabase
      .from('transaksi_penjualan')
      .update({
        jumlah_beli: jumlahBaru,
        total_bayar: totalBaru,
        tanggal_jam: new Date(editForm.tanggal_jam).toISOString()
      })
      .eq('id_transaksi', editItem.id_transaksi)

    if (error) {
      alert('Gagal update: ' + error.message)
    } else {
      setEditItem(null)
      fetchTransaksi()
    }
    setLoading(false)
  }

  // ==================== HELPERS ====================
  const formatWaktu = (d) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const formatTgl = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatTglFull = (d) =>
    new Date(d).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

  // ==================== COMPUTED ====================
  const totalPendapatan = transaksi.reduce((a, r) => a + (parseFloat(r.total_bayar) || 0), 0)
  const totalCup = transaksi.reduce((a, r) => a + (r.jumlah_beli || 0), 0)

  // Group by date
  const grouped = transaksi.reduce((acc, trx) => {
    const date = new Date(trx.tanggal_jam).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(trx)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // ==================== RENDER ====================
  return (
    <div className="space-y-4 animate-slideUp pb-6">

      {/* ==================== EDIT MODAL ==================== */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditItem(null)} />

          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slideUp overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 text-white flex-shrink-0">
              <button
                onClick={() => setEditItem(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/20 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <Pencil size={18} />
                <h3 className="text-lg font-bold">Edit Transaksi</h3>
              </div>
              <p className="text-blue-100 text-sm">{editItem.menu_jualan?.nama_item}</p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Jumlah */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Jumlah Beli (cup)
                </label>
                <input
                  type="number"
                  value={editForm.jumlah_beli}
                  onChange={(e) => setEditForm(p => ({ ...p, jumlah_beli: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none text-sm"
                  min="1"
                />
              </div>

              {/* Tanggal & Waktu */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                  Tanggal & Waktu
                </label>
                <input
                  type="datetime-local"
                  value={editForm.tanggal_jam}
                  onChange={(e) => setEditForm(p => ({ ...p, tanggal_jam: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none text-sm"
                />
              </div>

              {/* Preview Total */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-500 font-medium mb-1">Preview Total</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {editForm.jumlah_beli || 0} × {rp(editItem.menu_jualan?.harga_jual || 0)}
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    {rp((parseInt(editForm.jumlah_beli) || 0) * (editItem.menu_jualan?.harga_jual || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex gap-2">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle size={16} /> Simpan Perubahan</>
                )}
              </button>
              <button
                onClick={() => setEditItem(null)}
                className="px-5 py-3.5 rounded-xl font-semibold bg-gray-200 text-gray-600 cursor-pointer active:scale-[0.98]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MOBILE MODAL ==================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDetailItem(null); setConfirmDelete(null) }} />

          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slideUp overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white flex-shrink-0">
              <button
                onClick={() => { setDetailItem(null); setConfirmDelete(null) }}
                className="absolute top-3 right-3 p-2 bg-white/20 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
              <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-2 bg-white/25">
                {detailItem.menu_jualan?.inventory_cup?.nama_cup || 'Cup'}
              </span>
              <h3 className="text-xl font-bold">{detailItem.menu_jualan?.nama_item}</h3>
              <p className="text-emerald-100 text-sm mt-1">{formatTglFull(detailItem.tanggal_jam)}</p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">Jumlah</p>
                  <p className="text-2xl font-bold text-gray-800">{detailItem.jumlah_beli}</p>
                  <p className="text-[10px] text-gray-400">cup</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">Harga</p>
                  <p className="text-sm font-bold text-gray-800">{rp(detailItem.menu_jualan?.harga_jual || 0)}</p>
                  <p className="text-[10px] text-gray-400">/cup</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-emerald-500 font-medium">Total</p>
                  <p className="text-sm font-bold text-emerald-600">{rp(detailItem.total_bayar)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Waktu</span>
                  <span className="font-semibold text-gray-800">{formatWaktu(detailItem.tanggal_jam)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">ID Transaksi</span>
                  <span className="font-mono text-xs text-gray-400">#{detailItem.id_transaksi}</span>
                </div>
              </div>

              {/* Confirm Delete */}
              {confirmDelete === detailItem.id_transaksi ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slideUp">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-700 text-sm">Hapus transaksi ini?</p>
                      <p className="text-xs text-red-500 mt-1">Data akan dihapus permanen.</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleDelete(detailItem.id_transaksi)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          {loading ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-4 py-2 bg-white text-gray-600 text-xs font-medium rounded-lg cursor-pointer border border-gray-200"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex gap-2">
              <button
                onClick={() => startEdit(detailItem)}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-blue-500 text-white cursor-pointer active:scale-[0.98]"
              >
                <Pencil size={16} /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(detailItem.id_transaksi)}
                className="py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-red-100 text-red-600 cursor-pointer active:scale-[0.98]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== HEADER ==================== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-800">Laporan Penjualan</h2>
          <p className="text-xs text-stone-400 mt-0.5">Kelola & pantau semua transaksi</p>
        </div>
        <button
          onClick={fetchTransaksi}
          disabled={loading}
          className="p-2.5 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer press shadow-sm"
        >
          <RefreshCw size={15} className={`text-stone-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ==================== SUMMARY CARDS ==================== */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Transaksi', v: transaksi.length, from: '#f43f5e', to: '#ec4899', i: Receipt },
          { l: 'Cup Terjual', v: totalCup, from: '#f59e0b', to: '#ea580c', i: Coffee },
          { l: 'Pendapatan', v: rp(totalPendapatan), from: '#10b981', to: '#14b8a6', i: DollarSign },
        ].map((s, i) => (
          <div
            key={i}
            className="relative rounded-2xl p-4 text-white overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
          >
            <s.i size={40} className="absolute -top-1 -right-1 text-white/10" />
            <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{s.l}</p>
            <p className="text-lg sm:text-2xl font-black mt-0.5">{s.v}</p>
          </div>
        ))}
      </div>

      {/* ==================== FILTERS ==================== */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-stone-400" />
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Filter</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Tanggal */}
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">
              Tanggal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 text-sm outline-none focus:border-amber-400"
              />
              {filterTanggal && (
                <button
                  onClick={() => setFilterTanggal('')}
                  className="p-2 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  <X size={14} className="text-stone-500" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Menu */}
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">
              Menu
            </label>
            <select
              value={filterMenu}
              onChange={(e) => setFilterMenu(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 text-sm outline-none focus:border-amber-400"
            >
              <option value="all">Semua Menu</option>
              {menu.map(m => (
                <option key={m.id_menu} value={m.id_menu}>{m.nama_item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter indicator */}
        {(filterTanggal || filterMenu !== 'all') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100">
            <span className="text-[10px] text-stone-400">Filter aktif:</span>
            {filterTanggal && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                📅 {formatTgl(filterTanggal)}
                <button onClick={() => setFilterTanggal('')} className="cursor-pointer">
                  <X size={10} />
                </button>
              </span>
            )}
            {filterMenu !== 'all' && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                ☕ {menu.find(m => m.id_menu === parseInt(filterMenu))?.nama_item || filterMenu}
                <button onClick={() => setFilterMenu('all')} className="cursor-pointer">
                  <X size={10} />
                </button>
              </span>
            )}
            <button
              onClick={() => { setFilterTanggal(''); setFilterMenu('all') }}
              className="text-[10px] text-red-500 font-medium cursor-pointer ml-auto"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* ==================== DATA LIST ==================== */}
      {loading && transaksi.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Memuat data...</p>
        </div>
      ) : transaksi.length === 0 ? (
        <div className="card p-12 text-center">
          <TrendingUp size={36} className="text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">Belum ada transaksi</p>
          <p className="text-stone-300 text-xs mt-1">
            {filterTanggal || filterMenu !== 'all'
              ? 'Coba ubah filter atau reset'
              : 'Data muncul setelah ada penjualan'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const items = grouped[date]
            const dateTotal = items.reduce((a, t) => a + (parseFloat(t.total_bayar) || 0), 0)
            const dateCup = items.reduce((a, t) => a + (t.jumlah_beli || 0), 0)
            const dateObj = new Date(date)

            return (
              <div key={date} className="card overflow-hidden">
                {/* Date Header */}
                <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-4 py-3 flex items-center justify-between border-b border-stone-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                      <span className="text-sm font-extrabold leading-none">{dateObj.getDate()}</span>
                      <span className="text-[7px] font-medium uppercase">
                        {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        {dateObj.toLocaleDateString('id-ID', { weekday: 'long' })}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {items.length} transaksi · {dateCup} cup
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{rp(dateTotal)}</p>
                  </div>
                </div>

                {/* Transactions */}
                <div className="divide-y divide-stone-50">
                  {items.map(trx => (
                    <div
                      key={trx.id_transaksi}
                      className="px-4 py-3 hover:bg-stone-50 transition-colors group cursor-pointer lg:cursor-default"
                      onClick={() => {
                        if (window.innerWidth < 1024) setDetailItem(trx)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Cup Badge */}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            trx.menu_jualan?.id_cup === 2
                              ? 'bg-purple-100'
                              : 'bg-blue-100'
                          }`}>
                            <Coffee size={16} className={
                              trx.menu_jualan?.id_cup === 2 ? 'text-purple-500' : 'text-blue-500'
                            } />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-800 truncate">
                              {trx.menu_jualan?.nama_item || 'Menu tidak ditemukan'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-stone-400">
                                {formatWaktu(trx.tanggal_jam)}
                              </span>
                              <span className="w-1 h-1 bg-stone-300 rounded-full" />
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                                {trx.jumlah_beli} cup
                              </span>
                              <span className="w-1 h-1 bg-stone-300 rounded-full" />
                              <span className="text-[10px] text-stone-400">
                                {trx.menu_jualan?.inventory_cup?.nama_cup || ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm font-bold text-emerald-600">
                            {rp(trx.total_bayar)}
                          </span>

                          {/* Desktop Actions */}
                          <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(trx) }}
                              className="p-1.5 bg-blue-100 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Hapus transaksi "${trx.menu_jualan?.nama_item}" (${trx.jumlah_beli} cup)?`))
                                  handleDelete(trx.id_transaksi)
                              }}
                              className="p-1.5 bg-red-100 text-red-500 rounded-lg cursor-pointer hover:bg-red-200 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Mobile Arrow */}
                          <ChevronDown size={14} className="text-stone-300 lg:hidden" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ==================== TOTAL FOOTER ==================== */}
      {transaksi.length > 0 && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Total Keseluruhan</p>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {transaksi.length} transaksi · {totalCup} cup
                    {filterTanggal && ` · ${formatTgl(filterTanggal)}`}
                  </p>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {rp(totalPendapatan)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}