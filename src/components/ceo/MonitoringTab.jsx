import { RefreshCw, Package } from 'lucide-react'

export default function MonitoringTab({ cups, fetchCups }) {
  return (
    <div className="animate-slideUp">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-stone-800">Monitoring Cup</h2>
          <p className="text-xs text-stone-400 mt-0.5">Pantau stok cup real-time</p>
        </div>
        <button
          onClick={fetchCups}
          className="p-2.5 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer press"
        >
          <RefreshCw size={15} className="text-stone-400" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {cups.map(cup => {
          const persen = cup.stok_awal > 0 ? Math.round((cup.terjual_cup / cup.stok_awal) * 100) : 0
          const sisaPersen = cup.stok_awal > 0 ? Math.round((cup.stok_sekarang / cup.stok_awal) * 100) : 100
          const isLow = sisaPersen < 20

          return (
            <div key={cup.id_cup} className="card p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-stone-800">{cup.nama_cup}</h3>
                  {isLow && (
                    <p className="text-xs text-red-500 font-semibold mt-1 animate-pulse-soft">
                      ⚠ Stok Menipis!
                    </p>
                  )}
                </div>
                <span className={`text-xl font-extrabold ${isLow ? 'text-red-500' : 'text-emerald-500'}`}>
                  {sisaPersen}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-stone-100 rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isLow ? 'bg-red-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'
                  }`}
                  style={{ width: `${Math.min(persen, 100)}%` }}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 text-center gap-2">
                <div className="bg-stone-50 rounded-xl py-2.5">
                  <p className="text-[10px] text-stone-400 font-medium">Awal</p>
                  <p className="font-bold text-stone-800 mt-0.5">{cup.stok_awal}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl py-2.5">
                  <p className="text-[10px] text-emerald-500 font-medium">Terjual</p>
                  <p className="font-bold text-emerald-600 mt-0.5">{cup.terjual_cup}</p>
                </div>
                <div className={`rounded-xl py-2.5 ${isLow ? 'bg-red-50' : 'bg-sky-50'}`}>
                  <p className={`text-[10px] font-medium ${isLow ? 'text-red-400' : 'text-sky-500'}`}>Sisa</p>
                  <p className={`font-bold mt-0.5 ${isLow ? 'text-red-600' : 'text-sky-600'}`}>{cup.stok_sekarang}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {cups.length === 0 && (
        <div className="text-center py-16">
          <Package size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Belum ada data cup</p>
        </div>
      )}
    </div>
  )
}