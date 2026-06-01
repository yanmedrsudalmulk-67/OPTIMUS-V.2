import React, { useState, useRef, useMemo, useEffect } from "react";
import { Download, FileText, Printer, FileSpreadsheet, RotateCcw, Filter, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
    return indicatorProfiles.map(p => ({
      id: p.id,
      category: p.category,
      name: p.indicator_title,
      target: p.target,
      formattedTarget: formatTarget(p.target, p.measurement_unit, p.reverse),
      targetVal: parseFloat(String(p.target).replace(/[^0-9.]/g, '')) || 80,
      reverse: p.reverse
    }));
  }, [indicatorProfiles]);

  const [periode, setPeriode] = useState("Triwulan");
  const [bulan, setBulan] = useState("0");
  const [triwulan, setTriwulan] = useState("1");
  const [semester, setSemester] = useState("1");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [kategori, setKategori] = useState("Mutu Keseluruhan");

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
                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{row.name}</td>
                        <td className="py-4 px-6 text-[#10a37f] text-center text-sm font-black whitespace-nowrap">{row.formattedTarget}</td>
                        
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
    </div>
  );
}

