import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Kebijakan Privasi
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Pendahuluan</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              TOEFLLYNK (&quot;kami&quot;, &quot; nossa&quot;, atau &quot;kita&quot;) berkomitmen untuk melindungi
              privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan,
              menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda
              menggunakan layanan kami.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Informasi yang Kami Kumpulkan</h2>
            <div className="mt-4 space-y-4 text-slate-600 leading-relaxed">
              <p>Kami mengumpulkan informasi berikut:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>Informasi Akun:</strong> Nama, alamat email, nomor telepon, dan kata sandi</li>
                <li><strong>Informasi Profil:</strong> Foto, bio, dan informasi lain yang Anda berikan</li>
                <li><strong>Data Transaksi:</strong> Riwayat pembelian, detail pembayaran, dan informasi invoice</li>
                <li><strong>Data Penggunaan:</strong> Log aktivitas, preferensi, dan interaksi dengan platform</li>
                <li><strong>Data Teknis:</strong> Alamat IP, tipe browser, device identifier, dan cookie</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. Penggunaan Informasi</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
              <li>Menyediakan dan meningkatkan layanan kami</li>
              <li>Memproses transaksi dan mengirim notifikasi</li>
              <li>Mengirim komunikasi pemasaran (dengan persetujuan Anda)</li>
              <li>Mencegah penipuan dan memastikan keamanan platform</li>
              <li>Mematuhi kewajiban hukum dan regulasi</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Pembagian Informasi</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami tidak menjual informasi pribadi Anda kepada pihak ketiga. Kami mungkin membagikan
              informasi dalam situasi berikut:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
              <li><strong>Penjual (Seller):</strong> Informasi pesanan dibagikan ke penjual produk</li>
              <li><strong>Penayment Gateway:</strong> Data transaksi diproses melalui Midtrans</li>
              <li><strong>Layanan Third-Party:</strong> Analitik, email service, dan hosting providers</li>
              <li><strong>Kepatuhan Hukum:</strong> Jika diperlukan oleh hukum atau proses hukum</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Keamanan Data</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi informasi Anda,
              termasuk enkripsi data, firewall, dan prosedur akses terbatas. Namun, tidak ada metode
              transmisi internet yang 100% aman, dan kami tidak dapat menjamin keamanan absolute.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Cookie dan Teknologi Tracking</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami menggunakan cookie dan teknologi similar untuk:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
              <li>Memremember preferensi dan pengaturan Anda</li>
              <li>Menganalisis trafik dan penggunaan website</li>
              <li>Menyediakan pengalaman yang dipersonalisasi</li>
              <li>Menampilkan iklan yang relevan (jika applicable)</li>
            </ul>
            <p className="mt-4 text-slate-600">
              Anda dapat mengatur preferensi cookie melalui browser Anda.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Hak Anda</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Anda memiliki hak untuk:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
              <li>Mengakses data pribadi Anda</li>
              <li>Memperbaiki informasi yang tidak akurat</li>
              <li>Menghapus data Anda (dengan batas implementasi)</li>
              <li>Menarik persetujuan pemasaran</li>
              <li>Mengajukan keberatan atas pemrosesan tertentu</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Retensi Data</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami menyimpan data pribadi Anda selama diperlukan untuk menyediakan layanan dan
              memenuhi tujuan bisnis yang sah. Data yang tidak lagi diperlukan akan dihapus atau
              dianonimisasi sesuai dengan kebijakan retensi kami.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">9. Perubahan Kebijakan</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan
              diposting di halaman ini dengan tanggal &quot;Terakhir diperbarui&quot; yang direvisi.
              Kami encourage Anda untuk reviewing kebijakan ini secara berkala.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">10. Hubungi Kami</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="text-slate-700">
                <strong>Email:</strong> privacy@toefllynk.com<br />
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