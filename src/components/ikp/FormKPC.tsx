/* eslint-disable */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Save, Printer, Eye, ArrowLeft, Hospital } from 'lucide-react';

const UNIT_OPTIONS = ["IGD", "ICU", "NICU", "PICU", "Rawat Inap", "Rawat Jalan", "Farmasi", "Laboratorium", "Radiologi", "OK", "CSSD", "Gizi", "Rekam Medis", "Administrasi", "Lainnya"];

interface FormKPCProps {
  onSave: (data: any, status: string) => void;
  onCancel: () => void;
}

export default function FormKPC({ onSave, onCancel }: FormKPCProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      tindakan_oleh: [],
      uraian_kpc: ""
    }
  });
  
  const handleCetak = () => {
    window.print();
  };

  const onSubmitDraft = (data: any) => onSave(data, "DRAFT");
  const onSubmitFinal = (data: any) => onSave(data, "FINAL");

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-emerald-100 overflow-hidden print:shadow-none print:border-none">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600 p-8 md:p-10 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Hospital size={180} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 inline-block backdrop-blur-sm border border-white/30">
              Formulir Keselamatan Pasien
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              LAPORAN KONDISI POTENSIAL CEDERA (KPC)
            </h2>
            <p className="text-emerald-100 mt-2 font-medium text-sm md:text-base max-w-2xl leading-relaxed">
              Pelaporan potensi risiko keselamatan pasien sebelum terjadi insiden aktual. Form ini digunakan untuk dokumentasi dan mitigasi dini.
            </p>
          </div>
        </div>
      </div>

      <form className="p-6 md:p-10 space-y-10">
        {/* SECTION 1: Waktu Ditemukan */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">1. Waktu Ditemukan KPC</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tanggal Ditemukan <span className="text-red-500">*</span></label>
              <input type="date" {...register("tgl_ditemukan", { required: "Wajib diisi" })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
              {errors.tgl_ditemukan && <p className="text-red-500 text-[10px] mt-1 font-bold">{String(errors.tgl_ditemukan.message)}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Jam Ditemukan <span className="text-red-500">*</span></label>
              <input type="time" {...register("jam_ditemukan", { required: "Wajib diisi" })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
              {errors.jam_ditemukan && <p className="text-red-500 text-[10px] mt-1 font-bold">{String(errors.jam_ditemukan.message)}</p>}
            </div>
          </div>
        </section>

        {/* SECTION 2: Rincian KPC */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">2. Rincian Kondisi Potensial Cedera</h3>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Uraian KPC <span className="text-red-500">*</span></label>
            <textarea 
              {...register("uraian_kpc", { required: "Wajib diisi", maxLength: 5000 })} 
              rows={5} 
              maxLength={5000}
              placeholder="Jelaskan kondisi yang berpotensi menyebabkan cedera atau insiden keselamatan pasien..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium resize-y" 
            />
            <div className="flex justify-between items-center mt-1">
              {errors.uraian_kpc && <p className="text-red-500 text-[10px] font-bold">{String(errors.uraian_kpc.message)}</p>}
              <span className="text-[10px] text-gray-400 font-bold max-w-full text-right flex-1">{watch("uraian_kpc")?.length || 0}/5000</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: Pelapor Pertama */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">3. Pelapor Pertama</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Dokter", "Perawat", "Petugas Lainnya", "Pasien", "Keluarga/Pendamping Pasien", "Pengunjung", "Lain-lain"].map(role => (
              <label key={role} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                <input type="radio" value={role} {...register("pelapor")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                <span className="text-xs font-bold text-gray-800">{role}</span>
              </label>
            ))}
          </div>
          {watch("pelapor") === "Lain-lain" && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
               <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Sebutkan Pelapor <span className="text-red-500">*</span></label>
               <input type="text" {...register("pelapor_lainnya", { required: "Wajib diisi" })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
          )}
        </section>

        {/* SECTION 4 & 5: Lokasi & Unit */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-5">
              <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">4. Lokasi Ditemukan</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Unit Lokasi <span className="text-red-500">*</span></label>
                <select {...register("lokasi", { required: "Wajib diisi" })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold selection:bg-emerald-100 cursor-pointer">
                  <option value="">Pilih Unit...</option>
                  {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Detail Lokasi</label>
                <input type="text" {...register("detail_lokasi")} placeholder="Contoh: Ruang Mawar Bed 03" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium" />
              </div>
            </div>
          </div>
          <div>
            <div className="border-b border-gray-100 pb-3 mb-5">
              <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">5. Unit Terkait</h3>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Unit/Departemen Terkait</label>
            <MultiSelect
              options={UNIT_OPTIONS}
              selected={watch("unit_terkait")?.split(",").map((s: string) => s.trim()).filter(Boolean) || []}
              onChange={(val) => setValue("unit_terkait", val.join(", "), { shouldValidate: true })}
              placeholder="Pilih satu atau lebih unit..."
            />
          </div>
        </section>

        {/* SECTION 6 & 7: Tindakan */}
        <section>
           <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">6 & 7. Tindakan yang Dilakukan</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tindakan & Hasil <span className="text-red-500">*</span></label>
              <textarea 
                {...register("tindakan_dilakukan", { required: "Wajib diisi" })} 
                rows={4} 
                placeholder="Jelaskan tindakan yang sudah dilakukan dan hasil yang diperoleh..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium" 
              />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Tindakan Dilakukan Oleh</label>
               <div className="flex flex-wrap gap-4">
                  {["Tim", "Dokter", "Perawat", "Petugas Lainnya"].map(role => (
                    <label key={role} className="flex items-center gap-2 p-3 px-5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors shadow-3xs">
                      <input type="checkbox" value={role} {...register("tindakan_oleh")} className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 accent-emerald-600" />
                      <span className="text-xs font-bold text-gray-800">{role}</span>
                    </label>
                  ))}
               </div>
            </div>
            {(Array.isArray(watch("tindakan_oleh")) ? watch("tindakan_oleh").includes("Tim") : watch("tindakan_oleh") === "Tim") && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Nama Tim</label>
                <input type="text" {...register("nama_tim")} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium" />
              </div>
            )}
             {(Array.isArray(watch("tindakan_oleh")) ? watch("tindakan_oleh").includes("Petugas Lainnya") : watch("tindakan_oleh") === "Petugas Lainnya") && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Sebutkan Petugas</label>
                <input type="text" {...register("nama_petugas_lain")} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium" />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 8: Riwayat Serupa */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">8. Riwayat Kejadian Serupa</h3>
          </div>
          <div className="space-y-4">
             <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">Apakah kejadian yang sama pernah ditemukan di unit kerja lain?</label>
             <div className="flex gap-4">
                <label className="flex items-center gap-2 p-3 px-6 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input type="radio" value="Ya" {...register("riwayat_serupa")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                  <span className="text-sm font-bold text-gray-800">Ya</span>
                </label>
                <label className="flex items-center gap-2 p-3 px-6 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input type="radio" value="Tidak" {...register("riwayat_serupa")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                  <span className="text-sm font-bold text-gray-800">Tidak</span>
                </label>
             </div>

             {watch("riwayat_serupa") === "Ya" && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mt-4 grid gap-6 animate-in slide-in-from-top-2">
                   <div>
                      <label className="block text-xs font-bold text-orange-850 mb-2 uppercase tracking-wide">Kapan Terjadi?</label>
                      <input type="date" {...register("tgl_riwayat")} className="w-full md:w-1/3 px-4 py-3 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-semibold" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-orange-850 mb-2 uppercase tracking-wide">Langkah Pencegahan yang Pernah Dilakukan</label>
                      <textarea 
                        {...register("pencegahan_riwayat")} 
                        rows={3} 
                        placeholder="Jelaskan tindakan yang telah dilakukan untuk mencegah kejadian serupa..."
                        className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium" 
                      />
                   </div>
                </div>
             )}
          </div>
        </section>

        {/* SECTION 9: Verifikasi */}
        <section className="bg-slate-50 border border-gray-100 rounded-3xl p-6 md:p-8">
           <div className="border-b border-gray-200 pb-3 mb-6">
            <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">9. Verifikasi Laporan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-700 bg-emerald-100 inline-block px-3 py-1 rounded-full uppercase tracking-widest">Pembuat Laporan</h4>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Nama & Jabatan</label>
                <div className="flex gap-2">
                  <input type="text" {...register("pembuat_nama")} placeholder="Nama Lengkap" className="w-1/2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none" />
                  <input type="text" {...register("pembuat_jabatan")} placeholder="Jabatan" className="w-1/2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none" />
                </div>
              </div>
               <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Unit Kerja</label>
                <input type="text" {...register("pembuat_unit")} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none" />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-blue-700 bg-blue-100 inline-block px-3 py-1 rounded-full uppercase tracking-widest">Penerima Laporan</h4>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Nama & Jabatan</label>
                <div className="flex gap-2">
                  <input type="text" {...register("penerima_nama")} placeholder="Nama Lengkap" className="w-1/2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none" />
                  <input type="text" {...register("penerima_jabatan")} placeholder="Jabatan" className="w-1/2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold outline-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex gap-3">
             <button type="button" onClick={onCancel} className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors flex items-center gap-2">
                <ArrowLeft size={16} /> Kembali
             </button>
             <button type="button" onClick={handleCetak} className="px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors flex items-center gap-2 shadow-xs">
                <Printer size={16} /> Cetak PDF
             </button>
          </div>
          <div className="flex gap-3">
             <button type="button" onClick={handleSubmit(onSubmitDraft)} className="px-6 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-bold transition-colors shadow-xs">
                Simpan Draft
             </button>
             <button type="button" onClick={handleSubmit(onSubmitFinal)} className="px-8 py-3 rounded-xl bg-[#10a37f] hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95">
                <Save size={18} /> Simpan Laporan
             </button>
          </div>
        </div>

      </form>
    </div>
  );
}
