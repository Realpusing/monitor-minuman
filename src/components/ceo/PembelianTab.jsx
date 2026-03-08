import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  ShoppingBag, Plus, Send, Clock, CheckCircle,
  Trash2, Receipt, TrendingUp, X, Package,
  ChevronUp, Calendar, AlertTriangle, RefreshCw,
  Tag, DollarSign, Hash, FileText, Filter,
  ShoppingCart, Boxes, ChevronDown, ChevronLeft,
  ChevronRight, ArrowRight, Search, Info,
  BarChart3, Layers, MoreVertical, Minus,
  ArrowDownRight, Zap, PieChart
} from 'lucide-react'

/* ================================================================
   CONSTANTS
   ================================================================ */

const KATEGORI_LIST = [
  { key: 'Bahan Baku', icon: '🧴', color: 'amber' },
  { key: 'Cup & Packaging', icon: '🥤', color: 'blue' },
  { key: 'Topping', icon: '🧋', color: 'purple' },
  { key: 'Peralatan', icon: '🔧', color: 'stone' },
  { key: 'Lainnya', icon: '📦', color: 'gray' },
]

const SATUAN_LIST = [
  'pcs', 'pack', 'kg', 'gram', 'liter',
  'ml', 'box', 'lusin', 'botol', 'sachet', 'rim',
]

const EMPTY_FORM = {
  nama_barang: '',
  jumlah: '1',
  satuan: 'pcs',
  harga_satuan: '',
  kategori: '',
  keterangan: '',
}

const KATEGORI_STYLE_MAP = {
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', light: 'bg-amber-50' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', light: 'bg-blue-50' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', light: 'bg-purple-50' },
  stone: { bg: 'bg-stone-200', text: 'text-stone-700', light: 'bg-stone-50' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', light: 'bg-gray-50' },
}

/* ================================================================
   HELPERS
   ================================================================ */

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

const formatDateShort = (d) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatDateFull = (d) =>
  new Date(d).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatDayLabel = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const getToday = () => new Date().toISOString().split('T')[0]

const getYesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

const getKategoriStyle = (kat) => {
  const found = KATEGORI_LIST.find((k) => k.key === kat)
  if (!found) return { icon: '📦', bg: 'bg-gray-100', text: 'text-gray-600', light: 'bg-gray-50' }
  const styles = KATEGORI_STYLE_MAP[found.color] || KATEGORI_STYLE_MAP.gray
  return { icon: found.icon, ...styles }
}

const navigateDate = (currentDate, direction) => {
  if (!currentDate) return currentDate
  const d = new Date(currentDate)
  d.setDate(d.getDate() + direction)
  return d.toISOString().split('T')[0]
}

/* ================================================================
   TOAST COMPONENT
   ================================================================ */

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  const configs = {
    success: { bg: 'bg-emerald-600', icon: <CheckCircle size={16} /> },
    error: { bg: 'bg-red-600', icon: <AlertTriangle size={16} /> },
    info: { bg: 'bg-blue-600', icon: <Info size={16} /> },
  }

  const { bg, icon } = configs[type] || configs.info

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
      <div
        className={`${bg} text-white px-5 py-3 rounded-2xl shadow-2xl
          flex items-center gap-2.5 text-sm font-medium min-w-[260px]`}
      >
        {icon}
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   SKELETON COMPONENTS
   ================================================================ */

function SkeletonPulse({ className = '' }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <SkeletonPulse className="w-9 h-9 rounded-xl mb-3" />
          <SkeletonPulse className="w-16 h-2.5 mb-2" />
          <SkeletonPulse className="w-12 h-5" />
        </div>
      ))}
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-3.5 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="w-32 h-3.5" />
              <SkeletonPulse className="w-24 h-2.5" />
            </div>
            <SkeletonPulse className="w-20 h-4" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   STAT CARD COMPONENT
   ================================================================ */

function StatCard({ label, value, icon: Icon, color, bg, subValue }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm
        hover:shadow-md transition-shadow duration-200"
    >
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
        <Icon size={15} className={color} />
      </div>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-extrabold text-gray-900 mt-0.5 leading-tight break-all">
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] text-gray-400 mt-0.5">{subValue}</p>
      )}
    </div>
  )
}

/* ================================================================
   CONFIRM MODAL COMPONENT
   ================================================================ */

