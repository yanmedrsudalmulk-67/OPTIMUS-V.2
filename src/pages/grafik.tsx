import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { Filter, Activity, Check } from "lucide-react";
import { formatTarget } from "../../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  LabelList
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-xs font-bold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex flex-row items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[10px] font-semibold text-gray-500 uppercase">{entry.name}</span>
            </div>
            <span className="text-xs font-black" style={{ color: entry.color }}>
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TwoDShadowBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  
  if (height === undefined || height <= 0 || Number.isNaN(height)) {
     return <rect x={x} y={y} width={width} height={0} fill={fill} />;
  }

  // Desain 2D Bar dengan sudut melengkung halus di bagian atas (rounded-top corners)
  const radius = Math.min(6, width / 2);
  const path = `
    M ${x},${y + height}
    L ${x},${y + radius}
    A ${radius},${radius} 0 0,1 ${x + radius},${y}
    L ${x + width - radius},${y}
    A ${radius},${radius} 0 0,1 ${x + width},${y + radius}
    L ${x + width},${y + height}
    Z
  `;

  return (
    <g>
      {/* Bayangan hitam realistis (soft black shadow) di belakang bar */}
      <path 
        d={path} 
        fill="#000000" 
        opacity="0.18" 
        style={{ transform: 'translate(3px, 3px)', filter: 'blur(1.5px)' }}
      />
      {/* Bar 2D Utama */}
      <path 
        d={path} 
        fill={fill} 
      />
    </g>
  );
};

const CustomLineLabel = (props: any) => {
  const { x, y, value, index, type, data } = props;
  if (value === undefined || value === null) return null;

  const entry = data[index] || {};
  const targetVal = entry.target !== undefined ? entry.target : 0;
  const capaianVal = entry.capaian !== undefined ? entry.capaian : 0;
  
  const isClose = Math.abs(targetVal - capaianVal) < 5;
  const isSame = targetVal === capaianVal;
  
  let yOffset = type === 'target' ? -22 : 22;
  if (isSame || isClose) {
    yOffset = type === 'target' ? -26 : 26;
  }

  const color = type === 'target' ? '#DC2626' : '#2563EB';
  const strokeColor = type === 'target' ? '#fecaca' : '#bfdbfe';
  const bgColor = 'rgba(255, 255, 255, 0.9)';
  
  const textStr = `${value}%`;
  // Responsive width heuristic
  const charWidth = 7;
  const rectWidth = textStr.length * charWidth + 18;
  const rectHeight = 22;
  
  let xOffset = -(rectWidth / 2);
  
  // Prevent clipping on edges
  if (index === 0) xOffset = -(rectWidth / 2) + 12;
  if (index === data.length - 1) xOffset = -(rectWidth / 2) - 12;

  return (
    <g transform={`translate(${x},${y})`} style={{ transition: 'all 0.3s ease' }}>
      <rect
        x={xOffset}
        y={yOffset - (rectHeight / 2)}
        width={rectWidth}
        height={rectHeight}
        fill={bgColor}
        stroke={strokeColor}
        strokeWidth="1"
        rx="6"
        ry="6"
      />
      <text
        x={xOffset + (rectWidth / 2)}
        y={yOffset + 4}
        fill={color}
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
      >
        {textStr}
      </text>
    </g>
  );
};

