import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DashboardPegawai() {
  const [menu, setMenu] = useState([]);
  const [sisaCup, setSisaCup] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ambilData();
  }, []);

  async function ambilData() {
    // 1. Ambil data menu jualan
    const { data: menuData } = await supabase.from('menu_jualan').select('*');
    // 2. Ambil sisa cup (Anti-Tipu)
    const { data: cupData } = await supabase.from('inventory_cup').select('stok_sekarang').single();
    
    setMenu(menuData || []);
    setSisaCup(cupData?.stok_sekarang || 0);
    setLoading(false);
  }

  async function handleJual(item) {
    if (sisaCup <= 0) {
      alert("⚠️ STOK CUP HABIS! Tidak bisa jualan. Lapor ke CEO!");
      return;
    }

    const konfirmasi = window.confirm(`Jual ${item.nama_item} - Rp ${item.harga_jual.toLocaleString()}?`);
    if (!konfirmasi) return;

    // A. Catat Transaksi Penjualan
    const { error: errorJual } = await supabase.from('transaksi_penjualan').insert([
      { id_menu: item.id_menu, total_bayar: item.harga_jual }
    ]);

    if (errorJual) return alert("Gagal mencatat transaksi");

    // B. Potong Stok Cup Otomatis (Anti-Tipu)
    const { error: errorCup } = await supabase
      .from('inventory_cup')
      .update({ stok_sekarang: sisaCup - 1 })
      .eq('id_cup', item.id_cup);

    if (!errorCup) {
      setSisaCup(sisaCup - 1);
      alert("✅ Penjualan Berhasil! Stok cup terpotong.");
    }
  }

  if (loading) return <p>Memuat Data...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50' }}>Putra Collection Ceria</h2>
        <p style={{ color: '#7f8c8d' }}>Mode: Pegawai / Kasir</p>
      </header>

      {/* Kotak Monitoring Cup */}
      <div style={{ 
        background: sisaCup < 10 ? '#ffcccc' : '#d1f2eb', 
        padding: '15px', 
        borderRadius: '10px', 
        textAlign: 'center',
        marginBottom: '20px',
        fontWeight: 'bold'
      }}>
        Sisa Cup di Rak: <span style={{ fontSize: '24px' }}>{sisaCup}</span> pcs
        {sisaCup < 10 && <p style={{ color: 'red', fontSize: '12px' }}>⚠️ Stok menipis!</p>}
      </div>

      {/* Daftar Menu Tombol */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {menu.length > 0 ? menu.map((item) => (
          <button
            key={item.id_menu}
            onClick={() => handleJual(item)}
            style={{
              padding: '20px 10px',
              fontSize: '16px',
              borderRadius: '12px',
              border: '1px solid #bdc3c7',
              background: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <strong>{item.nama_item}</strong><br/>
            <span style={{ color: '#27ae60' }}>Rp {item.harga_jual.toLocaleString()}</span>
          </button>
        )) : <p>Belum ada menu. CEO harus input menu dulu.</p>}
      </div>

      <button 
        onClick={() => window.location.href = '/'}
        style={{ marginTop: '30px', width: '100%', padding: '10px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: '5px' }}
      >
        Keluar / Logout
      </button>
    </div>
  );
}