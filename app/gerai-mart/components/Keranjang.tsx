"use client";
import { useState } from "react";

const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

export default function Keranjang({ cart, setCart }: { cart: any[], setCart: any }) {
  const [notification, setNotification] = useState({ isOpen: false, message: "" });

  const totalBelanja = cart.reduce((total, item) => total + (item.harga * item.qty), 0);

  const hapusItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    setNotification({ isOpen: true, message: `Pesanan berhasil dibuat! Segera hubungi penjual untuk proses pembayaran.` });
    setCart([]); // Kosongkan keranjang setelah checkout
  };

  if (cart.length === 0) {
    return (
      <div className="p-4 py-32 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-1">Keranjang Kosong</h2>
        <p className="text-sm text-slate-500">Yuk, cari barang menarik di Gerai Mart!</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-36">
      <h2 className="text-sm font-black text-slate-800 mb-4">Keranjang Belanja</h2>
      
      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3">
            <img src={item.gambar[0]} alt={item.nama} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            <div className="flex flex-col flex-1">
              <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{item.nama}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Penjual: {item.penjual}</p>
              
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Harga Satuan</p>
                  <p className="text-sm font-black text-[#FFC516]">{formatRupiah(item.harga)}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md mb-1">{item.qty}x Item</p>
                  <button onClick={() => hapusItem(item.id)} className="text-[9px] font-bold text-rose-500 hover:underline">Hapus</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rincian Bayar Sticky */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-slate-200 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-slate-500">Total Belanja</p>
          <p className="text-lg font-black text-[#FFC516]">{formatRupiah(totalBelanja)}</p>
        </div>
        <button onClick={handleCheckout} className="w-full bg-[#4461AD] text-white py-3.5 rounded-xl font-black text-sm tracking-wide shadow-md hover:bg-blue-800">
          CHECKOUT SEKARANG
        </button>
      </div>

      {notification.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-slate-600 font-medium mb-6" dangerouslySetInnerHTML={{ __html: notification.message }}></p>
            <button onClick={() => setNotification({ isOpen: false, message: "" })} className="w-full bg-[#4461AD] text-white py-3 rounded-xl font-bold text-xs">TUTUP</button>
          </div>
        </div>
      )}
    </div>
  );
}