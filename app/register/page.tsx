"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";

export default function Register() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [userGoogle, setUserGoogle] = useState<{
    nama: string;
    email: string;
  } | null>(null);

  // State baru untuk checkbox Syarat & Ketentuan
  const [agreeTerm, setAgreeTerm] = useState(false);

  // Fungsi Login Google (Diubah ke Mode Simulasi / Mock untuk Development)
  const handleGoogleRegister = async () => {
    // try {
    //   const result = await signInWithPopup(auth, googleProvider);
    //   setUserGoogle({
    //     nama: result.user.displayName || "",
    //     email: result.user.email || "",
    //   });
    // } catch (error) {
    //   console.error("Gagal menghubungkan Google:", error);
    // }

    // SIMULASI PENGISIAN OTOMATIS:
    setUserGoogle({
      nama: "Budi Santoso (Simulasi)",
      email: "budi.santoso.dev@gmail.com",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerm) return; // Mencegah submit jika belum disetujui (lapis keamanan ganda)
    setIsSubmitted(true);
  };

  // Desain Input Form yang lebih modern (Tegas & Rapi)
  const inputClass =
    "w-full px-4 py-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 font-semibold text-sm placeholder:text-slate-400";
  const labelClass =
    "block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest";

  // --- HALAMAN SUKSES ---
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200">
        <div className="bg-white p-12 rounded-2xl w-full max-w-md text-center border border-slate-200 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-lg shadow-green-500/20">
            ✓
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            Pendaftaran Berhasil
          </h2>
          <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">
            Data diri dan bukti pembayaran Anda telah kami terima dan sedang
            dalam proses verifikasi tim kami.
          </p>
          <Link
            href="/login"
            className="block w-full bg-slate-900 text-white px-6 py-4 rounded-xl hover:bg-slate-800 transition-colors font-bold tracking-wide text-sm"
          >
            KEMBALI KE HALAMAN LOGIN
          </Link>
        </div>
      </div>
    );
  }

  // --- HALAMAN FORM ---
  return (
    <div className="min-h-screen py-12 flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200">
      <div className="bg-white p-8 md:p-12 rounded-2xl w-full max-w-3xl border border-slate-200">
        {/* Header Form */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/gerai.png"
              alt="Logo GERAI"
              width={80}
              height={80}
              className="object-contain h-full w-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Daftar Akun
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Lengkapi 3 langkah di bawah ini untuk bergabung
          </p>
        </div>

        {/* Progress Stepper yang Lebih Elegan */}
        <div className="flex items-center justify-between mb-12 relative max-w-xl mx-auto">
          {/* Garis Background */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0 rounded-full"></div>
          {/* Garis Progress */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-500 ease-out rounded-full"
            style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
          ></div>

          {[1, 2, 3].map((item) => {
            const isActive = step === item;
            const isCompleted = step > item;
            return (
              <div
                key={item}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 border-4 bg-white ${
                    isActive
                      ? "border-blue-600 text-blue-600 scale-110"
                      : isCompleted
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? "✓" : item}
                </div>
                <span
                  className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${isActive || isCompleted ? "text-slate-800" : "text-slate-400"}`}
                >
                  {item === 1
                    ? "Data Diri"
                    : item === 2
                      ? "Dokumen"
                      : "Pembayaran"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Jarak tambahan untuk label stepper di bawah mobile */}
        <div className="h-4"></div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          {/* ================= LANGKAH 1: DATA DIRI ================= */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 sm:space-y-6 pb-8 sm:pb-0">
              {!userGoogle ? (
                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-6 sm:p-10 text-center">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1.5 sm:mb-2">
                    Mulai Pendaftaran
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 font-medium px-2 sm:px-0">
                    Hubungkan akun Google Anda untuk mempermudah pendaftaran dan
                    login ke depannya.
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    // Teks sekarang akan muat (text-[11px] di mobile) dan tidak keluar box
                    className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 sm:gap-3 bg-white border-2 border-slate-200 text-slate-700 px-4 sm:px-8 py-3.5 sm:py-4 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all font-bold tracking-wide text-[11px] sm:text-sm"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>HUBUNGKAN DENGAN GOOGLE</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-bold flex items-start sm:items-center gap-2.5 sm:gap-3">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5 sm:mt-0">
                      ✓
                    </span>
                    <span className="leading-snug">
                      Akun Google berhasil terhubung. Lengkapi data di bawah
                      ini.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-5">
                    <div>
                      <label className={labelClass}>
                        Nama Lengkap (Sesuai KTP)
                      </label>
                      <input
                        type="text"
                        defaultValue={userGoogle.nama}
                        className={inputClass} // Menggunakan class standar tanpa modifikasi warna abu-abu
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email Aktif</label>
                      <input
                        type="email"
                        defaultValue={userGoogle.email}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>No. WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>NIK KTP</label>
                      <input
                        type="text"
                        placeholder="16 Digit NIK"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Jenis Keanggotaan</label>
                      <select className={inputClass} required defaultValue="">
                        <option value="" disabled>
                          Pilih jenis anggota...
                        </option>
                        <option value="perorangan">Perorangan</option>
                        <option value="pemasok">Pemasok / Usaha</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Rekening</label>
                      <input
                        type="text"
                        placeholder="Nomor rekening pencairan"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Alamat Lengkap (Sesuai KTP)
                      </label>
                      <textarea
                        placeholder="Masukkan alamat lengkap..."
                        className={inputClass}
                        rows={3}
                        required
                      ></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        No. WhatsApp Referral (Opsional)
                      </label>
                      <input
                        type="tel"
                        placeholder="Kosongkan jika tidak ada"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4 mt-auto">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full bg-blue-600 text-white py-3.5 sm:py-4 rounded-xl hover:bg-blue-700 font-bold tracking-wide transition-colors text-xs sm:text-sm shadow-md"
                    >
                      SIMPAN & LANJUTKAN
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= LANGKAH 2: DOKUMEN ================= */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Foto Diri */}
                <div>
                  <label className={labelClass}>Foto Diri (Selfie)</label>
                  <div className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative h-48 flex flex-col justify-center items-center">
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                    />
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl mb-3 group-hover:scale-110 transition-transform">
                      📷
                    </div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
                      Ambil Foto Selfie
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Wajah harus terlihat jelas
                    </p>
                  </div>
                </div>

                {/* Upload KTP */}
                <div>
                  <label className={labelClass}>Foto KTP Fisik</label>
                  <div className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative h-48 flex flex-col justify-center items-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                    />
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl mb-3 group-hover:scale-110 transition-transform">
                      🪪
                    </div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
                      Upload Foto KTP
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Maksimal file 5MB (JPG/PNG)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-white border border-slate-200 text-slate-600 py-4 rounded-xl hover:bg-slate-50 font-bold tracking-wide transition-colors text-sm"
                >
                  KEMBALI
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold tracking-wide transition-colors text-sm"
                >
                  LANJUTKAN
                </button>
              </div>
            </div>
          )}

          {/* ================= LANGKAH 3: PEMBAYARAN ================= */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* Kotak Rincian Tagihan Bergaya Dark Mode Premium */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-blue-400/10 rounded-full blur-xl"></div>

                <div className="relative z-10">
                  <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1 sm:mb-2">
                    Total Pembayaran
                  </p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 sm:mb-8 tracking-tighter text-white">
                    Rp 1.000.000
                  </p>

                  {/* Penyesuaian Flexbox agar text tidak keluar batas di HP */}
                  <div className="bg-slate-800/80 rounded-xl p-4 sm:p-5 border border-slate-700 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="text-center md:text-left w-full md:w-auto">
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        Transfer ke Rek. MANDIRI
                      </p>
                      <p className="text-lg sm:text-xl font-mono font-bold tracking-widest text-blue-400">
                        60014263861
                      </p>
                    </div>
                    {/* Pembatas garis di mobile */}
                    <div className="w-full h-px bg-slate-700 block md:hidden opacity-50"></div>
                    <div className="text-center md:text-right w-full md:w-auto">
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        Atas Nama
                      </p>
                      {/* Dibuat break-words dan leading-snug agar nama yang panjang membungkus rapi */}
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white leading-snug break-words max-w-[250px] mx-auto md:mx-0">
                        KOPERASI KONSUMEN GERAKAN EKONOMI RAKYAT INDONESIA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Bukti */}
              <div>
                <label className={labelClass}>Upload Bukti Transfer</label>
                <div className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative flex flex-col items-center">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl mb-3 group-hover:scale-110 transition-transform">
                    🧾
                  </div>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
                    Pilih Struk atau Screenshot
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pastikan nominal dan nomor rekening tujuan terlihat jelas
                  </p>
                </div>
              </div>

              {/* TNC CHECKBOX DITAMBAHKAN DI SINI */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mt-2">
                <input 
                  id="tnc" 
                  type="checkbox" 
                  checked={agreeTerm}
                  onChange={(e) => setAgreeTerm(e.target.checked)}
                  required
                  className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 accent-blue-600 cursor-pointer shrink-0" 
                />
                <label htmlFor="tnc" className="text-[10px] sm:text-xs text-slate-600 font-medium leading-relaxed cursor-pointer select-none">
                  Saya menyatakan bahwa data yang saya masukkan adalah benar, dan saya menyetujui <span className="text-blue-600 font-bold hover:underline">Syarat & Ketentuan</span> serta Kebijakan Privasi yang berlaku di Koperasi Konsumen GERAI.
                </label>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-2 pb-6 sm:pb-0">
                <button type="button" onClick={() => setStep(2)} className="w-1/3 bg-white border border-slate-200 text-slate-600 py-3.5 sm:py-4 rounded-xl hover:bg-slate-50 font-bold tracking-wide transition-colors text-xs sm:text-sm">
                  KEMBALI
                </button>
                <button 
                  type="submit" 
                  disabled={!agreeTerm}
                  // Gaya tombol berubah jika belum dicentang
                  className={`w-2/3 py-3.5 sm:py-4 rounded-xl font-bold tracking-wide transition-all duration-300 text-xs sm:text-sm ${
                    agreeTerm 
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  KIRIM PENDAFTARAN
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
