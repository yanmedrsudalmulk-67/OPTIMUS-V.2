import React, { useState, useRef, useMemo, useEffect } from "react";
import { Download, FileText, Printer, FileSpreadsheet, RotateCcw, Filter, CheckCircle2, X, Calendar, Activity, ChevronRight, Calculator, PieChart, Info, BookOpen, Clock, Building2, User, Target } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { useStore, DataMutuPayload } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { formatTarget } from "../../lib/utils";

export default function Laporan() {
  const dataMutuList = useStore((state) => state.dataMutuList);
  const setDataMutuList = useStore((state) => state.setDataMutuList);
  const indicatorProfiles = useStore((state) => state.indicatorProfiles);
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch inputs from Supabase on mount to ensure real-time reporting from supabase
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
            
            // Determine achievement status
            const isReverse = matchedProfile?.reverse || false;
            let computedStatus: "Tercapai" | "Mendekati" | "Tidak Tercapai" = "Tidak Tercapai";
            const isSuccess = isReverse ? persentase <= target : persentase >= target;
            if (isSuccess) {
              computedStatus = "Tercapai";
            } else {
              const gap = isReverse ? persentase - target : target - persentase;
              if (gap <= 10) computedStatus = "Mendekati";
            }

            let ikpData: any = null;
            if (dbInput.category_id === "IKP" && dbInput.notes) {
              try {
                const parsed = JSON.parse(dbInput.notes);
                if (typeof parsed === 'object' && parsed !== null && ('kpc' in parsed || 'knc' in parsed)) {
                  ikpData = parsed;
                }
              } catch (e) {}
            }

            return {
              id: dbInput.id,
              unit: dbInput.unit_id,
              tanggal: dbInput.input_date,
              kategori: dbInput.category_id,
              indikator_id: dbInput.indicator_id || undefined,
              indikator_name: matchedProfile?.indicator_title || undefined,
              numerator: dbInput.numerator_value || 0,
              denominator: dbInput.denominator_value || 1,
              target: target,
              capaian: persentase,
              status: (dbInput.category_id === "IKP" ? "N/A" : computedStatus) as any,
              keterangan: ikpData ? ikpData.keterangan : (dbInput.notes || ""),
              kpc: ikpData ? ikpData.kpc : 0,
              knc: ikpData ? ikpData.knc : 0,
              ktc: ikpData ? ikpData.ktc : 0,
              ktd: ikpData ? ikpData.ktd : 0,
              sentinel: ikpData ? ikpData.sentinel : 0,
            };
          });
          setDataMutuList(newDataList);
        }
      } catch (err) {
        console.warn("Supabase load error in laporan", err);
      }
    };
    fetchSupabaseInputs();

    const inputsChannel = supabase
      .channel("laporan-inputs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "indicator_inputs" }, () => {
        fetchSupabaseInputs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inputsChannel);
    };
  }, [indicatorProfiles, setDataMutuList]);

  const allIndicators = useMemo(() => {
    let profiles = indicatorProfiles.map(p => ({
      id: p.id,
      category: p.category,
      name: p.indicator_title,
      target: p.target,
      formattedTarget: formatTarget(p.target, p.measurement_unit, p.reverse),
      targetVal: parseFloat(String(p.target).replace(/[^0-9.]/g, '')) || 80,
      reverse: p.reverse
    }));
    
    profiles.sort((a, b) => {
      const aIsKKT = (a.name || "").toLowerCase().includes("kebersihan tangan");
      const bIsKKT = (b.name || "").toLowerCase().includes("kebersihan tangan");
      if (aIsKKT && !bIsKKT) return -1;
      if (!aIsKKT && bIsKKT) return 1;
      return 0;
    });
    
    return profiles;
  }, [indicatorProfiles]);

  const [periode, setPeriode] = useState("Triwulan");
  const [bulan, setBulan] = useState("0");
  const [triwulan, setTriwulan] = useState("1");
  const [semester, setSemester] = useState("1");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [kategori, setKategori] = useState("Mutu Keseluruhan");

  // Format number
  const formatNum = (num: number | undefined) => {
    if (num === undefined || isNaN(num)) return 0;
    return Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
  };

  // Detail Modal States
  const [selectedIndikatorDetail, setSelectedIndikatorDetail] = useState<any | null>(null);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number>(0);
  const [visiteDetails, setVisiteDetails] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const selectedProfileData = useMemo(() => {
    return indicatorProfiles.find(p => p.id === selectedIndikatorDetail?.id);
  }, [selectedIndikatorDetail, indicatorProfiles]);

  const indicatorHistory = useMemo(() => {
    if (!selectedIndikatorDetail) return [];
    return dataMutuList
      .filter(d => d.indikator_id === selectedIndikatorDetail.id)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [dataMutuList, selectedIndikatorDetail]);

  const activeInput = indicatorHistory[activeHistoryIndex] || null;

  const activeVisiteFiltered = useMemo(() => {
    if (!activeInput || !visiteDetails) return [];
    const activeDate = activeInput.tanggal; // e.g., "2026-06-07"
    return visiteDetails.filter(v => v.tanggal_visite && v.tanggal_visite.startsWith(activeDate.substring(0, 7))); // show month
  }, [activeInput, visiteDetails]);

  // Mini Chart data based on indicatorHistory
  const chartData = useMemo(() => {
     let data = [...indicatorHistory].reverse(); // chronological
     return data.map(d => ({
        name: new Date(d.tanggal).toLocaleString('id-ID', { month: 'short', day: 'numeric' }),
        capaian: d.capaian,
        target: d.target,
        status: d.status
     }));
  }, [indicatorHistory]);

  const handleOpenDetail = async (indicator: any) => {
    setSelectedIndikatorDetail(indicator);
    setActiveHistoryIndex(0);
    
    // Check if it's visite docter
    if (indicator.name.toLowerCase().includes("visite")) {
       setIsDetailLoading(true);
       try {
         const { data, error } = await supabase.from("visite_dpjp").select("*").eq("indikator_id", indicator.id).order("tanggal_visite", { ascending: true });
         if (data) setVisiteDetails(data);
       } catch(e) {}
       setIsDetailLoading(false);
    }
  };

  // Display states
  const [appliedFilters, setAppliedFilters] = useState({ periode, bulan, triwulan, semester, tahun, kategori });

  const getMonths = () => {
    if (appliedFilters.periode === "Bulanan") {
      return [parseInt(appliedFilters.bulan)];
    }
    if (appliedFilters.periode === "Triwulan") {
      if (appliedFilters.triwulan === "1") return [0, 1, 2];
      if (appliedFilters.triwulan === "2") return [3, 4, 5];
      if (appliedFilters.triwulan === "3") return [6, 7, 8];
      if (appliedFilters.triwulan === "4") return [9, 10, 11];
    }
    if (appliedFilters.periode === "Semester") {
      if (appliedFilters.semester === "1") return [0, 1, 2, 3, 4, 5];
      if (appliedFilters.semester === "2") return [6, 7, 8, 9, 10, 11];
    }
    if (appliedFilters.periode === "Tahunan") {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }
    return [0, 1, 2];
  };

  const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const displayMonths = getMonths();

  const handleApplyFilter = () => {
    setAppliedFilters({ periode, bulan, triwulan, semester, tahun, kategori });
  };

  const handleResetFilter = () => {
    setPeriode("Triwulan");
    setBulan("0");
    setTriwulan("1");
    setSemester("1");
    setTahun(new Date().getFullYear().toString());
    setKategori("Mutu Keseluruhan");
    setAppliedFilters({ periode: "Triwulan", bulan: "0", triwulan: "1", semester: "1", tahun: new Date().getFullYear().toString(), kategori: "Mutu Keseluruhan" });
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("Laporan_Mutu_RSUD.pdf");
  };

  const getCellData = (indikatorId: string, monthIndex: number, year: string) => {
    const records = dataMutuList.filter(d => {
      const date = new Date(d.tanggal);
      return d.indikator_id === indikatorId && date.getMonth() === monthIndex && date.getFullYear().toString() === year;
    });

    if (records.length === 0) return "-";

    const avgCapaian = parseFloat((records.reduce((acc, curr) => acc + (curr.capaian || 0), 0) / records.length).toFixed(2));
    return isNaN(avgCapaian) ? "0.00%" : `${avgCapaian.toFixed(2)}%`;
  };

  // Group by Category
  const categories = ["INM", "IMP-RS"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 max-w-7xl mx-auto w-full p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-[#10a37f] tracking-tight">
              Laporan Mutu
            </h1>
          </div>
          <p className="text-gray-900 font-semibold text-[15px]">
            Rekapitulasi dan unduh laporan capaian indikator
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10a37f] text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold shadow-[0_4px_10px_-2px_rgba(16,185,129,0.3)]">
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#c2410c] text-white rounded-xl hover:bg-orange-800 transition-colors text-sm font-bold shadow-[0_4px_10px_-2px_rgba(194,65,12,0.3)]"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_4px_30px_-5px_rgba(0,0,0,0.05)] border border-gray-100 p-4 md:p-8 w-full overflow-hidden">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">

          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Periode</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={periode}
                onChange={e => setPeriode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="Bulanan">Bulanan</option>
                <option value="Triwulan">Triwulan</option>
                <option value="Semester">Semester</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {periode === "Bulanan" ? "Pilih Bulan" : 
               periode === "Triwulan" ? "Pilih Triwulan" : 
               periode === "Semester" ? "Pilih Semester" : "Pilih Tahun"}
            </label>
            {periode === "Bulanan" && (
              <select
                value={bulan}
                onChange={e => setBulan(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            )}
            {periode === "Triwulan" && (
              <select
                value={triwulan}
                onChange={e => setTriwulan(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="1">Triwulan 1 (Jan-Mar)</option>
                <option value="2">Triwulan 2 (Apr-Jun)</option>
                <option value="3">Triwulan 3 (Jul-Sep)</option>
                <option value="4">Triwulan 4 (Okt-Des)</option>
              </select>
            )}
            {periode === "Semester" && (
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="1">Semester 1 (Jan-Jun)</option>
                <option value="2">Semester 2 (Jul-Des)</option>
              </select>
            )}
            {periode === "Tahunan" && (
              <select
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            )}
          </div>
          {periode !== "Tahunan" && (
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tahun</label>
              <select
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kategori</label>
            <select
              value={kategori}
              onChange={e => setKategori(e.target.value)}
              className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="Mutu Keseluruhan">Mutu Keseluruhan</option>
              <option value="INM">INM</option>
              <option value="IMP-RS">IMP-RS</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button 
            onClick={handleApplyFilter}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#10a37f] text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-bold shadow-md hover:shadow-lg"
          >
            <CheckCircle2 size={18} /> Tampilkan Data
          </button>
          <button 
            onClick={handleResetFilter}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all text-sm font-bold border border-gray-200"
          >
            <RotateCcw size={18} /> Reset Filter
          </button>
        </div>

        {/* Table Area */}
        <div 
          className="border border-gray-200 rounded-[20px] overflow-x-auto bg-white w-full"
          ref={reportRef}
        >
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#10a37f] text-white">
                <th className="py-4 px-6 font-extrabold text-xs text-center border-r border-[#10a37f]/20 w-16">NO</th>
                <th className="py-4 px-6 font-extrabold text-xs tracking-wider uppercase">INDIKATOR</th>
                <th className="py-4 px-6 font-extrabold text-xs text-center tracking-wider uppercase border-l border-[#10a37f]/20">TARGET</th>
                {displayMonths.map(mIdx => (
                  <th key={mIdx} className="py-4 px-6 font-extrabold text-xs text-center tracking-wider uppercase border-l border-[#10a37f]/20">
                    {monthNames[mIdx]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const categoryIndicators = allIndicators.filter(i => i.category === cat);
                if (categoryIndicators.length === 0) return null;

                // If filter specific category
                if (appliedFilters.kategori !== "Mutu Keseluruhan" && appliedFilters.kategori !== cat) return null;

                return (
                  <React.Fragment key={cat}>
                    {/* Category Header */}
                    <tr className="bg-emerald-50/50">
                      <td colSpan={3 + displayMonths.length} className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-4 bg-[#10a37f] rounded-full"></div>
                          <span className="font-extrabold text-sm text-[#064e3b] tracking-wider uppercase">{cat}</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Indicators */}
                    {categoryIndicators.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors bg-white"
                      >
                        <td className="py-4 px-6 text-sm font-semibold text-gray-500 text-center">{idx + 1}</td>
                        <td 
                          className={`py-4 px-6 text-sm cursor-pointer transition-all duration-300 ${
                            selectedIndikatorDetail?.id === row.id 
                              ? "text-[#10a37f] font-bold" 
                              : "text-slate-600 font-medium hover:text-[#10a37f] hover:font-semibold"
                          }`}
                          onClick={() => handleOpenDetail(row)}
                        >
                          {row.name}
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-center text-sm font-semibold whitespace-nowrap">{row.formattedTarget}</td>
                        
                        {displayMonths.map(mIdx => {
                          const valStr = getCellData(row.id, mIdx, appliedFilters.tahun);
                          
                          let isTargetMet = false;
                          if (valStr !== "-") {
                            const numVal = parseFloat(valStr.replace('%', ''));
                            if (row.reverse) {
                                isTargetMet = numVal <= row.targetVal;
                            } else {
                                isTargetMet = numVal >= row.targetVal;
                            }
                          }
                          
                          return (
                            <td key={mIdx} className="py-4 px-6 text-center">
                              {valStr === "-" ? (
                                <span className="inline-block w-8 h-8 rounded-lg bg-gray-50 text-gray-400 font-bold leading-8 text-sm border border-gray-100 shadow-sm">-</span>
                              ) : (
                                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${
                                  isTargetMet ? 'bg-emerald-50 text-[#10a37f] border-emerald-100' : 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]'
                                }`}>
                                  {valStr}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- MODAL DETAIL RIWAYAT INPUT INDIKATOR --- */}
      {selectedIndikatorDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-7xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/50 flex items-center justify-center border border-emerald-200">
                  <BookOpen className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-tight">Detail Riwayat Input Indikator</h2>
                  <p className="text-xs font-semibold text-emerald-700/80">
                    {selectedIndikatorDetail.name} • {selectedIndikatorDetail.category}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIndikatorDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Period Selector of Input Records */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Periode Pengisian Terpilih</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Calendar size={16} className="text-[#10a37f]" />
                    <span>{activeInput ? new Date(activeInput.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
                  </div>
                </div>

                {indicatorHistory.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Pilih Riwayat Input:</label>
                    <select
                      value={activeHistoryIndex}
                      onChange={(e) => setActiveHistoryIndex(Number(e.target.value))}
                      className="px-4 py-2.5 text-xs font-black text-slate-700 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#10a37f] transition-all cursor-pointer shadow-xs min-w-[200px]"
                    >
                      {indicatorHistory.map((hist, i) => (
                        <option key={hist.id} value={i}>
                          {new Date(hist.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} - {hist.unit} ({formatNum(hist.capaian)}%)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Detail Data Table */}
              {activeInput ? (
                <div className="space-y-6">
                  {/* Specific Grids */}
                  {isDetailLoading ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 animate-pulse flex flex-col items-center justify-center gap-2">
                       <Activity className="animate-spin text-[#10a37f]" size={24} />
                       <p className="text-xs font-bold text-slate-500">Memuat rincian data...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={18} className="text-[#10a37f]" />
                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Rincian Lembar Observasi Data</h3>
                      </div>

                      {selectedIndikatorDetail.name.toLowerCase().includes("visite") ? (
                        <div className="bg-white border border-[#10a37f]/20 rounded-2xl overflow-hidden shadow-xs">
                          <div className="bg-emerald-50/55 px-4 py-3 border-b border-[#10a37f]/10 flex items-center justify-between">
                            <p className="text-[10px] font-black tracking-wider text-emerald-800 font-sans uppercase">TABEL PENGUMPULAN DATA - VISITE DPJP ({activeInput.unit})</p>
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-250/20 px-2.5 py-0.5 rounded-lg">Realtime Database</span>
                          </div>
                          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                              <thead className="sticky top-0 bg-slate-50/90 border-b border-gray-250/50 h-10 select-none">
                                <tr>
                                  <th className="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Visite</th>
                                  <th className="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[10px]">Nama Pasien No-RM</th>
                                  <th className="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[10px] text-center">≤ 14.00 (Tepat)</th>
                                  <th className="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[10px] text-center">&gt; 14.00 (Terlambat)</th>
                                  <th className="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[10px]">Dokter DPJP</th>
                                  <th className="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-[10px]">Keterangan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeVisiteFiltered.length > 0 ? activeVisiteFiltered.map((v, i) => (
                                  <tr key={v.id || i} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-600 font-semibold">{v.tanggal_visite && new Date(v.tanggal_visite).toLocaleDateString("id-ID")}</td>
                                    <td className="px-4 py-3 text-slate-800 font-bold">{v.nama_pasien}</td>
                                    <td className="px-4 py-3 text-center">
                                      {v.visite_sebelum_14 ? (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-150/40 text-emerald-800 text-xs font-black">✓</span>
                                      ) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {v.visite_setelah_14 ? (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-150/40 text-red-800 text-xs font-black">✗</span>
                                      ) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 font-bold">{v.nama_dokter}</td>
                                    <td className="px-4 py-3 text-slate-500 font-medium">{v.keterangan || "-"}</td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400 font-bold bg-slate-50/50">
                                      Tidak ada rincian data observasi di database.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : selectedIndikatorDetail.category === "IKP" ? (
                        <div className="bg-white border border-gray-205 rounded-2xl overflow-hidden shadow-xs flex flex-col md:flex-row">
                          <div className="bg-rose-50 px-5 py-5 md:w-52 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-rose-100/50 select-none">
                            <p className="text-[10px] font-black tracking-widest text-[#991b1b] uppercase">FORMAT INPUT IKP</p>
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md mt-1">Insiden Keselamatan</span>
                          </div>
                          <div className="flex-1 w-full overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-[#fffdfd] border-b border-gray-150 select-none">
                                <tr>
                                  <th className="px-5 py-3 font-black text-slate-500 text-center uppercase tracking-wider text-[10px]">KPC</th>
                                  <th className="px-5 py-3 font-black text-slate-500 text-center uppercase tracking-wider text-[10px]">KNC</th>
                                  <th className="px-5 py-3 font-black text-slate-500 text-center uppercase tracking-wider text-[10px]">KTC</th>
                                  <th className="px-5 py-3 font-black text-rose-600 text-center uppercase tracking-wider text-[10px]">KTD</th>
                                  <th className="px-5 py-3 font-black text-rose-600 text-center uppercase tracking-wider text-[10px]">Sentinel</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="hover:bg-slate-50/20">
                                  <td className="px-5 py-5 text-slate-800 font-black text-center text-xl bg-slate-50/40">{activeInput.kpc}</td>
                                  <td className="px-5 py-5 text-slate-800 font-black text-center text-xl">{activeInput.knc}</td>
                                  <td className="px-5 py-5 text-slate-800 font-black text-center text-xl bg-slate-50/40">{activeInput.ktc}</td>
                                  <td className="px-5 py-5 text-rose-600 font-black text-center text-xl">{activeInput.ktd}</td>
                                  <td className="px-5 py-5 text-rose-600 font-black text-center text-xl bg-slate-50/40">{activeInput.sentinel}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                          <div className="bg-[#fbFdfC] px-4 py-3 border-b border-gray-200/60 font-black text-[10px] text-slate-600 tracking-wider">
                            TABEL OBSERVASI INDIKATOR MUTU ({selectedIndikatorDetail.category})
                          </div>
                          <div className="w-full overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50/80 h-10 select-none">
                                <tr>
                                  <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase">Tanggal Input</th>
                                  <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase">Unit Penginput</th>
                                  <th className="px-5 py-3 font-bold text-emerald-600 text-right text-[10px] uppercase">
                                    {selectedIndikatorDetail.name.toLowerCase().includes("kebersihan tangan") ? "Patuh Kebersihan Tangan" : 
                                     selectedIndikatorDetail.name.toLowerCase().includes("apd") ? "Kepatuhan APD" : 
                                     selectedIndikatorDetail.name.toLowerCase().includes("identifikasi") ? "Teridentifikasi Patuh" : "Numerator (Pembilang)"}
                                  </th>
                                  <th className="px-5 py-3 font-bold text-indigo-600 text-right text-[10px] uppercase">
                                    {selectedIndikatorDetail.name.toLowerCase().includes("kebersihan tangan") ? "Total Peluang Observasi" :
                                     selectedIndikatorDetail.name.toLowerCase().includes("apd") ? "Total Observasi APD" :
                                     selectedIndikatorDetail.name.toLowerCase().includes("identifikasi") ? "Total Peluang Observasi" : "Denominator (Penyebut)"}
                                  </th>
                                  <th className="px-5 py-3 font-bold text-slate-500 text-center text-[10px] uppercase">Target</th>
                                  <th className="px-5 py-3 font-bold text-slate-600 text-right text-[10px] uppercase">Capaian Aktual</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="hover:bg-slate-50/40">
                                  <td className="px-5 py-5 text-slate-600 font-bold">{new Date(activeInput.tanggal).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}</td>
                                  <td className="px-5 py-5 text-slate-800 font-black">{activeInput.unit}</td>
                                  <td className="px-5 py-5 text-emerald-600 font-black text-right text-base">{formatNum(activeInput.numerator)}</td>
                                  <td className="px-5 py-5 text-indigo-600 font-black text-right text-base">{formatNum(activeInput.denominator)}</td>
                                  <td className="px-5 py-5 text-slate-800 font-bold text-center text-sm">{selectedProfileData?.target || activeInput.target}%</td>
                                  <td className="px-5 py-5 font-black text-[#10a37f] text-right text-base">{formatNum(activeInput.capaian)}%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Under table: Calculation summary */}
                  {selectedIndikatorDetail.category !== "IKP" && (
                    <div className="bg-[#fbFdfC] border border-[#10a37f]/20 rounded-3xl p-6 shadow-xs mt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Calculator size={16} className="text-[#10a37f]" />
                        <h4 className="text-xs font-black text-[#10a37f] uppercase tracking-wider">HASIL PERHITUNGAN CAPAIAN</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white border border-gray-150 flex flex-col justify-between shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Numerator</span>
                          <span className="text-xl font-black text-emerald-600 mt-2">{formatNum(activeInput.numerator)}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-150 flex flex-col justify-between shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Denominator</span>
                          <span className="text-xl font-black text-indigo-600 mt-2">{formatNum(activeInput.denominator)}</span>
                        </div>
                        
                        <div className="p-4 flex flex-col items-center justify-center bg-emerald-50/60 rounded-2xl border border-emerald-100">
                          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider font-sans">Persentase Capaian</span>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-[#10a37f]">{formatNum(activeInput.capaian)}%</span>
                            <span className="text-xs font-semibold text-slate-400">/ target {selectedProfileData?.target || activeInput.target}%</span>
                          </div>
                          <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                            activeInput.status === "Tercapai" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                          }`}>
                            {activeInput.status}
                          </span>
                        </div>
                      </div>

                      {activeInput.keterangan && (
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs font-medium text-slate-600 leading-relaxed">
                          <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">Keterangan / Analisis Capaian:</span>
                          {activeInput.keterangan}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-400">Belum ada data input pada filter periode yang terpilih.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

