import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Plus, X, Pencil, RefreshCw, Trash2, CheckCircle,
  Package, AlertTriangle, Coffee, TrendingDown,
  ArrowRight, ChevronDown, BarChart3, Zap,
  ShoppingBag, Archive, RotateCcw, PackagePlus,
  Info, Search, Filter, MoreVertical, Eye,
  ArrowUpRight, ArrowDownRight, Minus, Hash
} from 'lucide-react'
import { inputClass, btnPrimary } from '../../utils/helpers'

/* ================================================================
   CONSTANTS
   ================================================================ */

const STOCK_THRESHOLD_LOW = 0.2
const STOCK_THRESHOLD_WARN = 0.4

const STOCK_STATUS = {
  CRITICAL: { label: 'Habis', color: 'red', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
  LOW: { label: 'Hampir Habis', color: 'red', bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
  WARNING: { label: 'Menipis', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  NORMAL: { label: 'Aman', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  FULL: { label: 'Penuh', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
}

const EMPTY_FORM = { nama_cup: '', stok_awal: '', stok_sekarang: '' }

const QUICK_RESTOCK_AMOUNTS = [25, 50, 100, 200, 500]

/* ================================================================
   HELPERS
   ================================================================ */

const getStockStatus = (cup) => {
  if (cup.stok_sekarang <= 0) return STOCK_STATUS.CRITICAL
  if (cup.stok_sekarang < cup.stok_awal * STOCK_THRESHOLD_LOW) return STOCK_STATUS.LOW
  if (cup.stok_sekarang < cup.stok_awal * STOCK_THRESHOLD_WARN) return STOCK_STATUS.WARNING
  if (cup.stok_sekarang >= cup.stok_awal) return STOCK_STATUS.FULL
  return STOCK_STATUS.NORMAL
}

const getStockPercentage = (cup) => {
  if (cup.stok_awal <= 0) return 0
  return Math.min(Math.round((cup.stok_sekarang / cup.stok_awal) * 100), 100)
}

const getUsagePercentage = (cup) => {
  if (cup.stok_awal <= 0) return 0
  return Math.min(Math.round((cup.terjual_cup / cup.stok_awal) * 100), 100)
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
      <div className={`${bg} text-white px-5 py-3 rounded-2xl shadow-2xl
        flex items-center gap-2.5 text-sm font-medium min-w-[260px]`}>
        {icon}
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   SKELETON LOADERS
   ================================================================ */

function SkeletonPulse({ className = '' }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
}

function SkeletonStatCards() {
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

function SkeletonCupCards() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <SkeletonPulse className="w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="w-24 h-4" />
              <SkeletonPulse className="w-16 h-2.5" />
            </div>
            <SkeletonPulse className="w-16 h-6 rounded-full" />
          </div>
          <SkeletonPulse className="w-full h-2.5 rounded-full mb-3" />
          <div className="grid grid-cols-3 gap-2">
            <SkeletonPulse className="h-14 rounded-xl" />
            <SkeletonPulse className="h-14 rounded-xl" />
            <SkeletonPulse className="h-14 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================
   STOCK PROGRESS BAR COMPONENT
   ================================================================ */

function StockProgressBar({ cup }) {
  const percentage = getStockPercentage(cup)
  const status = getStockStatus(cup)

  const barColorMap = {
    red: 'from-red-400 to-red-500',
    amber: 'from-amber-400 to-amber-500',
    emerald: 'from-emerald-400 to-emerald-500',
    blue: 'from-blue-400 to-blue-500',
  }

  const trackColorMap = {
    red: 'bg-red-100',
    amber: 'bg-amber-100',
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">
          Sisa Stok
        </span>
        <span className={`text-[10px] font-bold ${status.text}`}>
          {percentage}%
        </span>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${trackColorMap[status.color] || 'bg-gray-100'}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out
            ${barColorMap[status.color] || 'from-gray-400 to-gray-500'}`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  )
}

/* ================================================================
   STATUS BADGE COMPONENT
   ================================================================ */

function StatusBadge({ cup }) {
  const status = getStockStatus(cup)

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold
      px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  )
}

/* ================================================================
   STAT CARD COMPONENT
   ================================================================ */

function StatCard({ label, value, icon: Icon, color, bg, subValue }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm
      hover:shadow-md transition-shadow duration-200">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
        <Icon size={16} className={color} />
      </div>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-extrabold text-gray-900 mt-0.5 leading-tight">
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
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden animate-slideUp">
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center
            justify-center mx-auto mb-4`}>
            <Icon size={24} className={iconColor} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          {subMessage && (
            <p className="text-xs text-gray-400 mt-1.5">{subMessage}</p>
          )}
        </div>

        {/* Actions */}
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
              <div className="w-5 h-5 border-2 border-white/30 border-t-white
                rounded-full animate-spin" />
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
   CUP FORM MODAL COMPONENT
   ================================================================ */

function CupFormModal({ isEditing, form, loading, onChange, onSubmit, onClose }) {
  const nameRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      nameRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const updateField = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: value }))
  }

  const handleStokAwalChange = (value) => {
    onChange((prev) => ({
      ...prev,
      stok_awal: value,
      stok_sekarang: isEditing ? prev.stok_sekarang : value,
    }))
  }

  const isValid = form.nama_cup.trim() && form.stok_awal && parseInt(form.stok_awal) >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp">
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${isEditing ? 'bg-blue-100' : 'bg-emerald-100'}`}>
              {isEditing
                ? <Pencil size={18} className="text-blue-600" />
                : <Plus size={18} className="text-emerald-600" />
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditing ? 'Edit Cup' : 'Tambah Cup Baru'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEditing ? 'Ubah informasi cup' : 'Isi data cup yang akan ditambahkan'}
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
        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Nama Cup */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Nama Cup
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.nama_cup}
              onChange={(e) => updateField('nama_cup', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-base focus:border-blue-400 focus:ring-2
                focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="Contoh: Cup 16oz, Cup 22oz..."
              required
            />
          </div>

          {/* Stok Awal */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Stok Awal
            </label>
            <input
              type="number"
              value={form.stok_awal}
              onChange={(e) => handleStokAwalChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-base focus:border-blue-400 focus:ring-2
                focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="Jumlah awal cup"
              min="0"
              required
            />
          </div>

          {/* Stok Sekarang */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Stok Sekarang
            </label>
            <input
              type="number"
              value={form.stok_sekarang}
              onChange={(e) => updateField('stok_sekarang', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-base focus:border-blue-400 focus:ring-2
                focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="Jumlah sisa saat ini"
              min="0"
              required
            />
          </div>

          {/* Preview */}
          {form.stok_awal && form.stok_sekarang && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Preview
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Terpakai</span>
                <span className="text-sm font-bold text-gray-900">
                  {Math.max(0, (parseInt(form.stok_awal) || 0) - (parseInt(form.stok_sekarang) || 0))} cup
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500
                    transition-all duration-500"
                  style={{
                    width: `${
                      parseInt(form.stok_awal) > 0
                        ? Math.min(
                            Math.round(
                              ((parseInt(form.stok_sekarang) || 0) / parseInt(form.stok_awal)) * 100
                            ),
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98] transition-transform"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !isValid}
            className={`flex-[2] py-3.5 rounded-xl font-semibold text-white
              cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed transition-all
              ${isEditing ? 'bg-blue-600' : 'bg-emerald-600'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white
                rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={16} />
                {isEditing ? 'Simpan Perubahan' : 'Tambah Cup'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   RESTOCK MODAL COMPONENT
   ================================================================ */

function RestockModal({ cup, loading, onRestock, onClose }) {
  const [amount, setAmount] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const parsedAmount = parseInt(amount) || 0
  const newTotal = cup.stok_sekarang + parsedAmount
  const isValid = parsedAmount > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp">
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <PackagePlus size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Restock Cup</h3>
              <p className="text-xs text-gray-400 mt-0.5">{cup.nama_cup}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Current Stock Info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Stok Awal', value: cup.stok_awal, bg: 'bg-gray-50', color: 'text-gray-700' },
              { label: 'Terjual', value: cup.terjual_cup, bg: 'bg-amber-50', color: 'text-amber-700' },
              { label: 'Sisa', value: cup.stok_sekarang, bg: 'bg-blue-50', color: 'text-blue-700' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                <p className="text-[10px] text-gray-400 font-medium mb-0.5">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Jumlah Restock
            </label>
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-4
                text-gray-800 text-2xl font-bold text-center focus:border-emerald-400
                focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
              placeholder="0"
              min="1"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Jumlah Cepat
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_RESTOCK_AMOUNTS.map((qty) => (
                <button
                  key={qty}
                  onClick={() => setAmount(qty.toString())}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
                    transition-all duration-150 active:scale-95 min-w-[56px]
                    ${parsedAmount === qty
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Result */}
          {isValid && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-2">
                Hasil Restock
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-600">Sisa sekarang</span>
                  <span className="text-sm text-emerald-700">{cup.stok_sekarang}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-600">Ditambahkan</span>
                  <span className="text-sm font-bold text-emerald-700">+{parsedAmount}</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-700">Total baru</span>
                  <span className="text-xl font-extrabold text-emerald-800">{newTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98] transition-transform"
          >
            Batal
          </button>
          <button
            onClick={() => onRestock(parsedAmount)}
            disabled={loading || !isValid}
            className="flex-[2] py-3.5 rounded-xl font-semibold bg-emerald-600
              text-white cursor-pointer active:scale-[0.98] flex items-center
              justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white
                rounded-full animate-spin" />
            ) : (
              <>
                <PackagePlus size={16} />
                Restock +{parsedAmount || 0}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   CUP DETAIL MODAL (MOBILE)
   ================================================================ */

function CupDetailModal({ cup, menu, loading, onClose, onEdit, onRestock, onReset, onDelete }) {
  const status = getStockStatus(cup)
  const percentage = getStockPercentage(cup)
  const usagePercent = getUsagePercentage(cup)

  // Count menus using this cup
  const linkedMenus = useMemo(
    () => menu.filter((m) => m.id_cup === cup.id_cup),
    [menu, cup.id_cup]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slideUp">
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Package size={22} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{cup.nama_cup}</h3>
                <StatusBadge cup={cup} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Stat Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Stok Awal', value: cup.stok_awal, bg: 'bg-gray-50', color: 'text-gray-700' },
              { label: 'Terjual', value: cup.terjual_cup, bg: 'bg-amber-50', color: 'text-amber-700' },
              {
                label: 'Sisa',
                value: cup.stok_sekarang,
                bg: status.bg,
                color: status.text,
              },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-3 text-center`}>
                <p className="text-[10px] text-gray-400 font-medium mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-400">cup</p>
              </div>
            ))}
          </div>

          {/* Stock Progress */}
          <div className="bg-gray-50 rounded-xl p-4">
            <StockProgressBar cup={cup} />
          </div>

          {/* Details List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Tingkat Pemakaian</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{usagePercent}%</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Coffee size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Menu Terkait</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">
                {linkedMenus.length} menu
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">ID Cup</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">#{cup.id_cup}</span>
            </div>
          </div>

          {/* Linked Menus */}
          {linkedMenus.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Menu Menggunakan Cup Ini
              </p>
              <div className="space-y-1">
                {linkedMenus.map((m) => (
                  <div key={m.id_menu}
                    className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-lg">
                    <Coffee size={12} className="text-blue-400" />
                    <span className="text-xs font-medium text-blue-700">{m.nama_item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Primary row */}
          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); onRestock(cup) }}
              className="flex-1 py-3.5 rounded-xl font-semibold flex items-center
                justify-center gap-2 bg-emerald-600 text-white cursor-pointer
                active:scale-[0.98] transition-transform"
            >
              <PackagePlus size={15} />
              Restock
            </button>
            <button
              onClick={() => { onClose(); onEdit(cup) }}
              className="flex-1 py-3.5 rounded-xl font-semibold flex items-center
                justify-center gap-2 bg-blue-600 text-white cursor-pointer
                active:scale-[0.98] transition-transform"
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>

          {/* Secondary row */}
          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); onReset(cup) }}
              className="flex-1 py-3 rounded-xl font-semibold flex items-center
                justify-center gap-2 bg-amber-50 text-amber-600 cursor-pointer
                active:scale-[0.98] transition-transform text-sm"
            >
              <RotateCcw size={14} />
              Reset Counter
            </button>
            <button
              onClick={() => { onClose(); onDelete(cup) }}
              className="py-3 px-5 rounded-xl font-semibold flex items-center
                justify-center bg-red-50 text-red-500 cursor-pointer
                active:scale-[0.98] transition-transform"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   CUP CARD COMPONENT
   ================================================================ */

function CupCard({ cup, menu, onDetail, onEdit, onRestock, onReset, onDelete }) {
  const status = getStockStatus(cup)
  const percentage = getStockPercentage(cup)
  const linkedMenuCount = menu.filter((m) => m.id_cup === cup.id_cup).length

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm
        hover:shadow-md transition-all duration-200 overflow-hidden
        cursor-pointer lg:cursor-default active:bg-gray-50 group"
      onClick={() => { if (window.innerWidth < 1024) onDetail(cup) }}
    >
      <div className="p-4">
        {/* Top Row: Icon + Name + Status */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
            ${status.color === 'red' ? 'bg-red-100' :
              status.color === 'amber' ? 'bg-amber-100' :
              status.color === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100'
            }`}
          >
            <Package
              size={22}
              className={
                status.color === 'red' ? 'text-red-500' :
                status.color === 'amber' ? 'text-amber-500' :
                status.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {cup.nama_cup}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-gray-400">
                {linkedMenuCount} menu
              </span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">
                ID #{cup.id_cup}
              </span>
            </div>
          </div>

          <StatusBadge cup={cup} />
        </div>

        {/* Progress Bar */}
        <StockProgressBar cup={cup} />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'Stok Awal', value: cup.stok_awal, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Terjual', value: cup.terjual_cup, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
            {
              label: 'Sisa',
              value: cup.stok_sekarang,
              icon: Package,
              color: status.text,
              bg: status.bg,
            },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-xl p-2.5 text-center`}>
              <stat.icon size={12} className={`${stat.color} mx-auto mb-1`} />
              <p className="text-[9px] text-gray-400 font-medium">{stat.label}</p>
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); onRestock(cup) }}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center
              justify-center gap-1.5 bg-emerald-50 text-emerald-600 cursor-pointer
              hover:bg-emerald-100 active:scale-[0.98] transition-all"
          >
            <PackagePlus size={13} />
            Restock
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(cup) }}
            className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-500 cursor-pointer
              hover:bg-blue-100 active:scale-[0.98] transition-all"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReset(cup) }}
            className="py-2.5 px-3 rounded-xl bg-amber-50 text-amber-500 cursor-pointer
              hover:bg-amber-100 active:scale-[0.98] transition-all"
            title="Reset Counter"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(cup) }}
            className="py-2.5 px-3 rounded-xl bg-red-50 text-red-500 cursor-pointer
              hover:bg-red-100 active:scale-[0.98] transition-all"
            title="Hapus"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Mobile arrow indicator */}
        <div className="lg:hidden flex items-center justify-center mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
            Ketuk untuk detail
            <ArrowRight size={10} className="text-gray-300" />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   EMPTY STATE COMPONENT
   ================================================================ */

