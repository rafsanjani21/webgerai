"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Komponen Utama yang membaca Search Params
function ComingSoonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mengambil nama fitur dari URL, contoh: /coming-soon?feature=Gerai Niaga
  const featureName = searchParams.get("feature") || "Fitur Ini";

  return (
    <div className="w-full max-w-[420px] bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
      
      {/* HEADER BAR */}
      <div className="bg-[#4461AD] px-4 py-4 flex items-center gap-4 text-white sticky top-0 z-50">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-lg tracking-wide">Kembali</h1>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center -mt-12">
        {/* Animasi Ornamen Gembok / Konstruksi */}
        <div className="w-36 h-36 bg-blue-50 rounded-full flex items-center justify-center mb-6 border-[6px] border-white shadow-lg relative">
          <div className="absolute inset-0 bg-[#FFC516] rounded-full animate-ping opacity-15"></div>
          <span className="text-5xl relative z-10">🚧</span>
        </div>

        {/* Label Tag Koperasi Gerai */}
        <span className="text-[10px] bg-[#4461AD]/10 text-[#4461AD] px-3 py-1 rounded-full font-black tracking-widest uppercase mb-3">
          KOPERASI GERAI
        </span>

        {/* Judul Dinamis */}
        <h2 className="text-2xl font-black text-[#4461AD] tracking-tight mb-2">
          {featureName} <br />
          <span className="text-[#FFC516]">Segera Hadir!</span>
        </h2>
        
        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10 max-w-[290px]">
          Kami sedang mempersiapkan layanan terbaik untuk Anda. Nantikan pembaruan fitur ini dalam waktu dekat.
        </p>

        {/* Tombol Kembali ke Dashboard */}
        <button 
          onClick={() => router.push("/")}
          className="w-full max-w-[280px] bg-[#FFC516] hover:bg-yellow-400 text-[#4461AD] py-4 rounded-2xl font-black tracking-wide transition-all hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          KEMBALI KE BERANDA
        </button>
      </div>

      {/* WAVE DEKORASI BAWAH */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-15">
        <svg viewBox="0 0 1440 320" className="w-full h-auto text-[#4461AD] fill-current">
          <path d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,224,1152,197.3C1248,171,1344,160,1392,154.7L1440,149L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

    </div>
  );
}

// Wrapper utama dengan Suspense fallback untuk mencegah build error di Next.js
export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <Suspense 
        fallback={
          <div className="w-full max-w-[420px] bg-white min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#4461AD] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <ComingSoonContent />
      </Suspense>
    </div>
  );
}