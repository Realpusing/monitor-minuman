// src/pages/KasirPage.jsx

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import {
  ShoppingBag, Plus, Minus, Send, Clock, CheckCircle,
  Coffee, Trash2, Receipt, TrendingUp, FileText, X, Eye,
  ChevronUp, ChevronDown, Search, AlertTriangle, Info,
  Package, DollarSign, ArrowRight, RefreshCw, Hash,
  BookOpen, Tag
} from 'lucide-react'
import { rp } from '../utils/helpers'

/* ================================================================
   CONSTANTS
   ================================================================ */

const RIWAYAT_LIMIT = 25

/* ================================================================
   HELPERS
   ================================================================ */

const fTime = (d) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

/* ================================================================
   TOAST
   ================================================================ */

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const cfg = {
    success: { bg: 'bg-emerald-600', icon: <CheckCircle size={16} /> },
    error:   { bg: 'bg-red-600',     icon: <AlertTriangle size={16} /> },
    info:    { bg: 'bg-blue-600',    icon: <Info size={16} /> },
  }
  const { bg, icon } = cfg[type] || cfg.info

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center animate-slideDown">
      <div className={`${bg} text-white px-4 py-3 rounded-2xl shadow-2xl
        flex items-center gap-2.5 text-sm font-medium w-full max-w-sm`}>
        {icon}
        <span className="flex-1 leading-snug">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   SUCCESS OVERLAY
   ================================================================ */

function SuccessOverlay({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-emerald-600 text-white px-6 py-5 rounded-3xl shadow-2xl
        flex flex-col items-center animate-scaleIn w-full max-w-[260px]">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
          <CheckCircle size={28} />
        </div>
        <p className="text-base font-bold text-center">{message}</p>
        <p className="text-emerald-200 text-xs mt-1">Berhasil dicatat</p>
      </div>
    </div>
  )
}

/* ================================================================
   SKELETON
   ================================================================ */

function SkeletonPulse({ className = '' }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
}

