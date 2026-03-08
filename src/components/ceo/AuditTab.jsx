import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Search, CheckCircle, AlertTriangle, Shield, ShieldCheck, ShieldAlert,
  ShieldX, BarChart3, TrendingDown, TrendingUp, Package, Hash,
  ClipboardCheck, Eye, EyeOff, RefreshCw, History, ChevronRight,
  ArrowRight, Minus, Info, X, Calendar, Clock, FileText, Zap,
  Activity, Target, AlertCircle, Layers, Database, Fingerprint,
  ScanLine, RotateCcw, Sparkles, Award, Flag, BookOpen, Lock,
  Unlock, PieChart, ArrowDown, ArrowUp, TriangleAlert, CircleDot,
  Timer, Gauge, ListChecks, ClipboardList, BadgeCheck, BadgeAlert,
  ShieldOff, Scale, Diff, GitCompare, Radar
} from 'lucide-react'
import { rp, inputClass, btnPrimary } from '../../utils/helpers'

// ─── Animated Counter Component ───────────────────────────────────────────────
function AnimatedNumber({ value, duration = 800, className = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const target = typeof value === 'number' ? value : 0
    const start = 0
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (target - start) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }

    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])

  return <span className={className}>{display}</span>
}

// ─── Pulse Dot Component ──────────────────────────────────────────────────────
function PulseDot({ color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-400',
    red: 'bg-red-400',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-400'
  }
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[color]}`} />
    </span>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4 p-6 bg-stone-50 rounded-2xl border border-stone-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-stone-200 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-stone-200 rounded w-3/4" />
          <div className="h-3 bg-stone-200 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-stone-200 rounded-xl" />
        ))}
      </div>
      <div className="h-4 bg-stone-200 rounded w-full" />
      <div className="h-16 bg-stone-200 rounded-xl" />
    </div>
  )
}

// ─── Floating Particles Background ───────────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-300/20 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${10 + (i % 3) * 30}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
    </div>
  )
}

// ─── Progress Ring Component ─────────────────────────────────────────────────
function ProgressRing({ percentage, size = 80, strokeWidth = 6, color = '#10b981' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      const clamped = Math.min(Math.max(percentage, 0), 100)
      setOffset(circumference - (clamped / 100) * circumference)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage, circumference])

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

// ─── Status Badge Component ──────────────────────────────────────────────────
function StatusBadge({ type }) {
  const config = {
    safe: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      icon: ShieldCheck,
      label: 'VERIFIED SAFE'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-700',
      icon: ShieldAlert,
      label: 'ANOMALY DETECTED'
    },
    danger: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      icon: ShieldX,
      label: 'FRAUD DETECTED'
    }
  }

  const c = config[type] || config.safe
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text}`}>
      <Icon size={12} />
      {c.label}
    </span>
  )
}