function ConfirmModal({
  title,
  message,
  subMessage,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  confirmColor = 'bg-red-500',
  icon: Icon = AlertTriangle,
  iconColor = 'text-red-500',
  iconBg = 'bg-red-100',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden animate-slideUp"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="p-6 text-center">
          <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon size={24} className={iconColor} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          {subMessage && (
            <p className="text-xs text-gray-400 mt-1.5">{subMessage}</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98] transition-transform"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-[1.5] py-3.5 rounded-xl font-semibold text-white
              cursor-pointer active:scale-[0.98] transition-transform
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed ${confirmColor}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   DATE PICKER SECTION COMPONENT
   ================================================================ */

function DatePickerSection({ tanggal, onDateChange, onNavigate }) {
  const todayStr = getToday()
  const yesterdayStr = getYesterday()
  const isToday = tanggal === todayStr
  const isYesterday = tanggal === yesterdayStr

  const dateLabel = useMemo(() => {
    if (isToday) return `📍 Hari Ini — ${formatDayLabel(tanggal)}`
    if (isYesterday) return `Kemarin — ${formatDayLabel(tanggal)}`
    return formatDayLabel(tanggal)
  }, [tanggal, isToday, isYesterday])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => onNavigate(-1)}
          className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center
            cursor-pointer active:scale-90 active:bg-gray-200 flex-shrink-0 transition-all"
          aria-label="Tanggal sebelumnya"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>

        <div className="flex-1 relative">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => { if (e.target.value) onDateChange(e.target.value) }}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3
              text-center text-sm font-semibold text-gray-800 outline-none
              focus:border-rose-400 focus:ring-2 focus:ring-rose-50
              cursor-pointer min-h-[46px] transition-all"
          />
        </div>

        <button
          onClick={() => onNavigate(1)}
          disabled={isToday}
          className={`w-11 h-11 rounded-xl flex items-center justify-center
            active:scale-90 flex-shrink-0 transition-all ${
              isToday
                ? 'bg-gray-50 cursor-not-allowed'
                : 'bg-gray-100 cursor-pointer active:bg-gray-200'
            }`}
          aria-label="Tanggal berikutnya"
        >
          <ChevronRight size={18} className={isToday ? 'text-gray-300' : 'text-gray-600'} />
        </button>
      </div>

      {/* Label */}
      <div className="px-4 pb-1 text-center">
        <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
      </div>

      {/* Quick Buttons */}
      <div className="flex gap-2 p-3 pt-2 overflow-x-auto scrollbar-hide">
        {[
          { label: 'Hari Ini', val: todayStr, active: isToday },
          { label: 'Kemarin', val: yesterdayStr, active: isYesterday },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={() => onDateChange(btn.val)}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer
              whitespace-nowrap min-h-[36px] transition-all duration-200 ${
                btn.active
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Backdate Warning */}
      {!isToday && (
        <div className="mx-3 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">
            Data dicatat untuk tanggal {formatDateShort(tanggal)} (backdate)
          </p>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   PURCHASE FORM MODAL COMPONENT
   ================================================================ */

function PurchaseFormModal({ tanggal, loading, onSubmit, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const nameRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const total = useMemo(() => {
    const harga = parseFloat(form.harga_satuan) || 0
    const jumlah = parseInt(form.jumlah) || 1
    return harga * jumlah
  }, [form.harga_satuan, form.jumlah])

  const isValid = form.nama_barang.trim() && form.harga_satuan && parseFloat(form.harga_satuan) > 0

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({
      nama_barang: form.nama_barang.trim(),
      jumlah: parseInt(form.jumlah) || 1,
      satuan: form.satuan,
      harga_satuan: parseFloat(form.harga_satuan),
      kategori: form.kategori || 'Lainnya',
      keterangan: form.keterangan?.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
          shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <ShoppingCart size={18} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Catat Pembelian</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Untuk {formatDateShort(tanggal)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Nama Barang */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Nama Barang
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.nama_barang}
              onChange={(e) => updateField('nama_barang', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-base focus:border-rose-400 focus:ring-2
                focus:ring-rose-50 outline-none transition-all"
              placeholder="Contoh: Bubuk Taro, Cup 22oz..."
              required
            />
          </div>

          {/* Jumlah + Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Jumlah
              </label>
              <input
                type="number"
                value={form.jumlah}
                onChange={(e) => updateField('jumlah', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                  text-gray-800 text-base focus:border-rose-400 focus:ring-2
                  focus:ring-rose-50 outline-none transition-all"
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Satuan
              </label>
              <select
                value={form.satuan}
                onChange={(e) => updateField('satuan', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                  text-gray-800 text-base focus:border-rose-400 focus:ring-2
                  focus:ring-rose-50 outline-none transition-all appearance-none
                  bg-white"
              >
                {SATUAN_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga Satuan */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Harga Satuan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                Rp
              </span>
              <input
                type="number"
                value={form.harga_satuan}
                onChange={(e) => updateField('harga_satuan', e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5
                  text-gray-800 text-base focus:border-rose-400 focus:ring-2
                  focus:ring-rose-50 outline-none transition-all"
                placeholder="15000"
                min="0"
              />
            </div>
            {form.harga_satuan && parseFloat(form.harga_satuan) > 0 && (
              <p className="text-[10px] text-gray-400 mt-1.5 ml-0.5">
                = {formatRp(parseFloat(form.harga_satuan))} per {form.satuan}
              </p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Kategori
            </label>
            <div className="grid grid-cols-2 gap-2">
              {KATEGORI_LIST.map((kat) => {
                const isSelected = form.kategori === kat.key
                return (
                  <button
                    key={kat.key}
                    type="button"
                    onClick={() => updateField('kategori', kat.key)}
                    className={`px-3.5 py-3 rounded-xl text-xs font-semibold
                      cursor-pointer transition-all duration-200 active:scale-[0.97]
                      flex items-center gap-2 text-left ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-base">{kat.icon}</span>
                    <span className="truncate">{kat.key}</span>
                    {isSelected && <CheckCircle size={14} className="ml-auto flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              <span className="flex items-center gap-1.5">
                <FileText size={12} />
                Keterangan
                <span className="text-gray-300 font-normal">(Opsional)</span>
              </span>
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => updateField('keterangan', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-sm focus:border-rose-400 focus:ring-2
                focus:ring-rose-50 outline-none transition-all resize-none leading-relaxed"
              rows={3}
              placeholder="Catatan: toko, supplier, dll..."
            />
          </div>

          {/* Preview */}
          {form.nama_barang && form.harga_satuan && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                Preview
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{form.nama_barang}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {form.jumlah || 1} {form.satuan} × {formatRp(parseFloat(form.harga_satuan) || 0)}
                  </p>
                </div>
                <span className="text-lg font-bold text-rose-600">{formatRp(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98] transition-transform"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className="flex-[2] py-3.5 rounded-xl font-semibold bg-rose-600
              text-white cursor-pointer active:scale-[0.98] flex items-center
              justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   DETAIL MODAL (MOBILE)
   ================================================================ */

function DetailModal({ item, loading, onClose, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false)

  if (!item) return null

  const ks = getKategoriStyle(item.kategori)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { onClose(); setShowConfirm(false) }}
      />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
          shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ks.bg}`}>
                <span className="text-xl">{ks.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{item.nama_barang}</h3>
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5
                  rounded-full mt-1 ${ks.bg} ${ks.text}`}>
                  {item.kategori || 'Lainnya'}
                </span>
              </div>
            </div>
            <button
              onClick={() => { onClose(); setShowConfirm(false) }}
              className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Price highlight */}
          <div className="bg-rose-50 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-rose-500 font-medium mb-1">Total Harga</p>
            <p className="text-3xl font-black text-rose-600">{formatRp(item.total_harga)}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Jumlah', value: item.jumlah, sub: item.satuan, bg: 'bg-gray-50', color: 'text-gray-700' },
              { label: 'Harga/Unit', value: formatRp(item.harga_satuan), sub: '', bg: 'bg-gray-50', color: 'text-gray-700' },
              { label: 'Total', value: formatRp(item.total_harga), sub: '', bg: 'bg-rose-50', color: 'text-rose-700' },
            ].map((card, i) => (
              <div key={i} className={`${card.bg} rounded-2xl p-3 text-center`}>
                <p className="text-[10px] text-gray-400 font-medium mb-1">{card.label}</p>
                <p className={`text-sm font-bold ${card.color}`}>{card.value}</p>
                {card.sub && <p className="text-[10px] text-gray-400">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Detail Rows */}
          <div className="space-y-2">
            {[
              { icon: Tag, label: 'Kategori', val: item.kategori || 'Lainnya' },
              { icon: Calendar, label: 'Tanggal', val: formatDateShort(item.tanggal) },
              { icon: Hash, label: 'ID', val: `#${item.id_pembelian}` },
              {
                icon: Clock,
                label: 'Dicatat',
                val: new Date(item.created_at).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                }),
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <row.icon size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{row.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">{row.val}</span>
              </div>
            ))}
          </div>

          {/* Keterangan */}
          {item.keterangan && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Keterangan
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {item.keterangan}
              </p>
            </div>
          )}

          {/* Delete Confirmation */}
          {showConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 text-sm">Hapus data ini?</p>
                  <p className="text-xs text-red-400 mt-1">
                    "{item.nama_barang}" akan dihapus permanen.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onDelete(item)}
                      disabled={loading}
                      className="px-4 py-2.5 bg-red-500 text-white text-xs font-semibold
                        rounded-xl cursor-pointer min-h-[40px] active:scale-[0.98]
                        disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2.5 bg-white text-gray-600 text-xs font-medium
                        rounded-xl cursor-pointer border border-gray-200 min-h-[40px]
                        active:scale-[0.98] transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showConfirm && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 rounded-xl font-semibold flex items-center
                justify-center gap-2 bg-red-50 text-red-500 cursor-pointer
                active:scale-[0.98] transition-transform"
            >
              <Trash2 size={15} />
              Hapus Data
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   PURCHASE LIST ITEM COMPONENT
   ================================================================ */

function PurchaseListItem({ item, isLast, onDetail, onDelete }) {
  const ks = getKategoriStyle(item.kategori)

  return (
    <div
      className={`px-4 py-3.5 active:bg-gray-50 group cursor-pointer
        lg:cursor-default transition-colors duration-150 ${
          !isLast ? 'border-b border-gray-50' : ''
        }`}
      onClick={() => { if (window.innerWidth < 1024) onDetail(item) }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ks.bg}`}>
          <span className="text-base">{ks.icon}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {item.nama_barang}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] text-gray-400">
              {item.jumlah} {item.satuan} × {formatRp(item.harga_satuan)}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ks.bg} ${ks.text}`}>
              {item.kategori || 'Lainnya'}
            </span>
            {item.keterangan && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500">
                📝
              </span>
            )}
          </div>
        </div>

        {/* Price + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-rose-600">
            -{formatRp(item.total_harga)}
          </span>

          {/* Desktop hover actions */}
          <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item)
              }}
              className="p-1.5 bg-red-50 text-red-500 rounded-lg cursor-pointer
                hover:bg-red-100 transition-colors"
              title="Hapus"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Mobile arrow */}
          <ArrowRight size={14} className="text-gray-300 lg:hidden" />
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   FILTER CHIPS COMPONENT
   ================================================================ */

function FilterChips({ pembelian, activeKategori, onFilter }) {
  const chipData = useMemo(() => {
    const allCount = pembelian.length
    const kategoriChips = KATEGORI_LIST.map((k) => ({
      id: k.key,
      label: k.key.split(' ')[0],
      icon: k.icon,
      count: pembelian.filter((p) => p.kategori === k.key).length,
    }))
    return [{ id: 'all', label: 'Semua', icon: null, count: allCount }, ...kategoriChips]
  }, [pembelian])

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {chipData.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onFilter(chip.id)}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer
            whitespace-nowrap min-h-[36px] transition-all duration-200 active:scale-95
            flex items-center gap-1.5 ${
              activeKategori === chip.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
        >
          {chip.icon && <span className="text-[11px]">{chip.icon}</span>}
          {chip.label}
          <span className={`text-[10px] ${
            activeKategori === chip.id ? 'text-gray-400' : 'text-gray-400'
          }`}>
            {chip.count}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================
   PURCHASE LIST SECTION COMPONENT
   ================================================================ */

function PurchaseListSection({
  items,
  showList,
  onToggle,
  onDetail,
  onDelete,
  totalLabel,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between cursor-pointer
          active:bg-gray-50 transition-colors duration-150"
        aria-expanded={showList}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
            <Receipt size={16} className="text-rose-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">Daftar Pembelian</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{totalLabel}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-300 ${
            showList ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Items */}
      {showList && (
        <div>
          {items.map((item, idx) => (
            <PurchaseListItem
              key={item.id_pembelian}
              item={item}
              isLast={idx === items.length - 1}
              onDetail={onDetail}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   KATEGORI BREAKDOWN COMPONENT
   ================================================================ */

function KategoriBreakdown({ pembelian, totalPengeluaran }) {
  const breakdown = useMemo(() => {
    const map = {}
    pembelian.forEach((p) => {
      const kat = p.kategori || 'Lainnya'
      if (!map[kat]) {
        map[kat] = { kategori: kat, count: 0, total: 0, items: [] }
      }
      map[kat].count += 1
      map[kat].total += parseFloat(p.total_harga) || 0
      map[kat].items.push(p)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [pembelian])

  const maxTotal = breakdown[0]?.total || 1

  if (breakdown.length === 0) return null

  const barColors = {
    'Bahan Baku': ['#f59e0b', '#d97706'],
    'Cup & Packaging': ['#3b82f6', '#2563eb'],
    'Topping': ['#8b5cf6', '#7c3aed'],
    'Peralatan': ['#78716c', '#57534e'],
    'Lainnya': ['#6b7280', '#4b5563'],
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
          <BarChart3 size={16} className="text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Pengeluaran per Kategori</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {breakdown.length} kategori
          </p>
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="px-4 pb-2">
        {breakdown.map((item, idx) => {
          const ks = getKategoriStyle(item.kategori)
          const pct = totalPengeluaran > 0 ? Math.round((item.total / totalPengeluaran) * 100) : 0
          const barW = Math.round((item.total / maxTotal) * 100)
          const [c1, c2] = barColors[item.kategori] || barColors['Lainnya']

          return (
            <div key={item.kategori} className={`py-3 ${idx > 0 ? 'border-t border-gray-50' : ''}`}>
              {/* Row 1: Icon + Name + Total */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${ks.bg}`}>
                  <span className="text-xs">{ks.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {item.kategori}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatRp(item.total)}</span>
              </div>

              {/* Row 2: Bar */}
              <div className="flex items-center gap-3 ml-9.5 pl-0.5">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${barW}%`,
                      background: `linear-gradient(90deg, ${c1}, ${c2})`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 text-[11px]">
                  <span className="font-extrabold text-gray-800">{item.count}</span>
                  <span className="text-gray-400">item</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    pct >= 30 ? 'bg-rose-100 text-rose-600'
                      : pct >= 15 ? 'bg-amber-100 text-amber-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-400">
          Total {breakdown.length} kategori
        </span>
        <span className="text-xs font-bold text-rose-600">{formatRp(totalPengeluaran)}</span>
      </div>
    </div>
  )
}

/* ================================================================
   EMPTY STATE COMPONENT
   ================================================================ */

function EmptyState({ tanggal, hasFilter, onAdd, onClearFilter }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShoppingCart size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-sm">
        {hasFilter ? 'Tidak ada di kategori ini' : 'Belum ada pembelian'}
      </p>
      <p className="text-gray-300 text-xs mt-1.5 max-w-[240px] mx-auto leading-relaxed">
        {hasFilter
          ? 'Coba pilih kategori lain atau lihat semua data'
          : `Belum ada pembelian tercatat untuk ${formatDateShort(tanggal)}`
        }
      </p>
      <div className="flex items-center justify-center gap-2 mt-5">
        {hasFilter ? (
          <button
            onClick={onClearFilter}
            className="text-xs font-semibold text-blue-600 bg-blue-50 px-5 py-2.5
              rounded-xl cursor-pointer active:bg-blue-100 transition-colors min-h-[40px]"
          >
            Lihat Semua
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white
              bg-rose-600 px-6 py-3 rounded-xl cursor-pointer active:scale-[0.98]
              transition-transform shadow-sm"
          >
            <Plus size={16} />
            Catat Pembelian
          </button>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   INSIGHTS SECTION COMPONENT
   ================================================================ */

function InsightsSection({ pembelian, totalPengeluaran }) {
  const insights = useMemo(() => {
    if (pembelian.length === 0) return null

    const avgPerItem = totalPengeluaran / pembelian.length
    const totalUnit = pembelian.reduce((a, p) => a + (p.jumlah || 0), 0)
    const avgPerUnit = totalUnit > 0 ? totalPengeluaran / totalUnit : 0

    const mostExpensive = pembelian.reduce(
      (max, p) => (parseFloat(p.total_harga) || 0) > (parseFloat(max.total_harga) || 0) ? p : max,
      pembelian[0]
    )

    const kategoriCount = new Set(pembelian.map((p) => p.kategori || 'Lainnya')).size

    return {
      avgPerItem: Math.round(avgPerItem),
      avgPerUnit: Math.round(avgPerUnit),
      totalUnit,
      mostExpensive,
      kategoriCount,
    }
  }, [pembelian, totalPengeluaran])

  if (!insights) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
          <TrendingUp size={16} className="text-rose-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Insights</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Ringkasan pembelian</p>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {[
          {
            label: 'Rata-rata/Item',
            value: formatRp(insights.avgPerItem),
            icon: DollarSign,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
          },
          {
            label: 'Total Unit',
            value: `${insights.totalUnit} unit`,
            icon: Boxes,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'Termahal',
            value: formatRp(insights.mostExpensive?.total_harga || 0),
            subValue: insights.mostExpensive?.nama_barang,
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
          },
          {
            label: 'Kategori',
            value: `${insights.kategoriCount} jenis`,
            icon: PieChart,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
          },
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className={`${item.bg} rounded-xl p-3.5`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={13} className={item.color} />
                <span className="text-[10px] font-medium text-gray-500">{item.label}</span>
              </div>
              <p className="text-base font-bold text-gray-900">{item.value}</p>
              {item.subValue && (
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.subValue}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   TOTAL FOOTER COMPONENT
   ================================================================ */

function TotalFooter({ pembelian, totalPengeluaran, tanggal }) {
  const totalUnit = pembelian.reduce((a, p) => a + (p.jumlah || 0), 0)
  const kategoriCount = new Set(pembelian.map((p) => p.kategori || 'Lainnya')).size

  return (
    <div className="bg-gray-900 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium">Total Pengeluaran</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {pembelian.length} item · {totalUnit} unit · {formatDateShort(tanggal)}
          </p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white">
          {formatRp(totalPengeluaran)}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Boxes size={12} className="text-gray-500" />
            <span className="text-[11px] text-gray-400">
              {totalUnit} unit total
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag size={12} className="text-gray-500" />
            <span className="text-[11px] text-gray-400">
              {kategoriCount} kategori
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ArrowDownRight size={12} className="text-rose-400" />
          <span className="text-[11px] font-semibold text-rose-400">
            Pengeluaran
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MOBILE FLOATING BAR COMPONENT
   ================================================================ */

function MobileFloatingBar({ pembelian, totalPengeluaran, tanggal, onAdd, onRefresh }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
      {/* Total Summary */}
      {pembelian.length > 0 && (
        <div className="mx-3 mb-2">
          <div
            className="bg-gray-900 text-white rounded-2xl p-4
              flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <Receipt size={18} className="text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">{pembelian.length} item dibeli</p>
                <p className="text-[10px] text-gray-400">{formatDateShort(tanggal)}</p>
              </div>
            </div>
            <p className="text-lg font-bold text-rose-400">{formatRp(totalPengeluaran)}</p>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-around">
        <button
          onClick={onRefresh}
          className="flex flex-col items-center gap-0.5 py-1 cursor-pointer active:scale-95 transition-transform"
        >
          <RefreshCw size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-500 font-medium">Refresh</span>
        </button>

        <button
          onClick={onAdd}
          className="relative -mt-5 w-14 h-14 bg-rose-600 text-white rounded-full
            shadow-xl shadow-rose-200/50 flex items-center justify-center
            cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>

        <div className="flex flex-col items-center gap-0.5 py-1">
          <DollarSign size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-500 font-medium">
            {pembelian.length > 0 ? formatRp(totalPengeluaran).replace('Rp', '') : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT: PembelianTab
   ================================================================ */

export default function PembelianTab({ msg }) {
  const { user } = useAuth()

  /* --------------------------------
     State Management
     -------------------------------- */
  const [pembelian, setPembelian] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [tanggal, setTanggal] = useState(getToday())
  const [activeKategori, setActiveKategori] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [showForm, setShowForm] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [showList, setShowList] = useState(true)

  // Toast
  const [toast, setToast] = useState(null)

  const fetchCountRef = useRef(0)

  /* --------------------------------
     Toast Helper
     -------------------------------- */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  /* --------------------------------
     Data Fetching
     -------------------------------- */
  const fetchPembelian = useCallback(async () => {
    const currentFetch = ++fetchCountRef.current
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('pembelian_barang')
        .select('*')
        .gte('tanggal', tanggal)
        .lte('tanggal', tanggal)
        .order('created_at', { ascending: false })

      if (currentFetch !== fetchCountRef.current) return

      if (error) {
        console.error('Fetch error:', error)
        showToast('Gagal memuat data pembelian', 'error')
        msg(error.message, false)
      } else {
        setPembelian(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      showToast('Terjadi kesalahan', 'error')
    } finally {
      if (currentFetch === fetchCountRef.current) {
        setLoading(false)
        setInitialLoading(false)
      }
    }
  }, [tanggal, msg, showToast])

  /* --------------------------------
     Effects
     -------------------------------- */
  useEffect(() => {
    fetchPembelian()
  }, [fetchPembelian])

  /* --------------------------------
     Action Handlers
     -------------------------------- */
  const handleSubmit = useCallback(
    async (formData) => {
      setLoading(true)

      try {
        const { error } = await supabase.from('pembelian_barang').insert({
          ...formData,
          tanggal,
          created_by: user?.id || null,
        })

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`"${formData.nama_barang}" berhasil dicatat!`)
          msg(`"${formData.nama_barang}" berhasil dicatat!`)
          setShowForm(false)
          fetchPembelian()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [tanggal, user, fetchPembelian, msg, showToast]
  )

  const handleDelete = useCallback(
    async (item) => {
      setLoading(true)

      try {
        const { error } = await supabase
          .from('pembelian_barang')
          .delete()
          .eq('id_pembelian', item.id_pembelian)

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`"${item.nama_barang}" berhasil dihapus!`)
          msg('Data pembelian dihapus!')
          setDetailItem(null)
          setConfirmModal(null)
          fetchPembelian()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [fetchPembelian, msg, showToast]
  )

  const handleDesktopDelete = useCallback(
    (item) => {
      setConfirmModal({
        item,
        title: 'Hapus Data?',
        message: `"${item.nama_barang}" akan dihapus secara permanen.`,
        subMessage: 'Tindakan ini tidak bisa dikembalikan.',
      })
    },
    []
  )

  const confirmDeleteAction = useCallback(() => {
    if (confirmModal?.item) handleDelete(confirmModal.item)
  }, [confirmModal, handleDelete])

  const handleNavigateTanggal = useCallback((direction) => {
    setTanggal((prev) => navigateDate(prev, direction))
  }, [])

  /* --------------------------------
     Computed Values
     -------------------------------- */
  const totalPengeluaran = useMemo(
    () => pembelian.reduce((a, p) => a + (parseFloat(p.total_harga) || 0), 0),
    [pembelian]
  )

  const totalUnit = useMemo(
    () => pembelian.reduce((a, p) => a + (p.jumlah || 0), 0),
    [pembelian]
  )

  const filteredPembelian = useMemo(() => {
    let result = pembelian

    if (activeKategori !== 'all') {
      result = result.filter((p) => p.kategori === activeKategori)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.nama_barang.toLowerCase().includes(q) ||
          p.keterangan?.toLowerCase().includes(q)
      )
    }

    return result
  }, [pembelian, activeKategori, searchQuery])

  const statCards = useMemo(() => [
    {
      label: 'Item Dibeli',
      value: pembelian.length,
      icon: Receipt,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      subValue: pembelian.length > 0
        ? `${formatRp(Math.round(totalPengeluaran / pembelian.length))} avg`
        : null,
    },
    {
      label: 'Pengeluaran',
      value: formatRp(totalPengeluaran),
      icon: DollarSign,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Total Unit',
      value: `${totalUnit}`,
      icon: Boxes,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      subValue: 'unit dibeli',
    },
    {
      label: 'Kategori',
      value: new Set(pembelian.map((p) => p.kategori || 'Lainnya')).size,
      icon: Tag,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      subValue: 'jenis',
    },
  ], [pembelian, totalPengeluaran, totalUnit])

  const hasData = pembelian.length > 0
  const hasResults = filteredPembelian.length > 0
  const isFiltered = activeKategori !== 'all' || searchQuery.trim()
  const isLoadingInitial = initialLoading && pembelian.length === 0

  /* --------------------------------
     Render
     -------------------------------- */
  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* ====== TOAST ====== */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

      {/* ====== FORM MODAL ====== */}
      {showForm && (
        <PurchaseFormModal
          tanggal={tanggal}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ====== DETAIL MODAL (MOBILE) ====== */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          loading={loading}
          onClose={() => setDetailItem(null)}
          onDelete={handleDelete}
        />
      )}

      {/* ====== CONFIRM MODAL (DESKTOP) ====== */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          subMessage={confirmModal.subMessage}
          confirmLabel="Ya, Hapus"
          confirmColor="bg-red-500"
          icon={Trash2}
          iconColor="text-red-500"
          iconBg="bg-red-100"
          loading={loading}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* ====== PAGE HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🛒 Pembelian</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Catat pengeluaran belanja harian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPembelian}
            disabled={loading}
            className="w-10 h-10 bg-white rounded-full border border-gray-200
              flex items-center justify-center cursor-pointer active:scale-95
              shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw
              size={15}
              className={`text-gray-400 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5
              bg-gray-900 text-white text-sm font-semibold rounded-xl
              cursor-pointer active:scale-[0.97] shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={15} />
            Tambah
          </button>
        </div>
      </div>

      {/* ====== DATE PICKER ====== */}
      <DatePickerSection
        tanggal={tanggal}
        onDateChange={setTanggal}
        onNavigate={handleNavigateTanggal}
      />

      {/* ====== STAT CARDS ====== */}
      {isLoadingInitial ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      )}

      {/* ====== SEARCH + FILTER ====== */}
      {hasData && (
        <div className="space-y-3">
          {/* Search */}
          {pembelian.length > 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari barang..."
                  className="flex-1 text-sm text-gray-800 outline-none bg-transparent
                    placeholder:text-gray-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="px-4 pb-2.5">
                  <p className="text-[10px] text-gray-400 font-medium">
                    {filteredPembelian.length} dari {pembelian.length} item ditemukan
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Filter Chips */}
          <FilterChips
            pembelian={pembelian}
            activeKategori={activeKategori}
            onFilter={setActiveKategori}
          />

          {/* Active filter chips */}
          {isFiltered && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeKategori !== 'all' && (
                <span className="inline-flex items-center gap-1.5 text-[11px]
                  bg-rose-50 text-rose-700 pl-2.5 pr-1.5 py-1 rounded-full font-medium">
                  🏷️ {activeKategori}
                  <button
                    onClick={() => setActiveKategori('all')}
                    className="p-0.5 hover:bg-rose-200 rounded-full cursor-pointer transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 text-[11px]
                  bg-amber-50 text-amber-700 pl-2.5 pr-1.5 py-1 rounded-full font-medium">
                  🔍 "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-amber-200 rounded-full cursor-pointer transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====== CONTENT ====== */}
      {isLoadingInitial ? (
        <SkeletonList />
      ) : !hasData ? (
        <EmptyState
          tanggal={tanggal}
          hasFilter={false}
          onAdd={() => setShowForm(true)}
        />
      ) : !hasResults ? (
        <EmptyState
          tanggal={tanggal}
          hasFilter
          onClearFilter={() => {
            setActiveKategori('all')
            setSearchQuery('')
          }}
        />
      ) : (
        <>
          {/* ====== PURCHASE LIST ====== */}
          <PurchaseListSection
            items={filteredPembelian}
            showList={showList}
            onToggle={() => setShowList((prev) => !prev)}
            onDetail={(item) => setDetailItem(item)}
            onDelete={handleDesktopDelete}
            totalLabel={`${filteredPembelian.length} item · ${formatRp(
              filteredPembelian.reduce((a, p) => a + (parseFloat(p.total_harga) || 0), 0)
            )}`}
          />

          {/* ====== KATEGORI BREAKDOWN ====== */}
          {pembelian.length > 1 && (
            <KategoriBreakdown
              pembelian={pembelian}
              totalPengeluaran={totalPengeluaran}
            />
          )}

          {/* ====== INSIGHTS ====== */}
          {pembelian.length > 1 && (
            <InsightsSection
              pembelian={pembelian}
              totalPengeluaran={totalPengeluaran}
            />
          )}

          {/* ====== TOTAL FOOTER ====== */}
          <TotalFooter
            pembelian={pembelian}
            totalPengeluaran={totalPengeluaran}
            tanggal={tanggal}
          />
        </>
      )}

      {/* ====== MOBILE FLOATING BAR ====== */}
      <MobileFloatingBar
        pembelian={pembelian}
        totalPengeluaran={totalPengeluaran}
        tanggal={tanggal}
        onAdd={() => setShowForm(true)}
        onRefresh={fetchPembelian}
      />
    </div>
  )
}