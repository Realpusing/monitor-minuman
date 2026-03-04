import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import KasirPage from './pages/KasirPage'
import CeoDashboard from './pages/CeoDashboard'
import RegisterPage from './pages/RegisterPage'

function AppRoutes() {
  const { user, isCEO, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={isCEO ? '/ceo' : '/kasir'} /> : <LoginPage />
      } />

      <Route path="/register" element={
        <ProtectedRoute requiredRole="CEO">
          <RegisterPage />
        </ProtectedRoute>
      } />

      <Route path="/kasir" element={
        <ProtectedRoute requiredRole="Pegawai">
          <KasirPage />
        </ProtectedRoute>
      } />

      <Route path="/ceo" element={
        <ProtectedRoute requiredRole="CEO">
          <CeoDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={
        <Navigate to={user ? (isCEO ? '/ceo' : '/kasir') : '/login'} />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}