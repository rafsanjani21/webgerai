"use client";
import { useState, useEffect } from "react";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const KATEGORI_STATIC = [
  { id: "1", name: "Sembako" },
  { id: "2", name: "Pakaian" },
  { id: "3", name: "Makanan dan Minuman" },
  { id: "4", name: "Lainnya" }
];

export default function BarangSaya({ refreshParentKatalog }: { refreshParentKatalog?: () => void }) {
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false); // Loading saat ambil foto lengkap

  // === STATE GALERI EDIT ===
  // Menyimpan foto bawaan dari server
  const [existingImages, setExistingImages] = useState<{ id: any, raw_url: string, preview: string }[]>([]);
  // Menyimpan ID/Indeks foto bawaan yang ingin dihapus
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  // Menyimpan foto baru yang baru diunggah dari HP/PC
  const [newImages, setNewImages] = useState<{ file: File, preview: string }[]>([]);

  const [notification, setNotification] = useState({ isOpen: false, message: "", type: "success" });
  const [confirmAction, setConfirmAction] = useState<any>(null); 

  // Helper untuk membersihkan URL Gambar (Mencegah double public & slash terbalik)
  const getCleanImageUrl = (urlStr: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
    const domainBase = API_BASE.replace(/\/api\/?$/, "/");
    if (!urlStr) return "";
    let normalizedUrl = urlStr.replace(/\\/g, "/"); 
    if (normalizedUrl.startsWith("http")) return normalizedUrl;
    let cleanPath = normalizedUrl.replace(/^\//, "").replace(/^(public\/)+/, "");
    const base = domainBase.replace(/\/$/, "");
    return `${base}/public/${cleanPath}`;
  };

  const fetchMyProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
      const response = await fetch(`${API_BASE}product/v1/seller/products`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const resJson = await response.json();
        const apiData = resJson.data || [];
        setMyProducts(apiData.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          stock: item.stock,
          category_id: item.category_id.toString(),
          description: item.description,
          image_url: item.cover_image_url ? getCleanImageUrl(item.cover_image_url) : ""
        })));
      }
    } catch (error) {
      console.error("Gagal memuat barang saya:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  // --- 1. MENGAMBIL DETAIL PRODUK SAAT KLIK EDIT ---
  const openEditModal = async (product: any) => {
    setIsFetchingDetail(true);
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
      const response = await fetch(`${API_BASE}product/v1/product/${product.id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const resJson = await response.json();
        const item = resJson.data;

        // Ambil array foto dari server
        const apiImagesArray = item.Images || item.images || [];
        let parsedImages: ((prevState: { id: any; raw_url: string; preview: string; }[]) => { id: any; raw_url: string; preview: string; }[]) | { id: any; raw_url: any; preview: string; }[] = [];
        
        if (apiImagesArray && Array.isArray(apiImagesArray) && apiImagesArray.length > 0) {
          parsedImages = apiImagesArray.map((img: any, idx: number) => {
            // Jika backend memberi string, kita jadikan index array sebagai ID.
            // Jika backend memberi objek { id, url }, kita pakai img.id.
            const urlStr = typeof img === 'string' ? img : (img.image_url || img.url || "");
            const imgId = typeof img === 'object' && img.id !== undefined ? img.id : idx;
            return { id: imgId, raw_url: urlStr, preview: getCleanImageUrl(urlStr) };
          });
        } else if (item.cover_image_url) {
          // Fallback jika array kosong tapi cover ada
          parsedImages = [{ id: 0, raw_url: item.cover_image_url, preview: getCleanImageUrl(item.cover_image_url) }];
        }

        setExistingImages(parsedImages);
        setDeletedImageIds([]);
        setNewImages([]);

        setEditingProduct({
          id: item.id,
          name: item.name,
          description: item.description || "",
          category_id: item.category_id.toString(),
          stock: item.stock.toString(),
          price_formatted: new Intl.NumberFormat("id-ID").format(item.price)
        });
      } else {
        setNotification({ isOpen: true, message: "Gagal mengambil data lengkap produk.", type: "error" });
      }
    } catch (error) {
      setNotification({ isOpen: true, message: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // --- HANDLER FORM TEKS ---
  const handleEditInputChange = (e: any) => {
    const { name, value } = e.target;
    setEditingProduct((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setEditingProduct((prev: any) => ({ ...prev, price_formatted: rawValue ? new Intl.NumberFormat("id-ID").format(Number(rawValue)) : "" }));
  };

  const handleEditStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setEditingProduct((prev: any) => ({ ...prev, stock: rawValue }));
  };

  // --- HANDLER FOTO ---
  const activeExistingImages = existingImages.filter(img => !deletedImageIds.includes(img.id));
  const totalImagesCount = activeExistingImages.length + newImages.length;

  const handleRemoveExistingImage = (idToRemove: number) => {
    setDeletedImageIds(prev => [...prev, idToRemove]);
  };

  const handleAddNewImage = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (totalImagesCount + files.length > 5) {
      setNotification({ isOpen: true, message: "Maksimal hanya boleh ada total 5 foto!", type: "error" });
      return;
    }
    const newImgs = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages(prev => [...prev, ...newImgs]);
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // --- 2. VALIDASI SEBELUM SUBMIT ---
  const handlePreSubmit = (e: any) => {
    e.preventDefault();
    const finalPrice = Number(editingProduct.price_formatted.replace(/\./g, ""));
    
    if (!editingProduct.name || finalPrice <= 0 || totalImagesCount === 0) {
      setNotification({ isOpen: true, message: "Nama, Harga, dan minimal 1 Foto wajib diisi.", type: "error" });
      return;
    }
    setConfirmAction(() => executeSubmitUpdate); 
  };

  // --- 3. EKSEKUSI API UPDATE (KONTRAK BARU) ---
  const executeSubmitUpdate = async () => {
    setConfirmAction(null); 
    setIsUpdating(true);

    const finalPrice = Number(editingProduct.price_formatted.replace(/\./g, ""));
    const finalStock = Number(editingProduct.stock);

    const payload = new FormData();
    payload.append("name", editingProduct.name);
    payload.append("description", editingProduct.description);
    payload.append("price", finalPrice.toString());
    payload.append("stock", finalStock.toString());
    payload.append("category_id", editingProduct.category_id);
    
    // Array: images_to_delete
    deletedImageIds.forEach(id => {
      payload.append("images_to_delete", id.toString());
    });

    // Array: new_images
    newImages.forEach(img => {
      payload.append("new_images", img.file);
    });

    // Menentukan cover_image_url
    if (activeExistingImages.length > 0) {
      // Jika masih ada gambar lama, jadikan yang paling awal sebagai cover
      payload.append("cover_image_url", activeExistingImages[0].raw_url);
    } else {
      payload.append("cover_image_url", "");
    }

    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";

      const response = await fetch(`${API_BASE}product/v1/update/product/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
        body: payload
      });

      if (response.ok) {
        setNotification({ isOpen: true, message: "Data barang telah berhasil diperbarui!", type: "success" });
        setEditingProduct(null);
        fetchMyProducts(); 
        if (refreshParentKatalog) refreshParentKatalog(); 
      } else {
        const resData = await response.json();
        setNotification({ isOpen: true, message: resData.message || "Gagal memperbarui produk.", type: "error" });
      }
    } catch (error) {
      setNotification({ isOpen: true, message: "Gagal memperbarui karena masalah koneksi.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse">Memuat data barang Anda...</div>;

  return (
    <div className="p-4 pb-24 relative">
      
      {/* LOADING OVERLAY AMBIL DETAIL */}
      {isFetchingDetail && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-white/70 backdrop-blur-sm">
           <div className="flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-[#4461AD] border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-bold text-[#4461AD]">Menyiapkan form edit...</p>
           </div>
        </div>
      )}

      {/* === MODAL NOTIFIKASI === */}
      {notification.isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 text-center shadow-xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
               {notification.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
               ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               )}
            </div>
            <p className="text-sm text-slate-600 font-medium mb-6">{notification.message}</p>
            <button onClick={() => setNotification({ ...notification, isOpen: false })} className="w-full bg-[#4461AD] text-white py-3 rounded-xl font-bold">TUTUP</button>
          </div>
        </div>
      )}

      {/* === MODAL KONFIRMASI === */}
      {confirmAction && (
        <div className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-[420px] p-6 shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
             <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <h3 className="text-lg font-black text-slate-800 mb-2">Konfirmasi Perubahan</h3>
             <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menyimpan perubahan pada barang ini?</p>
             <div className="flex gap-3">
               <button onClick={() => setConfirmAction(null)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold text-sm">BATAL</button>
               <button onClick={confirmAction} className="flex-1 bg-[#4461AD] text-white py-3.5 rounded-xl font-bold text-sm">YA, SIMPAN</button>
             </div>
           </div>
        </div>
      )}

      <h2 className="text-sm font-black text-slate-800 mb-4">Daftar Barang Dagangan Anda</h2>
      
      {myProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-xs">Anda belum mendaftarkan barang untuk dijual.</div>
      ) : (
        <div className="space-y-3">
          {myProducts.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFC516]"></div>
              <img src={item.image_url || "https://images.unsplash.com/photo-1513885045260-6b3086b24c17?auto=format&fit=crop&q=80&w=150&h=150"} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xs font-bold text-slate-800 truncate flex-1">{item.name}</h3>
                  <button onClick={() => openEditModal(item)} className="bg-[#4461AD]/10 text-[#4461AD] px-2.5 py-1 rounded-md text-[9px] font-bold hover:bg-[#4461AD]/20 shrink-0">
                    EDIT
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Stok: {item.stock}</p>
                <p className="text-xs font-black text-[#FFC516] mt-auto">{formatRupiah(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === MODAL EDIT BARANG DENGAN LOGIKA GAMBAR BARU === */}
      {editingProduct && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-[360px] p-5 shadow-2xl overflow-y-auto max-h-[85vh]">
            <h3 className="text-sm font-black text-slate-800 mb-4">Ubah Detail Produk</h3>
            
            <form onSubmit={handlePreSubmit} className="space-y-3.5">
              
              {/* UPLOAD & HAPUS FOTO */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Foto Produk ({totalImagesCount}/5) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* 1. Render Foto Bawaan Server */}
                  {activeExistingImages.map((img, idx) => (
                    <div key={`existing-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                      <img src={img.preview} alt="Existing" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveExistingImage(img.id)} className="absolute top-1 right-1 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">✕</button>
                      {idx === 0 && (
                         <div className="absolute bottom-0 left-0 right-0 bg-[#4461AD]/80 backdrop-blur-sm text-white text-[8px] font-bold text-center py-0.5">SAMPUL</div>
                      )}
                    </div>
                  ))}

                  {/* 2. Render Foto Baru (Lokal) */}
                  {newImages.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#4461AD] border-dashed">
                      <img src={img.preview} alt="New" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveNewImage(idx)} className="absolute top-1 right-1 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">✕</button>
                      {/* Label Baru */}
                      <div className="absolute top-1 left-1 bg-[#FFC516] text-slate-800 text-[8px] px-1 font-bold rounded-sm shadow-sm">BARU</div>
                    </div>
                  ))}
                  
                  {/* 3. Tombol Tambah */}
                  {totalImagesCount < 5 && (
                    <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                      <svg className="h-6 w-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      <span className="text-[8px] text-slate-500 font-bold">Tambah</span>
                      <input type="file" accept="image/*" multiple onChange={handleAddNewImage} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Barang</label>
                <input type="text" name="name" value={editingProduct.name} onChange={handleEditInputChange} required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4461AD]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Harga (Rp)</label>
                  <input type="tel" value={editingProduct.price_formatted} onChange={handleEditHargaChange} required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4461AD]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Stok</label>
                  <input type="tel" name="stock" value={editingProduct.stock} onChange={handleEditStockChange} required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4461AD]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kategori</label>
                <select name="category_id" value={editingProduct.category_id} onChange={handleEditInputChange} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4461AD] bg-white">
                  {KATEGORI_STATIC.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Deskripsi</label>
                <textarea name="description" value={editingProduct.description} onChange={handleEditInputChange} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4461AD] resize-none" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-slate-100 py-3 rounded-xl text-slate-700 font-bold text-xs">BATAL</button>
                <button type="submit" disabled={isUpdating} className="flex-1 bg-[#4461AD] text-white py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2">
                  {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "SIMPAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}