"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";
import TncModal from "../components/TncModal";

// ================= FUNGSI UTILITY =================
const base64ToBlob = (base64Data: string, contentType = "image/jpeg"): Blob => {
  const byteCharacters = atob(base64Data.split(",")[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

// ================= KOMPONEN MODAL ERROR =================
const ErrorModal = ({ 
  isOpen, 
  message, 
  buttonText = "TUTUP & PERBAIKI", 
  onClose 
}: { 
  isOpen: boolean, 
  message: string, 
  buttonText?: string,
  onClose: () => void 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl shadow-rose-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Pemberitahuan</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
          <button 
            onClick={onClose} 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] text-sm"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= KOMPONEN UTAMA =================
export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State error diperbarui untuk menampung fungsi action dan button text dinamis
  const [errorData, setErrorData] = useState<{isOpen: boolean, message: string, buttonText?: string, action?: () => void}>({ 
    isOpen: false, 
    message: "" 
  });

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  
  const [formData, setFormData] = useState({
    phone_number: "",
    nik: "",
    member_type: "",
    address: "",
    bank_name: "",
    bank_account_number: "",
    referral_number: "",
    bank_account_name: "",
  });

  const [agreeTerm, setAgreeTerm] = useState(false);
  const [isTncModalOpen, setIsTncModalOpen] = useState(false);

  const [selfieImg, setSelfieImg] = useState<string | null>(null);
  const [ktpImg, setKtpImg] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<"selfie" | "ktp" | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, [step]);

  // --- GOOGLE LOGIN & CEK STATUS AKUN ---
  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Ambil token untuk dicek ke backend
      const tokenId = await user.getIdToken();
      setIsLoading(true); // Memunculkan efek loading saat menembak API

      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") + "/";
      const loginPayload = new FormData();
      loginPayload.append("token_id", tokenId);

      // Cek ke backend, apakah user ini bisa login?
      const loginRes = await fetch(`${baseUrl}auth/v1/login`, {
        method: "POST",
        body: loginPayload
      });

      if (loginRes.ok) {
        // JIKA BERHASIL LOGIN -> BERARTI AKUN SUDAH TERDAFTAR!
        await auth.signOut(); // Putuskan sesi register ini agar bersih
        setErrorData({ 
          isOpen: true, 
          message: "Akun Google Anda ternyata sudah terdaftar di sistem kami. Anda akan dialihkan ke halaman Login.",
          buttonText: "MENUJU HALAMAN LOGIN",
          action: () => router.push("/login") // Saat tombol ditekan, pindah ke halaman login
        });
        return; // Hentikan fungsi di sini, jangan lanjut ke form register
      }

      // JIKA BACKEND MENOLAK (404/401) -> BERARTI PENGGUNA BARU, LANJUTKAN FORM!
      setNama(user.displayName || "");
      setEmail(user.email || "");
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
    const { name, value } = e.target;
    let newValue = value;

    // Validasi khusus untuk input yang wajib angka saja
    if (["nik", "phone_number", "referral_number"].includes(name)) {
      newValue = newValue.replace(/\D/g, ""); // Hapus semua karakter non-angka
    }

    // Kunci panjang maksimal agar tidak bisa diketik lebih dari batas
    if (name === "nik" && newValue.length > 16) newValue = newValue.slice(0, 16);
    if ((name === "phone_number" || name === "referral_number") && newValue.length > 13) {
      newValue = newValue.slice(0, 13);
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  // --- VALIDASI LANGKAH 1 ---
  const handleNextStep1 = () => {
    if (!isGoogleConnected) {
      setErrorData({ isOpen: true, message: "Silakan hubungkan akun Google Anda terlebih dahulu." });
      return;
    }
    
    // Cek apakah ada field wajib yang kosong
    if (
      !nama.trim() || 
      !email.trim() || 
      !formData.phone_number.trim() || 
      !formData.nik.trim() || 
      !formData.member_type || 
      !formData.bank_name.trim() || 
      !formData.bank_account_number.trim() || 
      !formData.address.trim() ||
      !formData.bank_account_name.trim()
    ) {
      setErrorData({ isOpen: true, message: "Mohon lengkapi semua kolom Data Diri sebelum melanjutkan." });
      return;
    }

    // Validasi Digit Minimal
    if (formData.nik.length < 16) {
      setErrorData({ isOpen: true, message: "NIK KTP harus tepat 16 digit." });
      return;
    }
    if (formData.phone_number.length < 11) {
      setErrorData({ isOpen: true, message: "Nomor WhatsApp minimal 11 digit." });
      return;
    }
    if (formData.referral_number.length > 0 && formData.referral_number.length < 11) {
      setErrorData({ isOpen: true, message: "Nomor WhatsApp Referral minimal 11 digit jika Anda ingin mengisinya." });
      return;
    }

    setStep(2);
  };

  // --- VALIDASI LANGKAH 2 ---
  const handleNextStep2 = () => {
    if (!selfieImg || !ktpImg) {
      setErrorData({ isOpen: true, message: "Mohon ambil Foto Selfie dan Foto KTP Fisik terlebih dahulu." });
      return;
    }
    setStep(3);
  };

  // --- SUBMIT API BACKEND ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerm || !paymentFile) {
      setErrorData({ isOpen: true, message: "Pastikan Anda sudah menyertakan Bukti Pembayaran dan menyetujui Syarat & Ketentuan." });
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      const tokenId = currentUser ? await currentUser.getIdToken() : "dummy_token";

      const formDataPayload = new FormData();
      
      formDataPayload.append("token_id", tokenId);
      formDataPayload.append("full_name", nama);
      formDataPayload.append("phone_number", formData.phone_number);
      formDataPayload.append("nik", formData.nik);
      formDataPayload.append("member_type", formData.member_type);
      formDataPayload.append("address", formData.address);
      formDataPayload.append("bank_name", formData.bank_name);
      formDataPayload.append("bank_account_number", formData.bank_account_number);
      formDataPayload.append("bank_account_name", formData.bank_account_name);
      
      if (formData.referral_number) {
        formDataPayload.append("referral_number", formData.referral_number);
      }

      if (ktpImg && selfieImg) {
        formDataPayload.append("photo_ktp_url", base64ToBlob(ktpImg), "ktp.jpg");
        formDataPayload.append("photo_selfie_url", base64ToBlob(selfieImg), "selfie.jpg");
      }
      formDataPayload.append("payment_proof_url", paymentFile);

      // Pastikan BASE_URL aman menggunakan replace agar tidak ada double slash
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") + "/";
      const endpoint = `${baseUrl}auth/v1/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formDataPayload,
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorText = await response.text();
        console.error("Backend Error:", errorText);

        // Translasi Error
        let friendlyMessage = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.message === "email already exists") friendlyMessage = "Alamat email ini sudah terdaftar. Silakan login atau gunakan email lain.";
          else if (errJson.message === "nik already exists") friendlyMessage = "Nomor NIK KTP Anda sudah terdaftar di sistem kami.";
          else if (errJson.message === "phone_number already exists") friendlyMessage = "Nomor WhatsApp ini sudah digunakan oleh akun lain.";
          else friendlyMessage = errJson.message || friendlyMessage;
        } catch (e) {
          console.error(e);
        }

        setErrorData({ isOpen: true, message: friendlyMessage });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setErrorData({ isOpen: true, message: "Gagal terhubung ke server. Pastikan koneksi internet Anda stabil." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA KAMERA ---
  const startCamera = async (type: "selfie" | "ktp") => {
    setActiveCamera(type);
    try {
      const constraints = {
        video: { facingMode: type === "selfie" ? "user" : "environment" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (error) {
      console.error("Gagal mengakses kamera:", error);
      setErrorData({ isOpen: true, message: "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser." });
      setActiveCamera(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveCamera(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;

      const videoRatio = video.videoWidth / video.videoHeight;
      const containerRatio = canvas.width / canvas.height;

      let drawWidth, drawHeight, startX, startY;

      if (videoRatio > containerRatio) {
        drawHeight = canvas.height;
        drawWidth = video.videoWidth * (canvas.height / video.videoHeight);
        startX = (canvas.width - drawWidth) / 2;
        startY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = video.videoHeight * (canvas.width / video.videoWidth);
        startX = 0;
        startY = (canvas.height - drawHeight) / 2;
      }

      if (activeCamera === "selfie") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, startX, startY, drawWidth, drawHeight);
      
      const imageUrl = canvas.toDataURL("image/jpeg", 0.85);
      
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
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus("Tersalin!");
      setTimeout(() => setCopyStatus(null), 2000); 
    });
  };

  const inputClass = "w-full px-4 py-3.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 font-semibold text-sm placeholder:text-slate-400";
  const labelClass = "block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest";

  // ================= TAMPILAN HALAMAN SUKSES =================
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
            className="block w-full bg-blue-700 text-white px-6 py-4 rounded-xl hover:bg-blue-800 transition-colors font-bold tracking-wide text-sm"
          >
            KEMBALI KE HALAMAN LOGIN
          </Link>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN HALAMAN FORM =================
  return (
    <div className="min-h-screen py-12 flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200">
      
      {/* UPDATE: Props ErrorModal kini memanggil action jika ada */}
      <ErrorModal 
        isOpen={errorData.isOpen} 
        message={errorData.message} 
        buttonText={errorData.buttonText}
        onClose={() => {
          const action = errorData.action;
          setErrorData({ isOpen: false, message: "" });
          if (action) action(); // Eksekusi redirect jika action tersedia
        }} 
      />

      <TncModal 
        isOpen={isTncModalOpen} 
        onClose={() => setIsTncModalOpen(false)} 
        onAgree={() => {
          setAgreeTerm(true);
          setIsTncModalOpen(false);
        }} 
      />

      <div className="bg-white p-8 md:p-12 rounded-2xl w-full max-w-3xl border border-slate-200 shadow-sm">
        
        {/* Header Form */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image src="/gerai.png" alt="Logo GERAI" width={368} height={368} className="object-contain h-50 w-auto" priority />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daftar Akun</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Lengkapi 3 langkah di bawah ini untuk bergabung</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 relative max-w-xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-500 ease-out rounded-full"
            style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
          ></div>

          {[1, 2, 3].map((item) => {
            const isActive = step === item;
            const isCompleted = step > item;
            return (
              <div key={item} className="relative z-10 flex flex-col items-center">
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
                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${isActive || isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                  {item === 1 ? "Data Diri" : item === 2 ? "Dokumen" : "Pembayaran"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="h-4"></div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          
          {/* ================= LANGKAH 1: DATA DIRI ================= */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 sm:space-y-6 pb-8 sm:pb-0">
              {!isGoogleConnected ? (
                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-6 sm:p-10 text-center">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1.5 sm:mb-2">Mulai Pendaftaran</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 font-medium px-2 sm:px-0">
                    Hubungkan akun Google Anda untuk mempermudah pendaftaran dan login ke depannya.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                    className={`w-full sm:w-auto mx-auto flex items-center justify-center gap-2 sm:gap-3 border-2 px-4 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold tracking-wide text-[11px] sm:text-sm transition-all ${
                      isLoading 
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-wait" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-400"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        <span>MEMERIKSA AKUN...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>HUBUNGKAN DENGAN GOOGLE</span>
                      </>
                    )}
                  </button>

                  <p className="mt-8 text-xs sm:text-sm text-slate-500 font-medium">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors">
                      Login di sini
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-bold flex items-start sm:items-center gap-2.5 sm:gap-3">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5 sm:mt-0">✓</span>
                    <span className="leading-snug">
                      Akun Google berhasil terhubung. Lengkapi data di bawah ini.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-5">
                    <div>
                      <label className={labelClass}>Nama Lengkap (Sesuai KTP) *</label>
                      <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Email Aktif *</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required readOnly />
                    </div>
                    <div>
                      <label className={labelClass}>No. WhatsApp *</label>
                      <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="08xxxxxxxxxx" className={inputClass} required />
                      {/* Peringatan Real-time No HP */}
                      {formData.phone_number.length > 0 && formData.phone_number.length < 11 && (
                        <p className="text-xs text-red-500 mt-1.5 font-semibold animate-in fade-in">
                          Minimal 11 digit angka (Kurang {11 - formData.phone_number.length} digit)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>NIK KTP *</label>
                      <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} placeholder="16 Digit NIK" className={inputClass} required />
                      {/* Peringatan Real-time NIK */}
                      {formData.nik.length > 0 && formData.nik.length < 16 && (
                        <p className="text-xs text-red-500 mt-1.5 font-semibold animate-in fade-in">
                          Harus 16 digit (Kurang {16 - formData.nik.length} digit)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Jenis Keanggotaan *</label>
                      <select name="member_type" value={formData.member_type} onChange={handleInputChange} className={inputClass} required>
                        <option value="" disabled>Pilih jenis anggota...</option>
                        <option value="perorangan">Perorangan</option>
                        <option value="pemasok">Pemasok / Usaha</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Nama Bank Pencairan *</label>
                      <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} placeholder="Contoh: BCA, Mandiri" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Rekening *</label>
                      <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} placeholder="Nomor rekening" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Nama Pemilik Rekening *</label>
                      <input type="text" name="bank_account_name" value={formData.bank_account_name} onChange={handleInputChange} placeholder="Nama pemilik rekening" className={inputClass} required />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Alamat Lengkap (Sesuai KTP) *</label>
                      <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Masukkan alamat lengkap..." className={inputClass} rows={3} required></textarea>
                    </div>
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className={labelClass}>No. WhatsApp Referral *</label>
                      <input type="tel" name="referral_number" value={formData.referral_number} onChange={handleInputChange} placeholder="Masukkan No. WhatsApp Referral" className={`${inputClass} bg-white`} required />
                      {/* Peringatan Real-time Referral */}
                      {formData.referral_number.length > 0 && formData.referral_number.length < 11 && (
                        <p className="text-xs text-red-500 mt-2 font-semibold animate-in fade-in">
                          Minimal 11 digit angka (Kurang {11 - formData.referral_number.length} digit)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4 mt-auto">
                    <button
                      type="button"
                      onClick={handleNextStep1}
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
              {activeCamera ? (
                <div className="bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200 shadow-lg flex flex-col items-center p-4">
                  <div className="w-full flex justify-between items-center mb-4 px-2">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                      {activeCamera === "selfie" ? "Ambil Foto Selfie" : "Ambil Foto KTP"}
                    </h3>
                    <button type="button" onClick={stopCamera} className="text-slate-400 hover:text-white font-bold text-xl">✕</button>
                  </div>
                  
                  <div className="w-full bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className={`w-full object-cover bg-slate-800 ${
                        activeCamera === 'selfie' 
                          ? 'h-[400px] scale-x-[-1]' 
                          : 'aspect-[1.58/1]' 
                      }`} 
                    />
                    
                    {activeCamera === "ktp" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                        <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-xl bg-blue-500/10 flex flex-col items-center justify-center relative">
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                            Posisikan KTP di Dalam Kotak
                          </span>
                        </div>
                      </div>
                    )}

                    {activeCamera === "selfie" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                        <div className="w-48 h-64 border-2 border-dashed border-blue-400 rounded-[100px] bg-blue-500/10"></div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 mb-2 flex gap-4 w-full max-w-sm">
                    <button type="button" onClick={stopCamera} className="w-1/3 bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 font-bold text-sm transition-colors">
                      Batal
                    </button>
                    <button type="button" onClick={capturePhoto} className="w-2/3 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-500 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors">
                      <span className="text-lg">📸</span> Ambil Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Foto Diri (Selfie) *</label>
                    {selfieImg ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={selfieImg} alt="Selfie" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => startCamera("selfie")} className="bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-100 transition-colors">
                            Ambil Ulang
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => startCamera("selfie")} className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative h-48 flex flex-col justify-center items-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl mb-3 group-hover:scale-110 transition-transform">🤳</div>
                        <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Buka Kamera Selfie</p>
                        <p className="text-xs text-slate-400 mt-1">Wajah harus terlihat jelas</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Foto KTP Fisik *</label>
                    {ktpImg ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <img src={ktpImg} alt="KTP" className="w-full aspect-[1.58/1] object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => startCamera("ktp")} className="bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-100 transition-colors">
                            Ambil Ulang
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => startCamera("ktp")} className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative h-48 flex flex-col justify-center items-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl mb-3 group-hover:scale-110 transition-transform">🪪</div>
                        <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Buka Kamera Belakang</p>
                        <p className="text-xs text-slate-400 mt-1">Pastikan tulisan terbaca jelas</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!activeCamera && (
                <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-white border border-slate-200 text-slate-600 py-4 rounded-xl hover:bg-slate-50 font-bold tracking-wide transition-colors text-sm"
                  >
                    KEMBALI
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="w-2/3 bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold tracking-wide transition-colors text-sm shadow-md"
                  >
                    LANJUTKAN
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= LANGKAH 3: PEMBAYARAN ================= */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-blue-400/10 rounded-full blur-xl"></div>
                <div className="relative z-10">
                  <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1 sm:mb-2">Total Pembayaran</p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 sm:mb-8 tracking-tighter text-white">Rp 1.000.000</p>
                  <div className="bg-slate-800/80 rounded-xl p-4 sm:p-5 border border-slate-700 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="text-center md:text-left w-full md:w-auto">
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        Transfer ke Rek. MANDIRI
                      </p>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <p className="text-lg sm:text-xl font-mono font-bold tracking-widest text-blue-400">
                          60014263861
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("60014263861")}
                          className="bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-white"
                        >
                          {copyStatus ? copyStatus : "Salin"}
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-px bg-slate-700 block md:hidden opacity-50"></div>
                    <div className="text-center md:text-right w-full md:w-auto">
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Atas Nama</p>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white leading-snug break-words max-w-[250px] mx-auto md:mx-0">
                        KOPERASI KONSUMEN GERAKAN EKONOMI RAKYAT INDONESIA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Upload Bukti Transfer *</label>
                <div className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative flex flex-col items-center">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPaymentFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    required 
                  />
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl mb-3 group-hover:scale-110 transition-transform">🧾</div>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
                    {paymentFile ? paymentFile.name : "Pilih Struk atau Screenshot"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {paymentFile ? "File siap diunggah" : "Pastikan nominal dan nomor rekening tujuan terlihat jelas"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mt-2">
                <input 
                  id="tnc" 
                  type="checkbox" 
                  checked={agreeTerm}
                  onChange={(e) => setAgreeTerm(e.target.checked)}
                  required
                  className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 accent-blue-600 cursor-pointer shrink-0" 
                />
                <label htmlFor="tnc" className="text-[10px] sm:text-xs text-slate-600 font-medium leading-relaxed select-none">
                  Saya menyatakan bahwa data yang saya masukkan adalah benar, dan saya menyetujui {" "}
                  <button 
                    type="button" 
                    onClick={() => setIsTncModalOpen(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Syarat & Ketentuan
                  </button> 
                  {" "}serta Kebijakan Privasi.
                </label>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-4 mt-8 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  disabled={isLoading}
                  className="w-1/3 bg-white border border-slate-200 text-slate-600 py-3.5 sm:py-4 rounded-xl hover:bg-slate-50 font-bold tracking-wide transition-colors text-xs sm:text-sm"
                >
                  KEMBALI
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} // Form submit akan men-trigger handleSubmit yang sudah punya validasi
                  className={`w-2/3 py-3.5 sm:py-4 rounded-xl font-bold tracking-wide transition-all duration-300 text-xs sm:text-sm flex justify-center items-center gap-2 ${
                    !isLoading ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-slate-200 text-slate-400 cursor-wait"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      MENGIRIM...
                    </>
                  ) : (
                    "KIRIM PENDAFTARAN"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}