function EmptyState({ onAdd }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-sm">Belum ada cup</p>
      <p className="text-gray-300 text-xs mt-1.5 max-w-[240px] mx-auto leading-relaxed">
        Tambahkan jenis cup terlebih dahulu untuk mulai mencatat inventory
      </p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white
          bg-emerald-600 px-6 py-3 rounded-xl cursor-pointer active:scale-[0.98]
          transition-transform shadow-sm"
      >
        <Plus size={16} />
        Tambah Cup Pertama
      </button>
    </div>
  )
}

/* ================================================================
   SUMMARY STATS SECTION
   ================================================================ */

function SummaryStats({ cups }) {
  const stats = useMemo(() => {
    const totalStokAwal = cups.reduce((acc, c) => acc + (c.stok_awal || 0), 0)
    const totalTerjual = cups.reduce((acc, c) => acc + (c.terjual_cup || 0), 0)
    const totalSisa = cups.reduce((acc, c) => acc + (c.stok_sekarang || 0), 0)
    const lowStockCount = cups.filter(
      (c) => c.stok_sekarang < c.stok_awal * STOCK_THRESHOLD_LOW
    ).length

    return { totalStokAwal, totalTerjual, totalSisa, lowStockCount }
  }, [cups])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Jenis Cup"
        value={cups.length}
        icon={Package}
        color="text-blue-500"
        bg="bg-blue-50"
        subValue="tipe tersedia"
      />
      <StatCard
        label="Total Stok Awal"
        value={stats.totalStokAwal}
        icon={Archive}
        color="text-gray-500"
        bg="bg-gray-100"
        subValue="cup awal"
      />
      <StatCard
        label="Total Terjual"
        value={stats.totalTerjual}
        icon={TrendingDown}
        color="text-amber-500"
        bg="bg-amber-50"
        subValue="cup terpakai"
      />
      <StatCard
        label="Sisa Stok"
        value={stats.totalSisa}
        icon={ShoppingBag}
        color={stats.lowStockCount > 0 ? 'text-red-500' : 'text-emerald-500'}
        bg={stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}
        subValue={
          stats.lowStockCount > 0
            ? `⚠️ ${stats.lowStockCount} stok rendah`
            : 'semua aman'
        }
      />
    </div>
  )
}

