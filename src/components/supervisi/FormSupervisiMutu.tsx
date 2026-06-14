import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Printer, Download, Clock, Calculator, Activity, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface FormSupervisiMutuProps {
  onBack: () => void;
  onViewRiwayat: () => void;
}

interface SupervisiItem {
  id: number;
  uraian: string;
  acuan: string;
  metode: string;
  nilai: number | null;
  temuan: string;
  rekomendasi: string;
}

const INITIAL_ITEMS: SupervisiItem[] = [
  { id: 1, uraian: 'Kepala unit melakukan pengukuran INM', acuan: 'TKRS 10', metode: 'W', nilai: null, temuan: '', rekomendasi: '' },
  { id: 2, uraian: 'Kepala unit melakukan pengukuran indikator prioritas RS', acuan: 'TKRS 10', metode: 'W', nilai: null, temuan: '', rekomendasi: '' },
  { id: 3, uraian: 'Kepala unit melakukan pengukuran indikator mutu prioritas unit', acuan: 'TKRS 10', metode: 'W', nilai: null, temuan: '', rekomendasi: '' },
  { id: 4, uraian: 'Indikator mutu dipahami oleh seluruh staf', acuan: 'PMKP', metode: 'W', nilai: null, temuan: '', rekomendasi: '' },
  { id: 5, uraian: 'Hasil pengukuran diinformasikan kepada staf (via langsung / storyboard)', acuan: 'TKRS 4', metode: 'W', nilai: null, temuan: '', rekomendasi: '' },
  { id: 6, uraian: 'Tindak lanjut insiden keselamatan (jika ada)', acuan: 'PMKP', metode: 'W', nilai: null, temuan: '', rekomendasi: '' }
];

