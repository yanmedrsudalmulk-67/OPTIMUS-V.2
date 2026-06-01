import React, { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { motion } from "motion/react";
import {
  User, AlertTriangle, Activity, ShieldAlert,
  ClipboardList, CheckCircle, FileText, UploadCloud,
  X, Plus, ChevronRight, ChevronLeft, Save, ChevronDown,
  Trash2, Printer, MapPin, Building,
  Check, Info
} from "lucide-react";

const inputStyles =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10a37f] focus:ring-4 focus:ring-[#10a37f]/10 transition-all font-medium text-slate-800 placeholder-slate-400 bg-gray-50 focus:bg-white shadow-sm outline-none";
const labelStyles = "block text-sm font-extrabold text-[#0a5ec5] mb-2";

const GRADING_RISK = [
  { id: "BIRU", label: "Risiko Rendah", color: "bg-blue-500", border: "border-[#2b7fff]", bgLight: "bg-blue-50", text: "text-[#2b7fff]", desc: "Tidak ada cedera atau cedera ringan yang dapat diatasi dengan pertolongan pertama." },
  { id: "HIJAU", label: "Risiko Sedang", color: "bg-emerald-500", border: "border-[#00bc7d]", bgLight: "bg-emerald-50", text: "text-[#00bc7d]", desc: "Cedera sedang, berkurangnya fungsi motorik/sensorik, memanjang masa rawat." },
  { id: "KUNING", label: "Risiko Tinggi", color: "bg-yellow-500", border: "border-[#f0b100]", bgLight: "bg-yellow-50", text: "text-[#f0b100]", desc: "Cedera luas/berat, kehilangan fungsi utama permanen." },
  { id: "MERAH", label: "Risiko Ekstrem", color: "bg-red-500", border: "border-[#fb2c36]", bgLight: "bg-red-50", text: "text-[#fb2c36]", desc: "Kematian atau cedera yang sangat berat tak terduga (Sentinel)." },
];

export default function IKPForm({ onSuccess }: { initialData?: any, onSuccess?: () => void, onCancel?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { register, control, handleSubmit, setValue, formState: { errors, isValid } } = useForm({
    defaultValues: {
      namaPasien: "", umur: "", jenisKelamin: "", penanggungBiaya: "", tanggalMasuk: "", jamMasuk: "",
      tanggalKejadian: "", jamKejadian: "", namaInsiden: "", kronologis: "", jenisInsiden: "",
      pelaporPertama: "", pelaporLainnya: "", terjadiPada: "", jenisPelayanan: "", lokasiKejadian: "",
      spesialisasi: "", unitPenyebab: "", akibatPasien: "", tindakanSegera: "", tindakanOleh: [] as string[],
      pernahTerjadi: "Tidak", kapanTerjadi: "", tindakanPencegahan: "",
      tipeInsiden: "", subTipeInsiden: "",
      faktorKontributor: "", penyebabLangsung: "", akarPenyebab: "",
      rekomendasi: [{ akarMasalah: "", rekomendasi: "" }],
      gradingRisiko: "",
    }
  });

  const { fields: rekomendasiFields, append, remove } = useFieldArray({
    control,
    name: "rekomendasi"
  });

  // Watchers required for dynamic rules
  const watchPelapor = useWatch({ control, name: "pelaporPertama" });
  const watchPernahTerjadi = useWatch({ control, name: "pernahTerjadi" });
  const watchTipeInsiden = useWatch({ control, name: "tipeInsiden" });
  const watchJenisInsiden = useWatch({ control, name: "jenisInsiden" });
  const watchGrading = useWatch({ control, name: "gradingRisiko" });

  // Watchers for summary step
  const sumNamaPasien = useWatch({ control, name: "namaPasien" });
  const sumTanggalKejadian = useWatch({ control, name: "tanggalKejadian" });
  const sumJamKejadian = useWatch({ control, name: "jamKejadian" });
  const sumNamaInsiden = useWatch({ control, name: "namaInsiden" });
  const sumKronologis = useWatch({ control, name: "kronologis" });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 10) {
        alert("Maksimal 10 dokumen pendukung.");
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const id = "IKP-" + new Date().getTime();
      let fileUrls: string[] = [];

      // 1. Upload Files
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${id}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ikp_documents')
            .upload(fileName, file);

          if (!uploadError && uploadData) {
            fileUrls.push(uploadData.path);
          }
        }
      }

      // 2. Prepare payload
      const payload = {
        ...data,
        id,
        status: "Dikirim",
        tanggalLapor: new Date().toISOString(),
        dokumenUrls: fileUrls,
        auditTrail: [{
          action: "CREATED",
          by: "Optimus User",
          timestamp: new Date().toISOString()
        }]
      };

      // 3. Save to database (indicator_inputs)
      const tableData = {
        id: id,
        unit_id: data.unitPenyebab || "Lainnya",
        category_id: "IKP",
        indicator_id: "ikp_report",
        input_date: data.tanggalKejadian || new Date().toISOString().split("T")[0],
        target: "0",
        achievement_percentage: 0,
        notes: JSON.stringify({
          keterangan: data.namaInsiden,
          kronologis: data.kronologis,
          kpc: data.jenisInsiden === "KPC" ? 1 : 0,
          knc: data.jenisInsiden === "KNC" ? 1 : 0,
          ktc: data.jenisInsiden === "KTC" ? 1 : 0,
          ktd: data.jenisInsiden === "KTD" ? 1 : 0,
          sentinel: data.jenisInsiden === "Sentinel" ? 1 : 0,
          grading: data.gradingRisiko,
          fullFormData: payload
        }),
        num_numerator: 1,
        num_denominator: 1,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('indicator_inputs').insert([tableData]);
      if (error) throw error;

      alert("Laporan IKP Berhasil Disimpan!");
      if (onSuccess) onSuccess();
      
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cetakPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-emerald-100 overflow-hidden relative print:shadow-none print:border-none print:rounded-none">
      
      {/* Header Form */}
      <div className="bg-[#10a37f] text-white p-6 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden print:bg-white print:text-black print:p-2">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-90 print:hidden" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none print:hidden" />
        <div className="relative z-10">
          <h2 className="text-[31px] font-black mb-2 tracking-tight leading-snug max-w-4xl mx-auto">
            FORMULIR LAPORAN INSIDEN KE TIM KESELAMATAN PASIEN DI FASILITAS PELAYANAN KESEHATAN
          </h2>
          <p className="text-emerald-100 font-bold text-[24px] w-full print:text-gray-600">
            UOBK RSUD AL-MULK KOTA SUKABUMI
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-10 max-w-5xl mx-auto print:p-0 print:max-w-none space-y-12">
        
        {/* SECTION 1: Data Pasien */}
        <div className="space-y-6">
          <div className="border-b border-emerald-100 pb-4 mb-6">
            <h3 className="text-xl font-black text-[#10a37f] flex items-center gap-2">
              1. Data Pasien
            </h3>
          </div>
          <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <label className={labelStyles}>Nama Pasien</label>
              <input type="text" {...register("namaPasien", { required: true })} placeholder="Contoh: Tn. A / Ny. B / An. C" className={inputStyles} />
              {errors.namaPasien && <span className="text-red-500 text-xs font-bold mt-1 block">Nama Pasien Wajib Diisi</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Umur</label>
                <select {...register("umur")} className={inputStyles}>
                  <option value="">-- Pilih Umur --</option>
                  {["0–1 bulan", ">1 bulan–1 tahun", ">1–5 tahun", ">5–15 tahun", ">15–30 tahun", ">30–65 tahun", ">65 tahun"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Jenis Kelamin</label>
                <select {...register("jenisKelamin")} className={inputStyles}>
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Penanggung Biaya</label>
                <select {...register("penanggungBiaya")} className={inputStyles}>
                  <option value="">-- Pilih Penanggung Biaya --</option>
                  {["Pribadi", "BPJS", "Asuransi Swasta", "Perusahaan", "Pemerintah"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Tanggal Masuk RS</label>
                <input type="date" {...register("tanggalMasuk")} className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Jam Masuk RS</label>
                <input type="time" {...register("jamMasuk")} className={inputStyles} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Rincian Kejadian */}
        <div className="space-y-6">
          <div className="border-b border-emerald-100 pb-4 mb-6">
            <h3 className="text-xl font-black text-[#10a37f] flex items-center gap-2">
              2. Rincian Kejadian
            </h3>
          </div>
          <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Tanggal Kejadian Insiden (Wajib)</label>
                <input type="date" {...register("tanggalKejadian", { required: true })} className={inputStyles} />
                {errors.tanggalKejadian && <span className="text-red-500 text-xs mt-1 block">Wajib</span>}
              </div>
              <div>
                <label className={labelStyles}>Jam Kejadian</label>
                <input type="time" {...register("jamKejadian")} className={inputStyles} />
              </div>
            </div>
            
            <div>
              <label className={labelStyles}>Insiden</label>
              <input type="text" {...register("namaInsiden", { required: true })} placeholder="Contoh: Salah Identifikasi Pasien, Pasien Jatuh di Kamar Mandi" className={inputStyles} />
              {errors.namaInsiden && <span className="text-red-500 text-xs mt-1 block">Wajib</span>}
            </div>

            <div>
              <label className={labelStyles}>Kronologi insiden</label>
              <textarea {...register("kronologis", { required: true, minLength: 20 })} rows={6} placeholder="Jelaskan secara rinci bagaimana kejadiannya, sebelum, saat, dan sesudah kejadian..." className={`${inputStyles} min-h-[120px] resize-y`}></textarea>
              {errors.kronologis && <span className="text-red-500 text-xs mt-1 block">Wajib dan minimal 20 karakter</span>}
            </div>

            <div>
              <label className={labelStyles}>Jenis Insiden</label>
              <select {...register("jenisInsiden", { required: true })} className={inputStyles}>
                <option value="">-- Pilih Jenis Insiden --</option>
                <option value="KTC">Kejadian Tidak Cedera (KTC)</option>
                <option value="KNC">Kejadian Nyaris Cedera (KNC)</option>
                <option value="KTD">Kejadian Tidak Diharapkan (KTD)</option>
                <option value="Sentinel">Kejadian Sentinel</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Orang Pertama Yang Melaporkan Insiden</label>
                <select {...register("pelaporPertama")} className={inputStyles}>
                  <option value="">-- Pilih --</option>
                  {["Dokter", "Perawat", "Petugas Lainnya", "Pasien", "Keluarga", "Pengunjung", "Lain-lain"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {watchPelapor === "Lain-lain" && (
                  <input type="text" {...register("pelaporLainnya")} placeholder="Sebutkan..." className={`${inputStyles} mt-3`} />
                )}
              </div>
              <div>
                <label className={labelStyles}>Insiden Terjadi Pada</label>
                <select {...register("terjadiPada")} className={inputStyles}>
                  <option value="">-- Pilih --</option>
                  {["Pasien", "Karyawan", "Pengunjung", "Pendamping", "Keluarga Pasien", "Lainnya"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Insiden menyangkut pasien</label>
                <select {...register("jenisPelayanan")} className={inputStyles}>
                  <option value="">-- Pilih --</option>
                  {["Rawat Inap", "Rawat Jalan", "IGD", "Lainnya"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Tempat Insiden</label>
                <select {...register("lokasiKejadian")} className={inputStyles}>
                  <option value="">-- Pilih --</option>
                  {["IGD", "ICU", "NICU", "VK", "Poliklinik", "Laboratorium", "Radiologi", "Rawat Inap", "Farmasi", "OK", "Lainnya"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Insiden terjadi pada pasieni</label>
                <select {...register("spesialisasi")} className={inputStyles}>
                  <option value="">-- Pilih --</option>
                  <option value="Penyakit Dalam dan Subspesialisasinya">Penyakit Dalam dan Subspesialisasinya</option>
                  <option value="Anak dan Sub spesialisasinya">Anak dan Sub spesialisasinya</option>
                  <option value="Bedah dan Subspesialisasinya">Bedah dan Subspesialisasinya</option>
                  <option value="Obstetri Gynekologi dan Subspesialisasinya">Obstetri Gynekologi dan Subspesialisasinya</option>
                  <option value="THT dan Subspesialisasinya">THT dan Subspesialisasinya</option>
                  <option value="Mata dan Subspesialisasinya">Mata dan Subspesialisasinya</option>
                  <option value="Saraf dan Subspesialisasinya">Saraf dan Subspesialisasinya</option>
                  <option value="Anastesi dan Subspesialisasinya">Anastesi dan Subspesialisasinya</option>
                  <option value="Kulit & kelamin dan Subspesialisasinya">Kulit & kelamin dan Subspesialisasinya</option>
                  <option value="Jantung dan Subspesialisasinya">Jantung dan Subspesialisasinya</option>
                  <option value="Paru dan Subspesialisasinya">Paru dan Subspesialisasinya</option>
                  <option value="Jiwa dan Subspesialisasinya">Jiwa dan Subspesialisasinya</option>
                  <option value="Lain-lain">Lain-lain : (sebutkan)</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Unit Penyebab Insiden</label>
                <input type="text" {...register("unitPenyebab")} placeholder="Contoh: Farmasi / Rawat Inap Melati" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Akibat Terhadap Pasien</label>
                <select {...register("akibatPasien")} className={inputStyles}>
                  <option value="">-- Pilih --</option>
                  {["Kematian", "Cedera Berat", "Cedera Sedang", "Cedera Ringan", "Tidak Ada Cedera"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelStyles}>Tindakan Segera Setelah Kejadian</label>
              <textarea {...register("tindakanSegera")} rows={3} className={inputStyles}></textarea>
            </div>

            <div>
              <label className={labelStyles}>Tindakan dilakukan oleh</label>
              <details className="group relative">
                <summary className={`${inputStyles} cursor-pointer list-none flex items-center justify-between`}>
                  <span className="text-slate-500">Pilih Tindakan Oleh...</span>
                  <ChevronDown className="group-open:rotate-180 transition-transform text-slate-400" size={20} />
                </summary>
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {["Dokter", "Perawat", "Farmasi", "Manajemen", "Petugas Lainnya"].map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors">
                      <input type="checkbox" value={opt} {...register("tindakanOleh")} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                      <span className="font-semibold text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
              <label className={labelStyles}>Apakah Kejadian Serupa Pernah Terjadi Sebelumnya?</label>
              <div className="flex gap-6 mt-2 mb-4">
                <label className="flex items-center gap-2 font-semibold text-[#0a5ec5] cursor-pointer">
                  <input type="radio" value="Ya" {...register("pernahTerjadi")} className="w-5 h-5 text-emerald-600" /> Ya
                </label>
                <label className="flex items-center gap-2 font-semibold text-[#0a5ec5] cursor-pointer">
                  <input type="radio" value="Tidak" {...register("pernahTerjadi")} className="w-5 h-5 text-emerald-600" /> Tidak
                </label>
              </div>
              {watchPernahTerjadi === "Ya" && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className={labelStyles}>Kapan Terjadi?</label>
                    <input type="text" {...register("kapanTerjadi")} placeholder="Bulan lalu, atau sebutkan tanggal" className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>Tindakan Pencegahan Sebelumnya</label>
                    <textarea {...register("tindakanPencegahan")} rows={3} className={inputStyles}></textarea>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Tipe Insiden */}
        <div className="space-y-6">
          <div className="border-b border-emerald-100 pb-4 mb-6">
            <h3 className="text-xl font-black text-[#10a37f] flex items-center gap-2">
              3. Tipe Insiden
            </h3>
          </div>
          <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <label className={labelStyles}>Tipe Insiden</label>
              <select {...register("tipeInsiden")} className={inputStyles}>
                <option value="">-- Pilih Tipe --</option>
                <option value="Kejadian Tidak Cedera (KTC)">Kejadian Tidak Cedera (KTC)</option>
                <option value="Kejadian Nyaris Cedera (KNC)">Kejadian Nyaris Cedera (KNC)</option>
                <option value="Kejadian Tidak Diharapkan (KTD)">Kejadian Tidak Diharapkan (KTD)</option>
                <option value="Sentinel">Sentinel</option>
              </select>
            </div>
            
            {watchTipeInsiden && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <label className={labelStyles}>Sub tipe insiden</label>
                <input type="text" {...register("subTipeInsiden")} placeholder="Contoh : Kesalahan Pemberian Obat" className={inputStyles} />
              </motion.div>
            )}
          </div>
        </div>

        {/* SECTION 4: Analisa Penyebab */}
        <div className="space-y-6">
          <div className="border-b border-emerald-100 pb-4 mb-6">
            <h3 className="text-xl font-black text-[#10a37f] flex items-center gap-2">
              4. Analisa Penyebab
            </h3>
          </div>
          <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <label className={labelStyles}>Faktor Kontributor</label>
              <select {...register("faktorKontributor")} className={inputStyles}>
                <option value="">-- Pilih Faktor Kontributor --</option>
                {["Faktor Eksternal", "Faktor Organisasi", "Faktor Lingkungan Kerja", "Faktor Tim", "Faktor Petugas", "Faktor Tugas", "Faktor Pasien", "Faktor Komunikasi"].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelStyles}>Penyebab Langsung (Direct Cause)</label>
              <textarea {...register("penyebabLangsung")} rows={4} placeholder="Penyebab yang langsung memicu insiden..." className={inputStyles}></textarea>
            </div>

            <div>
              <label className={labelStyles}>Akar Penyebab (Root Cause)</label>
              <textarea {...register("akarPenyebab")} rows={4} placeholder="Penyebab paling mendasar (gunakan 5 Why jika perlu)..." className={inputStyles}></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 5: Rekomendasi */}
        <div className="space-y-6">
          <div className="border-b border-emerald-100 pb-4 mb-6">
            <h3 className="text-xl font-black text-[#10a37f] flex items-center gap-2">
              5. Rekomendasi
            </h3>
          </div>
          <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#0a5ec5]">Tabel Rekomendasi & Tindak Lanjut</h3>
              <button 
                type="button" 
                onClick={() => append({ akarMasalah: "", rekomendasi: "" })}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Plus size={18} /> Tambah Baris
              </button>
            </div>

            <div className="space-y-4">
              {rekomendasiFields.map((field, idx) => (
                <div key={field.id} className="p-5 border border-emerald-100 rounded-2xl bg-emerald-50/30 relative group">
                  <button type="button" onClick={() => remove(idx)} className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white border border-red-200 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50">
                    <X size={16} strokeWidth={3} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Akar Masalah</label>
                      <input type="text" {...register(`rekomendasi.${idx}.akarMasalah`)} className={inputStyles} placeholder="Ex: SPO tidak jelas" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Rekomendasi</label>
                      <input type="text" {...register(`rekomendasi.${idx}.rekomendasi`)} className={inputStyles} placeholder="Ex: Revisi SPO" />
                    </div>
                  </div>
                </div>
              ))}
              {rekomendasiFields.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 font-medium">
                  Belum ada usulan rekomendasi. Klik tombol &quot;Tambah Baris&quot; di atas.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: Grading Risiko */}
        <div className="space-y-6">
          <div className="border-b border-emerald-100 pb-4 mb-6">
            <h3 className="text-xl font-black text-[#10a37f] flex items-center gap-2">
              6. Grading Risiko
            </h3>
          </div>
          <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GRADING_RISK.map(risk => {
                const isActive = watchGrading === risk.id;
                return (
                  <label key={risk.id} className={`relative flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${isActive ? `${risk.bgLight} ${risk.border} shadow-md scale-[1.02]` : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                    <input type="radio" value={risk.id} {...register("gradingRisiko")} className="sr-only" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${risk.color}`} />
                        <h4 className={`text-lg font-black ${risk.text}`}>{risk.label} ({risk.id})</h4>
                      </div>
                      {isActive && <CheckCircle className={risk.text} size={24} strokeWidth={2.5} />}
                    </div>
                    <p className={`text-sm font-medium ${isActive ? risk.text : 'text-slate-500'}`}>{risk.desc}</p>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Controls / Navigation Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-end print:hidden">
           <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex justify-center items-center gap-2 px-10 py-4 bg-[#10a37f] text-white font-black rounded-xl hover:bg-emerald-600 transition-all duration-300 shadow-xl shadow-[#10a37f]/30 ring-4 ring-transparent hover:ring-[#10a37f]/20 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1">
             {isSubmitting ? "Menyimpan Data..." : "Simpan Data IKP"} <Save size={20} />
           </button>
        </div>
      </form>
    </div>
  );
}
