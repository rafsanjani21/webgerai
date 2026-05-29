import React from 'react';

interface TncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function TncModal({ isOpen, onClose, onAgree }: TncModalProps) {
  if (!isOpen) return null;

  return (
    // Wrapper: align-bottom di mobile, align-center di desktop
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm sm:p-6 animate-in fade-in duration-300">
      
      {/* Modal Container: Bottom sheet di mobile (rounded-t), Popup di desktop (rounded-3xl) */}
      <div className="bg-white w-full sm:max-w-3xl h-[92dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        
        {/* Header Modal (Sticky) */}
        <div className="px-5 sm:px-8 pt-4 pb-4 border-b border-slate-100 flex flex-col bg-white z-10 shrink-0">
          {/* Drag Handle (Visual untuk mobile) */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
          
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-800 tracking-tight leading-tight">Syarat & Ketentuan</h2>
            </div>
            
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Konten TnC (Scrollable) */}
        <div className="p-5 sm:p-8 overflow-y-auto text-sm text-slate-600 space-y-7 bg-slate-50/50 flex-grow">
          
          <div className="bg-blue-50 border border-blue-100 p-4 sm:p-5 rounded-2xl">
            <p className="font-bold text-blue-900 mb-2 text-sm">PENGGUNAAN APLIKASI KOPERASI GERAKAN RAKYAT EKONOMI INDONESIA (GERAI)</p>
            <p className="text-blue-800/80 leading-relaxed text-xs sm:text-sm">
              Dengan mengakses atau menggunakan aplikasi KOPERASI GERAKAN RAKYAT EKONOMI INDONESIA (GERAI) (&ldquo;Aplikasi&rdquo;), pengguna menyatakan telah membaca, memahami, menyetujui, dan terikat oleh Syarat & Ketentuan ini (&ldquo;TnC&rdquo;). Apabila pengguna tidak menyetujui salah satu ketentuan, maka pengguna tidak diperkenankan menggunakan Aplikasi.
            </p>
          </div>

          <div className="space-y-6">
            {/* Poin 1 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">1</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Definisi</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm">
                  <li><strong className="text-slate-700">Koperasi GERAI:</strong> Koperasi Gerakan Rakyat Ekonomi Indonesia sebagai pemilik, pengelola, dan penyelenggara Aplikasi.</li>
                  <li><strong className="text-slate-700">Aplikasi:</strong> Platform digital milik Koperasi GERAI yang menyediakan layanan informasi, simpan pinjam, transaksi koperasi, anggota, dan layanan lain yang disediakan koperasi.</li>
                  <li><strong className="text-slate-700">Pengguna:</strong> Individu atau badan yang mengakses atau menggunakan Aplikasi, baik sebagai Anggota maupun Non-Anggota.</li>
                  <li><strong className="text-slate-700">Anggota:</strong> Pengguna yang telah terdaftar secara sah sebagai anggota koperasi berdasarkan Undang-Undang Perkoperasian.</li>
                  <li><strong className="text-slate-700">Data Pribadi:</strong> Informasi terkait individu yang memungkinkan identifikasi, termasuk tetapi tidak terbatas pada nama, alamat, NIK, kontak, foto, dan data transaksi.</li>
                </ul>
              </div>
            </div>

            {/* Poin 2 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">2</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Ruang Lingkup Layanan</span>
                <p className="mb-2 text-slate-500 text-xs sm:text-sm">Aplikasi menyediakan fitur, antara lain:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm mb-3">
                  <li>Informasi keanggotaan koperasi</li>
                  <li>Pendaftaran anggota (apabila tersedia)</li>
                  <li>Layanan simpanan dan pinjaman</li>
                  <li>Riwayat transaksi dan laporan keuangan pribadi</li>
                  <li>Pusat informasi produk koperasi</li>
                  <li>Notifikasi dan komunikasi resmi koperasi</li>
                  <li>Fitur lain yang dapat ditambahkan sewaktu-waktu oleh Koperasi GERAI</li>
                </ul>
                <p className="text-slate-500 leading-relaxed bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200/60 text-[11px] sm:text-xs">Koperasi berhak menambah, mengubah, atau menghentikan sebagian/seluruh layanan kapan saja dengan pemberitahuan.</p>
              </div>
            </div>

            {/* Poin 3 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">3</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Pendaftaran & Akun Pengguna</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm">
                  <li>Pengguna wajib memberikan informasi yang lengkap, benar, dan akurat.</li>
                  <li>Pengguna bertanggung jawab menjaga kerahasiaan akun, password, dan seluruh aktivitas dalam akun.</li>
                  <li>Koperasi tidak bertanggung jawab atas penyalahgunaan akun akibat kelalaian pengguna.</li>
                  <li>Koperasi berhak menolak pendaftaran atau menonaktifkan akun apabila ditemukan pelanggaran.</li>
                </ul>
              </div>
            </div>

            {/* Poin 4 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">4</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Keanggotaan Koperasi</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm">
                  <li>Untuk menggunakan fitur tertentu, pengguna wajib menjadi anggota koperasi secara resmi.</li>
                  <li>Keanggotaan tunduk pada Anggaran Dasar dan Anggaran Rumah Tangga Koperasi GERAI serta peraturan yang berlaku.</li>
                  <li>Hak dan kewajiban anggota mengikuti regulasi koperasi.</li>
                </ul>
              </div>
            </div>

            {/* Poin 5 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">5</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Penggunaan Aplikasi</span>
                <p className="mb-2 text-slate-500 text-xs sm:text-sm">Pengguna dilarang:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm">
                  <li>Menyalahgunakan Aplikasi untuk tindakan melawan hukum.</li>
                  <li>Melakukan penipuan, manipulasi data, atau merugikan anggota lain.</li>
                  <li>Mengunggah konten yang mengandung unsur SARA, pornografi, kekerasan, atau pelanggaran hukum.</li>
                  <li>Menggunakan sistem otomatis (bot/scraping) tanpa izin tertulis.</li>
                  <li>Mengganggu atau merusak sistem Aplikasi.</li>
                </ul>
              </div>
            </div>

            {/* Poin 6 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">6</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Layanan Simpan Pinjam</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm">
                  <li>Setiap transaksi simpanan dan pinjaman mengikuti kebijakan koperasi yang berlaku.</li>
                  <li>Informasi suku bunga, biaya, jangka waktu, dan ketentuan lainnya tercantum pada Aplikasi atau dokumen resmi koperasi.</li>
                  <li>Pengajuan pinjaman dapat ditolak apabila tidak memenuhi syarat.</li>
                </ul>
              </div>
            </div>

            {/* Poin 7 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">7</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Data Pribadi & Kerahasiaan</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm mb-2">Koperasi GERAI mengumpulkan, menggunakan, dan melindungi Data Pribadi sesuai peraturan perundang-undangan (UU PDP, UU ITE, dsb). Data Pribadi digunakan untuk keperluan: verifikasi akun, proses keanggotaan, transaksi dan layanan koperasi, peningkatan layanan Aplikasi, komunikasi resmi.</p>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">Data tidak akan dijual kepada pihak ketiga. Koperasi dapat membagikan data kepada pihak ketiga terbatas (mitra sistem pembayaran, vendor IT) dengan perlindungan keamanan. Pengguna dapat meminta penghapusan data sesuai kebijakan dan hukum yang berlaku.</p>
              </div>
            </div>

            {/* Poin 8 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">8</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Keamanan Sistem</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">Koperasi melakukan langkah wajar untuk menjaga keamanan data dan sistem. Risiko keamanan digital yang berada di luar kendali koperasi (serangan siber, malware, gangguan pihak ketiga) tidak sepenuhnya menjadi tanggung jawab koperasi.</p>
              </div>
            </div>

            {/* Poin 9 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">9</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Pembayaran & Biaya Layanan</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">Pembayaran dalam Aplikasi diselesaikan melalui metode resmi yang disediakan. Setiap biaya administrasi, bunga, atau potongan transaksi akan diinformasikan secara transparan. Kesalahan transfer karena kelalaian pengguna bukan tanggung jawab koperasi.</p>
              </div>
            </div>

            {/* Poin 10 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">10</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Force Majeure</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">Koperasi dibebaskan dari kewajiban apabila terjadi keadaan di luar kendali seperti: bencana alam, kebakaran, banjir, perang, kerusuhan, kegagalan sistem, pemadaman listrik besar, sabotase, serangan siber, kebijakan pemerintah, epidemi, atau kejadian ekstrem lain yang tidak dapat diprediksi.</p>
              </div>
            </div>

            {/* Poin 11 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">11</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Pembatasan Tanggung Jawab</span>
                <p className="mb-2 text-slate-500 text-xs sm:text-sm">Koperasi tidak bertanggung jawab atas:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-xs sm:text-sm">
                  <li>Kerugian yang terjadi akibat kesalahan pengguna</li>
                  <li>Gangguan pihak ketiga atau gangguan teknis di luar kendali koperasi</li>
                  <li>Penggunaan Aplikasi yang tidak sesuai aturan</li>
                </ul>
              </div>
            </div>

            {/* Poin 12 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">12</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Perubahan Syarat & Ketentuan</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">Koperasi berhak mengubah TnC dari waktu ke waktu. Perubahan akan diumumkan melalui Aplikasi. Penggunaan berkelanjutan dianggap sebagai persetujuan.</p>
              </div>
            </div>

            {/* Poin 13 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">13</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Bahasa</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">Apabila terdapat perbedaan interpretasi, versi Bahasa Indonesia menjadi acuan utama.</p>
              </div>
            </div>

            {/* Poin 14 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">14</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Hukum yang Berlaku</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">TnC ini diatur oleh hukum Republik Indonesia. Setiap sengketa diselesaikan melalui musyawarah. Jika tidak tercapai, maka melalui pengadilan sesuai domisili koperasi.</p>
              </div>
            </div>

            {/* Poin 15 */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 mt-0.5">15</div>
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 text-sm sm:text-base">Kontak & Layanan Pengaduan</span>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm mb-3">Koperasi GERAI menyediakan layanan pengaduan melalui:</p>
                
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="text-base sm:text-lg">✉️</span>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 break-all">Koperasigeraikemas@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="text-base sm:text-lg">📞</span>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Telepon</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700">+62 821-7373-6060</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="text-base sm:text-lg">🏢</span>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Alamat Kantor</p>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">Jl. Rawamangun Muka Timur No.78, RT.05/RW.012, Rawamangun, Kec. Pulo Gadung, Kota Jakarta Timur, DKI Jakarta 13220</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal (Sticky with safe-area padding for mobile) */}
        <div className="px-5 sm:px-8 pt-4 pb-6 sm:pb-5 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white z-10 shrink-0">
          <button 
            onClick={onClose}
            className="w-1/3 py-3.5 sm:py-3.5 rounded-xl font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors text-xs sm:text-sm"
          >
            Tutup
          </button>
          <button 
            onClick={onAgree}
            className="w-2/3 py-3.5 sm:py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
            Mengerti & Setuju
          </button>
        </div>

      </div>
    </div>
  );
}