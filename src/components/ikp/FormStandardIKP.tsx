/* eslint-disable */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Save, Printer, ArrowLeft, Hospital, Plus, Trash2 } from 'lucide-react';

const UNIT_OPTIONS = ["IGD", "ICU", "NICU", "PICU", "Rawat Inap", "Rawat Jalan", "Farmasi", "Laboratorium", "Radiologi", "OK", "CSSD", "Gizi", "Rekam Medis", "Administrasi", "Lainnya"];

interface FormStandardIKPProps {
  type: string;
  onSave: (data: any, status: string) => void;
  onCancel: () => void;
}

export default function FormStandardIKP({ type, onSave, onCancel }: FormStandardIKPProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [rekomendasiList, setRekomendasiList] = useState([{ akar: "", solusi: "" }]);

  const addRekomendasi = () => setRekomendasiList([...rekomendasiList, { akar: "", solusi: "" }]);
  const removeRekomendasi = (i: number) => setRekomendasiList(rekomendasiList.filter((_, idx) => idx !== i));
  const updateRekomendasi = (i: number, field: string, val: string) => {
    const updated = [...rekomendasiList];
    updated[i] = { ...updated[i], [field]: val };
    setRekomendasiList(updated);
  };

  const handleCetak = () => window.print();

  const onSubmitDraft = (data: any) => onSave({ ...data, type, rekomendasi: rekomendasiList }, "DRAFT");
  const onSubmitFinal = (data: any) => onSave({ ...data, type, rekomendasi: rekomendasiList }, "FINAL");

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
              Laporan Insiden: {type}
            </h2>
            <p className="text-emerald-100 mt-2 font-medium text-sm md:text-base max-w-2xl leading-relaxed">
              Pelaporan Insiden Keselamatan Pasien internal rumah sakit yang bersifat rahasia dan anonim untuk pembelajaran berkelanjutan.
            </p>
          </div>
        </div>
      </div>

      <form className="p-6 md:p-10 space-y-10">
        
        {/* SECTION 1: Data Pasien */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">1. Data Pasien</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Nama / No RM</label>
              <input type="text" {...register("nama_pasien")} placeholder="Inisial atau No Rekam Medis" className="w-full md:w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Umur</label>
              <div className="flex flex-wrap gap-3">
                {["0-1 bulan", ">1 bln - 1 thn", ">1 thn - 5 thn", ">5 thn - 15 thn", ">15 thn - 30 thn", ">30 thn - 65 thn", ">65 tahun"].map(u => (
                  <label key={u} className="flex items-center gap-2 p-2 px-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-emerald-50">
                    <input type="radio" value={u} {...register("umur")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                    <span className="text-[11px] font-bold text-gray-700">{u}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Jenis Kelamin</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="Laki-laki" {...register("jk")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                    <span className="text-xs font-bold text-gray-700">Laki-laki</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="Perempuan" {...register("jk")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                    <span className="text-xs font-bold text-gray-700">Perempuan</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Penanggung Biaya</label>
                <div className="flex flex-wrap gap-3">
                  {["Pribadi", "Pemerintah", "BPJS", "Asuransi Swasta", "Perusahaan"].map(b => (
                    <label key={b} className="flex items-center gap-2">
                      <input type="checkbox" value={b} {...register("biaya")} className="w-4 h-4 text-emerald-600 rounded" />
                      <span className="text-[11px] font-bold text-gray-700">{b}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Tanggal Masuk RS</label>
                   <input type="date" {...register("tgl_masuk")} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm font-semibold focus:ring-1 focus:ring-emerald-500" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Jam Masuk</label>
                   <input type="time" {...register("jam_masuk")} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm font-semibold focus:ring-1 focus:ring-emerald-500" />
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Rincian Kejadian */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">2. Rincian Kejadian Insiden</h3>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-1">
                 <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tanggal Insiden <span className="text-red-500">*</span></label>
                 <input type="date" {...register("tgl_insiden", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Jam Insiden <span className="text-red-500">*</span></label>
                 <input type="time" {...register("jam_insiden", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
               </div>
               <div className="flex-[2]">
                 <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Nama Insiden <span className="text-red-500">*</span></label>
                 <input type="text" {...register("nama_insiden", { required: true })} placeholder="Contoh: Pasien Jatuh" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
               </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Kronologis Insiden <span className="text-red-500">*</span></label>
              <textarea 
                {...register("kronologis", { required: true })} 
                rows={4} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Insiden Terjadi Pada</label>
                 <select {...register("terjadi_pada")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                    <option value="">Pilih...</option>
                    <option value="Pasien">Pasien</option>
                    <option value="Karyawan">Karyawan</option>
                    <option value="Pengunjung">Pengunjung</option>
                    <option value="Pendamping">Pendamping</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Kategori Pasien</label>
                 <select {...register("kategori_pasien")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                    <option value="">Pilih...</option>
                    <option value="Rawat Inap">Rawat Inap</option>
                    <option value="Rawat Jalan">Rawat Jalan</option>
                    <option value="IGD">IGD</option>
                 </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Lokoasi Kejadian</label>
                  <select {...register("lokasi")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                    <option value="">Pilih Unit...</option>
                    {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Spesialisasi</label>
                  <input type="text" {...register("spesialisasi")} placeholder="Contoh: Penyakit Dalam" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Unit Penyebab</label>
                  <select {...register("unit_penyebab")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                    <option value="">Pilih Unit...</option>
                    {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Akibat Insiden (Terhadap Pasien)</label>
               <div className="flex flex-wrap gap-4">
                 {["Kematian", "Cedera Berat", "Cedera Sedang", "Cedera Ringan", "Tidak Ada Cedera"].map(o => (
                   <label key={o} className="flex items-center gap-2 p-2 px-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-emerald-50 shadow-3xs">
                     <input type="radio" value={o} {...register("akibat")} className="w-4 h-4 text-emerald-600 accent-emerald-600" />
                     <span className="text-xs font-bold text-gray-700">{o}</span>
                   </label>
                 ))}
               </div>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tindakan Segera Yang Dilakukan</label>
               <textarea {...register("tindakan_segera")} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500" />
            </div>
            
            <div>
               <label className="block text-[11px] font-bold text-gray-500 mb-3 uppercase tracking-wide">Tindakan Segera Dilakukan Oleh</label>
               <div className="flex gap-4">
                  {["Dokter", "Perawat", "Petugas Lainnya"].map(r => (
                     <label key={r} className="flex items-center gap-2">
                       <input type="checkbox" value={r} {...register("tindakan_segera_oleh")} className="w-4 h-4 text-emerald-600 rounded" />
                       <span className="text-[11px] font-bold text-gray-700">{r}</span>
                     </label>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 & 4: Tipe & Penyebab */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
              <div className="border-b border-gray-100 pb-3 mb-5">
                <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">3. Tipe Insiden</h3>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Tipe Insiden Utama</label>
                    <select {...register("tipe_insiden")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                      <option value="">Pilih...</option>
                      <option value="Administrasi Klinis">Administrasi Klinis</option>
                      <option value="Proses Klinis">Proses Klinis / Prosedur</option>
                      <option value="Dokumentasi">Dokumentasi</option>
                      <option value="Medikasi / Cairan">Medikasi / Cairan</option>
                      <option value="Darah / Produk Darah">Darah / Produk Darah</option>
                      <option value="Nutrisi">Nutrisi</option>
                      <option value="Oksigen / Gas">Oksigen / Gas</option>
                      <option value="Alat Medis">Alat Medis</option>
                      <option value="Jatuh">Jatuh</option>
                      <option value="Lainnya">Kecelakaan Lainnya</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Sub Tipe Insiden</label>
                    <input type="text" {...register("sub_tipe_insiden")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                 </div>
              </div>
           </div>
           
           <div>
              <div className="border-b border-gray-100 pb-3 mb-5">
                <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">4. Faktor Penyebab</h3>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Faktor Kontributor (Pilih yg sesuai)</label>
                 <MultiSelect
                   options={["Faktor Eksternal", "Faktor Organisasi", "Faktor Lingkungan Kerja", "Faktor Tim", "Faktor Petugas", "Faktor Tugas", "Faktor Pasien", "Faktor Komunikasi"]}
                   selected={watch("faktor_kontributor")?.split(",").map((s: string) => s.trim()).filter(Boolean) || []}
                   onChange={(val) => setValue("faktor_kontributor", val.join(", "), { shouldValidate: true })}
                   placeholder="Pilih faktor..."
                 />
              </div>
           </div>
        </section>

        {/* SECTION 5: Rekomendasi/Solusi */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">5. Akar Masalah & Rekomendasi</h3>
          </div>
          <div className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-100/80 border-b border-gray-200 text-xs text-gray-600 font-bold uppercase tracking-wider">
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">Akar Masalah</th>
                      <th className="p-4">Rekomendasi / Solusi</th>
                      <th className="p-4 w-16 text-center">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {rekomendasiList.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                         <td className="p-4 text-center font-bold text-gray-400 text-sm">{idx + 1}</td>
                         <td className="p-4">
                            <textarea value={row.akar} onChange={(e) => updateRekomendasi(idx, "akar", e.target.value)} rows={2} className="w-full border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 border bg-gray-50" placeholder="Penyebab akar kejadian..." />
                         </td>
                         <td className="p-4">
                            <textarea value={row.solusi} onChange={(e) => updateRekomendasi(idx, "solusi", e.target.value)} rows={2} className="w-full border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 border bg-gray-50" placeholder="Solusi yang direkomendasikan..." />
                         </td>
                         <td className="p-4 text-center">
                            <button type="button" onClick={() => removeRekomendasi(idx)} disabled={rekomendasiList.length === 1} className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50">
                               <Trash2 size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             <div className="p-3 border-t border-gray-200 bg-white">
                <button type="button" onClick={addRekomendasi} className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                   <Plus size={14} /> Tambah Akar Masalah
                </button>
             </div>
          </div>
        </section>

        {/* SECTION 7: Grading Risiko */}
        <section>
          <div className="border-b border-gray-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-wider">6. Grading Risiko Kejadian</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: "Biru", label: "Rendah", color: "bg-blue-50 border-blue-200 text-blue-700", ring: "focus:ring-blue-500" },
              { id: "Hijau", label: "Sedang", color: "bg-emerald-50 border-emerald-200 text-emerald-700", ring: "focus:ring-emerald-500" },
              { id: "Kuning", label: "Tinggi", color: "bg-yellow-50 border-yellow-200 text-yellow-700", ring: "focus:ring-yellow-500" },
              { id: "Merah", label: "Ekstrem", color: "bg-red-50 border-red-200 text-red-700", ring: "focus:ring-red-500" },
            ].map(g => (
               <label key={g.id} className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${watch("grading") === g.id ? `${g.color} ring-4 ring-opacity-50 ${g.ring}` : 'bg-white border-gray-100 text-gray-500 hover:shadow-md'}`}>
                  <input type="radio" value={g.id} {...register("grading")} className="absolute opacity-0" />
                  <span className="block text-xl font-black uppercase tracking-tight">{g.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{g.label}</span>
               </label>
            ))}
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