function SkeletonPage() {
  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100" />
      <div className="w-full max-w-7xl mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
              <SkeletonPulse className="w-8 h-8 rounded-lg mb-2" />
              <SkeletonPulse className="w-12 h-2.5 mb-2" />
              <SkeletonPulse className="w-10 h-5" />
            </div>
          ))}
        </div>
        <SkeletonPulse className="w-full h-10 rounded-2xl" />
        {[0,1,2,3,4].map(i => (
          <SkeletonPulse key={i} className="w-full h-[68px] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   STAT CARD
   ================================================================ */

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm min-w-0">
      <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mb-1.5`}>
        <Icon size={13} className={color} />
      </div>
      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider truncate">
        {label}
      </p>
      <p className="text-base font-extrabold text-gray-900 mt-0.5 leading-tight truncate">
        {value}
      </p>
    </div>
  )
}

/* ================================================================
   FILTER CHIPS
   ================================================================ */

function FilterChips({ categories, active, onFilter }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
      {categories.map(cat => (
        <button key={cat.key} onClick={() => onFilter(cat.key)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer
            whitespace-nowrap min-h-[32px] transition-all active:scale-95 flex-shrink-0
            ${active === cat.key
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200'
            }`}>
          {cat.label}
          <span className="ml-1 text-[10px] opacity-70">{cat.count}</span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================
   MENU LIST ITEM — single row, no card grid
   ================================================================ */

function MenuListItem({ item, cupName, qty, hasResep, onAdd, onRemove, onViewResep }) {
  const isJumbo = item.id_cup === 2

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden
      w-full max-w-full transition-all duration-200
      ${qty > 0 ? 'border-amber-400 shadow-amber-100' : 'border-gray-100'}`}>
      <div className="p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            flex-shrink-0 ${qty > 0 ? 'bg-amber-100' : 'bg-gray-50'}`}>
            <Coffee size={18} className={qty > 0 ? 'text-amber-500' : 'text-gray-300'} />
          </div>

          {/* Info — tap to recipe */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewResep(item)}>
            <p className="text-sm font-semibold text-gray-800 truncate">
              {item.nama_item}
            </p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                ${isJumbo ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                {cupName}
              </span>
              {hasResep && (
                <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full
                  bg-amber-50 text-amber-500 flex-shrink-0">
                  📝
                </span>
              )}
              <span className="text-[10px] text-amber-600 font-bold flex-shrink-0">
                {rp(item.harga_jual)}
              </span>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {qty > 0 && (
              <button onClick={() => onRemove(item.id_menu)}
                className="w-8 h-8 rounded-lg bg-red-100 text-red-500
                  flex items-center justify-center cursor-pointer active:scale-90">
                <Minus size={14} />
              </button>
            )}
            {qty > 0 && (
              <span className="w-6 text-center text-sm font-bold text-gray-900">
                {qty}
              </span>
            )}
            <button onClick={() => onAdd(item.id_menu)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center
                cursor-pointer active:scale-90 transition-all
                ${qty > 0
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                }`}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Subtotal */}
        {qty > 0 && (
          <div className="mt-2 pt-2 border-t border-amber-100 flex items-center
            justify-between ml-[50px]">
            <span className="text-[10px] text-gray-400">
              {qty} × {rp(item.harga_jual)}
            </span>
            <span className="text-sm font-bold text-amber-600">
              {rp(item.harga_jual * qty)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   RESEP MODAL
   ================================================================ */

function ResepModal({ item, cupName, qty, onAdd, onRemove, onClose }) {
  if (!item) return null
  const hasResep = item.keterangan?.trim()
  const isJumbo = item.id_cup === 2

  // Lock body scroll
  useEffect(() => {
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, y)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slideUp">

        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Coffee size={20} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{item.nama_item}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                  ${isJumbo ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {cupName}
                </span>
                <span className="text-sm font-bold text-amber-600">{rp(item.harga_jual)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer flex-shrink-0">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {hasResep ? (
            <div>
              <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-amber-500" />
                Resep / Cara Buat
              </h4>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5
                text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {item.keterangan}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText size={20} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Belum ada resep</p>
            </div>
          )}

          {/* Qty Control */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Jumlah</span>
              <div className="flex items-center gap-2.5">
                <button onClick={() => onRemove(item.id_menu)} disabled={qty <= 0}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center
                    cursor-pointer active:scale-90 transition-all
                    ${qty > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-300 cursor-not-allowed'}`}>
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-black text-gray-900 w-8 text-center">{qty}</span>
                <button onClick={() => onAdd(item.id_menu)}
                  className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600
                    flex items-center justify-center cursor-pointer active:scale-90">
                  <Plus size={18} />
                </button>
              </div>
            </div>
            {qty > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-400">{qty} × {rp(item.harga_jual)}</span>
                <span className="text-lg font-bold text-amber-600">{rp(item.harga_jual * qty)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {qty > 0 ? (
            <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-amber-700">{qty} cup</span>
              <span className="text-base font-bold text-amber-700">{rp(item.harga_jual * qty)}</span>
            </div>
          ) : (
            <button onClick={() => onAdd(item.id_menu)}
              className="w-full py-3.5 rounded-xl font-semibold bg-emerald-600
                text-white cursor-pointer active:scale-[0.98] flex items-center
                justify-center gap-2 transition-transform shadow-sm">
              <Plus size={16} /> Tambah ke Keranjang
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   CART MODAL
   ================================================================ */

function CartModal({ cart, menu, totalItem, totalHarga, loading, onUpdate, onClear, onSubmit, onClose }) {
  // Lock scroll
  useEffect(() => {
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, y)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slideUp">

        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShoppingBag size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Keranjang</h3>
              <p className="text-[10px] text-gray-400">{totalItem} item</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalItem > 0 && (
              <button onClick={onClear}
                className="text-[10px] text-red-500 font-semibold flex items-center gap-1
                  cursor-pointer px-2 py-1 bg-red-50 rounded-lg active:bg-red-100">
                <Trash2 size={10} /> Hapus
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1">
          {totalItem === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold text-sm">Keranjang kosong</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menu.find(m => m.id_menu === parseInt(id))
                if (!item) return null
                return (
                  <div key={id} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_item}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{qty} × {rp(item.harga_jual)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => onUpdate(item.id_menu, -1)}
                        className="w-7 h-7 rounded-lg bg-red-100 text-red-500
                          flex items-center justify-center active:bg-red-200 cursor-pointer">
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-gray-800 w-5 text-center text-xs">{qty}</span>
                      <button onClick={() => onUpdate(item.id_menu, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600
                          flex items-center justify-center active:bg-emerald-200 cursor-pointer">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-amber-600 flex-shrink-0 min-w-[60px] text-right">
                      {rp(item.harga_jual * qty)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Checkout */}
        {totalItem > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-semibold">Total</span>
              <span className="text-xl font-black text-gray-900">{rp(totalHarga)}</span>
            </div>
            <button onClick={onSubmit} disabled={loading}
              className="w-full py-3.5 rounded-2xl font-semibold bg-emerald-600
                text-white shadow-lg shadow-emerald-200 flex items-center
                justify-center gap-2 cursor-pointer active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={16} />
              }
              {loading ? 'Memproses...' : `Catat Penjualan`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   HISTORY MODAL
   ================================================================ */

function HistoryModal({ riwayat, todayTotal, todayCups, onClose }) {
  useEffect(() => {
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, y)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl
        shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slideUp">

        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Riwayat Hari Ini</h3>
              <p className="text-[10px] text-gray-400">{riwayat.length} transaksi · {todayCups} cup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {riwayat.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock size={20} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            riwayat.map((trx, idx) => (
              <div key={trx.id_transaksi}
                className={`px-4 py-3 ${idx < riwayat.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Coffee size={13} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {trx.menu_jualan?.nama_item || 'Menu'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-gray-400">{fTime(trx.tanggal_jam)}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded font-medium">
                        {trx.jumlah_beli} cup
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 flex-shrink-0">
                    +{rp(trx.total_bayar)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {riwayat.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div>
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <p className="text-[10px] text-gray-400">{todayCups} cup</p>
            </div>
            <span className="text-xl font-black text-emerald-600">{rp(todayTotal)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   MOBILE BOTTOM BAR
   ================================================================ */

function MobileBottomBar({ totalItem, totalHarga, onCart, onHistory, onRefresh }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

      {totalItem > 0 && (
        <div className="mx-3 mb-2">
          <button onClick={onCart}
            className="w-full bg-gray-900 text-white rounded-2xl p-3.5
              flex items-center justify-between shadow-xl cursor-pointer
              active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={16} className="text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{totalItem} item</p>
                <p className="text-[10px] text-gray-400">Tap checkout</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-amber-400">{rp(totalHarga)}</p>
            </div>
          </button>
        </div>
      )}

      <div className="bg-white border-t border-gray-100 px-4 py-1.5 flex items-center justify-around">
        <button onClick={onHistory}
          className="flex flex-col items-center gap-0.5 py-1 cursor-pointer active:scale-95">
          <Clock size={18} className="text-gray-400" />
          <span className="text-[9px] text-gray-500 font-medium">Riwayat</span>
        </button>
        <button onClick={onCart}
          className="relative flex flex-col items-center gap-0.5 py-1 cursor-pointer active:scale-95">
          <div className="relative">
            <ShoppingBag size={18} className="text-amber-500" />
            {totalItem > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500
                text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                {totalItem}
              </span>
            )}
          </div>
          <span className="text-[9px] text-amber-600 font-semibold">Keranjang</span>
        </button>
        <button onClick={onRefresh}
          className="flex flex-col items-center gap-0.5 py-1 cursor-pointer active:scale-95">
          <RefreshCw size={18} className="text-gray-400" />
          <span className="text-[9px] text-gray-500 font-medium">Refresh</span>
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   DESKTOP SIDEBAR
   ================================================================ */

function DesktopSidebar({ cart, menu, totalItem, totalHarga, riwayat, todayTotal, todayCups, loading, onUpdate, onClear, onSubmit }) {
  const [showHist, setShowHist] = useState(true)

  return (
    <div className="hidden lg:block space-y-4">
      {/* Cart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
        <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900">Keranjang ({totalItem})</h3>
          </div>
          {totalItem > 0 && (
            <button onClick={onClear}
              className="text-[10px] text-red-500 font-semibold flex items-center gap-1
                cursor-pointer px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100">
              <Trash2 size={10} /> Hapus
            </button>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto">
          {totalItem === 0 ? (
            <div className="p-6 text-center">
              <ShoppingBag size={24} className="text-gray-300 mx-auto mb-1" />
              <p className="text-gray-400 text-xs">Kosong</p>
            </div>
          ) : (
            <div className="p-2.5 space-y-1.5">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menu.find(m => m.id_menu === parseInt(id))
                if (!item) return null
                return (
                  <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.nama_item}</p>
                      <p className="text-[10px] text-gray-400">{qty} × {rp(item.harga_jual)}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <span className="text-xs font-bold text-amber-600">{rp(item.harga_jual * qty)}</span>
                      <button onClick={() => onUpdate(item.id_menu, -qty)}
                        className="p-0.5 text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-3.5 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-bold text-gray-800">Total</span>
            <span className="text-lg font-black text-gray-900">{rp(totalHarga)}</span>
          </div>
          <button onClick={onSubmit} disabled={loading || totalItem === 0}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2
              cursor-pointer transition-all ${totalItem > 0
                ? 'bg-emerald-600 text-white shadow-sm active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={14} />
            }
            {loading ? 'Proses...' : 'Catat'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowHist(!showHist)}
          className="w-full p-3.5 flex items-center justify-between cursor-pointer active:bg-gray-50">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">Riwayat ({riwayat.length})</h3>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${showHist ? 'rotate-180' : ''}`} />
        </button>

        {showHist && (
          <>
            <div className="max-h-64 overflow-y-auto">
              {riwayat.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-400 text-xs">Belum ada</p>
                </div>
              ) : (
                riwayat.slice(0, 10).map((trx, idx) => (
                  <div key={trx.id_transaksi}
                    className={`px-3.5 py-2 hover:bg-gray-50 ${idx < Math.min(riwayat.length, 10) - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{trx.menu_jualan?.nama_item}</p>
                        <span className="text-[10px] text-gray-400">{fTime(trx.tanggal_jam)} · {trx.jumlah_beli} cup</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 flex-shrink-0">+{rp(trx.total_bayar)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {riwayat.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{todayCups} cup</span>
                <span className="text-xs font-bold text-emerald-600">{rp(todayTotal)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   EMPTY STATE
   ================================================================ */

function EmptyMenu({ hasFilter, onClear }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm w-full">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
        <Coffee size={20} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-semibold text-sm">{hasFilter ? 'Tidak ditemukan' : 'Belum ada menu'}</p>
      {hasFilter && (
        <button onClick={onClear}
          className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-4 py-2
            rounded-xl cursor-pointer active:bg-blue-100">
          Reset
        </button>
      )}
    </div>
  )
}

/* ================================================================
   MAIN: KasirPage
   ================================================================ */

export default function KasirPage() {
  const { user } = useAuth()

  const [menu, setMenu] = useState([])
  const [cups, setCups] = useState([])
  const [cart, setCart] = useState({})
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [resepModal, setResepModal] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchRef = useRef(0)

  /* ---- Toast ---- */
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type, key: Date.now() })
  }, [])

  /* ---- Fetch ---- */
  const fetchAll = useCallback(async () => {
    const cur = ++fetchRef.current
    try {
      const [mR, cR, rR] = await Promise.all([
        supabase.from('menu_jualan').select('*, inventory_cup(nama_cup)').order('id_cup, harga_jual'),
        supabase.from('inventory_cup').select('*').order('id_cup'),
        supabase.from('transaksi_penjualan')
          .select('*, menu_jualan(nama_item, harga_jual)')
          .eq('kasir_id', user.id)
          .gte('tanggal_jam', new Date().toISOString().split('T')[0])
          .order('tanggal_jam', { ascending: false })
          .limit(RIWAYAT_LIMIT),
      ])
      if (cur !== fetchRef.current) return
      setMenu(mR.data || [])
      setCups(cR.data || [])
      setRiwayat(rR.data || [])
    } catch (e) {
      console.error(e)
      showToast('Gagal memuat data', 'error')
    } finally {
      if (cur === fetchRef.current) setLoading(false)
    }
  }, [user?.id, showToast])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Auto refresh 30s
  useEffect(() => {
    const i = setInterval(() => {
      if (!resepModal && !showCart && !showHistory) fetchAll()
    }, 30000)
    return () => clearInterval(i)
  }, [fetchAll, resepModal, showCart, showHistory])

  /* ---- Cart ---- */
  const updateCart = useCallback((id, delta) => {
    setCart(p => {
      const n = Math.max(0, (p[id] || 0) + delta)
      if (n === 0) { const { [id]: _, ...rest } = p; return rest }
      return { ...p, [id]: n }
    })
  }, [])

  const addToCart = useCallback((id) => updateCart(id, 1), [updateCart])
  const removeFromCart = useCallback((id) => updateCart(id, -1), [updateCart])
  const clearCart = useCallback(() => setCart({}), [])

  /* ---- Submit ---- */
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
      const total = Object.values(cart).reduce((a, b) => a + b, 0)
      setSuccessMsg(`${total} item berhasil dicatat!`)
      setCart({})
      setShowCart(false)
      fetchAll()
    } catch (e) {
      showToast('Gagal: ' + e.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }, [cart, user?.id, fetchAll, showToast])

  /* ---- Computed ---- */
  const totalItem = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart])

  const totalHarga = useMemo(() =>
    Object.entries(cart).reduce((s, [id, qty]) => {
      const item = menu.find(m => m.id_menu === parseInt(id))
      return s + (item?.harga_jual || 0) * qty
    }, 0), [cart, menu])

  const todayTotal = useMemo(() => riwayat.reduce((s, r) => s + (r.total_bayar || 0), 0), [riwayat])
  const todayCups = useMemo(() => riwayat.reduce((s, r) => s + (r.jumlah_beli || 0), 0), [riwayat])

  const categories = useMemo(() => [
    { key: 'all', label: 'Semua', count: menu.length },
    ...cups.map(c => ({
      key: c.id_cup,
      label: c.nama_cup,
      count: menu.filter(m => m.id_cup === c.id_cup).length,
    })),
  ], [cups, menu])

  const cupsMap = useMemo(() => {
    const m = {}; cups.forEach(c => { m[c.id_cup] = c }); return m
  }, [cups])

  const filteredMenu = useMemo(() => {
    let r = menu
    if (activeCategory !== 'all') r = r.filter(m => m.id_cup === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      r = r.filter(m => m.nama_item.toLowerCase().includes(q))
    }
    return r
  }, [menu, activeCategory, searchQuery])

  const isFiltered = activeCategory !== 'all' || searchQuery.trim()

  /* ---- Loading ---- */
  if (loading) return <SkeletonPage />

  /* ---- Render ---- */
  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-24 lg:pb-6 w-full max-w-full overflow-x-hidden">
      <Navbar />

      {/* Toast */}
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Success */}
      {successMsg && <SuccessOverlay message={successMsg} onDone={() => setSuccessMsg(null)} />}

      {/* Resep Modal */}
      {resepModal && (
        <ResepModal
          item={resepModal}
          cupName={cupsMap[resepModal.id_cup]?.nama_cup || `Cup #${resepModal.id_cup}`}
          qty={cart[resepModal.id_menu] || 0}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClose={() => setResepModal(null)}
        />
      )}

      {/* Cart Modal (mobile) */}
      {showCart && (
        <div className="lg:hidden">
          <CartModal
            cart={cart} menu={menu} totalItem={totalItem} totalHarga={totalHarga}
            loading={actionLoading} onUpdate={updateCart} onClear={clearCart}
            onSubmit={handleSubmit} onClose={() => setShowCart(false)}
          />
        </div>
      )}

      {/* History Modal (mobile) */}
      {showHistory && (
        <div className="lg:hidden">
          <HistoryModal
            riwayat={riwayat} todayTotal={todayTotal} todayCups={todayCups}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* ==================== MAIN ==================== */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-4 lg:pt-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="Transaksi" value={riwayat.length} icon={Receipt} color="text-blue-500" bg="bg-blue-50" />
          <StatCard label="Cup" value={todayCups} icon={Coffee} color="text-amber-500" bg="bg-amber-50" />
          <StatCard label="Pendapatan" value={rp(todayTotal)} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-50" />
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-3">

            {/* Search */}
            {menu.length > 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <Search size={14} className="text-gray-400 flex-shrink-0" />
                  <input type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari menu..."
                    className="flex-1 text-sm text-gray-800 outline-none bg-transparent
                      placeholder:text-gray-300 min-w-0"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer flex-shrink-0">
                      <X size={13} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter */}
            <FilterChips categories={categories} active={activeCategory} onFilter={setActiveCategory} />

            {/* Menu List */}
            {filteredMenu.length === 0 ? (
              <EmptyMenu hasFilter={isFiltered} onClear={() => { setActiveCategory('all'); setSearchQuery('') }} />
            ) : (
              <div className="space-y-2 w-full">
                {filteredMenu.map(item => (
                  <MenuListItem
                    key={item.id_menu}
                    item={item}
                    cupName={cupsMap[item.id_cup]?.nama_cup || `Cup #${item.id_cup}`}
                    qty={cart[item.id_menu] || 0}
                    hasResep={!!item.keterangan?.trim()}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    onViewResep={setResepModal}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <DesktopSidebar
            cart={cart} menu={menu} totalItem={totalItem} totalHarga={totalHarga}
            riwayat={riwayat} todayTotal={todayTotal} todayCups={todayCups}
            loading={actionLoading} onUpdate={updateCart} onClear={clearCart} onSubmit={handleSubmit}
          />
        </div>

        {/* Desktop Footer */}
        {todayTotal > 0 && (
          <div className="hidden lg:block bg-gray-900 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Hari Ini</p>
                <p className="text-[10px] text-gray-500">{riwayat.length} trx · {todayCups} cup</p>
              </div>
              <p className="text-xl font-black text-white">{rp(todayTotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar
        totalItem={totalItem} totalHarga={totalHarga}
        onCart={() => setShowCart(true)}
        onHistory={() => setShowHistory(true)}
        onRefresh={fetchAll}
      />
    </div>
  )
}