// ─── Audit History Item ──────────────────────────────────────────────────────
function AuditHistoryItem({ item, index }) {
  const getStatusColor = (selisih) => {
    if (selisih > 0) return 'border-l-red-500'
    if (selisih < 0) return 'border-l-yellow-500'
    return 'border-l-emerald-500'
  }

  return (
    <div
      className={`border-l-4 ${getStatusColor(item.selisih)} bg-white rounded-r-lg p-3 
        hover:shadow-md transition-all duration-200 cursor-default group animate-slideUp`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold
            ${item.selisih > 0 ? 'bg-red-500' : item.selisih < 0 ? 'bg-yellow-500' : 'bg-emerald-500'}`}>
            {item.selisih > 0 ? <AlertTriangle size={13} /> : item.selisih < 0 ? <Info size={13} /> : <CheckCircle size={13} />}
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-700">{item.nama_cup}</p>
            <p className="text-[10px] text-stone-400">{item.timestamp}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${
            item.selisih > 0 ? 'text-red-600' : item.selisih < 0 ? 'text-yellow-600' : 'text-emerald-600'
          }`}>
            {item.selisih > 0 ? '+' : ''}{item.selisih}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AuditTab({ cups, msg }) {
  const [auditResult, setAuditResult] = useState(null)
  const [auditForm, setAuditForm] = useState({ id_cup: '', cup_fisik: '' })
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [auditHistory, setAuditHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedCup, setSelectedCup] = useState(null)
  const [step, setStep] = useState(1)
  const [showTips, setShowTips] = useState(true)
  const [scanAnimation, setScanAnimation] = useState(false)
  const [resultRevealed, setResultRevealed] = useState(false)
  const formRef = useRef(null)
  const resultRef = useRef(null)

  // ─── Update selected cup info when form changes ─────────────────────────
  useEffect(() => {
    if (auditForm.id_cup) {
      const cup = cups.find(c => c.id_cup === parseInt(auditForm.id_cup))
      setSelectedCup(cup || null)
      setStep(2)
    } else {
      setSelectedCup(null)
      setStep(1)
    }
  }, [auditForm.id_cup, cups])

  useEffect(() => {
    if (auditForm.cup_fisik !== '' && auditForm.id_cup) {
      setStep(3)
    } else if (auditForm.id_cup) {
      setStep(2)
    }
  }, [auditForm.cup_fisik, auditForm.id_cup])

  // ─── Scroll to result when available ─────────────────────────────────────
  useEffect(() => {
    if (showResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [showResult])

  // ─── Handle Audit ────────────────────────────────────────────────────────
  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuditResult(null)
    setShowResult(false)
    setResultRevealed(false)
    setScanAnimation(true)

    // Simulate scanning animation
    await new Promise(resolve => setTimeout(resolve, 1500))

    const { data, error } = await supabase.rpc('fn_audit_cup', {
      p_id_cup: parseInt(auditForm.id_cup),
      p_cup_fisik: parseInt(auditForm.cup_fisik)
    })

    setScanAnimation(false)

    if (error) {
      msg(error.message, false)
      setLoading(false)
      return
    }

    const result = data?.[0]
    setAuditResult(result)
    setShowResult(true)
    setLoading(false)

    // Add to history
    if (result) {
      const historyItem = {
        ...result,
        timestamp: new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      setAuditHistory(prev => [historyItem, ...prev].slice(0, 20))
    }

    // Reveal animation
    setTimeout(() => setResultRevealed(true), 200)
  }

  // ─── Reset Form ──────────────────────────────────────────────────────────
  const handleReset = () => {
    setAuditForm({ id_cup: '', cup_fisik: '' })
    setAuditResult(null)
    setShowResult(false)
    setSelectedCup(null)
    setStep(1)
    setResultRevealed(false)
  }

  // ─── Get audit severity ─────────────────────────────────────────────────
  const getAuditSeverity = (selisih) => {
    if (!selisih || selisih === 0) return 'safe'
    if (selisih > 0) return 'danger'
    return 'warning'
  }

  // ─── Get severity config ────────────────────────────────────────────────
  const getSeverityConfig = (severity) => ({
    safe: {
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'ring-emerald-500/20',
      text: 'text-emerald-700',
      textDark: 'text-emerald-800',
      accent: '#10b981',
      icon: ShieldCheck,
      title: 'STOK TERVERIFIKASI AMAN',
      subtitle: 'Tidak ditemukan penyimpangan antara stok sistem dan fisik',
      emoji: '✅'
    },
    warning: {
      gradient: 'from-yellow-500 to-amber-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      ring: 'ring-yellow-500/20',
      text: 'text-yellow-700',
      textDark: 'text-yellow-800',
      accent: '#f59e0b',
      icon: ShieldAlert,
      title: 'ANOMALI TERDETEKSI',
      subtitle: 'Stok fisik lebih banyak dari sistem — perlu investigasi',
      emoji: '⚠️'
    },
    danger: {
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      ring: 'ring-red-500/20',
      text: 'text-red-700',
      textDark: 'text-red-800',
      accent: '#ef4444',
      icon: ShieldX,
      title: 'KECURANGAN TERDETEKSI!',
      subtitle: 'Stok fisik kurang dari sistem — kemungkinan pencurian',
      emoji: '🚨'
    }
  }[severity])

  // ─── Calculate match percentage ─────────────────────────────────────────
  const getMatchPercentage = () => {
    if (!auditResult) return 100
    const { stok_sistem, selisih } = auditResult
    if (stok_sistem === 0) return selisih === 0 ? 100 : 0
    return Math.max(0, Math.round(((stok_sistem - Math.abs(selisih)) / stok_sistem) * 100))
  }

  // ─── Step indicator data ────────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Pilih Cup', icon: Package },
    { num: 2, label: 'Input Fisik', icon: Hash },
    { num: 3, label: 'Audit', icon: ScanLine }
  ]

  // ─── Audit tips ─────────────────────────────────────────────────────────
  const auditTips = [
    {
      icon: Target,
      title: 'Hitung dengan Teliti',
      desc: 'Pastikan menghitung semua cup di rak, termasuk yang tersembunyi'
    },
    {
      icon: Clock,
      title: 'Waktu yang Tepat',
      desc: 'Lakukan audit saat tidak ada transaksi untuk akurasi maksimal'
    },
    {
      icon: Fingerprint,
      title: 'Verifikasi Identitas',
      desc: 'Pastikan jenis cup yang dihitung sesuai dengan yang dipilih'
    },
    {
      icon: FileText,
      title: 'Dokumentasi',
      desc: 'Catat setiap temuan anomali untuk pelaporan lebih lanjut'
    }
  ]

  // ─── Stats summary ─────────────────────────────────────────────────────
  const getHistoryStats = () => {
    const total = auditHistory.length
    const safe = auditHistory.filter(h => h.selisih === 0).length
    const warning = auditHistory.filter(h => h.selisih < 0).length
    const danger = auditHistory.filter(h => h.selisih > 0).length
    return { total, safe, warning, danger }
  }

  const historyStats = getHistoryStats()

  return (
    <div className="animate-slideUp space-y-6">
      {/* ═══ Custom Styles ═══ */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) scale(1); opacity: 0.3; }
          100% { transform: translateY(-20px) scale(1.5); opacity: 0.1; }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
        .animate-fadeScale { animation: fadeScale 0.5s ease-out forwards; }
        .animate-bounceIn { animation: bounceIn 0.6s ease-out forwards; }
        .shimmer-text {
          background: linear-gradient(90deg, currentColor 40%, #93c5fd 50%, currentColor 60%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .scan-line {
          animation: scanLine 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* ═══ Header Section ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-8 shadow-2xl">
        <FloatingParticles />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-4 right-4 opacity-[0.03]">
          <Shield size={200} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl 
                flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Audit Cup
                </h1>
                <p className="text-blue-200/70 text-sm mt-1 max-w-md">
                  Sistem verifikasi stok untuk mendeteksi penyimpangan antara catatan digital dan kondisi fisik
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold 
                    bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    <PulseDot color="blue" />
                    REAL-TIME AUDIT
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold 
                    bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <Lock size={10} />
                    SECURE
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-bold text-white">{cups.length}</p>
                <p className="text-[10px] text-blue-300/70 font-medium">Total Cup</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-bold text-emerald-400">{historyStats.safe}</p>
                <p className="text-[10px] text-blue-300/70 font-medium">Aman</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-bold text-red-400">{historyStats.danger}</p>
                <p className="text-[10px] text-blue-300/70 font-medium">Fraud</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Tips Section (Collapsible) ═══ */}
      {showTips && (
        <div className="animate-slideUp bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 relative">
          <button
            onClick={() => setShowTips(false)}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <X size={14} className="text-blue-400" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen size={13} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-blue-900">Tips Audit yang Efektif</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {auditTips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 bg-white/70 backdrop-blur-sm rounded-xl p-3 
                  border border-blue-100/50 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <tip.icon size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-900">{tip.title}</p>
                  <p className="text-[10px] text-blue-600/70 mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Main Content Grid ═══ */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* ─── Left Column: Form ─── */}
        <div className="lg:col-span-2 space-y-5" ref={formRef}>

          {/* Step Indicator */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                      ${step >= s.num
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                        : 'bg-stone-100 text-stone-400'}`}>
                      {step > s.num ? (
                        <CheckCircle size={18} />
                      ) : (
                        <s.icon size={16} />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 transition-colors
                      ${step >= s.num ? 'text-blue-600' : 'text-stone-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500
                      ${step > s.num ? 'bg-blue-500' : 'bg-stone-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Audit Form Card */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-stone-50 to-blue-50/30 px-6 py-4 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ClipboardCheck size={17} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-sm">Form Audit</h3>
                    <p className="text-[10px] text-stone-400">Isi data untuk memulai audit</p>
                  </div>
                </div>
                {(auditForm.id_cup || auditForm.cup_fisik) && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold 
                      text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-all"
                  >
                    <RotateCcw size={11} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAudit} className="p-6 space-y-5">
              {/* Cup Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wider">
                  <Package size={12} className="text-blue-500" />
                  Pilih Cup
                </label>
                <div className="relative">
                  <select
                    value={auditForm.id_cup}
                    onChange={(e) => setAuditForm(p => ({ ...p, id_cup: e.target.value }))}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm 
                      font-medium text-stone-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 
                      focus:bg-white outline-none transition-all duration-200 appearance-none cursor-pointer
                      hover:border-stone-300"
                    required
                  >
                    <option value="">— Pilih cup untuk diaudit —</option>
                    {cups.map(c => (
                      <option key={c.id_cup} value={c.id_cup}>
                        {c.nama_cup} — Stok Sistem: {c.stok_sekarang}
                      </option>
                    ))}
                  </select>
                  <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Selected Cup Info */}
              {selectedCup && (
                <div className="animate-slideUp bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 
                  border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Database size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900">{selectedCup.nama_cup}</p>
                        <p className="text-[10px] text-blue-600/60">Data dari sistem</p>
                      </div>
                    </div>
                    <StatusBadge type="safe" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/80 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-stone-400 font-semibold">Stok Sistem</p>
                      <p className="text-lg font-extrabold text-blue-600">{selectedCup.stok_sekarang}</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-stone-400 font-semibold">Harga</p>
                      <p className="text-lg font-extrabold text-stone-700">{rp(selectedCup.harga)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Count Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wider">
                  <Hash size={12} className="text-indigo-500" />
                  Jumlah Cup Fisik
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={auditForm.cup_fisik}
                    onChange={(e) => setAuditForm(p => ({ ...p, cup_fisik: e.target.value }))}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl text-sm 
                      font-medium text-stone-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 
                      focus:bg-white outline-none transition-all duration-200 placeholder:text-stone-400
                      hover:border-stone-300"
                    placeholder="Masukkan hasil hitungan manual..."
                    min="0"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Layers size={16} />
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Info size={10} />
                  Hitung semua cup fisik di lokasi penyimpanan
                </p>
              </div>

              {/* Preview Difference */}
              {selectedCup && auditForm.cup_fisik !== '' && (
                <div className="animate-slideUp">
                  <div className={`rounded-xl p-3 border ${
                    parseInt(auditForm.cup_fisik) === selectedCup.stok_sekarang
                      ? 'bg-emerald-50 border-emerald-200'
                      : parseInt(auditForm.cup_fisik) < selectedCup.stok_sekarang
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitCompare size={14} className={
                          parseInt(auditForm.cup_fisik) === selectedCup.stok_sekarang
                            ? 'text-emerald-500'
                            : parseInt(auditForm.cup_fisik) < selectedCup.stok_sekarang
                              ? 'text-red-500'
                              : 'text-yellow-500'
                        } />
                        <span className="text-xs font-semibold text-stone-600">Preview Selisih</span>
                      </div>
                      <span className={`text-sm font-extrabold ${
                        parseInt(auditForm.cup_fisik) === selectedCup.stok_sekarang
                          ? 'text-emerald-600'
                          : parseInt(auditForm.cup_fisik) < selectedCup.stok_sekarang
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}>
                        {selectedCup.stok_sekarang - parseInt(auditForm.cup_fisik)} cup
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !auditForm.id_cup || auditForm.cup_fisik === ''}
                className="w-full relative overflow-hidden flex items-center justify-center gap-2 px-6 py-3.5 
                  bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                  text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 
                  transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed 
                  disabled:shadow-none hover:shadow-xl hover:shadow-blue-500/30 
                  active:scale-[0.98] hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memindai Stok...</span>
                  </>
                ) : (
                  <>
                    <ScanLine size={18} />
                    <span>Jalankan Audit</span>
                    <ArrowRight size={16} className="ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History Toggle */}
          {auditHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white 
                rounded-2xl border border-stone-100 shadow-sm hover:border-stone-200 
                hover:shadow transition-all duration-200 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center 
                  group-hover:bg-stone-200 transition-colors">
                  <History size={14} className="text-stone-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-stone-700">Riwayat Audit</p>
                  <p className="text-[10px] text-stone-400">{auditHistory.length} audit terakhir</p>
                </div>
              </div>
              <ChevronRight size={16} className={`text-stone-400 transition-transform duration-300 
                ${showHistory ? 'rotate-90' : ''}`} />
            </button>
          )}

          {/* Audit History */}
          {showHistory && auditHistory.length > 0 && (
            <div className="animate-slideUp bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700">Log Audit Terkini</h4>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CircleDot size={8} /> {historyStats.safe}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <CircleDot size={8} /> {historyStats.warning}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      <CircleDot size={8} /> {historyStats.danger}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {auditHistory.map((item, i) => (
                  <AuditHistoryItem key={i} item={item} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Column: Result ─── */}
        <div className="lg:col-span-3" ref={resultRef}>
          {/* Scanning Animation */}
          {scanAnimation && (
            <div className="animate-fadeScale bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="relative p-12 flex flex-col items-center justify-center min-h-[400px]">
                {/* Scan Lines */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="scan-line w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                </div>

                {/* Scanning Icon */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center">
                    <Radar size={48} className="text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="absolute inset-0 rounded-3xl border-2 border-blue-300 animate-ping opacity-30" />
                </div>

                <h3 className="text-lg font-bold text-stone-800 mb-2">Memindai Stok...</h3>
                <p className="text-sm text-stone-500 mb-6">Membandingkan data sistem dengan input fisik</p>

                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {showResult && auditResult && !scanAnimation && (() => {
            const severity = getAuditSeverity(auditResult.selisih)
            const config = getSeverityConfig(severity)
            const SeverityIcon = config.icon
            const matchPct = getMatchPercentage()

            return (
              <div className={`animate-fadeScale space-y-5 ${resultRevealed ? 'opacity-100' : 'opacity-0'} 
                transition-opacity duration-500`}>

                {/* Main Result Card */}
                <div className={`bg-white rounded-2xl border ${config.border} shadow-sm overflow-hidden 
                  ring-1 ${config.ring}`}>

                  {/* Result Header */}
                  <div className={`bg-gradient-to-r ${config.gradient} p-6 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h20v20H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%2010h20M10%200v20%22%20stroke%3D%22white%22%20stroke-opacity%3D%220.05%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="animate-bounceIn">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl 
                            flex items-center justify-center border border-white/20">
                            <SeverityIcon size={32} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-extrabold text-white tracking-tight">
                              {config.title}
                            </h2>
                            <span className="text-2xl">{config.emoji}</span>
                          </div>
                          <p className="text-white/70 text-sm">{config.subtitle}</p>
                        </div>
                      </div>

                      {/* Match Percentage Ring */}
                      <div className="hidden md:flex flex-col items-center">
                        <div className="relative">
                          <ProgressRing
                            percentage={matchPct}
                            size={72}
                            strokeWidth={5}
                            color="rgba(255,255,255,0.9)"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-extrabold text-white">{matchPct}%</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-white/60 mt-1 font-medium">Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Cards */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {/* System Stock */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 
                        border border-blue-100 text-center group hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Database size={13} className="text-blue-500" />
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Sistem</p>
                        </div>
                        <p className="text-3xl font-extrabold text-blue-700">
                          <AnimatedNumber value={auditResult.stok_sistem} />
                        </p>
                        <p className="text-[10px] text-blue-400 mt-1">cup tercatat</p>
                      </div>

                      {/* Physical Stock */}
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 
                        border border-indigo-100 text-center group hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Layers size={13} className="text-indigo-500" />
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Fisik</p>
                        </div>
                        <p className="text-3xl font-extrabold text-indigo-700">
                          <AnimatedNumber value={auditResult.stok_fisik} />
                        </p>
                        <p className="text-[10px] text-indigo-400 mt-1">cup dihitung</p>
                      </div>

                      {/* Difference */}
                      <div className={`rounded-xl p-4 border text-center group hover:shadow-md 
                        transition-all duration-200 ${
                        severity === 'safe'
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
                          : severity === 'danger'
                            ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100'
                            : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100'
                      }`}>
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Scale size={13} className={config.text} />
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>Selisih</p>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {auditResult.selisih > 0 && <ArrowDown size={18} className="text-red-500" />}
                          {auditResult.selisih < 0 && <ArrowUp size={18} className="text-yellow-500" />}
                          {auditResult.selisih === 0 && <Minus size={18} className="text-emerald-500" />}
                          <p className={`text-3xl font-extrabold ${
                            severity === 'safe' ? 'text-emerald-600'
                            : severity === 'danger' ? 'text-red-600'
                            : 'text-yellow-600'
                          }`}>
                            <AnimatedNumber value={Math.abs(auditResult.selisih)} />
                          </p>
                        </div>
                        <p className={`text-[10px] mt-1 ${
                          severity === 'safe' ? 'text-emerald-400'
                          : severity === 'danger' ? 'text-red-400'
                          : 'text-yellow-400'
                        }`}>
                          {severity === 'safe' ? 'tidak ada selisih' :
                           severity === 'danger' ? 'cup hilang' : 'cup lebih'}
                        </p>
                      </div>
                    </div>

                    {/* Visual Comparison Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          Perbandingan Visual
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {matchPct}% kecocokan
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold text-stone-500 w-12">Sistem</span>
                          <div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full 
                                transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                              style={{ width: '100%' }}
                            >
                              <span className="text-[9px] font-bold text-white">{auditResult.stok_sistem}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold text-stone-500 w-12">Fisik</span>
                          <div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out delay-300 
                                flex items-center justify-end pr-2 ${
                                severity === 'safe'
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                  : severity === 'danger'
                                    ? 'bg-gradient-to-r from-red-400 to-red-600'
                                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              }`}
                              style={{
                                width: auditResult.stok_sistem > 0
                                  ? `${Math.min((auditResult.stok_fisik / auditResult.stok_sistem) * 100, 100)}%`
                                  : '0%'
                              }}
                            >
                              <span className="text-[9px] font-bold text-white">{auditResult.stok_fisik}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className={`${config.bg} rounded-xl p-4 border ${config.border} mb-4`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 
                          bg-gradient-to-br ${config.gradient}`}>
                          <FileText size={14} className="text-white" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${config.textDark} mb-1`}>Analisis Hasil</p>
                          <p className="text-sm text-stone-600 leading-relaxed">{auditResult.status}</p>
                        </div>
                      </div>
                    </div>

                    {/* Loss Estimation */}
                    {auditResult.estimasi_kerugian > 0 && (
                      <div className="animate-slideUp bg-gradient-to-br from-red-50 via-rose-50 to-red-50 
                        rounded-xl p-5 border border-red-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                              <TrendingDown size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-red-800">Estimasi Kerugian</p>
                              <p className="text-[10px] text-red-500">Berdasarkan harga cup × selisih</p>
                            </div>
                          </div>

                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center border border-red-100">
                            <p className="text-3xl font-black text-red-700 tracking-tight">
                              {rp(auditResult.estimasi_kerugian)}
                            </p>
                            <div className="flex items-center justify-center gap-4 mt-2">
                              <span className="text-[10px] text-red-500 flex items-center gap-1">
                                <Package size={10} />
                                {Math.abs(auditResult.selisih)} cup hilang
                              </span>
                              <span className="text-[10px] text-stone-400">×</span>
                              <span className="text-[10px] text-red-500 flex items-center gap-1">
                                <Tag size={10} />
                                {selectedCup ? rp(selectedCup.harga) : '-'}/cup
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-5 pt-5 border-t border-stone-100">
                      <button
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                          bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs 
                          rounded-xl transition-all duration-200 hover:shadow-sm"
                      >
                        <RefreshCw size={14} />
                        Audit Ulang
                      </button>
                      <button
                        onClick={() => {
                          const cupName = auditResult.nama_cup
                          const selisih = auditResult.selisih
                          const status = severity === 'safe' ? 'AMAN' : severity === 'danger' ? 'FRAUD' : 'ANOMALI'
                          const text = `[AUDIT] ${cupName}: Selisih ${selisih}, Status: ${status}`
                          navigator.clipboard?.writeText(text)
                          msg('Hasil audit disalin ke clipboard!', true)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                          bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs 
                          rounded-xl transition-all duration-200 hover:shadow-sm border border-blue-200"
                      >
                        <ClipboardList size={14} />
                        Salin Hasil
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Insight Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Accuracy Card */}
                  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Gauge size={16} className="text-stone-500" />
                      <h4 className="text-xs font-bold text-stone-700">Akurasi Stok</h4>
                    </div>
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative">
                        <ProgressRing
                          percentage={matchPct}
                          size={100}
                          strokeWidth={8}
                          color={config.accent}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-2xl font-extrabold ${config.text}`}>{matchPct}%</span>
                          <span className="text-[9px] text-stone-400">akurasi</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 text-center">
                      {matchPct >= 100 ? 'Stok 100% akurat' :
                       matchPct >= 90 ? 'Penyimpangan minor' :
                       matchPct >= 75 ? 'Perlu perhatian' : 'Penyimpangan signifikan'}
                    </p>
                  </div>

                  {/* Risk Level Card */}
                  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={16} className="text-stone-500" />
                      <h4 className="text-xs font-bold text-stone-700">Level Risiko</h4>
                    </div>
                    <div className="flex flex-col items-center justify-center mb-3">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2
                        bg-gradient-to-br ${config.gradient}`}>
                        <SeverityIcon size={28} className="text-white" />
                      </div>
                      <span className={`text-sm font-extrabold ${config.text}`}>
                        {severity === 'safe' ? 'RENDAH' : severity === 'danger' ? 'TINGGI' : 'SEDANG'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`w-6 h-2 rounded-full transition-all duration-300 ${
                            severity === 'safe' && level <= 1 ? 'bg-emerald-500' :
                            severity === 'warning' && level <= 3 ? 'bg-yellow-500' :
                            severity === 'danger' && level <= 5 ? 'bg-red-500' :
                            'bg-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      <h4 className="text-xs font-bold text-stone-700">Rekomendasi Tindakan</h4>
                    </div>
                  </div>
                  <div className="p-5">
                    {severity === 'safe' ? (
                      <div className="space-y-3">
                        {[
                          { icon: BadgeCheck, text: 'Stok terverifikasi aman, tidak ada tindakan yang diperlukan' },
                          { icon: Calendar, text: 'Jadwalkan audit rutin berikutnya dalam 7 hari' },
                          { icon: Award, text: 'Berikan apresiasi kepada tim atas pengelolaan yang baik' }
                        ].map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 group">
                            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0
                              group-hover:bg-emerald-200 transition-colors">
                              <rec.icon size={13} className="text-emerald-600" />
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed pt-1">{rec.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : severity === 'danger' ? (
                      <div className="space-y-3">
                        {[
                          { icon: Flag, text: 'Segera lakukan investigasi internal terhadap penyimpangan stok' },
                          { icon: Lock, text: 'Periksa akses dan izin personel yang menangani cup ini' },
                          { icon: Eye, text: 'Tinjau rekaman CCTV untuk periode terkait' },
                          { icon: FileText, text: 'Buat laporan insiden dan dokumentasikan temuan' },
                          { icon: AlertCircle, text: 'Pertimbangkan untuk meningkatkan frekuensi audit' }
                        ].map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 group">
                            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0
                              group-hover:bg-red-200 transition-colors">
                              <rec.icon size={13} className="text-red-600" />
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed pt-1">{rec.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[
                          { icon: Search, text: 'Periksa apakah ada cup masuk yang belum tercatat di sistem' },
                          { icon: ListChecks, text: 'Verifikasi ulang proses input data stok terakhir' },
                          { icon: RefreshCw, text: 'Lakukan audit ulang untuk konfirmasi hasil' }
                        ].map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 group">
                            <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0
                              group-hover:bg-yellow-200 transition-colors">
                              <rec.icon size={13} className="text-yellow-600" />
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed pt-1">{rec.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Empty State */}
          {!showResult && !scanAnimation && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 
              flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center">
                  <Shield size={48} className="text-stone-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-xl 
                  flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <ScanLine size={16} className="text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-stone-700 mb-2">Belum Ada Audit</h3>
              <p className="text-sm text-stone-400 max-w-xs leading-relaxed mb-6">
                Pilih cup dan masukkan jumlah fisik di form audit untuk memulai proses verifikasi stok
              </p>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span>Aman</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span>Anomali</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span>Fraud</span>
                </div>
              </div>

              {/* Info Cards in Empty State */}
              <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-md">
                {[
                  { icon: Shield, label: 'Verifikasi', desc: 'Cek kecocokan stok', color: 'blue' },
                  { icon: BarChart3, label: 'Analisis', desc: 'Lihat perbandingan', color: 'indigo' },
                  { icon: Zap, label: 'Deteksi', desc: 'Temukan anomali', color: 'amber' }
                ].map((item, i) => (
                  <div key={i} className="bg-stone-50 rounded-xl p-3 text-center 
                    hover:bg-stone-100 transition-colors cursor-default">
                    <div className={`w-8 h-8 mx-auto mb-2 bg-${item.color}-100 rounded-lg 
                      flex items-center justify-center`}>
                      <item.icon size={14} className={`text-${item.color}-500`} />
                    </div>
                    <p className="text-[10px] font-bold text-stone-700">{item.label}</p>
                    <p className="text-[9px] text-stone-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Missing import used in the code
const Tag = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
)