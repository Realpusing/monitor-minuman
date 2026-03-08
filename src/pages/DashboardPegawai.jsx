import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Coffee, Package, ShoppingBag, LogOut, RefreshCw,
  AlertTriangle, CheckCircle, X, Plus, Minus,
  Clock, DollarSign, Receipt, TrendingUp, Info,
  ChevronDown, ChevronUp, ArrowRight, Zap,
  Send, Hash, Star, Award, Shield, Eye,
  Smartphone, Wifi, WifiOff, Search,
  Sun, Moon, Sunrise, Sunset
} from 'lucide-react'

/* ================================================================
   CONSTANTS
   ================================================================ */

const LOW_STOCK_THRESHOLD = 10
const CRITICAL_STOCK_THRESHOLD = 3
const RECENT_TRANSACTIONS_LIMIT = 15

const CUP_STATUS = {
  CRITICAL: { label: 'Habis', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500', border: 'border-red-200' },
  LOW: { label: 'Menipis', bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-200' },
  NORMAL: { label: 'Tersedia', bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-200' },
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

const formatTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDateShort = (d) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 11) return { text: 'Selamat Pagi', icon: Sunrise, emoji: '🌅' }
  if (hour < 15) return { text: 'Selamat Siang', icon: Sun, emoji: '☀️' }
  if (hour < 18) return { text: 'Selamat Sore', icon: Sunset, emoji: '🌇' }
  return { text: 'Selamat Malam', icon: Moon, emoji: '🌙' }
}

const getCupStatus = (cup) => {
  if (cup.stok_sekarang <= CRITICAL_STOCK_THRESHOLD) return CUP_STATUS.CRITICAL
  if (cup.stok_sekarang <= LOW_STOCK_THRESHOLD) return CUP_STATUS.LOW
  return CUP_STATUS.NORMAL
}

const getCupPercentage = (cup) => {
  if (cup.stok_awal <= 0) return 0
  return Math.min(Math.round((cup.stok_sekarang / cup.stok_awal) * 100), 100)
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
    warning: { bg: 'bg-amber-600', icon: <AlertTriangle size={16} /> },
  }

  const { bg, icon } = configs[type] || configs.info

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
      <div
        className={`${bg} text-white px-5 py-3 rounded-2xl shadow-2xl
          flex items-center gap-2.5 text-sm font-medium min-w-[280px]
          max-w-[90vw]`}
      >
        {icon}
        <span className="flex-1 leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg cursor-pointer
            flex-shrink-0"
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

function SkeletonPage() {
  return (
    <div className="space-y-5 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="w-32 h-4" />
          <SkeletonPulse className="w-48 h-6" />
        </div>
        <SkeletonPulse className="w-10 h-10 rounded-full" />
      </div>

      {/* Cup Status */}
      <div className="space-y-2">
        <SkeletonPulse className="w-full h-20 rounded-2xl" />
        <SkeletonPulse className="w-full h-20 rounded-2xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <SkeletonPulse className="h-20 rounded-2xl" />
        <SkeletonPulse className="h-20 rounded-2xl" />
        <SkeletonPulse className="h-20 rounded-2xl" />
      </div>

      {/* Menu Items */}
      <SkeletonPulse className="w-24 h-4" />
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonPulse key={i} className="w-full h-16 rounded-2xl" />
      ))}
    </div>
  )
}

/* ================================================================
   CONFIRM SALE MODAL COMPONENT
   ================================================================ */

