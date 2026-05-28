import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { Upload, Check, AlertCircle, Building2, Trash2, Image as ImageIcon } from "lucide-react";

export default function Pengaturan() {
  const hospitalLogo = useStore((state) => state.hospitalLogo);
  const setHospitalLogo = useStore((state) => state.setHospitalLogo);

  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [bgImage, setBgImage] = useState("");
  const [bgUploading, setBgUploading] = useState(false);
  const [bgSuccessMsg, setBgSuccessMsg] = useState("");
  const [bgErrorMsg, setBgErrorMsg] = useState("");
  const [isBgDragOver, setIsBgDragOver] = useState(false);

  const [showGuide, setShowGuide] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Load current logo from store / localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem("hospital_logo");
    if (savedLogo) {
      setHospitalLogo(savedLogo);
    }
    
    // Load background image
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from("welcome_settings").select("*").eq("id", "1");
        if (data && data.length > 0 && data[0].image_url) {
          setBgImage(data[0].image_url);
        }
      } catch (e) {
        console.warn("Could not load welcome settings", e);
      }
    };
    loadSettings();
  }, [setHospitalLogo]);

  // Convert image file to Base64 (for local fallback storage)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Format berkas harus berupa gambar (PNG, JPG, JPEG)!");
      return;
    }
    
    // Check size limit: 2MB max
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar terlalu besar! Maksimal adalah 2MB.");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // Read as base64 for real-time reactivity and local fallback
      const base64String = await fileToBase64(file);

      // Check if Supabase URL is placeholder
      const isPlaceholderSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL === undefined ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === undefined ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-key");

      if (isPlaceholderSupabase) {
        // Safe sandbox fallback
        localStorage.setItem("hospital_logo", base64String);
        setHospitalLogo(base64String);
        setSuccessMsg(
          "Logo berhasil diperbarui dan disimpan secara lokal! (Supabase menggunakan kredensial default/placeholder)."
        );
      } else {
        // Attempt genuine Supabase upload to storage bucket
        const fileExt = file.name.split(".").pop();
        const fileName = `hospital-logo-${Date.now()}.${fileExt}`;
        const bucketName = "logos";
        let logoUrl = "";
        let storageSuccess = false;

        try {
          // Step 1: Upload the file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // Step 2: Retrieve the public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          logoUrl = urlData.publicUrl;
          storageSuccess = true;
        } catch (storageErr: any) {
          console.warn("Storage upload failed, falling back to base64 encoding", storageErr);
          logoUrl = base64String;
        }

        // Step 3: Save setting metadata in dynamic settings table
        let dbSuccess = false;
        try {
          const { error: dbError } = await supabase.from("welcome_settings").upsert(
            { id: "logo", image_url: logoUrl },
            { onConflict: "id" }
          );

          if (dbError) {
            throw dbError;
          }
          dbSuccess = true;
        } catch (dbErr: any) {
          console.warn("Database welcome_settings table upsert failed:", dbErr);
        }

        // Always save to state and localStorage to keep it loaded and reactive across refreshes/restarts
        localStorage.setItem("hospital_logo", logoUrl);
        setHospitalLogo(logoUrl);

        if (storageSuccess && dbSuccess) {
          setSuccessMsg("Logo RS berhasil diunggah ke Supabase Storage & Database Settings secara permanen!");
        } else if (dbSuccess) {
          setSuccessMsg("Logo berhasil disimpan di Supabase Database! (Pengunggahan ke Storage Bucket dialihkan karena limitasi bucket).");
        } else if (storageSuccess) {
          setSuccessMsg("Logo berhasil diunggah ke Supabase Storage! (Penyimpanan database dialihkan karena pembatasan tabel).");
        } else {
          setSuccessMsg("Logo berhasil diubah dan disimpan secara lokal di browser Anda!");
          setErrorMsg("Catatan: Integrasi cloud penuh gagal (Invalid path/nama bucket/tabel tidak ditemukan). Silakan cek panduan Supabase di bawah.");
          setShowGuide(true);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(`Gagal mengunggah ke Supabase (${err.message || err.toString()}). Menyimpan secara lokal di browser.`);
      setShowGuide(true);
      try {
        const base64String = await fileToBase64(file);
        localStorage.setItem("hospital_logo", base64String);
        setHospitalLogo(base64String);
      } catch (localErr) {}
    } finally {
      setUploading(false);
    }
  };

  const handleBgUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setBgErrorMsg("Format berkas harus berupa gambar (PNG, JPG, JPEG)!");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBgErrorMsg("Ukuran gambar terlalu besar! Maksimal adalah 2MB.");
      return;
    }

    try {
      setBgUploading(true);
      setBgErrorMsg("");
      setBgSuccessMsg("");

      const base64String = await fileToBase64(file);

      const isPlaceholderSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL === undefined ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === undefined ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-key");

      if (isPlaceholderSupabase) {
        setBgImage(base64String);
        setBgSuccessMsg("Background berhasil diperbarui secara lokal (Supabase menggunakan kredensial placeholder).");
      } else {
        const fileExt = file.name.split(".").pop();
        const fileName = `welcome-bg-${Date.now()}.${fileExt}`;
        const bucketName = "backgrounds";
        let uploadedUrl = "";

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, { cacheControl: "3600", upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          uploadedUrl = urlData.publicUrl;
        } else {
          uploadedUrl = base64String;
        }

        const { error: dbError } = await supabase.from("welcome_settings").upsert(
          { id: "1", image_url: uploadedUrl },
          { onConflict: "id" }
        );

        if (dbError) throw dbError;

        setBgImage(uploadedUrl);
        setBgSuccessMsg("Gambar background berhasil diunggah ke Supabase secara permanen!");
      }
    } catch (err: any) {
      console.error("BG Upload error:", err);
      setBgErrorMsg(`Gagal memproses background (${err.message}).`);
    } finally {
      setBgUploading(false);
    }
  };

  const handleRemoveBg = async () => {
    setBgImage("");
    try {
      await supabase.from("welcome_settings").delete().eq("id", "1");
    } catch (err) {}
    setBgSuccessMsg("Background berhasil dihapus. Menggunakan gambar bawaan.");
    setBgErrorMsg("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = async () => {
    localStorage.removeItem("hospital_logo");
    setHospitalLogo("");
    
    try {
      await supabase.from("welcome_settings").delete().eq("id", "logo");
    } catch (err) {
      console.warn("Could not delete from Supabase settings table", err);
    }

    setSuccessMsg("Logo RS berhasil dihapus. Menggunakan ikon bawaan.");
    setErrorMsg("");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-emerald-900 tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-gray-900 mt-1 text-[15px] font-medium">
          Kelola aset rumah sakit, logo institusi, dan konfigurasi data terintegrasi.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_30px_-5px_rgba(0,0,0,0.05)] border border-gray-100 p-8 space-y-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Building2 className="text-emerald-500" size={22} />
            Identitas & Logo Rumah Sakit
          </h2>
          <p className="text-gray-500 text-sm">
            Logo ini akan diintegrasikan langsung pada menu bilah sisi (Sidebar) dan kop laporan dinamis UOBK RSUD AL-MULK Kota Sukabumi.
          </p>
        </div>

        {/* Messaging banners */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Logo Integration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo Preview */}
          <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 p-8 rounded-2xl text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Pratinjau Logo
            </span>
            <div className="h-28 w-28 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden mb-4 p-1 relative group">
              {hospitalLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hospitalLogo}
                  alt="Hospital logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <Building2 size={40} className="text-gray-300" />
                  <span className="text-[10px] font-bold text-gray-400 mt-2">Bawaan (Default)</span>
                </div>
              )}
            </div>
            {hospitalLogo && (
              <button
                onClick={handleRemoveLogo}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200/50"
              >
                <Trash2 size={13} />
                Hapus Logo
              </button>
            )}
          </div>

          {/* Drag & Drop Upload Space */}
          <div className="md:col-span-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-emerald-500 bg-emerald-50/40 scale-[0.99]"
                  : "border-gray-200 bg-gray-50/30 hover:border-emerald-400 hover:bg-emerald-50/5"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="bg-emerald-100 text-emerald-600 p-3.5 rounded-full mb-3.5">
                <Upload size={24} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold text-gray-700">
                {uploading ? (
                  <span className="text-emerald-600 animate-pulse">Mengunggah logo ke Supabase...</span>
                ) : (
                  "Seret & Letakkan logo di sini, atau klik untuk memilih"
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                Format PNG, JPG, atau WEBP (Maks. 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Background Image Integration Panel */}
        <div className="border-t border-gray-100 pt-8 mt-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <ImageIcon className="text-emerald-500" size={22} />
              Gambar Latar (Halaman Depan)
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Pilih gambar latar belakang resolusi tinggi untuk halaman selamat datang utama rumah sakit.
            </p>
          </div>
          
          {bgSuccessMsg && (
            <div className="md:col-span-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-sm font-semibold">{bgSuccessMsg}</p>
            </div>
          )}

          {bgErrorMsg && (
            <div className="md:col-span-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{bgErrorMsg}</p>
            </div>
          )}

          {/* BG Preview */}
          <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 p-8 rounded-2xl text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Pratinjau Background
            </span>
            <div className="h-28 w-full rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden mb-4 p-0 relative group">
              {bgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bgImage}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <ImageIcon size={40} className="text-gray-300" />
                  <span className="text-[10px] font-bold text-gray-400 mt-2">Gambar Bawaan</span>
                </div>
              )}
            </div>
            {bgImage && (
              <button
                onClick={handleRemoveBg}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200/50"
              >
                <Trash2 size={13} />
                Kembalikan Default
              </button>
            )}
          </div>

          {/* BG Drag & Drop Upload Space */}
          <div className="md:col-span-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsBgDragOver(true); }}
              onDragLeave={() => setIsBgDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsBgDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleBgUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => bgFileInputRef.current?.click()}
              className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                isBgDragOver
                  ? "border-emerald-500 bg-emerald-50/40 scale-[0.99]"
                  : "border-gray-200 bg-gray-50/30 hover:border-emerald-400 hover:bg-emerald-50/5"
              }`}
            >
              <input
                type="file"
                ref={bgFileInputRef}
                onChange={(e) => e.target.files && e.target.files[0] && handleBgUpload(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
              <div className="bg-emerald-100 text-emerald-600 p-3.5 rounded-full mb-3.5">
                <Upload size={24} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold text-gray-700">
                {bgUploading ? (
                  <span className="text-emerald-600 animate-pulse">Mengunggah gambar...</span>
                ) : (
                  "Seret & Letakkan gambar di sini, atau klik untuk memilih"
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                Pilih format pemandangan rasio 16:9 (Maks. 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Supabase Permanent Configuration Guide */}
        <div className="border-t border-gray-100 pt-8 mt-6">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#10a37f] transition-colors"
          >
            <span className={`transform transition-transform duration-200 ${showGuide ? "rotate-90" : ""}`}>▶</span>
            {showGuide ? "Sembunyikan Panduan Integrasi Permanen Supabase" : "Tampilkan Panduan Integrasi Permanen Supabase"}
          </button>
          {showGuide && (
            <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 animate-in fade-in duration-300 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-[#10a37f] animate-pulse" />
                <h3 className="font-bold text-sm text-slate-800">Panduan Konfigurasi Supabase Mandiri</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Agar unggahan logo tersimpan secara cloud-permanen dan terintegrasi penuh di Supabase (sehingga tidak hilang setelah refresh/login ulang/beda peramban), silakan lakukan konfigurasi singkat berikut pada akun Supabase Anda:
              </p>
              
              <div className="space-y-4 text-xs font-medium">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mr-1.5">Langkah 1</span>
                  <strong className="text-slate-800">Buat Tabel settings di SQL Editor</strong>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-x-auto mt-1.5 font-mono text-[11px] select-all">
{`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Izinkan akses publik untuk dibaca dan ditulis
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public All Settings" ON settings FOR ALL USING (true) WITH CHECK (true);`}
                  </pre>
                </div>

                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mr-1.5">Langkah 2</span>
                  <strong className="text-slate-800">Buat Bucket logos di Storage</strong>
                  <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
                    <li>Masuk ke dasbor Supabase Anda, pilih menu <strong className="text-slate-700">Storage</strong>.</li>
                    <li>Klik <strong className="text-slate-700">New Bucket</strong>, masukkan nama bucket: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">logos</code>.</li>
                    <li>Pastikan untuk mengaktifkan opsi <strong className="text-slate-700">Public bucket</strong> agar URL gambar logo dapat diakses tanpa token.</li>
                    <li>Di bagian <strong className="text-slate-700">Policies</strong>, tambahkan kebijakan agar user anonim/publik diperbolehkan melakukan tindakan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">SELECT</code> dan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">INSERT/UPDATE</code>.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Catatan Sistem:</strong> Selagi Anda mengonfigurasi Supabase, logo Anda saat ini telah <strong>disimpan secara aman di peramban lokal (localStorage)</strong> dan tetap aktif menampilkan identitas rumah sakit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
