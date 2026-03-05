import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, X, Pencil, RefreshCw, Trash2, CheckCircle } from 'lucide-react'
import { inputClass, btnPrimary } from '../../utils/helpers'

export default function CupTab({ cups, menu, fetchCups, msg }) {
  const [cupForm, setCupForm] = useState({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
  const [editingCup, setEditingCup] = useState(null)
  const [showCupForm, setShowCupForm] = useState(false)
  const [restockMode, setRestockMode] = useState(null)
  const [restockAmount, setRestockAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddCup = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('inventory_cup').insert({
      nama_cup: cupForm.nama_cup,
      stok_awal: parseInt(cupForm.stok_awal),
      stok_sekarang: parseInt(cupForm.stok_sekarang || cupForm.stok_awal),
      terjual_cup: 0
    })

    if (error) {
      msg(error.message, false)
    } else {
      msg('Cup berhasil ditambah!')
      setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
      setShowCupForm(false)
      fetchCups()
    }
    setLoading(false)
  }

  const handleUpdateCup = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('inventory_cup').update({
      nama_cup: cupForm.nama_cup,
      stok_awal: parseInt(cupForm.stok_awal),
      stok_sekarang: parseInt(cupForm.stok_sekarang)
    }).eq('id_cup', editingCup.id_cup)

    if (error) {
      msg(error.message, false)
    } else {
      msg('Cup diupdate!')
      setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
      setEditingCup(null)
      setShowCupForm(false)
      fetchCups()
    }
    setLoading(false)
  }

  const handleDeleteCup = async (cup) => {
    const used = menu.filter(m => m.id_cup === cup.id_cup)
    if (used.length > 0) {
      msg(`Ada ${used.length} menu pakai cup ini!`, false)
      return
    }
    if (!confirm(`Hapus "${cup.nama_cup}"?`)) return

    const { error } = await supabase.from('inventory_cup').delete().eq('id_cup', cup.id_cup)
    if (error) msg(error.message, false)
    else { msg('Cup dihapus!'); fetchCups() }
  }

  const handleQuickRestock = async (cup) => {
    if (!restockAmount || parseInt(restockAmount) <= 0) {
      msg('Jumlah tidak valid!', false)
      return
    }
    setLoading(true)
    const tambah = parseInt(restockAmount)

    const { error } = await supabase.from('inventory_cup').update({
      stok_awal: cup.stok_awal + tambah,
      stok_sekarang: cup.stok_sekarang + tambah,
      terjual_cup: 0
    }).eq('id_cup', cup.id_cup)

    if (error) {
      msg(error.message, false)
    } else {
      msg(`+${tambah} ${cup.nama_cup}!`)
      setRestockMode(null)
      setRestockAmount('')
      fetchCups()
    }
    setLoading(false)
  }

  const handleResetTerjual = async (cup) => {
    if (!confirm(`Reset counter "${cup.nama_cup}"? Stok awal = sisa sekarang, terjual = 0`)) return

    const { error } = await supabase.from('inventory_cup').update({
      stok_awal: cup.stok_sekarang,
      terjual_cup: 0
    }).eq('id_cup', cup.id_cup)

    if (error) msg(error.message, false)
    else { msg('Counter direset!'); fetchCups() }
  }

  const startEditCup = (cup) => {
    setEditingCup(cup)
    setCupForm({
      nama_cup: cup.nama_cup,
      stok_awal: cup.stok_awal.toString(),
      stok_sekarang: cup.stok_sekarang.toString()
    })
    setShowCupForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4 animate-slideUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-800">Kelola Cup</h2>
          <p className="text-xs text-stone-400 mt-0.5">Tambah, edit, restock & hapus cup</p>
        </div>
        <button
          onClick={() => {
            setShowCupForm(true)
            setEditingCup(null)
            setCupForm({ nama_cup: '', stok_awal: '', stok_sekarang: '' })
          }}
          className={btnPrimary}
        >
          <Plus size={15} /> Tambah
        </button>
      </div>

      {/* Form */}
      {showCupForm && (
        <div className="card p-5 animate-scaleIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-800 text-sm">
              {editingCup ? '✏️ Edit Cup' : '➕ Tambah Cup Baru'}
            </h3>
            <button
              onClick={() => { setShowCupForm(false); setEditingCup(null) }}
              className="p-1 cursor-pointer"
            >
              <X size={18} className="text-stone-400" />
            </button>
          </div>
          <form
            onSubmit={editingCup ? handleUpdateCup : handleAddCup}
            className="grid sm:grid-cols-4 gap-3"
          >
            <div>
              <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Nama</label>
              <input
                type="text"
                value={cupForm.nama_cup}
                onChange={(e) => setCupForm(p => ({ ...p, nama_cup: e.target.value }))}
                className={inputClass}
                placeholder="Cup 12oz"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Stok Awal</label>
              <input
                type="number"
                value={cupForm.stok_awal}
                onChange={(e) => setCupForm(p => ({
                  ...p,
                  stok_awal: e.target.value,
                  stok_sekarang: editingCup ? p.stok_sekarang : e.target.value
                }))}
                className={inputClass}
                placeholder="100"
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Stok Sekarang</label>
              <input
                type="number"
                value={cupForm.stok_sekarang}
                onChange={(e) => setCupForm(p => ({ ...p, stok_sekarang: e.target.value }))}
                className={inputClass}
                placeholder="100"
                min="0"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={loading} className={`${btnPrimary} flex-1 justify-center`}>
                {loading ? '...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCupForm(false); setEditingCup(null) }}
                className="px-4 py-3 bg-stone-100 text-stone-500 rounded-xl text-sm font-medium cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs">
                <th className="px-4 py-3 text-left font-semibold">Cup</th>
                <th className="px-4 py-3 text-center font-semibold">Awal</th>
                <th className="px-4 py-3 text-center font-semibold">Terjual</th>
                <th className="px-4 py-3 text-center font-semibold">Sisa</th>
                <th className="px-4 py-3 text-center font-semibold">Restock</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {cups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-stone-300 text-xs">
                    Belum ada cup
                  </td>
                </tr>
              ) : (
                cups.map(cup => {
                  const isLow = cup.stok_sekarang < cup.stok_awal * 0.2
                  return (
                    <tr key={cup.id_cup} className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-stone-800">{cup.nama_cup}</span>
                        {isLow && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-stone-500">{cup.stok_awal}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{cup.terjual_cup}</td>
                      <td className={`px-4 py-3 text-center font-bold ${isLow ? 'text-red-600' : 'text-stone-800'}`}>
                        {cup.stok_sekarang}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {restockMode === cup.id_cup ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={restockAmount}
                              onChange={(e) => setRestockAmount(e.target.value)}
                              className="w-14 border border-stone-200 rounded-lg px-2 py-1 text-center text-xs focus:border-amber-400 outline-none"
                              placeholder="Qty"
                              min="1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickRestock(cup)}
                              disabled={loading}
                              className="p-1.5 bg-emerald-500 text-white rounded-lg cursor-pointer press"
                            >
                              <CheckCircle size={12} />
                            </button>
                            <button
                              onClick={() => { setRestockMode(null); setRestockAmount('') }}
                              className="p-1.5 bg-stone-200 text-stone-500 rounded-lg cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRestockMode(cup.id_cup)}
                            className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg cursor-pointer font-medium hover:bg-emerald-200 transition-colors"
                          >
                            + Restock
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEditCup(cup)}
                            className="p-1.5 bg-blue-100 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleResetTerjual(cup)}
                            className="p-1.5 bg-amber-100 text-amber-500 rounded-lg cursor-pointer hover:bg-amber-200 transition-colors"
                            title="Reset Counter"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteCup(cup)}
                            className="p-1.5 bg-red-100 text-red-500 rounded-lg cursor-pointer hover:bg-red-200 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}