/* ================================================================
   STOCK ALERTS COMPONENT
   ================================================================ */

function StockAlerts({ cups }) {
  const alerts = useMemo(() => {
    return cups
      .filter((c) => c.stok_sekarang <= 0 || c.stok_sekarang < c.stok_awal * STOCK_THRESHOLD_LOW)
      .sort((a, b) => a.stok_sekarang - b.stok_sekarang)
  }, [cups])

  if (alerts.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertTriangle size={15} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-700">Peringatan Stok</h3>
          <p className="text-[10px] text-red-400 mt-0.5">
            {alerts.length} cup membutuhkan restock
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {alerts.map((cup) => {
          const status = getStockStatus(cup)
          return (
            <div
              key={cup.id_cup}
              className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                <span className="text-xs font-semibold text-gray-800">
                  {cup.nama_cup}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${status.text}`}>
                  {cup.stok_sekarang} sisa
                </span>
                <span className="text-[10px] text-gray-400">
                  / {cup.stok_awal}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT: CupTab
   ================================================================ */

export default function CupTab({ cups, menu, fetchCups, msg }) {
  /* --------------------------------
     State Management
     -------------------------------- */
  const [cupForm, setCupForm] = useState({ ...EMPTY_FORM })
  const [editingCup, setEditingCup] = useState(null)
  const [showCupForm, setShowCupForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Modal states
  const [restockCup, setRestockCup] = useState(null)
  const [detailCup, setDetailCup] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  /* --------------------------------
     Toast Helper
     -------------------------------- */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  /* --------------------------------
     Filtered & Sorted Cups
     -------------------------------- */
  const filteredCups = useMemo(() => {
    if (!searchQuery.trim()) return cups

    const query = searchQuery.toLowerCase()
    return cups.filter((cup) =>
      cup.nama_cup.toLowerCase().includes(query)
    )
  }, [cups, searchQuery])

  const sortedCups = useMemo(() => {
    return [...filteredCups].sort((a, b) => {
      // Sort by stock status (critical first)
      const aRatio = a.stok_awal > 0 ? a.stok_sekarang / a.stok_awal : 1
      const bRatio = b.stok_awal > 0 ? b.stok_sekarang / b.stok_awal : 1
      return aRatio - bRatio
    })
  }, [filteredCups])

  /* --------------------------------
     CRUD Handlers
     -------------------------------- */
  const handleAddCup = useCallback(
    async (e) => {
      if (e) e.preventDefault()
      setLoading(true)

      try {
        const { error } = await supabase.from('inventory_cup').insert({
          nama_cup: cupForm.nama_cup.trim(),
          stok_awal: parseInt(cupForm.stok_awal),
          stok_sekarang: parseInt(cupForm.stok_sekarang || cupForm.stok_awal),
          terjual_cup: 0,
        })

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`${cupForm.nama_cup} berhasil ditambahkan!`)
          msg('Cup berhasil ditambah!')
          setCupForm({ ...EMPTY_FORM })
          setShowCupForm(false)
          fetchCups()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [cupForm, fetchCups, msg, showToast]
  )

  const handleUpdateCup = useCallback(
    async (e) => {
      if (e) e.preventDefault()
      if (!editingCup) return
      setLoading(true)

      try {
        const { error } = await supabase
          .from('inventory_cup')
          .update({
            nama_cup: cupForm.nama_cup.trim(),
            stok_awal: parseInt(cupForm.stok_awal),
            stok_sekarang: parseInt(cupForm.stok_sekarang),
          })
          .eq('id_cup', editingCup.id_cup)

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`${cupForm.nama_cup} berhasil diperbarui!`)
          msg('Cup diupdate!')
          setCupForm({ ...EMPTY_FORM })
          setEditingCup(null)
          setShowCupForm(false)
          fetchCups()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [cupForm, editingCup, fetchCups, msg, showToast]
  )

  const handleFormSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault()
      if (editingCup) {
        handleUpdateCup(e)
      } else {
        handleAddCup(e)
      }
    },
    [editingCup, handleUpdateCup, handleAddCup]
  )

  const handleDeleteCup = useCallback(
    (cup) => {
      const linkedMenus = menu.filter((m) => m.id_cup === cup.id_cup)

      if (linkedMenus.length > 0) {
        showToast(
          `Tidak bisa hapus: ${linkedMenus.length} menu masih menggunakan cup ini`,
          'error'
        )
        msg(`Ada ${linkedMenus.length} menu pakai cup ini!`, false)
        return
      }

      setConfirmModal({
        type: 'delete',
        cup,
        title: 'Hapus Cup?',
        message: `"${cup.nama_cup}" akan dihapus secara permanen dari inventory.`,
        subMessage: 'Tindakan ini tidak bisa dikembalikan.',
        confirmLabel: 'Ya, Hapus',
        confirmColor: 'bg-red-500',
        icon: Trash2,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-100',
      })
    },
    [menu, msg, showToast]
  )

  const confirmDeleteCup = useCallback(async () => {
    if (!confirmModal?.cup) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('inventory_cup')
        .delete()
        .eq('id_cup', confirmModal.cup.id_cup)

      if (error) {
        showToast(error.message, 'error')
        msg(error.message, false)
      } else {
        showToast(`${confirmModal.cup.nama_cup} berhasil dihapus!`)
        msg('Cup dihapus!')
        setConfirmModal(null)
        fetchCups()
      }
    } catch (err) {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
    }
  }, [confirmModal, fetchCups, msg, showToast])

  const handleQuickRestock = useCallback(
    async (amount) => {
      if (!restockCup || amount <= 0) {
        showToast('Jumlah tidak valid!', 'error')
        return
      }
      setLoading(true)

      try {
        const { error } = await supabase
          .from('inventory_cup')
          .update({
            stok_awal: restockCup.stok_awal + amount,
            stok_sekarang: restockCup.stok_sekarang + amount,
            terjual_cup: 0,
          })
          .eq('id_cup', restockCup.id_cup)

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`+${amount} ${restockCup.nama_cup} berhasil di-restock!`)
          msg(`+${amount} ${restockCup.nama_cup}!`)
          setRestockCup(null)
          fetchCups()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [restockCup, fetchCups, msg, showToast]
  )

  const handleResetCounter = useCallback(
    (cup) => {
      setConfirmModal({
        type: 'reset',
        cup,
        title: 'Reset Counter?',
        message: `Stok awal "${cup.nama_cup}" akan di-set ke sisa saat ini (${cup.stok_sekarang}), dan counter terjual di-reset ke 0.`,
        subMessage: 'Biasanya dilakukan di awal hari baru.',
        confirmLabel: 'Reset Counter',
        confirmColor: 'bg-amber-500',
        icon: RotateCcw,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-100',
      })
    },
    []
  )

  const confirmResetCounter = useCallback(async () => {
    if (!confirmModal?.cup) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('inventory_cup')
        .update({
          stok_awal: confirmModal.cup.stok_sekarang,
          terjual_cup: 0,
        })
        .eq('id_cup', confirmModal.cup.id_cup)

      if (error) {
        showToast(error.message, 'error')
        msg(error.message, false)
      } else {
        showToast(`Counter ${confirmModal.cup.nama_cup} berhasil di-reset!`)
        msg('Counter direset!')
        setConfirmModal(null)
        fetchCups()
      }
    } catch (err) {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
    }
  }, [confirmModal, fetchCups, msg, showToast])

  const handleConfirmAction = useCallback(() => {
    if (confirmModal?.type === 'delete') {
      confirmDeleteCup()
    } else if (confirmModal?.type === 'reset') {
      confirmResetCounter()
    }
  }, [confirmModal, confirmDeleteCup, confirmResetCounter])

  /* --------------------------------
     UI Handlers
     -------------------------------- */
  const startAddCup = useCallback(() => {
    setShowCupForm(true)
    setEditingCup(null)
    setCupForm({ ...EMPTY_FORM })
  }, [])

  const startEditCup = useCallback((cup) => {
    setEditingCup(cup)
    setCupForm({
      nama_cup: cup.nama_cup,
      stok_awal: cup.stok_awal.toString(),
      stok_sekarang: cup.stok_sekarang.toString(),
    })
    setShowCupForm(true)
    setDetailCup(null)
  }, [])

  const closeForm = useCallback(() => {
    setShowCupForm(false)
    setEditingCup(null)
    setCupForm({ ...EMPTY_FORM })
  }, [])

  const openRestock = useCallback((cup) => {
    setRestockCup(cup)
    setDetailCup(null)
  }, [])

  const openDetail = useCallback((cup) => {
    setDetailCup(cup)
  }, [])

  /* --------------------------------
     Computed
     -------------------------------- */
  const hasData = cups.length > 0
  const hasSearchResults = filteredCups.length > 0

  /* --------------------------------
     Render
     -------------------------------- */
  return (
    <div className="space-y-5 pb-8">
      {/* ====== TOAST ====== */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

      {/* ====== CUP FORM MODAL ====== */}
      {showCupForm && (
        <CupFormModal
          isEditing={!!editingCup}
          form={cupForm}
          loading={loading}
          onChange={setCupForm}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
        />
      )}

      {/* ====== RESTOCK MODAL ====== */}
      {restockCup && (
        <RestockModal
          cup={restockCup}
          loading={loading}
          onRestock={handleQuickRestock}
          onClose={() => setRestockCup(null)}
        />
      )}

      {/* ====== CONFIRM MODAL ====== */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          subMessage={confirmModal.subMessage}
          confirmLabel={confirmModal.confirmLabel}
          confirmColor={confirmModal.confirmColor}
          icon={confirmModal.icon}
          iconColor={confirmModal.iconColor}
          iconBg={confirmModal.iconBg}
          loading={loading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* ====== DETAIL MODAL (MOBILE) ====== */}
      {detailCup && (
        <CupDetailModal
          cup={detailCup}
          menu={menu}
          loading={loading}
          onClose={() => setDetailCup(null)}
          onEdit={startEditCup}
          onRestock={openRestock}
          onReset={handleResetCounter}
          onDelete={handleDeleteCup}
        />
      )}

      {/* ====== PAGE HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📦 Kelola Cup</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Inventory cup — tambah, restock & pantau stok
          </p>
        </div>
        <button
          onClick={startAddCup}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900
            text-white text-sm font-semibold rounded-xl cursor-pointer
            active:scale-[0.97] shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Tambah Cup</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* ====== SUMMARY STATS ====== */}
      {hasData && <SummaryStats cups={cups} />}

      {/* ====== STOCK ALERTS ====== */}
      {hasData && <StockAlerts cups={cups} />}

      {/* ====== SEARCH BAR ====== */}
      {hasData && cups.length > 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cup..."
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
                {filteredCups.length} dari {cups.length} cup ditemukan
              </p>
            </div>
          )}
        </div>
      )}

      {/* ====== CUP LIST ====== */}
      {!hasData ? (
        <EmptyState onAdd={startAddCup} />
      ) : !hasSearchResults ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-semibold text-sm">Tidak ditemukan</p>
          <p className="text-gray-300 text-xs mt-1">
            Tidak ada cup dengan kata kunci "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-xs font-semibold text-blue-600 bg-blue-50
              px-4 py-2 rounded-xl cursor-pointer active:bg-blue-100 transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCups.map((cup) => (
            <CupCard
              key={cup.id_cup}
              cup={cup}
              menu={menu}
              onDetail={openDetail}
              onEdit={startEditCup}
              onRestock={openRestock}
              onReset={handleResetCounter}
              onDelete={handleDeleteCup}
            />
          ))}
        </div>
      )}

      {/* ====== INVENTORY FOOTER ====== */}
      {hasData && (
        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">
                Total Inventory
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {cups.length} jenis cup tercatat
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">
                {cups.reduce((a, c) => a + (c.stok_sekarang || 0), 0)}
              </p>
              <p className="text-[10px] text-gray-500">cup tersedia</p>
            </div>
          </div>

          {/* Additional info bar */}
          <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Archive size={12} className="text-gray-500" />
                <span className="text-[11px] text-gray-400">
                  {cups.reduce((a, c) => a + (c.stok_awal || 0), 0)} stok awal
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-gray-500" />
                <span className="text-[11px] text-gray-400">
                  {cups.reduce((a, c) => a + (c.terjual_cup || 0), 0)} terjual
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {cups.some((c) => c.stok_sekarang < c.stok_awal * STOCK_THRESHOLD_LOW) ? (
                <>
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-[11px] font-semibold text-red-400">
                    Perlu restock
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Stok aman
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}