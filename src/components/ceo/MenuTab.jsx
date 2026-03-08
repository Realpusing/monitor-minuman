import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Plus, X, Pencil, Trash2, CheckCircle, Coffee,
  Package, FileText, ChevronDown, ChevronUp,
  Search, AlertTriangle, Info, Hash, DollarSign,
  ArrowRight, Eye, EyeOff, BookOpen, Tag,
  MoreVertical, Copy, Star, Filter, Layers
} from 'lucide-react'
import { rp, inputClass, btnPrimary } from '../../utils/helpers'

/* ================================================================
   CONSTANTS
   ================================================================ */

const EMPTY_FORM = {
  nama_item: '',
  harga_jual: '',
  id_cup: '',
  keterangan: '',
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
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
        >
          <SkeletonPulse className="w-9 h-9 rounded-xl mb-3" />
          <SkeletonPulse className="w-16 h-2.5 mb-2" />
          <SkeletonPulse className="w-12 h-5" />
        </div>
      ))}
    </div>
  )
}

function SkeletonMenuList() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="px-4 py-3.5 border-b border-gray-50 last:border-0"
        >
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-11 h-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="w-32 h-3.5" />
              <SkeletonPulse className="w-20 h-2.5" />
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
      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm
        hover:shadow-md transition-shadow duration-200"
    >
      <div
        className={`w-9 h-9 ${bg} rounded-xl flex items-center
          justify-center mb-2.5`}
      >
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="p-6 text-center">
          <div
            className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center
              justify-center mx-auto mb-4`}
          >
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
              text-gray-600 cursor-pointer active:scale-[0.98]
              transition-transform"
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
              <div
                className="w-5 h-5 border-2 border-white/30 border-t-white
                  rounded-full animate-spin"
              />
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
   MENU FORM MODAL COMPONENT
   ================================================================ */

function MenuFormModal({
  isEditing,
  form,
  cups,
  loading,
  onChange,
  onSubmit,
  onClose,
}) {
  const nameRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const updateField = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: value }))
  }

  const isValid =
    form.nama_item.trim() &&
    form.harga_jual &&
    parseInt(form.harga_jual) > 0 &&
    form.id_cup

  const selectedCup = cups.find((c) => c.id_cup === parseInt(form.id_cup))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl
          rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh]
          flex flex-col animate-slideUp"
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center
                ${isEditing ? 'bg-blue-100' : 'bg-emerald-100'}`}
            >
              {isEditing ? (
                <Pencil size={18} className="text-blue-600" />
              ) : (
                <Plus size={18} className="text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditing ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEditing
                  ? 'Ubah informasi menu'
                  : 'Isi detail menu minuman'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer
              transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Nama Menu */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Nama Menu
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.nama_item}
              onChange={(e) => updateField('nama_item', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-base focus:border-blue-400 focus:ring-2
                focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="Contoh: Matcha Latte, Thai Tea..."
              required
            />
          </div>

          {/* Harga */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Harga Jual (Rp)
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2
                  text-gray-400 text-sm font-medium"
              >
                Rp
              </span>
              <input
                type="number"
                value={form.harga_jual}
                onChange={(e) => updateField('harga_jual', e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4
                  py-3.5 text-gray-800 text-base focus:border-blue-400
                  focus:ring-2 focus:ring-blue-50 outline-none
                  transition-all duration-200"
                placeholder="15000"
                min="0"
                required
              />
            </div>
            {form.harga_jual && parseInt(form.harga_jual) > 0 && (
              <p className="text-[10px] text-gray-400 mt-1.5 ml-0.5">
                = {rp(parseInt(form.harga_jual))}
              </p>
            )}
          </div>

          {/* Ukuran Cup */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Ukuran Cup
            </label>
            {cups.length === 0 ? (
              <div
                className="bg-amber-50 border border-amber-200 rounded-xl
                  p-3.5 flex items-start gap-2.5"
              >
                <AlertTriangle
                  size={16}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-semibold text-amber-700">
                    Belum ada cup
                  </p>
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    Tambahkan cup terlebih dahulu di tab Cup
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cups.map((cup) => {
                  const isSelected = form.id_cup === cup.id_cup.toString()
                  return (
                    <button
                      key={cup.id_cup}
                      type="button"
                      onClick={() =>
                        updateField('id_cup', cup.id_cup.toString())
                      }
                      className={`p-3.5 rounded-xl border-2 text-left
                        cursor-pointer transition-all duration-200
                        active:scale-[0.97] ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Package
                          size={16}
                          className={
                            isSelected ? 'text-blue-500' : 'text-gray-400'
                          }
                        />
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isSelected
                                ? 'text-blue-700'
                                : 'text-gray-700'
                            }`}
                          >
                            {cup.nama_cup}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Sisa: {cup.stok_sekarang}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex justify-end mt-1">
                          <CheckCircle
                            size={14}
                            className="text-blue-500"
                          />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Resep / Keterangan */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              <span className="flex items-center gap-1.5">
                <BookOpen size={12} />
                Resep / Keterangan
                <span className="text-gray-300 font-normal">(Opsional)</span>
              </span>
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => updateField('keterangan', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5
                text-gray-800 text-sm focus:border-blue-400 focus:ring-2
                focus:ring-blue-50 outline-none transition-all duration-200
                resize-none leading-relaxed"
              rows={5}
              placeholder={`Tulis langkah pembuatan:\n- 2 sdm bubuk matcha\n- 100ml air panas\n- Es batu secukupnya\n- 2 sdm susu kental manis`}
            />
            {form.keterangan && (
              <p className="text-[10px] text-gray-400 mt-1 ml-0.5">
                {form.keterangan.length} karakter
              </p>
            )}
          </div>

          {/* Preview Card */}
          {form.nama_item && form.harga_jual && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Preview
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 bg-amber-100 rounded-lg flex items-center
                      justify-center"
                  >
                    <Coffee size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {form.nama_item}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {selectedCup?.nama_cup || 'Pilih cup'}
                      {form.keterangan?.trim() ? ' · Ada resep' : ''}
                    </p>
                  </div>
                </div>
                <span className="text-base font-bold text-amber-600">
                  {rp(parseInt(form.harga_jual) || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100
              text-gray-600 cursor-pointer active:scale-[0.98]
              transition-transform"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !isValid}
            className={`flex-[2] py-3.5 rounded-xl font-semibold text-white
              cursor-pointer active:scale-[0.98] flex items-center
              justify-center gap-2 disabled:opacity-50
              disabled:cursor-not-allowed transition-all
              ${isEditing ? 'bg-blue-600' : 'bg-emerald-600'}`}
          >
            {loading ? (
              <div
                className="w-5 h-5 border-2 border-white/30 border-t-white
                  rounded-full animate-spin"
              />
            ) : (
              <>
                <CheckCircle size={16} />
                {isEditing ? 'Simpan Perubahan' : 'Tambah Menu'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MENU DETAIL MODAL (MOBILE)
   ================================================================ */

function MenuDetailModal({ item, cups, onClose, onEdit, onDelete }) {
  const [showRecipe, setShowRecipe] = useState(true)

  if (!item) return null

  const cupInfo = item.inventory_cup || cups.find((c) => c.id_cup === item.id_cup)
  const hasRecipe = item.keterangan?.trim()
  const cupColorClass =
    item.id_cup === 2
      ? { bg: 'bg-purple-100', text: 'text-purple-500', badge: 'bg-purple-50 text-purple-600' }
      : { bg: 'bg-blue-100', text: 'text-blue-500', badge: 'bg-blue-50 text-blue-600' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
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
              <div
                className={`w-12 h-12 rounded-2xl flex items-center
                  justify-center bg-amber-100`}
              >
                <Coffee size={22} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {item.nama_item}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5
                      rounded-full ${cupColorClass.badge}`}
                  >
                    {cupInfo?.nama_cup || `Cup #${item.id_cup}`}
                  </span>
                  {hasRecipe && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5
                        rounded-full bg-amber-50 text-amber-600"
                    >
                      📝 Ada resep
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer
                transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Price highlight */}
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-amber-500 font-medium mb-1">
              Harga Jual
            </p>
            <p className="text-3xl font-black text-amber-600">
              {rp(item.harga_jual)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {[
              {
                icon: Package,
                label: 'Ukuran Cup',
                val: cupInfo?.nama_cup || '-',
              },
              {
                icon: Layers,
                label: 'Stok Cup',
                val: cupInfo
                  ? `${cupInfo.stok_sekarang} tersisa`
                  : '-',
              },
              { icon: Hash, label: 'ID Menu', val: `#${item.id_menu}` },
              {
                icon: BookOpen,
                label: 'Resep',
                val: hasRecipe ? 'Tersedia' : 'Belum ada',
              },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5
                  px-3 bg-gray-50 rounded-xl"
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

          {/* Recipe Section */}
          {hasRecipe && (
            <div>
              <button
                onClick={() => setShowRecipe(!showRecipe)}
                className="w-full flex items-center justify-between py-2
                  cursor-pointer"
              >
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-amber-500" />
                  Resep / Cara Buat
                </span>
                {showRecipe ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {showRecipe && (
                <div
                  className="bg-amber-50 border border-amber-100 rounded-xl
                    p-4 text-sm text-gray-700 whitespace-pre-line
                    leading-relaxed animate-slideUp"
                >
                  {item.keterangan}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => {
              onClose()
              onEdit(item)
            }}
            className="flex-1 py-3.5 rounded-xl font-semibold flex items-center
              justify-center gap-2 bg-blue-600 text-white cursor-pointer
              active:scale-[0.98] transition-transform"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            onClick={() => {
              onClose()
              onDelete(item)
            }}
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
   MENU LIST ITEM COMPONENT
   ================================================================ */

function MenuListItem({ item, cups, isLast, onDetail, onEdit, onDelete, onToggleRecipe, isRecipeExpanded }) {
  const hasRecipe = item.keterangan?.trim()
  const cupInfo = item.inventory_cup || cups.find((c) => c.id_cup === item.id_cup)

  const cupBadgeClass =
    item.id_cup === 2
      ? 'bg-purple-50 text-purple-600'
      : 'bg-blue-50 text-blue-600'

  const iconBgClass =
    item.id_cup === 2 ? 'bg-purple-50' : 'bg-blue-50'

  const iconColorClass =
    item.id_cup === 2 ? 'text-purple-400' : 'text-blue-400'

  return (
    <div className={!isLast ? 'border-b border-gray-50' : ''}>
      {/* Main Row */}
      <div
        className="px-4 py-3.5 active:bg-gray-50 group cursor-pointer
          lg:cursor-default transition-colors duration-150"
        onClick={() => {
          if (window.innerWidth < 1024) onDetail(item)
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center
              flex-shrink-0 bg-amber-50`}
          >
            <Coffee size={18} className="text-amber-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {item.nama_item}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5
                  rounded-full ${cupBadgeClass}`}
              >
                {cupInfo?.nama_cup || `Cup #${item.id_cup}`}
              </span>
              {hasRecipe && (
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5
                    rounded-full bg-amber-50 text-amber-500"
                >
                  📝 Resep
                </span>
              )}
            </div>
          </div>

          {/* Price + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-bold text-amber-600">
              {rp(item.harga_jual)}
            </span>

            {/* Desktop hover actions */}
            <div
              className="hidden lg:flex items-center gap-1 opacity-0
                group-hover:opacity-100 transition-opacity duration-200"
            >
              {hasRecipe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleRecipe(item.id_menu)
                  }}
                  className="p-1.5 bg-amber-50 text-amber-500 rounded-lg
                    cursor-pointer hover:bg-amber-100 transition-colors"
                  title="Lihat Resep"
                >
                  <BookOpen size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                className="p-1.5 bg-blue-50 text-blue-500 rounded-lg
                  cursor-pointer hover:bg-blue-100 transition-colors"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="p-1.5 bg-red-50 text-red-500 rounded-lg
                  cursor-pointer hover:bg-red-100 transition-colors"
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

      {/* Desktop Recipe Expansion */}
      {isRecipeExpanded && hasRecipe && (
        <div className="hidden lg:block px-4 pb-4">
          <div className="ml-14">
            <div
              className="bg-amber-50 border border-amber-100 rounded-xl
                p-4 text-sm text-gray-700 whitespace-pre-line
                leading-relaxed animate-slideUp"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Resep
                </span>
              </div>
              {item.keterangan}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   FILTER CHIPS COMPONENT
   ================================================================ */

function FilterChips({ cups, menu, activeFilter, onFilter }) {
  const chipData = useMemo(() => {
    const allCount = menu.length
    const cupCounts = cups.map((c) => ({
      id: c.id_cup.toString(),
      label: c.nama_cup,
      count: menu.filter((m) => m.id_cup === c.id_cup).length,
    }))
    return [{ id: 'all', label: 'Semua', count: allCount }, ...cupCounts]
  }, [cups, menu])

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {chipData.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onFilter(chip.id)}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold
            cursor-pointer whitespace-nowrap min-h-[36px]
            transition-all duration-200 active:scale-95 ${
              activeFilter === chip.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
        >
          {chip.label}
          <span
            className={`ml-1.5 text-[10px] ${
              activeFilter === chip.id ? 'text-gray-400' : 'text-gray-400'
            }`}
          >
            {chip.count}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================
   PRICE RANGE INSIGHTS
   ================================================================ */

function PriceInsights({ menu }) {
  const insights = useMemo(() => {
    if (menu.length === 0) return null

    const prices = menu.map((m) => m.harga_jual).sort((a, b) => a - b)
    const min = prices[0]
    const max = prices[prices.length - 1]
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const withRecipe = menu.filter((m) => m.keterangan?.trim()).length

    return { min, max, avg, withRecipe }
  }, [menu])

  if (!insights) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <DollarSign size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Insights Harga</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Rentang & rata-rata harga menu
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {[
          {
            label: 'Termurah',
            value: rp(insights.min),
            icon: Tag,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Termahal',
            value: rp(insights.max),
            icon: Star,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
          },
          {
            label: 'Rata-rata',
            value: rp(insights.avg),
            icon: DollarSign,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'Punya Resep',
            value: `${insights.withRecipe}/${menu.length}`,
            icon: BookOpen,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
          },
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              className={`${item.bg} rounded-xl p-3.5 transition-all
                duration-200`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={13} className={item.color} />
                <span className="text-[10px] font-medium text-gray-500">
                  {item.label}
                </span>
              </div>
              <p className="text-base font-bold text-gray-900">{item.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   SUMMARY STATS SECTION
   ================================================================ */

function SummaryStats({ menu, cups }) {
  const stats = useMemo(() => {
    const withRecipe = menu.filter((m) => m.keterangan?.trim()).length
    const avgPrice =
      menu.length > 0
        ? Math.round(
            menu.reduce((a, m) => a + m.harga_jual, 0) / menu.length
          )
        : 0

    return { withRecipe, avgPrice }
  }, [menu])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Total Menu"
        value={menu.length}
        icon={Coffee}
        color="text-amber-500"
        bg="bg-amber-50"
        subValue="menu tersedia"
      />
      <StatCard
        label="Punya Resep"
        value={stats.withRecipe}
        icon={BookOpen}
        color="text-emerald-500"
        bg="bg-emerald-50"
        subValue={`dari ${menu.length} menu`}
      />
      {cups.slice(0, 2).map((cup) => {
        const count = menu.filter((m) => m.id_cup === cup.id_cup).length
        return (
          <StatCard
            key={cup.id_cup}
            label={cup.nama_cup}
            value={count}
            icon={Package}
            color={
              cup.id_cup === 2 ? 'text-purple-500' : 'text-blue-500'
            }
            bg={cup.id_cup === 2 ? 'bg-purple-50' : 'bg-blue-50'}
            subValue="menu"
          />
        )
      })}
    </div>
  )
}

/* ================================================================
   EMPTY STATE COMPONENT
   ================================================================ */

function EmptyState({ hasFilter, filterLabel, onClearFilter, onAdd }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <div
        className="w-16 h-16 bg-gray-50 rounded-full flex items-center
          justify-center mx-auto mb-4"
      >
        <Coffee size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-sm">
        {hasFilter ? 'Tidak ditemukan' : 'Belum ada menu'}
      </p>
      <p
        className="text-gray-300 text-xs mt-1.5 max-w-[240px] mx-auto
          leading-relaxed"
      >
        {hasFilter
          ? `Tidak ada menu yang cocok dengan pencarian "${filterLabel}"`
          : 'Tambahkan menu minuman untuk mulai berjualan'}
      </p>
      <div className="flex items-center justify-center gap-2 mt-5">
        {hasFilter ? (
          <button
            onClick={onClearFilter}
            className="text-xs font-semibold text-blue-600 bg-blue-50
              px-5 py-2.5 rounded-xl cursor-pointer active:bg-blue-100
              transition-colors"
          >
            Reset Pencarian
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 text-sm font-semibold
              text-white bg-emerald-600 px-6 py-3 rounded-xl cursor-pointer
              active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus size={16} />
            Tambah Menu Pertama
          </button>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   MENU LIST SECTION COMPONENT
   ================================================================ */

function MenuListSection({
  items,
  cups,
  expandedRecipes,
  onDetail,
  onEdit,
  onDelete,
  onToggleRecipe,
}) {
  // Group by cup type
  const grouped = useMemo(() => {
    const groups = {}
    items.forEach((item) => {
      const cupName =
        item.inventory_cup?.nama_cup ||
        cups.find((c) => c.id_cup === item.id_cup)?.nama_cup ||
        'Lainnya'
      if (!groups[cupName]) groups[cupName] = []
      groups[cupName].push(item)
    })
    return groups
  }, [items, cups])

  const groupKeys = Object.keys(grouped)
  const hasMultipleGroups = groupKeys.length > 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <Coffee size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Daftar Menu</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {items.length} menu tercatat
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      {hasMultipleGroups ? (
        groupKeys.map((groupName) => {
          const groupItems = grouped[groupName]
          return (
            <div key={groupName}>
              {/* Group Header */}
              <div
                className="px-4 py-2 bg-gray-50 border-y border-gray-100
                  flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Package size={12} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600">
                    {groupName}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {groupItems.length} menu
                </span>
              </div>

              {/* Items */}
              {groupItems.map((item, idx) => (
                <MenuListItem
                  key={item.id_menu}
                  item={item}
                  cups={cups}
                  isLast={idx === groupItems.length - 1}
                  onDetail={onDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleRecipe={onToggleRecipe}
                  isRecipeExpanded={expandedRecipes.has(item.id_menu)}
                />
              ))}
            </div>
          )
        })
      ) : (
        items.map((item, idx) => (
          <MenuListItem
            key={item.id_menu}
            item={item}
            cups={cups}
            isLast={idx === items.length - 1}
            onDetail={onDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleRecipe={onToggleRecipe}
            isRecipeExpanded={expandedRecipes.has(item.id_menu)}
          />
        ))
      )}
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT: MenuTab
   ================================================================ */

export default function MenuTab({ cups, menu, fetchMenu, msg }) {
  /* --------------------------------
     State Management
     -------------------------------- */
  const [menuForm, setMenuForm] = useState({ ...EMPTY_FORM })
  const [editingMenu, setEditingMenu] = useState(null)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // UI States
  const [expandedRecipes, setExpandedRecipes] = useState(new Set())
  const [menuFilter, setMenuFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailItem, setDetailItem] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

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
     Filtered Menu
     -------------------------------- */
  const filteredMenu = useMemo(() => {
    let result = menu

    // Filter by cup
    if (menuFilter !== 'all') {
      result = result.filter(
        (m) => m.id_cup === parseInt(menuFilter)
      )
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          m.nama_item.toLowerCase().includes(q) ||
          m.keterangan?.toLowerCase().includes(q)
      )
    }

    return result
  }, [menu, menuFilter, searchQuery])

  const sortedMenu = useMemo(() => {
    return [...filteredMenu].sort((a, b) =>
      a.nama_item.localeCompare(b.nama_item)
    )
  }, [filteredMenu])

  /* --------------------------------
     CRUD Handlers
     -------------------------------- */
  const handleAddMenu = useCallback(
    async (e) => {
      if (e) e.preventDefault()
      setLoading(true)

      try {
        const { error } = await supabase.from('menu_jualan').insert({
          nama_item: menuForm.nama_item.trim(),
          harga_jual: parseInt(menuForm.harga_jual),
          id_cup: parseInt(menuForm.id_cup),
          keterangan: menuForm.keterangan?.trim() || null,
        })

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`"${menuForm.nama_item}" berhasil ditambahkan!`)
          msg(`Menu "${menuForm.nama_item}" ditambah!`)
          setMenuForm({ ...EMPTY_FORM })
          setShowMenuForm(false)
          fetchMenu()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [menuForm, fetchMenu, msg, showToast]
  )

  const handleUpdateMenu = useCallback(
    async (e) => {
      if (e) e.preventDefault()
      if (!editingMenu) return
      setLoading(true)

      try {
        const { error } = await supabase
          .from('menu_jualan')
          .update({
            nama_item: menuForm.nama_item.trim(),
            harga_jual: parseInt(menuForm.harga_jual),
            id_cup: parseInt(menuForm.id_cup),
            keterangan: menuForm.keterangan?.trim() || null,
          })
          .eq('id_menu', editingMenu.id_menu)

        if (error) {
          showToast(error.message, 'error')
          msg(error.message, false)
        } else {
          showToast(`"${menuForm.nama_item}" berhasil diperbarui!`)
          msg('Menu diupdate!')
          setMenuForm({ ...EMPTY_FORM })
          setEditingMenu(null)
          setShowMenuForm(false)
          fetchMenu()
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      } finally {
        setLoading(false)
      }
    },
    [menuForm, editingMenu, fetchMenu, msg, showToast]
  )

  const handleFormSubmit = useCallback(
    (e) => {
      if (e) e.preventDefault()
      if (editingMenu) handleUpdateMenu(e)
      else handleAddMenu(e)
    },
    [editingMenu, handleUpdateMenu, handleAddMenu]
  )

  const handleDeleteMenu = useCallback(
    (item) => {
      setConfirmModal({
        item,
        title: 'Hapus Menu?',
        message: `"${item.nama_item}" akan dihapus secara permanen.`,
        subMessage: 'Pastikan tidak ada transaksi terkait menu ini.',
        confirmLabel: 'Ya, Hapus',
        confirmColor: 'bg-red-500',
      })
    },
    []
  )

  const confirmDeleteMenu = useCallback(async () => {
    if (!confirmModal?.item) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('menu_jualan')
        .delete()
        .eq('id_menu', confirmModal.item.id_menu)

      if (error) {
        showToast(error.message, 'error')
        msg(error.message, false)
      } else {
        showToast(`"${confirmModal.item.nama_item}" berhasil dihapus!`)
        msg('Menu dihapus!')
        setConfirmModal(null)
        fetchMenu()
      }
    } catch (err) {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
    }
  }, [confirmModal, fetchMenu, msg, showToast])

  /* --------------------------------
     UI Handlers
     -------------------------------- */
  const startAddMenu = useCallback(() => {
    setShowMenuForm(true)
    setEditingMenu(null)
    setMenuForm({ ...EMPTY_FORM })
  }, [])

  const startEditMenu = useCallback((item) => {
    setEditingMenu(item)
    setMenuForm({
      nama_item: item.nama_item,
      harga_jual: item.harga_jual.toString(),
      id_cup: item.id_cup.toString(),
      keterangan: item.keterangan || '',
    })
    setShowMenuForm(true)
    setDetailItem(null)
  }, [])

  const closeForm = useCallback(() => {
    setShowMenuForm(false)
    setEditingMenu(null)
    setMenuForm({ ...EMPTY_FORM })
  }, [])

  const toggleRecipe = useCallback((menuId) => {
    setExpandedRecipes((prev) => {
      const next = new Set(prev)
      if (next.has(menuId)) next.delete(menuId)
      else next.add(menuId)
      return next
    })
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setMenuFilter('all')
  }, [])

  /* --------------------------------
     Computed
     -------------------------------- */
  const hasData = menu.length > 0
  const hasResults = sortedMenu.length > 0
  const isFiltered = menuFilter !== 'all' || searchQuery.trim()

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

      {/* ====== FORM MODAL ====== */}
      {showMenuForm && (
        <MenuFormModal
          isEditing={!!editingMenu}
          form={menuForm}
          cups={cups}
          loading={loading}
          onChange={setMenuForm}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
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
          icon={Trash2}
          iconColor="text-red-500"
          iconBg="bg-red-100"
          loading={loading}
          onConfirm={confirmDeleteMenu}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* ====== DETAIL MODAL (MOBILE) ====== */}
      {detailItem && (
        <MenuDetailModal
          item={detailItem}
          cups={cups}
          onClose={() => setDetailItem(null)}
          onEdit={startEditMenu}
          onDelete={handleDeleteMenu}
        />
      )}

      {/* ====== PAGE HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">☕ Kelola Menu</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Atur menu minuman beserta resep
          </p>
        </div>
        <button
          onClick={startAddMenu}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900
            text-white text-sm font-semibold rounded-xl cursor-pointer
            active:scale-[0.97] shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Tambah Menu</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* ====== SUMMARY STATS ====== */}
      {hasData && <SummaryStats menu={menu} cups={cups} />}

      {/* ====== SEARCH + FILTER ====== */}
      {hasData && (
        <div className="space-y-3">
          {/* Search */}
          {menu.length > 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu atau resep..."
                  className="flex-1 text-sm text-gray-800 outline-none
                    bg-transparent placeholder:text-gray-300"
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
              {searchQuery && (
                <div className="px-4 pb-2.5">
                  <p className="text-[10px] text-gray-400 font-medium">
                    {filteredMenu.length} dari {menu.length} menu ditemukan
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Filter Chips */}
          {cups.length > 0 && (
            <FilterChips
              cups={cups}
              menu={menu}
              activeFilter={menuFilter}
              onFilter={setMenuFilter}
            />
          )}

          {/* Active filter info */}
          {isFiltered && (
            <div className="flex items-center gap-2 flex-wrap">
              {menuFilter !== 'all' && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px]
                    bg-blue-50 text-blue-700 pl-2.5 pr-1.5 py-1
                    rounded-full font-medium"
                >
                  📦{' '}
                  {cups.find((c) => c.id_cup === parseInt(menuFilter))
                    ?.nama_cup}
                  <button
                    onClick={() => setMenuFilter('all')}
                    className="p-0.5 hover:bg-blue-200 rounded-full
                      cursor-pointer transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px]
                    bg-amber-50 text-amber-700 pl-2.5 pr-1.5 py-1
                    rounded-full font-medium"
                >
                  🔍 "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-amber-200 rounded-full
                      cursor-pointer transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====== MENU LIST ====== */}
      {!hasData ? (
        <EmptyState onAdd={startAddMenu} />
      ) : !hasResults ? (
        <EmptyState
          hasFilter
          filterLabel={searchQuery || 'filter aktif'}
          onClearFilter={clearSearch}
          onAdd={startAddMenu}
        />
      ) : (
        <MenuListSection
          items={sortedMenu}
          cups={cups}
          expandedRecipes={expandedRecipes}
          onDetail={(item) => setDetailItem(item)}
          onEdit={startEditMenu}
          onDelete={handleDeleteMenu}
          onToggleRecipe={toggleRecipe}
        />
      )}

      {/* ====== PRICE INSIGHTS ====== */}
      {hasData && menu.length > 1 && <PriceInsights menu={menu} />}

      {/* ====== TOTAL FOOTER ====== */}
      {hasData && (
        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">
                Total Menu
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {menu.filter((m) => m.keterangan?.trim()).length} memiliki
                resep
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">{menu.length}</p>
              <p className="text-[10px] text-gray-500">menu tersedia</p>
            </div>
          </div>

          {/* Additional info */}
          <div
            className="mt-3 pt-3 border-t border-gray-700/50 flex items-center
              justify-between"
          >
            <div className="flex items-center gap-4">
              {cups.map((cup) => {
                const count = menu.filter(
                  (m) => m.id_cup === cup.id_cup
                ).length
                return (
                  <div
                    key={cup.id_cup}
                    className="flex items-center gap-1.5"
                  >
                    <Package size={12} className="text-gray-500" />
                    <span className="text-[11px] text-gray-400">
                      {cup.nama_cup}: {count}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign size={12} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-400">
                {rp(
                  Math.round(
                    menu.reduce((a, m) => a + m.harga_jual, 0) /
                      Math.max(menu.length, 1)
                  )
                )}{' '}
                avg
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}