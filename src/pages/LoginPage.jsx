import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Coffee, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'

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

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (data.level_role === 0) {
      navigate('/ceo')
    } else {
      navigate('/kasir')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-200 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-2xl shadow-amber-200 mb-4">
            <Coffee className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Selamat Datang</h1>
          <p className="text-gray-500 mt-2">Masuk ke sistem kasir</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white/50">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl mb-6 flex items-center gap-3 animate-slideUp">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⚠️</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:bg-white transition-all"
                placeholder="Masukkan username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3.5 pr-12 text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-300 disabled:to-orange-300 text-white font-semibold py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-200 btn-press"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6 flex items-center justify-center gap-1">
          <Sparkles size={14} />
          Toko Minuman Management System
        </p>
      </div>
    </div>
  )
}