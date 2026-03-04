import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Coffee, UserPlus, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut, isCEO } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { signOut(); navigate('/login') }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-black/5">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(isCEO ? '/ceo' : '/kasir')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Coffee size={16} className="text-white" />
          </div>
          <span className="font-bold text-[15px] text-stone-800 hidden sm:block">Minuman</span>
        </div>

        {/* Right */}
        <div className="relative">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 py-1.5 pl-3 pr-2 rounded-full hover:bg-stone-100 transition cursor-pointer">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
              isCEO ? 'bg-violet-500' : 'bg-emerald-500'
            }`}>
              {user?.nama?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-stone-700 hidden sm:block">{user?.nama}</span>
            <ChevronDown size={14} className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-20 animate-scaleIn origin-top-right">
                <div className="px-4 py-2.5 border-b border-stone-100">
                  <p className="text-sm font-semibold text-stone-800">{user?.nama}</p>
                  <p className="text-xs text-stone-400">{user?.nama_role}</p>
                </div>
                {isCEO && (
                  <button onClick={() => { navigate('/register'); setOpen(false) }}
                    className="w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer">
                    <UserPlus size={15} /> Tambah User
                  </button>
                )}
                <button onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer">
                  <LogOut size={15} /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}