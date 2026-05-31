import React, { useRef } from 'react';
import { FileText, Printer, Download, ArrowLeft } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useStore } from '@/store/useStore';

export default function DetailLaporanIKP({ data, onBack }: { data: any, onBack: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const hospitalLogo = useStore(state => state.hospitalLogo);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_IKP_${data.id}`,
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_IKP_${data.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Gagal men-download PDF");
    }
  };

  const d = data.details || {};

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-black text-white">Detail Laporan IKP</h2>
            <p className="text-slate-400 text-xs">#{data.id.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-700">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-[#10a37f] hover:bg-[#0e8f6e] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <div className="p-8 bg-gray-50 flex justify-center overflow-auto max-h-[80vh]">
        {/* F4 Paper simulation */}
        <div 
          ref={printRef} 
          className="bg-white w-[210mm] min-h-[330mm] p-[20mm] shadow-xl text-black font-sans box-border"
        >
          {/* Header */}
          <div className="border-b-4 border-slate-800 pb-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center">
                {hospitalLogo ? (
                   /* eslint-disable-next-line @next/next/no-img-element */
                   <img src={hospitalLogo} alt="Logo RS" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-[#10a37f] rounded-lg flex items-center justify-center text-white font-black text-2xl">
                    RS
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">UOBK RSUD AL-MULK</h1>
                <p className="text-sm font-semibold text-slate-600">KOTA SUKABUMI</p>
                <p className="text-xs text-slate-500">Jl. Pelabuhan II KM 6, Lembursitu, Kota Sukabumi | Telp: (0266) 6250905 | Email: rsudalmulk@sukabumikota.go.id</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm border border-slate-300 px-3 py-1 rounded inline-block font-bold">
                RAHASIA
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-wide border-b-2 border-slate-800 inline-block pb-1">Laporan Insiden Internal</h2>
          </div>

          <table className="w-full text-sm border-collapse mb-6">
            <tbody>
              <tr><td className="w-1/3 py-1 font-bold">Tipe Insiden</td><td className="w-2/3 py-1">: {d.tipe_insiden || '-'}</td></tr>
              <tr><td className="w-1/3 py-1 font-bold">Sub Tipe Insiden</td><td className="w-2/3 py-1">: {d.sub_tipe_insiden || '-'}</td></tr>
              <tr><td className="w-1/3 py-1 font-bold">Tanggal & Jam Masuk</td><td className="w-2/3 py-1">: {d.tgl_masuk} {d.jam_masuk}</td></tr>
            </tbody>
          </table>

          <div className="mb-6">
            <h3 className="font-black text-white bg-slate-800 px-3 py-1.5 uppercase text-sm mb-3">A. Data Pasien</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Nama Inisial</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.nama_pasien || '-'}</td></tr>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">No. Rekam Medis</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.no_rm || '-'}</td></tr>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Umur & Jenis Kelamin</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.umur || '-'} / {d.jenis_kelamin || '-'}</td></tr>
                <tr><td className="w-1/3 py-1 font-bold">Penanggung Biaya</td><td className="w-2/3 py-1">: {d.penanggung_biaya || '-'}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h3 className="font-black text-white bg-slate-800 px-3 py-1.5 uppercase text-sm mb-3">B. Rincian Kejadian</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Tgl & Waktu Insiden</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.tgl_insiden} {d.jam_insiden}</td></tr>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Insiden</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.insiden || '-'}</td></tr>
                <tr><td className="py-2 font-bold" colSpan={2}>Kronologis Kejadian:</td></tr>
                <tr><td colSpan={2} className="py-2 px-3 bg-gray-50 border border-gray-200 text- justify whitespace-pre-wrap rounded">{d.kronologis || '-'}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h3 className="font-black text-white bg-slate-800 px-3 py-1.5 uppercase text-sm mb-3">C. Faktor & Analisis Risiko</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Grading Risiko</td><td className="w-2/3 py-1 border-b border-gray-100">: <strong className={`uppercase ${d.grading === 'Merah' ? 'text-red-600' : d.grading === 'Kuning' ? 'text-yellow-600' : d.grading === 'Hijau' ? 'text-green-600' : 'text-blue-600'}`}>{d.grading || '-'}</strong></td></tr>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Akibat Terhadap Pasien</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.akibat || '-'}</td></tr>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Penyebab Langsung</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.penyebab_langsung || '-'}</td></tr>
                <tr><td className="w-1/3 py-1 font-bold border-b border-gray-100">Akar Penyebab</td><td className="w-2/3 py-1 border-b border-gray-100">: {d.akar_penyebab || '-'}</td></tr>
                <tr>
                  <td className="w-1/3 py-1 font-bold">Faktor Kontributor</td>
                  <td className="w-2/3 py-1">: {Array.isArray(d.faktor_kontributor) ? d.faktor_kontributor.join(', ') : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-12">
            <h3 className="font-black text-white bg-slate-800 px-3 py-1.5 uppercase text-sm mb-3">D. Tindakan & Rekomendasi</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                 <tr><td className="py-2 font-bold" colSpan={2}>Tindakan Segera:</td></tr>
                 <tr><td colSpan={2} className="py-2 px-3 bg-gray-50 border border-gray-200 text-justify whitespace-pre-wrap rounded mb-2">{d.tindakan_segera || '-'}</td></tr>
                 <tr><td className="py-2 font-bold mt-2 inline-block" colSpan={2}>Rekomendasi / Solusi:</td></tr>
                 <tr><td colSpan={2} className="py-2 px-3 bg-gray-50 border border-gray-200 text-justify whitespace-pre-wrap rounded">{d.rekomendasi || '-'}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-slate-800">
             <div className="text-center">
                <p className="text-sm font-bold mb-4 uppercase">Pembuat Laporan</p>
                <div className="h-24 flex items-center justify-center">
                  {d.ttd_pembuat ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={d.ttd_pembuat} alt="TTD Pembuat" className="max-h-24 max-w-full" />
                  ) : <span className="text-gray-300 italic text-sm">Tidak ada tanda tangan</span>}
                </div>
                <p className="font-black underline uppercase mt-2">{d.nama_pembuat || '_____________________'}</p>
                <p className="text-xs text-gray-600 mt-1">{d.tgl_lapor ? format(new Date(d.tgl_lapor), 'dd MMMM yyyy') : '-'}</p>
             </div>
             <div className="text-center">
                <p className="text-sm font-bold mb-4 uppercase">Penerima Laporan</p>
                <div className="h-24 flex items-center justify-center">
                  {d.ttd_penerima ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={d.ttd_penerima} alt="TTD Penerima" className="max-h-24 max-w-full" />
                  ) : <span className="text-gray-300 italic text-sm">Tidak ada tanda tangan</span>}
                </div>
                <p className="font-black underline uppercase mt-2">{d.nama_penerima || '_____________________'}</p>
                <p className="text-xs text-gray-600 mt-1">{d.tgl_terima ? format(new Date(d.tgl_terima), 'dd MMMM yyyy') : '-'}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
