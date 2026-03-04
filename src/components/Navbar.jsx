import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LogOut, User, Coffee, UserPlus, 
  LayoutDashboard, ShoppingBag, ChevronDown 
} from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut, isCEO } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
              <Coffee className="text-white" size={22} />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-800 text-lg leading-tight">Toko Minuman</h1>
              <p className="text-xs text-gray-400">Sistem Kasir & Monitoring</p>
            </div>
          </div>

          {/* Center Navigation - CEO Only */}
          {isCEO && (
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => navigate('/ceo')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  location.pathname === '/ceo'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} />
                  Dashboard
                </span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  location.pathname === '/register'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={16} />
                  Tambah User
                </span>
              </button>
            </div>
          )}

          {/* Right Side - Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-700">{user?.nama}</p>
                <p className="text-xs text-gray-400">{user?.nama_role}</p>
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                isCEO 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              }`}>
                {user?.nama?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-slideUp">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{user?.nama}</p>
                    <p className="text-sm text-gray-400">{user?.nama_role}</p>
                  </div>
                  
                  {isCEO && (
                    <div className="py-2 border-b border-gray-100 md:hidden">
                      <button
                        onClick={() => { navigate('/ceo'); setShowDropdown(false) }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                      >
                        <LayoutDashboard size={16} />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { navigate('/register'); setShowDropdown(false) }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                      >
                        <UserPlus size={16} />
                        Tambah User
                      </button>
                    </div>
                  )}
                  
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
                    >
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}