import React, { useState, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import {
  Save,
  X,
  AlertTriangle,
  UploadCloud,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  User,
  ShieldAlert,
  Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const inputStyles =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800 placeholder-slate-400 bg-gray-50 focus:bg-white";

const labelStyles = "block text-sm font-extrabold text-slate-700 mb-2";

const sectionHeaderStyles = "text-lg font-black text-[#10a37f] mb-6 flex items-center gap-2 border-b-2 border-emerald-50 pb-3";

export default function IKPForm({ initialData, onSuccess, onCancel }: any) {
  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: initialData || {
      unitPelapor: "",
      tanggalLapor: new Date().toISOString().split("T")[0],
      jamLapor: new Date().toTimeString().slice(0, 5),
      pelapor: "Adit Resa",
      jabatan: "Staff",
      namaPasien: "",
      noRM: "",
      umur: "",
      jenisKelamin: "",
      penanggungBiaya: "",
      tanggalMasuk: "",
      jamMasuk: "",
      tanggalKejadian: "",
      jamKejadian: "",
      insiden: "",
      kronologis: "",
      orangPertama: "",
      orangPertamaLainnya: "",
      terjadiPada: "",
      terjadiPadaLainnya: "",
      menyangkutPasien: "",
      menyangkutPasienLainnya: "",
      tempatInsiden: "",
      spesialisasi: "",
      spesialisasiLainnya: "",
      unitPenyebab: "",
      akibatInsiden: "",
      tindakanSegera: "",
      tindakanOleh: [],
      tindakanOlehLainnya: "",
      kejadianSerupa: "Tidak",
      kapanTerjadi: "",
      tindakanKejadianSerupa: "",
      tipeInsiden: "",
      subTipeInsiden: "",
      faktorPenyebab: [],
      penyebabLangsung: "",
      akarPenyebab: "",
      rekomendasi: [{ akarMasalah: "", rekomendasi: "" }],
      gradingRisiko: "",
      penerimaLaporan: "",
    }
  });

  const { fields: rekomendasiFields, append, remove } = useFieldArray({
    control,
    name: "rekomendasi"
  });

  const watchOrangPertama = watch("orangPertama");
  const watchTerjadiPada = watch("terjadiPada");
  const watchMenyangkutPasien = watch("menyangkutPasien");
  const watchSpesialisasi = watch("spesialisasi");
  const watchTindakanOleh = watch("tindakanOleh");
  const watchKejadianSerupa = watch("kejadianSerupa");
  const watchGrading = watch("gradingRisiko");

  const sigPembuatRef = useRef<any>(null);
  const sigPenerimaRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const id = "IKP-" + new Date().getTime();
      const pembuatSig = sigPembuatRef.current?.isEmpty() ? null : sigPembuatRef.current?.getTrimmedCanvas().toDataURL('image/png');
      const penerimaSig = sigPenerimaRef.current?.isEmpty() ? null : sigPenerimaRef.current?.getTrimmedCanvas().toDataURL('image/png');

      const payload = {
        ...data,
        pembuatSignature: pembuatSig,
        penerimaSignature: penerimaSig,
      };

      const tableData = {
        id: id,
        unit_id: data.unitPelapor || "IGD",
        category_id: "IKP",
        indicator_id: "ikp_report",
        input_date: data.tanggalLapor,
        target: "0",
        achievement_percentage: 0,
        notes: JSON.stringify({
          keterangan: data.insiden,
          kpc: data.tipeInsiden === "KPC" ? 1 : 0,
          knc: data.tipeInsiden === "KNC" ? 1 : 0,
          ktc: data.tipeInsiden === "KTC" ? 1 : 0,
          ktd: data.tipeInsiden === "KTD" ? 1 : 0,
          sentinel: data.tipeInsiden === "Sentinel" ? 1 : 0,
          grading: data.gradingRisiko,
          fullFormData: payload
        }),
        num_numerator: 1,
        num_denominator: 1,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('indicator_inputs').insert([tableData]);
      if (error) {
        console.error("Supabase Error:", error);
        alert("Gagal menyimpan data ke Supabase!");
      } else {
        alert("Laporan IKP Berhasil Disimpan!");
        if(onSuccess) onSuccess();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-emerald-100/50 overflow-hidden relative">
      <div className="bg-[#10a37f] text-white p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-90" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg backdrop-blur-md">
            <ShieldAlert size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">FORMULIR LAPORAN IKP</h2>
          <p className="text-emerald-100 font-semibold text-sm md:text-base max-w-xl">
            Insiden Keselamatan Pasien (KPC, KNC, KTC, KTD, Sentinel)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-10 space-y-12">
        {/* 1. INFORMASI LAPORAN */}
        <section>
          <h3 className={sectionHeaderStyles}><FileText size={20} /> 1. Informasi Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelStyles}>Unit Pelapor</label>
              <select {...register("unitPelapor", { required: true })} className={inputStyles}>
                <option value="">-- Pilih Unit --</option>
                <option value="IGD">IGD</option>
                <option value="Rawat Inap">Rawat Inap</option>
                <option value="Rawat Jalan">Rawat Jalan</option>
                <option value="ICU">ICU</option>
                <option value="NICU">NICU</option>
                <option value="VK">VK</option>
                <option value="Kamar Operasi">Kamar Operasi</option>
                <option value="Farmasi">Farmasi</option>
                <option value="Laboratorium">Laboratorium</option>
                <option value="Radiologi">Radiologi</option>
                <option value="Gizi">Gizi</option>
                <option value="CSSD">CSSD</option>
                <option value="Hemodialisa">Hemodialisa</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className={labelStyles}>Tanggal Lapor</label>
              <input type="date" {...register("tanggalLapor")} className={inputStyles} />
            </div>
            <div>
              <label className={labelStyles}>Jam Lapor</label>
              <input type="time" {...register("jamLapor")} className={inputStyles} />
            </div>
            <div>
              <label className={labelStyles}>Pelapor</label>
              <input type="text" {...register("pelapor")} className={inputStyles} disabled />
            </div>
            <div>
              <label className={labelStyles}>Jabatan</label>
              <input type="text" {...register("jabatan")} className={inputStyles} disabled />
            </div>
          </div>
        </section>

        {/* 2. DATA PASIEN */}
        <section>
          <h3 className={sectionHeaderStyles}><User size={20} /> 2. Data Pasien</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelStyles}>Nama Pasien (Inisial)</label>
              <input type="text" {...register("namaPasien")} placeholder="Contoh: A.N" className={inputStyles} />
            </div>
            <div>
              <label className={labelStyles}>Nomor Rekam Medis</label>
              <input type="text" {...register("noRM")} className={inputStyles} />
            </div>
            <div>
              <label className={labelStyles}>Umur</label>
              <select {...register("umur")} className={inputStyles}>
                <option value="">-- Pilih Umur --</option>
                <option value="0–1 bulan">0–1 bulan</option>
                <option value="> 1 bulan–1 tahun">&gt; 1 bulan–1 tahun</option>
                <option value="> 1–5 tahun">&gt; 1–5 tahun</option>
                <option value="> 5–15 tahun">&gt; 5–15 tahun</option>
                <option value="> 15–30 tahun">&gt; 15–30 tahun</option>
                <option value="> 30–65 tahun">&gt; 30–65 tahun</option>
                <option value="> 65 tahun">&gt; 65 tahun</option>
              </select>
            </div>
            <div>
              <label className={labelStyles}>Jenis Kelamin</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 font-semibold text-slate-600"><input type="radio" value="Laki-laki" {...register("jenisKelamin")} /> Laki-laki</label>
                <label className="flex items-center gap-2 font-semibold text-slate-600"><input type="radio" value="Perempuan" {...register("jenisKelamin")} /> Perempuan</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelStyles}>Penanggung Biaya</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {["Pribadi", "Pemerintah", "BPJS", "Asuransi Swasta", "Perusahaan"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 font-semibold text-slate-600">
                    <input type="radio" value={opt} {...register("penanggungBiaya")} /> {opt}
                  </label>
                ))}
              </div>
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
        </section>

        {/* 3. RINCIAN INSIDEN */}
        <section>
          <h3 className={sectionHeaderStyles}><AlertTriangle size={20} /> 3. Rincian Insiden</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyles}>Tanggal Kejadian</label>
              <input type="date" {...register("tanggalKejadian", { required: true })} className={inputStyles} />
            </div>
            <div>
              <label className={labelStyles}>Jam Kejadian</label>
              <input type="time" {...register("jamKejadian")} className={inputStyles} />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyles}>Insiden</label>
              <input type="text" {...register("insiden", { required: true })} placeholder="Contoh: Kesalahan pemberian obat" className={inputStyles} />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyles}>Kronologis Insiden</label>
              <textarea {...register("kronologis", { required: true })} rows={5} placeholder="Jelaskan secara detail kejadian yang terjadi..." className={inputStyles}></textarea>
            </div>

            <div>
              <label className={labelStyles}>Orang Pertama Yang Melaporkan</label>
              <select {...register("orangPertama")} className={inputStyles}>
                <option value="">-- Pilih --</option>
                <option value="Dokter">Dokter</option>
                <option value="Perawat">Perawat</option>
                <option value="Petugas Lainnya">Petugas Lainnya</option>
                <option value="Pasien">Pasien</option>
                <option value="Keluarga/Pendamping">Keluarga/Pendamping</option>
                <option value="Pengunjung">Pengunjung</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              {(watchOrangPertama === "Petugas Lainnya" || watchOrangPertama === "Lainnya") && (
                <input type="text" {...register("orangPertamaLainnya")} placeholder="Sebutkan..." className={`${inputStyles} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelStyles}>Insiden Terjadi Pada</label>
              <select {...register("terjadiPada")} className={inputStyles}>
                <option value="">-- Pilih --</option>
                <option value="Pasien">Pasien</option>
                <option value="Petugas">Petugas</option>
                <option value="Pengunjung">Pengunjung</option>
                <option value="Pendamping Pasien">Pendamping Pasien</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              {watchTerjadiPada === "Lainnya" && (
                <input type="text" {...register("terjadiPadaLainnya")} placeholder="Sebutkan..." className={`${inputStyles} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelStyles}>Insiden Menyangkut Pasien</label>
              <select {...register("menyangkutPasien")} className={inputStyles}>
                <option value="">-- Pilih --</option>
                <option value="Rawat Inap">Rawat Inap</option>
                <option value="Rawat Jalan">Rawat Jalan</option>
                <option value="IGD">IGD</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              {watchMenyangkutPasien === "Lainnya" && (
                <input type="text" {...register("menyangkutPasienLainnya")} placeholder="Sebutkan..." className={`${inputStyles} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelStyles}>Tempat Insiden (Lokasi)</label>
              <input type="text" {...register("tempatInsiden")} placeholder="Contoh: Ruang Aisyah" className={inputStyles} />
            </div>

            <div>
              <label className={labelStyles}>Spesialisasi Pasien</label>
              <select {...register("spesialisasi")} className={inputStyles}>
                <option value="">-- Pilih --</option>
                <option value="Penyakit Dalam">Penyakit Dalam</option>
                <option value="Anak">Anak</option>
                <option value="Bedah">Bedah</option>
                <option value="Obstetri & Ginekologi">Obstetri & Ginekologi</option>
                <option value="THT">THT</option>
                <option value="Mata">Mata</option>
                <option value="Saraf">Saraf</option>
                <option value="Anastesi">Anastesi</option>
                <option value="Kulit & Kelamin">Kulit & Kelamin</option>
                <option value="Jantung">Jantung</option>
                <option value="Paru">Paru</option>
                <option value="Jiwa">Jiwa</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              {watchSpesialisasi === "Lainnya" && (
                <input type="text" {...register("spesialisasiLainnya")} placeholder="Sebutkan..." className={`${inputStyles} mt-2`} />
              )}
            </div>

            <div>
              <label className={labelStyles}>Akibat Insiden Terhadap Pasien</label>
              <select {...register("akibatInsiden")} className={inputStyles}>
                <option value="">-- Pilih --</option>
                <option value="Kematian">Kematian</option>
                <option value="Cedera Berat">Cedera Berat</option>
                <option value="Cedera Sedang">Cedera Sedang</option>
                <option value="Cedera Ringan">Cedera Ringan</option>
                <option value="Tidak Ada Cedera">Tidak Ada Cedera</option>
              </select>
            </div>

             <div className="md:col-span-2">
              <label className={labelStyles}>Unit Penyebab Insiden</label>
              <select {...register("unitPenyebab")} className={inputStyles}>
                 <option value="">-- Pilih --</option>
                 <option value="IGD">IGD</option>
                 <option value="Rawat Inap">Rawat Inap</option>
                 <option value="Kamar Operasi">Kamar Operasi</option>
                 <option value="Farmasi">Farmasi</option>
                 <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelStyles}>Tindakan Segera Setelah Kejadian</label>
              <textarea {...register("tindakanSegera")} rows={3} className={inputStyles}></textarea>
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className={labelStyles}>Tindakan Dilakukan Oleh</label>
              <div className="flex flex-wrap gap-4 mt-1">
                {["Dokter", "Perawat", "Tim", "Petugas Lainnya"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 font-semibold text-slate-600">
                    <input type="checkbox" value={opt} {...register("tindakanOleh")} /> {opt}
                  </label>
                ))}
              </div>
              {watchTindakanOleh?.includes("Petugas Lainnya") && (
                <input type="text" {...register("tindakanOlehLainnya")} placeholder="Sebutkan..." className={`${inputStyles} mt-2 md:w-1/2`} />
              )}
            </div>

            <div className="md:col-span-2 py-4 border-t border-gray-100">
              <label className={labelStyles}>Apakah kejadian yang sama pernah terjadi?</label>
              <div className="flex gap-4 mt-2 mb-4">
                <label className="flex items-center gap-2 font-semibold text-slate-600"><input type="radio" value="Ya" {...register("kejadianSerupa")} /> Ya</label>
                <label className="flex items-center gap-2 font-semibold text-slate-600"><input type="radio" value="Tidak" {...register("kejadianSerupa")} /> Tidak</label>
              </div>
              {watchKejadianSerupa === "Ya" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <label className={labelStyles}>Kapan Terjadi</label>
                    <input type="text" {...register("kapanTerjadi")} placeholder="Contoh: Bulan lalu / Tanggal..." className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>Tindakan yang Sudah Dilakukan</label>
                    <textarea {...register("tindakanKejadianSerupa")} rows={2} className={inputStyles}></textarea>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. TIPE INSIDEN */}
        <section>
           <h3 className={sectionHeaderStyles}><CheckCircle size={20} /> 4. Tipe Insiden</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className={labelStyles}>Tipe Insiden Utama</label>
              <select {...register("tipeInsiden", { required: true })} className={inputStyles}>
                <option value="">-- Pilih --</option>
                <option value="KPC">KPC (Kondisi Potensial Cedera)</option>
                <option value="KNC">KNC (Kejadian Nyaris Cedera)</option>
                <option value="KTC">KTC (Kejadian Tidak Cedera)</option>
                <option value="KTD">KTD (Kejadian Tidak Diharapkan)</option>
                <option value="Sentinel">Kejadian Sentinel</option>
              </select>
             </div>
             <div>
              <label className={labelStyles}>Sub Tipe Insiden</label>
              <input type="text" {...register("subTipeInsiden")} placeholder="Contoh: Kesalahan pemberian obat" className={inputStyles} />
             </div>
           </div>
        </section>

        {/* 5. ANALISIS PENYEBAB & 6. GRADING */}
        <section>
          <h3 className={sectionHeaderStyles}><ShieldAlert size={20} /> 5-6. Analisis Penyebab & Grading Risiko</h3>
          <div className="space-y-6">
            <div>
              <label className={labelStyles}>Faktor Penyebab (Bisa pilih lebih dari satu)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {[
                  "Faktor Eksternal", "Faktor Organisasi dan Manajemen", 
                  "Faktor Lingkungan Kerja", "Faktor Tim", 
                  "Faktor Petugas dan Kinerja", "Faktor Tugas", 
                  "Faktor Pasien", "Faktor Komunikasi"
                ].map(opt => (
                  <label key={opt} className="flex items-center gap-2 font-semibold text-slate-600 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-emerald-300 transition-colors cursor-pointer">
                    <input type="checkbox" value={opt} {...register("faktorPenyebab")} className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500/20" /> 
                    <span className="text-sm leading-snug">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyles}>Penyebab Langsung</label>
                <textarea {...register("penyebabLangsung")} rows={3} className={inputStyles}></textarea>
              </div>
              <div>
                <label className={labelStyles}>Akar Penyebab Masalah</label>
                <textarea {...register("akarPenyebab")} rows={3} className={inputStyles}></textarea>
              </div>
            </div>

            <div>
              <label className={labelStyles}>Rekomendasi Perbaikan</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-gray-200 text-slate-700">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Akar Masalah</th>
                      <th className="p-3">Rekomendasi</th>
                      <th className="p-3 w-16 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekomendasiFields.map((field, index) => (
                      <tr key={field.id} className="border-b border-gray-100 last:border-0 bg-white">
                        <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="p-3"><input {...register(`rekomendasi.${index}.akarMasalah`)} className={`${inputStyles} py-1.5`} placeholder="Akar masalah..." /></td>
                        <td className="p-3"><input {...register(`rekomendasi.${index}.rekomendasi`)} className={`${inputStyles} py-1.5`} placeholder="Rekomendasi tindakan..." /></td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => remove(index)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => append({ akarMasalah: "", rekomendasi: "" })} className="text-sm font-bold text-[#10a37f] flex items-center gap-1 hover:underline">
                <Plus size={16} /> Tambah Baris Rekomendasi
              </button>
            </div>

            {/* GRADING RISIKO */}
            <div className="pt-6 border-t border-gray-100">
              <label className={labelStyles}>Grading Risiko (Berdasarkan Matrix)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {[
                  { value: "Biru", label: "RENDAH", bg: "bg-blue-500", border: watchGrading === "Biru" ? "border-blue-600 ring-4 ring-blue-500/20" : "border-transparent" },
                  { value: "Hijau", label: "SEDANG", bg: "bg-green-500", border: watchGrading === "Hijau" ? "border-green-600 ring-4 ring-green-500/20" : "border-transparent" },
                  { value: "Kuning", label: "TINGGI", bg: "bg-yellow-500", border: watchGrading === "Kuning" ? "border-yellow-600 ring-4 ring-yellow-500/20" : "border-transparent" },
                  { value: "Merah", label: "EKSTRIM", bg: "bg-red-500", border: watchGrading === "Merah" ? "border-red-600 ring-4 ring-red-500/20" : "border-transparent" },
                ].map(g => (
                  <label key={g.value} className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border-2 ${g.border} ${g.bg} bg-opacity-10 hover:bg-opacity-20`}>
                    <input type="radio" value={g.value} {...register("gradingRisiko")} className="sr-only" />
                    <div className={`w-6 h-6 rounded-full mb-2 shadow-sm border-2 border-white ${g.bg}`} />
                    <span className={`font-black tracking-wide ${g.bg.replace('bg-', 'text-')}`}>{g.value.toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{g.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. DOKUMENTASI */}
        <section>
          <h3 className={sectionHeaderStyles}><ImageIcon size={20} /> 7. Dokumentasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <UploadCloud size={32} className="text-gray-400 group-hover:text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-slate-700">Upload Foto Dokumentasi</p>
              <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG. Max 5 foto</p>
              <input type="file" multiple accept="image/png, image/jpeg" className="hidden" />
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <FileText size={32} className="text-gray-400 group-hover:text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-slate-700">Upload Dokumen Pendukung</p>
              <p className="text-xs text-gray-400 mt-1">Format: PDF, DOCX</p>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
            </div>
          </div>
        </section>

        {/* 8. TANDA TANGAN */}
        <section>
          <h3 className={sectionHeaderStyles}><CheckCircle size={20} /> 8. Tanda Tangan Digital</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200">
              <h4 className="font-extrabold text-slate-800 text-center mb-4">Pembuat Laporan</h4>
              <div className="bg-white border-2 border-dashed border-emerald-200 rounded-xl mb-4 h-40">
                <SignatureCanvas 
                  ref={sigPembuatRef}
                  canvasProps={{ className: "w-full h-full rounded-xl cursor-crosshair" }} 
                />
              </div>
              <button type="button" onClick={() => sigPembuatRef.current?.clear()} className="text-xs font-bold text-slate-500 hover:text-rose-500 mb-4 text-center block w-full">Hapus Tanda Tangan</button>
              <div className="space-y-3">
                <input type="text" value="Adit Resa" disabled className={inputStyles} />
                <input type="text" value={new Date().toISOString().split("T")[0]} disabled className={inputStyles} />
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200">
              <h4 className="font-extrabold text-slate-800 text-center mb-4">Penerima Laporan</h4>
              <div className="bg-white border-2 border-dashed border-emerald-200 rounded-xl mb-4 h-40">
                <SignatureCanvas 
                  ref={sigPenerimaRef}
                  canvasProps={{ className: "w-full h-full rounded-xl cursor-crosshair" }} 
                />
              </div>
              <button type="button" onClick={() => sigPenerimaRef.current?.clear()} className="text-xs font-bold text-slate-500 hover:text-rose-500 mb-4 text-center block w-full">Hapus Tanda Tangan</button>
              <div className="space-y-3">
                <input type="text" {...register("penerimaLaporan")} placeholder="Nama Penerima" className={inputStyles} />
                <input type="text" value={new Date().toISOString().split("T")[0]} disabled className={inputStyles} />
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6 border-t-2 border-gray-100">
          <button type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-gray-200 hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center justify-center gap-2">
            <X size={20} strokeWidth={2.5} /> Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-[#10a37f] hover:from-emerald-700 hover:to-emerald-600 shadow-[0_8px_20px_rgba(16,163,127,0.25)] hover:shadow-[0_12px_25px_rgba(16,163,127,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
            {isSubmitting ? "Menyimpan Data..." : <><Save size={20} strokeWidth={2.5} /> Simpan Form IKP</>}
          </button>
        </div>
      </form>
    </div>
  );
}
