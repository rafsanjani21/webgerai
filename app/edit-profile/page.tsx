"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";
import { fetchWithAuth } from "../lib/apiClient"; // <-- KITA IMPORT INI
import TncModal from "../components/TncModal";

// ================= FUNGSI UTILITY =================
const base64ToBlob = (base64Data: string, contentType = "image/jpeg"): Blob => {
  const byteCharacters = atob(base64Data.split(",")[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
};

// ================= KOMPONEN MODAL ERROR =================
const ErrorModal = ({ 
  isOpen, message, buttonText = "TUTUP & PERBAIKI", onClose 
}: { 
  isOpen: boolean, message: string, buttonText?: string, onClose: () => void 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl shadow-red-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Pemberitahuan</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
          <button onClick={onClose} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] text-sm">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= KOMPONEN UTAMA =================
export default function EditProfile() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState({ isOpen: false, message: "" });

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  
  const [formData, setFormData] = useState({
    phone_number: "", nik: "", member_type: "", address: "", bank_name: "", bank_account_number: "",
  });

  const [agreeTerm, setAgreeTerm] = useState(false);
  const [isTncModalOpen, setIsTncModalOpen] = useState(false);

  const [selfieImg, setSelfieImg] = useState<string | null>(null);
  const [ktpImg, setKtpImg] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<"selfie" | "ktp" | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { return () => stopCamera(); }, [step]);

  // --- GOOGLE LOGIN & AMBIL DATA LAMA (AUTO-PREFILL) ---
  const handleGoogleConnect = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const tokenId = await user.getIdToken();
      
      setNama(user.displayName || "");
      setEmail(user.email || "");

      // 1. Tembak API Login untuk dapatkan access_token
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") + "/";
      const loginRes = await fetch(`${baseUrl}auth/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_id: tokenId })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const token = loginData?.data?.access_token || loginData?.access_token;
        
        if (token) {
          // Simpan token sementara agar fetchWithAuth bisa jalan
          localStorage.setItem("access_token", token);
          
          // 2. Tembak API "/me" untuk mengambil data profil lama
          try {
            const meRes = await fetchWithAuth("user/v1/me", { method: "GET" });
            if (meRes.ok) {
              const meData = await meRes.json();
              
              // PERBAIKAN: Tangkap object "profile" yang ada di dalam "data"
              const userData = meData?.data || {};
              const userProfile = userData.profile || {};
              
              // 3. Masukkan data lama ke form dengan membaca dari userProfile
              setNama(userProfile.full_name || user.displayName || "");
              setFormData({
                phone_number: userProfile.phone_number || "",
                nik: userProfile.nik || "",
                member_type: userProfile.member_type || "",
                address: userProfile.address || "",
                bank_name: userProfile.bank_name || "",
                bank_account_number: userProfile.bank_account_number || "",
              });
            }
          } catch (e) {
            console.warn("Gagal auto-prefill data lama", e);
          }
        }
      } else {
        // Jika login gagal (404), berarti dia belum pernah daftar.
        setErrorData({ isOpen: true, message: "Akun ini belum pernah terdaftar. Silakan gunakan menu 'Daftar Akun' untuk pengguna baru." });
        await auth.signOut();
        return;
      }

      setIsGoogleConnected(true);

    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrorData({ isOpen: true, message: "Gagal menghubungkan akun Google. Silakan coba lagi." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep1 = () => {
    if (!isGoogleConnected) return setErrorData({ isOpen: true, message: "Silakan hubungkan akun Google Anda terlebih dahulu." });
    if (!nama.trim() || !email.trim() || !formData.phone_number.trim() || !formData.nik.trim() || !formData.member_type || !formData.bank_name.trim() || !formData.bank_account_number.trim() || !formData.address.trim()) {
      return setErrorData({ isOpen: true, message: "Mohon lengkapi semua kolom Data Diri sebelum melanjutkan." });
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!selfieImg || !ktpImg) return setErrorData({ isOpen: true, message: "Mohon ambil Foto Selfie dan Foto KTP Fisik terlebih dahulu." });
    setStep(3);
  };

  // --- SUBMIT API UPDATE KE GOLANG (PATCH /update-user) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerm || !paymentFile) return setErrorData({ isOpen: true, message: "Pastikan Anda sudah menyertakan Bukti Pembayaran dan menyetujui Syarat & Ketentuan." });

    setIsLoading(true);
    try {
      const formDataPayload = new FormData();
      
      // Golang Backend: field ini sesuaikan dengan struct update Golang Anda
      formDataPayload.append("full_name", nama);
      formDataPayload.append("phone_number", formData.phone_number);
      formDataPayload.append("nik", formData.nik);
      formDataPayload.append("member_type", formData.member_type);
      formDataPayload.append("address", formData.address);
      formDataPayload.append("bank_name", formData.bank_name);
      formDataPayload.append("bank_account_number", formData.bank_account_number);
      
      if (ktpImg && selfieImg) {
        formDataPayload.append("photo_ktp_url", base64ToBlob(ktpImg), "ktp.jpg");
        formDataPayload.append("photo_selfie_url", base64ToBlob(selfieImg), "selfie.jpg");
      }
      formDataPayload.append("payment_proof_url", paymentFile);

      // MENGGUNAKAN fetchWithAuth & METHOD PATCH MENGARAH KE "/update-user"
      const response = await fetchWithAuth("user/v1/update-user", {
        method: "PATCH",
        body: formDataPayload,
        // Catatan: Tidak perlu menambah "Content-Type" manual karena FormData akan mengaturnya sendiri.
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorText = await response.text();
        let friendlyMessage = "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.";
        try {
          const errJson = JSON.parse(errorText);
          friendlyMessage = errJson.message || friendlyMessage;
        } catch (e) {}
        setErrorData({ isOpen: true, message: friendlyMessage });
      }
    } catch (error) {
      setErrorData({ isOpen: true, message: "Gagal terhubung ke server. Pastikan koneksi internet Anda stabil." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA KAMERA ---
  const startCamera = async (type: "selfie" | "ktp") => {
    setActiveCamera(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: type === "selfie" ? "user" : "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (error) {
      setErrorData({ isOpen: true, message: "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser." });
      setActiveCamera(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((track) => track.stop()); streamRef.current = null; }
    setActiveCamera(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      // 1. Ambil rasio tampilan CSS untuk kebutuhan pemotongan (cropping)
      const containerWidth = video.clientWidth;
      const containerHeight = video.clientHeight;
      const containerRatio = containerWidth / containerHeight;

      // 2. Gunakan resolusi ASLI kamera agar hasil jepretan HD / Tidak Buram
      const nativeWidth = video.videoWidth;
      const nativeHeight = video.videoHeight;
      const videoRatio = nativeWidth / nativeHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = nativeWidth;
      let sourceHeight = nativeHeight;

      // 3. Logika pemotongan (Cropping) pada resolusi asli
      if (videoRatio > containerRatio) {
        sourceWidth = nativeHeight * containerRatio;
        sourceX = (nativeWidth - sourceWidth) / 2;
      } else {
        sourceHeight = nativeWidth / containerRatio;
        sourceY = (nativeHeight - sourceHeight) / 2;
      }

      // 4. Set ukuran kanvas ke resolusi potongan HD
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      // 5. Efek cermin khusus selfie
      if (activeCamera === "selfie") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // 6. Gambar ke kanvas dengan ukuran penuh
      ctx.drawImage(
        video, 
        sourceX, sourceY, sourceWidth, sourceHeight, // Area asli video yang diambil
        0, 0, canvas.width, canvas.height            // Area kanvas tempat menggambar
      );
      
      // 7. Simpan dengan kualitas 90% untuk keseimbangan HD & ukuran file
      const imageUrl = canvas.toDataURL("image/jpeg", 0.90);
      
      if (activeCamera === "selfie") {
        setSelfieImg(imageUrl);
      } else {
        setKtpImg(imageUrl);
      }
      stopCamera();
    }
  };

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopyStatus("Tersalin!"); setTimeout(() => setCopyStatus(null), 2000); });
  };

  const inputClass = "w-full px-4 py-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 font-semibold text-sm placeholder:text-slate-400 shadow-sm";
  const labelClass = "block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest";

  // ================= TAMPILAN HALAMAN SUKSES =================
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-12 rounded-2xl w-full max-w-md text-center border border-slate-200 animate-in zoom-in-95 duration-500 shadow-xl">
          <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-lg">✓</div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Perbaikan Berhasil</h2>
          <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">Data Anda telah diperbarui dan dikirim kembali untuk diverifikasi oleh tim kami.</p>
          <Link href="/login" className="block w-full bg-blue-700 text-white px-6 py-4 rounded-xl hover:bg-blue-800 transition-colors font-bold text-sm">
            KEMBALI KE HALAMAN LOGIN
          </Link>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN HALAMAN FORM =================
  return (
    <div className="min-h-screen py-12 flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <ErrorModal isOpen={errorData.isOpen} message={errorData.message} onClose={() => setErrorData({ isOpen: false, message: "" })} />
      <TncModal isOpen={isTncModalOpen} onClose={() => setIsTncModalOpen(false)} onAgree={() => { setAgreeTerm(true); setIsTncModalOpen(false); }} />

      <div className="bg-white p-6 sm:p-12 rounded-3xl w-full max-w-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative z-10">
        
        {/* Header Form EDIT */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image src="/gerai.png" alt="Logo GERAI" width={368} height={368} className="object-contain h-48 w-auto drop-shadow-sm" priority />
          </div>
          <h1 className="text-3xl font-black text-red-600 tracking-tight">Perbarui Data Anda</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Pendaftaran Anda sebelumnya ditolak. Silakan perbaiki data di bawah ini.</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 relative max-w-xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 z-0 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 z-0 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}></div>
          {[1, 2, 3].map((item) => {
            const isActive = step === item; const isCompleted = step > item;
            return (
              <div key={item} className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 border-4 bg-white ${isActive ? "border-blue-600 text-blue-600 scale-110 shadow-lg" : isCompleted ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 text-slate-400"}`}>
                  {isCompleted ? "✓" : item}
                </div>
                <span className={` mt-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive || isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                  {item === 1 ? "Data Diri" : item === 2 ? "Dokumen" : "Pembayaran"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-6"></div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          
          {/* ================= LANGKAH 1 ================= */}
          {step === 1 && (
            <div className="animate-in fade-in space-y-6">
              {!isGoogleConnected ? (
                <div className="bg-gray-50 border border-red-200 rounded-3xl p-6 sm:p-10 text-center">
                  <h3 className="text-base sm:text-lg font-black text-red-800 mb-2">Pendaftaran Ditolak</h3>
                  <p className="text-sm text-red-600 mb-8 font-medium">Hubungkan kembali akun Google Anda yang tertolak untuk mulai memperbarui data pendaftaran.</p>
                  <button type="button" onClick={handleGoogleConnect} disabled={isLoading} className="w-full sm:w-auto mx-auto flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all font-bold text-sm shadow-sm">
                    {isLoading ? "MENYINKRONKAN..." : "HUBUNGKAN DENGAN GOOGLE"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in zoom-in-95">
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
                    <span className="text-xl">✓</span> Akun tertaut. Silakan perbaiki data yang salah.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className={labelClass}>Nama Lengkap (Sesuai KTP) *</label><input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className={inputClass} required /></div>
                    <div><label className={labelClass}>Email Aktif *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required readOnly /></div>
                    <div><label className={labelClass}>No. WhatsApp *</label><input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className={inputClass} required /></div>
                    <div><label className={labelClass}>NIK KTP *</label><input type="text" name="nik" value={formData.nik} onChange={handleInputChange} className={inputClass} required /></div>
                    <div>
                      <label className={labelClass}>Jenis Keanggotaan *</label>
                      <select name="member_type" value={formData.member_type} onChange={handleInputChange} className={inputClass} required>
                        <option value="" disabled>Pilih jenis anggota...</option>
                        <option value="perorangan">Perorangan</option>
                        <option value="pemasok">Pemasok / Usaha</option>
                      </select>
                    </div>
                    <div><label className={labelClass}>Nama Bank Pencairan *</label><input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} className={inputClass} required /></div>
                    <div><label className={labelClass}>Nomor Rekening *</label><input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} className={inputClass} required /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Alamat Lengkap (Sesuai KTP) *</label><textarea name="address" value={formData.address} onChange={handleInputChange} className={inputClass} rows={3} required></textarea></div>
                    
                  </div>
                  <div className="pt-4 mt-auto"><button type="button" onClick={handleNextStep1} className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md">SIMPAN & LANJUTKAN</button></div>
                </div>
              )}
            </div>
          )}

          {/* ================= LANGKAH 2: DOKUMEN ================= */}
          {step === 2 && (
            <div className="animate-in fade-in space-y-8">
              {activeCamera ? (
                 <div className="bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-800 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <h3 className="text-white font-bold text-sm uppercase">{activeCamera === "selfie" ? "Foto Selfie" : "Foto KTP"}</h3>
                      <button type="button" onClick={stopCamera} className="text-white font-bold bg-slate-800 p-2 rounded-full">✕</button>
                    </div>
                    <video ref={videoRef} autoPlay playsInline className={`w-full object-cover bg-black rounded-2xl ${activeCamera === 'selfie' ? 'h-[400px] scale-x-[-1]' : 'aspect-[1.58/1]'}`} />
                    <div className="mt-8 flex gap-4"><button type="button" onClick={stopCamera} className="w-1/3 bg-slate-800 text-white py-3.5 rounded-xl font-bold">Batal</button><button type="button" onClick={capturePhoto} className="w-2/3 bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">📸 Ambil Foto</button></div>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Foto Diri (Selfie) Baru *</label>
                    {selfieImg ? (
                      <div className="relative group rounded-2xl overflow-hidden"><img src={selfieImg} className="w-full h-48 object-cover" /><button type="button" onClick={() => startCamera("selfie")} className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ambil Ulang</button></div>
                    ) : (
                      <div onClick={() => startCamera("selfie")} className="border-2 border-dashed border-slate-300 rounded-2xl h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 cursor-pointer font-bold text-sm text-slate-700">🤳 Buka Kamera Selfie</div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Foto KTP Baru *</label>
                    {ktpImg ? (
                      <div className="relative group rounded-2xl overflow-hidden"><img src={ktpImg} className="w-full aspect-[1.58/1] object-cover" /><button type="button" onClick={() => startCamera("ktp")} className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ambil Ulang</button></div>
                    ) : (
                      <div onClick={() => startCamera("ktp")} className="border-2 border-dashed border-slate-300 rounded-2xl h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 cursor-pointer font-bold text-sm text-slate-700">🪪 Buka Kamera Belakang</div>
                    )}
                  </div>
                </div>
              )}
              {!activeCamera && (
                <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold text-sm">KEMBALI</button>
                  <button type="button" onClick={handleNextStep2} className="w-2/3 bg-blue-600 text-white py-4 rounded-xl font-bold text-sm">LANJUTKAN</button>
                </div>
              )}
            </div>
          )}

          {/* ================= LANGKAH 3: PEMBAYARAN ================= */}
          {step === 3 && (
            <div className="animate-in fade-in space-y-8">
               <div className="bg-[#0B1121] p-6 sm:p-8 rounded-3xl text-center text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
                <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1">Total Pembayaran Simpanan</p>
                <p className="text-3xl sm:text-4xl font-black mb-6 text-white">Rp 1.000.000</p>
                <div className="bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Transfer ke Rek. MANDIRI</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-mono font-bold text-blue-400">60014263861</p>
                      <button type="button" onClick={() => copyToClipboard("60014263861")} className="bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">{copyStatus || "Salin"}</button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Atas Nama</p>
                    <p className="text-xs font-bold uppercase text-white max-w-[200px]">KOPERASI KONSUMEN GERAKAN EKONOMI RAKYAT INDONESIA</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Upload Bukti Transfer Baru *</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 cursor-pointer relative">
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setPaymentFile(e?.target?.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl mb-3 ${paymentFile ? 'bg-emerald-100' : 'bg-white'}`}>{paymentFile ? '✓' : '🧾'}</div>
                  <p className="text-sm font-bold text-slate-700">{paymentFile ? paymentFile.name : "Pilih Struk Baru"}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <input id="tnc" type="checkbox" checked={agreeTerm} onChange={(e) => setAgreeTerm(e.target.checked)} required className="w-5 h-5 rounded cursor-pointer" />
                <label htmlFor="tnc" className="text-xs text-slate-600 font-medium">Saya menyatakan bahwa data yang saya perbaiki adalah benar, dan menyetujui <button type="button" onClick={() => setIsTncModalOpen(true)} className="text-blue-600 font-bold underline">Syarat & Ketentuan</button>.</label>
              </div>

              <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100">
                <button type="button" onClick={() => setStep(2)} disabled={isLoading} className="w-1/3 bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold text-sm">KEMBALI</button>
                <button type="submit" disabled={isLoading} className={`w-2/3 py-4 rounded-xl font-bold text-sm text-white ${!isLoading ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "bg-slate-400 cursor-wait"}`}>
                  {isLoading ? "MEMPROSES DATA..." : "KIRIM PERBAIKAN"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}