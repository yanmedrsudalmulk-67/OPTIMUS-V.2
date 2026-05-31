/* eslint-disable */
import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import { Save, X, FileText, AlertTriangle, User, History, CheckSquare, Activity, ChevronDown, List, Clock, Calendar } from 'lucide-react';

const UMUR_OPTIONS = [
  "0–1 bulan", ">1 bulan–1 tahun", ">1–5 tahun", ">5–15 tahun", ">15–30 tahun", ">30–65 tahun", ">65 tahun"
];

const PELAPOR_OPTIONS = [
  "Karyawan - Dokter", "Karyawan - Perawat", "Karyawan - Petugas Lainnya", "Pasien", "Keluarga/Pendamping", "Pengunjung", "Lain-lain"
];

const TERJADI_PADA_OPTIONS = [
  "Pasien", "Pengunjung", "Karyawan", "Pendamping Pasien", "Lain-lain"
];

const MENYANGKUT_PASIEN_OPTIONS = [
  "Pasien Rawat Inap", "Pasien Rawat Jalan", "Pasien IGD", "Lain-lain"
];

const SPESIALISASI_OPTIONS = [
  "Penyakit Dalam", "Anak", "Bedah", "Obgyn", "THT", "Mata", "Saraf", "Anastesi", "Kulit & Kelamin", "Jantung", "Paru", "Jiwa", "Lain-lain"
];

const AKIBAT_OPTIONS = [
  "Kematian", "Cedera Irreversibel / Berat", "Cedera Reversibel / Sedang", "Cedera Ringan", "Tidak Ada Cedera"
];

const GRADING_OPTIONS = [
  { id: "Biru", label: "Rendah", color: "bg-blue-50 border-blue-200 text-blue-700", ring: "focus:ring-blue-500" },
  { id: "Hijau", label: "Sedang", color: "bg-green-50 border-green-200 text-green-700", ring: "focus:ring-green-500" },
  { id: "Kuning", label: "Tinggi", color: "bg-yellow-50 border-yellow-200 text-yellow-700", ring: "focus:ring-yellow-500" },
  { id: "Merah", label: "Ekstrem", color: "bg-red-50 border-red-200 text-red-700", ring: "focus:ring-red-500" },
];

