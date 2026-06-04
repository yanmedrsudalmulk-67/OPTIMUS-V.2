import React, { useState, useMemo } from "react";
import { Copy, Plus, Eye, Key, Trash, Calendar, Building, AlertTriangle, ShieldCheck, FileSignature, CheckCircle, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";

export default function IKPHistory({ dataList, onEdit }: any) {
  const [viewData, setViewData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterGrading, setFilterGrading] = useState("Semua");

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("indicator_inputs").delete().eq("id", deleteId);
    if (error) {
      alert("Gagal menghapus data");
    } else {
      // Show success briefly
      alert("Laporan berhasil dihapus");
    }
    setDeleteId(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: string, rawNotes: any) => {
    let parsedNotes: any = {};
    if (typeof rawNotes === "string") {
      try {
        parsedNotes = JSON.parse(rawNotes);
      } catch (e) {}
    } else if (rawNotes && typeof rawNotes === "object") {
      parsedNotes = { ...rawNotes };
    }
    
    parsedNotes = { ...parsedNotes, statusLaporan: newStatus };
    const { error } = await supabase.from("indicator_inputs").update({ notes: JSON.stringify(parsedNotes) }).eq("id", id);
    if (error) alert("Gagal mengubah status");
  };

  const filteredData = useMemo(() => {
    return dataList.filter((item: any) => {
      const lokasi = (item.fullFormData?.lokasiKejadian || item.fullFormData?.unitPenyebab || item.unit || "").toLowerCase();
      const tipe = (item.fullFormData?.jenisInsiden || item.fullFormData?.tipeInsiden || "").toLowerCase();
      const subTipe = (item.fullFormData?.subTipeInsiden || item.fullFormData?.namaInsiden || item.keterangan || "").toLowerCase();
      const grading = (item.fullFormData?.gradingRisiko || "N/A").toLowerCase();
      const status = item.statusLaporan || "Dilaporkan";

      // Search match
      const q = searchQuery.toLowerCase();
      const matchSearch = q === "" || 
        lokasi.includes(q) || 
        tipe.includes(q) || 
        subTipe.includes(q) || 
        grading.includes(q);

      // Status match
      const matchStatus = filterStatus === "Semua" || status === filterStatus;

      // Grading match
      const matchGrading = filterGrading === "Semua" || grading === filterGrading.toLowerCase();

      return matchSearch && matchStatus && matchGrading;
    });
  }, [dataList, searchQuery, filterStatus, filterGrading]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar size={16} strokeWidth={3} />
            </span>
            Riwayat Laporan IKP
          </h2>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Daftar laporan Insiden Keselamatan Pasien yang telah tersimpan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input
               type="text"
               placeholder="Cari Lokasi, Tipe..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
             />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="Semua">Semua Status</option>
            <option value="Dilaporkan">Dilaporkan</option>
            <option value="Diterima">Diterima</option>
          </select>
          <select 
            value={filterGrading}
            onChange={(e) => setFilterGrading(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="Semua">Semua Grading</option>
            <option value="Biru">Biru</option>
            <option value="Hijau">Hijau</option>
            <option value="Kuning">Kuning</option>
            <option value="Merah">Merah</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#10a37f] text-white font-bold hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-center border-r border-[#10a37f]/20 w-12 rounded-tl-xl">No</th>
              <th className="px-6 py-3 border-r border-[#10a37f]/20">Tanggal Kejadian</th>
              <th className="px-6 py-3 border-r border-[#10a37f]/20">Lokasi Kejadian</th>
              <th className="px-6 py-3 border-r border-[#10a37f]/20">Tipe Insiden</th>
              <th className="px-6 py-3 border-r border-[#10a37f]/20">Sub Tipe Insiden</th>
              <th className="px-6 py-3 text-center border-r border-[#10a37f]/20">Grading</th>
              <th className="px-6 py-3 text-center border-r border-[#10a37f]/20">Status Laporan</th>
              <th className="px-6 py-3 text-center rounded-tr-xl">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 flex flex-col md:table-row-group gap-4 p-4 md:p-0">
            {filteredData.length === 0 && (
              <tr className="md:table-row flex justify-center w-full">
                <td colSpan={8} className="px-6 py-16 w-full">
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 w-full max-w-sm mx-auto">
                    <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                      <FileSignature size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-700">Belum Ada Laporan IKP</h3>
                    <p className="text-sm font-medium text-slate-500 text-center mt-1">
                      Data riwayat Insiden Keselamatan Pasien masih kosong
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredData.map((item: any, i: number) => {
              const grading = item.fullFormData?.gradingRisiko || "N/A";
              let gradingColor = "bg-gray-100 text-gray-600 border-gray-200";
              if (grading === "Biru") gradingColor = "bg-blue-50 text-blue-700 border-blue-200";
              if (grading === "Hijau") gradingColor = "bg-green-50 text-green-700 border-green-200";
              if (grading === "Kuning") gradingColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
              if (grading === "Merah") gradingColor = "bg-red-50 text-red-700 border-red-200";

              const status = item.statusLaporan || "Dilaporkan";

              return (
                <tr key={item.id} className="bg-white border md:border-none border-gray-200 rounded-2xl shadow-sm md:shadow-none p-4 md:p-0 flex flex-col md:table-row hover:bg-slate-50/80 transition-all font-medium text-slate-600">
                  <td className="px-4 py-3 md:text-center text-slate-400 flex md:table-cell items-center justify-between before:content-['No:'] md:before:content-none before:font-bold before:text-slate-800 border-b md:border-none border-gray-100">
                    <span className="font-semibold">{i + 1}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-800 flex md:table-cell items-center justify-between before:content-['Tanggal:'] md:before:content-none before:font-bold border-b md:border-none border-gray-100">
                    {formatDate(item.fullFormData?.tanggalKejadian || item.tanggal)}
                  </td>
                  <td className="px-6 py-3 flex md:table-cell items-center justify-between before:content-['Lokasi:'] md:before:content-none before:font-bold before:text-slate-800 border-b md:border-none border-gray-100">
                    {item.fullFormData?.lokasiKejadian || item.fullFormData?.unitPenyebab || item.unit || "-"}
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-700 flex md:table-cell items-center justify-between before:content-['Tipe:'] md:before:content-none before:font-bold border-b md:border-none border-gray-100">
                    {item.fullFormData?.jenisInsiden || item.fullFormData?.tipeInsiden || "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-500 max-w-[150px] truncate md:whitespace-normal flex md:table-cell items-center justify-between before:content-['Sub_Tipe:'] md:before:content-none before:font-bold before:text-slate-800 border-b md:border-none border-gray-100">
                    {item.fullFormData?.subTipeInsiden || item.fullFormData?.namaInsiden || item.keterangan || "-"}
                  </td>
                  <td className="px-6 py-3 md:text-center flex md:table-cell items-center justify-between before:content-['Grading:'] md:before:content-none before:font-bold before:text-slate-800 border-b md:border-none border-gray-100">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase border ${gradingColor}`}>
                      {grading}
                    </span>
                  </td>
                  <td className="px-6 py-3 md:text-center flex md:table-cell items-center justify-between before:content-['Status:'] md:before:content-none before:font-bold before:text-slate-800 border-b md:border-none border-gray-100">
                    <select
                      value={status}
                      onChange={(e) => handleUpdateStatus(item.id, e.target.value, item.rawNotes)}
                      className={`text-xs font-black uppercase rounded-lg px-2.5 py-1.5 outline-none cursor-pointer appearance-none text-center bg-white border shadow-sm ${status === "Diterima" ? "text-emerald-700 border-emerald-200" : "text-amber-700 border-amber-200"}`}
                    >
                      <option value="Dilaporkan">Dilaporkan</option>
                      <option value="Diterima">Diterima</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 md:py-3 text-center flex md:table-cell items-center justify-between before:content-['Aksi:'] md:before:content-none before:font-bold before:text-slate-800">
                    <div className="flex justify-end gap-2 w-full md:w-auto md:justify-center">
                       <button onClick={() => setViewData(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors tooltip flex-1 md:flex-none justify-center flex" title="Lihat Laporan">
                         <Eye size={16} strokeWidth={2.5} />
                       </button>
                       <button onClick={() => setDeleteId(item.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors tooltip flex-1 md:flex-none justify-center flex" title="Hapus">
                         <Trash size={16} strokeWidth={2.5} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL PRINT / VIEW DETAIL */}
      <AnimatePresence>
        {viewData && (
          <div className="fixed inset-0 z-[200] flex py-10 justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white mx-4 rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 my-auto"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4 px-6 flex justify-between items-center z-10 rounded-t-3xl shadow-sm print:hidden">
                <h2 className="text-xl font-black text-slate-800">Detail Laporan</h2>
                <div className="flex gap-3">
                  <button className="px-6 py-2.5 font-bold text-white bg-[#10a37f] shadow-lg shadow-emerald-500/20 rounded-xl hover:bg-emerald-700 transition" onClick={() => window.print()}>
                    Cetak PDF
                  </button>
                  <button className="px-6 py-2.5 font-bold text-slate-700 bg-white border border-gray-300 rounded-xl hover:bg-slate-50 transition" onClick={() => setViewData(null)}>
                    Tutup
                  </button>
                </div>
              </div>
              <div className="p-10 md:p-14" id="print-area">
                 {/* KOP SURAT RUMAH SAKIT */}
                 <div className="flex items-center border-b-4 border-slate-800 pb-6 mb-8 gap-6">
                   <div className="w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-sm uppercase px-2 shrink-0">
                     LOGO RS
                   </div>
                   <div className="flex-1 text-center font-bold">
                     <h1 className="text-2xl uppercase tracking-widest text-slate-600">KOTA SUKABUMI</h1>
                     <h2 className="text-3xl uppercase font-black tracking-wide text-slate-900 mt-1 mb-1">UOBK RSUD AL-MULK</h2>
                     <p className="text-sm font-semibold text-slate-500">Jl. Pelabuhan II KM 6 Lembursitu Kota Sukabumi, Jawa Barat</p>
                   </div>
                   <div className="w-24 h-24 shrink-0" />
                 </div>

                 <div className="text-center mb-10">
                   <h3 className="text-2xl font-black uppercase underline decoration-2 underline-offset-4 text-slate-800">LAPORAN INSIDEN KESELAMATAN PASIEN (IKP)</h3>
                   <p className="text-sm font-bold mt-2 text-slate-500 bg-slate-100 inline-block px-4 py-1 rounded-full">Doc ID: {viewData.id}</p>
                 </div>

                 <div className="space-y-8 text-[15px] font-medium text-slate-700">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="w-56 font-bold py-1.5 text-slate-900">Tanggal Pelaporan</td>
                          <td className="px-2 py-1.5">: {formatDate(viewData.fullFormData?.tanggalLapor || viewData.tanggal)} {viewData.fullFormData?.jamLapor ? `- ${viewData.fullFormData?.jamLapor}` : ""}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-1.5 text-slate-900">Pelapor / Jabatan</td>
                          <td className="px-2 py-1.5">: {viewData.fullFormData?.pelapor || viewData.fullFormData?.pelaporPertama || "-"} / {viewData.fullFormData?.jabatan || "-"}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-1.5 text-slate-900">Unit Pelapor</td>
                          <td className="px-2 py-1.5">: {viewData.fullFormData?.unitPelapor || viewData.unit}</td>
                        </tr>
                      </tbody>
                    </table>

                   <div className="border border-slate-200 rounded-2xl overflow-hidden print:border-none print:rounded-none">
                     <div className="bg-slate-50 border-b border-slate-200 p-4 print:p-0 print:border-b-2 print:border-black print:bg-white text-lg font-black text-slate-800 uppercase tracking-tight">
                        I. INFORMASI KEJADIAN
                     </div>
                     <div className="p-4 print:p-0 print:pt-4">
                       <table className="w-full">
                         <tbody>
                           <tr>
                             <td className="w-56 font-bold py-1.5">Tanggal Kejadian</td>
                             <td className="px-2 py-1.5">: {formatDate(viewData.fullFormData?.tanggalKejadian || viewData.tanggal)}</td>
                           </tr>
                           <tr>
                             <td className="font-bold py-1.5">Jam Kejadian</td>
                             <td className="px-2 py-1.5">: {viewData.fullFormData?.jamKejadian || "-"}</td>
                           </tr>
                           <tr>
                             <td className="font-bold py-1.5">Lokasi Kejadian</td>
                             <td className="px-2 py-1.5">: {viewData.fullFormData?.lokasiKejadian || viewData.fullFormData?.unitPenyebab || "-"}</td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                   </div>

                   <div className="border border-slate-200 rounded-2xl overflow-hidden print:border-none print:rounded-none">
                     <div className="bg-slate-50 border-b border-slate-200 p-4 print:p-0 print:border-b-2 print:border-black print:bg-white text-lg font-black text-slate-800 uppercase tracking-tight">
                        II. JENIS INSIDEN
                     </div>
                     <div className="p-4 print:p-0 print:pt-4">
                       <table className="w-full">
                         <tbody>
                           <tr>
                             <td className="w-56 font-bold py-1.5 align-top">Tipe Insiden</td>
                             <td className="px-2 py-1.5">: {viewData.fullFormData?.jenisInsiden || viewData.fullFormData?.tipeInsiden || "-"}</td>
                           </tr>
                           <tr>
                             <td className="font-bold py-1.5 align-top">Sub Tipe Insiden</td>
                             <td className="px-2 py-1.5">: {viewData.fullFormData?.subTipeInsiden || viewData.fullFormData?.namaInsiden || viewData.keterangan || "-"}</td>
                           </tr>
                           <tr>
                             <td className="font-bold py-1.5 align-top">Grading Risiko</td>
                             <td className="px-2 py-1.5">: <span className="font-bold uppercase px-3 py-1 bg-slate-100 text-slate-800 rounded-md border">{viewData.fullFormData?.gradingRisiko || "N/A"}</span></td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                   </div>

                   <div className="border border-slate-200 rounded-2xl overflow-hidden print:border-none print:rounded-none">
                     <div className="bg-slate-50 border-b border-slate-200 p-4 print:p-0 print:border-b-2 print:border-black print:bg-white text-lg font-black text-slate-800 uppercase tracking-tight">
                        III. URAIAN KEJADIAN & TINDAKLANJUT
                     </div>
                     <div className="p-4 print:p-0 print:pt-4 space-y-4">
                       <div>
                         <p className="font-bold mb-1">Kronologi Kejadian :</p>
                         <p className="p-3 bg-slate-50 rounded-xl print:bg-white print:p-0 print:border-none border border-slate-100 whitespace-pre-wrap">{viewData.fullFormData?.kronologis || viewData.keterangan || "-"}</p>
                       </div>
                       <div>
                         <p className="font-bold mb-1">Dampak Pada Pasien :</p>
                         <p className="p-3 bg-slate-50 rounded-xl print:bg-white print:p-0 print:border-none border border-slate-100 whitespace-pre-wrap">{viewData.fullFormData?.akibat || "-"}</p>
                       </div>
                       <div>
                         <p className="font-bold mb-1">Tindakan Segera :</p>
                         <p className="p-3 bg-slate-50 rounded-xl print:bg-white print:p-0 print:border-none border border-slate-100 whitespace-pre-wrap">{viewData.fullFormData?.tindakanSegera || "-"}</p>
                       </div>
                       <div>
                         <p className="font-bold mb-1">Tindakan Dilakukan Oleh :</p>
                         <p className="p-3 bg-slate-50 rounded-xl print:bg-white print:p-0 print:border-none border border-slate-100 whitespace-pre-wrap">{viewData.fullFormData?.tindakLanjutOleh || "-"}</p>
                       </div>
                       {viewData.fullFormData?.analisisPenyebab && (
                         <div>
                           <p className="font-bold mb-1">Analisis Penyebab :</p>
                           <p className="p-3 bg-slate-50 rounded-xl print:bg-white print:p-0 print:border-none border border-slate-100 whitespace-pre-wrap">{viewData.fullFormData?.analisisPenyebab}</p>
                         </div>
                       )}
                       {viewData.fullFormData?.rekomendasiPerbaikan && (
                         <div>
                           <p className="font-bold mb-1">Rekomendasi Perbaikan :</p>
                           <p className="p-3 bg-slate-50 rounded-xl print:bg-white print:p-0 print:border-none border border-slate-100 whitespace-pre-wrap">{viewData.fullFormData?.rekomendasiPerbaikan}</p>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 {/* Signatures */}
                 <div className="grid grid-cols-2 gap-8 mt-16 text-center text-[15px] px-10">
                   <div>
                     <p className="font-bold mb-2">Pelapor</p>
                     {viewData.fullFormData?.pembuatSignature ? (
                       <img src={viewData.fullFormData?.pembuatSignature} alt="Tanda Tangan Pembuat" className="h-24 mx-auto" style={{ mixBlendMode: 'multiply' }} />
                     ) : (
                       <div className="h-24" />
                     )}
                     <p className="font-bold underline decoration-2 underline-offset-4">{viewData.fullFormData?.pelapor || viewData.fullFormData?.pelaporPertama || "( .................... )"}</p>
                     <p className="mt-1 font-medium text-slate-500">{viewData.fullFormData?.jabatan || "Petugas"}</p>
                   </div>
                   <div>
                     <p className="font-bold mb-2">Penerima Laporan</p>
                     {viewData.fullFormData?.penerimaSignature ? (
                       <img src={viewData.fullFormData?.penerimaSignature} alt="Tanda Tangan Penerima" className="h-24 mx-auto" style={{ mixBlendMode: 'multiply' }} />
                     ) : (
                       <div className="h-24" />
                     )}
                     <p className="font-bold underline decoration-2 underline-offset-4">{viewData.fullFormData?.penerimaLaporan || "( .................... )"}</p>
                     <p className="mt-1 font-medium text-slate-500">Komite Mutu / Keselamatan Pasien</p>
                   </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-gray-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Laporan IKP</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  Anda yakin ingin menghapus data ini?<br/>Data yang dihapus tidak dapat dikembalikan.
                </p>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Tidak
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

