import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserPlus, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ nama: '', password: '', id_role: 2 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { data, error: err } = await supabase
      .rpc('fn_register_user', {
        p_nama: form.nama,
        p_password: form.password,
        p_id_role: parseInt(form.id_role)
      })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(`User "${form.nama}" berhasil dibuat!`)
      setForm({ nama: '', password: '', id_role: 2 })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-amber-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Tambah User</h1>
          <p className="text-gray-500 text-sm mt-1">Daftarkan karyawan baru</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4 text-center">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Contoh: Siti Kasir"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Minimal 6 karakter"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              name="id_role"
              value={form.id_role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value={2}>👤 Pegawai</option>
              <option value={1}>👑 CEO</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={18} />
            {loading ? 'Memproses...' : 'Daftarkan User'}
          </button>
        </form>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
      </div>
    </div>
  )
}