import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cek localStorage saat pertama load
  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  // LOGIN via RPC
  const signIn = async (nama, password) => {
    const { data, error } = await supabase
      .rpc('fn_login_user', {
        p_nama: nama,
        p_password: password
      })

    if (error) {
      return { data: null, error }
    }

    if (data && data.length > 0) {
      const userData = data[0]
      setUser(userData)
      localStorage.setItem('user_session', JSON.stringify(userData))
      return { data: userData, error: null }
    }

    return { data: null, error: { message: 'Username atau password salah!' } }
  }

  // LOGOUT
  const signOut = () => {
    setUser(null)
    localStorage.removeItem('user_session')
  }

  const isCEO = user?.level_role === 0
  const isPegawai = user?.level_role === 1

  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn, signOut,
      isCEO, isPegawai
    }}>
      {children}
    </AuthContext.Provider>
  )
}