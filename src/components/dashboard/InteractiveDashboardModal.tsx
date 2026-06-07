import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, FileText, Download, Target, AlertTriangle, ShieldAlert, ListTodo, TrendingUp, TrendingDown, Minus, CheckCircle, PieChart, BarChart2 } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PremiumModalProps {
  activeModal: "TERCAPAI" | "BELUM_TERCAPAI" | "IKP" | "ALL" | null;
  setActiveModal: (val: any) => void;
  inmTableData: any[];
  ikpDataRaw: any[];
  indicatorProfiles: any[];
  filteredDataMutu: any[];
  dataMutuList: any[];
  periodeText: string;
}

export default function InteractiveDashboardModal({
  activeModal,
  setActiveModal,
  inmTableData,
  ikpDataRaw,
  indicatorProfiles,
  filteredDataMutu,
  dataMutuList,
  periodeText
}: PremiumModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIkp, setSelectedIkp] = useState<any>(null);

  const cleanIkpData = useMemo(() => {
    return ikpDataRaw.map(item => {
      let parsed = {};
      if (typeof item.keterangan === "string" && item.keterangan.startsWith("{")) {
        try {
          parsed = JSON.parse(item.keterangan);
        } catch (e) {}
      }
      return {
        ...item,
        parsedData: parsed,
      };
    }).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [ikpDataRaw]);

  // Find minimum date in current filter to determine the previous period boundary
  const minDateInFilter = useMemo(() => {
    if (filteredDataMutu.length === 0) return 0;
    let min = new Date(filteredDataMutu[0].tanggal).getTime();
    for (const d of filteredDataMutu) {
      const t = new Date(d.tanggal).getTime();
      if (t < min) min = t;
    }
    return min;
  }, [filteredDataMutu]);

  // Enrich inmTableData with previous period logic
  const enrichedInmTableData = useMemo(() => {
    return inmTableData.map(item => {
      // Find all data for this indicator before the current period
      const previousEntries = dataMutuList.filter(
        d => d.indikator_id === item.id && new Date(d.tanggal).getTime() < minDateInFilter
      ).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      // Let's just grab the latest available entry before the current period as "previous period"
      let priorCapaian = 0;
      let hasPrior = false;
      if (previousEntries.length > 0) {
        priorCapaian = previousEntries[0].capaian || 0;
        hasPrior = true;
      }
      
      const capaian = Number(item.capaian) || 0;
      const target = Number(String(item.target).replace(/[^0-9.]/g, "")) || 80;
      const tdiff = (capaian - target).toFixed(1);

      return {
        ...item,
        capaianNum: capaian,
        targetNum: target,
        tdiff: Number(tdiff) > 0 ? `+${tdiff}` : tdiff,
        priorCapaian,
        hasPrior
      };
    });
  }, [inmTableData, dataMutuList, minDateInFilter]);

  // Aggregations
  const summaryTercapai = enrichedInmTableData.filter(i => i.status === "green");
  const summaryBelumTercapai = enrichedInmTableData.filter(i => i.status !== "green");

  const ikpSummary = {
    KPC: 0, KNC: 0, KTC: 0, KTD: 0, Sentinel: 0
  };
  cleanIkpData.forEach(d => {
    const jenis = d.kpc ? "KPC" : d.knc ? "KNC" : d.ktc ? "KTC" : d.ktd ? "KTD" : d.sentinel ? "Sentinel" : "Lainnya";
    if (ikpSummary[jenis as keyof typeof ikpSummary] !== undefined) {
      ikpSummary[jenis as keyof typeof ikpSummary]++;
    }
  });

  const ikpPieData = [
    { name: "KPC", value: ikpSummary.KPC, color: "#10a37f" },
    { name: "KNC", value: ikpSummary.KNC, color: "#3b82f6" },
    { name: "KTC", value: ikpSummary.KTC, color: "#eab308" },
    { name: "KTD", value: ikpSummary.KTD, color: "#f97316" },
    { name: "Sentinel", value: ikpSummary.Sentinel, color: "#ef4444" },
  ].filter(i => i.value > 0);

  const filterList = (list: any[], searchFields: string[]) => {
    return list.filter(item => {
      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      return searchFields.some(field => {
        const val = field.split('.').reduce((o, i) => o?.[i], item);
        return String(val || "").toLowerCase().includes(lowerQ);
      });
    });
  };

  const exportCSV = (filename: string, rows: object[]) => {
    if (rows.length === 0) return;
    const header = Object.keys(rows[0]).join(",");
    const csvData = [
      header,
      ...rows.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${periodeText.replace(/ /g, "_")}.csv`;
    a.click();
  };

  const getBadgeIkp = (jenis: string) => {
    switch (jenis) {
      case "KPC": return "bg-green-100 text-green-700 border-green-200";
      case "KNC": return "bg-blue-100 text-blue-700 border-blue-200";
      case "KTC": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "KTD": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Sentinel": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getThemeColors = () => {
    if (activeModal === "TERCAPAI") {
      return {
        headerBg: "bg-[#059669]",
        headerText: "text-white",
        hoverBg: "hover:bg-[#059669]/10"
      };
    } else if (activeModal === "BELUM_TERCAPAI") {
      return {
        headerBg: "bg-[#EF4444]",
        headerText: "text-white",
        hoverBg: "hover:bg-[#EF4444]/10"
      };
    } else if (activeModal === "IKP") {
      return {
        headerBg: "bg-[#3B82F6]",
        headerText: "text-white",
        hoverBg: "hover:bg-[#3B82F6]/10"
      };
    } else {
      return {
        headerBg: "bg-[#F97316]",
        headerText: "text-white",
        hoverBg: "hover:bg-[#F97316]/10"
      };
    }
  };

  const themeColors = getThemeColors();

  return (
    <AnimatePresence>
      {activeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex py-4 md:py-10 justify-center bg-black/20 backdrop-blur-[6px] overflow-y-auto w-full"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="m-auto bg-white/95 backdrop-blur-xl w-full max-w-[90vw] md:max-w-[80vw] h-auto min-h-[50vh] max-h-[90vh] flex flex-col md:rounded-[24px] shadow-2xl border border-white"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-5 md:px-8 flex justify-between items-center z-20 md:rounded-t-[24px] shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activeModal === "TERCAPAI" ? "bg-emerald-50 text-emerald-600" : activeModal === "BELUM_TERCAPAI" ? "bg-rose-50 text-rose-600" : activeModal === "IKP" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
                  {activeModal === "TERCAPAI" && <Target size={28} strokeWidth={2.5} />}
                  {activeModal === "BELUM_TERCAPAI" && <AlertTriangle size={28} strokeWidth={2.5} />}
                  {activeModal === "IKP" && <ShieldAlert size={28} strokeWidth={2.5} />}
                  {activeModal === "ALL" && <ListTodo size={28} strokeWidth={2.5} />}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">
                    {activeModal === "TERCAPAI" && "DETAIL PEMENUHAN TARGET INM"}
                    {activeModal === "BELUM_TERCAPAI" && "INDIKATOR BELUM TERCAPAI"}
                    {activeModal === "IKP" && "DETAIL LAPORAN INSIDEN KESELAMATAN PASIEN"}
                    {activeModal === "ALL" && "SELURUH INDIKATOR MUTU"}
                  </h2>
                  <p className="text-sm font-bold text-slate-500 mt-1 capitalize shadow-sm inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                    Periode: {periodeText}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Terakhir Diperbarui</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-1">{new Date().toLocaleString('id-ID', {day: 'numeric', month: 'short', year:'numeric', hour:'numeric', minute:'numeric', second:'numeric'})}</span>
                </div>
                <button className="p-3 font-bold text-slate-400 bg-white border border-gray-200 hover:text-rose-500 hover:border-rose-200 rounded-xl hover:bg-rose-50 transition-all duration-200 cursor-pointer active:scale-95" onClick={() => setActiveModal(null)}>
                  <X size={20} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col gap-8 bg-slate-50/50">
          
          {/* Main List */}
          <div className="flex-1 flex flex-col min-w-0">
             <div className="relative mb-6">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="text"
                 placeholder="Cari data..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-12 pr-4 py-3.5 border border-slate-200 shadow-sm rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
               />
             </div>

              <div className="bg-white border text-sm border-slate-200 shadow-sm rounded-2xl overflow-x-auto overflow-y-auto max-h-[60vh] flex-1">
               {(activeModal === "TERCAPAI" || activeModal === "BELUM_TERCAPAI" || activeModal === "ALL") && (
                 <table className="w-full text-left" style={{ whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", tableLayout: "auto" }}>
                    <thead className={`${themeColors.headerBg} ${themeColors.headerText} font-semibold hidden md:table-header-group text-[14px] h-[52px] sticky top-0 z-10 rounded-[12px]`}>
                      <tr>
                        <th className="px-6 py-0 rounded-tl-xl font-semibold min-w-[280px] lg:w-auto">Indikator</th>
                        <th className="px-6 py-0 text-center font-semibold min-w-[120px]">Kategori</th>
                        <th className="px-6 py-0 text-center font-semibold min-w-[180px]">Unit</th>
                        <th className="px-6 py-0 text-center font-semibold min-w-[120px]">Target</th>
                        <th className="px-6 py-0 text-center font-semibold min-w-[120px]">Capaian</th>
                        {activeModal === "BELUM_TERCAPAI" && (
                          <>
                            <th className="px-6 py-0 text-center font-semibold min-w-[120px]">Bulan Lalu</th>
                            <th className="px-6 py-0 text-center font-semibold min-w-[120px]">Trend</th>
                          </>
                        )}
                        <th className="px-6 py-0 text-center rounded-tr-xl font-semibold min-w-[140px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 flex flex-col md:table-row-group bg-white">
                       {filterList(
                         activeModal === "TERCAPAI" ? summaryTercapai : activeModal === "BELUM_TERCAPAI" ? summaryBelumTercapai : enrichedInmTableData, 
                         ['name', 'unit_id', 'category']
                       ).map((row, i) => {
                         let trendIcon = <Minus size={16} className="text-slate-400" />;
                         let trendColor = "text-slate-500 bg-slate-50";
                         const tdiff = row.capaianNum - row.priorCapaian;
                         if (row.hasPrior) {
                           if (tdiff > 0) {
                             trendIcon = <TrendingUp size={16} className="text-emerald-500" />;
                             trendColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                           } else if (tdiff < 0) {
                             trendIcon = <TrendingDown size={16} className="text-rose-500" />;
                             trendColor = "text-rose-700 bg-rose-50 border-rose-100";
                           }
                         }

                         return (
                           <tr key={i} className={`${themeColors.hoverBg} transition border-b border-slate-100 flex flex-col md:table-row p-4 md:p-0`}>
                              <td className="px-6 py-4 font-black text-slate-800">{row.name}</td>
                              <td className="px-6 md:py-4 text-slate-500 font-bold md:text-center text-xs md:text-sm">{row.category || "INM"}</td>
                              <td className="px-6 md:py-4 text-slate-600 md:text-center text-xs md:text-sm">{row.unit_id}</td>
                              <td className="px-6 md:py-4 text-slate-600 md:text-center flex justify-between md:table-cell"><span className="md:hidden font-bold">Target:</span> {row.target}</td>
                              <td className="px-6 md:py-4 font-bold md:text-center flex justify-between md:table-cell"><span className="md:hidden font-bold">Capaian:</span> {row.capaian}%</td>
                              
                              {activeModal === "BELUM_TERCAPAI" && (
                                <>
                                  <td className="px-6 md:py-4 text-slate-600 md:text-center flex justify-between md:table-cell">
                                    <span className="md:hidden font-bold">Bulan Lalu:</span> 
                                    {row.hasPrior ? `${row.priorCapaian}%` : "-"}
                                  </td>
                                  <td className="px-6 md:py-4 flex justify-between md:table-cell md:text-center">
                                    <span className="md:hidden font-bold">Trend:</span> 
                                    <div className="flex items-center justify-end md:justify-center gap-2">
                                      {row.hasPrior ? (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${trendColor}`}>
                                          {trendIcon} {tdiff > 0 ? '+' : ''}{tdiff.toFixed(1)}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-xs font-bold">-</span>
                                      )}
                                    </div>
                                  </td>
                                </>
                              )}

                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] uppercase font-black ${row.status === 'green' ? 'bg-[#DCFCE7] text-[#059669]' : row.status === 'orange' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                                  {row.status === 'green' ? 'Tercapai' : row.status === 'orange' ? 'Mendekati' : 'Tidak Tercapai'}
                                </span>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
               )}

               {activeModal === "IKP" && !selectedIkp && (
                 <table className="w-full text-left" style={{ whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", tableLayout: "auto" }}>
                    <thead className={`${themeColors.headerBg} ${themeColors.headerText} font-semibold hidden md:table-header-group text-[14px] h-[52px] sticky top-0 z-10 rounded-[12px]`}>
                      <tr>
                        <th className="px-6 py-0 rounded-tl-xl font-semibold min-w-[120px]">Tanggal</th>
                        <th className="px-6 py-0 font-semibold min-w-[120px]">Jenis</th>
                        <th className="px-6 py-0 font-semibold min-w-[180px]">Unit</th>
                        <th className="px-6 py-0 font-semibold min-w-[280px] lg:w-auto">Insiden</th>
                        <th className="px-6 py-0 text-center rounded-tr-xl font-semibold min-w-[120px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 flex flex-col md:table-row-group bg-white">
                       {filterList(cleanIkpData, ['tanggal', 'unit', 'keterangan', 'parsedData.statusLaporan', 'parsedData.tipeInsiden', 'parsedData.subTipeInsiden', 'parsedData.namaInsiden']).map((row, i) => {
                         const jenis = row.kpc ? "KPC" : row.knc ? "KNC" : row.ktc ? "KTC" : row.ktd ? "KTD" : row.sentinel ? "Sentinel" : "-";
                         const statusLaporan = row.parsedData?.statusLaporan || "Dilaporkan";
                         const insidenRaw = row.parsedData?.namaInsiden || row.parsedData?.subTipeInsiden || row.keterangan || "-";
                         // Avoid rendering pure json if it's stringified
                         const insidenString = typeof insidenRaw === 'object' ? JSON.stringify(insidenRaw) : insidenRaw;
                         const insidenText = insidenString.startsWith("{") ? "Data Laporan IKP Tercatat" : insidenString;

                         return (
                           <tr key={i} className={`${themeColors.hoverBg} transition cursor-pointer border-b border-slate-100 flex flex-col md:table-row p-4 md:p-0`} onClick={() => setSelectedIkp(row)}>
                              <td className="px-6 py-4 font-semibold text-slate-600">{new Date(row.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="px-6 md:py-4 font-black flex justify-between md:table-cell">
                                <span className="md:hidden font-bold">Jenis:</span>
                                <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] uppercase border ${getBadgeIkp(jenis)}`}>{jenis}</span>
                              </td>
                              <td className="px-6 md:py-4 text-slate-800 font-bold flex justify-between md:table-cell"><span className="md:hidden font-bold text-slate-500">Unit:</span> {row.unit}</td>
                              <td className="px-6 md:py-4 text-slate-500 flex justify-between md:table-cell"><span className="md:hidden font-bold text-slate-800">Insiden:</span> <span>{insidenText}</span></td>
                              <td className="px-6 py-4 text-center float-right md:float-none">
                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] uppercase font-black border ${statusLaporan === 'Diterima' ? 'bg-[#DCFCE7] text-[#059669] border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                  {statusLaporan}
                                </span>
                              </td>
                           </tr>
                         )
                       })}
                    </tbody>
                 </table>
               )}

               {/* IKP Detail View */}
               {activeModal === "IKP" && selectedIkp && (
                 <div className="p-6 bg-white animate-in zoom-in-95 duration-300">
                    <button onClick={() => setSelectedIkp(null)} className="mb-4 text-sm font-bold text-blue-600 hover:underline inline-block">&larr; Kembali ke daftar</button>
                    <div className="p-6 border border-slate-200 rounded-2xl space-y-6">
                       <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Dokumen Insiden Keselamatan Pasien</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                         <div>
                            <p className="text-slate-500 font-bold mb-1">Tanggal</p>
                            <p className="font-extrabold text-slate-800 text-lg bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{new Date(selectedIkp.tanggal).toLocaleDateString('id-ID')}</p>
                         </div>
                         <div>
                            <p className="text-slate-500 font-bold mb-1">Unit/Lokasi</p>
                            <p className="font-extrabold text-slate-800 text-lg bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{selectedIkp.unit}</p>
                         </div>
                         <div>
                            <p className="text-slate-500 font-bold mb-1">Status Laporan</p>
                            <p className="font-extrabold text-slate-800 text-lg bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-200">{selectedIkp.parsedData?.statusLaporan || "Dilaporkan"}</p>
                         </div>
                         <div>
                            <p className="text-slate-500 font-bold mb-1">Tipe Insiden</p>
                            <p className="font-extrabold text-slate-800 text-lg bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-200">{selectedIkp.parsedData?.tipeInsiden || (selectedIkp.kpc ? "KPC" : selectedIkp.knc ? "KNC" : selectedIkp.ktc ? "KTC" : selectedIkp.ktd ? "KTD" : selectedIkp.sentinel ? "Sentinel" : "-")}</p>
                         </div>
                       </div>
                       <div>
                         <p className="text-slate-500 font-bold mb-2">Sub Tipe Insiden / Kejadian</p>
                         <p className="font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 whitespace-pre-wrap">{selectedIkp.parsedData?.subTipeInsiden || selectedIkp.parsedData?.namaInsiden || (typeof selectedIkp.keterangan === 'string' && !selectedIkp.keterangan.startsWith('{') ? selectedIkp.keterangan : "Tidak ada detail")}</p>
                       </div>
                    </div>
                 </div>
               )}
             </div>

          </div>

          {/* Sidebar Summary */}
          <div className="w-full shrink-0 flex flex-col gap-4">
             {activeModal === "TERCAPAI" && (
               <>
                 <div className="bg-[#059669]/5 border border-[#059669]/20 p-6 rounded-2xl shadow-sm">
                   <h4 className="text-[#059669] font-black mb-4 uppercase tracking-wider text-xs">Summary Tercapai</h4>
                   <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                     <div className="h-[180px] w-[180px] shrink-0 relative flex items-center justify-center mx-auto md:mx-0">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsPieChart>
                           <Pie
                             data={[
                               { name: "Tercapai", value: summaryTercapai.length, color: "#059669" },
                               { name: "Belum", value: summaryBelumTercapai.length, color: "#cbd5e1" }
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={70}
                             outerRadius={90}
                             paddingAngle={2}
                             dataKey="value"
                             stroke="none"
                             animationDuration={300}
                           >
                             <Cell fill="#059669" />
                             <Cell fill="#cbd5e1" opacity={0.5} />
                           </Pie>
                         </RechartsPieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                         <motion.span key={summaryTercapai.length} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-3xl font-black text-[#059669]">{inmTableData.length > 0 ? ((summaryTercapai.length / inmTableData.length) * 100).toFixed(0) : 0}%</motion.span>
                         <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wide">Capaian</span>
                       </div>
                     </div>

                     <div className="flex-1 w-full space-y-3">
                       <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#059669]/10">
                         <span className="text-slate-500 font-bold text-xs">Total Indikator</span>
                         <motion.span key={inmTableData.length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-slate-800">{inmTableData.length}</motion.span>
                       </div>
                       <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#059669]/10">
                         <span className="text-slate-500 font-bold text-xs"><span className="inline-block w-2 h-2 rounded-full bg-[#059669] mr-2"></span>Tercapai</span>
                         <motion.span key={summaryTercapai.length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-[#059669]">{summaryTercapai.length}</motion.span>
                       </div>
                       <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#059669]/10">
                         <span className="text-slate-500 font-bold text-xs"><span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-2"></span>Belum Tercapai</span>
                         <motion.span key={summaryBelumTercapai.length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-slate-600">{summaryBelumTercapai.length}</motion.span>
                       </div>
                     </div>
                   </div>
                 </div>
               </>
             )}

             {activeModal === "BELUM_TERCAPAI" && (
               <>
                 <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 p-6 rounded-2xl shadow-sm">
                   <h4 className="text-[#EF4444] font-black mb-4 uppercase tracking-wider text-xs">Analisis Capaian</h4>
                   <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                     <div className="h-[180px] w-[180px] shrink-0 relative flex items-center justify-center mx-auto md:mx-0">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsPieChart>
                           <Pie
                             data={[
                               { name: "Belum Tercapai", value: summaryBelumTercapai.length, color: "#EF4444" },
                               { name: "Tercapai", value: summaryTercapai.length, color: "#cbd5e1" }
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={70}
                             outerRadius={90}
                             paddingAngle={2}
                             dataKey="value"
                             stroke="none"
                             animationDuration={300}
                           >
                             <Cell fill="#EF4444" />
                             <Cell fill="#cbd5e1" opacity={0.5} />
                           </Pie>
                         </RechartsPieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                         <motion.span key={summaryBelumTercapai.length} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-3xl font-black text-[#EF4444]">{inmTableData.length > 0 ? ((summaryBelumTercapai.length / inmTableData.length) * 100).toFixed(0) : 0}%</motion.span>
                         <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wide">Belum Tercapai</span>
                       </div>
                     </div>

                     <div className="flex-1 w-full space-y-4">
                       <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                         Terdapat <strong className="text-[#EF4444] text-base">{summaryBelumTercapai.length}</strong> indikator yang belum mencapai target mutu pada {periodeText}.
                         {summaryBelumTercapai.filter(i => i.hasPrior && i.capaianNum > i.priorCapaian).length > 0 && (
                           <> <strong className="text-emerald-600">{summaryBelumTercapai.filter(i => i.hasPrior && i.capaianNum > i.priorCapaian).length}</strong> indikator menunjukkan peningkatan dibanding periode sebelumnya. </>
                         )}
                         {summaryBelumTercapai.filter(i => i.hasPrior && i.capaianNum < i.priorCapaian).length > 0 && (
                           <> <strong className="text-rose-600">{summaryBelumTercapai.filter(i => i.hasPrior && i.capaianNum < i.priorCapaian).length}</strong> indikator mengalami penurunan capaian. </>
                         )} 
                         {summaryBelumTercapai.filter(i => i.hasPrior && i.capaianNum === i.priorCapaian).length > 0 && (
                           <> <strong className="text-orange-600">{summaryBelumTercapai.filter(i => i.hasPrior && i.capaianNum === i.priorCapaian).length}</strong> indikator masih berada di bawah standar mutu (stagnan). </>
                         )}
                       </p>
                       <div className="h-px bg-rose-200/50 my-2"></div>
                       <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#EF4444]/10">
                         <span className="text-slate-500 font-bold text-xs"><span className="inline-block w-2 h-2 rounded-full bg-[#EF4444] mr-2"></span>Belum Tercapai</span>
                         <motion.span key={summaryBelumTercapai.length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-[#EF4444]">{summaryBelumTercapai.length}</motion.span>
                       </div>
                     </div>
                   </div>
                 </div>
               </>
             )}

             {activeModal === "IKP" && !selectedIkp && (
               <>
                 <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 p-6 rounded-2xl shadow-sm">
                   <h4 className="text-[#3B82F6] font-black mb-4 uppercase tracking-wider text-xs">Distribusi Tipe Insiden</h4>
                   <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                     <div className="h-[180px] w-[180px] shrink-0 relative flex items-center justify-center mx-auto md:mx-0">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsPieChart>
                           <Pie
                             data={ikpPieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={70}
                             outerRadius={90}
                             paddingAngle={4}
                             dataKey="value"
                             stroke="none"
                             animationDuration={300}
                           >
                             {ikpPieData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                           </Pie>
                           <Tooltip formatter={(value) => [`${value} Laporan`, "Jumlah"]} />
                         </RechartsPieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                         <motion.span key={ikpDataRaw.length} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-3xl font-black text-[#3B82F6]">{ikpDataRaw.length}</motion.span>
                         <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wide">Laporan</span>
                       </div>
                     </div>
                     <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-3 gap-3">
                       <div className="flex justify-between items-center text-sm bg-white border border-[#3B82F6]/10 p-3 rounded-xl shadow-sm"><span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-[#10a37f]"></span>KPC</span><motion.span key={ikpSummary.KPC} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black px-2">{ikpSummary.KPC}</motion.span></div>
                       <div className="flex justify-between items-center text-sm bg-white border border-[#3B82F6]/10 p-3 rounded-xl shadow-sm"><span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>KNC</span><motion.span key={ikpSummary.KNC} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black px-2">{ikpSummary.KNC}</motion.span></div>
                       <div className="flex justify-between items-center text-sm bg-white border border-[#3B82F6]/10 p-3 rounded-xl shadow-sm"><span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-[#eab308]"></span>KTC</span><motion.span key={ikpSummary.KTC} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black px-2">{ikpSummary.KTC}</motion.span></div>
                       <div className="flex justify-between items-center text-sm bg-white border border-[#3B82F6]/10 p-3 rounded-xl shadow-sm"><span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-[#f97316]"></span>KTD</span><motion.span key={ikpSummary.KTD} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black px-2">{ikpSummary.KTD}</motion.span></div>
                       <div className="flex justify-between items-center text-sm bg-white border border-[#3B82F6]/10 p-3 rounded-xl shadow-sm col-span-2 lg:col-span-1"><span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>Sentinel</span><motion.span key={ikpSummary.Sentinel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black px-2">{ikpSummary.Sentinel}</motion.span></div>
                     </div>
                   </div>
                 </div>
               </>
             )}

             {activeModal === "ALL" && (
                <div className="bg-[#F97316]/5 border border-[#F97316]/20 p-6 rounded-2xl shadow-sm">
                   <h4 className="text-[#F97316] font-black mb-4 uppercase tracking-wider text-xs">Status Indikator Aktif</h4>
                   
                   <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                     <div className="h-[180px] w-[180px] shrink-0 relative flex items-center justify-center mx-auto md:mx-0">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsPieChart>
                           <Pie
                             data={[
                               { name: "Aktif", value: inmTableData.length, color: "#F97316" }
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={70}
                             outerRadius={90}
                             paddingAngle={0}
                             dataKey="value"
                             stroke="none"
                             animationDuration={300}
                           >
                             <Cell fill="#F97316" />
                           </Pie>
                         </RechartsPieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                         <motion.span key={inmTableData.length} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-3xl font-black text-[#F97316]">{inmTableData.length}</motion.span>
                         <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wide">Aktif</span>
                       </div>
                     </div>

                     <div className="flex-1 w-full">
                       <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#F97316]/10">
                           <span className="text-slate-500 font-bold text-xs">Total Aktif</span>
                           <motion.span key={inmTableData.length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-[#F97316]">{inmTableData.length}</motion.span>
                         </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#F97316]/10">
                           <span className="text-slate-500 font-bold text-xs">INM</span>
                           <motion.span key={enrichedInmTableData.filter(i => !i.category || i.category === 'INM').length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-slate-700">{enrichedInmTableData.filter(i => !i.category || i.category === 'INM').length}</motion.span>
                         </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#F97316]/10">
                           <span className="text-slate-500 font-bold text-xs">IMP-RS</span>
                           <motion.span key={enrichedInmTableData.filter(i => i.category === 'IMP-RS').length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-slate-700">{enrichedInmTableData.filter(i => i.category === 'IMP-RS').length}</motion.span>
                         </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#F97316]/10">
                           <span className="text-slate-500 font-bold text-xs">IMP-Unit</span>
                           <motion.span key={enrichedInmTableData.filter(i => i.category === 'IMP-Unit').length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-slate-700">{enrichedInmTableData.filter(i => i.category === 'IMP-Unit').length}</motion.span>
                         </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#F97316]/10 col-span-2">
                           <span className="text-slate-500 font-bold text-xs">SPM</span>
                           <motion.span key={enrichedInmTableData.filter(i => i.category === 'SPM').length} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-black text-slate-700">{enrichedInmTableData.filter(i => i.category === 'SPM').length}</motion.span>
                         </div>
                       </div>
                       
                       <div className="pt-3 border-t border-[#F97316]/20 flex justify-between text-xs font-bold text-[#F97316]">
                         <span>Indikator Nonaktif: <strong className="text-orange-900">0</strong></span>
                         <span>Draft: <strong className="text-orange-900">0</strong></span>
                       </div>
                     </div>
                   </div>
                </div>
             )}

          </div>

        </div>
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