export default function FormIKP({ initialData, onSave, onCancel }: { initialData?: any, onSave: (data: any, status: string) => void, onCancel: () => void }) {
  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<any>({
    defaultValues: {
      tipe_insiden: "", sub_tipe_insiden: "",
      nama_pasien: "", no_rm: "", umur: "", jenis_kelamin: "", penanggung_biaya: "", tgl_masuk: "", jam_masuk: "",
      tgl_insiden: "", jam_insiden: "", insiden: "", kronologis: "",
      pelapor_pertama: "", pelapor_sebutkan: "",
      terjadi_pada: "", terjadi_pada_sebutkan: "",
      menyangkut_pasien: "", menyangkkut_pasien_sebutkan: "",
      spesialisasi: "", spesialisasi_sebutkan: "",
      akibat: "",
      tindakan_segera: "",
      tindakan_oleh: [], tindakan_oleh_sebutkan: "",
      kejadian_serupa: "Tidak", kejadian_serupa_kapan: "", kejadian_serupa_tindakan: "",
      penyebab_langsung: "", akar_penyebab: "", rekomendasi: "", faktor_kontributor: [],
      grading: "",
      nama_pembuat: "", tgl_lapor: "", nama_penerima: "", tgl_terima: ""
    }
  });

  const sigPembuatRef = useRef<SignatureCanvas>(null);
  const sigPenerimaRef = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
      
      // We need a slight delay to ensure canvas is ready
      setTimeout(() => {
        if (initialData.ttd_pembuat && sigPembuatRef.current) {
          sigPembuatRef.current.fromDataURL(initialData.ttd_pembuat);
        }
        if (initialData.ttd_penerima && sigPenerimaRef.current) {
          sigPenerimaRef.current.fromDataURL(initialData.ttd_penerima);
        }
      }, 100);
    }
  }, [initialData, reset]);

  const watchPelapor = watch("pelapor_pertama");
  const watchTerjadiPada = watch("terjadi_pada");
  const watchMenyangkut = watch("menyangkut_pasien");
  const watchSpesialisasi = watch("spesialisasi");
  const watchTindakanOleh = watch("tindakan_oleh");
  const watchKejadianSerupa = watch("kejadian_serupa");

  const clearSignaturePembuat = () => sigPembuatRef.current?.clear();
  const clearSignaturePenerima = () => sigPenerimaRef.current?.clear();

  const handleSave = async (data: any) => {
    setIsSubmitting(true);
    try {
      const pembuatDataUrl = sigPembuatRef.current?.isEmpty() ? null : sigPembuatRef.current?.toDataURL();
      const penerimaDataUrl = sigPenerimaRef.current?.isEmpty() ? null : sigPenerimaRef.current?.toDataURL();

      const finalData = { ...data, ttd_pembuat: pembuatDataUrl, ttd_penerima: penerimaDataUrl };
      await onSave(finalData, "Dilaporkan");
    } catch(err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTindakanLainnya = Array.isArray(watchTindakanOleh) ? watchTindakanOleh.includes("Petugas Lainnya") : watchTindakanOleh === "Petugas Lainnya";

  return (
    <form onSubmit={handleSubmit(handleSave)} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 px-6 md:px-8 py-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">Formulir Laporan IKP</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium">Lengkapi data insiden keselamatan pasien dengan detail dan akurat.</p>
        </div>
        <AlertTriangle size={32} className="text-[#10a37f] opacity-80 hidden md:block" />
      </div>

      <div className="p-6 md:p-8 space-y-12">
        {/* TIPE INSIDEN */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
            <div className="p-2 bg-emerald-50 text-[#10a37f] rounded-lg"><Activity size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">L. Tipe Insiden</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tipe Insiden Utama <span className="text-red-500">*</span></label>
              <select {...register("tipe_insiden", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                <option value="">-- Pilih Tipe --</option>
                <option value="KPC">KPC</option>
                <option value="KTC">KTC</option>
                <option value="KNC">KNC</option>
                <option value="KTD">KTD</option>
                <option value="Sentinel">Sentinel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Sub Tipe Insiden</label>
              <input type="text" {...register("sub_tipe_insiden")} placeholder="Contoh: Kejadian kesalahan pemberian obat" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold placeholder:text-gray-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

        {/* DATA PASIEN */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">B. Data Pasien</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Nama Pasien (Inisial) <span className="text-red-500">*</span></label>
              <input type="text" {...register("nama_pasien", { required: true })} placeholder="Contoh: AN" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Nomor Rekam Medis <span className="text-red-500">*</span></label>
              <input type="text" {...register("no_rm", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Umur <span className="text-red-500">*</span></label>
              <select {...register("umur", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                <option value="">-- Pilih Umur --</option>
                {UMUR_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Jenis Kelamin <span className="text-red-500">*</span></label>
                <div className="flex gap-6">
                  {["Laki-laki", "Perempuan"].map(jk => (
                    <label key={jk} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" value={jk} {...register("jenis_kelamin", { required: true })} className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{jk}</span>
                    </label>
                  ))}
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Penanggung Biaya <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-4">
                  {["Pribadi", "Pemerintah", "BPJS", "Asuransi Swasta", "Perusahaan"].map(jk => (
                    <label key={jk} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" value={jk} {...register("penanggung_biaya", { required: true })} className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{jk}</span>
                    </label>
                  ))}
                </div>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tanggal Masuk RS <span className="text-red-500">*</span></label>
              <input type="date" {...register("tgl_masuk", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Jam Masuk RS <span className="text-red-500">*</span></label>
              <input type="time" {...register("jam_masuk", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
          </div>
        </section>

        {/* RINCIAN KEJADIAN */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">C. Rincian Kejadian</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Tanggal Insiden <span className="text-red-500">*</span></label>
              <input type="date" {...register("tgl_insiden", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Jam Insiden <span className="text-red-500">*</span></label>
              <input type="time" {...register("jam_insiden", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Insiden <span className="text-red-500">*</span></label>
            <textarea {...register("insiden", { required: true })} placeholder="Kejadian kesalahan pemberian obat" rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold resize-y placeholder:text-gray-400 placeholder:font-normal"></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Kronologis Insiden <span className="text-red-500">*</span></label>
            <textarea {...register("kronologis", { required: true })} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold resize-y"></textarea>
          </div>
        </section>

        {/* ORANG PERTAMA MELAPORKAN */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">D. Pelapor Insiden</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <select {...register("pelapor_pertama", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                    <option value="">-- Orang Pertama Yang Melaporkan --</option>
                    {PELAPOR_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {(watchPelapor === "Karyawan - Petugas Lainnya" || watchPelapor === "Lain-lain") && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                    <input type="text" {...register("pelapor_sebutkan", { required: true })} placeholder="Sebutkan..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
                  </div>
                )}
              </div>
           </div>
           <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">E. Insiden Terjadi Pada</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <select {...register("terjadi_pada", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                    <option value="">-- Insiden Terjadi Pada --</option>
                    {TERJADI_PADA_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {(watchTerjadiPada === "Lain-lain") && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                    <input type="text" {...register("terjadi_pada_sebutkan", { required: true })} placeholder="Sebutkan..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
                  </div>
                )}
              </div>
           </div>
        </section>

        {/* F & G */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><CheckSquare size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">F. Menyangkut Pasien</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <select {...register("menyangkut_pasien")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                    <option value="">-- Pilih --</option>
                    {MENYANGKUT_PASIEN_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {(watchMenyangkut === "Lain-lain") && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                    <input type="text" {...register("menyangkut_pasien_sebutkan")} placeholder="Keterangan..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
                  </div>
                )}
              </div>
           </div>
           <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg"><User size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">G. Spesialisasi Pasien</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <select {...register("spesialisasi")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                    <option value="">-- Spesialisasi --</option>
                    {SPESIALISASI_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {(watchSpesialisasi === "Lain-lain") && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                    <input type="text" {...register("spesialisasi_sebutkan")} placeholder="Sebutkan..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
                  </div>
                )}
              </div>
           </div>
        </section>

        {/* H, I, J */}
        <section className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">H. Akibat Insiden Terhadap Pasien</h3>
              </div>
              <select {...register("akibat", { required: true })} className="w-full max-w-md px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700">
                  <option value="">-- Pilih Akibat --</option>
                  {AKIBAT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><History size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">I. Tindakan Segera</h3>
              </div>
              <textarea {...register("tindakan_segera", { required: true })} placeholder="Tindakan yang dilakukan segera setelah kejadian dan hasilnya..." rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold resize-y"></textarea>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><User size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">J. Tindakan Dilakukan Oleh</h3>
              </div>
              <div className="flex flex-wrap gap-6 mb-4">
                  {["Tim", "Dokter", "Perawat", "Petugas Lainnya"].map(jk => (
                    <label key={jk} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" value={jk} {...register("tindakan_oleh")} className="w-4 h-4 text-[#10a37f] border-gray-300 rounded focus:ring-[#10a37f]" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{jk}</span>
                    </label>
                  ))}
              </div>
              {isTindakanLainnya && (
                 <div className="animate-in fade-in slide-in-from-top-1 max-w-md">
                   <input type="text" {...register("tindakan_oleh_sebutkan", { required: true })} placeholder="Sebutkan Petugas..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
                 </div>
              )}
            </div>
        </section>

        {/* K. Kejadian Serupa */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">K. Riwayat Kejadian Serupa</h3>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Apakah kejadian yang sama pernah terjadi di unit kerja lain?</label>
            <div className="flex gap-6">
              {["Ya", "Tidak"].map(jk => (
                <label key={jk} className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" value={jk} {...register("kejadian_serupa", { required: true })} className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{jk}</span>
                </label>
              ))}
            </div>
          </div>
          {(watchKejadianSerupa === "Ya") && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1 border-l-4 border-amber-400 pl-4 py-2 bg-amber-50/30 rounded-r-xl">
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Kapan?</label>
                  <input type="text" {...register("kejadian_serupa_kapan", { required: true })} placeholder="Kapan terjadi waktu itu?" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Langkah/Tindakan yang telah dilakukan</label>
                  <textarea {...register("kejadian_serupa_tindakan", { required: true })} placeholder="Tindakan waktu itu..." rows={2} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold resize-y"></textarea>
               </div>
            </div>
          )}
        </section>

        {/* M. Faktor Penyebab */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><AlertTriangle size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">M. Faktor Penyebab & Rekomendasi</h3>
          </div>
          <div className="space-y-6">
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Penyebab Langsung</label>
                <textarea {...register("penyebab_langsung")} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"></textarea>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Akar Penyebab Masalah</label>
                <textarea {...register("akar_penyebab")} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"></textarea>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Rekomendasi / Solusi</label>
                <textarea {...register("rekomendasi")} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"></textarea>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Pilihan Faktor Kontributor</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    "Faktor Eksternal", "Faktor Organisasi & Manajemen", "Faktor Lingkungan Kerja",
                    "Faktor Tim", "Faktor Petugas & Kinerja", "Faktor Tugas", "Faktor Pasien", "Faktor Komunikasi"
                  ].map(jk => (
                    <label key={jk} className="flex items-center gap-2 cursor-pointer group bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                      <input type="checkbox" value={jk} {...register("faktor_kontributor")} className="w-4 h-4 text-[#10a37f] border-gray-300 rounded focus:ring-[#10a37f]" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{jk}</span>
                    </label>
                  ))}
                </div>
             </div>
          </div>
        </section>

        {/* N. Grading */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Activity size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">N. Grading Risiko</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GRADING_OPTIONS.map((g) => (
               <label key={g.id} className="relative cursor-pointer group">
                  <input type="radio" value={g.id} {...register("grading", { required: true })} className="peer sr-only" />
                  <div className={"w-full p-6 bg-white border-2 border-gray-100 rounded-2xl transition-all peer-checked:shadow-md peer-hover:border-gray-200 " + "peer-focus-visible:ring-4 " + g.ring + " " + (watch("grading") === g.id ? g.color + " border-current" : "")}>
                    <div className="font-extrabold text-2xl mb-1 uppercase tracking-tight">{g.id}</div>
                    <div className="font-bold text-[11px] uppercase tracking-wider opacity-60">{g.label}</div>
                  </div>
               </label>
            ))}
          </div>
        </section>

        {/* O. TANDA TANGAN */}
        <section className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-800 text-white rounded-lg"><FileText size={20} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">O. Pengesahan Laporan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Pembuat Laporan</h4>
                <div className="w-full mb-4">
                  <input type="text" {...register("nama_pembuat", { required: true })} placeholder="Nama Lengkap" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-sm font-bold" />
                </div>
                <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl w-full h-40 mb-2 relative overflow-hidden">
                   <SignatureCanvas 
                     ref={sigPembuatRef} 
                     canvasProps={{className: 'signature-canvas w-full h-full cursor-crosshair'}} 
                   />
                </div>
                <button type="button" onClick={clearSignaturePembuat} className="text-[10px] uppercase font-black text-gray-400 hover:text-red-500 mb-4 tracking-wider">Bersihkan Tanda Tangan</button>
                <div className="w-full">
                  <input type="date" {...register("tgl_lapor", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-sm font-bold text-gray-500" />
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Penerima Laporan</h4>
                <div className="w-full mb-4">
                  <input type="text" {...register("nama_penerima", { required: true })} placeholder="Nama Lengkap" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-sm font-bold" />
                </div>
                <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl w-full h-40 mb-2 relative overflow-hidden">
                   <SignatureCanvas 
                     ref={sigPenerimaRef} 
                     canvasProps={{className: 'signature-canvas w-full h-full cursor-crosshair'}} 
                   />
                </div>
                <button type="button" onClick={clearSignaturePenerima} className="text-[10px] uppercase font-black text-gray-400 hover:text-red-500 mb-4 tracking-wider">Bersihkan Tanda Tangan</button>
                <div className="w-full">
                  <input type="date" {...register("tgl_terima", { required: true })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-sm font-bold text-gray-500" />
                </div>
             </div>
          </div>
        </section>
      </div>

      <div className="bg-gray-50 px-6 md:px-8 py-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-10">
        <button type="button" onClick={onCancel} className="px-6 py-3 font-black bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors shadow-sm">
          Batal
        </button>
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 font-black bg-[#10a37f] hover:bg-[#0e8f6e] text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
          <Save size={18} />
          {isSubmitting ? "Menyimpan..." : "Simpan Laporan"}
        </button>
      </div>
    </form>
  );
}
