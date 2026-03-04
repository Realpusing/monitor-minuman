import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Coffee, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: err } = await signIn(nama, password)
    if (err) { setError('Username atau password salah'); setLoading(false); return }
    navigate(data.level_role === 0 ? '/ceo' : '/kasir')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-stone-50 relative overflow-hidden">
      {/* BG Decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-200/30 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative w-full max-w-sm animate-slideUp">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/50 animate-float">
            <Coffee size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-800">Masuk</h1>
          <p className="text-stone-400 text-sm mt-1">Sistem Kasir Toko Minuman</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl mb-5 text-center font-medium animate-scaleIn">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Username</label>
            <input
              type="text" value={nama} onChange={(e) => setNama(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-800 placeholder:text-stone-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
              placeholder="Ketik username" required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 pr-12 text-stone-800 placeholder:text-stone-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                placeholder="••••••••" required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 cursor-pointer p-1">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 cursor-pointer press mt-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Masuk</span><ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}