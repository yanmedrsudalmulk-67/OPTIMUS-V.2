import React, { useState } from "react";
import { Copy, Plus, Eye, Key, Trash, Calendar, Building, AlertTriangle, ShieldCheck, FileSignature, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function IKPHistory({ dataList, onEdit }: any) {
  const [viewData, setViewData] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus data IKP ini?")) {
      const { error } = await supabase.from("indicator_inputs").delete().eq("id", id);
      if (error) alert("Gagal menghapus data");
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
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
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Tanggal Kejadian</th>
              <th className="px-6 py-4">Unit Penyebab</th>
              <th className="px-6 py-4">Tipe Insiden</th>
              <th className="px-6 py-4">Sub Tipe</th>
              <th className="px-6 py-4 text-center">Grading</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {dataList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold">
                  Belum ada laporan IKP.
                </td>
              </tr>
            )}
            {dataList.map((item: any) => {
              const grading = item.fullFormData?.gradingRisiko || "N/A";
              let gradingColor = "bg-gray-100 text-gray-600 border-gray-200";
              if (grading === "Biru") gradingColor = "bg-blue-50 text-blue-700 border-blue-200";
              if (grading === "Hijau") gradingColor = "bg-green-50 text-green-700 border-green-200";
              if (grading === "Kuning") gradingColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
              if (grading === "Merah") gradingColor = "bg-red-50 text-red-700 border-red-200";

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {item.fullFormData?.tanggalKejadian || item.tanggal}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-slate-400" />
                      {item.fullFormData?.unitPenyebab || item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {item.fullFormData?.tipeInsiden || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-[150px] truncate">
                    {item.fullFormData?.subTipeInsiden || item.keterangan || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${gradingColor}`}>
                      {grading}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      <CheckCircle size={14} /> Tersimpan
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setViewData(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors tooltip" title="Lihat Laporan">
                        <Eye size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors tooltip" title="Hapus">
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

      {viewData && (
        <div className="fixed inset-0 z-50 flex py-10 justify-center bg-slate-900/40 backdrop-blur-sm overflow-y-auto w-full">
          <div className="bg-white mx-4 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-slate-50 border-b border-gray-200 p-4 flex justify-end gap-3 z-10 rounded-t-xl">
              <button className="px-5 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700" onClick={() => window.print()}>
                Cetak Laporan PDF
              </button>
              <button className="px-5 py-2 font-bold text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-slate-50" onClick={() => setViewData(null)}>
                Tutup
              </button>
            </div>
            <div className="p-10" id="print-area">
               {/* KOP SURAT RUMAH SAKIT */}
               <div className="flex items-center border-b-4 border-slate-800 pb-4 mb-8">
                 {/* TODO: Hospital Logo */}
                 <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs uppercase px-2 shrink-0">
                   LOGO RS
                 </div>
                 <div className="flex-1 text-center font-bold">
                   <h1 className="text-2xl uppercase">PEMERINTAH KOTA SUKABUMI</h1>
                   <h2 className="text-3xl uppercase font-black tracking-wide">UOBK RSUD AL-MULK</h2>
                   <p className="text-sm font-medium mt-1">Jl. Pelabuhan II KM 6 Lembursitu Kota Sukabumi, Jawa Barat</p>
                 </div>
               </div>

               <div className="text-center mb-8">
                 <h3 className="text-xl font-black uppercase underline">Laporan Insiden Keselamatan Pasien (IKP)</h3>
                 <p className="text-sm font-semibold mt-1">Nomor: {viewData.id}</p>
               </div>

               <div className="space-y-6 text-sm">
                 <table className="w-full">
                   <tbody>
                     <tr>
                       <td className="w-48 font-bold py-1">Unit Pelapor</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.unitPelapor}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1">Waktu Pelaporan</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.tanggalLapor} {viewData.fullFormData?.jamLapor}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1">Pelapor / Jabatan</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.pelapor} / {viewData.fullFormData?.jabatan}</td>
                     </tr>
                   </tbody>
                 </table>

                 <h4 className="font-black text-slate-800 border-b border-gray-200 pb-2">DATA PASIEN</h4>
                 <table className="w-full">
                   <tbody>
                     <tr>
                       <td className="w-48 font-bold py-1">Nama Pasien</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.namaPasien || "-"}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1">No. Rekam Medis</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.noRM || "-"}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1">Umur / JK</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.umur} / {viewData.fullFormData?.jenisKelamin}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1">Waktu Masuk RS</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.tanggalMasuk} {viewData.fullFormData?.jamMasuk}</td>
                     </tr>
                   </tbody>
                 </table>

                 <h4 className="font-black text-slate-800 border-b border-gray-200 pb-2">RINCIAN INSIDEN</h4>
                 <table className="w-full">
                   <tbody>
                     <tr>
                       <td className="w-48 font-bold py-1 align-top">Waktu Kejadian</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.tanggalKejadian} {viewData.fullFormData?.jamKejadian}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1 align-top">Insiden</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.insiden} ({viewData.fullFormData?.tipeInsiden})</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1 align-top">Kronologis</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.kronologis}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1 align-top">Tindakan Segera</td>
                       <td className="font-medium px-2 py-1">: {viewData.fullFormData?.tindakanSegera}</td>
                     </tr>
                     <tr>
                       <td className="font-bold py-1 align-top">Grading Risiko</td>
                       <td className="font-medium px-2 py-1">: <span className="font-bold uppercase px-2 bg-gray-100 rounded border">{viewData.fullFormData?.gradingRisiko}</span></td>
                     </tr>
                   </tbody>
                 </table>
               </div>

               <div className="grid grid-cols-2 gap-8 mt-16 text-center text-sm px-10">
                 <div>
                   <p className="font-bold mb-16">Pelapor</p>
                   {viewData.fullFormData?.pembuatSignature ? (
                     <img src={viewData.fullFormData?.pembuatSignature} alt="Tanda Tangan Pembuat" className="h-20 mx-auto" style={{ mixBlendMode: 'multiply' }} />
                   ) : (
                     <div className="h-20" />
                   )}
                   <p className="font-bold underline">{viewData.fullFormData?.pelapor}</p>
                   <p>{viewData.fullFormData?.jabatan}</p>
                 </div>
                 <div>
                   <p className="font-bold mb-16">Penerima Laporan</p>
                   {viewData.fullFormData?.penerimaSignature ? (
                     <img src={viewData.fullFormData?.penerimaSignature} alt="Tanda Tangan Penerima" className="h-20 mx-auto" style={{ mixBlendMode: 'multiply' }} />
                   ) : (
                     <div className="h-20" />
                   )}
                   <p className="font-bold underline">{viewData.fullFormData?.penerimaLaporan || "(                       )"}</p>
                   <p>Komite Mutu / Keselamatan Pasien</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
