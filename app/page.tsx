"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "./lib/firebase"; 
import { fetchWithAuth } from "./lib/apiClient"; 

// ================= FUNGSI UTILITY =================
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// ================= KOMPONEN MODAL NOTIFIKASI =================
const NotificationModal = ({ 
  isOpen, 
  title, 
  message, 
  type, 
  onClose 
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  type: "success" | "error", 
  onClose: () => void 
}) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
            {isSuccess ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
          <button 
            onClick={onClose} 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold tracking-wide transition-colors text-sm"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= KOMPONEN MODAL KONFIRMASI =================
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  amount,
  isLoading,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  title: string;
  message: string;
  amount: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-yellow-100 text-yellow-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">{message}</p>
          
          <div className="bg-slate-50 w-full py-4 rounded-xl border border-slate-200 mb-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nominal Penarikan</p>
            <p className="text-2xl font-black text-slate-800">{formatRupiah(amount)}</p>
          </div>

          <div className="flex w-full gap-3">
            <button 
              onClick={onCancel}
              disabled={isLoading}
              className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold tracking-wide transition-colors text-sm disabled:opacity-50"
            >
              BATAL
            </button>
            <button 
              onClick={onConfirm} 
              disabled={isLoading}
              className="w-1/2 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold tracking-wide transition-colors text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "YA, TARIK"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= KOMPONEN NAVBAR =================
const Navbar = ({ 
  nama, 
  onLogout, 
  isLoading 
}: { 
  nama: string; 
  onLogout: () => void;
  isLoading: boolean;
}) => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-4xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center gap-3">
        <Image 
          src="/gerai.png" 
          alt="Logo GERAI" 
          width={368} 
          height={368} 
          className="object-contain h-16 w-auto"
          priority
        />
        <h1 className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight hidden sm:block">GERAI</h1>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Anggota</p>
          <p className="text-sm font-bold text-slate-800">{nama || "Loading..."}</p>
        </div>
        <button 
          onClick={onLogout}
          disabled={isLoading}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border ${
            isLoading 
              ? "bg-slate-50 border-slate-200 text-slate-400 cursor-wait" 
              : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Keluar...</span>
            </>
          ) : (
            <>
              <span>Keluar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  </nav>
);

// ================= KOMPONEN UTAMA =================
export default function Home() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // State untuk proses withdraw
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [notification, setNotification] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "success" as "success" | "error" 
  });

  const [user, setUser] = useState({
    nama: "",
    jumlahReferral: 0, 
    noWhatsapp: "",
    saldoTersedia: 0,
    totalDihasilkan: 0,
    referredUsers: [] as any[],
    withdrawalHistory: [] as any[]
  });

  const [isCopied, setIsCopied] = useState(false);

  // --- STATE UNTUK PAGINATION ---
  const [referredPage, setReferredPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetchWithAuth("user/v1/dashboard", { method: "GET" });
      if (response.ok) {
          const resData = await response.json();
          const data = resData.data;

          setUser({
              nama: data.full_name || "Anggota",
              jumlahReferral: data.total_referred_users || 0,
              noWhatsapp: data.phone_number || "",
              saldoTersedia: data.current_balance || 0,
              totalDihasilkan: data.total_earned_reward || 0,
              referredUsers: data.referred_users_list || [],
              withdrawalHistory: data.withdrawal_history_list || []
          });
      }
    } catch (error) {
      console.error("Error mengambil data dashboard:", error);
    }
  };

  useEffect(() => {
    setIsLoadingProfile(true);
    fetchDashboardData().finally(() => {
      setIsLoadingProfile(false);
    });
  }, [router]);

  // --- FUNGSI MUNCULKAN KONFIRMASI DULU ---
  const handleRequestWithdraw = () => {
    if (user.saldoTersedia <= 0) {
      setNotification({
        isOpen: true,
        title: "Penarikan Gagal",
        message: "Saldo Anda saat ini Rp 0. Kumpulkan bonus referral terlebih dahulu.",
        type: "error"
      });
      return;
    }
    // Buka modal konfirmasi jika saldo mencukupi
    setIsConfirmModalOpen(true);
  };

  // --- FUNGSI EKSEKUSI API PENARIKAN ---
  const handleConfirmWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const response = await fetchWithAuth("wallet/v1/withdraw", { method: "POST" });
      const resData = await response.json();

      setIsConfirmModalOpen(false); // Tutup modal konfirmasi

      if (response.ok) {
        setNotification({
          isOpen: true,
          title: "Penarikan Berhasil",
          message: resData.message, 
          type: "success"
        });
        
        // Reset ke halaman 1 agar log transaksi terbaru di atas langsung terlihat
        setWithdrawalPage(1);
        await fetchDashboardData();
      } else {
        setNotification({
          isOpen: true,
          title: "Penarikan Gagal",
          message: resData.message || "Terjadi kesalahan saat memproses penarikan.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error withdraw:", error);
      setIsConfirmModalOpen(false);
      setNotification({
        isOpen: true,
        title: "Koneksi Bermasalah",
        message: "Gagal terhubung ke server. Pastikan internet Anda stabil.",
        type: "error"
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      await fetchWithAuth("auth/v1/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      }).catch((err: any) => console.warn("Logout gagal:", err));
    } catch (error) {
      console.error("Gagal memproses logout:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await auth.signOut();
      router.push("/login");
      setIsLoggingOut(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.noWhatsapp);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin kode:", err);
    }
  };

  // --- LOGIKA PEMOTONGAN DATA (SLICING ARRAY) UNTUK PAGINATION ---
  const totalReferredPages = Math.ceil(user.referredUsers.length / ITEMS_PER_PAGE);
  const slicedReferredUsers = user.referredUsers.slice(
    (referredPage - 1) * ITEMS_PER_PAGE,
    referredPage * ITEMS_PER_PAGE
  );

  const totalWithdrawalPages = Math.ceil(user.withdrawalHistory.length / ITEMS_PER_PAGE);
  const slicedWithdrawalHistory = user.withdrawalHistory.slice(
    (withdrawalPage - 1) * ITEMS_PER_PAGE,
    withdrawalPage * ITEMS_PER_PAGE
  );

  if (isLoadingProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-yellow-400 rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-200 selection:text-blue-900">
      <Navbar nama={user.nama} onLogout={handleLogout} isLoading={isLoggingOut} />

      {/* --- MODAL NOTIFIKASI --- */}
      <NotificationModal 
        isOpen={notification.isOpen} 
        title={notification.title} 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ ...notification, isOpen: false })} 
      />

      {/* --- MODAL KONFIRMASI TARIK DANA --- */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Konfirmasi Penarikan"
        message="Apakah Anda yakin ingin menarik seluruh saldo aktif ke rekening Anda?"
        amount={user.saldoTersedia}
        isLoading={isWithdrawing}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

      <div className="bg-linear-to-br from-blue-700 to-blue-950 px-4 sm:px-6 pt-12 pb-32">
        <div className="max-w-4xl mx-auto text-center sm:text-left">
          <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight">Kemitraan <span className="text-yellow-400">GERAI</span></h2>
          <p className="text-blue-100 text-sm sm:text-base mt-3 font-medium leading-relaxed max-w-xl">
            Ajak teman dan kolega bergabung. Dapatkan bonus langsung untuk setiap pendaftaran yang berhasil diverifikasi.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 -mt-20 pb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 border border-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-800 font-black text-lg sm:text-xl tracking-tight">Status Referral</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Pencapaian undangan Anda saat ini</p>
              </div>
            </div>
            
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Penghasilan</p>
              <p className="text-slate-800 font-bold">{formatRupiah(user.totalDihasilkan)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-10">
            {/* Box Undangan */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-6">
                <p className="text-slate-500 font-bold text-xs sm:text-sm tracking-widest uppercase">Anggota Terundang</p>
                <span className="bg-white text-blue-600 p-2 rounded-lg border border-slate-200 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-5xl sm:text-6xl font-black text-slate-800 tracking-tighter">{user.jumlahReferral}</p>
                <p className="text-slate-500 font-bold text-base mb-1.5">Orang</p>
              </div>
            </div>

            {/* Box Bonus Aktif */}
            <div className="bg-linear-to-br from-blue-700 to-blue-950 p-6 sm:p-8 rounded-2xl border border-blue-800 flex flex-col justify-between">
              <div>
                <p className="text-blue-200 font-bold text-xs sm:text-sm tracking-widest uppercase mb-4">Total Saldo Aktif</p>
                <p className="text-3xl sm:text-4xl font-black text-yellow-400 truncate">
                  {formatRupiah(user.saldoTersedia)}
                </p>
              </div>
              
              <button 
                onClick={handleRequestWithdraw}
                disabled={isWithdrawing || user.saldoTersedia <= 0}
                className={`mt-8 w-full py-3.5 rounded-xl font-black text-sm transition-colors flex justify-center items-center gap-2 ${
                  isWithdrawing || user.saldoTersedia <= 0
                    ? "bg-blue-800 text-blue-400 cursor-not-allowed border border-blue-800"
                    : "bg-yellow-400 hover:bg-yellow-500 text-blue-900 border border-yellow-400"
                }`}
              >
                {isWithdrawing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Tarik Dana Sekarang"
                )}
              </button>
            </div>
          </div>
          
          {/* ================= BAGIKAN KODE ================= */}
          <div className="border-t border-slate-100 pt-8 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Bagikan Nomor WhatsApp Anda
              </label>
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-black tracking-wider border border-yellow-200">
                BONUS RP 100.000 / MEMBER
              </span>
            </div>
            
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-2xl flex flex-col sm:flex-row items-center border border-slate-200 focus-within:border-blue-400 transition-colors">
               <input 
                  type="text" 
                  readOnly 
                  value={user.noWhatsapp} 
                  className="w-full bg-transparent border-none text-slate-800 font-mono font-bold text-lg sm:text-xl px-4 py-3 outline-none text-center sm:text-left"
               />
               
               <button 
                  onClick={handleCopyCode}
                  className={`w-full sm:w-auto px-8 py-4 rounded-xl transition-colors font-bold whitespace-nowrap text-sm flex items-center justify-center gap-2.5 ${
                    isCopied 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-blue-700 hover:bg-blue-800 text-white"
                  }`}
               >
                 {isCopied ? (
                   <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    <span>Tersalin</span>
                   </>
                 ) : (
                   <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span>Salin Kode</span>
                   </>
                 )}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 border-t border-slate-100 pt-10">
            
            {/* ================= RIWAYAT / DAFTAR REFERRAL ================= */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-slate-800 font-black text-lg tracking-tight">Riwayat Undangan</h3>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Daftar anggota yang berhasil bergabung</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 shrink-0">
                    {user.referredUsers.length} Orang
                  </div>
                </div>

                {user.referredUsers.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-40">📭</div>
                    <p className="text-slate-700 font-bold text-sm">Belum ada anggota</p>
                    <p className="text-slate-500 text-xs mt-1">Bagikan kode Anda untuk mulai mendapatkan bonus.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slicedReferredUsers.map((refUser, index) => (
                      <div key={refUser.id || index} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-base border border-blue-100 shrink-0">
                            {refUser.full_name ? refUser.full_name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="text-slate-800 font-bold text-sm tracking-tight truncate max-w-[120px] sm:max-w-[150px]">{refUser.full_name}</p>
                            <p className="text-slate-500 text-[10px] font-mono mt-0.5">{refUser.phone_number}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded-md mb-1.5 border border-green-200">
                            <span className="text-[9px] font-bold uppercase tracking-widest">Sukses</span>
                          </div>
                          <p className="text-slate-400 font-medium text-[9px] block">{formatDate(refUser.registered_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CONTROLLER PAGINATION UNDANGAN */}
              {totalReferredPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-xs font-bold">
                  <button
                    onClick={() => setReferredPage(prev => Math.max(prev - 1, 1))}
                    disabled={referredPage === 1}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-slate-500 font-medium">
                    Halaman {referredPage} dari {totalReferredPages}
                  </span>
                  <button
                    onClick={() => setReferredPage(prev => Math.min(prev + 1, totalReferredPages))}
                    disabled={referredPage === totalReferredPages}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>

            {/* ================= RIWAYAT PENARIKAN ================= */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-slate-800 font-black text-lg tracking-tight">Riwayat Penarikan</h3>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Status pencairan dana Anda</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 shrink-0">
                    {user.withdrawalHistory.length} Transaksi
                  </div>
                </div>

                {user.withdrawalHistory.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-40">💸</div>
                    <p className="text-slate-700 font-bold text-sm">Belum ada penarikan</p>
                    <p className="text-slate-500 text-xs mt-1">Tarik bonus pertama Anda sekarang.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slicedWithdrawalHistory.map((wd, index) => {
                      let badgeColor = "bg-slate-50 text-slate-700 border-slate-200";
                      let statusLabel = wd.status;

                      if (wd.status === "pending") {
                        badgeColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                        statusLabel = "Diproses";
                      } else if (wd.status === "success") {
                        badgeColor = "bg-green-50 text-green-700 border-green-200";
                        statusLabel = "Sukses";
                      } else if (wd.status === "failed") {
                        badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                        statusLabel = "Gagal";
                      }

                      return (
                        <div key={wd.id || index} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center font-black border border-slate-200 shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-slate-800 font-bold text-sm tracking-tight">Tarik Dana</p>
                              <p className="text-slate-400 font-medium text-[9px] mt-1 block">{formatDate(wd.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-slate-800 font-black text-sm mb-1.5">{formatRupiah(wd.amount)}</p>
                            <div className={`inline-flex items-center px-2 py-1 rounded-md border ${badgeColor}`}>
                              <span className="text-[9px] font-bold uppercase tracking-widest">{statusLabel}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CONTROLLER PAGINATION PENARIKAN */}
              {totalWithdrawalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-xs font-bold">
                  <button
                    onClick={() => setWithdrawalPage(prev => Math.max(prev - 1, 1))}
                    disabled={withdrawalPage === 1}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-slate-500 font-medium">
                    Halaman {withdrawalPage} dari {totalWithdrawalPages}
                  </span>
                  <button
                    onClick={() => setWithdrawalPage(prev => Math.min(prev + 1, totalWithdrawalPages))}
                    disabled={withdrawalPage === totalWithdrawalPages}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}