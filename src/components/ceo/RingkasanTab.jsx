// components/ceo/RingkasanTab.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  RefreshCw, TrendingUp, Trash2, Pencil, X,
  Calendar, Coffee, DollarSign, Receipt, AlertTriangle,
  CheckCircle, ChevronDown, BarChart3,
  ChevronLeft, ChevronRight, Flame, Clock, Hash,
  Package, ArrowRight, Info, TrendingDown,
  ShoppingBag, Zap, Sun, Moon, Sunrise, Sunset,
  Filter, Eye, EyeOff, MoreHorizontal,
  CalendarDays, CalendarRange, Search, ArrowUpRight
} from 'lucide-react'
import { rp } from '../../utils/helpers'

/* ================================================================
   CONSTANTS
   ================================================================ */

const MEDALS = ['🥇', '🥈', '🥉']

const BAR_COLORS = [
  ['#f59e0b', '#d97706'],
  ['#8b5cf6', '#7c3aed'],
  ['#f97316', '#ea580c'],
  ['#06b6d4', '#0891b2'],
  ['#ec4899', '#db2777'],
  ['#10b981', '#059669'],
  ['#6366f1', '#4f46e5'],
  ['#14b8a6', '#0d9488'],
]

const INITIAL_BREAKDOWN_LIMIT = 5
const TRANSACTION_FETCH_LIMIT = 1000

const TIME_PERIODS = [
  { label: 'Pagi', icon: Sunrise, range: [6, 11], color: 'amber' },
  { label: 'Siang', icon: Sun, range: [11, 15], color: 'orange' },
  { label: 'Sore', icon: Sunset, range: [15, 18], color: 'rose' },
  { label: 'Malam', icon: Moon, range: [18, 24], color: 'indigo' },
]

/* ================================================================
   DATE MODE: 'single' | 'range'
   ================================================================ */

const DATE_MODE_SINGLE = 'single'
const DATE_MODE_RANGE = 'range'

/* ================================================================
   DATE HELPERS
   ================================================================ */

const getToday = () => new Date().toISOString().split('T')[0]

const getYesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

const getDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const getMonthStart = (offset = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() + offset, 1)
  return d.toISOString().split('T')[0]
}

const getMonthEnd = (offset = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() + offset + 1, 0)
  return d.toISOString().split('T')[0]
}

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDateShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatDateFull = (dateStr) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatDayLabel = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatDayShort = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

const navigateDate = (currentDate, direction) => {
  if (!currentDate) return currentDate
  const d = new Date(currentDate)
  d.setDate(d.getDate() + direction)
  return d.toISOString().split('T')[0]
}

const getHourFromDate = (dateStr) => new Date(dateStr).getHours()

const countDaysBetween = (start, end) => {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
}

/* ================================================================
   TOAST NOTIFICATION COMPONENT
   ================================================================ */

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const config = {
    success: {
      bg: 'bg-emerald-600',
      icon: <CheckCircle size={16} />,
    },
    error: {
      bg: 'bg-red-600',
      icon: <AlertTriangle size={16} />,
    },
    info: {
      bg: 'bg-blue-600',
      icon: <Info size={16} />,
    },
  }

  const { bg, icon } = config[type] || config.info

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
      <div
        className={`${bg} text-white px-5 py-3 rounded-2xl shadow-2xl
          flex items-center gap-2.5 text-sm font-medium min-w-[240px]`}
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
   SKELETON LOADER COMPONENTS
   ================================================================ */

function SkeletonPulse({ className = '' }) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  )
}

function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm"
        >
          <SkeletonPulse className="w-8 h-8 rounded-lg mb-2" />
          <SkeletonPulse className="w-16 h-2.5 mb-2" />
          <SkeletonPulse className="w-20 h-5" />
        </div>
      ))}
    </div>
  )
}

function SkeletonBreakdown() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2.5">
        <SkeletonPulse className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <SkeletonPulse className="w-32 h-3.5" />
          <SkeletonPulse className="w-20 h-2.5" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2.5">
            <SkeletonPulse className="w-7 h-7 rounded-lg" />
            <SkeletonPulse className="flex-1 h-3.5" />
            <SkeletonPulse className="w-20 h-3.5" />
          </div>
          <div className="ml-9.5 pl-0.5">
            <SkeletonPulse className="w-full h-3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonTransactions() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-2.5">
        <SkeletonPulse className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <SkeletonPulse className="w-28 h-3.5" />
          <SkeletonPulse className="w-16 h-2.5" />
        </div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="w-36 h-3.5" />
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
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}
      >
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
   BREAKDOWN ITEM COMPONENT
   ================================================================ */

