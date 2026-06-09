import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { fetchWithAuth } from "../lib/apiClient";

export default function MemberCardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchIdCard = async () => {
        setLoadingData(true);
        try {
          const response = await fetchWithAuth("user/v1/id-card", {
            method: "GET",
          });
          if (response.ok) {
            const resJson = await response.json();
            setCardData(resJson.data);
          }
        } catch (error) {
          console.error("Gagal memuat data kartu anggota:", error);
        } finally {
          setLoadingData(false);
        }
      };
      fetchIdCard();
    } else {
      setCardData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (loadingData || !cardData) {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#4461AD] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-600">
            Memuat Kartu Anggota...
          </p>
        </div>
      </div>
    );
  }

  // --- Pengolahan URL & Data ---
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
  const baseUrl = apiBase.replace(/\/api\/?$/, "/public/");
  const finalPhotoUrl = cardData.photo_selfie_url
    ? `${baseUrl}${cardData.photo_selfie_url.replace(/^public\//, "")}`
    : "";

  const firstName = cardData.fullname
    ? cardData.fullname.split(" ")[0]
    : "Member";
  const phone = cardData.phone_number?.replace(/^0/, "62");
  const message = "Halo, saya mendapatkan kartu anggota Anda.";

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `https://wa.me/${phone}?text=${message}`,
  )}`;

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("landscape", "mm", [85.6, 54]);

      pdf.addImage(dataUrl, "PNG", 0, 0, 85.6, 54);

      pdf.save(`Kartu_Member_${firstName}.pdf`);
    } catch (error) {
      console.error("Gagal mendownload PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* AREA KARTU */}
        <div
          ref={cardRef}
          className="relative w-full aspect-[1.58/1] overflow-hidden rounded-xl shadow-2xl shrink-0"
          style={{
            width: "350px",
            height: "220px",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Background PNG */}
          <img
            src="/member.png"
            alt="Card Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* OVERLAYS - Gunakan style={{ color: '#HEX' }} agar html2canvas tidak error */}
          <div className="absolute top-[10%] right-[5%] text-right w-[50%] z-10">
            <h2
              style={{ color: "#1e293b" }}
              className="text-[13px] font-black uppercase leading-tight break-words"
            >
              {cardData.fullname}
            </h2>
            <p
              style={{ color: "#334155" }}
              className="text-[7px] font-bold uppercase mt-1"
            >
              Terdaftar pada {cardData.created_at_formatted}
            </p>
          </div>

          <div className="absolute top-[37%] left-[3%] w-[32.5%] aspect-square rounded-full overflow-hidden bg-slate-200 z-10 flex items-center justify-center">
            {finalPhotoUrl ? (
              <img
                src={finalPhotoUrl}
                alt="Selfie"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div
                style={{ color: "#4461AD" }}
                className="font-bold text-[8px]"
              >
                FOTO
              </div>
            )}
          </div>

          <div
            className="absolute top-[45%] left-[40%] w-[58%] z-10"
            style={{ color: "#1e293b" }}
          >
            <div className="grid grid-cols-[65px_8px_1fr] text-[7px] font-black gap-y-1">
              <div>TIPE ANGGOTA</div>
              <div>:</div>
              <div>{cardData.member_type}</div>

              <div className="self-start">KOTA</div>
              <div className="self-start">:</div>
              <div className="break-words leading-tight">{cardData.city}</div>

              <div>TELP</div>
              <div>:</div>
              <div>{cardData.phone_number}</div>
            </div>
          </div>

          <div className="absolute top-[65%] right-[5%] w-[15%] aspect-square bg-white border border-slate-300 rounded-md p-[2px] z-10">
            <img
              src={qrCodeUrl}
              alt="QR"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-6 px-2">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-slate-700 py-3.5 rounded-xl font-bold text-sm shadow-md"
          >
            TUTUP
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex-1 bg-[#FFC516] text-[#4461AD] py-3.5 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2"
          >
            {isDownloading ? "MEMPROSES..." : "UNDUH PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
