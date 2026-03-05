import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, CheckCircle, AlertTriangle } from 'lucide-react'
import { rp, inputClass, btnPrimary } from '../../utils/helpers'

export default function AuditTab({ cups, msg }) {
  const [auditResult, setAuditResult] = useState(null)
  const [auditForm, setAuditForm] = useState({ id_cup: '', cup_fisik: '' })
  const [loading, setLoading] = useState(false)

  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuditResult(null)

    const { data, error } = await supabase.rpc('fn_audit_cup', {
      p_id_cup: parseInt(auditForm.id_cup),
      p_cup_fisik: parseInt(auditForm.cup_fisik)
    })

    if (error) msg(error.message, false)
    else setAuditResult(data?.[0])
    setLoading(false)
  }

  return (
    <div className="animate-slideUp">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-stone-800">Audit Cup</h2>
        <p className="text-xs text-stone-400 mt-0.5">Bandingkan stok sistem vs fisik untuk deteksi kecurangan</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Form */}
        <div className="card p-5">
          <h3 className="font-bold text-stone-800 mb-4 text-sm flex items-center gap-2">
            <Search size={16} className="text-blue-500" />
            Form Audit
          </h3>
          <form onSubmit={handleAudit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Pilih Cup</label>
              <select
                value={auditForm.id_cup}
                onChange={(e) => setAuditForm(p => ({ ...p, id_cup: e.target.value }))}
                className={inputClass}
                required
              >
                <option value="">-- Pilih Cup --</option>
                {cups.map(c => (
                  <option key={c.id_cup} value={c.id_cup}>
                    {c.nama_cup} (Sistem: {c.stok_sekarang})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wide">Jumlah Cup Fisik</label>
              <input
                type="number"
                value={auditForm.cup_fisik}
                onChange={(e) => setAuditForm(p => ({ ...p, cup_fisik: e.target.value }))}
                className={inputClass}
                placeholder="Hitung manual cup di rak"
                min="0"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${btnPrimary} w-full justify-center`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search size={15} /> Jalankan Audit</>
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        {auditResult && (
          <div className={`card p-5 !border-2 animate-scaleIn ${
            auditResult.selisih > 0
              ? '!border-red-200 !bg-red-50'
              : auditResult.selisih < 0
              ? '!border-yellow-200 !bg-yellow-50'
              : '!border-emerald-200 !bg-emerald-50'
          }`}>
            {/* Status Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                auditResult.selisih > 0 ? 'bg-red-500' :
                auditResult.selisih < 0 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}>
                {auditResult.selisih !== 0
                  ? <AlertTriangle size={20} className="text-white" />
                  : <CheckCircle size={20} className="text-white" />
                }
              </div>
              <div>
                <h3 className="font-bold text-stone-800 text-lg">
                  {auditResult.selisih > 0 ? 'KECURANGAN TERDETEKSI!' :
                   auditResult.selisih < 0 ? 'ANOMALI' : 'AMAN ✓'}
                </h3>
                <p className="text-xs text-stone-500">{auditResult.nama_cup}</p>
              </div>
            </div>

            {/* Numbers */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { l: 'Sistem', v: auditResult.stok_sistem },
                { l: 'Fisik', v: auditResult.stok_fisik },
                { l: 'Selisih', v: auditResult.selisih }
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-3 text-center">
                  <p className="text-[10px] text-stone-400 font-medium">{s.l}</p>
                  <p className={`text-2xl font-extrabold ${
                    s.l === 'Selisih'
                      ? (s.v > 0 ? 'text-red-600' : s.v < 0 ? 'text-yellow-600' : 'text-emerald-600')
                      : 'text-stone-800'
                  }`}>{s.v}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-stone-600 mb-3">{auditResult.status}</p>

            {auditResult.estimasi_kerugian > 0 && (
              <div className="bg-red-100 rounded-xl p-4 text-center">
                <p className="text-xs text-red-500 font-medium">Estimasi Kerugian</p>
                <p className="text-xl font-extrabold text-red-700 mt-0.5">
                  {rp(auditResult.estimasi_kerugian)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}