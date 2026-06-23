"use client";
import { useState, useRef } from "react";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const KATEGORI_LIST = ["Semua", "Sembako", "Pakaian", "Makanan dan Minuman", "Lainnya"];

export default function BeliBarang({ products, onAddToCart }: { products: any[], onAddToCart?: (product: any, qty: number) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  
  // State untuk Detail Produk
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [isLoadingDetail, setIsLoadingDetail] = useState(false); // State loading saat mengambil detail API
  
  const [isBuying, setIsBuying] = useState<any>(null);
  const [notification, setNotification] = useState({ isOpen: false, message: "", type: "success" });
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.penjual.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = selectedKategori === "Semua" || p.kategori === selectedKategori;
    return matchSearch && matchKategori;
  });

  // ==============================================================================
  // === FETCH DETAIL PRODUK DARI API ===
  // ==============================================================================
  const fetchProductDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
      const domainBase = API_BASE.replace(/\/api\/?$/, "/");

      const response = await fetch(`${API_BASE}product/v1/product/${id}`, {
        method: "GET",
      });

      if (response.ok) {
        const resJson = await response.json();
        const item = resJson.data;

        let finalImages: string[] = [];
        
        // --- PERBAIKAN 1: Helper yang mengubah backslash (\) menjadi slash normal (/) ---
        const cleanImageUrl = (urlStr: string) => {
          if (!urlStr) return "";
          // Ganti semua backslash "\" menjadi "/"
          let normalizedUrl = urlStr.replace(/\\/g, "/"); 
          
          if (normalizedUrl.startsWith("http")) return normalizedUrl;
          
          let cleanPath = normalizedUrl.replace(/^\//, "").replace(/^(public\/)+/, "");
          const base = domainBase.replace(/\/$/, "");
          return `${base}/public/${cleanPath}`;
        };

        // --- PERBAIKAN 2: Menggunakan item.Images (Huruf kapital) sesuai data JSON ---
        const apiImagesArray = item.Images || item.images; 

        if (apiImagesArray && Array.isArray(apiImagesArray) && apiImagesArray.length > 0) {
          finalImages = apiImagesArray.map((img: any) => {
            const urlStr = typeof img === 'string' ? img : (img.image_url || img.url || "");
            return cleanImageUrl(urlStr);
          }).filter(Boolean);
        }

        // Fallback ke cover_image jika array kosong
        if (finalImages.length === 0 && item.cover_image_url) {
          finalImages = [cleanImageUrl(item.cover_image_url)];
        }

        // Fallback gambar default jika benar-benar kosong
        if (finalImages.length === 0 || !finalImages[0]) {
          finalImages = ["https://images.unsplash.com/photo-1513885045260-6b3086b24c17?auto=format&fit=crop&q=80&w=300&h=300"];
        }

        setSelectedProduct({
          id: item.id.toString(),
          nama: item.name,
          harga: item.price,
          gambar: finalImages,
          penjual: item.seller_name || "Anggota Koperasi",
          kategori: item.category_name || "Lainnya",
          deskripsi: item.description || "Tidak ada deskripsi produk.",
          stock: item.stock || 0,
          seller_id: item.seller_id
        });
        
        setActiveImageIndex(0);
        setQuantity(1);
      } else {
        setNotification({ isOpen: true, message: "Gagal mengambil data detail barang.", type: "error" });
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
      setNotification({ isOpen: true, message: "Terjadi kesalahan jaringan saat memuat detail.", type: "error" });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleTambahKeranjang = () => {
    if (onAddToCart) onAddToCart(selectedProduct, quantity);
    setNotification({ isOpen: true, message: `<b>${selectedProduct.nama}</b> (${quantity}x) berhasil ditambahkan ke keranjang!`, type: "success" });
    setSelectedProduct(null); 
    setQuantity(1); 
  };

  const handleConfirmBuy = () => {
    setNotification({ isOpen: true, message: `Pesanan <b>${isBuying.nama}</b> (${isBuying.buyQty}x) berhasil dibuat! Silakan hubungi penjual (${isBuying.penjual}).`, type: "success" });
    setIsBuying(null);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const index = Math.round(target.scrollLeft / target.clientWidth);
    setActiveImageIndex(index);
  };

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: index * width, behavior: "smooth" });
      setActiveImageIndex(index);
    }
  };

  // ==============================================================================
  // === TAMPILAN DETAIL PRODUK ===
  // ==============================================================================
  if (selectedProduct) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/50 flex justify-center backdrop-blur-sm">
        <div className="w-full max-w-[420px] bg-white h-full relative flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
          <div className="absolute top-4 left-4 z-20">
            <button onClick={() => { setSelectedProduct(null); setActiveImageIndex(0); setQuantity(1); }} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/60 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-10">
            <div className="w-full aspect-square bg-slate-100 relative shrink-0">
              <div ref={scrollRef} onScroll={handleScroll} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {selectedProduct.gambar.map((img: string, idx: number) => (
                  <div key={idx} className="w-full h-full shrink-0 snap-center">
                    <img src={img} alt={`${selectedProduct.nama} - ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {selectedProduct.gambar.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {selectedProduct.gambar.map((_: any, idx: number) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === idx ? "w-4 bg-[#FFC516]" : "w-1.5 bg-black/30 backdrop-blur-sm"}`} />
                  ))}
                </div>
              )}
            </div>
            {selectedProduct.gambar.length > 1 && (
              <div className="flex gap-2 p-3 bg-white overflow-x-auto border-b border-slate-100 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {selectedProduct.gambar.map((img: string, idx: number) => (
                  <button key={idx} onClick={() => scrollToImage(idx)} className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${activeImageIndex === idx ? "border-[#4461AD] scale-95" : "border-transparent opacity-60"}`}>
                    <img src={img} className="w-full h-full object-cover" alt="Thumbnail" />
                  </button>
                ))}
              </div>
            )}
            <div className="p-5 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-[#4461AD]/10 text-[#4461AD] px-3 py-1 rounded-full text-[10px] font-bold inline-block">{selectedProduct.kategori}</div>
                <div className="text-[10px] font-bold text-slate-400">Sisa Stok: {selectedProduct.stock}</div>
              </div>
              <h1 className="text-lg font-black text-slate-800 leading-tight mb-1">{selectedProduct.nama}</h1>
              <p className="text-2xl font-black text-[#FFC516] mb-4">{formatRupiah(selectedProduct.harga)}</p>
              <hr className="border-slate-100 my-4" />
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Penjual</h3>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-[#4461AD] text-white flex items-center justify-center font-bold text-sm">
                  {selectedProduct.penjual.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">{selectedProduct.penjual}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Anggota Koperasi Gerai</p>
                </div>
              </div>
              <hr className="border-slate-100 my-4" />
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Produk</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {selectedProduct.deskripsi}
              </p>
            </div>
          </div>
          <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-bold text-slate-500">Jumlah Dibeli:</span>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-black">−</button>
                <div className="w-10 h-full flex items-center justify-center text-xs font-black text-slate-800 border-x border-slate-200">{quantity}</div>
                <button 
                  // Mencegah user memilih kuantitas melebihi stok yang ada
                  onClick={() => setQuantity(q => (q < selectedProduct.stock ? q + 1 : q))} 
                  className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-black"
                >+</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleTambahKeranjang} className="flex-1 bg-[#4461AD]/10 text-[#4461AD] py-3 rounded-xl font-black text-xs tracking-wide hover:bg-[#4461AD]/20 transition-colors flex justify-center items-center gap-1">+ KERANJANG</button>
              <button onClick={() => setIsBuying({ ...selectedProduct, buyQty: quantity })} className="flex-1 bg-[#4461AD] text-white py-3 rounded-xl font-black text-xs tracking-wide shadow-md hover:bg-blue-800 transition-colors">BELI LANGSUNG</button>
            </div>
          </div>
        </div>

        {/* MODAL KONFIRMASI BELI LANGSUNG */}
        {isBuying && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-[420px] p-6 shadow-xl animate-in slide-in-from-bottom-10">
               <h3 className="text-base font-black text-slate-800 mb-4">Konfirmasi Pembelian</h3>
               <div className="flex gap-4 bg-slate-50 p-3 rounded-xl mb-6 border border-slate-100">
                  <img src={isBuying.gambar[0]} alt="Produk" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex flex-col justify-center">
                     <p className="text-sm font-bold text-slate-800 line-clamp-1">{isBuying.nama}</p>
                     <p className="text-[10px] text-slate-500 mb-1">{isBuying.buyQty}x Item</p>
                     <p className="text-base font-black text-[#FFC516]">{formatRupiah(isBuying.harga * isBuying.buyQty)}</p>
                  </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setIsBuying(null)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs">BATAL</button>
                 <button onClick={handleConfirmBuy} className="flex-1 bg-[#4461AD] text-white py-3 rounded-xl font-bold text-xs">KONFIRMASI</button>
               </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================================
  // === TAMPILAN UTAMA (GRID BELI BARANG) ===
  // ==============================================================================
  return (
    <div className="p-4 pb-24 relative">
      
      {/* Loading Overlay saat Fetching Detail */}
      {isLoadingDetail && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-white/70 backdrop-blur-sm">
           <div className="flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-[#4461AD] border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-bold text-[#4461AD]">Mengambil detail barang...</p>
           </div>
        </div>
      )}

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input type="text" placeholder="Cari barang atau penjual..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#4461AD] shadow-sm" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {KATEGORI_LIST.map((kat) => (
          <button key={kat} onClick={() => setSelectedKategori(kat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold border shadow-sm transition-colors ${selectedKategori === kat ? "bg-[#4461AD] text-white border-[#4461AD]" : "bg-white text-slate-500 border-slate-200"}`}>
            {kat}
          </button>
        ))}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((produk) => (
            // PERBAIKAN: Mengganti setSelectedProduct(produk) menjadi fetchProductDetail(produk.id)
            <div key={produk.id} onClick={() => fetchProductDetail(produk.id)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-all">
              <div className="w-full aspect-square bg-slate-100 relative">
                <img src={produk.gambar[0]} alt={produk.nama} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-slate-600 shadow-sm">{produk.kategori}</div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{produk.nama}</h3>
                <p className="text-sm font-black text-[#FFC516] mb-2">{formatRupiah(produk.harga)}</p>
                <div className="mt-auto pt-2 border-t border-slate-50 flex items-center gap-1.5">
                   <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[6px] font-bold text-[#4461AD]">{produk.penjual.charAt(0)}</div>
                   <span className="text-[9px] text-slate-500 truncate">{produk.penjual}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center">
           <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-3"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
           <p className="text-slate-500 font-medium text-sm">Barang tidak ditemukan.</p>
        </div>
      )}

      {/* MODAL NOTIFIKASI */}
      {notification.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 text-center shadow-xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
               {notification.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
               ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               )}
            </div>
            <p className="text-sm text-slate-600 font-medium mb-6" dangerouslySetInnerHTML={{ __html: notification.message }}></p>
            <button onClick={() => setNotification({ ...notification, isOpen: false })} className="w-full bg-[#4461AD] text-white py-3 rounded-xl font-bold text-xs">
              LANJUTKAN
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}