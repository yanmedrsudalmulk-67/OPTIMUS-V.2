import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, ArrowLeft, Download, ShieldCheck } from "lucide-react";

export default function IKPDocument({
  data,
  onBack,
}: {
  data: any;
  onBack: () => void;
}) {
  const componentRef = useRef<HTMLDivElement>(null);

  const getFullFormData = () => {
    return data.fullFormData || {};
  };
  const formData = getFullFormData();

  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Laporan_IKP_${formData.namaPasien || "Inisial"}_${data.tanggal || "2026"}`,
  });

  // Unique report code generator
  const getReportNumber = () => {
    const unitSfx = String(data.unit || formData.ruangan || "GEN").slice(0, 3).toUpperCase();
    const cleanDate = String(data.tanggal || "2026-05-30").replace(/-/g, "");
    const seq = String(data.id || "").slice(-4).toUpperCase() || "0001";
    return `IKP/${unitSfx}/${cleanDate}/${seq}`;
  };

  const reportNo = getReportNumber();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-100 min-h-screen pb-16">
      {/* Styles for print (F4 size, custom layout) */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            size: 215mm 330mm; /* F4 Portrait */
            margin: 15mm 15mm 15mm 15mm;
          }
          .no-print {
            display: none !important;
          }
          .print-border {
            border: 1px solid #111 !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
          }
          .bg-slate-50, .bg-gray-100 {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* ACTION BAR (no-print) */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 no-print">
          <button
            onClick={onBack}
            className="px-5 py-2.5 font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handlePrint()}
              className="px-6 py-2.5 font-bold text-white bg-[#10a37f] hover:bg-[#0e8f6e] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <Printer size={16} /> Cetak & Print Langsung (F4)
            </button>
          </div>
        </div>

        {/* DOCUMENT CONTAINER (FITS AS OFFICAL HOSPITAL FORM) */}
        <div
          className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden print-border"
          ref={componentRef}
        >
          <div className="p-8 md:p-12 space-y-6 text-slate-800" style={{ fontFamily: "serif" }}>
            
            {/* HOSPITAL KOP SURAT */}
            <div className="flex items-center border-b-[3.5px] border-black pb-4 mb-3">
              {/* Logo RSUD AL-MULK */}
              <div className="w-20 h-20 bg-teal-50 border-2 border-[#10a37f] flex items-center justify-center rounded-2xl mr-5 flex-shrink-0">
                <div className="text-center font-black text-rose-600 text-xs leading-none flex flex-col items-center">
                  <span className="text-[#10a37f] font-sans font-black text-xs uppercase tracking-tight">MUTU</span>
                  <span className="text-[#10a37f] font-sans font-extrabold text-[15px] leading-tight">+</span>
                  <span className="text-slate-600 font-sans font-bold text-[9px] uppercase tracking-wide">RSUD</span>
                </div>
              </div>

              <div className="flex-1 text-center pr-10">
                <h1 className="text-xl font-bold font-sans text-slate-900 uppercase tracking-wide">
                  UOBK RSUD AL-MULK
                </h1>
                <h2 className="text-lg font-bold font-sans text-slate-700 uppercase tracking-wider mt-0.5">
                  KOMITE MUTU DAN KESELAMATAN PASIEN
                </h2>
                <p className="text-[11px] font-sans text-slate-500 font-medium">
                  Jl. Pelabuhan II No. Km. 6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jabar 43169
                </p>
                <p className="text-[10px] font-sans text-slate-400 font-semibold">
                  Telp: (0266) 6251234 &bull; Email: komitemutu@rsudalmulk.sukabumi.go.id
                </p>
              </div>
            </div>

            {/* FORM TITLE & NO LAPORAN */}
            <div className="text-center space-y-1">
              <h2 className="text-base font-black border-b border-black inline-block px-4 pb-0.5 uppercase tracking-wide">
                LAPORAN INSIDEN KESELAMATAN PASIEN RS (INTERNAL)
              </h2>
              <p className="text-[11px] font-mono font-bold text-gray-500 uppercase">
                NOMOR LAPORAN: {reportNo}
              </p>
            </div>

            {/* DOCUMENT CONTENT SECTIONS */}
            <div className="space-y-6 text-xs text-slate-900">
              
              {/* SECTION I: DATA PASIEN */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-50 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
                  I. Data Pasien
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 p-4 gap-y-3 gap-x-6">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Nama Inisial</span>
                    <span className="font-extrabold">{formData.namaPasien || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">No. Rekam Medis (RM)</span>
                    <span className="font-mono font-extrabold">{formData.noRM || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Umur</span>
                    <span className="font-extrabold">{formData.umur || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Jenis Kelamin</span>
                    <span className="font-extrabold">{formData.jenisKelamin || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Penanggung Biaya</span>
                    <span className="font-bold text-teal-700">{formData.penanggungBiaya || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Tanggal Masuk RS</span>
                    <span className="font-extrabold">{formData.tanggalMasuk || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Jam Masuk RS</span>
                    <span className="font-extrabold">{formData.jamMasuk || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-500">Ruangan / Unit Terkait</span>
                    <span className="font-extrabold text-teal-700 uppercase">{data.unit || formData.ruangan || "-"}</span>
                  </div>
                </div>
              </div>

              {/* SECTION II: RINCIAN KEJADIAN */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-50 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
                  II. Rincian Kejadian Insiden
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-500">Tanggal Kejadian</span>
                      <span className="font-extrabold">{formData.tanggalInsiden || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-500">Waktu Kejadian (WIB)</span>
                      <span className="font-extrabold">{formData.jamInsiden || "-"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Insiden</span>
                    <div className="bg-slate-50/55 p-3 rounded-md border border-slate-100 font-extrabold text-[#10a37f]">
                      {formData.insiden || "-"}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Kronologis Kejadian</span>
                    <div className="bg-slate-50/55 p-3 rounded-md border border-slate-100 whitespace-pre-wrap leading-relaxed font-sans text-slate-700">
                      {formData.kronologis || "-"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between py-1">
                      <span className="font-bold text-slate-500">Orang Pertama Melaporkan</span>
                      <span className="font-extrabold">
                        {formData.orangPertamaMelaporkan}
                        {formData.orangPertamaMelaporkanLainnya ? ` (${formData.orangPertamaMelaporkanLainnya})` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-bold text-slate-500">Insiden Terjadi Pada</span>
                      <span className="font-extrabold">
                        {formData.insidenTerjadiPada}
                        {formData.insidenTerjadiPadaLainnya ? ` (${formData.insidenTerjadiPadaLainnya})` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-bold text-slate-500">Insiden Menyangkut Kategori</span>
                      <span className="font-extrabold">
                        {formData.insidenMenyangkutPasien}
                        {formData.insidenMenyangkutPasienLainnya ? ` (${formData.insidenMenyangkutPasienLainnya})` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-bold text-slate-500">Spesialisasi Pasien</span>
                      <span className="font-extrabold">
                        {formData.spesialisasiPasien}
                        {formData.spesialisasiPasienLainnya ? ` (${formData.spesialisasiPasienLainnya})` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 col-span-1 md:col-span-2">
                      <span className="font-bold text-slate-500">Akibat Insiden terhadap Pasien</span>
                      <span className="font-black text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {formData.akibatInsiden || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION III: TINDAKAN SEGERA */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-50 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
                  III. Tindakan Penanganan Darurat / Segera
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Tindakan Segera Pasca Kejadian & Hasil</span>
                    <div className="bg-slate-50/55 p-3 rounded-md border border-slate-100 whitespace-pre-wrap leading-relaxed font-sans text-slate-700">
                      {formData.tindakanSegera || "-"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                    <div className="flex justify-between py-1 col-span-2">
                      <span className="font-bold text-slate-500">Tindakan Dilakukan Oleh</span>
                      <span className="font-extrabold">
                        {(formData.tindakanOleh || []).join(", ")}
                        {formData.tindakanOlehLainnya ? ` (${formData.tindakanOlehLainnya})` : ""}
                      </span>
                    </div>
                    
                    <div className="col-span-2 border-t border-slate-100 pt-2 pb-1">
                      <span className="font-bold text-slate-500 block mb-1">Riwayat Kejadian Serupa Di Unit Lain</span>
                      <span className="font-extrabold block">Pernah terjadi? <span className="text-teal-700">{formData.pernahTerjadiYTN || "-"}</span></span>
                      {formData.pernahTerjadiYTN === "Ya" && (
                        <div className="mt-2 text-[11px] bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1">
                          <p><strong>Waktu Kejadian:</strong> {formData.pernahTerjadiKapan}</p>
                          <p><strong>Langkah/Tindakan Masa Lalu:</strong> {formData.pernahTerjadiTindakan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION IV: ANALISIS AKAR MASALAH */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-50 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
                  IV. Analisis Tipe Insiden, Faktor Kontributor & Akar Masalah
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-500">Tipe Insiden Utama</span>
                      <span className="font-extrabold text-[#10a37f]">{formData.tipeInsiden || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-500">Sub Tipe Insiden</span>
                      <span className="font-extrabold">{formData.subTipeInsiden || "-"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Penyebab Langsung</span>
                    <div className="bg-slate-50/55 p-3 rounded-md border border-slate-100 font-sans text-slate-700 whitespace-pre-wrap">
                      {formData.penyebabLangsung || "-"}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Pilihan Faktor Kontributor</span>
                    <div className="bg-slate-50/55 p-2 px-3 rounded-md border border-slate-100 font-extrabold font-sans text-slate-800">
                      {(formData.faktorKontributor || []).join(", ") || "Tidak Ada"}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Akar Penyebab Masalah (Root Cause)</span>
                    <div className="bg-slate-50/55 p-3 rounded-md border border-slate-100 font-sans text-slate-700 whitespace-pre-wrap">
                      {formData.akarPenyebab || "-"}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Rekomendasi / Tindakan Solusi Jangka Panjang</span>
                    <div className="bg-slate-50/55 p-3 rounded-md border border-slate-100 font-sans text-slate-700 whitespace-pre-wrap">
                      {formData.rekomendasi || "-"}
                    </div>
                  </div>

                  {/* RISIKO GRADING BADGE */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#10a37f]" />
                      <span className="font-bold text-slate-500">Penilaian Grading Risiko internal:</span>
                    </div>
                    <div>
                      <span
                        className={`px-6 py-1.5 border-2 rounded-lg font-black uppercase text-xs inline-block tracking-widest ${
                          formData.gradingRisiko === "Biru"
                            ? "border-blue-500 text-blue-800 bg-blue-50"
                            : formData.gradingRisiko === "Hijau"
                              ? "border-emerald-500 text-emerald-800 bg-emerald-50"
                              : formData.gradingRisiko === "Kuning"
                                ? "border-yellow-500 text-yellow-800 bg-yellow-50"
                                : formData.gradingRisiko === "Merah"
                                  ? "border-rose-500 text-rose-800 bg-rose-50"
                                  : "border-gray-400 text-gray-800 bg-gray-50"
                        }`}
                      >
                        Grading: {formData.gradingRisiko || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION V: SIGNATURE SECTION */}
              <div className="pt-10 grid grid-cols-2 gap-12 text-center">
                
                {/* PEMBUAT */}
                <div className="flex flex-col items-center">
                  <span className="font-extrabold uppercase text-slate-800 tracking-wider">
                    PEMBUAT LAPORAN
                  </span>
                  <span className="text-[10px] text-gray-400 block font-semibold mt-0.5">
                    Tanggal Lapor: {formData.ttdPembuatTgl || "-"}
                  </span>
                  
                  {/* SIGNATURE DISPLAY AREA */}
                  <div className="w-52 h-24 border-b border-dashed border-slate-400 my-3 flex items-center justify-center bg-slate-50/20 rounded-md relative overflow-hidden">
                    {formData.ttdPembuatBase64 ? (
                      <img
                        src={formData.ttdPembuatBase64}
                        alt="Tangan Pembuat Laporan"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-300 tracking-wider font-bold">Tanpa Tanda Tangan</span>
                    )}
                  </div>
                  
                  <span className="font-extrabold text-xs uppercase border-t border-slate-200 pt-1.5 w-48 text-center truncate">
                    {formData.ttdPembuatNama || "( ____________________ )"}
                  </span>
                </div>

                {/* PENERIMA */}
                <div className="flex flex-col items-center">
                  <span className="font-extrabold uppercase text-slate-800 tracking-wider">
                    PENERIMA LAPORAN
                  </span>
                  <span className="text-[10px] text-gray-400 block font-semibold mt-0.5">
                    Tanggal Terima: {formData.ttdPenerimaTgl || "-"}
                  </span>
                  
                  {/* SIGNATURE DISPLAY AREA */}
                  <div className="w-52 h-24 border-b border-dashed border-slate-400 my-3 flex items-center justify-center bg-slate-50/20 rounded-md relative overflow-hidden">
                    {formData.ttdPenerimaBase64 ? (
                      <img
                        src={formData.ttdPenerimaBase64}
                        alt="Tangan Penerima Laporan"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-300 tracking-wider font-bold">Tanpa Tanda Tangan</span>
                    )}
                  </div>
                  
                  <span className="font-extrabold text-xs uppercase border-t border-slate-200 pt-1.5 w-48 text-center truncate">
                    {formData.ttdPenerimaNama || "( ____________________ )"}
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
