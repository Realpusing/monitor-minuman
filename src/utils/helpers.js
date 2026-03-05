// Utility functions yang dipakai bersama

export const rp = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(n)
  
  export const inputClass =
    'w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none text-sm'
  
  export const btnPrimary =
    'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 py-3 rounded-xl shadow-md shadow-amber-200/40 cursor-pointer press flex items-center gap-2 text-sm'