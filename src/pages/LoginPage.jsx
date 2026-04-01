import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Coffee,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  User,
  Lock,
  CheckCircle2,
} from 'lucide-react'

/* ──────────────────── floating coffee beans ──────────────────── */
function FloatingBeans() {
  const beans = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 14 + 6,
    delay: Math.random() * 8,
    duration: Math.random() * 12 + 10,
    opacity: Math.random() * 0.25 + 0.05,
    rotate: Math.random() * 360,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {beans.map((b) => (
        <div
          key={b.id}
          className="absolute animate-float-bean"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          <span
            style={{
              fontSize: `${b.size}px`,
              opacity: b.opacity,
              transform: `rotate(${b.rotate}deg)`,
              display: 'inline-block',
            }}
          >
            ☕
          </span>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────── particle ring ──────────────────── */
function ParticleRing() {
  const dots = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2
    const r = 160
    return {
      id: i,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      delay: i * 0.08,
      size: Math.random() * 3 + 1,
    }
  })

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
      {dots.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full bg-amber-400 animate-pulse-dot"
          style={{
            width: d.size,
            height: d.size,
            transform: `translate(${d.x}px, ${d.y}px)`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────── steam animation ──────────────────── */
function SteamEffect() {
  return (
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-amber-300/40 to-transparent rounded-full animate-steam"
          style={{
            height: '20px',
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────── typing effect hook ──────────────────── */
function useTypingText(texts, typingSpeed = 80, pause = 2000) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[idx]
    let timeout

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx))
        setCharIdx((c) => c + 1)
      }, typingSpeed)
    } else if (!deleting && charIdx > current.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx))
        setCharIdx((c) => c - 1)
      }, typingSpeed / 2)
    } else {
      setDeleting(false)
      setIdx((i) => (i + 1) % texts.length)
      setCharIdx(0)
    }
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, idx, texts, typingSpeed, pause])

  return display
}

