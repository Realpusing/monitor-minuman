import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Plus, X, Pencil, Trash2, CheckCircle, Coffee, 
  Package, FileText, ChevronDown, ChevronUp 
} from 'lucide-react'
import { rp, inputClass, btnPrimary } from '../../utils/helpers'

export default function MenuTab({ cups, menu, fetchMenu, msg }) {
  const [menuForm, setMenuForm] = useState({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
  const [editingMenu, setEditingMenu] = useState(null)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [menuFilter, setMenuFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const filteredMenu = menuFilter === 'all' ? menu : menu.filter(m => m.id_cup === parseInt(menuFilter))

  const handleAddMenu = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('menu_jualan').insert({
      nama_item: menuForm.nama_item,
      harga_jual: parseInt(menuForm.harga_jual),
      id_cup: parseInt(menuForm.id_cup),
      keterangan: menuForm.keterangan || null
    })

    if (error) {
      msg(error.message, false)
    } else {
      msg(`Menu "${menuForm.nama_item}" ditambah!`)
      setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
      setShowMenuForm(false)
      fetchMenu()
    }
    setLoading(false)
  }

  const handleUpdateMenu = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('menu_jualan').update({
      nama_item: menuForm.nama_item,
      harga_jual: parseInt(menuForm.harga_jual),
      id_cup: parseInt(menuForm.id_cup),
      keterangan: menuForm.keterangan || null
    }).eq('id_menu', editingMenu.id_menu)

    if (error) {
      msg(error.message, false)
    } else {
      msg('Menu diupdate!')
      setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
      setEditingMenu(null)
      setShowMenuForm(false)
      fetchMenu()
    }
    setLoading(false)
  }

  const handleDeleteMenu = async (item) => {
    if (!confirm(`Hapus "${item.nama_item}"?`)) return

    const { error } = await supabase.from('menu_jualan').delete().eq('id_menu', item.id_menu)
    if (error) msg(error.message, false)
    else { msg('Menu dihapus!'); fetchMenu() }
  }

  const startEditMenu = (item) => {
    setEditingMenu(item)
    setMenuForm({
      nama_item: item.nama_item,
      harga_jual: item.harga_jual.toString(),
      id_cup: item.id_cup.toString(),
      keterangan: item.keterangan || ''
    })
    setShowMenuForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelMenuForm = () => {
    setShowMenuForm(false)
    setEditingMenu(null)
    setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
  }

  return (
    <div className="space-y-4 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-800">Kelola Menu</h2>
          <p className="text-xs text-stone-400 mt-0.5">Atur menu minuman beserta resep</p>
        </div>
        <button
          onClick={() => {
            setShowMenuForm(true)
            setEditingMenu(null)
            setMenuForm({ nama_item: '', harga_jual: '', id_cup: '', keterangan: '' })
          }}
          className={btnPrimary}
        >
          <Plus size={15} /> Tambah
        </button>
      </div>

      {/* Form Tambah / Edit Menu */}
      {showMenuForm && (
        <div className="card p-5 animate-scaleIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
              {editingMenu ? <><Pencil size={14} className="text-blue-500" /> Edit Menu</> : <><Plus size={14} className="text-emerald-500" /> Menu Baru</>}
            </h3>
            <button onClick={cancelMenuForm} className="p-1 cursor-pointer">
              <X size={18} className="text-stone-400" />
            </button>
          </div>

          <form onSubmit={editingMenu ? handleUpdateMenu : handleAddMenu} className="space-y-3">
            {/* Row 1 */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Nama Menu</label>
                <input
                  type="text"
                  value={menuForm.nama_item}
                  onChange={(e) => setMenuForm(p => ({ ...p, nama_item: e.target.value }))}
                  className={inputClass}
                  placeholder="Matcha Latte"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Harga (Rp)</label>
                <input
                  type="number"
                  value={menuForm.harga_jual}
                  onChange={(e) => setMenuForm(p => ({ ...p, harga_jual: e.target.value }))}
                  className={inputClass}
                  placeholder="15000"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Ukuran Cup</label>
                <select
                  value={menuForm.id_cup}
                  onChange={(e) => setMenuForm(p => ({ ...p, id_cup: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">-- Pilih Cup --</option>
                  {cups.map(c => (
                    <option key={c.id_cup} value={c.id_cup}>{c.nama_cup}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Resep */}
            <div>
              <label className="text-[10px] font-semibold text-stone-500 mb-1 block uppercase tracking-wide flex items-center gap-1">
                <FileText size={11} /> Resep / Keterangan
              </label>
              <textarea
                value={menuForm.keterangan}
                onChange={(e) => setMenuForm(p => ({ ...p, keterangan: e.target.value }))}
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="Opsional. Tulis langkah pembuatan:&#10;- 2 sdm bubuk taro&#10;- 100ml air panas&#10;- Es batu&#10;- 2 sdm susu kental manis"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle size={15} /> {editingMenu ? 'Update' : 'Simpan'}</>
                )}
              </button>
              <button
                type="button"
                onClick={cancelMenuForm}
                className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-medium cursor-pointer transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => setMenuFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer press whitespace-nowrap ${
            menuFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'
          }`}
        >
          Semua ({menu.length})
        </button>
        {cups.map(c => (
          <button
            key={c.id_cup}
            onClick={() => setMenuFilter(c.id_cup.toString())}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer press whitespace-nowrap ${
              menuFilter === c.id_cup.toString() ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 border border-stone-200'
            }`}
          >
            {c.nama_cup} ({menu.filter(m => m.id_cup === c.id_cup).length})
          </button>
        ))}
      </div>

      {/* Menu Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMenu.map(item => {
          const isExpanded = expandedMenu === item.id_menu
          const hasResep = item.keterangan?.trim()

          return (
            <div key={item.id_menu} className="card overflow-hidden group">
              {/* Card Body */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.id_cup === 2
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-sky-100 text-sky-600'
                  }`}>
                    {item.inventory_cup?.nama_cup || (item.id_cup === 1 ? '16oz' : '22oz')}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditMenu(item)}
                      className="p-1.5 bg-blue-50 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(item)}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-stone-800 text-sm leading-tight">{item.nama_item}</h4>
                <p className="text-amber-600 font-bold text-lg mt-1">{rp(item.harga_jual)}</p>
              </div>

              {/* Resep Section */}
              {hasResep ? (
                <div className="border-t border-stone-100">
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.id_menu)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-600 cursor-pointer hover:bg-amber-50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText size={12} />
                      Resep
                    </span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-slideUp">
                      <div className="bg-amber-50 rounded-xl p-3.5 text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                        {item.keterangan}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-stone-100 px-4 py-2.5">
                  <p className="text-[10px] text-stone-300 flex items-center gap-1">
                    <FileText size={10} /> Belum ada resep
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-16">
          <Coffee size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Tidak ada menu</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <Coffee size={18} className="text-amber-500 mx-auto mb-1.5" />
          <p className="text-[10px] text-stone-400 font-medium">Total Menu</p>
          <p className="text-xl font-extrabold text-stone-800">{menu.length}</p>
        </div>
        <div className="card p-4 text-center">
          <FileText size={18} className="text-emerald-500 mx-auto mb-1.5" />
          <p className="text-[10px] text-stone-400 font-medium">Punya Resep</p>
          <p className="text-xl font-extrabold text-emerald-600">{menu.filter(m => m.keterangan?.trim()).length}</p>
        </div>
        {cups.map(cup => (
          <div key={cup.id_cup} className="card p-4 text-center">
            <Package size={18} className={`mx-auto mb-1.5 ${cup.id_cup === 1 ? 'text-sky-500' : 'text-violet-500'}`} />
            <p className="text-[10px] text-stone-400 font-medium">{cup.nama_cup}</p>
            <p className="text-xl font-extrabold text-stone-800">{menu.filter(m => m.id_cup === cup.id_cup).length}</p>
          </div>
        ))}
      </div>
    </div>
  )
}