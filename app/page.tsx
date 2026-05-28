"use client";

import { useState } from "react";

// FUNGSI UTILITY
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// KOMPONEN NAVBAR
const Navbar = ({ nama }: { nama: string }) => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <img 
          src="/gerai.png" 
          alt="Logo GERAI" 
          className="w-10 h-10  object-contain"
        />
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-wider">GERAI</h1>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">Anggota</p>
          <p className="text-xs sm:text-sm font-bold text-slate-700">{nama}</p>
        </div>
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors">
          Keluar
        </button>
      </div>
    </div>
  </nav>
);

// KOMPONEN UTAMA
export default function Home() {
  const [user] = useState({
    nama: "Budi Santoso",
    saldoUtama: 5000000,
    jumlahReferral: 3, 
    noWhatsapp: "081234567890"
  });

  // State untuk melacak apakah kode sudah disalin
  const [isCopied, setIsCopied] = useState(false);

  const bonusReferral = user.jumlahReferral * 100000;

  // Fungsi Copy ke Clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.noWhatsapp);
      setIsCopied(true);
      
      // Kembalikan tombol ke keadaan semula setelah 2 detik
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Gagal menyalin kode:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      <Navbar nama={user.nama} />

      <div className="bg-blue-600 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">Ringkasan Akun</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 sm:mt-2 font-medium leading-relaxed">
            Kelola saldo dan program kemitraan Anda di satu tempat.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          
          {/* --- KARTU SALDO --- */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition-colors shadow-sm lg:shadow-none">
            <div>
               <div className="flex items-center justify-between mb-6 sm:mb-8">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm sm:text-lg">💰</div>
                   <h3 className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-widest">Saldo Utama</h3>
                 </div>
               </div>
               
               <p className="text-3xl sm:text-4xl xl:text-5xl font-black text-slate-800 tracking-tighter mb-2 sm:mb-1 break-words">
                 {formatRupiah(user.saldoUtama)}
               </p>
               <p className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                 <span>↑</span> Aktif dan siap ditarik
               </p>
            </div>
            
            <div className="flex gap-2 sm:gap-3 mt-8 sm:mt-10">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3.5 rounded-xl font-bold transition-colors text-xs sm:text-sm">
                Tarik Dana
              </button>
              <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-3 sm:py-3.5 rounded-xl font-bold transition-colors border border-slate-200 text-xs sm:text-sm">
                Riwayat
              </button>
            </div>
          </div>

          {/* --- KARTU REFERRAL --- */}
          <div className="lg:col-span-3 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 text-white flex flex-col justify-between relative overflow-hidden shadow-sm lg:shadow-none">
            <div className="absolute -top-16 -right-16 w-32 sm:w-48 h-32 sm:h-48 bg-blue-600 rounded-full opacity-20"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-full flex items-center justify-center text-sm sm:text-lg">🤝</div>
                <h3 className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest">Program Referral</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-slate-800/50 p-4 sm:p-5 rounded-xl border border-slate-700/50">
                  <p className="text-slate-400 font-semibold text-xs sm:text-sm mb-1">Undangan Berhasil</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl sm:text-4xl font-black text-white">{user.jumlahReferral}</p>
                    <p className="text-slate-400 font-medium text-sm">Orang</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 sm:p-5 rounded-xl border border-slate-700/50">
                  <p className="text-slate-400 font-semibold text-xs sm:text-sm mb-1">Total Bonus Anda</p>
                  <p className="text-2xl sm:text-3xl font-black text-green-400 truncate">{formatRupiah(bonusReferral)}</p>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto">
              <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Bagikan Kode / No. WhatsApp Anda
              </label>
              
              <div className="bg-slate-800 p-1.5 sm:p-2 rounded-xl flex flex-col sm:flex-row items-center border border-slate-700 gap-2">
                 <input 
                    type="text" 
                    readOnly 
                    value={user.noWhatsapp} 
                    className="w-full bg-transparent border-none text-white font-mono font-bold text-base sm:text-lg px-3 py-2 sm:px-4 outline-none text-center sm:text-left selection:bg-blue-500/50"
                 />
                 
                 {/* Tombol dengan logika isCopied */}
                 <button 
                    onClick={handleCopyCode}
                    className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg transition-all duration-300 font-bold whitespace-nowrap text-xs sm:text-sm ${
                      isCopied 
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30" 
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                 >
                   {isCopied ? "Tersalin! ✓" : "Salin Kode"}
                 </button>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-400 font-medium leading-relaxed text-center sm:text-left">
                Dapatkan bonus <span className="text-white font-bold">Rp 100.000</span> untuk setiap pemasok atau perorangan yang bergabung.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}