const LineChartTooltip = ({ active, payload, label, indicatorName, isReverse }: any) => {
  if (active && payload && payload.length) {
    const capaianEntry = payload.find((p: any) => p.dataKey === 'capaian');
    const targetEntry = payload.find((p: any) => p.dataKey === 'target');
    
    const capaian = capaianEntry ? capaianEntry.value : 0;
    const target = targetEntry ? targetEntry.value : 0;
    
    // Using string conversion to avoid floating point issues
    let diff = (capaian - target).toFixed(2);
    // remove .00
    if (diff.endsWith('.00')) diff = diff.split('.')[0];
    
    const isSuccess = isReverse ? capaian <= target : capaian >= target;
    const statusText = isSuccess ? "Tercapai" : "Belum Tercapai";
    const statusColor = isSuccess ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200";
    
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl min-w-[200px] z-50">
        <h4 className="text-[13px] font-bold text-gray-800 mb-1 leading-tight">{indicatorName}</h4>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Periode: {label}</p>
        
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-blue-600"></div>
               <span className="text-xs font-semibold text-slate-600">Capaian</span>
             </div>
             <span className="text-sm font-bold text-blue-700">{capaian}%</span>
          </div>
          <div className="flex justify-between items-center bg-red-50/50 p-2 rounded-lg border border-red-100/50">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-600"></div>
               <span className="text-xs font-semibold text-slate-600">Target</span>
             </div>
             <span className="text-sm font-bold text-red-700">{target}%</span>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
           <div className="flex flex-col">
             <span className="text-[10px] text-slate-500 font-medium tracking-wide">SELISIH</span>
             <span className={`text-[13px] font-black ${capaian >= target ? 'text-emerald-600' : 'text-red-600'}`}>
               {capaian >= target ? '+' : ''}{diff}%
             </span>
           </div>
           <div className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
             {statusText}
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Grafik() {
  const dataMutuList = useStore((state) => state.dataMutuList);
  const setDataMutuList = useStore((state) => state.setDataMutuList);
  const indicatorProfiles = useStore((state) => state.indicatorProfiles);

  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [categoryFilter, setCategoryFilter] = useState("INM");
  
  // Periode Filter
  const [periodeMode, setPeriodeMode] = useState("Bulanan");
  const [selectedBulan, setSelectedBulan] = useState(new Date().toLocaleString("id-ID", { month: "long" }));
  const [selectedTriwulan, setSelectedTriwulan] = useState("1");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedTahun, setSelectedTahun] = useState(String(new Date().getFullYear()));

  // Setup Real-time Listener and Fetch
  useEffect(() => {
    const fetchSupabaseInputs = async () => {
      try {
        const { data, error } = await supabase
          .from("indicator_inputs")
          .select("*")
          .order("created_at", { ascending: true });

        if (data && data.length >= 0) {
          const newDataList = data.map((dbInput: any) => {
            const matchedProfile = indicatorProfiles.find((p) => p.id === dbInput.indicator_id);
            const persentase = dbInput.achievement_percentage || 0;
            const rawTarget = dbInput.target || matchedProfile?.target || 80;
            const target = parseFloat(String(rawTarget).replace(/[^0-9.]/g, '')) || 80;

            return {
              id: dbInput.id,
              unit: dbInput.unit_id,
              tanggal: dbInput.input_date,
              kategori: dbInput.category_id,
              indikator_id: dbInput.indicator_id || undefined,
              target: target,
              capaian: persentase,
            };
          });
          setDataMutuList(newDataList);
        }
      } catch (err) {
        console.warn("Supabase fetch failed", err);
      }
    };
    fetchSupabaseInputs();

    const inputsChannel = supabase
      .channel("grafik-inputs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "indicator_inputs" }, () => {
        fetchSupabaseInputs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inputsChannel);
    };
  }, [indicatorProfiles, setDataMutuList]);

  // Derive available years from data
  const availableYears = useMemo(() => {
    const years = new Set(dataMutuList.filter(d => d.tanggal).map(d => new Date(d.tanggal).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [dataMutuList]);

  // Compute Active Indicators based on Category
  const activeProfilesInCategory = useMemo(() => {
    let profiles = indicatorProfiles.filter(p => {
      if (categoryFilter === "Semua") return true;
      if (categoryFilter === "IMP-UNIT") return p.category === "IMP Unit" || p.category === "IMP-Unit";
      return p.category === categoryFilter;
    });
    
    profiles.sort((a, b) => {
      const aIsKKT = (a.indicator_title || "").toLowerCase().includes("kebersihan tangan");
      const bIsKKT = (b.indicator_title || "").toLowerCase().includes("kebersihan tangan");
      if (aIsKKT && !bIsKKT) return -1;
      if (!aIsKKT && bIsKKT) return 1;
      return 0;
    });
    
    return profiles;
  }, [indicatorProfiles, categoryFilter]);

  // Compute values for each indicator in the category, aggregated by the selected period
  const chartData = useMemo(() => {
    return activeProfilesInCategory.map(profile => {
      let months: string[] = [];
      const allMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      
      if (periodeMode === "Bulanan") {
        months = [selectedBulan];
      } else if (periodeMode === "Triwulan") {
        const t = parseInt(selectedTriwulan);
        if (t === 1) months = allMonths.slice(0, 3);
        else if (t === 2) months = allMonths.slice(3, 6);
        else if (t === 3) months = allMonths.slice(6, 9);
        else if (t === 4) months = allMonths.slice(9, 12);
      } else if (periodeMode === "Semester") {
        const s = parseInt(selectedSemester);
        if (s === 1) months = allMonths.slice(0, 6);
        else if (s === 2) months = allMonths.slice(6, 12);
      } else {
        months = allMonths;
      }

      const series: { name: string; capaian: number; target: number }[] = [];
      
      let totalCapaian = 0;
      let countWithData = 0;

      months.forEach((monthName) => {
        const matchingInputs = dataMutuList.filter(d => {
          if (d.indikator_id !== profile.id) return false;
          if (!d.tanggal) return false;
          
          const date = new Date(d.tanggal);
          const mYear = String(date.getFullYear());
          const mMonthName = date.toLocaleString("id-ID", { month: "long" });

          return mYear === selectedTahun && mMonthName === monthName;
        });

        let monthCapaian = 0;
        if (matchingInputs.length > 0) {
          monthCapaian = matchingInputs.reduce((sum, r) => sum + (r.capaian || 0), 0) / matchingInputs.length;
          totalCapaian += monthCapaian;
          countWithData++;
        }
        
        const rawTarget = matchingInputs[0]?.target || profile.target || 80;
        const parsedTarget = parseFloat(String(rawTarget).replace(/[^0-9.]/g, '')) || 80;

        series.push({
          name: monthName,
          capaian: parseFloat(monthCapaian.toFixed(2)),
          target: parsedTarget
        });
      });

      let overallCapaian = 0;
      if (countWithData > 0) {
        overallCapaian = totalCapaian / countWithData;
      }
      
      const rawTargetOverall = profile.target || 80;
      const parsedTargetOverall = parseFloat(String(rawTargetOverall).replace(/[^0-9.]/g, '')) || 80;
      
      const isReverse = profile.reverse || false;
      const isSuccess = isReverse ? overallCapaian <= parsedTargetOverall : overallCapaian >= parsedTargetOverall;
      
      let status = "Tidak Tercapai";
      if (countWithData > 0) {
        if (isSuccess) status = "Tercapai";
        else if (Math.abs(overallCapaian - parsedTargetOverall) <= 10) status = "Mendekati Target";
      } else {
        status = "Belum Ada Data";
      }

      let longPeriodName = `Tahun ${selectedTahun}`;
      let shortPeriod = "Tahunan";
      if (periodeMode === "Bulanan") {
        longPeriodName = `bulan ${selectedBulan} Tahun ${selectedTahun}`;
        shortPeriod = "Bulanan";
      }
      if (periodeMode === "Triwulan") {
        let twStr = "";
        if (selectedTriwulan.includes("1")) twStr = "Triwulan I";
        if (selectedTriwulan.includes("2")) twStr = "Triwulan II";
        if (selectedTriwulan.includes("3")) twStr = "Triwulan III";
        if (selectedTriwulan.includes("4")) twStr = "Triwulan IV";
        longPeriodName = `${twStr} Tahun ${selectedTahun}`;
        shortPeriod = "Triwulan";
      }
      if (periodeMode === "Semester") {
        let semStr = "";
        if (selectedSemester.includes("1")) semStr = "Semester I";
        if (selectedSemester.includes("2")) semStr = "Semester II";
        longPeriodName = `${semStr} Tahun ${selectedTahun}`;
        shortPeriod = "Semester";
      }

      const avgCap = parseFloat(overallCapaian.toFixed(2));
      const indTitle = profile.indicator_title;

      let rekomendasiList: string[] = [];
      let pdsa = { plan: "", do: "", study: "", action: "" };

      const lowerName = indTitle ? indTitle.toLowerCase() : "";

      if (lowerName.includes("kebersihan tangan")) {
        rekomendasiList = [
          "Melakukan observasi kepatuhan hand hygiene minimal 100 observasi per unit setiap bulan.",
          "Melaksanakan refresh training WHO Five Moments.",
          "Melakukan audit ketersediaan handrub dan wastafel.",
          "Memberikan umpan balik hasil observasi kepada unit.",
          "Menetapkan unit dengan kepatuhan terendah sebagai prioritas pembinaan.",
          "Melaksanakan supervisi langsung oleh IPCN dan kepala unit.",
        ];
        pdsa = {
          plan: "Melakukan edukasi ulang kepatuhan kebersihan tangan.",
          do: "Pelaksanaan sosialisasi dan refresh training kepada seluruh petugas pelayanan.",
          study: "Evaluasi perubahan capaian indikator pada bulan/periode berikutnya.",
          action: "Menetapkan pelaksanaan monitoring rutin dan audit fasilitas sebagai standar kerja unit."
        };
      } else if (lowerName.includes("identifikasi") || lowerName.includes("gelang")) {
        rekomendasiList = [
          "Melakukan audit kepatuhan identifikasi pasien menggunakan minimal dua identitas.",
          "Mengoptimalkan penggunaan dan pengecekan gelang identitas pada setiap tindakan.",
          "Melakukan simulasi patient safety terkait identifikasi.",
          "Meningkatkan supervisi pada area rawat inap dan IGD terkait proses serah terima.",
        ];
        pdsa = {
          plan: "Meningkatkan kepatuhan identifikasi pasien sebelum tindakan dan pemberian obat.",
          do: "Edukasi di tempat (bedside teaching) dan penekanan SOP identifikasi pasien.",
          study: "Memantau angka insiden near miss terkait kesalahan identifikasi.",
          action: "Diseminasi SOP identifikasi pasien terbaru dan penetapan zero tolerance untuk pelanggaran."
        };
      } else if (lowerName.includes("waktu tunggu") || lowerName.includes("response time")) {
        rekomendasiList = [
          "Melakukan analisis bottleneck pelayanan dari pendaftaran hingga penyelesaian.",
          "Mengoptimalkan jadwal dokter dan ketepatan waktu kehadiran.",
          "Mengurangi waktu tunggu administrasi dengan inovasi digitalisasi atau e-rekam medis.",
          "Melakukan redistribusi petugas pada jam-jam sibuk kunjungan pasien.",
        ];
        pdsa = {
          plan: "Mempercepat waktu pelayanan poli rawat jalan sesuai standar mutu.",
          do: "Pengaturan ulang jam pelayanan, penyesuaian penugasan petugas triage, dan percepatan rekam medis.",
          study: "Membandingkan rata-rata waktu tunggu sebelum dan sesudah intervensi manajemen jalur pasien.",
          action: "Standarisasi jadwal operasional poli integrasi berbasis antrean elektronik."
        };
      } else if (lowerName.includes("apd") || lowerName.includes("alat pelindung diri")) {
        rekomendasiList = [
          "Melakukan audit kepatuhan penggunaan APD di ruang isolasi dan tindakan.",
          "Perencanaan dan monitoring ketersediaan logistik APD di setiap ruangan.",
          "Edukasi ulang penggunaan jenis APD sesuai level risiko paparan.",
          "Supervisi lapangan secara berkala oleh tim PPI dan penanggung jawab safety.",
        ];
        pdsa = {
          plan: "Meningkatkan kepatuhan pemakaian dan pelepasan APD yang benar.",
          do: "Pelatihan doffing dan donning APD serta penyediaan poster kepatuhan di area tindakan.",
          study: "Audit penggunaan APD pada titik poin intervensi dan memantau ketersediaan stok harian.",
          action: "Pemasangan cctv monitoring (bila perlu) dan penetapan sanksi edukatif bagi ketidakpatuhan berulang."
        };
      } else if (lowerName.includes("infeksi") || lowerName.includes("phlebitis") || lowerName.includes("isk") || lowerName.includes("vap") || lowerName.includes("ido") || profile.category === "PPI") {
        rekomendasiList = [
          "Melakukan audit kepatuhan bundel pencegahan infeksi (bundle prevention).",
          "Monitoring HAIs secara ketat dan pelaporan real-time.",
          "Peningkatan kepatuhan hand hygiene dan teknik aseptik perawat.",
          "Evaluasi pelaksanaan kewaspadaan standar dan kewaspadaan transmisi.",
        ];
        pdsa = {
          plan: "Menurunkan potensi angka kejadian HAIs (Hospital Acquired Infections).",
          do: "Penerapan bundle PPI secara paripurna pada setiap tindakan invasif dan operasi.",
          study: "Analisis laporan surveilans rate infeksi bulanan antar unit risiko tinggi.",
          action: "Pembuatan regulasi tata ruang baru untuk meminimalisasi kontaminasi silang."
        };
      } else if (profile.category === "IKP" || profile.category === "Keselamatan Pasien" || lowerName.includes("jatuh") || lowerName.includes("insiden")) {
        rekomendasiList = [
          "Melakukan analisis tren dan jenis insiden keselamatan pasien bulanan.",
          "Menyusun Root Cause Analysis (RCA) pada insiden berulang atau Sentinel.",
          "Implementasi 'lesson learned' melalui diskusi kasus di tiap unit.",
          "Monitoring penyelesaian rekomendasi dan rencana tindak lanjut (RTL) insiden.",
        ];
        pdsa = {
          plan: "Meminimalisasi angka medication error, pasien jatuh, atau insiden lainnya.",
          do: "Penguatan asesmen awal risiko (misal: Morse Fall Scale), double check obat high alert.",
          study: "Evaluasi tingkat kelengkapan pelaporan insiden dalam 2x24 jam dan validasi gradasi risiko.",
          action: "Revisi panduan keselamatan pasien berbasis hasil investigasi insiden terkini."
        };
      } else {
        rekomendasiList = [
          "Melakukan analisis hambatan pencapaian secara komprehensif di unit pelayanan.",
          "Menyusun program kerja perbaikan mutu berbasis data empiris.",
          "Mengoptimalkan peran penanggung jawab pengumpul data dalam validasi kelengkapan form.",
          "Berkoordinasi dengan Komite Mutu untuk penyelenggaraan in-house training.",
        ];
        pdsa = {
          plan: "Merumuskan strategi perbaikan indikator mutu terkait kinerja unit.",
          do: "Sosialisasi instruksi kerja dan pendampingan implementasi SOP langsung ke lapangan.",
          study: "Pemantauan berkala dan analisis capaian untuk mengidentifikasi keberhasilan maupun celah baru.",
          action: "Penyempurnaan panduan/kebijakan serta integrasi evaluasi capaian ke dalam laporan manajemen."
        };
      }

      const opTargetText = isReverse ? `≤${parsedTargetOverall}%` : `≥${parsedTargetOverall}%`;
      
      let analisa = "";
      if (countWithData === 0) {
          analisa = `Belum ada data observasi yang dimasukkan untuk indikator ini pada periode ${shortPeriod} terkait tahun ${selectedTahun}. Silakan memastikan kelengkapan input data di formulir observasi.`;
      } else {
          const gapValue = Math.abs(avgCap - parsedTargetOverall).toFixed(1);
          const gapStr = gapValue.endsWith(".0") ? gapValue.slice(0, -2) : gapValue;
          
          if (status === "Tercapai") {
              analisa = `Berdasarkan hasil pemantauan pada ${longPeriodName}, indikator ${indTitle} memperoleh capaian sebesar ${avgCap}%, melampaui target nasional ${opTargetText}.\n\nCapaian ini menunjukkan implementasi program telah berjalan efektif dan konsisten di unit pelayanan. Keberhasilan ini perlu dipertahankan melalui monitoring rutin, supervisi berkala, dan penguatan budaya mutu serta keselamatan pasien.`;
          } else if (status === "Mendekati Target") {
              analisa = `Capaian indikator ${indTitle} pada ${longPeriodName} adalah sebesar ${avgCap}%. Hasil ini telah mendekati target namun masih terdapat gap sebesar ${gapStr}% dari standar mutu nasional (${opTargetText}).\n\nHal ini menunjukkan proses pelayanan sudah berjalan cukup baik namun masih memerlukan penguatan dengan fokus pada beberapa area pelayanan kritis untuk mencapai target secara 100% optimal.`;
          } else {
              let specificProblemStr = `Hasil ini menunjukkan masih terdapat ketidakpatuhan atau kendala sistemis dalam penerapan standar pelayanan sehingga berpotensi menurunkan mutu asuhan.`;
              if (lowerName.includes("kebersihan tangan")) specificProblemStr = `Hasil ini menunjukkan masih terdapat ketidakpatuhan petugas dalam penerapan kebersihan tangan sesuai standar WHO Five Moments for Hand Hygiene sehingga berpotensi meningkatkan risiko infeksi terkait pelayanan kesehatan (HAIs).`;
              else if (lowerName.includes("identifikasi") || lowerName.includes("gelang")) specificProblemStr = `Hasil ini menunjukkan kurangnya kedisiplinan dalam mematuhi prosedur verifikasi pasien berbasis bukti sebelum pemberian layanan klinis.`;
              else if (lowerName.includes("waktu tunggu")) specificProblemStr = `Hasil ini merepresentasikan adanya hambatan durasi pada siklus perjalanan pasien dari pendaftaran hingga penyelesaian medis yang belum mencapai standar tepat waktu.`;
              else if (lowerName.includes("apd") || lowerName.includes("alat pelindung diri")) specificProblemStr = `Hal ini berpotensi memberikan risiko paparan infeksi nosokomial kepada tenaga medis akibat ketidakpatuhan perlindungan standar.`;
              
              analisa = `Berdasarkan hasil pemantauan ${longPeriodName}, indikator ${indTitle} hanya mencapai ${avgCap}%. Capaian tersebut berada ${gapStr}% ${isReverse ? 'di atas' : 'di bawah'} target yang diwajibkan (${opTargetText}).\n\n${specificProblemStr}`;
          }
      }

      return {
        id: profile.id,
        name: profile.indicator_title,
        category: profile.category,
        capaian: avgCap,
        target: parsedTargetOverall,
        status: status,
        rawTargetStr: profile.target,
        unit: profile.measurement_unit,
        series: series,
        analisa,
        rekomendasiList,
        pdsa,
        isReverse: isReverse,
        longPeriodName
      };
    });
  }, [activeProfilesInCategory, dataMutuList, periodeMode, selectedBulan, selectedTriwulan, selectedSemester, selectedTahun]);

  const hasData = chartData.some(d => d.status !== "Belum Ada Data");
  
  const totalIndicators = chartData.length;
  const tercapaiCount = chartData.filter(d => d.status === "Tercapai").length;
  const belumTercapaiCount = chartData.filter(d => d.status === "Tidak Tercapai" || d.status === "Mendekati Target").length;
  const avgCapaian = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.capaian, 0) / chartData.length : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-16 w-full max-w-full px-2 sm:px-4 md:px-0 overflow-x-hidden md:overflow-visible">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#10a37f] tracking-tight">
            Grafik Capaian Mutu
          </h1>
          <p className="text-gray-500 mt-1.5 text-xs font-semibold uppercase tracking-wider">
            Analisis Dinamis Indikator Kinerja Klinis
          </p>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 self-start md:self-auto shadow-sm">
          <button
            onClick={() => setChartType("bar")}
            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
              chartType === "bar"
                ? "bg-white text-emerald-800 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
              chartType === "line"
                ? "bg-white text-emerald-800 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Line Chart
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <Filter className="text-emerald-600" size={16} />
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Filter Parameter</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kategori Mutu</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-gray-700 shadow-3xs cursor-pointer"
            >
              <option value="INM">INM</option>
              <option value="IMP-RS">IMP-RS</option>
              <option value="IMP-UNIT">IMP-UNIT</option>
              <option value="SPM">SPM</option>
              <option value="Semua">Semua Kategori</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Periode</label>
            <select
              value={periodeMode}
              onChange={(e) => setPeriodeMode(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-gray-700 shadow-3xs cursor-pointer"
            >
              <option value="Bulanan">Bulanan</option>
              <option value="Triwulan">Triwulan</option>
              <option value="Semester">Semester</option>
              <option value="Tahunan">Tahunan</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bulan / Termin</label>
            {periodeMode === "Bulanan" && (
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold text-gray-700 shadow-3xs"
              >
                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            {periodeMode === "Triwulan" && (
              <select value={selectedTriwulan} onChange={(e) => setSelectedTriwulan(e.target.value)} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold text-gray-700 shadow-3xs">
                <option value="1">Triwulan I (Jan-Mar)</option>
                <option value="2">Triwulan II (Apr-Jun)</option>
                <option value="3">Triwulan III (Jul-Sep)</option>
                <option value="4">Triwulan IV (Okt-Des)</option>
              </select>
            )}
            {periodeMode === "Semester" && (
              <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold text-gray-700 shadow-3xs">
                <option value="1">Semester I (Jan-Jun)</option>
                <option value="2">Semester II (Jul-Des)</option>
              </select>
            )}
            {periodeMode === "Tahunan" && (
              <select disabled className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl opacity-60 text-xs font-bold text-gray-400">
                <option>Sepanjang Tahun</option>
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tahun</label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-gray-700 shadow-3xs cursor-pointer w-full"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>



      {/* CHART SECTION */}
      {!hasData ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative min-h-[400px] flex flex-col items-center justify-center anime-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.03)]">
            <Activity size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">Belum Terdapat Data Capaian Mutu</h3>
          <p className="text-slate-500 text-sm font-medium text-center mt-2 max-w-md leading-relaxed">
            Data laporan mutu belum tersedia atau tidak memenuhi periode saringan Anda („{periodeMode} - {periodeMode === 'Tahunan' ? selectedTahun : selectedBulan}“).
          </p>
          <Link href="/input" className="mt-6 px-6 py-3 bg-[#10a37f] hover:bg-[#0e8f6e] text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
            Input Data Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 w-full">
          {chartData.map((d, idx) => {
            if (d.status === "Belum Ada Data") return null;

            return (
              <div key={d.id} className="bg-white p-4 sm:p-6 md:p-8 rounded-[20px] border border-emerald-500/20 shadow-[0_8px_30px_rgb(16,163,127,0.06)] hover:shadow-[0_16px_40px_rgb(16,163,127,0.12)] transition-all flex flex-col w-full min-w-0 overflow-hidden box-border">
                <div className="mb-6 border-b border-gray-100 pb-5 flex flex-col items-center text-center">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase leading-snug break-words">{d.name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5 break-words">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md w-fit mt-3 border border-emerald-100/50 break-words">Periode: {d.longPeriodName}</p>
                </div>
                
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] shrink-0 mt-2 mb-8">
                  <div className="absolute inset-0 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                      {chartType === "bar" ? (
                        <ComposedChart data={d.series} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(val) => val === 0 ? "0" : val}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            tickCount={5}
                          />
                          <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                          <RechartsLegend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} />
                          <Bar shape={<TwoDShadowBar />} dataKey="capaian" name="Capaian" fill="#2563EB" maxBarSize={48} isAnimationActive={false}>
                            <LabelList dataKey="capaian" position="top" offset={10} formatter={(val: number) => val + "%"} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#2563EB' }} />
                          </Bar>
                          <Bar shape={<TwoDShadowBar />} dataKey="target" name="Target" fill="#DC2626" maxBarSize={48} isAnimationActive={false}>
                            <LabelList dataKey="target" position="top" offset={10} formatter={(val: number) => val + "%"} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#DC2626' }} />
                          </Bar>
                        </ComposedChart>
                      ) : (
                        <LineChart data={d.series} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(val) => val === 0 ? "0" : val}
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            tickCount={5}
                          />
                          <RechartsTooltip content={<LineChartTooltip indicatorName={d.name} isReverse={d.isReverse} />} cursor={{strokeDasharray: '3 3', stroke: '#cbd5e1'}} />
                          <RechartsLegend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} />
                          <Line dataKey="target" name="Target" type="monotone" stroke="#DC2626" strokeWidth={4} dot={{ r: 6, fill: '#DC2626', strokeWidth: 2, stroke: '#fff', style: { transition: 'none' } }} activeDot={{ r: 8, strokeWidth: 0 }} isAnimationActive={false}>
                             <LabelList dataKey="target" content={(props) => <CustomLineLabel {...props} type="target" data={d.series} />} />
                          </Line>
                          <Line dataKey="capaian" name="Capaian" type="monotone" stroke="#2563EB" strokeWidth={4} dot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff', style: { transition: 'none' } }} activeDot={{ r: 8, strokeWidth: 0 }} isAnimationActive={false}>
                             <LabelList dataKey="capaian" content={(props) => <CustomLineLabel {...props} type="capaian" data={d.series} />} />
                          </Line>
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-slate-50/80 p-5 md:p-6 rounded-2xl border border-slate-100 mb-6 w-full overflow-hidden">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Analisa Capaian
                  </h4>
                  <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap text-justify break-words">
                    {d.analisa}
                  </div>
                </div>
                
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-emerald-100 shadow-sm mb-6 w-full overflow-hidden">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Rekomendasi
                  </h4>
                  <ul className="space-y-3">
                    {d.rekomendasiList?.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="bg-emerald-100 text-emerald-600 rounded-full p-0.5 mt-0.5 shrink-0">
                           <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 leading-relaxed break-words">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm w-full overflow-hidden">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    PDSA
                  </h4>
                  <div className="grid grid-cols-1 gap-4 w-full">
                     <div className="flex flex-col sm:flex-row bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                       <div className="bg-indigo-600 text-white sm:w-24 w-full py-2 sm:py-0 flex items-center justify-center font-black text-xs tracking-widest shrink-0">PLAN</div>
                       <div className="p-4 text-sm font-semibold text-slate-700 w-full break-words">{d.pdsa?.plan}</div>
                     </div>
                     <div className="flex flex-col sm:flex-row bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                       <div className="bg-blue-600 text-white sm:w-24 w-full py-2 sm:py-0 flex items-center justify-center font-black text-xs tracking-widest shrink-0">DO</div>
                       <div className="p-4 text-sm font-semibold text-slate-700 w-full break-words">{d.pdsa?.do}</div>
                     </div>
                     <div className="flex flex-col sm:flex-row bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                       <div className="bg-amber-500 text-white sm:w-24 w-full py-2 sm:py-0 flex items-center justify-center font-black text-xs tracking-widest shrink-0">STUDY</div>
                       <div className="p-4 text-sm font-semibold text-slate-700 w-full break-words">{d.pdsa?.study}</div>
                     </div>
                     <div className="flex flex-col sm:flex-row bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                       <div className="bg-emerald-600 text-white sm:w-24 w-full py-2 sm:py-0 flex items-center justify-center font-black text-xs tracking-widest shrink-0">ACTION</div>
                       <div className="p-4 text-sm font-semibold text-slate-700 w-full break-words">{d.pdsa?.action}</div>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      


    </div>
  );
}