function BreakdownItem({ item, index, maxJumlah, totalCup }) {
  const percentage =
    totalCup > 0 ? Math.round((item.jumlah / totalCup) * 100) : 0
  const barWidth = Math.round((item.jumlah / maxJumlah) * 100)
  const [color1, color2] = BAR_COLORS[index % BAR_COLORS.length]
  const isTopThree = index < 3

  const percentageBadgeClass = useMemo(() => {
    if (percentage >= 25) return 'bg-emerald-100 text-emerald-600'
    if (percentage >= 10) return 'bg-amber-100 text-amber-600'
    return 'bg-gray-100 text-gray-400'
  }, [percentage])

  return (
    <div className={`py-3 ${index > 0 ? 'border-t border-gray-50' : ''}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center
            flex-shrink-0 text-xs font-bold ${
              isTopThree
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
        >
          {isTopThree ? MEDALS[index] : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-800 truncate">
              {item.nama}
            </span>
            {item.cupType && (
              <span
                className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold
                  flex-shrink-0 ${
                    item.idCup === 2
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
              >
                {item.cupType}
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-sm font-bold text-gray-900">
            {rp(item.pendapatan)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-9.5 pl-0.5">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${barWidth}%`,
              background: `linear-gradient(90deg, ${color1}, ${color2})`,
            }}
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 text-[11px]">
          <span className="font-extrabold text-gray-800">{item.jumlah}</span>
          <span className="text-gray-400">cup</span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${percentageBadgeClass}`}
          >
            {percentage}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-9.5 pl-0.5 mt-1">
        <span className="text-[10px] text-gray-400">
          {item.count}x transaksi
        </span>
        <span className="text-[10px] text-gray-300">·</span>
        <span className="text-[10px] text-gray-400">@ {rp(item.harga)}</span>
        {item.avgPerTransaction > 0 && (
          <>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">
              ~{item.avgPerTransaction.toFixed(1)} cup/trx
            </span>
          </>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   TRANSACTION ROW COMPONENT
   ================================================================ */

function TransactionRow({ trx, isLast, onDetail, onEdit, onDelete, showDate }) {
  const cupTypeClass =
    trx.menu_jualan?.id_cup === 2
      ? 'bg-purple-50 text-purple-400'
      : 'bg-blue-50 text-blue-400'

  const cupBadgeClass =
    trx.menu_jualan?.id_cup === 2
      ? 'bg-purple-50 text-purple-500'
      : 'bg-blue-50 text-blue-500'

  const iconBgClass =
    trx.menu_jualan?.id_cup === 2 ? 'bg-purple-50' : 'bg-blue-50'

  const iconColorClass =
    trx.menu_jualan?.id_cup === 2 ? 'text-purple-400' : 'text-blue-400'

  return (
    <div
      className={`px-4 py-3 active:bg-gray-50 group cursor-pointer lg:cursor-default
        transition-colors duration-150 ${
          !isLast ? 'border-b border-gray-50' : ''
        }`}
      onClick={() => {
        if (window.innerWidth < 1024) onDetail(trx)
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center
            flex-shrink-0 ${iconBgClass}`}
        >
          <Coffee size={16} className={iconColorClass} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {trx.menu_jualan?.nama_item || 'Menu tidak ditemukan'}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {showDate && (
              <span className="text-[10px] text-gray-500 font-medium">
                {formatDateShort(trx.tanggal_jam)}
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {formatTime(trx.tanggal_jam)}
            </span>
            <span
              className="text-[10px] bg-gray-100 text-gray-600
              px-1.5 py-0.5 rounded font-semibold"
            >
              {trx.jumlah_beli} cup
            </span>
            {trx.menu_jualan?.inventory_cup?.nama_cup && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded
                  font-medium ${cupBadgeClass}`}
              >
                {trx.menu_jualan.inventory_cup.nama_cup}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-gray-900">
            {rp(trx.total_bayar)}
          </span>

          <div
            className="hidden lg:flex items-center gap-1
            opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(trx)
              }}
              className="p-1.5 bg-blue-50 text-blue-500 rounded-lg
                cursor-pointer hover:bg-blue-100 transition-colors"
              title="Edit transaksi"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(trx)
              }}
              className="p-1.5 bg-red-50 text-red-500 rounded-lg
                cursor-pointer hover:bg-red-100 transition-colors"
              title="Hapus transaksi"
            >
              <Trash2 size={12} />
            </button>
          </div>

          <ArrowRight size={14} className="text-gray-300 lg:hidden" />
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   DATE GROUP HEADER COMPONENT
   ================================================================ */

function DateGroupHeader({ date, items }) {
  const dateTotal = items.reduce(
    (acc, t) => acc + (parseFloat(t.total_bayar) || 0),
    0
  )
  const dateCup = items.reduce((acc, t) => acc + (t.jumlah_beli || 0), 0)
  const dateObj = new Date(date + 'T12:00:00')

  return (
    <div
      className="px-4 py-2.5 bg-gray-50 border-y border-gray-100
      flex items-center justify-between sticky top-0 z-10"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-700">
          {dateObj.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <span className="text-[10px] text-gray-400">
          {items.length} trx · {dateCup} cup
        </span>
      </div>
      <span className="text-xs font-bold text-emerald-600">
        {rp(dateTotal)}
      </span>
    </div>
  )
}

/* ================================================================
   TIME DISTRIBUTION COMPONENT
   ================================================================ */

function TimeDistribution({ transaksi }) {
  const distribution = useMemo(() => {
    return TIME_PERIODS.map((period) => {
      const [start, end] = period.range
      const filtered = transaksi.filter((trx) => {
        const hour = getHourFromDate(trx.tanggal_jam)
        return hour >= start && hour < end
      })
      const totalCup = filtered.reduce(
        (acc, t) => acc + (t.jumlah_beli || 0),
        0
      )
      const totalRevenue = filtered.reduce(
        (acc, t) => acc + (parseFloat(t.total_bayar) || 0),
        0
      )
      return {
        ...period,
        count: filtered.length,
        totalCup,
        totalRevenue,
      }
    })
  }, [transaksi])

  const maxCount = Math.max(...distribution.map((d) => d.count), 1)
  const peakPeriod = distribution.reduce(
    (max, d) => (d.count > max.count ? d : max),
    distribution[0]
  )

  if (transaksi.length === 0) return null

  const colorMap = {
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      bar: 'bg-amber-400',
      icon: 'text-amber-500',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      bar: 'bg-orange-400',
      icon: 'text-orange-500',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      bar: 'bg-rose-400',
      icon: 'text-rose-500',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      bar: 'bg-indigo-400',
      icon: 'text-indigo-500',
    },
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center">
            <Clock size={16} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Distribusi Waktu
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Kapan penjualan paling ramai
            </p>
          </div>
        </div>
        {peakPeriod && peakPeriod.count > 0 && (
          <div className="flex items-center gap-1.5 bg-cyan-50 px-2.5 py-1.5 rounded-lg">
            <Zap size={11} className="text-cyan-500" />
            <span className="text-[10px] font-bold text-cyan-600">
              Peak: {peakPeriod.label}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-3">
        {distribution.map((period, idx) => {
          const barW =
            period.count > 0
              ? Math.max(Math.round((period.count / maxCount) * 100), 4)
              : 0
          const colors = colorMap[period.color]
          const Icon = period.icon
          const isPeak = period === peakPeriod && period.count > 0

          return (
            <div key={idx} className="group">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center
                    justify-center flex-shrink-0 ${colors.bg}`}
                >
                  <Icon size={14} className={colors.icon} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-700">
                        {period.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {period.range[0]}:00 - {period.range[1]}:00
                      </span>
                      {isPeak && (
                        <span
                          className="text-[8px] bg-yellow-100 text-yellow-700
                          px-1.5 py-0.5 rounded-full font-bold"
                        >
                          PEAK
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-700">
                      {period.count > 0
                        ? `${period.count} trx · ${period.totalCup} cup`
                        : '—'}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all
                        duration-700 ease-out ${colors.bar}`}
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   EDIT MODAL COMPONENT
   ================================================================ */

function EditModal({ item, loading, onClose, onSave }) {
  const [form, setForm] = useState({
    jumlah_beli: item.jumlah_beli.toString(),
    tanggal_jam: new Date(item.tanggal_jam).toISOString().slice(0, 16),
  })

  const hargaSatuan = item.menu_jualan?.harga_jual || 0
  const jumlahBaru = parseInt(form.jumlah_beli) || 0
  const totalBaru = jumlahBaru * hargaSatuan

  const handleSubmit = () => {
    if (!form.jumlah_beli || jumlahBaru <= 0) return
    onSave({
      jumlah_beli: jumlahBaru,
      total_bayar: totalBaru,
      tanggal_jam: new Date(form.tanggal_jam).toISOString(),
    })
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
        rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh]
        flex flex-col animate-slideUp"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Pencil size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Edit Transaksi
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.menu_jualan?.nama_item}
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

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Jumlah Beli (cup)
            </label>
            <input
              type="number"
              value={form.jumlah_beli}
              onChange={(e) => updateField('jumlah_beli', e.target.value)}
              min="1"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-base focus:border-blue-400
                focus:ring-2 focus:ring-blue-50 outline-none transition-all"
              placeholder="Masukkan jumlah..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Tanggal & Waktu
            </label>
            <input
              type="datetime-local"
              value={form.tanggal_jam}
              onChange={(e) => updateField('tanggal_jam', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-sm focus:border-blue-400
                focus:ring-2 focus:ring-blue-50 outline-none transition-all"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {form.jumlah_beli || 0} × {rp(hargaSatuan)}
              </span>
              <span className="text-lg font-bold text-gray-900">
                {rp(totalBaru)}
              </span>
            </div>
          </div>
        </div>

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
            disabled={loading || jumlahBaru <= 0}
            className="flex-[2] py-3.5 rounded-xl font-semibold bg-blue-600
              text-white cursor-pointer active:scale-[0.98]
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={16} />
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
   DETAIL MODAL COMPONENT (MOBILE)
   ================================================================ */

function DetailModal({
  item,
  loading,
  confirmDeleteId,
  onClose,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}) {
  if (!item) return null

  const iconBgClass =
    item.menu_jualan?.id_cup === 2 ? 'bg-purple-100' : 'bg-blue-100'
  const iconColorClass =
    item.menu_jualan?.id_cup === 2 ? 'text-purple-500' : 'text-blue-500'

  const statCards = [
    {
      label: 'Jumlah',
      value: item.jumlah_beli,
      sub: 'cup',
      bg: 'bg-amber-50',
      color: 'text-amber-700',
    },
    {
      label: 'Harga',
      value: rp(item.menu_jualan?.harga_jual || 0),
      sub: '/cup',
      bg: 'bg-gray-50',
      color: 'text-gray-700',
    },
    {
      label: 'Total',
      value: rp(item.total_bayar),
      sub: '',
      bg: 'bg-emerald-50',
      color: 'text-emerald-700',
    },
  ]

  const detailRows = [
    { icon: Clock, label: 'Waktu', val: formatTime(item.tanggal_jam) },
    {
      icon: Package,
      label: 'Tipe Cup',
      val: item.menu_jualan?.inventory_cup?.nama_cup || '-',
    },
    { icon: Hash, label: 'ID', val: `#${item.id_transaksi}` },
    {
      icon: Calendar,
      label: 'Tanggal',
      val: formatDateFull(item.tanggal_jam),
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          onClose()
          onCancelDelete()
        }}
      />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
        rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh]
        flex flex-col animate-slideUp"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgClass}`}
              >
                <Coffee size={22} className={iconColorClass} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {item.menu_jualan?.nama_item}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateFull(item.tanggal_jam)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose()
                onCancelDelete()
              }}
              className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((card, i) => (
              <div key={i} className={`${card.bg} rounded-2xl p-3 text-center`}>
                <p className="text-[10px] text-gray-400 font-medium mb-1">
                  {card.label}
                </p>
                <p className={`text-sm font-bold ${card.color}`}>
                  {card.value}
                </p>
                {card.sub && (
                  <p className="text-[10px] text-gray-400">{card.sub}</p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {detailRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <row.icon size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{row.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {row.val}
                </span>
              </div>
            ))}
          </div>

          {confirmDeleteId === item.id_transaksi && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 text-sm">
                    Hapus transaksi ini?
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    Tindakan ini tidak bisa dikembalikan.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onDelete(item.id_transaksi)}
                      disabled={loading}
                      className="px-4 py-2.5 bg-red-500 text-white text-xs
                        font-semibold rounded-xl cursor-pointer min-h-[40px]
                        active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                    <button
                      onClick={onCancelDelete}
                      className="px-4 py-2.5 bg-white text-gray-600 text-xs
                        font-medium rounded-xl cursor-pointer border
                        border-gray-200 min-h-[40px] active:scale-[0.98] transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 py-3.5 rounded-xl font-semibold flex items-center
              justify-center gap-2 bg-blue-600 text-white cursor-pointer
              active:scale-[0.98] transition-transform"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            onClick={() => onConfirmDelete(item.id_transaksi)}
            className="py-3.5 px-5 rounded-xl font-semibold flex items-center
              justify-center bg-red-50 text-red-500 cursor-pointer
              active:scale-[0.98] transition-transform"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   DATE PICKER SECTION - UPDATED WITH DATE RANGE SUPPORT
   ================================================================ */

function DatePickerSection({
  dateMode,
  filterTanggal,
  filterStartDate,
  filterEndDate,
  filterMenu,
  menu,
  onDateModeChange,
  onDateChange,
  onStartDateChange,
  onEndDateChange,
  onApplyRange,
  onMenuChange,
  onNavigate,
  activePreset,
  onPresetClick,
}) {
  const todayStr = getToday()
  const yesterdayStr = getYesterday()
  const isToday = filterTanggal === todayStr
  const isYesterday = filterTanggal === yesterdayStr
  const isSingleMode = dateMode === DATE_MODE_SINGLE

  // Quick buttons for single mode
  const quickButtonsSingle = [
    { label: 'Hari Ini', val: todayStr, active: isToday && isSingleMode },
    { label: 'Kemarin', val: yesterdayStr, active: isYesterday && isSingleMode },
    { label: 'Semua', val: '', active: !filterTanggal && isSingleMode },
  ]

  // Preset buttons for range mode
  const rangePresets = [
    { key: '7d', label: '7 Hari', icon: CalendarDays },
    { key: '30d', label: '30 Hari', icon: CalendarDays },
    { key: 'thisMonth', label: 'Bulan Ini', icon: Calendar },
    { key: 'lastMonth', label: 'Bulan Lalu', icon: Calendar },
  ]

  const dateLabel = useMemo(() => {
    if (!isSingleMode) {
      if (filterStartDate && filterEndDate) {
        const days = countDaysBetween(filterStartDate, filterEndDate)
        return `📅 ${formatDateShort(filterStartDate)} — ${formatDateShort(filterEndDate)} (${days} hari)`
      }
      return 'Pilih rentang tanggal'
    }
    if (!filterTanggal) return 'Menampilkan semua data'
    if (isToday) return `📍 Hari Ini — ${formatDayLabel(filterTanggal)}`
    if (isYesterday) return `Kemarin — ${formatDayLabel(filterTanggal)}`
    return formatDayLabel(filterTanggal)
  }, [isSingleMode, filterTanggal, filterStartDate, filterEndDate, isToday, isYesterday])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Mode Toggle */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => onDateModeChange(DATE_MODE_SINGLE)}
          className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-all
            flex items-center justify-center gap-1.5
            ${isSingleMode
              ? 'text-gray-900 bg-white border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
        >
          <Calendar size={13} />
          Per Hari
        </button>
        <button
          onClick={() => onDateModeChange(DATE_MODE_RANGE)}
          className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-all
            flex items-center justify-center gap-1.5
            ${!isSingleMode
              ? 'text-gray-900 bg-white border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
        >
          <CalendarRange size={13} />
          Rentang Tanggal
        </button>
      </div>

      {/* ========== SINGLE DATE MODE ========== */}
      {isSingleMode && (
        <>
          {/* Navigation Row */}
          <div className="flex items-center gap-2 p-3">
            <button
              onClick={() => onNavigate(-1)}
              className="w-11 h-11 bg-gray-100 rounded-xl flex items-center
                justify-center cursor-pointer active:scale-90 active:bg-gray-200
                flex-shrink-0 transition-all duration-100"
              aria-label="Tanggal sebelumnya"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>

            <div className="flex-1 relative">
              <input
                type="date"
                value={filterTanggal}
                onChange={(e) => {
                  if (e.target.value) onDateChange(e.target.value)
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl
                  px-4 py-3 text-center text-sm font-semibold text-gray-800
                  outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
                  cursor-pointer min-h-[46px] transition-all"
                aria-label="Pilih tanggal"
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
              <ChevronRight
                size={18}
                className={isToday ? 'text-gray-300' : 'text-gray-600'}
              />
            </button>
          </div>

          {/* Date Label */}
          <div className="px-4 pb-1 text-center">
            <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
          </div>

          {/* Quick Buttons + Menu Filter */}
          <div className="flex gap-2 p-3 pt-2 overflow-x-auto scrollbar-hide">
            {quickButtonsSingle.map((btn, i) => (
              <button
                key={i}
                onClick={() => onDateChange(btn.val)}
                className={`px-4 py-2 rounded-full text-xs font-semibold
                  cursor-pointer whitespace-nowrap min-h-[36px]
                  transition-all duration-200 ${
                    btn.active
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                  }`}
              >
                {btn.label}
              </button>
            ))}

            {menu.length > 0 && (
              <select
                value={filterMenu}
                onChange={(e) => onMenuChange(e.target.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold
                  cursor-pointer min-h-[36px] outline-none transition-all
                  border-0 appearance-none ${
                    filterMenu !== 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                aria-label="Filter menu"
              >
                <option value="all">Semua Menu</option>
                {menu.map((m) => (
                  <option key={m.id_menu} value={m.id_menu}>
                    {m.nama_item}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      )}

      {/* ========== RANGE DATE MODE ========== */}
      {!isSingleMode && (
        <>
          {/* Preset Buttons */}
          <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
            {rangePresets.map((preset) => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.key}
                  onClick={() => onPresetClick(preset.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold
                    cursor-pointer whitespace-nowrap min-h-[36px]
                    transition-all duration-200 active:scale-95 ${
                      activePreset === preset.key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  <Icon size={12} />
                  {preset.label}
                </button>
              )
            })}

            {/* Menu Filter in range mode */}
            {menu.length > 0 && (
              <select
                value={filterMenu}
                onChange={(e) => onMenuChange(e.target.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold
                  cursor-pointer min-h-[36px] outline-none transition-all
                  border-0 appearance-none ${
                    filterMenu !== 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                aria-label="Filter menu"
              >
                <option value="all">Semua Menu</option>
                {menu.map((m) => (
                  <option key={m.id_menu} value={m.id_menu}>
                    {m.nama_item}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Custom Range Inputs */}
          <div className="px-3 pb-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                Pilih Rentang Custom
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl
                      px-3 py-2.5 text-sm font-semibold text-gray-800
                      outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
                      cursor-pointer transition-all"
                  />
                </div>
                <div className="flex items-end justify-center pb-2.5 sm:pb-0 sm:pt-5">
                  <ArrowRight size={16} className="text-gray-300 rotate-90 sm:rotate-0" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-gray-500 mb-1 block">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl
                      px-3 py-2.5 text-sm font-semibold text-gray-800
                      outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
                      cursor-pointer transition-all"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={onApplyRange}
                    disabled={!filterStartDate || !filterEndDate}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-xl
                      text-xs font-bold cursor-pointer transition-all
                      active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                      flex items-center justify-center gap-1.5 min-h-[42px]
                      hover:bg-gray-800"
                  >
                    <Search size={13} />
                    Tampilkan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Date Label for range */}
          <div className="px-4 pb-3 text-center">
            <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
          </div>
        </>
      )}

      {/* Active Filter Chips */}
      {((isSingleMode && (filterTanggal || filterMenu !== 'all')) ||
        (!isSingleMode && (filterStartDate || filterMenu !== 'all'))) && (
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
          {isSingleMode && filterTanggal && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px]
              bg-amber-50 text-amber-700 pl-2.5 pr-1.5 py-1
              rounded-full font-medium"
            >
              📅 {formatDateShort(filterTanggal)}
              <button
                onClick={() => onDateChange('')}
                className="p-0.5 hover:bg-amber-200 rounded-full cursor-pointer transition-colors"
                aria-label="Hapus filter tanggal"
              >
                <X size={10} />
              </button>
            </span>
          )}
          {!isSingleMode && filterStartDate && filterEndDate && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px]
              bg-violet-50 text-violet-700 pl-2.5 pr-1.5 py-1
              rounded-full font-medium"
            >
              📅 {formatDateShort(filterStartDate)} — {formatDateShort(filterEndDate)}
              <button
                onClick={() => {
                  onStartDateChange('')
                  onEndDateChange('')
                }}
                className="p-0.5 hover:bg-violet-200 rounded-full cursor-pointer transition-colors"
                aria-label="Hapus filter rentang"
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filterMenu !== 'all' && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px]
              bg-blue-50 text-blue-700 pl-2.5 pr-1.5 py-1
              rounded-full font-medium"
            >
              ☕ {menu.find((m) => m.id_menu === parseInt(filterMenu))?.nama_item}
              <button
                onClick={() => onMenuChange('all')}
                className="p-0.5 hover:bg-blue-200 rounded-full cursor-pointer transition-colors"
                aria-label="Hapus filter menu"
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   EMPTY STATE COMPONENT
   ================================================================ */

function EmptyState({ filterTanggal, dateMode, filterStartDate, filterEndDate, onShowToday, onShowAll }) {
  const getMessage = () => {
    if (dateMode === DATE_MODE_RANGE && filterStartDate && filterEndDate) {
      return `Tidak ada penjualan pada ${formatDateShort(filterStartDate)} — ${formatDateShort(filterEndDate)}`
    }
    if (filterTanggal) {
      return `Tidak ada penjualan pada ${formatDateShort(filterTanggal)}`
    }
    return 'Data akan muncul setelah ada penjualan yang tercatat'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Coffee size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-sm">
        Belum ada transaksi
      </p>
      <p className="text-gray-300 text-xs mt-1.5 max-w-[280px] mx-auto leading-relaxed">
        {getMessage()}
      </p>
      {(filterTanggal || (filterStartDate && filterEndDate)) && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={onShowToday}
            className="text-xs font-semibold text-gray-700 bg-gray-100
              px-5 py-2.5 rounded-xl cursor-pointer active:bg-gray-200
              min-h-[40px] transition-colors"
          >
            Hari Ini
          </button>
          <button
            onClick={onShowAll}
            className="text-xs font-semibold text-blue-600 bg-blue-50
              px-5 py-2.5 rounded-xl cursor-pointer active:bg-blue-100
              min-h-[40px] transition-colors"
          >
            Lihat Semua
          </button>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   BREAKDOWN SECTION COMPONENT
   ================================================================ */

function BreakdownSection({
  breakdownList,
  totalCup,
  totalPendapatan,
  showAll,
  onToggleShowAll,
}) {
  const maxJumlah = breakdownList[0]?.jumlah || 1
  const displayList = showAll
    ? breakdownList
    : breakdownList.slice(0, INITIAL_BREAKDOWN_LIMIT)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <BarChart3 size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Penjualan per Menu
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {breakdownList.length} menu terjual
            </p>
          </div>
        </div>
        {breakdownList.length > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-lg">
            <Flame size={11} className="text-orange-500" />
            <span className="text-[10px] font-bold text-orange-600 max-w-[60px] sm:max-w-none truncate">
              {breakdownList[0]?.nama}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-2">
        {displayList.map((item, idx) => (
          <BreakdownItem
            key={item.nama}
            item={item}
            index={idx}
            maxJumlah={maxJumlah}
            totalCup={totalCup}
          />
        ))}
      </div>

      {breakdownList.length > INITIAL_BREAKDOWN_LIMIT && (
        <button
          onClick={onToggleShowAll}
          className="w-full py-3 text-xs font-semibold text-violet-600
            hover:bg-violet-50 active:bg-violet-100 cursor-pointer
            flex items-center justify-center gap-1.5 border-t
            border-gray-100 min-h-[44px] transition-colors"
        >
          {showAll ? (
            <>
              Sembunyikan{' '}
              <ChevronDown size={14} className="rotate-180 transition-transform" />
            </>
          ) : (
            <>
              Lihat {breakdownList.length - INITIAL_BREAKDOWN_LIMIT} lainnya{' '}
              <ChevronDown size={14} className="transition-transform" />
            </>
          )}
        </button>
      )}

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-400">
          Total {breakdownList.length} menu
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-700">
            {totalCup} cup
          </span>
          <span className="text-xs font-bold text-emerald-600">
            {rp(totalPendapatan)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TRANSACTION LIST SECTION COMPONENT
   ================================================================ */

function TransactionListSection({
  transaksi,
  showTransaksi,
  dateMode,
  onToggle,
  onDetail,
  onEdit,
  onDelete,
}) {
  const { grouped, sortedDates } = useMemo(() => {
    const g = transaksi.reduce((acc, trx) => {
      const date = new Date(trx.tanggal_jam).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = []
      acc[date].push(trx)
      return acc
    }, {})
    const dates = Object.keys(g).sort((a, b) => b.localeCompare(a))
    return { grouped: g, sortedDates: dates }
  }, [transaksi])

  const isMultiDay = sortedDates.length > 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between cursor-pointer
          active:bg-gray-50 transition-colors duration-150"
        aria-expanded={showTransaksi}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <Receipt size={16} className="text-gray-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">
              Detail Transaksi
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {transaksi.length} data tercatat
              {isMultiDay && ` · ${sortedDates.length} hari`}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-300 ${
            showTransaksi ? 'rotate-180' : ''
          }`}
        />
      </button>

      {showTransaksi && (
        <div>
          {sortedDates.map((date) => {
            const items = grouped[date]
            return (
              <div key={date}>
                {/* Always show date group header when multi-day */}
                {isMultiDay && <DateGroupHeader date={date} items={items} />}
                {!isMultiDay && dateMode === DATE_MODE_RANGE && (
                  <DateGroupHeader date={date} items={items} />
                )}
                {items.map((trx, ti) => (
                  <TransactionRow
                    key={trx.id_transaksi}
                    trx={trx}
                    isLast={ti === items.length - 1}
                    onDetail={onDetail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showDate={isMultiDay}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   DAILY BREAKDOWN COMPONENT (NEW - for range mode)
   ================================================================ */

function DailyBreakdown({ transaksi }) {
  const dailyData = useMemo(() => {
    const grouped = {}
    transaksi.forEach((trx) => {
      const date = new Date(trx.tanggal_jam).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = { date, revenue: 0, cups: 0, trxCount: 0 }
      }
      grouped[date].revenue += parseFloat(trx.total_bayar) || 0
      grouped[date].cups += trx.jumlah_beli || 0
      grouped[date].trxCount += 1
    })

    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
  }, [transaksi])

  if (dailyData.length <= 1) return null

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1)
  const totalRevenue = dailyData.reduce((a, d) => a + d.revenue, 0)
  const avgRevenue = totalRevenue / dailyData.length

  const bestDay = dailyData.reduce((best, d) => d.revenue > best.revenue ? d : best, dailyData[0])
  const worstDay = dailyData.reduce((worst, d) => d.revenue < worst.revenue ? d : worst, dailyData[0])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart3 size={16} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Performa Harian
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {dailyData.length} hari · Avg {rp(avgRevenue)}/hari
            </p>
          </div>
        </div>
      </div>

      {/* Best & Worst indicators */}
      <div className="px-4 pb-2 flex gap-2">
        <div className="flex-1 bg-emerald-50 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight size={11} className="text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-600 uppercase">Terbaik</span>
          </div>
          <p className="text-xs font-bold text-emerald-700">{rp(bestDay.revenue)}</p>
          <p className="text-[9px] text-emerald-500">{formatDayShort(bestDay.date)}</p>
        </div>
        <div className="flex-1 bg-amber-50 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={11} className="text-amber-500" />
            <span className="text-[9px] font-bold text-amber-600 uppercase">Terendah</span>
          </div>
          <p className="text-xs font-bold text-amber-700">{rp(worstDay.revenue)}</p>
          <p className="text-[9px] text-amber-500">{formatDayShort(worstDay.date)}</p>
        </div>
      </div>

      {/* Daily Bars */}
      <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
        {dailyData.map((day, idx) => {
          const barW = Math.max(Math.round((day.revenue / maxRevenue) * 100), 2)
          const isBest = day.date === bestDay.date
          const isWorst = day.date === worstDay.date

          return (
            <div key={day.date} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-700">
                    {formatDayShort(day.date)}
                  </span>
                  {isBest && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                      BEST
                    </span>
                  )}
                  {isWorst && dailyData.length > 1 && (
                    <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                      LOW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-400">{day.trxCount} trx · {day.cups} cup</span>
                  <span className="font-bold text-gray-800">{rp(day.revenue)}</span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isBest ? 'bg-emerald-400' : isWorst && dailyData.length > 1 ? 'bg-amber-400' : 'bg-indigo-400'
                  }`}
                  style={{ width: `${barW}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-400">
          {dailyData.length} hari
        </span>
        <span className="text-xs font-bold text-gray-700">
          Total: {rp(totalRevenue)}
        </span>
      </div>
    </div>
  )
}

/* ================================================================
   INSIGHTS SECTION COMPONENT
   ================================================================ */

function InsightsSection({ transaksi, totalPendapatan, totalCup, dateMode, dayCount }) {
  const insights = useMemo(() => {
    if (transaksi.length === 0) return null

    const avgPerTransaction =
      transaksi.length > 0 ? totalCup / transaksi.length : 0

    const avgRevenuePerTransaction =
      transaksi.length > 0 ? totalPendapatan / transaksi.length : 0

    const avgRevenuePerCup = totalCup > 0 ? totalPendapatan / totalCup : 0

    const avgRevenuePerDay = dayCount > 0 ? totalPendapatan / dayCount : totalPendapatan

    const hourCounts = {}
    transaksi.forEach((trx) => {
      const hour = getHourFromDate(trx.tanggal_jam)
      hourCounts[hour] = (hourCounts[hour] || 0) + (trx.jumlah_beli || 0)
    })
    const peakHour = Object.entries(hourCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]

    const largestTrx = transaksi.reduce(
      (max, trx) =>
        (parseFloat(trx.total_bayar) || 0) > (parseFloat(max.total_bayar) || 0)
          ? trx
          : max,
      transaksi[0]
    )

    return {
      avgPerTransaction: avgPerTransaction.toFixed(1),
      avgRevenuePerTransaction: Math.round(avgRevenuePerTransaction),
      avgRevenuePerCup: Math.round(avgRevenuePerCup),
      avgRevenuePerDay: Math.round(avgRevenuePerDay),
      peakHour: peakHour ? `${peakHour[0]}:00` : '-',
      peakHourCups: peakHour ? peakHour[1] : 0,
      largestTrx,
      dayCount,
    }
  }, [transaksi, totalPendapatan, totalCup, dayCount])

  if (!insights) return null

  const insightItems = [
    {
      icon: TrendingUp,
      label: 'Avg per Transaksi',
      value: `${insights.avgPerTransaction} cup`,
      subValue: rp(insights.avgRevenuePerTransaction),
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: DollarSign,
      label: 'Avg Harga per Cup',
      value: rp(insights.avgRevenuePerCup),
      subValue: 'semua menu',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      icon: Zap,
      label: 'Jam Tersibuk',
      value: insights.peakHour,
      subValue: `${insights.peakHourCups} cup terjual`,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    ...(dateMode === DATE_MODE_RANGE && insights.dayCount > 1
      ? [{
          icon: CalendarDays,
          label: 'Avg per Hari',
          value: rp(insights.avgRevenuePerDay),
          subValue: `${insights.dayCount} hari`,
          color: 'text-indigo-500',
          bg: 'bg-indigo-50',
        }]
      : [{
          icon: ShoppingBag,
          label: 'Transaksi Terbesar',
          value: rp(insights.largestTrx?.total_bayar || 0),
          subValue: insights.largestTrx?.menu_jualan?.nama_item || '-',
          color: 'text-purple-500',
          bg: 'bg-purple-50',
        }]
    ),
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <TrendingUp size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Insights</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Ringkasan analisis penjualan
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {insightItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className={`${item.bg} rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={item.color} />
                <span className="text-[10px] font-medium text-gray-500">
                  {item.label}
                </span>
              </div>
              <p className="text-base font-bold text-gray-900">{item.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {item.subValue}
              </p>
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

function TotalFooter({ transaksi, totalPendapatan, totalCup, filterTanggal, dateMode, filterStartDate, filterEndDate }) {
  const dateLabel = useMemo(() => {
    if (dateMode === DATE_MODE_RANGE && filterStartDate && filterEndDate) {
      return `${formatDateShort(filterStartDate)} — ${formatDateShort(filterEndDate)}`
    }
    if (filterTanggal) return formatDateShort(filterTanggal)
    return null
  }, [dateMode, filterTanggal, filterStartDate, filterEndDate])

  return (
    <div className="bg-gray-900 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium">
            Total Pendapatan
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {transaksi.length} transaksi · {totalCup} cup
            {dateLabel && ` · ${dateLabel}`}
          </p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white">
          {rp(totalPendapatan)}
        </p>
      </div>

      {totalCup > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Coffee size={12} className="text-gray-500" />
              <span className="text-[11px] text-gray-400">
                Avg {rp(Math.round(totalPendapatan / transaksi.length))}/trx
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign size={12} className="text-gray-500" />
              <span className="text-[11px] text-gray-400">
                {rp(Math.round(totalPendapatan / totalCup))}/cup
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">
              {totalCup} cup
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT: RingkasanTab
   ================================================================ */

export default function RingkasanTab() {
  /* --------------------------------
     State Management
     -------------------------------- */
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [menu, setMenu] = useState([])

  // Date mode: single or range
  const [dateMode, setDateMode] = useState(DATE_MODE_SINGLE)

  // Single date filter
  const [filterTanggal, setFilterTanggal] = useState(getToday())

  // Range date filter
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [activePreset, setActivePreset] = useState('')

  // Menu filter (shared)
  const [filterMenu, setFilterMenu] = useState('all')

  const [editItem, setEditItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailItem, setDetailItem] = useState(null)

  const [showAllBreakdown, setShowAllBreakdown] = useState(false)
  const [showTransaksi, setShowTransaksi] = useState(true)

  const [toast, setToast] = useState(null)

  const fetchCountRef = useRef(0)

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
     Range Presets
     -------------------------------- */
  const applyRangePreset = useCallback((presetKey) => {
    const today = getToday()
    let start = ''
    let end = today

    switch (presetKey) {
      case '7d':
        start = getDaysAgo(6)
        break
      case '30d':
        start = getDaysAgo(29)
        break
      case 'thisMonth':
        start = getMonthStart(0)
        break
      case 'lastMonth':
        start = getMonthStart(-1)
        end = getMonthEnd(-1)
        break
      default:
        return
    }

    setFilterStartDate(start)
    setFilterEndDate(end)
    setAppliedStartDate(start)
    setAppliedEndDate(end)
    setActivePreset(presetKey)
  }, [])

  /* --------------------------------
     Data Fetching
     -------------------------------- */
  const fetchTransaksi = useCallback(async () => {
    const currentFetch = ++fetchCountRef.current
    setLoading(true)

    try {
      let query = supabase
        .from('transaksi_penjualan')
        .select(
          '*, menu_jualan(nama_item, harga_jual, id_cup, inventory_cup(nama_cup))'
        )
        .order('tanggal_jam', { ascending: false })
        .limit(TRANSACTION_FETCH_LIMIT)

      // Apply date filter based on mode
      if (dateMode === DATE_MODE_SINGLE) {
        if (filterTanggal) {
          query = query
            .gte('tanggal_jam', `${filterTanggal}T00:00:00`)
            .lte('tanggal_jam', `${filterTanggal}T23:59:59`)
        }
      } else {
        // Range mode
        if (appliedStartDate) {
          query = query.gte('tanggal_jam', `${appliedStartDate}T00:00:00`)
        }
        if (appliedEndDate) {
          query = query.lte('tanggal_jam', `${appliedEndDate}T23:59:59`)
        }
      }

      if (filterMenu !== 'all') {
        query = query.eq('id_menu', parseInt(filterMenu))
      }

      const { data, error } = await query

      if (currentFetch !== fetchCountRef.current) return

      if (error) {
        console.error('Fetch transaksi error:', error)
        showToast('Gagal memuat data transaksi', 'error')
      } else {
        setTransaksi(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      showToast('Terjadi kesalahan tak terduga', 'error')
    } finally {
      if (currentFetch === fetchCountRef.current) {
        setLoading(false)
        setInitialLoading(false)
      }
    }
  }, [dateMode, filterTanggal, appliedStartDate, appliedEndDate, filterMenu, showToast])

  const fetchMenu = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_jualan')
        .select('id_menu, nama_item')
        .order('nama_item')

      if (error) {
        console.error('Fetch menu error:', error)
      } else {
        setMenu(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching menu:', err)
    }
  }, [])

  /* --------------------------------
     Effects
     -------------------------------- */
  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    fetchTransaksi()
  }, [fetchTransaksi])

  /* --------------------------------
     Handlers
     -------------------------------- */
  const handleDateModeChange = useCallback((mode) => {
    setDateMode(mode)
    // Reset applied range when switching to single
    if (mode === DATE_MODE_SINGLE) {
      setAppliedStartDate('')
      setAppliedEndDate('')
      setActivePreset('')
    }
  }, [])

  const handleApplyRange = useCallback(() => {
    if (!filterStartDate || !filterEndDate) {
      showToast('Pilih tanggal mulai dan akhir', 'error')
      return
    }
    if (new Date(filterStartDate) > new Date(filterEndDate)) {
      showToast('Tanggal mulai harus sebelum tanggal akhir', 'error')
      return
    }
    setAppliedStartDate(filterStartDate)
    setAppliedEndDate(filterEndDate)
    setActivePreset('custom')
    showToast(
      `Menampilkan data ${formatDateShort(filterStartDate)} — ${formatDateShort(filterEndDate)}`,
      'info'
    )
  }, [filterStartDate, filterEndDate, showToast])

  const handlePresetClick = useCallback((presetKey) => {
    applyRangePreset(presetKey)
  }, [applyRangePreset])

  // When preset is applied, trigger fetch immediately
  useEffect(() => {
    if (dateMode === DATE_MODE_RANGE && appliedStartDate && appliedEndDate) {
      // fetchTransaksi will be called via its own effect
    }
  }, [dateMode, appliedStartDate, appliedEndDate])

  const handleDelete = useCallback(
    async (id) => {
      setLoading(true)
      try {
        const { error } = await supabase
          .from('transaksi_penjualan')
          .delete()
          .eq('id_transaksi', id)

        if (error) {
          showToast('Gagal menghapus: ' + error.message, 'error')
        } else {
          setConfirmDelete(null)
          setDetailItem(null)
          showToast('Transaksi berhasil dihapus', 'success')
          fetchTransaksi()
        }
      } catch (err) {
        showToast('Terjadi kesalahan saat menghapus', 'error')
      } finally {
        setLoading(false)
      }
    },
    [fetchTransaksi, showToast]
  )

  const handleDesktopDelete = useCallback(
    (trx) => {
      if (window.confirm(`Hapus transaksi "${trx.menu_jualan?.nama_item}"?`)) {
        handleDelete(trx.id_transaksi)
      }
    },
    [handleDelete]
  )

  const startEdit = useCallback((item) => {
    setEditItem(item)
    setDetailItem(null)
  }, [])

  const handleEditSave = useCallback(
    async (updateData) => {
      setLoading(true)
      try {
        const { error } = await supabase
          .from('transaksi_penjualan')
          .update(updateData)
          .eq('id_transaksi', editItem.id_transaksi)

        if (error) {
          showToast('Gagal update: ' + error.message, 'error')
        } else {
          setEditItem(null)
          showToast('Transaksi berhasil diperbarui', 'success')
          fetchTransaksi()
        }
      } catch (err) {
        showToast('Terjadi kesalahan saat update', 'error')
      } finally {
        setLoading(false)
      }
    },
    [editItem, fetchTransaksi, showToast]
  )

  const handleNavigateTanggal = useCallback((direction) => {
    setFilterTanggal((prev) => navigateDate(prev, direction))
  }, [])

  const handleShowToday = useCallback(() => {
    setDateMode(DATE_MODE_SINGLE)
    setFilterTanggal(getToday())
    setAppliedStartDate('')
    setAppliedEndDate('')
  }, [])

  const handleShowAll = useCallback(() => {
    setDateMode(DATE_MODE_SINGLE)
    setFilterTanggal('')
    setAppliedStartDate('')
    setAppliedEndDate('')
  }, [])

  /* --------------------------------
     Computed Values
     -------------------------------- */
  const totalPendapatan = useMemo(
    () => transaksi.reduce((acc, trx) => acc + (parseFloat(trx.total_bayar) || 0), 0),
    [transaksi]
  )

  const totalCup = useMemo(
    () => transaksi.reduce((acc, trx) => acc + (trx.jumlah_beli || 0), 0),
    [transaksi]
  )

  const dayCount = useMemo(() => {
    if (dateMode === DATE_MODE_SINGLE) return 1
    if (appliedStartDate && appliedEndDate) {
      return countDaysBetween(appliedStartDate, appliedEndDate)
    }
    // Count unique days from data
    const uniqueDays = new Set(
      transaksi.map((t) => new Date(t.tanggal_jam).toISOString().split('T')[0])
    )
    return uniqueDays.size || 1
  }, [dateMode, appliedStartDate, appliedEndDate, transaksi])

  const breakdownList = useMemo(() => {
    const breakdownMap = transaksi.reduce((acc, trx) => {
      const nama = trx.menu_jualan?.nama_item || 'Tidak diketahui'
      if (!acc[nama]) {
        acc[nama] = {
          nama,
          jumlah: 0,
          pendapatan: 0,
          harga: trx.menu_jualan?.harga_jual || 0,
          cupType: trx.menu_jualan?.inventory_cup?.nama_cup || '',
          idCup: trx.menu_jualan?.id_cup,
          count: 0,
          avgPerTransaction: 0,
        }
      }
      acc[nama].jumlah += trx.jumlah_beli || 0
      acc[nama].pendapatan += parseFloat(trx.total_bayar) || 0
      acc[nama].count += 1
      return acc
    }, {})

    Object.values(breakdownMap).forEach((item) => {
      item.avgPerTransaction = item.count > 0 ? item.jumlah / item.count : 0
    })

    return Object.values(breakdownMap).sort((a, b) => b.jumlah - a.jumlah)
  }, [transaksi])

  const statCards = useMemo(
    () => [
      {
        label: 'Transaksi',
        value: transaksi.length,
        icon: Receipt,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        subValue:
          transaksi.length > 0
            ? `~${(totalCup / transaksi.length).toFixed(1)} cup/trx`
            : null,
      },
      {
        label: 'Cup Terjual',
        value: totalCup,
        icon: Coffee,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        subValue:
          breakdownList.length > 0
            ? `${breakdownList.length} menu`
            : null,
      },
      {
        label: 'Pendapatan',
        value: rp(totalPendapatan),
        icon: DollarSign,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        subValue:
          dateMode === DATE_MODE_RANGE && dayCount > 1
            ? `${rp(Math.round(totalPendapatan / dayCount))}/hari`
            : totalCup > 0
            ? `${rp(Math.round(totalPendapatan / totalCup))}/cup`
            : null,
      },
    ],
    [transaksi, totalCup, totalPendapatan, breakdownList, dateMode, dayCount]
  )

  const hasData = transaksi.length > 0
  const isLoadingInitial = initialLoading && transaksi.length === 0
  const isRangeMode = dateMode === DATE_MODE_RANGE

  /* --------------------------------
     Render
     -------------------------------- */
  return (
    <div className="space-y-5 pb-8">
      {/* Toast */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditModal
          item={editItem}
          loading={loading}
          onClose={() => setEditItem(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Detail Modal (Mobile) */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          loading={loading}
          confirmDeleteId={confirmDelete}
          onClose={() => setDetailItem(null)}
          onEdit={startEdit}
          onDelete={handleDelete}
          onConfirmDelete={(id) => setConfirmDelete(id)}
          onCancelDelete={() => setConfirmDelete(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📊 Ringkasan</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isRangeMode ? 'Laporan penjualan multi-hari' : 'Pantau penjualan harian kamu'}
          </p>
        </div>
        <button
          onClick={fetchTransaksi}
          disabled={loading}
          className="w-10 h-10 bg-white rounded-full border border-gray-200
            flex items-center justify-center cursor-pointer active:scale-95
            shadow-sm hover:shadow-md transition-all duration-200
            disabled:opacity-50"
          aria-label="Refresh data"
        >
          <RefreshCw
            size={15}
            className={`text-gray-400 ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Date Picker */}
      <DatePickerSection
        dateMode={dateMode}
        filterTanggal={filterTanggal}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        filterMenu={filterMenu}
        menu={menu}
        onDateModeChange={handleDateModeChange}
        onDateChange={setFilterTanggal}
        onStartDateChange={setFilterStartDate}
        onEndDateChange={setFilterEndDate}
        onApplyRange={handleApplyRange}
        onMenuChange={setFilterMenu}
        onNavigate={handleNavigateTanggal}
        activePreset={activePreset}
        onPresetClick={handlePresetClick}
      />

      {/* Stat Cards */}
      {isLoadingInitial ? (
        <SkeletonStatCards />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      )}

      {/* Content Area */}
      {isLoadingInitial ? (
        <>
          <SkeletonBreakdown />
          <SkeletonTransactions />
        </>
      ) : !hasData ? (
        <EmptyState
          filterTanggal={filterTanggal}
          dateMode={dateMode}
          filterStartDate={appliedStartDate}
          filterEndDate={appliedEndDate}
          onShowToday={handleShowToday}
          onShowAll={handleShowAll}
        />
      ) : (
        <>
          {/* Breakdown per Menu */}
          <BreakdownSection
            breakdownList={breakdownList}
            totalCup={totalCup}
            totalPendapatan={totalPendapatan}
            showAll={showAllBreakdown}
            onToggleShowAll={() => setShowAllBreakdown((prev) => !prev)}
          />

          {/* Daily Breakdown (only for range mode with multi-day) */}
          {isRangeMode && <DailyBreakdown transaksi={transaksi} />}

          {/* Time Distribution */}
          <TimeDistribution transaksi={transaksi} />

          {/* Insights */}
          <InsightsSection
            transaksi={transaksi}
            totalPendapatan={totalPendapatan}
            totalCup={totalCup}
            dateMode={dateMode}
            dayCount={dayCount}
          />

          {/* Transaction List */}
          <TransactionListSection
            transaksi={transaksi}
            showTransaksi={showTransaksi}
            dateMode={dateMode}
            onToggle={() => setShowTransaksi((prev) => !prev)}
            onDetail={(trx) => setDetailItem(trx)}
            onEdit={startEdit}
            onDelete={handleDesktopDelete}
          />

          {/* Total Footer */}
          <TotalFooter
            transaksi={transaksi}
            totalPendapatan={totalPendapatan}
            totalCup={totalCup}
            filterTanggal={filterTanggal}
            dateMode={dateMode}
            filterStartDate={appliedStartDate}
            filterEndDate={appliedEndDate}
          />
        </>
      )}
    </div>
  )
}