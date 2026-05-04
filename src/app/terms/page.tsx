import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Syarat dan Ketentuan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Pendahuluan</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Dengan mengakses dan menggunakan TOEFLLYNK (&quot;Platform&quot;), Anda соглашаетесь untuk
              terikat dengan Syarat dan Ketentuan (&quot;Ketentuan&quot;) ini. Jika Anda tidak setuju dengan
              Ketentuan ini, mohon untuk tidak menggunakan Platform kami.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Definisi</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p><strong>&quot;Platform&quot;</strong> означает TOEFLLYNK, situs web, aplikasi, dan layanan terkait.</p>
              <p><strong>&quot;Pengguna&quot;</strong> означает siapa pun yang mengakses atau menggunakan Platform.</p>
              <p><strong>&quot;Seller&quot;</strong> означает pengguna yang membuat dan menjual produk digital.</p>
              <p><strong>&quot;Buyer&quot;</strong> означает pengguna yang membeli produk dari Seller.</p>
              <p><strong>&quot;Affiliate&quot;</strong> означает pengguna yang mempromosikan produk untuk komisi.</p>
              <p><strong>&quot;Produk&quot;</strong> означает produk digital yang dijual di Platform.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. Akun dan Registrasi</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>3.1 Anda harus berusia minimal 18 tahun atau memiliki persetujuan orang tua untuk menggunakan Platform.</p>
              <p>3.2 Anda bertanggung jawab untuk menjaga kerahasiaan akun dan kata sandi Anda.</p>
              <p>3.3 Anda setuju untuk memberikan informasi yang akurat dan lengkap saat registrasi.</p>
              <p>3.4 Satu orang hanya boleh memiliki satu akun. Akun duplikat akan ditangguhkan.</p>
              <p>3.5 Anda bertanggung jawab atas semua aktivitas yang terjadi di akun Anda.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Produk dan Penjualan</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>4.1 <strong>Kualitas Konten:</strong> Seller wajib memastikan produk original atau memiliki hak yang sah.</p>
              <p>4.2 <strong>Deskripsi Akurat:</strong> Semua informasi produk harus akurat dan tidak menyesatkan.</p>
              <p>4.3 <strong>Harga:</strong> Seller menentukan harga produk. Harga minimal Rp 1.000.</p>
              <p>4.4 <strong>Pengiriman:</strong> Produk digital dikirim otomatis setelah pembayaran confirmed.</p>
              <p>4.5 <strong>Konten Terlarang:</strong> Dilarang menjual konten illegal, pornografi, atau yang melanggar hak cipta.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Affiliate Program</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>5.1 Affiliate bisa mempromosikan produk menggunakan link affiliate unik.</p>
              <p>5.2 Komisi default adalah 10% dari harga produk, dapat diubah oleh Seller.</p>
              <p>5.3 Komisi dihitung berdasarkan penjualan yang successfully processed.</p>
              <p>5.4 Affiliate tidak boleh menggunakan spam, misleading claims, atau tactics yang melanggar hukum.</p>
              <p>5.5 Pembayaran komisi dilakukan setiap bulan dengan minimum penarikan Rp 50.000.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Pembayaran</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>6.1 Semua pembayaran diproses melalui Midtrans dan metode payment yang tersedia.</p>
              <p>6.2 Harga yang ditampilkan sudah termasuk semua pajak yang berlaku.</p>
              <p>6.3 <strong>Refund:</strong> Kebijakan refund adalah tanggung jawab masing-masing Seller. TOEFLLYNK tidak automatic memproses refund.</p>
              <p>6.4 Seller menerima pembayaran setelah dikurangi platform fee dan komisi affiliate (jika ada).</p>
              <p>6.5 Pembayaran ke Seller diproses dalam 1-3 hari kerja setelah penarikan requested.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Platform Fee</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>7.1 TOEFLLYNK mengambil fee sebesar 10% dari setiap transaksi successful.</p>
              <p>7.2 Fee ini sudah termasuk dalam harga produk dan tidak dibebankan extra ke Buyer.</p>
              <p>7.3 Fee bisa berubah di masa depan dengan pemberitahuan 30 hari sebelumnya.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Hak Kekayaan Intelektual</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>8.1 Semua konten di Platform dilindungi oleh hak cipta dan hukum kekayaan intelektual lainnya.</p>
              <p>8.2 Seller mempertahankan hak atas produk yang mereka buat.</p>
              <p>8.3 Buyer mendapatkan lisensi untuk menggunakan produk sesuai dengan ketentuan Seller.</p>
              <p>8.4 Dilarang mendistribusikan, mereproduksi, atau menjual ulang produk tanpa izin.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">9. Tanggung Jawab</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>9.1 TOEFLLYNK tidak bertanggung jawab atas konten atau kualitas produk yang dijual.</p>
              <p>9.2 TOEFLLYNK tidak bertanggung jawab atas dispute antara Seller dan Buyer.</p>
              <p>9.3 Seller bertanggung jawab untuk memastikan produk mereka legal dan tidak infringe hak pihak lain.</p>
              <p>9.4 Pengguna setuju untuk indemnify TOEFLLYNK dari klaim yang arising dari penggunaan mereka.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">10. Pembatasan Penggunaan</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Anda tidak boleh menggunakan Platform untuk:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
              <li>Kegiatan illegal atau melanggar hukum</li>
              <li>Spam atau distribusi malware</li>
              <li>Pelanggaran hak cipta atau kekayaan intelektual</li>
              <li>Pemalsuan identitas atau representasi palsu</li>
              <li>Gangguan terhadap operasi Platform</li>
              <li>Pengumpulan data pengguna secara unauthorized</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">11. Penangguhan dan Pengakhiran</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>11.1 TOEFLLYNK berhak menangguhkan atau mengakhiri akun yang melanggar Ketentuan.</p>
              <p>11.2 Kami berhak menutup Platform atau layanan dengan pemberitahuan 30 hari.</p>
              <p>11.3 Após terminasi, data Anda akan disimpan sesuai dengan kebijakan retensi kami.</p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">12. Perubahan Ketentuan</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami dapat mengubah Ketentuan ini dari waktu ke waktu. Perubahan akan diposting di
              halaman ini. Penggunaan berkelanjutan setelah perubahan означает Anda menerima
              Ketentuan yang direvisi.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">13. Hukum yang Mengatur</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Ketentuan ini diatur oleh hukum Indonesia. Setiap dispute akan diselesaikan di
              pengadilan yang competente di Indonesia.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">14. Hubungi Kami</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami:
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-700">
                <strong>Email:</strong> legal@toefllynk.com<br />
                <strong>Website:</strong> <Link href="/contact" className="text-blue-600 hover:underline">toefllynk.com/contact</Link>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} TOEFLLYNK. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-slate-500 hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-900">Terms</Link>
              <Link href="/contact" className="text-slate-500 hover:text-slate-900">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}