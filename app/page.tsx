"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./lib/firebase";
import { fetchWithAuth } from "./lib/apiClient";
import MemberCardModal from "./components/MemberCardModal";

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
  onClose,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  if (!isOpen) return null;
  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-[340px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${isSuccess ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"}`}
          >
            {isSuccess ? (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
            {title}
          </h3>
          <div
            className="text-sm text-slate-500 font-medium leading-relaxed mb-8"
            dangerouslySetInnerHTML={{ __html: message }}
          />
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

// ================= KOMPONEN MODAL PENARIKAN (WITHDRAW) =================
const WithdrawModal = ({
  isOpen,
  saldoTersedia,
  bankName,
  accountName,
  accountNumber,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  saldoTersedia: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isLoading: boolean;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}) => {
  const [inputAmount, setInputAmount] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setInputAmount("");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setInputAmount(rawValue);
    const num = Number(rawValue);
    if (num > saldoTersedia) setErrorMsg("Saldo tidak mencukupi");
    else setErrorMsg("");
  };

  const handleSetMax = () => {
    setInputAmount(saldoTersedia.toString());
    setErrorMsg("");
  };

  const handleSubmit = () => {
    const num = Number(inputAmount);
    if (num <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }
    if (num > saldoTersedia) {
      setErrorMsg("Saldo tidak mencukupi");
      return;
    }
    onConfirm(num);
  };

  if (!isOpen) return null;
  const displayValue = inputAmount
    ? new Intl.NumberFormat("id-ID").format(Number(inputAmount))
    : "";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-[340px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Tarik Dana
            </h3>
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Nominal
              </label>
              <button
                onClick={handleSetMax}
                className="text-[10px] bg-[#4461AD]/10 text-[#4461AD] px-2 py-1 rounded font-bold hover:bg-[#4461AD]/20 transition-colors"
              >
                TARIK SEMUA
              </button>
            </div>
            <div
              className={`flex items-center border-b-2 py-2 transition-colors ${errorMsg ? "border-rose-500" : "border-slate-200 focus-within:border-[#4461AD]"}`}
            >
              <span className="text-xl font-bold text-slate-400 mr-2">Rp</span>
              <input
                type="tel"
                value={displayValue}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full bg-transparent border-none outline-none text-3xl font-black text-slate-800 placeholder:text-slate-300 p-0"
              />
            </div>
            {errorMsg ? (
              <p className="text-xs text-rose-500 font-bold mt-1.5">
                {errorMsg}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                Saldo aktif:{" "}
                <span className="font-bold text-slate-600">
                  {formatRupiah(saldoTersedia)}
                </span>
              </p>
            )}
          </div>

          <div className="bg-slate-50 w-full p-4 rounded-xl border border-slate-200 mb-6 mt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Transfer Ke
            </p>
            <p className="text-sm font-black text-slate-700 tracking-tight uppercase">
              {bankName || "-"}
            </p>
            <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
              a.n {accountName || "-"}
            </p>
            <p className="text-xs font-mono font-bold text-[#4461AD] mt-0.5">
              {accountNumber || "-"}
            </p>
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                Number(inputAmount) <= 0 ||
                Number(inputAmount) > saldoTersedia
              }
              className="w-1/2 bg-[#4461AD] hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "TARIK"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= KOMPONEN MODAL LOGOUT =================
const LogoutModal = ({
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-[320px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto bg-yellow-100 text-yellow-600">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
          Konfirmasi Keluar
        </h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          Apakah Anda yakin ingin keluar dari akun Anda?
        </p>
        <div className="flex w-full gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
          >
            BATAL
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "YA, KELUAR"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= KOMPONEN MODAL FOTO PROFIL =================
const ProfilePhotoModal = ({
  isOpen,
  photoUrl,
  onClose,
}: {
  isOpen: boolean;
  photoUrl: string;
  onClose: () => void;
}) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Tutup modal jika area luar diklik
    >
      <div 
        className="relative w-full max-w-sm flex flex-col items-center justify-center" 
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup jika foto diklik
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-slate-300 font-bold text-lg w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          ✕
        </button>
        <img
          src={photoUrl}
          alt="Foto Profil Full"
          className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
        />
      </div>
    </div>
  );
};

// ================= KOMPONEN UTAMA =================
export default function Home() {
  const router = useRouter();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // States Modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMemberCardOpen, setIsMemberCardOpen] = useState(false);

  // States UI
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<"referral" | "withdraw">(
    "referral",
  );
  const [isCopied, setIsCopied] = useState(false);

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const [user, setUser] = useState({
    nama: "",
    photoSelfieUrl: "",
    jumlahReferral: 0,
    noWhatsapp: "",
    saldoTersedia: 0,
    totalDihasilkan: 0,
    iuranPokok: 1000000,
    namaBank: "",
    noRekening: "",
    accountName: "",
    referredUsers: [] as any[],
    withdrawalHistory: [] as any[],
  });

  // Pagination statis
  const [referredPage, setReferredPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchDashboardData = async () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [dashResponse, bankResponse] = await Promise.all([
        fetchWithAuth("user/v1/dashboard", { method: "GET" }),
        fetchWithAuth("user/v1/bank-info", { method: "GET" }),
      ]);

      if (dashResponse.ok) {
        const dashResData = await dashResponse.json();
        const dashData = dashResData.data;

        let bankData = {
          bank_name: "",
          bank_account_number: "",
          bank_account_name: "",
        };
        if (bankResponse.ok) {
          const bankResJson = await bankResponse.json();
          bankData = bankResJson.data || {};
        }

        setUser({
          nama: dashData.full_name || "Anggota",
          photoSelfieUrl: dashData.photo_selfie_url
            ? `${(process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/$/, "/public/")}${dashData.photo_selfie_url.replace(/^public\//, "")}`
            : "",
          jumlahReferral: dashData.total_referred_users || 0,
          noWhatsapp: dashData.phone_number || "",
          saldoTersedia: dashData.current_balance || 0,
          totalDihasilkan: dashData.total_earned_reward || 0,
          iuranPokok: 1000000,
          namaBank: bankData.bank_name || "",
          noRekening: bankData.bank_account_number || "",
          accountName: bankData.bank_account_name || "",
          referredUsers: dashData.referred_users_list || [],
          withdrawalHistory: dashData.withdrawal_history_list || [],
        });
      } else {
        if (dashResponse.status === 401) {
          handleRequestLogout(); // Memicu logout otomatis jika token mati
        }
      }
    } catch (error) {
      console.error("Error mengambil data dashboard:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    setIsLoadingProfile(true);
    fetchDashboardData();
  }, [router]);

  const handleRequestWithdraw = () => {
    if (user.saldoTersedia <= 0) {
      setNotification({
        isOpen: true,
        title: "Penarikan Gagal",
        message: "Saldo Anda tidak mencukupi untuk melakukan penarikan.",
        type: "error",
      });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmWithdraw = async (amount: number) => {
    setIsWithdrawing(true);

    try {
      const payload = { amount: amount };

      const response = await fetchWithAuth("wallet/v1/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      setIsConfirmModalOpen(false);

      if (response.ok) {
        setNotification({
          isOpen: true,
          title: "Penarikan Berhasil",
          message:
            resData.message ||
            `Penarikan dana sebesar ${formatRupiah(amount)} berhasil diproses.`,
          type: "success",
        });
        setWithdrawalPage(1);
        await fetchDashboardData();
      } else {
        setNotification({
          isOpen: true,
          title: "Penarikan Gagal",
          message:
            resData.message || "Terjadi kesalahan saat memproses penarikan.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error withdraw:", error);
      setIsConfirmModalOpen(false);
      setNotification({
        isOpen: true,
        title: "Koneksi Bermasalah",
        message: "Gagal terhubung ke server. Pastikan internet Anda stabil.",
        type: "error",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRequestLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await fetchWithAuth("auth/v1/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch((err: any) => console.warn("Logout API gagal:", err));
      }
    } catch (error) {
      console.error("Gagal memproses logout:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      if (auth && auth.signOut) {
        await auth.signOut();
      }

      setIsLogoutModalOpen(false);
      router.push("/login");
      setIsLoggingOut(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.noWhatsapp);
      setIsCopied(true);
      setNotification({
        isOpen: true,
        title: "Tersalin!",
        message: "Nomor WhatsApp Anda telah disalin.",
        type: "success",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {}
  };

  const slicedReferredUsers = user.referredUsers.slice(
    (referredPage - 1) * ITEMS_PER_PAGE,
    referredPage * ITEMS_PER_PAGE,
  );
  const slicedWithdrawalHistory = user.withdrawalHistory.slice(
    (withdrawalPage - 1) * ITEMS_PER_PAGE,
    withdrawalPage * ITEMS_PER_PAGE,
  );

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#4461AD] border-t-yellow-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-[420px] bg-white min-h-screen relative shadow-2xl overflow-x-hidden pb-24">
        {/* ================= MODALS ================= */}
        <NotificationModal
          isOpen={notification.isOpen}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />

        <WithdrawModal
          isOpen={isConfirmModalOpen}
          saldoTersedia={user.saldoTersedia}
          bankName={user.namaBank}
          accountNumber={user.noRekening}
          accountName={user.accountName}
          isLoading={isWithdrawing}
          onConfirm={handleConfirmWithdraw}
          onCancel={() => setIsConfirmModalOpen(false)}
        />

        <LogoutModal
          isOpen={isLogoutModalOpen}
          isLoading={isLoggingOut}
          onConfirm={executeLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
        />

        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          photoUrl={user.photoSelfieUrl}
          onClose={() => setIsPhotoModalOpen(false)}
        />

        <MemberCardModal isOpen={isMemberCardOpen} onClose={() => setIsMemberCardOpen(false)} />

        {/* HEADER AREA */}
        <div className="bg-[#4461AD] pt-10 pb-[100px] px-6 rounded-b-xl relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {/* === AREA AVATAR PROFILE === */}
              <div 
                className={`w-14 h-14 bg-yellow-100 rounded-full overflow-hidden flex items-center justify-center border-2 border-white/20 ${user.photoSelfieUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                onClick={() => {
                  if (user.photoSelfieUrl) setIsPhotoModalOpen(true);
                }}
              >
                {user.photoSelfieUrl ? (
                  <img
                    src={user.photoSelfieUrl}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-[#4461AD] mt-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <h2 className="text-[#FFC516] font-bold text-[17px] truncate">
                {user.nama.split(" ")[0]}
              </h2>
            </div>
            <img
              src="/gerai_biru.png"
              alt="Logo"
              className="w-36 h-auto absolute top-0 right-0"
            />
          </div>

          {/* Saldo Section */}
          <div className="mt-4">
            <p className="text-white/80 text-xs font-medium tracking-wide">
              Saldo Aktif (Tersedia)
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-[#FFC516]">Rp</span>
              <span className="text-2xl font-black text-[#FFC516]">
                {showBalance
                  ? user.saldoTersedia.toLocaleString("id-ID")
                  : "•••••••"}
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-[#FFC516] ml-1 opacity-80 hover:opacity-100"
              >
                {showBalance ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Container Saldo Tambahan yang Responsive */}
            <div className="flex justify-between items-center mt-4 bg-black/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm gap-2">
              {/* Iuran Pokok */}
              <div
                className="cursor-pointer group flex-1 text-center"
                onClick={() =>
                  setNotification({
                    isOpen: true,
                    title: "Informasi Iuran Pokok",
                    message:
                      "Iuran pokok hanya bisa ditarik jika Anda keluar dari Anggota. Hubungi Admin untuk informasi lebih lanjut: <br/><a href='mailto:koperasigeraikemas@gmail.com' style='color: #2563eb; font-weight: bold; text-decoration: underline;'>koperasigeraikemas@gmail.com</a>",
                    type: "error",
                  })
                }
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <p className="text-[9px] text-white/70 uppercase font-bold tracking-wider">
                    Iuran Pokok
                  </p>
                  <svg
                    className="w-2 h-2 text-white/70"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-white font-bold text-xs truncate">
                  {showBalance
                    ? formatRupiah(user.iuranPokok).replace("Rp ", "")
                    : "••••"}
                </p>
              </div>

              <div className="w-px h-8 bg-white/20"></div>

              {/* Total Hasil */}
              <div className="flex-1 text-center">
                <p className="text-[9px] text-white/70 uppercase font-bold tracking-wider mb-0.5">
                  Total Hasil
                </p>
                <p className="text-white font-bold text-xs truncate">
                  {showBalance
                    ? formatRupiah(user.totalDihasilkan).replace("Rp ", "")
                    : "••••"}
                </p>
              </div>

              <div className="w-px h-8 bg-white/20"></div>

              {/* No Referral */}
              <div className="flex-1 text-center">
                <p className="text-[9px] text-white/70 uppercase font-bold tracking-wider mb-0.5">
                  No.Referral
                </p>
                <p className="text-white font-bold text-xs truncate">
                  {showBalance ? user.noWhatsapp : "••••"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2 mt-6 px-1">
            <div
              className="flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={handleRequestWithdraw}
            >
              <div className="w-12 h-12 border-2 border-[#FFC516] rounded-xl flex items-center justify-center text-[#FFC516] hover:bg-white/10 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-[#FFC516] text-center font-medium">
                Tarik Dana
              </span>
            </div>
            <div
              className="flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={handleCopyCode}
            >
              <div className="w-12 h-12 border-2 border-[#FFC516] rounded-xl flex items-center justify-center text-[#FFC516] shadow-sm hover:bg-white/10 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-[#FFC516] text-center font-medium">
                Salin Referral
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setIsMemberCardOpen(true)}>
              <div className="w-12 h-12 border-2 border-[#FFC516] rounded-xl flex items-center justify-center text-[#FFC516] hover:bg-white/10 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <span className="text-[10px] text-[#FFC516] text-center font-medium">Kartu Member</span>
            </div>

            <div
              className="flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={handleRequestLogout}
            >
              <div className="w-12 h-12 border-2 bg-[#FFC516] border-[#FFC516] rounded-xl flex items-center justify-center text-[#4461AD] hover:text-[#FFC516] hover:bg-white/10 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-[#FFC516] text-center font-medium">
                Keluar
              </span>
            </div>
          </div>
        </div>

        {/* OVERLAPPING GRID MENU */}
        <div className="bg-white rounded-2xl mx-4 -mt-16 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative z-10">
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            {[
              {
                image: "/mart.png",
                label: "Gerai Mart",
                route: "/coming-soon?feature=Gerai Mart",
              },
              {
                image: "/niaga.png",
                label: "Gerai Niaga",
                route: "/coming-soon?feature=Gerai Niaga",
              },
              {
                image: "/agro.png",
                label: "Gerai Agro",
                route: "/coming-soon?feature=Gerai Agro",
              },
              {
                image: "/digital.png",
                label: "Gerai Digital",
                route: "/coming-soon?feature=Gerai Digital",
              },
            ].map((menu, i) => (
              <div
                key={i}
                onClick={() => router.push(menu.route)}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-transform group-hover:scale-105 bg-[#FFC516] border-[#FFC516] shadow-sm`}
                >
                  <img src={menu.image} alt={menu.label} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 text-center">
                  {menu.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* TRANSACTIONS / HISTORY SECTION */}
        <div className="px-4 mt-8 mb-4">
          <h3 className="text-sm font-black text-slate-800 mb-4">
            Riwayat Kemitraan
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab("referral")}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${activeTab === "referral" ? "bg-white shadow-sm text-[#4461AD]" : "text-slate-500"}`}
            >
              Undangan ({user.referredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-colors ${activeTab === "withdraw" ? "bg-white shadow-sm text-[#4461AD]" : "text-slate-500"}`}
            >
              Penarikan ({user.withdrawalHistory.length})
            </button>
          </div>

          <div className="space-y-3">
            {activeTab === "referral" &&
              (slicedReferredUsers.length > 0 ? (
                slicedReferredUsers.map((ref, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#4461AD] flex items-center justify-center font-bold text-sm">
                        {ref.full_name
                          ? ref.full_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {ref.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatDate(ref.registered_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
                      Sukses
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  Belum ada data undangan.
                </div>
              ))}

            {activeTab === "withdraw" &&
              (slicedWithdrawalHistory.length > 0 ? (
                slicedWithdrawalHistory.map((wd, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold text-sm">
                        💸
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Tarik Dana
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatDate(wd.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">
                        {formatRupiah(wd.amount)}
                      </p>
                      <p
                        className={`text-[9px] font-bold mt-0.5 ${wd.status === "success" ? "text-green-600" : wd.status === "pending" ? "text-yellow-600" : "text-rose-600"}`}
                      >
                        {wd.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  Belum ada data penarikan.
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );  
}
