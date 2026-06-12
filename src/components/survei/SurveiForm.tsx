import React, { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";

const optionsSangatTidakSetuju = ["Sangat tidak setuju", "Tidak Setuju", "Kadang-kadang", "Setuju", "Sangat Setuju"];
const optionsTidakPernah = ["Tidak pernah", "Jarang sekali", "Kadang-kadang", "Sering", "Selalu"];

const bagianA = [
  "Karyawan di unit kami saling mendukung",
  "Unit kami memiliki cukup staf untuk menangani beban kerja yang berlebih",
  "Bila unit kami ada pekerjaan yang harus dilakukan dalam waktu cepat, maka karyawan di unit kami bekerja bersama-sama sebagai tim",
  "Petugas di unit kami saling menghargai",
  "Karyawan di unit kami bekerja dengan waktu yang lebih lama dari normal untuk perawatan pasien",
  "Unit kami secara aktif melakukan kegiatan untuk meningkatkan keselamatan pasien",
  "Unit kami banyak menggunakan tenaga melebihi normal/tambahan untuk kegiatan pelayanan pasien",
  "Karyawan unit kami sering merasa bahwa kesalahan yang mereka lakukan digunakan untuk menyalahkan mereka",
  "Di unit kami, kesalahan yang terjadi digunakan untuk membuat perubahan kearah yang positif",
  "Hanya karena kebetulan saja bila insiden yang lebih serius tidak terjadi di unit kami",
  "Bila salah satu area di unit kami sangat sibuk, maka area lain dari unit kami akan membantu",
  "Bila unit kami melaporkan suatu insiden, yang dibicarakan adalah pelakunya bukan masalahnya",
  "Sesudah membuat perubahan-perubahan untuk meningkatkan Keselamatan Pasien, kita lakukan evaluasi tentang efektivitasnya",
  "Kami bekerja seolah-olah dalam keadaan “krisis”, berusaha bertindak berlebihan dan terlalu cepat",
  "Unit kami tidak pernah mengorbankan keselamatan pasien untuk menyelesaikan pekerjaan yang lebih banyak",
  "Karyawan merasa khawatir kesalahan yang mereka buat akan dicatat di berkas pribadi mereka",
  "Di unit kami banyak masalah keselamatan pasien",
  "Prosedur dan system di unit kami sudah baik dalam mencegah terjadinya error"
];

const bagianB = [
  "Manajer/supervisor di unit kami memberi pujian jika melihat pekerjaan diselesaikan sesuai prosedur keselamatan pasien yang berlaku",
  "Manajer/supervisor dengan serius mempertimbangkan masukan staf untuk meningkatkan keselamatan pasien",
  "Bila beban kerja tinggi, manajer/supervisor kami meminta kami bekerja cepat meski dengan mengambil jalan pintas",
  "Manajer/supervisor kami selalu mengabaikan masalah Keselamatan Pasien yang terjadi berulang kali di unit kami"
];

const bagianC = [
  "Karyawan di unit kami mendapat umpan balik mengenai perubahan yang dilaksanakan atas dasar hasil laporan insiden",
  "Karyawan di unit kami bebas berbicara jika melihat sesuatu yang dapat berdampak negatif pada pelayanan pasien",
  "Karyawan di unit kami mendapat informasi mengenai insiden yang terjadi di unit ini",
  "Karyawan di unit kami merasa bebas untuk mempertanyakan keputusan atau tindakan yang diambil oleh atasannya",
  "Di unit kami, didiskusikan cara untuk mencegah agar insiden tidak terulang kembali",
  "Karyawan di unit kami takut bertanya jika terjadi hal yang kelihatannya tidak benar"
];

const bagianD = [
  "Bila terjadi kesalahan, tetapi sempat diketahui dan dikoreksi sebelum berdampak pada pasien, seberapa sering hal ini dilaporkan?",
  "Bila terjadi kesalahan, tetapi tidak berpotensi mencenderai pasien, seberapa sering hal ini dilaporkan?",
  "Bila terjadi kesalahan, yang dapat mencederai pasien tetapi ternyata tidak terjadi cedera, seberapa sering hal ini dilaporkan?"
];

const bagianF = [
  "Manajemen rumah sakit membuat suasana kerja yang mendukung keselamatan pasien",
  "Antar Unit di RS kami tidak saling berkoordinasi dengan baik",
  "Bila terjadi pemindahan pasien dari unit satu ke unit lain, pasti menimbulkan masalah terkait dengan informasi pasien",
  "Terdapat kerjasama yang baik antar unit di RS yang dibutuhkan untuk menyelesaikan pekerjaan bersama",
  "Informasi penting mengenai pelayanan pasien sering hilang saat pergantian jaga (shift)",
  "Sering kali tidak menyenangkan bekerja dengan staf dari unit lain di RS ini",
  "Masalah sering timbul dalam pertukaran informasi antar unit di RS",
  "Tindakan manajemen RS menunjukkan bahwa keselamatan pasien merupakan prioritas utama",
  "Manajemen RS kelihatan tertarik pada Keselamatan Pasien hanya sesudah terjadi KTD (Kejadian yang Tidak Diharapkan)",
  "Unit-unit di RS bekerjasama dengan baik untuk memberikan pelayanan yang terbaik untuk pasien",
  "Pergantian shift merupakan masalah bagi pasien-pasien di RS ini"
];

const bagianH = [
  { q: "Berapa lama anda bekerja di RS ini?", options: ["Kurang dari 1 tahun", "1 - 5 tahun", "6 - 10 tahun", "11 - 15 tahun", "16 - 20 tahun", "21 tahun atau lebih"] },
  { q: "Berapa lama anda bekerja di unit ini?", options: ["Kurang dari 1 tahun", "1 - 5 tahun", "6 - 10 tahun", "11 - 15 tahun", "16 - 20 tahun", "21 tahun atau lebih"] },
  { q: "Tepatnya, berapa jam dalam seminggu anda bekerja di RS ini?", options: ["Kurang dari 20 jam seminggu", "20 - 39 jam seminggu", "40 jam atau lebih seminggu"] },
  { q: "Apa posisi/jabatan anda di RS ini?", options: ["Dokter", "Perawat", "Bidan", "Apoteker", "Asisten Apoteker", "Analis Laboratorium", "Radiografer", "Lainnya"] },
  { q: "Dalam posisi/jabatan anda, apakah anda berhubungan langsung dengan pasien?", options: ["Ya", "Tidak"] },
  { q: "Berapa lama anda bekerja sesuai profesi saat ini?", options: ["Kurang dari 1 tahun", "1 - 5 tahun", "6 - 10 tahun", "11 - 15 tahun", "16 - 20 tahun", "21 tahun atau lebih"] }
];

export default function SurveiForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const totalSteps = 6;

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [form, setForm] = useState({
    unit_kerja: "",
    bagian_a: Object.fromEntries(bagianA.map((_, i) => [`a_${i}`, ""])),
    bagian_b: Object.fromEntries(bagianB.map((_, i) => [`b_${i}`, ""])),
    bagian_c: Object.fromEntries(bagianC.map((_, i) => [`c_${i}`, ""])),
    bagian_d: Object.fromEntries(bagianD.map((_, i) => [`d_${i}`, ""])),
    bagian_e: "",
    bagian_f: Object.fromEntries(bagianF.map((_, i) => [`f_${i}`, ""])),
    bagian_g: "",
    bagian_h: Object.fromEntries(bagianH.map((_, i) => [`h_${i}`, ""])),
    bagian_i_komentar: ""
  });

  const nextStep = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleNextClick = () => {
    let uncompletedId = null;

    if (step === 1) {
      if (!form.unit_kerja) uncompletedId = "unit_kerja";
      else {
        const idx = Object.values(form.bagian_a).findIndex(v => v === "");
        if (idx !== -1) uncompletedId = `bagian_a_${idx}`;
      }
    } else if (step === 2) {
      const idx = Object.values(form.bagian_b).findIndex(v => v === "");
      if (idx !== -1) uncompletedId = `bagian_b_${idx}`;
    } else if (step === 3) {
      const idx = Object.values(form.bagian_c).findIndex(v => v === "");
      if (idx !== -1) uncompletedId = `bagian_c_${idx}`;
    } else if (step === 4) {
      const idx = Object.values(form.bagian_d).findIndex(v => v === "");
      if (idx !== -1) uncompletedId = `bagian_d_${idx}`;
      else if (!form.bagian_e) uncompletedId = "bagian_e";
    } else if (step === 5) {
      const idx = Object.values(form.bagian_f).findIndex(v => v === "");
      if (idx !== -1) uncompletedId = `bagian_f_${idx}`;
    }

    if (uncompletedId) {
      setHighlightedId(uncompletedId);
      setTimeout(() => setHighlightedId(null), 2000);

      const el = document.getElementById(uncompletedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    nextStep();
  };

  const handleChange = (section: string, key: string, val: string) => {
    if (section === "root") {
      setForm(prev => ({ ...prev, [key]: val }));
    } else {
      setForm(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as any),
          [key]: val
        }
      }));
    }
  };

  const getTotalFilled = () => {
    let count = 0;
    if (form.unit_kerja) count++;
    count += Object.values(form.bagian_a).filter(v => v !== "").length;
    count += Object.values(form.bagian_b).filter(v => v !== "").length;
    count += Object.values(form.bagian_c).filter(v => v !== "").length;
    count += Object.values(form.bagian_d).filter(v => v !== "").length;
    if (form.bagian_e) count++;
    count += Object.values(form.bagian_f).filter(v => v !== "").length;
    if (form.bagian_g) count++;
    count += Object.values(form.bagian_h).filter(v => v !== "").length;
    return count;
  };
  const totalRequired = 51;
  const filledCount = getTotalFilled();
  const progressPercent = Math.round((filledCount / totalRequired) * 100);

  const handleSubmit = async () => {
    let uncompletedId = null;
    if (!form.bagian_g) uncompletedId = "bagian_g";
    else {
      const idx = Object.values(form.bagian_h).findIndex(v => v === "");
      if (idx !== -1) uncompletedId = `bagian_h_${idx}`;
    }

    if (uncompletedId) {
      setHighlightedId(uncompletedId);
      setTimeout(() => setHighlightedId(null), 2000);
      const el = document.getElementById(uncompletedId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('survei_budaya').insert([{
        unit_kerja: form.unit_kerja,
        bagian_a: form.bagian_a,
        bagian_b: form.bagian_b,
        bagian_c: form.bagian_c,
        bagian_d: form.bagian_d,
        bagian_e: form.bagian_e,
        bagian_f: form.bagian_f,
        bagian_g: form.bagian_g,
        bagian_h: form.bagian_h,
        bagian_i_komentar: form.bagian_i_komentar
      }]);
      if (error) throw error;
      alert("Survei berhasil disimpan!");
      onBack();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRadioGroup = (section: string, questions: string[], qKeyPrefix: string, options: string[]) => {
    return questions.map((q, idx) => {
      const id = `${section}_${idx}`;
      const isAnswered = (form[section as keyof typeof form] as any)[`${qKeyPrefix}_${idx}`] !== "";
      const isHighlighted = highlightedId === id;

      return (
        <motion.div 
          key={idx}
          id={id}
          animate={isHighlighted ? { x: [-8, 8, -8, 8, 0] } : { x: 0, scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className={`relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-300 flex overflow-hidden
            ${isHighlighted ? 'border-red-400 bg-red-50/30' : 'hover:shadow-md'}
            ${isAnswered ? 'shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : ''}
          `}
        >
          {/* Left indicator line */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
            ${isAnswered ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-200'}
            ${isHighlighted ? 'bg-red-400' : ''}
          `} />

          <div className="w-full pl-3 md:pl-4">
            <h4 className={`font-semibold mb-4 text-[13px] md:text-[13px] 
              ${isHighlighted ? 'text-red-600' : 'text-slate-800'}`}>
              {idx + 1}. {q}
            </h4>
            <div className="flex flex-col gap-3">
              {options.map((opt, oIdx) => {
                const isSelected = (form[section as keyof typeof form] as any)[`${qKeyPrefix}_${idx}`] === opt;
                return (
                  <label key={oIdx} className={`flex items-center gap-3 cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-200 flex-1 min-w-[140px]
                    ${isSelected ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 border'}
                  `}>
                    <input 
                      type="radio" 
                      name={`${section}_${qKeyPrefix}_${idx}`} 
                      value={opt} 
                      checked={isSelected}
                      onChange={(e) => handleChange(section, `${qKeyPrefix}_${idx}`, e.target.value)}
                      className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`font-medium text-[13px] ${isSelected ? 'text-emerald-700' : 'text-slate-600'}`}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div ref={topRef} className="animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto w-full pb-20">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[13px] text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="text-right">
          <p className="text-[13px] md:text-[13px] font-bold text-slate-400">Langkah {step} dari {totalSteps}</p>
          <div className="flex gap-1 mt-2">
            {[1,2,3,4,5,6].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-emerald-500' : 'w-4 bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        {/* Header Title */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
          <h2 className="text-[20px] sm:text-[27px] text-center font-black mb-2 relative z-10 break-words">KUESIONER SURVEI BUDAYA KESELAMATAN PASIEN</h2>
          <p className="font-bold text-[18px] sm:text-[25px] leading-snug sm:leading-[37.5px] text-[#fbfbf7] text-center whitespace-normal break-words relative z-10 w-full">
            <span className="block sm:inline">UOBK RSUD AL-MULK</span>
            <span className="hidden sm:inline"> </span>
            <span className="block sm:inline">KOTA SUKABUMI</span>
          </p>

          <div className="mt-8 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-emerald-100 font-bold text-[13px] md:text-[13px]">Progress Pengisian</span>
              <span className="text-white font-bold text-[13px] md:text-[13px]">{filledCount} / {totalRequired} Pertanyaan Terisi</span>
            </div>
            <div className="w-full h-2 md:h-2.5 bg-emerald-900/50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-emerald-400 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 pt-8 overflow-hidden">
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 md:p-6 text-blue-900 shadow-sm">
            <h3 className="font-bold text-lg mb-3">INSTRUKSI</h3>
            <ul className="space-y-3 text-[12px] md:text-[12px] text-justify">
              <li>Survey ini dilakukan untuk mengetahui persepsi anda mengenai patient safety, medical error dan pelaporan insiden di rumah sakit anda.</li>
              <li>Isi kuesioner ini dalam waktu 15 menit.</li>
              <li>Isilah kuesioner ini dengan jujur sesuai keadaan/suasana kerja di unit dan RS anda</li>
              <li><strong>”Kejadian” <i>(Event)</i> :</strong> semua jenis ”error”, kesalahan, insiden, kecelakaan atau penyimpangan baik yang menyebabkan cedera ataupun yang tidak menyebabkan cedera pada pasien</li>
              <li><strong>“Keselamatan Pasien” <i>(Patient Safety)</i> :</strong> menghindari dan mencegah cedera pasien atau Kejadian Tidak Diharapkan (KTD) pada pasien yang diakibatkan oleh proses pemberiaan pelayanan kesehatan.</li>
            </ul>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: direction === 1 ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction === 1 ? 80 : -80 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="space-y-6">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN A: UNIT KERJA ANDA</h3>
                  <p className="text-slate-500 text-[13px] md:text-[13px]">Harap diisi pernyataan-pernyataan dibawah ini sesuai pendapat anda</p>
                </div>

                <motion.div 
                  id="unit_kerja"
                  animate={highlightedId === "unit_kerja" ? { x: [-8, 8, -8, 8, 0] } : { x: 0, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className={`relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-300 flex overflow-hidden
                    ${highlightedId === "unit_kerja" ? 'border-red-400 bg-red-50/30' : 'hover:shadow-md'}
                    ${form.unit_kerja !== "" ? 'shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : ''}
                  `}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
                    ${form.unit_kerja !== "" ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-200'}
                    ${highlightedId === "unit_kerja" ? 'bg-red-400' : ''}
                  `} />
                  <div className="w-full pl-3 md:pl-4">
                    <h4 className={`font-semibold mb-4 text-[13px] md:text-[13px] ${highlightedId === "unit_kerja" ? 'text-red-600' : 'text-slate-800'}`}>Apa unit utama kerja anda di rumah sakit ini?</h4>
                    <input 
                      type="text" 
                      placeholder="Contoh: IGD, ICU, Rawat Inap, Farmasi..."
                      value={form.unit_kerja}
                      onChange={e => handleChange("root", "unit_kerja", e.target.value)}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-[13px] text-slate-700" 
                    />
                  </div>
                </motion.div>

                {renderRadioGroup("bagian_a", bagianA, "a", optionsSangatTidakSetuju)}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: direction === 1 ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction === 1 ? 80 : -80 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="space-y-6">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN B: MANAJER / SUPERVISOR</h3>
                </div>
                {renderRadioGroup("bagian_b", bagianB, "b", optionsSangatTidakSetuju)}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: direction === 1 ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction === 1 ? 80 : -80 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="space-y-6">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN C: KOMUNIKASI</h3>
                  <p className="text-slate-500 text-[13px] md:text-[13px]">Seberapa sering kejadian ini timbul di Unit anda?</p>
                </div>
                {renderRadioGroup("bagian_c", bagianC, "c", optionsTidakPernah)}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: direction === 1 ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction === 1 ? 80 : -80 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="space-y-6">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN D: FREKUENSI PELAPORAN INSIDEN</h3>
                </div>
                {renderRadioGroup("bagian_d", bagianD, "d", optionsTidakPernah)}

                <div className="mt-10 mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN E: TINGKAT KESELAMATAN PASIEN</h3>
                </div>
                <motion.div 
                  id="bagian_e"
                  animate={highlightedId === "bagian_e" ? { x: [-8, 8, -8, 8, 0] } : { x: 0, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className={`relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-300 flex overflow-hidden
                    ${highlightedId === "bagian_e" ? 'border-red-400 bg-red-50/30' : 'hover:shadow-md'}
                    ${form.bagian_e !== "" ? 'shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : ''}
                  `}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
                    ${form.bagian_e !== "" ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-200'}
                    ${highlightedId === "bagian_e" ? 'bg-red-400' : ''}
                  `} />
                  <div className="w-full pl-3 md:pl-4">
                    <h4 className={`font-semibold mb-4 text-[13px] md:text-[13px] ${highlightedId === "bagian_e" ? 'text-red-600' : 'text-slate-800'}`}>Pilih tingkat keselamatan pasien pada unit anda</h4>
                    <div className="flex flex-col gap-3">
                      {["Sempurna", "Sangat Baik", "Bisa diterima", "Jelek/Buruk", "Gagal"].map((opt, idx) => (
                        <label key={idx} className={`flex items-center gap-3 cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-200 flex-1 min-w-[140px]
                          ${form.bagian_e === opt ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 border'}
                        `}>
                          <input 
                            type="radio" 
                            name="bagian_e"
                            value={opt} 
                            checked={form.bagian_e === opt}
                            onChange={(e) => handleChange("root", "bagian_e", e.target.value)}
                            className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`font-medium text-[13px] ${form.bagian_e === opt ? 'text-emerald-700' : 'text-slate-600'}`}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: direction === 1 ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction === 1 ? 80 : -80 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="space-y-6">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN F: RUMAH SAKIT ANDA</h3>
                </div>
                {renderRadioGroup("bagian_f", bagianF, "f", optionsSangatTidakSetuju)}
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: direction === 1 ? -80 : 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction === 1 ? 80 : -80 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="space-y-6">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN G: JUMLAH LAPORAN</h3>
                </div>
                <motion.div 
                  id="bagian_g"
                  animate={highlightedId === "bagian_g" ? { x: [-8, 8, -8, 8, 0] } : { x: 0, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className={`relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-300 flex overflow-hidden
                    ${highlightedId === "bagian_g" ? 'border-red-400 bg-red-50/30' : 'hover:shadow-md'}
                    ${form.bagian_g !== "" ? 'shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : ''}
                  `}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
                    ${form.bagian_g !== "" ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-200'}
                    ${highlightedId === "bagian_g" ? 'bg-red-400' : ''}
                  `} />
                  <div className="w-full pl-3 md:pl-4">
                    <h4 className={`font-semibold mb-4 text-[13px] md:text-[13px] ${highlightedId === "bagian_g" ? 'text-red-600' : 'text-slate-800'}`}>Dalam 12 bulan terakhir jumlah laporan kejadian yang telah anda isi dan kirimkan</h4>
                    <div className="flex flex-col gap-3">
                      {["Tidak ada", "1 - 2 laporan", "3 - 5 laporan", "6 - 10 laporan", "11 - 20 laporan", "21 atau lebih laporan"].map((opt, idx) => (
                        <label key={idx} className={`flex items-center gap-3 cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-200 flex-1 min-w-[140px]
                          ${form.bagian_g === opt ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 border'}
                        `}>
                          <input 
                            type="radio" 
                            name="bagian_g"
                            value={opt} 
                            checked={form.bagian_g === opt}
                            onChange={(e) => handleChange("root", "bagian_g", e.target.value)}
                            className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`font-medium text-[13px] ${form.bagian_g === opt ? 'text-emerald-700' : 'text-slate-600'}`}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <div className="mt-10 mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN H: LATAR BELAKANG</h3>
                </div>
                {bagianH.map((qObj, idx) => {
                  const id = `bagian_h_${idx}`;
                  const isAnswered = (form.bagian_h as any)[`h_${idx}`] !== "";
                  const isHighlighted = highlightedId === id;

                  return (
                    <motion.div 
                      key={idx}
                      id={id}
                      animate={isHighlighted ? { x: [-8, 8, -8, 8, 0] } : { x: 0, scale: 1 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.3 }}
                      className={`relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-300 flex overflow-hidden
                        ${isHighlighted ? 'border-red-400 bg-red-50/30' : 'hover:shadow-md'}
                        ${isAnswered ? 'shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : ''}
                      `}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
                        ${isAnswered ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-200'}
                        ${isHighlighted ? 'bg-red-400' : ''}
                      `} />
                      <div className="w-full pl-3 md:pl-4">
                        <h4 className={`font-semibold mb-4 text-[13px] md:text-[13px] ${isHighlighted ? 'text-red-600' : 'text-slate-800'}`}>{idx + 1}. {qObj.q}</h4>
                        <div className="flex flex-col gap-3">
                          {qObj.options.map((opt, oIdx) => {
                            const isSelected = (form.bagian_h as any)[`h_${idx}`] === opt;
                            return (
                              <label key={oIdx} className={`flex items-center gap-3 cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-200 flex-1 min-w-[140px]
                                ${isSelected ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 border'}
                              `}>
                                <input 
                                  type="radio" 
                                  name={`bagian_h_h_${idx}`} 
                                  value={opt} 
                                  checked={isSelected}
                                  onChange={(e) => handleChange("bagian_h", `h_${idx}`, e.target.value)}
                                  className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className={`font-medium text-[13px] ${isSelected ? 'text-emerald-700' : 'text-slate-600'}`}>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                <div className="mt-10 mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">BAGIAN I: KOMENTAR ANDA</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-semibold text-slate-800 text-[13px] md:text-[13px] mb-4">Tulis komentar anda mengenai keselamatan pasien, insiden, atau pelaporan insiden di RS anda:</h4>
                  <textarea 
                    rows={4}
                    value={form.bagian_i_komentar}
                    onChange={(e) => handleChange("root", "bagian_i_komentar", e.target.value)}
                    placeholder="Tuliskan komentar anda di sini (opsional)..."
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-[13px] text-slate-700 resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 p-6 md:px-10 md:py-8 flex items-center justify-between">
          <div>
            {step === totalSteps && filledCount === totalRequired && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] md:text-[13px] font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={18} /> Semua pertanyaan telah terisi.
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-6 py-3 bg-white border border-slate-200 text-[13px] text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Sebelumnya
              </button>
            )}
            
            {step < totalSteps && (
              <button 
                onClick={handleNextClick}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white text-[13px] font-bold rounded-xl hover:bg-emerald-700 transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                Lanjut <ArrowRight size={18} />
              </button>
            )}

            {step === totalSteps && (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                {loading ? "Menyimpan..." : (
                  <>
                    <Save size={18} /> Kirim Kuesioner
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)] flex items-center gap-3"
          >
            <AlertCircle className="text-amber-500" size={24} />
            <div>
              <p className="font-bold text-[13px]">Gagal Melanjutkan</p>
              <p className="text-[13px] mt-0.5">Masih terdapat pertanyaan yang belum diisi. Silakan lengkapi terlebih dahulu.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
