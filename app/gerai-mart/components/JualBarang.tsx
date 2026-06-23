"use client";
import { useState } from "react";

const KATEGORI_STATIC = [
  { id: "1", name: "Sembako" },
  { id: "2", name: "Pakaian" },
  { id: "3", name: "Makanan dan Minuman" },
  { id: "4", name: "Lainnya" }
];

export default function JualBarang({ onSimpanSukses }: { onSimpanSukses: () => void }) {
  const [formData, setFormData] = useState({ 
    name: "", 
    price: "", 
    stock: "", 
    category_id: "1", 
    description: "" 
  });
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk Modals
  const [notification, setNotification] = useState({ isOpen: false, message: "", type: "success" });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessRedirect, setIsSuccessRedirect] = useState(false);

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setFormData(prev => ({ ...prev, price: "" }));
      return;
    }
    const formattedValue = new Intl.NumberFormat("id-ID").format(Number(rawValue));
    setFormData(prev => ({ ...prev, price: formattedValue }));
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, stock: rawValue }));
  };

  const handleImageChange = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (imageFiles.length + files.length > 5) {
      setNotification({ isOpen: true, message: "Maksimal hanya boleh mengunggah 5 foto!", type: "error" });
      return;
    }
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- 1. TAHAP VALIDASI & MUNCULKAN KONFIRMASI ---
  const handlePreSubmit = (e: any) => {
    e.preventDefault();
    const rawPrice = Number(formData.price.replace(/\./g, ""));

    if (!formData.name || rawPrice <= 0 || imageFiles.length === 0) {
      setNotification({ isOpen: true, message: "Nama, Harga, dan minimal 1 Foto wajib diisi!", type: "error" });
      return;
    }

    setIsConfirmOpen(true); // Buka modal konfirmasi
  };

  // --- 2. TAHAP EKSEKUSI API SETELAH DIKONFIRMASI ---
  const executeSubmit = async () => {
    setIsConfirmOpen(false); // Tutup konfirmasi
    setIsLoading(true);

    const rawPrice = Number(formData.price.replace(/\./g, ""));
    const rawStock = Number(formData.stock);

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("price", rawPrice.toString());
    payload.append("stock", rawStock.toString());
    payload.append("category_id", formData.category_id);
    imageFiles.forEach(file => payload.append("images", file));

    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api/";
      
      const response = await fetch(`${API_BASE}product/v1/create-product`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: payload,
      });

      const resData = await response.json();

      if (response.ok) {
        setIsSuccessRedirect(true); // Tandai bahwa saat modal ditutup, harus pindah tab
        setNotification({ isOpen: true, message: "Barang berhasil terunggah ke pasar!", type: "success" });
        setFormData({ name: "", price: "", stock: "", description: "", category_id: "1" });
        setImagePreviews([]);
        setImageFiles([]);
      } else {
        setNotification({ isOpen: true, message: resData.message || "Gagal menambahkan produk.", type: "error" });
      }
    } catch (error) {
      setNotification({ isOpen: true, message: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. HANDLER TUTUP NOTIFIKASI ---
  const handleCloseNotification = () => {
    setNotification({ ...notification, isOpen: false });
    if (isSuccessRedirect) {
      setIsSuccessRedirect(false);
      onSimpanSukses();
    }
  };

  return (
    <div className="p-4 pb-24 relative">
      
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
            <button type="button" onClick={handleCloseNotification} className="w-full bg-[#4461AD] text-white py-3 rounded-xl font-bold text-sm">
              {isSuccessRedirect ? "LIHAT BARANG SAYA" : "TUTUP"}
            </button>
          </div>
        </div>
      )}

      {/* === MODAL KONFIRMASI JUAL === */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-[420px] p-6 shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
             <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </div>
             <h3 className="text-lg font-black text-slate-800 mb-2">Konfirmasi Jual Barang</h3>
             <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin mau menjual barang ini di Gerai Mart?</p>
             <div className="flex gap-3">
               <button onClick={() => setIsConfirmOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold text-sm">BATAL</button>
               <button onClick={executeSubmit} className="flex-1 bg-[#4461AD] text-white py-3.5 rounded-xl font-bold text-sm">YA, JUAL</button>
             </div>
           </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-white/60 backdrop-blur-sm">
           <div className="flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-[#4461AD] border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-bold text-[#4461AD]">Mengunggah barang...</p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <form onSubmit={handlePreSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Foto Produk (Maks 5) *</label>
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                  <svg className="h-6 w-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <span className="text-[8px] text-slate-500 font-bold">Tambah ({imagePreviews.length}/5)</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nama Barang *</label>
             <input type="text" name="name" value={formData.name} onChange={handleFormChange} required placeholder="Misal: Kripik Singkong Balado" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4461AD]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Harga (Rp) *</label>
               <input type="tel" name="price" value={formData.price} onChange={handleHargaChange} required placeholder="0" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4461AD]" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Stok Tersedia *</label>
               <input type="tel" name="stock" value={formData.stock} onChange={handleStockChange} required placeholder="0" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4461AD]" />
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kategori</label>
             <select name="category_id" value={formData.category_id} onChange={handleFormChange} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4461AD] bg-white">
               {KATEGORI_STATIC.map(kat => <option key={kat.id} value={kat.id}>{kat.name}</option>)}
             </select>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Deskripsi Produk</label>
             <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} placeholder="Jelaskan detail barang..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4461AD] resize-none"></textarea>
          </div>

          <button disabled={isLoading} type="submit" className="w-full bg-[#FFC516] text-[#4461AD] py-3.5 rounded-xl font-black text-sm mt-4 shadow-sm transition-colors flex justify-center items-center gap-2">
            TAMPILKAN KE PASAR
          </button>
        </form>
      </div>
    </div>
  );
}