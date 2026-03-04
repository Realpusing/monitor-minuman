import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ nama: '', password: '', id_role: 2 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    const { error: err } = await supabase.rpc('fn_register_user', {
      p_nama: form.nama, p_password: form.password, p_id_role: parseInt(form.id_role)
    })
    if (err) setError(err.message)
    else { setSuccess(`"${form.nama}" berhasil didaftarkan!`); setForm({ nama: '', password: '', id_role: 2 }) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200/50">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-800">Tambah User</h1>
          <p className="text-stone-400 text-sm mt-1">Daftarkan karyawan baru</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl mb-4 text-center font-medium">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-2xl mb-4 text-center font-medium flex items-center justify-center gap-2"><CheckCircle size={16} />{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Username</label>
            <input type="text" value={form.nama} onChange={(e) => setForm(p => ({ ...p, nama: e.target.value }))}
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-800 placeholder:text-stone-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none" placeholder="Nama user" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-800 placeholder:text-stone-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none" placeholder="Min 6 karakter" minLength={6} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Role</label>
            <select value={form.id_role} onChange={(e) => setForm(p => ({ ...p, id_role: e.target.value }))}
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-800 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none">
              <option value={2}>Pegawai</option>
              <option value={1}>CEO</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200/50 cursor-pointer press">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={18} /><span>Daftarkan</span></>}
          </button>
        </form>

        <button onClick={() => navigate(-1)} className="w-full mt-4 text-stone-400 hover:text-stone-600 text-sm flex items-center justify-center gap-1 cursor-pointer py-2">
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    </div>
  )
}