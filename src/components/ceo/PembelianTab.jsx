import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  ShoppingBag, Plus, Send, Clock, CheckCircle,
  Trash2, Receipt, TrendingUp, X, Package,
  ChevronUp, Calendar, AlertTriangle, RefreshCw,
  Tag, DollarSign, Hash, FileText, Filter,
  ShoppingCart, Boxes, ChevronDown
} from 'lucide-react'

export default function PembelianTab({ msg }) {
  const { user } = useAuth()
  const [pembelian, setPembelian] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeKategori, setActiveKategori] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)

  // Tanggal custom
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

  // Form
  const [form, setForm] = useState({
    nama_barang: '',
    jumlah: '1',
    satuan: 'pcs',
    harga_satuan: '',
    kategori: '',
    keterangan: ''
  })

  const KATEGORI_LIST = [
    { key: 'Bahan Baku', icon: '🧴', color: 'amber' },
    { key: 'Cup & Packaging', icon: '🥤', color: 'blue' },
    { key: 'Topping', icon: '🧋', color: 'purple' },
    { key: 'Peralatan', icon: '🔧', color: 'stone' },
    { key: 'Lainnya', icon: '📦', color: 'gray' },
  ]

  const SATUAN_LIST = ['pcs', 'pack', 'kg', 'gram', 'liter', 'ml', 'box', 'lusin', 'botol', 'sachet', 'rim']

  useEffect(() => {
    fetchPembelian()
  }, [tanggal])

  // ==================== FETCH ====================
  const fetchPembelian = async () => {
    setLoading(true)
    const startOfDay = `${tanggal}T00:00:00`
    const endOfDay = `${tanggal}T23:59:59`

    const { data, error } = await supabase
      .from('pembelian_barang')
      .select('*')
      .gte('tanggal', tanggal)
      .lte('tanggal', tanggal)
      .order('created_at', { ascending: false })

    if (error) msg(error.message, false)
    else setPembelian(data || [])
    setLoading(false)
  }

  // ==================== HANDLERS ====================
  const handleSubmit = async () => {
    if (!form.nama_barang.trim()) {
      msg('Nama barang wajib diisi!', false)
      return
    }
    if (!form.harga_satuan || parseFloat(form.harga_satuan) <= 0) {
      msg('Harga satuan wajib diisi!', false)
      return
    }

    setLoading(true)

    const { error } = await supabase.from('pembelian_barang').insert({
      nama_barang: form.nama_barang.trim(),
      jumlah: parseInt(form.jumlah) || 1,
      satuan: form.satuan,
      harga_satuan: parseFloat(form.harga_satuan),
      tanggal: tanggal,
      kategori: form.kategori || 'Lainnya',
      keterangan: form.keterangan || null,
      created_by: user?.id || null
    })

    if (error) {
      msg(error.message, false)
    } else {
      msg(`"${form.nama_barang}" berhasil dicatat!`)
      resetForm()
      setShowForm(false)
      fetchPembelian()
    }
    setLoading(false)
  }

  const handleDelete = async (item) => {
    setLoading(true)
    const { error } = await supabase
      .from('pembelian_barang')
      .delete()
      .eq('id_pembelian', item.id_pembelian)

    if (error) {
      msg(error.message, false)
    } else {
      msg('Data pembelian dihapus!')
      setConfirmDelete(null)
      setExpandedItem(null)
      fetchPembelian()
    }
    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      nama_barang: '',
      jumlah: '1',
      satuan: 'pcs',
      harga_satuan: '',
      kategori: '',
      keterangan: ''
    })
  }

  // ==================== HELPERS ====================
  const formatRp = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(n)

  const formatTanggalShort = (d) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

  const isToday = tanggal === new Date().toISOString().split('T')[0]

  const getKategoriStyle = (kat) => {
    const found = KATEGORI_LIST.find(k => k.key === kat)
    if (!found) return { icon: '📦', bg: 'bg-gray-100', text: 'text-gray-600' }
    const styles = {
      amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
      stone: { bg: 'bg-stone-200', text: 'text-stone-700' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
    }
    return { icon: found.icon, ...styles[found.color] }
  }

  // ==================== COMPUTED ====================
  const totalPengeluaran = pembelian.reduce((a, p) => a + (parseFloat(p.total_harga) || 0), 0)
  const totalBarang = pembelian.length
  const totalUnit = pembelian.reduce((a, p) => a + (p.jumlah || 0), 0)

  const kategoriCounts = KATEGORI_LIST.map(k => ({
    ...k,
    count: pembelian.filter(p => p.kategori === k.key).length
  }))

  const filteredPembelian = activeKategori === 'all'
    ? pembelian
    : pembelian.filter(p => p.kategori === activeKategori)

  // ==================== RENDER ====================
  return (
    <div className="pb-24 lg:pb-6 animate-slideUp">

      {/* ==================== FORM BOTTOM SHEET ==================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />

          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slideUp overflow-hidden max-h-[92vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-5 sm:p-6 text-white flex-shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={20} />
                <h3 className="text-xl sm:text-2xl font-bold">Catat Pembelian</h3>
              </div>
              <p className="text-rose-100 text-sm">
                Input barang yang dibeli untuk {formatTanggalShort(tanggal)}
              </p>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">

              {/* Nama Barang */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                  <Package size={12} /> Nama Barang
                </label>
                <input
                  type="text"
                  value={form.nama_barang}
                  onChange={(e) => setForm(p => ({ ...p, nama_barang: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-sm"
                  placeholder="Contoh: Bubuk Taro, Cup 22oz, Sedotan..."
                />
              </div>

              {/* Jumlah + Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                    <Hash size={12} /> Jumlah
                  </label>
                  <input
                    type="number"
                    value={form.jumlah}
                    onChange={(e) => setForm(p => ({ ...p, jumlah: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-sm"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">
                    Satuan
                  </label>
                  <select
                    value={form.satuan}
                    onChange={(e) => setForm(p => ({ ...p, satuan: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-sm"
                  >
                    {SATUAN_LIST.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Satuan */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                  <DollarSign size={12} /> Harga Satuan (Rp)
                </label>
                <input
                  type="number"
                  value={form.harga_satuan}
                  onChange={(e) => setForm(p => ({ ...p, harga_satuan: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-sm"
                  placeholder="15000"
                  min="0"
                />
                {form.harga_satuan && form.jumlah && (
                  <p className="text-xs text-rose-500 font-semibold mt-1.5">
                    Total: {formatRp(parseFloat(form.harga_satuan) * parseInt(form.jumlah || 1))}
                  </p>
                )}
              </div>

              {/* Kategori */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                  <Tag size={12} /> Kategori
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {KATEGORI_LIST.map(kat => {
                    const selected = form.kategori === kat.key
                    return (
                      <button
                        key={kat.key}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, kategori: kat.key }))}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                          selected
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{kat.icon}</span>
                        {kat.key}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                  <FileText size={12} /> Keterangan (Opsional)
                </label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm(p => ({ ...p, keterangan: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-sm resize-none"
                  rows={2}
                  placeholder="Catatan tambahan... (toko, supplier, dll)"
                />
              </div>

              {/* Preview */}
              {form.nama_barang && form.harga_satuan && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-rose-500 mb-2 uppercase tracking-wide">Preview</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{form.nama_barang}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.jumlah || 1} {form.satuan} × {formatRp(parseFloat(form.harga_satuan))}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-rose-600">
                      {formatRp(parseFloat(form.harga_satuan) * parseInt(form.jumlah || 1))}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={handleSubmit}
                disabled={loading || !form.nama_barang.trim() || !form.harga_satuan}
                className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer ${
                  form.nama_barang.trim() && form.harga_satuan
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Simpan Pembelian</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DETAIL BOTTOM SHEET (MOBILE) ==================== */}
      {expandedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setExpandedItem(null); setConfirmDelete(null) }} />

          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slideUp overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-5 text-white flex-shrink-0">
              <button
                onClick={() => { setExpandedItem(null); setConfirmDelete(null) }}
                className="absolute top-3 right-3 p-2 bg-white/20 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
              <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold mb-2 bg-white/25">
                {expandedItem.kategori || 'Lainnya'}
              </span>
              <h3 className="text-xl font-bold">{expandedItem.nama_barang}</h3>
              <p className="text-rose-100 text-lg font-semibold mt-1">
                {formatRp(expandedItem.total_harga)}
              </p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">Jumlah</p>
                  <p className="text-lg font-bold text-gray-800">{expandedItem.jumlah}</p>
                  <p className="text-[10px] text-gray-400">{expandedItem.satuan}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-medium">Harga/Unit</p>
                  <p className="text-sm font-bold text-gray-800">{formatRp(expandedItem.harga_satuan)}</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-rose-500 font-medium">Total</p>
                  <p className="text-sm font-bold text-rose-600">{formatRp(expandedItem.total_harga)}</p>
                </div>
              </div>

              {expandedItem.keterangan && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
                    <FileText size={12} /> Keterangan
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{expandedItem.keterangan}</p>
                </div>
              )}

              <p className="text-[10px] text-gray-400">
                Dicatat: {new Date(expandedItem.created_at).toLocaleString('id-ID')}
              </p>

              {/* Confirm Delete */}
              {confirmDelete === expandedItem.id_pembelian ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slideUp">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-700 text-sm">Hapus data ini?</p>
                      <p className="text-xs text-red-500 mt-1">
                        "{expandedItem.nama_barang}" akan dihapus permanen.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleDelete(expandedItem)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-red-600"
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
              ) : (
                <button
                  onClick={() => setConfirmDelete(expandedItem.id_pembelian)}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-red-100 text-red-600 cursor-pointer active:scale-[0.98]"
                >
                  <Trash2 size={16} />
                  Hapus Data
                </button>
              )}
            </div>
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
                <Receipt size={20} className="text-rose-500" />
                Pembelian {formatTanggalShort(tanggal)}
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {pembelian.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Belum ada pembelian di tanggal ini</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pembelian.map(item => {
                    const ks = getKategoriStyle(item.kategori)
                    return (
                      <div
                        key={item.id_pembelian}
                        onClick={() => setExpandedItem(item)}
                        className="px-5 py-3 cursor-pointer active:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 ${ks.bg} rounded-lg flex items-center justify-center flex-shrink-0 text-sm`}>
                              {ks.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_barang}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.jumlah} {item.satuan} × {formatRp(item.harga_satuan)}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-rose-600 ml-2">
                            -{formatRp(item.total_harga)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {pembelian.length > 0 && (
              <div className="p-4 bg-rose-50 border-t border-rose-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-rose-700">Total Pengeluaran</span>
                  <span className="text-lg font-bold text-rose-700">{formatRp(totalPengeluaran)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TANGGAL PICKER ==================== */}
      <div className={`rounded-2xl p-4 mb-4 border-2 ${
        isToday ? 'bg-white border-gray-100' : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
              isToday
                ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
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
              <p className="text-xs text-gray-400 mt-0.5">{formatTanggalShort(tanggal)}</p>
            </div>
          </div>
          <label className="relative cursor-pointer flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
              <Calendar size={14} />
              <span className="hidden sm:inline">Ubah Tanggal</span>
              <span className="sm:hidden">Ubah</span>
            </div>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>

        {!isToday && (
          <div className="mt-3 flex items-center gap-2 bg-amber-100 rounded-xl px-3 py-2">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">
              Data dicatat untuk {formatTanggalShort(tanggal)}
            </p>
          </div>
        )}
      </div>

      {/* ==================== STATS ==================== */}
      <div className="flex gap-3 overflow-x-auto pb-3 mb-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 lg:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
          { icon: Receipt, color: 'rose', label: 'Item Dibeli', value: totalBarang, action: () => setShowHistory(true) },
          { icon: DollarSign, color: 'red', label: 'Pengeluaran', value: formatRp(totalPengeluaran) },
          { icon: Boxes, color: 'blue', label: 'Total Unit', value: `${totalUnit} unit` },
          { icon: ShoppingCart, color: 'purple', label: 'Kategori', value: `${kategoriCounts.filter(k => k.count > 0).length} jenis` }
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
                  backgroundColor: stat.color === 'rose' ? '#ffe4e6' :
                    stat.color === 'red' ? '#fecaca' :
                    stat.color === 'blue' ? '#dbeafe' : '#f3e8ff'
                }}
              >
                <stat.icon size={18} style={{
                  color: stat.color === 'rose' ? '#e11d48' :
                    stat.color === 'red' ? '#dc2626' :
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

        {/* ===== LIST SECTION ===== */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">

          {/* Kategori Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveKategori('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95 ${
                activeKategori === 'all'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Semua ({totalBarang})
            </button>
            {KATEGORI_LIST.map(kat => {
              const count = pembelian.filter(p => p.kategori === kat.key).length
              return (
                <button
                  key={kat.key}
                  onClick={() => setActiveKategori(kat.key)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 active:scale-95 flex items-center gap-1.5 ${
                    activeKategori === kat.key
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <span className="text-xs">{kat.icon}</span>
                  {kat.key.split(' ')[0]} ({count})
                </button>
              )
            })}
          </div>

          {/* Items Grid */}
          {loading && pembelian.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Memuat...</p>
            </div>
          ) : filteredPembelian.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Belum ada pembelian</p>
              <p className="text-gray-300 text-xs mt-1">
                {activeKategori !== 'all' ? 'Tidak ada di kategori ini' : 'Tap + untuk mulai mencatat'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {filteredPembelian.map(item => {
                const ks = getKategoriStyle(item.kategori)

                return (
                  <div
                    key={item.id_pembelian}
                    className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden group hover:border-rose-200 transition-all cursor-pointer lg:cursor-default"
                    onClick={() => {
                      if (window.innerWidth < 1024) setExpandedItem(item)
                    }}
                  >
                    <div className="p-4">
                      {/* Top Row */}
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${ks.bg} ${ks.text}`}>
                          <span>{ks.icon}</span>
                          {item.kategori || 'Lainnya'}
                        </span>

                        {/* Desktop Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Hapus "${item.nama_barang}"?`)) handleDelete(item)
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-all hidden lg:block"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                        {item.nama_barang}
                      </h3>

                      {/* Qty */}
                      <p className="text-xs text-gray-400 mb-2">
                        {item.jumlah} {item.satuan} × {formatRp(item.harga_satuan)}
                      </p>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-rose-600 font-bold text-lg">
                          {formatRp(item.total_harga)}
                        </span>
                        <ChevronDown size={14} className="text-gray-300 lg:hidden" />
                      </div>

                      {/* Keterangan Preview */}
                      {item.keterangan && (
                        <p className="text-[10px] text-gray-400 mt-2 line-clamp-1">
                          📝 {item.keterangan}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ===== DESKTOP SIDEBAR ===== */}
        <div className="hidden lg:block space-y-4">

          {/* Quick Add Card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-20">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-rose-500" />
                Tambah Pembelian
              </h3>
            </div>

            {/* Tanggal Badge */}
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

            <div className="p-4 space-y-3">
              <input
                type="text"
                value={form.nama_barang}
                onChange={(e) => setForm(p => ({ ...p, nama_barang: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder:text-gray-300 focus:border-rose-400 outline-none text-sm"
                placeholder="Nama barang..."
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={form.jumlah}
                  onChange={(e) => setForm(p => ({ ...p, jumlah: e.target.value }))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm text-center outline-none focus:border-rose-400"
                  placeholder="Qty"
                  min="1"
                />
                <select
                  value={form.satuan}
                  onChange={(e) => setForm(p => ({ ...p, satuan: e.target.value }))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-gray-800 text-sm outline-none focus:border-rose-400"
                >
                  {SATUAN_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  type="number"
                  value={form.harga_satuan}
                  onChange={(e) => setForm(p => ({ ...p, harga_satuan: e.target.value }))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm outline-none focus:border-rose-400"
                  placeholder="Harga"
                  min="0"
                />
              </div>

              <select
                value={form.kategori}
                onChange={(e) => setForm(p => ({ ...p, kategori: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm outline-none focus:border-rose-400"
              >
                <option value="">Pilih Kategori</option>
                {KATEGORI_LIST.map(k => (
                  <option key={k.key} value={k.key}>{k.icon} {k.key}</option>
                ))}
              </select>

              <textarea
                value={form.keterangan}
                onChange={(e) => setForm(p => ({ ...p, keterangan: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder:text-gray-300 text-sm outline-none resize-none focus:border-rose-400"
                rows={2}
                placeholder="Keterangan (opsional)"
              />

              {form.harga_satuan && form.jumlah && (
                <div className="bg-rose-50 rounded-xl px-3 py-2 text-center">
                  <span className="text-xs text-rose-500">Total: </span>
                  <span className="text-sm font-bold text-rose-600">
                    {formatRp(parseFloat(form.harga_satuan) * parseInt(form.jumlah || 1))}
                  </span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.nama_barang.trim() || !form.harga_satuan}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  form.nama_barang.trim() && form.harga_satuan
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send size={16} />
                }
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Kategori Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Tag size={18} className="text-gray-400" />
                Per Kategori
              </h3>
            </div>

            <div className="divide-y divide-gray-50">
              {KATEGORI_LIST.map(kat => {
                const items = pembelian.filter(p => p.kategori === kat.key)
                const subtotal = items.reduce((a, p) => a + (parseFloat(p.total_harga) || 0), 0)
                if (items.length === 0) return null

                return (
                  <div key={kat.key} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{kat.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{kat.key}</p>
                          <p className="text-[10px] text-gray-400">{items.length} item</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-rose-600">{formatRp(subtotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {pembelian.length > 0 && (
              <div className="p-4 bg-rose-50 border-t border-rose-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-rose-700">Total</span>
                  <span className="text-lg font-bold text-rose-700">{formatRp(totalPengeluaran)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MOBILE FLOATING BAR ==================== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        {/* Total Bar */}
        {pembelian.length > 0 && (
          <div className="mx-3 mb-2">
            <button
              onClick={() => setShowHistory(true)}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-rose-200/50 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{totalBarang} item dibeli</p>
                  <p className="text-xs text-rose-100">{formatTanggalShort(tanggal)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatRp(totalPengeluaran)}</p>
                <ChevronUp size={14} className="ml-auto text-rose-200" />
              </div>
            </button>
          </div>
        )}

        {/* Bottom Nav */}
        <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-around">
          <button
            onClick={() => setShowHistory(true)}
            className="flex flex-col items-center gap-0.5 py-1 cursor-pointer"
          >
            <Clock size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Riwayat</span>
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="relative -mt-5 w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-xl shadow-rose-200/50 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Plus size={24} />
          </button>

          <button
            className="flex flex-col items-center gap-0.5 py-1 cursor-pointer"
            onClick={fetchPembelian}
          >
            <RefreshCw size={20} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  )
}