export default function FormSupervisiMutu({ onBack, onViewRiwayat }: FormSupervisiMutuProps) {
  const [items, setItems] = useState<SupervisiItem[]>(INITIAL_ITEMS);
  const [area, setArea] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [waktu, setWaktu] = useState(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  
  // Analisa Otomatis
  const [showAnalisa, setShowAnalisa] = useState(false);
  const [analisa, setAnalisa] = useState({
    hasil: '',
    kesimpulan: '',
    rekomendasi: '',
    tindakLanjut: '',
    targetMasa: '',
    pj: ''
  });

  const areas = [
    'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 'Ranap Fatimah',
    'Ranap Khadijah', 'Ranap Usman', 'Laboratorium', 'Radiologi',
    'Farmasi', 'CSSD', 'Pantry'
  ];

  const updateItem = (id: number, field: keyof SupervisiItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const scores = useMemo(() => {
    let totalScore = 0;
    let filledCount = 0;
    
    items.forEach(item => {
      if (item.nilai !== null) {
        totalScore += item.nilai;
        filledCount++;
      }
    });

    const maxScore = filledCount * 10;
    const percentage = maxScore === 0 ? 0 : Math.round((totalScore / maxScore) * 100);
    
    let status = 'MENUNGGU';
    let statusColor = 'bg-slate-100 text-slate-600';
    
    if (filledCount > 0) {
      if (percentage >= 85) {
        status = 'BAIK';
        statusColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      } else if (percentage >= 70) {
        status = 'CUKUP';
        statusColor = 'bg-amber-100 text-amber-800 border border-amber-200';
      } else {
        status = 'PERLU TINDAK LANJUT';
        statusColor = 'bg-rose-100 text-rose-800 border border-rose-200';
      }
    }

    return { totalScore, maxScore, percentage, status, statusColor, filledCount };
  }, [items]);

  const generateAnalisa = () => {
    let kesimpulan = '';
    let rec = '';
    
    if (scores.percentage >= 85) {
      kesimpulan = 'Penerapan mutu pelayanan dan pengukuran indikator di unit sudah berjalan dengan baik. Staf memahami dan menjalankan instruksi sesuai standar PMKP dan TKRS.';
      rec = 'Pertahankan kepatuhan dan terus berikan edukasi berkelanjutan pada seluruh staf di unit pelayanan.';
    } else if (scores.percentage >= 70) {
      kesimpulan = 'Penerapan mutu pelayanan cukup memadai, namun terdapat beberapa area yang belum sepenuhnya optimal dalam pengukuran indikator prioritas dan diseminasi hasil.';
      rec = 'Perlu ditingkatkan sosialisasi storyboard dan pengumpulan data secara disiplin.';
    } else {
      kesimpulan = 'Kepatuhan unit terhadap standar pengukuran mutu pelayanan dan keselamatan pasien masih kurang. Indikator dan tindak lanjut insiden belum dijalankan memadai.';
      rec = 'Seluruh kepala unit dan staf harus diberikan pelatihan ulang mengenai INM, IMP-RS, IMP-Unit serta cara melakukan entry ke SISMADAK / sistem internal dan penyelesaian IKP.';
    }

    setAnalisa({
      hasil: `Didapatkan Total Nilai ${scores.totalScore} dari Nilai Maksimal ${scores.maxScore} dengan persentase ${scores.percentage}%`,
      kesimpulan,
      rekomendasi: rec,
      tindakLanjut: 'Melakukan pendampingan pengisian form indikator dan audit ulang di minggu berikutnya',
      targetMasa: '1 Minggu',
      pj: area ? `Kepala Ruangan ${area}` : 'Kepala Ruangan'
    });
    
    setShowAnalisa(true);
    
    // Scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      
      {/* Actions Top */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onViewRiwayat} className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 font-bold text-sm border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
            <Clock size={16} className="text-slate-400" />
            Riwayat Supervisi
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 font-bold text-sm border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
            <Calculator size={16} className="text-slate-400" />
            Simpan Draft
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0ea5e9] text-white font-bold text-sm rounded-xl hover:bg-[#0284c7] shadow-sm shadow-sky-500/20 transition-colors">
            <Save size={16} />
            Simpan Supervisi
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden mb-6">
        {/* Title Header */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white border-b-4 border-[#0ea5e9]">
          <h1 className="text-xl md:text-2xl font-black tracking-wide">FORMULIR SUPERVISI</h1>
          <h2 className="text-lg md:text-xl font-bold text-sky-400 mt-1">PENINGKATAN KUALITAS PELAYANAN RUMAH SAKIT</h2>
          <p className="mt-3 text-sm text-slate-300 font-semibold tracking-widest uppercase">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
        </div>

        {/* Input Header Area */}
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Area Supervisi</label>
            <select 
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
            >
              <option value="">-- Pilih Unit --</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
            <input 
              type="date" 
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</label>
            <input 
              type="time" 
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supervisor</label>
            <input 
              type="text" 
              value="Tim Mutu"
              readOnly
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none cursor-not-allowed shadow-sm"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#0f172a] text-white">
              <tr>
                <th className="p-4 text-xs font-extrabold w-12 text-center uppercase tracking-wider border-r border-slate-700">No</th>
                <th className="p-4 text-xs font-extrabold w-[25%] uppercase tracking-wider border-r border-slate-700">Uraian Yang Disupervisi</th>
                <th className="p-4 text-xs font-extrabold w-20 text-center uppercase tracking-wider border-r border-slate-700">Acuan</th>
                <th className="p-4 text-xs font-extrabold w-20 text-center uppercase tracking-wider border-r border-slate-700">Metode</th>
                <th className="p-4 text-xs font-extrabold w-28 text-center uppercase tracking-wider border-r border-slate-700">Nilai</th>
                <th className="p-4 text-xs font-extrabold uppercase tracking-wider border-r border-slate-700">Temuan</th>
                <th className="p-4 text-xs font-extrabold uppercase tracking-wider">Rekomendasi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 border-r border-slate-100 text-center text-sm font-bold text-slate-500 align-top">{idx + 1}</td>
                  <td className="p-4 border-r border-slate-100 text-[15px] font-bold text-slate-800 align-top leading-relaxed">{item.uraian}</td>
                  <td className="p-1 border-r border-slate-100 align-top">
                    <div className="bg-slate-100 text-slate-600 outline-none text-xs font-bold text-center px-2 py-3 rounded m-2 h-full flex items-center justify-center">
                      {item.acuan}
                    </div>
                  </td>
                  <td className="p-1 border-r border-slate-100 align-top">
                     <div className="bg-slate-100 text-slate-600 outline-none text-xs font-bold text-center px-2 py-3 rounded m-2 h-full flex items-center justify-center">
                      {item.metode}
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-100 align-top">
                    <select
                      value={item.nilai === null ? '' : item.nilai}
                      onChange={(e) => updateItem(item.id, 'nilai', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20"
                    >
                      <option value="">Pilih</option>
                      <option value="10">10 (Ya)</option>
                      <option value="5">5 (Sebagian)</option>
                      <option value="0">0 (Tidak)</option>
                    </select>
                  </td>
                  <td className="p-3 border-r border-slate-100 align-top">
                    <textarea 
                      value={item.temuan}
                      onChange={(e) => updateItem(item.id, 'temuan', e.target.value)}
                      placeholder="Catatan temuan..."
                      className="w-full h-20 resize-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 placeholder:text-slate-400"
                    />
                  </td>
                  <td className="p-3 align-top">
                    <textarea 
                      value={item.rekomendasi}
                      onChange={(e) => updateItem(item.id, 'rekomendasi', e.target.value)}
                      placeholder="Rekomendasi tindak lanjut..."
                      className="w-full h-20 resize-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 placeholder:text-slate-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dashboard/Scoring Summary Inline */}
        <div className="bg-slate-50 p-6 md:p-8 flex flex-col md:flex-row gap-6 border-t border-slate-200 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center flex-1 w-full text-center md:text-left">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full md:w-auto shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Nilai</p>
                <p className="text-3xl font-black text-slate-800">{scores.totalScore} <span className="text-sm font-bold text-slate-400">/ {scores.maxScore}</span></p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full md:w-auto shadow-sm">
                 <p className="text-xs font-bold text-slate-400 uppercase">Persentase</p>
                 <p className="text-3xl font-black text-[#0ea5e9]">{scores.percentage}%</p>
              </div>
              <div className={`rounded-2xl p-5 w-full md:w-auto shadow-sm flex-1 max-w-sm flex flex-col justify-center ${scores.statusColor}`}>
                 <p className="text-xs font-bold uppercase opacity-80 mb-1">Status Kepatuhan</p>
                 <p className="text-2xl font-black uppercase tracking-wide flex items-center justify-center md:justify-start gap-2">
                   {scores.status === 'BAIK' && <CheckCircle2 size={24} />}
                   {scores.status === 'CUKUP' && <AlertTriangle size={24} />}
                   {scores.status === 'PERLU TINDAK LANJUT' && <ShieldAlert size={24} />}
                   {scores.status}
                 </p>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
               <button 
                  onClick={generateAnalisa}
                  disabled={scores.filledCount === 0}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-md ${scores.filledCount > 0 ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
               >
                 HASILKAN ANALISA OTOMATIS
               </button>
            </div>
        </div>

        {/* Analisa Otomatis Display */}
        {showAnalisa && (
          <div className="p-6 md:p-8 bg-sky-50 border-t border-sky-100 animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3 mb-6">
                <Activity className="text-[#0ea5e9]" size={24} />
                <h3 className="text-xl font-black text-slate-800">Analisa & Rekomendasi Supervisi Otomatis</h3>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">1. Hasil Supervisi</h4>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{analisa.hasil}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">2. Kesimpulan Supervisi</h4>
                    <textarea 
                      value={analisa.kesimpulan} 
                      onChange={e => setAnalisa({...analisa, kesimpulan: e.target.value})}
                      className="w-full text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 outline-none focus:border-sky-300 resize-none h-24" 
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">3. Rekomendasi Perbaikan</h4>
                    <textarea 
                      value={analisa.rekomendasi} 
                      onChange={e => setAnalisa({...analisa, rekomendasi: e.target.value})}
                      className="w-full text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 outline-none focus:border-sky-300 resize-none h-24" 
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">4. Rencana Tindak Lanjut</h4>
                    <textarea 
                      value={analisa.tindakLanjut} 
                      onChange={e => setAnalisa({...analisa, tindakLanjut: e.target.value})}
                      className="w-full text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 outline-none focus:border-sky-300 resize-none h-20" 
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">5. Target Penyelesaian</h4>
                    <input 
                      value={analisa.targetMasa} 
                      onChange={e => setAnalisa({...analisa, targetMasa: e.target.value})}
                      className="w-full text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 outline-none focus:border-sky-300" 
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">6. Penanggung Jawab</h4>
                    <input 
                      value={analisa.pj} 
                      onChange={e => setAnalisa({...analisa, pj: e.target.value})}
                      className="w-full text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 outline-none focus:border-sky-300" 
                    />
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Exporters bottom limits */}
      <div className="flex justify-center flex-wrap gap-4 mt-8">
        <button className="flex items-center gap-2 px-6 py-3 bg-white text-rose-600 font-bold border border-rose-200 rounded-xl hover:bg-rose-50 shadow-sm transition-colors">
          <Printer size={18} />
          Cetak PDF
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-bold border border-emerald-200 rounded-xl hover:bg-emerald-50 shadow-sm transition-colors">
          <Download size={18} />
          Export Excel
        </button>
      </div>

    </div>
  );
}
