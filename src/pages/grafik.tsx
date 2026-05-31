import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { Filter, Activity } from "lucide-react";
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
    return indicatorProfiles.filter(p => {
      if (categoryFilter === "Semua") return true;
      if (categoryFilter === "IMP-UNIT") return p.category === "IMP Unit" || p.category === "IMP-Unit";
      return p.category === categoryFilter;
    });
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

      return {
        id: profile.id,
        name: profile.indicator_title,
        category: profile.category,
        capaian: parseFloat(overallCapaian.toFixed(2)),
        target: parsedTargetOverall,
        status: status,
        rawTargetStr: profile.target,
        unit: profile.measurement_unit,
        series: series
      };
    });
  }, [activeProfilesInCategory, dataMutuList, periodeMode, selectedBulan, selectedTriwulan, selectedSemester, selectedTahun]);

  const hasData = chartData.some(d => d.status !== "Belum Ada Data");
  
  const totalIndicators = chartData.length;
  const tercapaiCount = chartData.filter(d => d.status === "Tercapai").length;
  const belumTercapaiCount = chartData.filter(d => d.status === "Tidak Tercapai" || d.status === "Mendekati Target").length;
  const avgCapaian = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.capaian, 0) / chartData.length : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 pb-16">
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
          {chartData.map((d, idx) => {
            if (d.status === "Belum Ada Data") return null;

            const periodName = (() => {
              if (periodeMode === "Bulanan") return selectedBulan;
              if (periodeMode === "Triwulan") return `Triwulan ${selectedTriwulan}`;
              if (periodeMode === "Semester") return `Semester ${selectedSemester}`;
              return `Tahun ${selectedTahun}`;
            })();

            const longPeriodName = (() => {
              if (periodeMode === "Bulanan") return `Periode Bulan ${selectedBulan} Tahun ${selectedTahun}`;
              if (periodeMode === "Triwulan") {
                  if (selectedTriwulan === "1") return `Periode Triwulan I (Januari - Maret) Tahun ${selectedTahun}`;
                  if (selectedTriwulan === "2") return `Periode Triwulan II (April - Juni) Tahun ${selectedTahun}`;
                  if (selectedTriwulan === "3") return `Periode Triwulan III (Juli - September) Tahun ${selectedTahun}`;
                  if (selectedTriwulan === "4") return `Periode Triwulan IV (Oktober - Desember) Tahun ${selectedTahun}`;
              }
              if (periodeMode === "Semester") {
                  if (selectedSemester === "1") return `Periode Semester I (Januari - Juni) Tahun ${selectedTahun}`;
                  if (selectedSemester === "2") return `Periode Semester II (Juli - Desember) Tahun ${selectedTahun}`;
              }
              return `Periode Tahun ${selectedTahun}`;
            })();

            return (
              <div key={d.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col items-center">
                <div className="text-center mb-6 w-full px-4">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{d.name}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{longPeriodName}</p>
                </div>
                
                <div className="relative w-full h-[280px] shrink-0 mt-4">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="99%" height="100%" debounce={0}>
                      {chartType === "bar" ? (
                        <ComposedChart data={d.series} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                          <Bar shape={<TwoDShadowBar />} dataKey="capaian" name="Capaian" fill="#2563EB" maxBarSize={48}>
                            <LabelList dataKey="capaian" position="top" offset={10} formatter={(val: number) => val + "%"} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#2563EB' }} />
                          </Bar>
                          <Bar shape={<TwoDShadowBar />} dataKey="target" name="Target" fill="#DC2626" maxBarSize={48}>
                            <LabelList dataKey="target" position="top" offset={10} formatter={(val: number) => val + "%"} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#DC2626' }} />
                          </Bar>
                        </ComposedChart>
                      ) : (
                        <LineChart data={d.series} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                          <RechartsTooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
                          <RechartsLegend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} />
                          <Line dataKey="capaian" name="Capaian" type="monotone" stroke="#2563EB" strokeWidth={4} dot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }}>
                             <LabelList dataKey="capaian" position="top" offset={10} formatter={(val: number) => val + "%"} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#2563EB' }} />
                          </Line>
                          <Line dataKey="target" name="Target" type="monotone" stroke="#DC2626" strokeWidth={4} dot={{ r: 6, fill: '#DC2626', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }}>
                             <LabelList dataKey="target" position="top" offset={10} formatter={(val: number) => val + "%"} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#DC2626' }} />
                          </Line>
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="w-full mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Analisis Capaian & Rekomendasi</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        Dari grafik di atas terlihat bahwa capaian mutu <strong>{d.name}</strong> pada periode <strong>{longPeriodName}</strong> mencapai <strong>{d.capaian}%</strong>, dengan standar target <strong>{d.target}%</strong>.
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Rekomendasi: </strong>
                        {d.status === "Tercapai"
                          ? "Pertahankan capaian dan terus lakukan monitoring secara berkala agar mutu tetap terjaga."
                          : "Lakukan evaluasi mendalam dan cari akar permasalahan untuk dapat meningkatkan upaya perbaikan mutu agar mencapai standar target ke depannya."
                        }
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      


    </div>
  );
}