/* ══════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
   ══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [focusField, setFocusField] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const typingText = useTypingText(
    ['Kelola bisnis dengan mudah ✨', 'Pantau penjualan real-time 📊', 'Sistem kasir modern ☕'],
    70,
    2500
  )

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
  }, [])

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    })
  }, [])

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

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      if (data.level_role === 0) {
        navigate('/ceo')
      } else {
        navigate('/kasir')
      }
    }, 1200)
  }

  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12
      ? 'Selamat Pagi'
      : currentHour < 17
        ? 'Selamat Siang'
        : 'Selamat Malam'
  const greetingEmoji = currentHour < 12 ? '🌅' : currentHour < 17 ? '☀️' : '🌙'

  /* ───── render ───── */
  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background:
          'linear-gradient(135deg, #1a0e05 0%, #2d1810 25%, #1a1208 50%, #0f0d0a 75%, #1a0e05 100%)',
      }}
    >
      {/* ── animated mesh bg ── */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 600px 600px at 20% 20%, rgba(217,119,6,0.15), transparent),' +
              'radial-gradient(ellipse 500px 500px at 80% 80%, rgba(180,83,9,0.1), transparent),' +
              'radial-gradient(ellipse 400px 400px at 50% 50%, rgba(245,158,11,0.08), transparent)',
          }}
        />
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl transition-transform duration-[3000ms] ease-out"
          style={{
            background:
              'radial-gradient(circle, rgba(217,119,6,0.06) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mousePos.x * 2}px), calc(-50% + ${mousePos.y * 2}px))`,
          }}
        />
      </div>

      {/* ── grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,119,6,0.3) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(217,119,6,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <FloatingBeans />

      {/* ══════════ MAIN CARD ══════════ */}
      <div
        className={`relative w-full max-w-[460px] transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
        }`}
      >
        <ParticleRing />

        {/* ── logo section ── */}
        <div className="text-center mb-8 relative">
          <div
            className="relative inline-block transition-transform duration-700 ease-out"
            style={{
              transform: `perspective(800px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)`,
            }}
          >
            {/* glow ring */}
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-[28px] bg-amber-500/20 blur-xl animate-pulse" />

            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-[28px] shadow-2xl shadow-amber-900/40" />
              <div className="absolute inset-[2px] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 rounded-[26px] flex items-center justify-center">
                <SteamEffect />
                <Coffee className="text-white drop-shadow-lg" size={42} strokeWidth={1.8} />
              </div>
              {/* shine */}
              <div className="absolute top-2 left-3 w-6 h-6 bg-white/20 rounded-full blur-sm" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            {greeting} {greetingEmoji}
          </h1>
          <p className="text-amber-200/50 text-sm h-6 font-mono">
            {typingText}
            <span className="animate-blink">|</span>
          </p>
        </div>

        {/* ── glass card ── */}
        <div
          className="relative rounded-[28px] p-8 border border-white/[0.06] overflow-hidden transition-transform duration-700 ease-out"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(40px)',
            boxShadow:
              '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.1) inset',
            transform: `perspective(1200px) rotateY(${mousePos.x * 0.1}deg) rotateX(${-mousePos.y * 0.1}deg)`,
          }}
        >
          {/* card inner glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/10 to-transparent" />

          {/* ── success overlay ── */}
          {success && (
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm rounded-[28px] flex flex-col items-center justify-center z-20 animate-fadeIn">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounceIn">
                <CheckCircle2 className="text-white" size={40} />
              </div>
              <p className="text-emerald-300 font-semibold text-lg mt-4">
                Login Berhasil!
              </p>
              <p className="text-emerald-400/60 text-sm mt-1">Mengalihkan...</p>
            </div>
          )}

          {/* ── error ── */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-shakeX">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <p className="text-red-300 text-sm font-medium">Gagal Masuk</p>
                  <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            {/* ── username ── */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-100/70">
                <User size={14} />
                Username
              </label>
              <div
                className={`relative rounded-2xl transition-all duration-300 ${
                  focusField === 'nama'
                    ? 'ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                    : ''
                }`}
              >
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  onFocus={() => setFocusField('nama')}
                  onBlur={() => setFocusField(null)}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.09] transition-all text-sm"
                  placeholder="Masukkan username kamu"
                  required
                  autoComplete="username"
                />
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    focusField === 'nama'
                      ? 'bg-amber-500/30 text-amber-300'
                      : 'bg-white/[0.06] text-white/30'
                  }`}
                >
                  <User size={13} />
                </div>
                {nama && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* ── password ── */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-100/70">
                <Lock size={14} />
                Password
              </label>
              <div
                className={`relative rounded-2xl transition-all duration-300 ${
                  focusField === 'password'
                    ? 'ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                    : ''
                }`}
              >
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField(null)}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl pl-12 pr-14 py-4 text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.09] transition-all text-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    focusField === 'password'
                      ? 'bg-amber-500/30 text-amber-300'
                      : 'bg-white/[0.06] text-white/30'
                  }`}
                >
                  <Lock size={13} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-amber-300 hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* password strength indicator */}
              {password && (
                <div className="flex gap-1.5 px-1 animate-fadeIn">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        password.length >= level * 2
                          ? level <= 1
                            ? 'bg-red-400'
                            : level <= 2
                              ? 'bg-orange-400'
                              : level <= 3
                                ? 'bg-yellow-400'
                                : 'bg-emerald-400'
                          : 'bg-white/[0.06]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── submit ── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="group w-full relative overflow-hidden rounded-2xl py-4 font-semibold text-sm transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background: loading || success
                    ? 'linear-gradient(135deg, rgba(217,119,6,0.3), rgba(180,83,9,0.3))'
                    : 'linear-gradient(135deg, #d97706, #b45309)',
                  boxShadow: loading || success
                    ? 'none'
                    : '0 8px 32px rgba(217,119,6,0.3), 0 0 0 1px rgba(245,158,11,0.2) inset',
                }}
              >
                {/* hover shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative flex items-center justify-center gap-2.5 text-white">
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-20"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                        />
                        <path
                          className="opacity-80"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* ── footer ── */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            {['SSL Secured', 'v2.0', 'Fast'].map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-white/20 uppercase tracking-widest bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.05]"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-white/15 text-xs flex items-center justify-center gap-1.5">
            <Sparkles size={12} />
            Toko Minuman Management System
            <span className="text-amber-400/30">•</span>
            <span className="text-white/10">
              {new Date().getFullYear()}
            </span>
          </p>
        </div>
      </div>

      {/* ══════════ INLINE STYLES / KEYFRAMES ══════════ */}
      <style>{`
        @keyframes float-bean {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-30px) rotate(10deg); }
          50%      { transform: translateY(-15px) rotate(-5deg); }
          75%      { transform: translateY(-40px) rotate(8deg); }
        }
        .animate-float-bean {
          animation: float-bean 14s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.2; transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)) scale(1); }
          50%      { opacity: 0.8; transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)) scale(1.5); }
        }
        .animate-pulse-dot {
          animation: pulse-dot 3s ease-in-out infinite;
        }

        @keyframes steam {
          0%   { opacity: 0; transform: translateY(0) scaleY(0.5); }
          50%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-18px) scaleY(1.2); }
        }
        .animate-steam {
          animation: steam 2s ease-out infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes bounceIn {
          0%   { transform: scale(0); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-bounceIn {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shakeX {
          animation: shakeX 0.6s ease-in-out;
        }
      `}</style>
    </div>
  )
}