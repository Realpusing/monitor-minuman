import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  ShoppingBag, Plus, Minus, Send, Clock, CheckCircle,
  Coffee, Trash2, Receipt, TrendingUp, FileText, X, Eye,
  ChevronUp, ChevronDown, Search, AlertTriangle, Info,
  Package, DollarSign, ArrowRight, RefreshCw, Hash,
  BookOpen, Tag, Zap, Star
} from 'lucide-react'

/* ================================================================
   CONSTANTS
   ================================================================ */

const RIWAYAT_LIMIT = 25

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
          flex items-center gap-2.5 text-sm font-medium min-w-[280px]
          max-w-[90vw]`}
      >
        {icon}
        <span className="flex-1 leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg cursor-pointer flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   SUCCESS OVERLAY COMPONENT
   ================================================================ */

function SuccessOverlay({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
      <div
        className="bg-emerald-600 text-white px-8 py-6 rounded-3xl shadow-2xl
          flex flex-col items-center animate-scaleIn"
      >
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
          <CheckCircle size={32} />
        </div>
        <p className="text-lg font-bold">{message}</p>
        <p className="text-emerald-200 text-sm mt-1">Berhasil dicatat</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100" />
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm">
              <SkeletonPulse className="w-8 h-8 rounded-lg mb-2" />
              <SkeletonPulse className="w-14 h-2.5 mb-2" />
              <SkeletonPulse className="w-10 h-5" />
            </div>
          ))}
        </div>
        <SkeletonPulse className="w-full h-10 rounded-full" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonPulse key={i} className="w-full h-[72px] rounded-2xl" />
        ))}
      </div>
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
   FILTER CHIPS COMPONENT
   ================================================================ */

function FilterChips({ categories, active, onFilter }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onFilter(cat.key)}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer
            whitespace-nowrap min-h-[34px] transition-all duration-200
            active:scale-95 ${
              active === cat.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
        >
          {cat.label}
          <span className="ml-1 text-[10px] opacity-70">{cat.count}</span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================
   MENU LIST ITEM COMPONENT (MOBILE-FRIENDLY ROW)
   ================================================================ */

function MenuListItem({ item, cup, quantity, hasResep, onAdd, onRemove, onViewResep }) {
  const cupLabel = cup?.nama_cup || `Cup #${item.id_cup}`
  const isJumbo = item.id_cup === 2

  return (
    <div
      className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden
        transition-all duration-200 ${
          quantity > 0
            ? 'border-amber-400 shadow-amber-100'
            : 'border-gray-100'
        }`}
    >
      <div className="p-3.5">
        <div className="flex items-center gap-3">
          {/* Left: Icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center
              flex-shrink-0 ${
                quantity > 0 ? 'bg-amber-100' : 'bg-gray-50'
              }`}
          >
            <Coffee
              size={20}
              className={quantity > 0 ? 'text-amber-500' : 'text-gray-300'}
            />
          </div>

          {/* Center: Info (tap to view recipe) */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onViewResep(item)}
          >
            <p className="text-sm font-semibold text-gray-800 truncate">
              {item.nama_item}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isJumbo
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {cupLabel}
              </span>
              {hasResep && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500">
                  📝 Resep
                </span>
              )}
              <span className="text-[10px] text-amber-600 font-bold">
                {formatRp(item.harga_jual)}
              </span>
            </div>
          </div>

          {/* Right: Quantity Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {quantity > 0 && (
              <button
                onClick={() => onRemove(item.id_menu)}
                className="w-9 h-9 rounded-xl bg-red-100 text-red-500 flex items-center
                  justify-center cursor-pointer active:scale-90 transition-all"
              >
                <Minus size={16} />
              </button>
            )}

            {quantity > 0 && (
              <span className="w-7 text-center text-base font-bold text-gray-900">
                {quantity}
              </span>
            )}

            <button
              onClick={() => onAdd(item.id_menu)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center
                cursor-pointer active:scale-90 transition-all ${
                  quantity > 0
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                }`}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Subtotal when qty > 0 */}
        {quantity > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-100 flex items-center justify-between ml-14">
            <span className="text-[10px] text-gray-400">
              {quantity} × {formatRp(item.harga_jual)}
            </span>
            <span className="text-sm font-bold text-amber-600">
              {formatRp(item.harga_jual * quantity)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   RESEP MODAL COMPONENT
   ================================================================ */

function ResepModal({ item, cup, quantity, onAdd, onRemove, onClose }) {
  if (!item) return null

  const hasResep = item.keterangan?.trim()
  const cupLabel = cup?.nama_cup || `Cup #${item.id_cup}`
  const isJumbo = item.id_cup === 2

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh]
          flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <Coffee size={22} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {item.nama_item}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isJumbo
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {cupLabel}
                  </span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatRp(item.harga_jual)}
                  </span>
                </div>
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
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Recipe */}
          {hasResep ? (
            <div>
              <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-3">
                <BookOpen size={13} className="text-amber-500" />
                Resep / Cara Buat
              </h4>
              <div
                className="bg-amber-50 border border-amber-100 rounded-xl p-4
                  text-sm text-gray-700 whitespace-pre-line leading-relaxed"
              >
                {item.keterangan}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Belum ada resep untuk menu ini</p>
            </div>
          )}

          {/* Quantity Control in Modal */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Jumlah
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onRemove(item.id_menu)}
                  disabled={quantity <= 0}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center
                    cursor-pointer active:scale-90 transition-all ${
                      quantity > 0
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                >
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-black text-gray-900 w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => onAdd(item.id_menu)}
                  className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600
                    flex items-center justify-center cursor-pointer active:scale-90
                    transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {quantity > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {quantity} × {formatRp(item.harga_jual)}
                </span>
                <span className="text-lg font-bold text-amber-600">
                  {formatRp(item.harga_jual * quantity)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-amber-700">
                {quantity} cup di keranjang
              </span>
              <span className="text-base font-bold text-amber-700">
                {formatRp(item.harga_jual * quantity)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item.id_menu)}
              className="w-full py-3.5 rounded-xl font-semibold bg-emerald-600
                text-white cursor-pointer active:scale-[0.98] flex items-center
                justify-center gap-2 transition-transform shadow-sm"
            >
              <Plus size={16} />
              Tambah ke Keranjang
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   CART MODAL COMPONENT
   ================================================================ */

function CartModal({
  cart,
  menu,
  totalItem,
  totalHarga,
  loading,
  onUpdateCart,
  onClearCart,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh]
          flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Keranjang
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalItem} item
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalItem > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-red-500 font-semibold flex items-center gap-1
                  cursor-pointer px-2.5 py-1.5 bg-red-50 rounded-lg
                  active:bg-red-100 transition-colors"
              >
                <Trash2 size={11} />
                Hapus
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="overflow-y-auto flex-1">
          {totalItem === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold text-sm">
                Keranjang kosong
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Tambahkan menu untuk mulai
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menu.find((m) => m.id_menu === parseInt(id))
                if (!item) return null

                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.nama_item}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {qty} × {formatRp(item.harga_jual)}
                      </p>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateCart(item.id_menu, -1)}
                        className="w-7 h-7 rounded-lg bg-red-100 text-red-500
                          flex items-center justify-center active:bg-red-200
                          cursor-pointer transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-gray-800 w-5 text-center text-xs">
                        {qty}
                      </span>
                      <button
                        onClick={() => onUpdateCart(item.id_menu, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600
                          flex items-center justify-center active:bg-emerald-200
                          cursor-pointer transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-amber-600 min-w-[70px] text-right">
                      {formatRp(item.harga_jual * qty)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Checkout */}
        {totalItem > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-semibold">Total</span>
              <span className="text-2xl font-black text-gray-900">
                {formatRp(totalHarga)}
              </span>
            </div>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold bg-emerald-600
                text-white shadow-lg shadow-emerald-200 flex items-center
                justify-center gap-2 cursor-pointer active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {loading ? 'Memproses...' : `Catat Penjualan — ${formatRp(totalHarga)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   HISTORY MODAL COMPONENT
   ================================================================ */

function HistoryModal({ riwayat, todayTotal, todayCups, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh]
          flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Riwayat Hari Ini
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {riwayat.length} transaksi · {todayCups} cup
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

        {/* Transactions */}
        <div className="overflow-y-auto flex-1">
          {riwayat.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold text-sm">
                Belum ada transaksi
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Riwayat penjualan akan muncul di sini
              </p>
            </div>
          ) : (
            <div>
              {riwayat.map((trx, idx) => (
                <div
                  key={trx.id_transaksi}
                  className={`px-4 py-3 ${
                    idx < riwayat.length - 1 ? 'border-b border-gray-50' : ''
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
            </div>
          )}
        </div>

        {/* Total Footer */}
        {riwayat.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <p className="text-[10px] text-gray-400">{todayCups} cup terjual</p>
            </div>
            <span className="text-xl font-black text-emerald-600">
              {formatRp(todayTotal)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   MOBILE FLOATING BAR COMPONENT
   ================================================================ */

function MobileFloatingBar({
  totalItem,
  totalHarga,
  onOpenCart,
  onOpenHistory,
  onRefresh,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
      {/* Cart Summary */}
      {totalItem > 0 && (
        <div className="mx-3 mb-2">
          <button
            onClick={onOpenCart}
            className="w-full bg-gray-900 text-white rounded-2xl p-4
              flex items-center justify-between shadow-xl cursor-pointer
              active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <ShoppingBag size={18} className="text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{totalItem} item</p>
                <p className="text-[10px] text-gray-400">Tap untuk checkout</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-400">
                {formatRp(totalHarga)}
              </p>
              <ChevronUp size={12} className="ml-auto text-gray-500" />
            </div>
          </button>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-around">
        <button
          onClick={onOpenHistory}
          className="flex flex-col items-center gap-0.5 py-1 cursor-pointer
            active:scale-95 transition-transform"
        >
          <Clock size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-500 font-medium">Riwayat</span>
        </button>

        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center gap-0.5 py-1
            cursor-pointer active:scale-95 transition-transform"
        >
          <div className="relative">
            <ShoppingBag size={20} className="text-amber-500" />
            {totalItem > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500
                  text-white rounded-full text-[9px] font-bold flex items-center
                  justify-center"
              >
                {totalItem}
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">
            Keranjang
          </span>
        </button>

        <button
          onClick={onRefresh}
          className="flex flex-col items-center gap-0.5 py-1 cursor-pointer
            active:scale-95 transition-transform"
        >
          <RefreshCw size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-500 font-medium">Refresh</span>
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   DESKTOP SIDEBAR COMPONENT
   ================================================================ */

function DesktopSidebar({
  cart,
  menu,
  totalItem,
  totalHarga,
  riwayat,
  todayTotal,
  todayCups,
  loading,
  onUpdateCart,
  onClearCart,
  onSubmit,
}) {
  const [showHistory, setShowHistory] = useState(true)

  return (
    <div className="hidden lg:block space-y-4">
      {/* Cart Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900">
              Keranjang ({totalItem})
            </h3>
          </div>
          {totalItem > 0 && (
            <button
              onClick={onClearCart}
              className="text-[10px] text-red-500 font-semibold flex items-center gap-1
                cursor-pointer px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100
                transition-colors"
            >
              <Trash2 size={10} />
              Hapus
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {totalItem === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-xs">Keranjang kosong</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menu.find((m) => m.id_menu === parseInt(id))
                if (!item) return null
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2.5 bg-gray-50
                      rounded-xl group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {item.nama_item}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {qty} × {formatRp(item.harga_jual)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs font-bold text-amber-600">
                        {formatRp(item.harga_jual * qty)}
                      </span>
                      <button
                        onClick={() => onUpdateCart(item.id_menu, -qty)}
                        className="p-1 text-gray-300 hover:text-red-500 cursor-pointer
                          opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} />
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800">Total</span>
            <span className="text-xl font-black text-gray-900">
              {formatRp(totalHarga)}
            </span>
          </div>
          <button
            onClick={onSubmit}
            disabled={loading || totalItem === 0}
            className={`w-full py-3 rounded-xl font-semibold flex items-center
              justify-center gap-2 cursor-pointer transition-all ${
                totalItem > 0
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {loading ? 'Memproses...' : 'Catat Penjualan'}
          </button>
        </div>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-4 flex items-center justify-between cursor-pointer
            active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">
              Riwayat ({riwayat.length})
            </h3>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-300 ${
              showHistory ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showHistory && (
          <>
            <div className="max-h-72 overflow-y-auto">
              {riwayat.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-400 text-xs">Belum ada transaksi</p>
                </div>
              ) : (
                riwayat.slice(0, 10).map((trx, idx) => (
                  <div
                    key={trx.id_transaksi}
                    className={`px-4 py-2.5 hover:bg-gray-50 ${
                      idx < Math.min(riwayat.length, 10) - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {trx.menu_jualan?.nama_item}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {formatTime(trx.tanggal_jam)}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            · {trx.jumlah_beli} cup
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        +{formatRp(trx.total_bayar)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {riwayat.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400">
                  {todayCups} cup
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {formatRp(todayTotal)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   EMPTY MENU STATE
   ================================================================ */

function EmptyMenuState({ hasFilter, onClear }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Coffee size={24} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-semibold text-sm">
        {hasFilter ? 'Tidak ditemukan' : 'Belum ada menu'}
      </p>
      <p className="text-gray-300 text-xs mt-1 max-w-[200px] mx-auto">
        {hasFilter
          ? 'Coba ubah filter pencarian'
          : 'Pemilik perlu menambahkan menu'}
      </p>
      {hasFilter && (
        <button
          onClick={onClear}
          className="mt-3 text-xs font-semibold text-blue-600 bg-blue-50
            px-4 py-2 rounded-xl cursor-pointer active:bg-blue-100
            transition-colors"
        >
          Reset Filter
        </button>
      )}
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT: KasirPage
   ================================================================ */

export default function KasirPage() {
  const { user } = useAuth()

  /* --------------------------------
     State
     -------------------------------- */
  const [menu, setMenu] = useState([])
  const [cups, setCups] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // UI states
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [resepModal, setResepModal] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

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
     Fetch
     -------------------------------- */
  const fetchAll = useCallback(async () => {
    const currentFetch = ++fetchRef.current

    try {
      const [menuRes, cupsRes, riwayatRes] = await Promise.all([
        supabase
          .from('menu_jualan')
          .select('*, inventory_cup(nama_cup)')
          .order('id_cup, harga_jual'),
        supabase
          .from('inventory_cup')
          .select('*')
          .order('id_cup'),
        supabase
          .from('transaksi_penjualan')
          .select('*, menu_jualan(nama_item, harga_jual)')
          .eq('kasir_id', user.id)
          .gte('tanggal_jam', new Date().toISOString().split('T')[0])
          .order('tanggal_jam', { ascending: false })
          .limit(RIWAYAT_LIMIT),
      ])

      if (currentFetch !== fetchRef.current) return

      setMenu(menuRes.data || [])
      setCups(cupsRes.data || [])
      setRiwayat(riwayatRes.data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      showToast('Gagal memuat data', 'error')
    } finally {
      if (currentFetch === fetchRef.current) {
        setLoading(false)
      }
    }
  }, [user?.id, showToast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!resepModal && !showCart && !showHistory) {
        fetchAll()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchAll, resepModal, showCart, showHistory])

  /* --------------------------------
     Cart Handlers
     -------------------------------- */
  const updateCart = useCallback((id_menu, delta) => {
    setCart((prev) => {
      const current = prev[id_menu] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [id_menu]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id_menu]: next }
    })
  }, [])

  const addToCart = useCallback(
    (id_menu) => updateCart(id_menu, 1),
    [updateCart]
  )

  const removeFromCart = useCallback(
    (id_menu) => updateCart(id_menu, -1),
    [updateCart]
  )

  const clearCart = useCallback(() => setCart({}), [])

  /* --------------------------------
     Submit Handler
     -------------------------------- */
  const handleSubmit = useCallback(async () => {
    const entries = Object.entries(cart)
    if (entries.length === 0) return

    setActionLoading(true)

    try {
      const inserts = entries.map(([id_menu, jumlah]) => ({
        id_menu: parseInt(id_menu),
        jumlah_beli: jumlah,
        kasir_id: user.id,
      }))

      const { error } = await supabase.from('transaksi_penjualan').insert(inserts)
      if (error) throw error

      const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)
      setSuccessMessage(`${totalItems} item berhasil dicatat!`)
      setCart({})
      setShowCart(false)
      fetchAll()
    } catch (err) {
      showToast('Gagal mencatat: ' + err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }, [cart, user?.id, fetchAll, showToast])

  /* --------------------------------
     Computed
     -------------------------------- */
  const totalItem = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart]
  )

  const totalHarga = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = menu.find((m) => m.id_menu === parseInt(id))
        return sum + (item?.harga_jual || 0) * qty
      }, 0),
    [cart, menu]
  )

  const todayTotal = useMemo(
    () => riwayat.reduce((sum, r) => sum + (r.total_bayar || 0), 0),
    [riwayat]
  )

  const todayCups = useMemo(
    () => riwayat.reduce((sum, r) => sum + (r.jumlah_beli || 0), 0),
    [riwayat]
  )

  const categories = useMemo(
    () => [
      { key: 'all', label: 'Semua', count: menu.length },
      ...cups.map((c) => ({
        key: c.id_cup,
        label: c.nama_cup,
        count: menu.filter((m) => m.id_cup === c.id_cup).length,
      })),
    ],
    [cups, menu]
  )

  const filteredMenu = useMemo(() => {
    let result = menu

    if (activeCategory !== 'all') {
      result = result.filter((m) => m.id_cup === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((m) => m.nama_item.toLowerCase().includes(q))
    }

    return result
  }, [menu, activeCategory, searchQuery])

  const cupsMap = useMemo(() => {
    const map = {}
    cups.forEach((c) => {
      map[c.id_cup] = c
    })
    return map
  }, [cups])

  const isFiltered = activeCategory !== 'all' || searchQuery.trim()

  /* --------------------------------
     Loading
     -------------------------------- */
  if (loading) return <SkeletonPage />

  /* --------------------------------
     Render
     -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-6">
      <Navbar />

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

      {/* ====== RESEP MODAL ====== */}
      {resepModal && (
        <ResepModal
          item={resepModal}
          cup={cupsMap[resepModal.id_cup]}
          quantity={cart[resepModal.id_menu] || 0}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClose={() => setResepModal(null)}
        />
      )}

      {/* ====== CART MODAL (MOBILE) ====== */}
      {showCart && (
        <div className="lg:hidden">
          <CartModal
            cart={cart}
            menu={menu}
            totalItem={totalItem}
            totalHarga={totalHarga}
            loading={actionLoading}
            onUpdateCart={updateCart}
            onClearCart={clearCart}
            onSubmit={handleSubmit}
            onClose={() => setShowCart(false)}
          />
        </div>
      )}

      {/* ====== HISTORY MODAL (MOBILE) ====== */}
      {showHistory && (
        <div className="lg:hidden">
          <HistoryModal
            riwayat={riwayat}
            todayTotal={todayTotal}
            todayCups={todayCups}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* ====== MAIN CONTENT ====== */}
      <div className="max-w-7xl mx-auto px-4 pt-4 lg:pt-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Transaksi"
            value={riwayat.length}
            icon={Receipt}
            color="text-blue-500"
            bg="bg-blue-50"
          />
          <StatCard
            label="Cup Terjual"
            value={todayCups}
            icon={Coffee}
            color="text-amber-500"
            bg="bg-amber-50"
          />
          <StatCard
            label="Pendapatan"
            value={formatRp(todayTotal)}
            icon={DollarSign}
            color="text-emerald-500"
            bg="bg-emerald-50"
          />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* ====== MENU SECTION ====== */}
          <div className="lg:col-span-2 space-y-4">
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
                      className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer
                        transition-colors"
                    >
                      <X size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <FilterChips
              categories={categories}
              active={activeCategory}
              onFilter={setActiveCategory}
            />

            {/* Menu List */}
            {filteredMenu.length === 0 ? (
              <EmptyMenuState
                hasFilter={isFiltered}
                onClear={() => {
                  setActiveCategory('all')
                  setSearchQuery('')
                }}
              />
            ) : (
              <div className="space-y-2">
                {filteredMenu.map((item) => (
                  <MenuListItem
                    key={item.id_menu}
                    item={item}
                    cup={cupsMap[item.id_cup]}
                    quantity={cart[item.id_menu] || 0}
                    hasResep={!!item.keterangan?.trim()}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    onViewResep={setResepModal}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ====== DESKTOP SIDEBAR ====== */}
          <DesktopSidebar
            cart={cart}
            menu={menu}
            totalItem={totalItem}
            totalHarga={totalHarga}
            riwayat={riwayat}
            todayTotal={todayTotal}
            todayCups={todayCups}
            loading={actionLoading}
            onUpdateCart={updateCart}
            onClearCart={clearCart}
            onSubmit={handleSubmit}
          />
        </div>

        {/* ====== TOTAL FOOTER (DESKTOP) ====== */}
        {todayTotal > 0 && (
          <div className="hidden lg:block bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">
                  Pendapatan Hari Ini
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {riwayat.length} transaksi · {todayCups} cup
                </p>
              </div>
              <p className="text-2xl font-black text-white">
                {formatRp(todayTotal)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====== MOBILE FLOATING BAR ====== */}
      <MobileFloatingBar
        totalItem={totalItem}
        totalHarga={totalHarga}
        onOpenCart={() => setShowCart(true)}
        onOpenHistory={() => setShowHistory(true)}
        onRefresh={fetchAll}
      />
    </div>
  )
}