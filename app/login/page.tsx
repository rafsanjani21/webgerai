"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";

// ==========================================
// 1. KOMPONEN MODAL ERROR PINTAR
// ==========================================
interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  buttonText?: string;
  onClose: () => void;
  onAction?: () => void;
}

const ErrorModal = ({ isOpen, message, buttonText = "TUTUP", onClose, onAction }: ErrorModalProps) => {
  if (!isOpen) return null;

  const handleButtonClick = () => {
    if (onAction) {
      onAction(); // Eksekusi pindah halaman (browser akan langsung memproses ini)
    }
    onClose(); // Tutup modal
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl shadow-blue-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Pemberitahuan</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
          <button 
            onClick={handleButtonClick} 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] text-sm"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. KOMPONEN UTAMA LOGIN
// ==========================================
export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk Modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    message: string;
    buttonText: string;
    action?: () => void;
  }>({ isOpen: false, message: "", buttonText: "TUTUP" });

  const showModal = (message: string, buttonText: string = "TUTUP", action?: () => void) => {
    setModalConfig({ isOpen: true, message, buttonText, action });
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return; 
    setIsLoading(true);

    try {
      // 1. Eksekusi Firebase & Ambil Token
      const result = await signInWithPopup(auth, googleProvider);
      const tokenId = await result.user.getIdToken();

      // 2. Payload ke Backend
      const payload = JSON.stringify({ token_id: tokenId });

      // 3. Fetch API Backend
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "") + "/"; 
      const endpoint = `${baseUrl}auth/v1/login`; 

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,     
      });

      // 4. Ekstrak Data
      const responseText = await response.text();
      let data: any = {};
      try { data = JSON.parse(responseText); } catch (e) {}

      // MENGAMBIL DATA DARI OBJECT "user"
      const errorMsg = (data?.message || "").toLowerCase();
      const userObj = data?.data?.user || data?.user;
      
      const userStatus = userObj?.status;
      const rejectReason = userObj?.reject_reason;

      if (response.ok) {
        if (userStatus === "pending") {
          await auth.signOut();
          showModal("Akun Anda sedang dalam proses verifikasi oleh Admin. Harap bersabar menunggu persetujuan.", "SAYA MENGERTI");
          return;
        }

        if (userStatus === "reject") {
          await auth.signOut();
          const rejectMsg = rejectReason 
            ? `Pendaftaran ditolak: "${rejectReason}". Silakan perbarui data pendaftaran Anda.` 
            : "Pendaftaran Anda sebelumnya ditolak oleh Admin. Silakan perbarui data Anda.";
            
          // PERBAIKAN: Gunakan window.location.href agar PASTI pindah halaman
          showModal(rejectMsg, "PERBARUI DATA", () => {
            window.location.href = "/edit-profile";
          });
          return;
        }

        // --- LOGIN SUKSES & STATUS ACTIVE ---
        const token = data?.data?.access_token || data?.access_token;
        const refreshToken = data?.data?.refresh_token || data?.refresh_token;
        
        if (token) {
          localStorage.setItem("access_token", token);
          if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
          document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Strict`;
        }
        window.location.href = "/";
        
      } else {
        // --- JIKA LOGIN GAGAL / DITOLAK BACKEND ---
        await auth.signOut();

        // KASUS 1: Belum Terdaftar (Arahkan ke Register)
        if (response.status === 404 || errorMsg.includes("not found")) {
          showModal(
            "Akun Google ini belum terdaftar. Silakan isi form pendaftaran terlebih dahulu.", 
            "DAFTAR SEKARANG", 
            () => { window.location.href = "/register"; }
          );
          return;
        }

        // KASUS 2: Pendaftaran Ditolak / Reject / Belum Aktif (Arahkan ke Edit Profile)
        if (
          userStatus === "reject" || 
          errorMsg.includes("reject") || 
          errorMsg.includes("tolak") || 
          errorMsg.includes("user not active") 
        ) {
          const rejectMsg = rejectReason 
            ? `Pendaftaran ditolak: "${rejectReason}". Silakan perbarui data pendaftaran Anda.` 
            : "Akun Anda belum aktif atau perlu perbaikan data. Silakan perbarui pendaftaran Anda.";
          
          // PERBAIKAN UTAMA: window.location.href
          showModal(rejectMsg, "PERBARUI DATA", () => {
            window.location.href = "/edit-profile";
          });
          return;
        }

        // KASUS 3: Akun Pending / Menunggu Verifikasi
        if (userStatus === "pending" || errorMsg.includes("pending")) {
          showModal("Akun Anda telah terdaftar namun masih menunggu verifikasi dari Admin. Harap bersabar.", "SAYA MENGERTI");
          return;
        }

        // KASUS 4: Error lainnya
        showModal(data?.message || "Gagal masuk: Terjadi kesalahan pada server.", "TUTUP");
      }

    } catch (error: any) {
      console.error("Gagal login:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        showModal("Gagal terhubung ke Google. Pastikan koneksi internet Anda stabil.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 sm:p-4 font-sans selection:bg-blue-300">
      
      {/* PANGGIL MODAL ERROR DI SINI */}
      <ErrorModal 
        isOpen={modalConfig.isOpen} 
        message={modalConfig.message} 
        buttonText={modalConfig.buttonText}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
        onAction={modalConfig.action}
      />

      <div className="bg-white p-8 sm:p-12 sm:rounded-2xl w-full min-h-screen sm:min-h-0 flex flex-col justify-center max-w-md border-0 sm:border border-slate-200 shadow-sm">
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Image 
              src="/gerai.png" 
              alt="Logo GERAI" 
              width={368} 
              height={368} 
              className="object-contain h-60 w-auto drop-shadow-sm"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Masuk ke GERAI</h1>
          <p className="text-slate-500 mt-2 text-xs sm:text-sm font-medium">Gunakan akun Google Anda untuk melanjutkan</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 sm:gap-3 border-2 px-4 py-3.5 sm:py-4 rounded-xl font-bold tracking-wide text-[11px] sm:text-sm mt-4 transition-all ${
            isLoading 
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-wait" 
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-400 active:scale-[0.98]"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>MEMVERIFIKASI...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>LANJUTKAN DENGAN GOOGLE</span>
            </>
          )}
        </button>

        <p className="text-center mt-10 text-xs sm:text-sm text-slate-500 font-medium">
          Belum bergabung dengan kami?{' '}
          <Link href="/register" className="text-blue-700 font-bold hover:text-blue-900 transition-colors">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}