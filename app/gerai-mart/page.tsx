"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BeliBarang from "./components/BeliBarang";
import JualBarang from "./components/JualBarang";
import Keranjang from "./components/Keranjang";
import BarangSaya from "./components/BarangSaya";

export default function GeraiMart() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"beli" | "keranjang" | "jual" | "saya">("beli");
  const [products, setProducts] = useState<any[]>([]); 
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [cart, setCart] = useState<any[]>([]); 

  // === FUNGSI FETCH PRODUK DARI API ===
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
      const domainBase = API_BASE.replace(/\/api\/?$/, "/"); 

      const response = await fetch(`${API_BASE}product/v1/products?limit=50&offset=0`, {
        method: "GET",
      });

      if (response.ok) {
        const resJson = await response.json();
        const apiData = resJson.data || [];

        const mappedProducts = apiData.map((item: any) => {
  let finalImageUrl = "https://images.unsplash.com/photo-1513885045260-6b3086b24c17?auto=format&fit=crop&q=80&w=300&h=300"; // Default placeholder

  if (item.cover_image_url) {
    if (item.cover_image_url.startsWith("http")) {
      finalImageUrl = item.cover_image_url;
    } else {
      // Menghilangkan garing miring di awal jika ada (misal "/public/..." menjadi "public/...")
      const cleanPath = item.cover_image_url.replace(/^\//, "");

      // =========================================================================
      // OPSI A: Jika backend Anda menggunakan r.Static("/public", "./public")
      // Hasil URL: http://localhost:8082/public/uploads/products/19-...
      // =========================================================================
      finalImageUrl = `${domainBase}${cleanPath}`;

      // =========================================================================
      // OPSI B: Jika di browser gambar masih pecah, coba gunakan Opsi B ini.
      // (Aktifkan baris di bawah dan matikan Opsi A jika backend menggunakan r.Static("/uploads", "./public/uploads"))
      // Hasil URL: http://localhost:8082/uploads/products/19-...
      // =========================================================================
      // finalImageUrl = `${domainBase}${cleanPath.replace(/^public\//, "")}`;
    }
  }

  return {
    id: item.id.toString(),
    nama: item.name,
    harga: item.price,
    gambar: [finalImageUrl], 
    penjual: item.seller_name || "Anggota Koperasi",
    kategori: item.category_name || "Lainnya",
    deskripsi: item.description || "Tidak ada deskripsi produk.",
    stock: item.stock || 0,
    seller_id: item.seller_id
  };
});

        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Gagal memuat produk dari server:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSimpanSukses = () => {
    fetchProducts(); 
    setActiveTab("saya"); 
  };

  const handleAddToCart = (product: any, qty: number) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...product, qty }];
    });
  };

  const totalCartItems = cart.reduce((total, item) => total + item.qty, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-[420px] bg-white min-h-screen relative shadow-2xl flex flex-col">
        
        {/* === HEADER === */}
        <div className="bg-[#4461AD] text-white px-4 py-4 flex items-center justify-center relative sticky top-0 z-50 shadow-md h-[72px]">
          <button onClick={() => router.push("/")} className="absolute left-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col items-center justify-center text-center">
             <h1 className="font-black text-lg tracking-wide">Gerai Mart</h1>
             <p className="text-[10px] text-white/80 font-medium">Marketplace Koperasi Gerai</p>
          </div>
        </div>

        {/* === TABS NAVIGATION === */}
        <div className="flex bg-white shadow-sm sticky top-[72px] z-40 border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button onClick={() => setActiveTab("beli")} className={`px-5 py-3.5 text-xs font-bold transition-all relative shrink-0 ${activeTab === "beli" ? "text-[#4461AD]" : "text-slate-400"}`}>
            BELI BARANG
            {activeTab === "beli" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFC516] rounded-t-full"></div>}
          </button>
          
          {/* PERBAIKAN onClick yang sebelumnya error */}
          <button onClick={() => setActiveTab("keranjang")} className={`px-5 py-3.5 text-xs font-bold transition-all relative shrink-0 flex items-center gap-1 ${activeTab === "keranjang" ? "text-[#4461AD]" : "text-slate-400"}`}>
            KERANJANG
            {totalCartItems > 0 && (
              <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{totalCartItems}</span>
            )}
            {activeTab === "keranjang" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFC516] rounded-t-full"></div>}
          </button>

          <button onClick={() => setActiveTab("jual")} className={`px-5 py-3.5 text-xs font-bold transition-all relative shrink-0 ${activeTab === "jual" ? "text-[#4461AD]" : "text-slate-400"}`}>
            JUAL BARANG
            {activeTab === "jual" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFC516] rounded-t-full"></div>}
          </button>

          <button onClick={() => setActiveTab("saya")} className={`px-5 py-3.5 text-xs font-bold transition-all relative shrink-0 ${activeTab === "saya" ? "text-[#4461AD]" : "text-slate-400"}`}>
            BARANG SAYA
            {activeTab === "saya" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFC516] rounded-t-full"></div>}
          </button>
        </div>

        {/* === KONTEN UTAMA DENGAN STATE LOADING === */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === "beli" && (
            isLoadingProducts ? (
              <div className="py-32 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-[#4461AD] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400">Memuat Katalog Produk...</p>
              </div>
            ) : (
              <BeliBarang products={products} onAddToCart={handleAddToCart} />
            )
          )}
          
          {/* PERBAIKAN: Menghapus komponen siluman <Make-Keranjang /> */}
          {activeTab === "keranjang" && <Keranjang cart={cart} setCart={setCart} />}
          {activeTab === "jual" && <JualBarang onSimpanSukses={handleSimpanSukses} />}
          {activeTab === "saya" && <BarangSaya refreshParentKatalog={fetchProducts} />}
        </div>

      </div>
    </div>
  );
}