function ConfirmSaleModal({
  item,
  cup,
  quantity,
  loading,
  onConfirm,
  onCancel,
  onQuantityChange,
}) {
  if (!item) return null

  const totalHarga = item.harga_jual * quantity
  const stockAfter = cup ? cup.stok_sekarang - quantity : 0
  const isStockEnough = cup ? cup.stok_sekarang >= quantity : false

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh]
          flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Konfirmasi Penjualan
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Pastikan pesanan sudah benar
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer
              transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Item Info */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Coffee size={22} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">
                  {item.nama_item}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatRp(item.harga_jual)} / cup
                </p>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-3 block">
              Jumlah Cup
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-12 h-12 bg-gray-100 rounded-xl flex items-center
                  justify-center cursor-pointer active:scale-90 transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={20} className="text-gray-600" />
              </button>

              <div className="w-20 text-center">
                <span className="text-4xl font-black text-gray-900">
                  {quantity}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">cup</p>
              </div>

              <button
                onClick={() =>
                  onQuantityChange(
                    Math.min(cup?.stok_sekarang || 99, quantity + 1)
                  )
                }
                disabled={quantity >= (cup?.stok_sekarang || 99)}
                className="w-12 h-12 bg-gray-100 rounded-xl flex items-center
                  justify-center cursor-pointer active:scale-90 transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Quick quantity buttons */}
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 5].map((q) => (
                <button
                  key={q}
                  onClick={() => onQuantityChange(q)}
                  disabled={q > (cup?.stok_sekarang || 0)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold
                    cursor-pointer transition-all active:scale-95
                    disabled:opacity-30 disabled:cursor-not-allowed ${
                      quantity === q
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-600">
                {quantity} × {formatRp(item.harga_jual)}
              </span>
              <span className="text-2xl font-black text-emerald-700">
                {formatRp(totalHarga)}
              </span>
            </div>

            {cup && (
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <span className="text-xs text-emerald-600">
                  Sisa {cup.nama_cup} setelah transaksi
                </span>
                <span
                  className={`text-xs font-bold ${
                    stockAfter <= CRITICAL_STOCK_THRESHOLD
                      ? 'text-red-600'
                      : stockAfter <= LOW_STOCK_THRESHOLD
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {stockAfter} cup
                </span>
              </div>
            )}
          </div>

          {/* Stock Warning */}
          {!isStockEnough && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">
                  Stok cup tidak cukup!
                </p>
                <p className="text-[10px] text-red-500 mt-0.5">
                  {cup?.nama_cup}: sisa {cup?.stok_sekarang || 0}, butuh {quantity}
                </p>
              </div>
            </div>
          )}

          {stockAfter <= LOW_STOCK_THRESHOLD && stockAfter > 0 && isStockEnough && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Setelah transaksi ini, stok {cup?.nama_cup} akan tersisa{' '}
                <span className="font-bold">{stockAfter} cup</span>. Segera lapor untuk restock!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98]
              transition-transform"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !isStockEnough}
            className="flex-[2] py-3.5 rounded-xl font-semibold bg-emerald-600
              text-white cursor-pointer active:scale-[0.98] flex items-center
              justify-center gap-2 disabled:opacity-50
              disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Jual {formatRp(totalHarga)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   LOGOUT CONFIRM MODAL
   ================================================================ */

function LogoutModal({ onConfirm, onCancel }) {
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
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogOut size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1.5">Keluar?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Kamu akan keluar dari mode kasir. Pastikan semua transaksi sudah tercatat.
          </p>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98] transition-transform"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-[1.5] py-3.5 rounded-xl font-semibold bg-red-500
              text-white cursor-pointer active:scale-[0.98] transition-transform
              flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   CUP STOCK CARD COMPONENT
   ================================================================ */

function CupStockCard({ cup }) {
  const status = getCupStatus(cup)
  const percentage = getCupPercentage(cup)

  const barColorMap = {
    CRITICAL: 'from-red-400 to-red-500',
    LOW: 'from-amber-400 to-amber-500',
    NORMAL: 'from-emerald-400 to-emerald-500',
  }

  const statusKey = cup.stok_sekarang <= CRITICAL_STOCK_THRESHOLD
    ? 'CRITICAL'
    : cup.stok_sekarang <= LOW_STOCK_THRESHOLD
    ? 'LOW'
    : 'NORMAL'

  return (
    <div className={`bg-white rounded-2xl border ${status.border} p-4 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg}`}>
          <Package size={18} className={status.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {cup.nama_cup}
            </h3>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold
              px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Terjual: {cup.terjual_cup || 0} · Awal: {cup.stok_awal}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-2xl font-black ${status.text}`}>
            {cup.stok_sekarang}
          </p>
          <p className="text-[9px] text-gray-400">sisa</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all
              duration-700 ease-out ${barColorMap[statusKey]}`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-400">{percentage}% tersisa</span>
          <span className="text-[9px] text-gray-400">
            {cup.stok_sekarang}/{cup.stok_awal}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MENU LIST ITEM COMPONENT
   ================================================================ */

function MenuListItem({ item, cup, onSell, disabled }) {
  const isOutOfStock = !cup || cup.stok_sekarang <= 0
  const isLowStock = cup && cup.stok_sekarang <= LOW_STOCK_THRESHOLD

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden
        transition-all duration-200 ${
          isOutOfStock
            ? 'border-gray-200 opacity-60'
            : 'border-gray-100 hover:shadow-md active:bg-gray-50'
        }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center
              flex-shrink-0 ${
                isOutOfStock ? 'bg-gray-100' : 'bg-amber-50'
              }`}
          >
            <Coffee
              size={20}
              className={isOutOfStock ? 'text-gray-300' : 'text-amber-400'}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${
              isOutOfStock ? 'text-gray-400' : 'text-gray-800'
            }`}>
              {item.nama_item}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {cup && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400'
                    : isLowStock
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {cup.nama_cup} · {cup.stok_sekarang} sisa
                </span>
              )}
            </div>
          </div>

          {/* Price + Action */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className={`text-base font-bold ${
              isOutOfStock ? 'text-gray-300' : 'text-amber-600'
            }`}>
              {formatRp(item.harga_jual)}
            </span>

            <button
              onClick={() => !isOutOfStock && !disabled && onSell(item)}
              disabled={isOutOfStock || disabled}
              className={`w-10 h-10 rounded-xl flex items-center justify-center
                transition-all active:scale-90 ${
                  isOutOfStock || disabled
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'bg-emerald-600 cursor-pointer shadow-sm shadow-emerald-200'
                }`}
            >
              {isOutOfStock ? (
                <X size={16} className="text-gray-300" />
              ) : (
                <Plus size={18} className="text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Out of stock notice */}
        {isOutOfStock && (
          <div className="mt-2 flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-1.5">
            <AlertTriangle size={11} className="text-red-400" />
            <span className="text-[10px] text-red-500 font-medium">
              Stok cup habis — tidak bisa dijual
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   RECENT TRANSACTION COMPONENT
   ================================================================ */

function RecentTransactions({ transactions, onToggle, isOpen }) {
  if (transactions.length === 0) return null

  const todayTotal = transactions.reduce(
    (acc, t) => acc + (parseFloat(t.total_bayar) || 0), 0
  )
  const todayCups = transactions.reduce(
    (acc, t) => acc + (t.jumlah_beli || 0), 0
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between cursor-pointer
          active:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">
              Penjualan Hari Ini
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {transactions.length} transaksi · {todayCups} cup · {formatRp(todayTotal)}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Transaction List */}
      {isOpen && (
        <div>
          {transactions.map((trx, idx) => (
            <div
              key={trx.id_transaksi}
              className={`px-4 py-3 ${
                idx < transactions.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Coffee size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {trx.menu_jualan?.nama_item || 'Menu'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">
                      {formatTime(trx.tanggal_jam)}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                      {trx.jumlah_beli} cup
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 flex-shrink-0">
                  +{formatRp(trx.total_bayar)}
                </span>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-400">
              Total Hari Ini
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600">{todayCups} cup</span>
              <span className="text-xs font-bold text-emerald-600">{formatRp(todayTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   STOCK ALERTS COMPONENT
   ================================================================ */

function StockAlerts({ cups }) {
  const alerts = useMemo(() => {
    return cups
      .filter((c) => c.stok_sekarang <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stok_sekarang - b.stok_sekarang)
  }, [cups])

  if (alerts.length === 0) return null

  const hasCritical = alerts.some((c) => c.stok_sekarang <= CRITICAL_STOCK_THRESHOLD)

  return (
    <div className={`rounded-2xl p-4 border shadow-sm ${
      hasCritical
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          hasCritical ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          <AlertTriangle size={15} className={hasCritical ? 'text-red-500' : 'text-amber-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${hasCritical ? 'text-red-700' : 'text-amber-700'}`}>
            {hasCritical ? 'Stok Cup Kritis!' : 'Stok Cup Menipis'}
          </p>
          <div className="mt-1.5 space-y-1">
            {alerts.map((cup) => {
              const status = getCupStatus(cup)
              return (
                <div key={cup.id_cup} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span className="text-xs text-gray-700">{cup.nama_cup}</span>
                  </div>
                  <span className={`text-xs font-bold ${status.text}`}>
                    {cup.stok_sekarang} sisa
                  </span>
                </div>
              )
            })}
          </div>
          <p className={`text-[10px] mt-2 ${hasCritical ? 'text-red-500' : 'text-amber-500'}`}>
            Segera lapor ke pemilik untuk restock!
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   SUCCESS ANIMATION OVERLAY
   ================================================================ */

function SuccessOverlay({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
      <div className="bg-emerald-600 text-white px-8 py-6 rounded-3xl shadow-2xl
        flex flex-col items-center animate-scaleIn">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
          <CheckCircle size={32} />
        </div>
        <p className="text-lg font-bold">{message}</p>
        <p className="text-emerald-200 text-sm mt-1">Stok cup otomatis terpotong</p>
      </div>
    </div>
  )
}

/* ================================================================
   EMPTY MENU STATE
   ================================================================ */

function EmptyMenuState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Coffee size={24} className="text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-sm">Belum ada menu</p>
      <p className="text-gray-300 text-xs mt-1 max-w-[200px] mx-auto">
        Pemilik perlu menambahkan menu terlebih dahulu
      </p>
    </div>
  )
}

/* ================================================================
   STAT CARD COMPONENT
   ================================================================ */

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
        <Icon size={14} className={color} />
      </div>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-extrabold text-gray-900 mt-0.5 leading-tight break-all">
        {value}
      </p>
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT: DashboardPegawai
   ================================================================ */

export default function DashboardPegawai() {
  const { user, signOut } = useAuth()

  /* --------------------------------
     State
     -------------------------------- */
  const [menu, setMenu] = useState([])
  const [cups, setCups] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal & UI states
  const [saleItem, setSaleItem] = useState(null)
  const [saleQuantity, setSaleQuantity] = useState(1)
  const [showLogout, setShowLogout] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cupFilter, setCupFilter] = useState('all')

  // Toast
  const [toast, setToast] = useState(null)

  const fetchRef = useRef(0)

  /* --------------------------------
     Toast
     -------------------------------- */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  /* --------------------------------
     Fetch Data
     -------------------------------- */
  const fetchData = useCallback(async () => {
    const currentFetch = ++fetchRef.current

    try {
      const [menuRes, cupsRes, trxRes] = await Promise.all([
        supabase
          .from('menu_jualan')
          .select('*, inventory_cup(id_cup, nama_cup, stok_sekarang, stok_awal, terjual_cup)')
          .order('nama_item'),
        supabase
          .from('inventory_cup')
          .select('*')
          .order('nama_cup'),
        supabase
          .from('transaksi_penjualan')
          .select('*, menu_jualan(nama_item)')
          .gte('tanggal_jam', `${new Date().toISOString().split('T')[0]}T00:00:00`)
          .order('tanggal_jam', { ascending: false })
          .limit(RECENT_TRANSACTIONS_LIMIT),
      ])

      if (currentFetch !== fetchRef.current) return

      if (menuRes.error) console.error('Menu error:', menuRes.error)
      if (cupsRes.error) console.error('Cups error:', cupsRes.error)
      if (trxRes.error) console.error('Trx error:', trxRes.error)

      setMenu(menuRes.data || [])
      setCups(cupsRes.data || [])
      setRecentTransactions(trxRes.data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      showToast('Gagal memuat data', 'error')
    } finally {
      if (currentFetch === fetchRef.current) {
        setLoading(false)
      }
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!saleItem && !showLogout) {
        fetchData()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchData, saleItem, showLogout])

  /* --------------------------------
     Sale Handler
     -------------------------------- */
  const handleStartSale = useCallback((item) => {
    setSaleItem(item)
    setSaleQuantity(1)
  }, [])

  const handleConfirmSale = useCallback(async () => {
    if (!saleItem) return
    setActionLoading(true)

    const cup = cups.find((c) => c.id_cup === saleItem.id_cup)
    if (!cup || cup.stok_sekarang < saleQuantity) {
      showToast('Stok cup tidak cukup!', 'error')
      setActionLoading(false)
      return
    }

    try {
      const totalBayar = saleItem.harga_jual * saleQuantity

      // 1. Insert transaction
      const { error: trxError } = await supabase
        .from('transaksi_penjualan')
        .insert({
          id_menu: saleItem.id_menu,
          jumlah_beli: saleQuantity,
          total_bayar: totalBayar,
        })

      if (trxError) {
        showToast('Gagal mencatat transaksi: ' + trxError.message, 'error')
        setActionLoading(false)
        return
      }

      // 2. Update cup stock
      const { error: cupError } = await supabase
        .from('inventory_cup')
        .update({
          stok_sekarang: cup.stok_sekarang - saleQuantity,
          terjual_cup: (cup.terjual_cup || 0) + saleQuantity,
        })
        .eq('id_cup', cup.id_cup)

      if (cupError) {
        showToast('Transaksi tercatat, tapi stok cup gagal diupdate!', 'warning')
      }

      // 3. Success
      setSaleItem(null)
      setSuccessMessage(`${saleQuantity} ${saleItem.nama_item} Terjual!`)

      // 4. Refresh data
      fetchData()
    } catch (err) {
      console.error('Sale error:', err)
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setActionLoading(false)
    }
  }, [saleItem, saleQuantity, cups, fetchData, showToast])

  /* --------------------------------
     Logout Handler
     -------------------------------- */
  const handleLogout = useCallback(async () => {
    try {
      await signOut()
    } catch (err) {
      showToast('Gagal logout', 'error')
    }
  }, [signOut, showToast])

  /* --------------------------------
     Computed
     -------------------------------- */
  const greeting = useMemo(() => getGreeting(), [])

  const filteredMenu = useMemo(() => {
    let result = menu

    if (cupFilter !== 'all') {
      result = result.filter((m) => m.id_cup === parseInt(cupFilter))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((m) => m.nama_item.toLowerCase().includes(q))
    }

    return result
  }, [menu, cupFilter, searchQuery])

  const todayStats = useMemo(() => {
    const totalRevenue = recentTransactions.reduce(
      (a, t) => a + (parseFloat(t.total_bayar) || 0), 0
    )
    const totalCups = recentTransactions.reduce(
      (a, t) => a + (t.jumlah_beli || 0), 0
    )
    return {
      transactions: recentTransactions.length,
      revenue: totalRevenue,
      cups: totalCups,
    }
  }, [recentTransactions])

  const cupsMap = useMemo(() => {
    const map = {}
    cups.forEach((c) => { map[c.id_cup] = c })
    return map
  }, [cups])

  /* --------------------------------
     Loading State
     -------------------------------- */
  if (loading) return <SkeletonPage />

  /* --------------------------------
     Render
     -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-8">
        {/* ====== TOAST ====== */}
        {toast && (
          <Toast
            key={toast.key}
            message={toast.message}
            type={toast.type}
            onClose={dismissToast}
          />
        )}

        {/* ====== SUCCESS OVERLAY ====== */}
        {successMessage && (
          <SuccessOverlay
            message={successMessage}
            onDone={() => setSuccessMessage(null)}
          />
        )}

        {/* ====== CONFIRM SALE MODAL ====== */}
        {saleItem && (
          <ConfirmSaleModal
            item={saleItem}
            cup={cupsMap[saleItem.id_cup]}
            quantity={saleQuantity}
            loading={actionLoading}
            onConfirm={handleConfirmSale}
            onCancel={() => setSaleItem(null)}
            onQuantityChange={setSaleQuantity}
          />
        )}

        {/* ====== LOGOUT MODAL ====== */}
        {showLogout && (
          <LogoutModal
            onConfirm={handleLogout}
            onCancel={() => setShowLogout(false)}
          />
        )}

        {/* ====== HEADER ====== */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
              {greeting.emoji} {greeting.text}
            </p>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">
              Mode Kasir
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-10 h-10 bg-white rounded-full border border-gray-200
                flex items-center justify-center cursor-pointer active:scale-95
                shadow-sm transition-all"
              aria-label="Refresh"
            >
              <RefreshCw size={15} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowLogout(true)}
              className="w-10 h-10 bg-white rounded-full border border-gray-200
                flex items-center justify-center cursor-pointer active:scale-95
                shadow-sm transition-all"
              aria-label="Logout"
            >
              <LogOut size={15} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ====== STOCK ALERTS ====== */}
        <StockAlerts cups={cups} />

        {/* ====== CUP STOCK STATUS ====== */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
            Stok Cup
          </h2>
          {cups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <Package size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Belum ada data cup</p>
            </div>
          ) : (
            cups.map((cup) => (
              <CupStockCard key={cup.id_cup} cup={cup} />
            ))
          )}
        </div>

        {/* ====== TODAY'S STATS ====== */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Transaksi"
            value={todayStats.transactions}
            icon={Receipt}
            color="text-blue-500"
            bg="bg-blue-50"
          />
          <StatCard
            label="Cup Terjual"
            value={todayStats.cups}
            icon={Coffee}
            color="text-amber-500"
            bg="bg-amber-50"
          />
          <StatCard
            label="Pendapatan"
            value={formatRp(todayStats.revenue)}
            icon={DollarSign}
            color="text-emerald-500"
            bg="bg-emerald-50"
          />
        </div>

        {/* ====== MENU SECTION ====== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Menu Jualan
            </h2>
            <span className="text-[10px] text-gray-400">
              {filteredMenu.length} menu
            </span>
          </div>

          {/* Search */}
          {menu.length > 4 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu..."
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
            </div>
          )}

          {/* Cup Filter */}
          {cups.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCupFilter('all')}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer
                  whitespace-nowrap min-h-[34px] transition-all active:scale-95 ${
                    cupFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
              >
                Semua ({menu.length})
              </button>
              {cups.map((cup) => {
                const count = menu.filter((m) => m.id_cup === cup.id_cup).length
                return (
                  <button
                    key={cup.id_cup}
                    onClick={() => setCupFilter(cup.id_cup.toString())}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer
                      whitespace-nowrap min-h-[34px] transition-all active:scale-95 ${
                        cupFilter === cup.id_cup.toString()
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white text-gray-500 border border-gray-200'
                      }`}
                  >
                    {cup.nama_cup} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Menu Items */}
          {filteredMenu.length === 0 ? (
            searchQuery ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                <Search size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">Tidak ditemukan</p>
                <p className="text-gray-300 text-xs mt-1">
                  Tidak ada menu "{searchQuery}"
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setCupFilter('all') }}
                  className="mt-3 text-xs font-semibold text-blue-600 bg-blue-50
                    px-4 py-2 rounded-xl cursor-pointer active:bg-blue-100 transition-colors"
                >
                  Reset
                </button>
              </div>
            ) : (
              <EmptyMenuState />
            )
          ) : (
            <div className="space-y-2">
              {filteredMenu.map((item) => (
                <MenuListItem
                  key={item.id_menu}
                  item={item}
                  cup={cupsMap[item.id_cup]}
                  onSell={handleStartSale}
                  disabled={actionLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* ====== RECENT TRANSACTIONS ====== */}
        <RecentTransactions
          transactions={recentTransactions}
          isOpen={showTransactions}
          onToggle={() => setShowTransactions((prev) => !prev)}
        />

        {/* ====== FOOTER INFO ====== */}
        {todayStats.transactions > 0 && (
          <div className="bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Pendapatan Hari Ini</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {todayStats.transactions} transaksi · {todayStats.cups} cup
                </p>
              </div>
              <p className="text-2xl font-black text-white">
                {formatRp(todayStats.revenue)}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-[11px] text-gray-400">
                  Avg {formatRp(Math.round(todayStats.revenue / todayStats.transactions))}/trx
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coffee size={12} className="text-gray-500" />
                <span className="text-[11px] text-gray-400">
                  {(todayStats.cups / todayStats.transactions).toFixed(1)} cup/trx
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ====== BRANDING FOOTER ====== */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[10px] text-gray-300 font-medium">
            Putra Collection Ceria
          </p>
          <p className="text-[9px] text-gray-200 mt-0.5">
            Mode Kasir · {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}