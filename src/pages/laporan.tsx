import React, { useState, useRef, useMemo } from "react";
import { Download, FileText, Printer, FileSpreadsheet, RotateCcw, Filter, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useStore, DataMutuPayload } from "@/store/useStore";
import { formatTarget } from "../../lib/utils";

export default function Laporan() {
  const dataMutuList = useStore((state) => state.dataMutuList);
  const indicatorProfiles = useStore((state) => state.indicatorProfiles);
  const reportRef = useRef<HTMLDivElement>(null);

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
  const [triwulan, setTriwulan] = useState("Triwulan 1 (Jan-Mar)");
  const [tahun, setTahun] = useState("2026");
  const [kategori, setKategori] = useState("Mutu Keseluruhan");

  // Display states
  const [appliedFilters, setAppliedFilters] = useState({ periode, triwulan, tahun, kategori });

  const getMonths = () => {
    if (appliedFilters.periode === "Triwulan") {
      if (appliedFilters.triwulan.includes("1")) return [0, 1, 2];
      if (appliedFilters.triwulan.includes("2")) return [3, 4, 5];
      if (appliedFilters.triwulan.includes("3")) return [6, 7, 8];
      if (appliedFilters.triwulan.includes("4")) return [9, 10, 11];
    }
    // Simplification for demo: default to Jan, Feb, Mar
    return [0, 1, 2];
  };

  const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const displayMonths = getMonths();

  const handleApplyFilter = () => {
    setAppliedFilters({ periode, triwulan, tahun, kategori });
  };

  const handleResetFilter = () => {
    setPeriode("Triwulan");
    setTriwulan("Triwulan 1 (Jan-Mar)");
    setTahun("2026");
    setKategori("Mutu Keseluruhan");
    setAppliedFilters({ periode: "Triwulan", triwulan: "Triwulan 1 (Jan-Mar)", tahun: "2026", kategori: "Mutu Keseluruhan" });
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 max-w-7xl mx-auto">
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

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#10a37f] text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold shadow-[0_4px_10px_-2px_rgba(16,185,129,0.3)]">
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c2410c] text-white rounded-xl hover:bg-orange-800 transition-colors text-sm font-bold shadow-[0_4px_10px_-2px_rgba(194,65,12,0.3)]"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_4px_30px_-5px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Periode</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={periode}
                onChange={e => setPeriode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="Triwulan">Triwulan</option>
                <option value="Semester">Semester</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Pilih Triwulan</label>
            <select
              value={triwulan}
              onChange={e => setTriwulan(e.target.value)}
              className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="Triwulan 1 (Jan-Mar)">Triwulan 1 (Jan-Mar)</option>
              <option value="Triwulan 2 (Apr-Jun)">Triwulan 2 (Apr-Jun)</option>
              <option value="Triwulan 3 (Jul-Sep)">Triwulan 3 (Jul-Sep)</option>
              <option value="Triwulan 4 (Okt-Des)">Triwulan 4 (Okt-Des)</option>
            </select>
          </div>
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
          className="border border-gray-200 rounded-[20px] overflow-x-auto bg-white"
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

