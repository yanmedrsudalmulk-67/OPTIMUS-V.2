import React, { useState, useMemo, useEffect } from "react";
import {
  Target,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  Activity,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  HelpCircle,
  TrendingDown,
  PlusCircle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { formatTarget } from "../../lib/utils";
import Link from "next/link";

export default function Dashboard() {
  // Redirect to welcome screen on very first load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("welcome_seen");
      if (seen !== "true") {
        window.location.replace("/");
      }
    }
  }, []);

  const dataMutuList = useStore((state) => state.dataMutuList);
  const addDataMutu = useStore((state) => state.addDataMutu);
  const indicatorProfiles = useStore((state) => state.indicatorProfiles);

  const [selectedIndikatorId, setSelectedIndikatorId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  const activeIndikatorId = selectedIndikatorId || (indicatorProfiles[0]?.id || "");

  // Fetch inputs from Supabase on mount to show correct user inputs in real-time
  useEffect(() => {
    const fetchSupabaseInputs = async () => {
      try {
        const { data, error } = await supabase
          .from("indicator_inputs")
          .select("*")
          .order("created_at", { ascending: true });

        if (data && data.length > 0) {
          data.forEach((dbInput: any) => {
            const exists = dataMutuList.some((d) => d.id === dbInput.id);
            if (!exists) {
              const matchedProfile = indicatorProfiles.find((p) => p.id === dbInput.indicator_id);
              const persentase = dbInput.achievement_percentage || 0;
              const target = dbInput.target || matchedProfile?.target || 80;
              
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

              addDataMutu({
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
                status: dbInput.category_id === "IKP" ? "N/A" : computedStatus,
                keterangan: dbInput.notes || "",
                kpc: dbInput.category_id === "IKP" ? (dbInput.numerator_value || 0) : undefined,
                knc: dbInput.category_id === "IKP" ? (dbInput.denominator_value || 0) : undefined,
                ktc: dbInput.category_id === "IKP" ? 0 : undefined,
                ktd: dbInput.category_id === "IKP" ? 0 : undefined,
                sentinel: dbInput.category_id === "IKP" ? 0 : undefined,
              });
            }
          });
        }
      } catch (err) {
        console.warn("Supabase load skipped or delayed, relying on client memory", err);
      }
    };
    fetchSupabaseInputs();

    // Set up Realtime listener for indicator inputs
    const inputsChannel = supabase
      .channel("inputs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "indicator_inputs" },
        () => {
          fetchSupabaseInputs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inputsChannel);
    };
  }, [indicatorProfiles, addDataMutu, dataMutuList]);

  // Map 13 indicators table data based on dynamic input records
  const inmTableData = indicatorProfiles.map((item, index) => {
    const matchingEntries = dataMutuList.filter(
      (d) => d.indikator_id === item.id
    );
    let capaian = "0%";
    let status = "red";

    if (matchingEntries.length > 0) {
      const latest = matchingEntries[matchingEntries.length - 1];
      capaian = `${latest.capaian}%`;
      status =
        latest.status === "Tercapai"
          ? "green"
          : latest.status === "Mendekati"
          ? "orange"
          : "red";
    }

    const formattedTarget = formatTarget(item.target, item.measurement_unit, item.reverse);

    return {
      no: index + 1,
      id: item.id,
      name: item.indicator_title,
      target: formattedTarget,
      targetNum: item.target,
      capaian,
      status,
    };
  });

  const tercapaiCount = inmTableData.filter((i) => i.status === "green").length;
  const belumTercapaiCount = inmTableData.filter(
    (i) => i.status === "red" || i.status === "orange"
  ).length;

  // IKP (Insiden Keselamatan Pasien) Aggregation Logic
  const ikpDataRaw = dataMutuList.filter((d) => d.kategori === "IKP");
  const totalIkp = {
    KPC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.kpc) || 0), 0),
    KNC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.knc) || 0), 0),
    KTC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktc) || 0), 0),
    KTD: ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktd) || 0), 0),
    Sentinel: ikpDataRaw.reduce((sum, item) => sum + (Number(item.sentinel) || 0), 0),
  };

  // Convert to clean list of records with count > 0 for Pie Chart representation (Diagram Lingkaran saja)
  const ikpPieData = [
    { name: "KPC", value: totalIkp.KPC, color: "#10a37f" },
    { name: "KNC", value: totalIkp.KNC, color: "#3b82f6" },
    { name: "KTC", value: totalIkp.KTC, color: "#eab308" },
    { name: "KTD", value: totalIkp.KTD, color: "#f97316" },
    { name: "Sentinel", value: totalIkp.Sentinel, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  const totalIncidentCount = ikpPieData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Find detail setup of chosen indicator
  const selectedIndikatorProfile = useMemo(() => {
    return indicatorProfiles.find((p) => p.id === activeIndikatorId);
  }, [indicatorProfiles, activeIndikatorId]);

  // Compute real-time monthly performance for chosen indicator based strictly on standard input records
  const selectedChartData = useMemo(() => {
    const matching = dataMutuList.filter(
      (d) => d.indikator_id === activeIndikatorId
    );
    if (matching.length === 0) return [];

    // Sort chronologically based on input date
    const sorted = [...matching].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    // Group actual records by Month & Year to yield authentic progress statistics without dummy data
    const monthlyGroups: {
      [key: string]: { totalCapaian: number; count: number; target: number };
    } = {};
    sorted.forEach((item) => {
      const d = new Date(item.tanggal);
      const mLabel =
        d.toLocaleString("id-ID", { month: "long" }) + " " + d.getFullYear();
      if (!monthlyGroups[mLabel]) {
        const rawTarget = item.target || selectedIndikatorProfile?.target || 80;
        const numTarget = parseFloat(String(rawTarget).replace(/[^0-9.]/g, '')) || 80;
        monthlyGroups[mLabel] = {
          totalCapaian: 0,
          count: 0,
          target: numTarget,
        };
      }
      monthlyGroups[mLabel].totalCapaian += item.capaian || 0;
      monthlyGroups[mLabel].count += 1;
    });

    return Object.entries(monthlyGroups).map(([month, val]) => {
      const cap = parseFloat((val.totalCapaian / val.count).toFixed(2));
      return {
        name: month,
        Capaian: isNaN(cap) ? 0 : cap,
        Target: val.target,
      };
    });
  }, [dataMutuList, activeIndikatorId, selectedIndikatorProfile]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-4">
        <div>
          <div className="flex items-start md:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#10a37f] tracking-tight leading-tight">
              Dashboard Mutu Rumah Sakit
            </h1>
          </div>
          <p className="text-gray-900 mt-2 text-[9px] sm:text-[10px] md:text-sm font-semibold truncate leading-relaxed max-w-[280px] sm:max-w-full">
            Pemantauan Indikator Mutu & Keselamatan Pasien UOBK RSUD AL-MULK
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs font-bold text-gray-700 shadow-sm cursor-pointer">
            <option>Bulanan</option>
            <option>Triwulan</option>
            <option>Tahunan</option>
          </select>
          <select
            defaultValue="April"
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs font-bold text-gray-700 shadow-sm cursor-pointer"
          >
            <option>Januari</option>
            <option>Februari</option>
            <option>Maret</option>
            <option value="April">April</option>
            <option>Mei</option>
            <option>Juni</option>
          </select>
          <select
            defaultValue="2026"
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs font-bold text-gray-700 shadow-sm cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Pemenuhan Target INM */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-start gap-1.5 md:gap-4">
            <div className="p-1.5 md:p-3 rounded-xl bg-orange-50 text-orange-500 w-fit">
              <Target className="h-4 w-4 md:h-[26px] md:w-[26px]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] md:text-[13px] font-bold text-gray-500 mb-0.5 md:mb-1 leading-tight">
                Pemenuhan Target INM
              </p>
              <h3 className="text-lg md:text-3xl font-black text-gray-900 leading-none">
                {tercapaiCount}
                <span className="text-xs md:text-xl text-gray-400"> / 13</span>
              </h3>
            </div>
          </div>
          <div className="mt-2 md:mt-5 pt-1.5 md:pt-4 border-t border-gray-100/50">
            <span className="text-[8px] md:text-xs font-bold text-emerald-600 tracking-wide flex items-center gap-1 leading-tight">
              {((tercapaiCount / 13) * 100).toFixed(1)}% Indikator Tercapai
            </span>
          </div>
        </div>

        {/* Card 2: Indikator Belum Tercapai */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-start gap-1.5 md:gap-4">
            <div className="p-1.5 md:p-3 rounded-xl bg-red-50 text-red-500 w-fit">
              <AlertTriangle className="h-4 w-4 md:h-[26px] md:w-[26px]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] md:text-[13px] font-bold text-gray-500 mb-0.5 md:mb-1 leading-tight">
                Indikator Belum Tercapai
              </p>
              <h3 className="text-lg md:text-3xl font-black text-gray-900 leading-none">
                {belumTercapaiCount}
              </h3>
            </div>
          </div>
          <div className="mt-2 md:mt-5 pt-1.5 md:pt-4 border-t border-gray-100/50">
            <div className="text-[8px] md:text-xs font-bold text-red-500 flex items-center gap-1 tracking-wide leading-tight break-words">
              Perlu perbaikan mutu
            </div>
          </div>
        </div>

        {/* Card 3: Kejadian IKP Tercatat */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-start gap-1.5 md:gap-4">
            <div className="p-1.5 md:p-3 rounded-xl bg-blue-50 text-blue-500 w-fit">
              <ShieldAlert className="h-4 w-4 md:h-[26px] md:w-[26px]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] md:text-[13px] font-bold text-gray-500 mb-0.5 md:mb-1 leading-tight">
                Kejadian IKP Tercatat
              </p>
              <h3 className="text-lg md:text-3xl font-black text-gray-900 leading-none">
                {totalIncidentCount}{" "}
                <span className="text-[9px] md:text-sm text-gray-400 font-bold">Laporan</span>
              </h3>
            </div>
          </div>
          <div className="mt-2 md:mt-5 pt-1.5 md:pt-4 border-t border-gray-100/50">
            <span className="text-[8px] md:text-xs font-bold text-slate-500 tracking-wide leading-tight break-words">
              Jumlah Kejadian Nyaris/Cidera
            </span>
          </div>
        </div>

        {/* Card 4: Total Indikator */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-start gap-1.5 md:gap-4">
            <div className="p-1.5 md:p-3 rounded-xl bg-teal-50 text-teal-650 w-fit">
              <ListTodo className="h-4 w-4 md:h-[26px] md:w-[26px]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] md:text-[13px] font-bold text-gray-500 mb-0.5 md:mb-1 leading-tight">
                Total Kamar Indikator
              </p>
              <h3 className="text-lg md:text-3xl font-black text-gray-900 leading-none">
                {indicatorProfiles.length}
              </h3>
            </div>
          </div>
          <div className="mt-2 md:mt-5 pt-1.5 md:pt-4 border-t border-gray-100/50 flex flex-wrap md:flex-nowrap items-center gap-1 md:gap-1.5 text-[8px] md:text-xs font-bold text-emerald-600 leading-tight">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Berjalan Aktif
          </div>
        </div>
      </div>

      {/* 1. 13 Indikator Nasional Mutu (INM) Table */}
      <div className="bg-emerald-50/20 rounded-2xl md:rounded-[32px] p-4 md:p-6 lg:p-8 border border-emerald-50 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-3 md:gap-4 md:px-2">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-emerald-950 tracking-tight leading-tight">
              13 Indikator Nasional Mutu (INM)
            </h2>
            <p className="text-[7.5px] sm:text-[9px] md:text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider leading-relaxed truncate max-w-[280px] sm:max-w-[400px] md:max-w-full">
              Status Capaian Berdasarkan Standar Pelayanan Rumah Sakit
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-5 text-[9px] md:text-xs font-bold text-gray-600">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-xs shrink-0" />
              <span>Tercapai</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-400 shadow-xs shrink-0" />
              <span>Mendekati</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 shadow-xs shrink-0" />
              <span>Tidak Tercapai</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden md:overflow-x-auto rounded-xl md:rounded-[20px] shadow-sm border border-emerald-50 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-0">
              <thead>
                <tr className="bg-[#10a37f] text-white">
                  <th className="py-2 px-1.5 md:py-4 md:px-8 font-black text-[8px] md:text-xs border-r border-[#10a37f]/20 w-6 md:w-16 text-center">
                    NO
                  </th>
                  <th className="py-2 px-2 md:py-4 md:px-6 font-black text-[8px] md:text-xs uppercase tracking-wider">
                    Indikator Mutu
                  </th>
                  <th className="py-2 px-1.5 md:py-4 md:px-6 font-black text-[8px] md:text-xs text-center uppercase tracking-wider w-12 md:w-32">
                    Target
                  </th>
                  <th className="py-2 px-1.5 md:py-4 md:px-8 font-black text-[8px] md:text-xs text-center uppercase tracking-wider w-14 md:w-32">
                    Capaian
                  </th>
                </tr>
              </thead>
              <tbody>
                {inmTableData.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-50 hover:bg-emerald-50/45 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#fafdfc]"
                    }`}
                  >
                    <td className="py-2 px-1.5 md:py-4 md:px-8 text-[8px] md:text-sm font-bold text-gray-500 text-center border-r border-gray-50">
                      {item.no}
                    </td>
                    <td className="py-2 px-2 md:py-4 md:px-6 text-[8px] md:text-sm font-extrabold text-gray-800 leading-snug break-words max-w-[120px] md:max-w-none">
                      {item.name}
                    </td>
                    <td className="py-2 px-1.5 md:py-4 md:px-6 text-[8px] md:text-sm font-black text-emerald-950 text-center">
                      {item.target}
                    </td>
                    <td className="py-2 px-1 md:py-4 md:px-8 text-center">
                      <span
                        className={`inline-block px-1 md:px-4 py-0.5 md:py-1.5 rounded-full text-[7px] md:text-xs font-black whitespace-nowrap border min-w-[40px] md:min-w-[75px] text-center ${
                          item.capaian === "0%"
                            ? "bg-slate-50 text-slate-400 border-slate-100"
                            : item.status === "red"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : item.status === "orange"
                            ? "bg-orange-50 text-orange-600 border-orange-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}
                      >
                        {item.capaian}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. INM Real-time Performance Interactive Chart (Diagram Batang & Line Bar) */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 lg:p-8 border border-white/60 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.02)] space-y-4 md:space-y-6 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="text-[#10a37f] h-[18px] w-[18px] md:h-5 md:w-5" />
              <h3 className="text-sm md:text-xl font-extrabold text-emerald-950 tracking-tight leading-tight">
                Tren Capaian Target INM Terpilih
              </h3>
            </div>
            <p className="text-gray-400 text-[9px] md:text-xs font-semibold uppercase tracking-wider leading-relaxed">
              Pilih indikator di kanan untuk menampilkan diagram batang & garis secara realtime dari data input
            </p>
          </div>

          {/* Interactive Selection filter - Professional Searchable Dropdown */}
          <div className="relative w-full md:w-96 select-none z-30">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#10a37f]/30 hover:border-[#10a37f] rounded-xl outline-none focus:ring-2 focus:ring-[#10a37f] text-xs font-extrabold text-gray-700 shadow-sm transition-all duration-300 cursor-pointer"
            >
              <span className="truncate pr-2">
                {selectedIndikatorProfile?.indicator_title || "Pilih Indikator Mutu"}
              </span>
              <ChevronRight
                size={16}
                className={`text-[#10a37f] transition-transform duration-300 transform ${
                  isDropdownOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in duration-200">
                <div className="p-2 border-b border-gray-100 bg-slate-50">
                  <input
                    type="text"
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    placeholder="Cari nama indikator..."
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-250 rounded-lg outline-none focus:ring-2 focus:ring-[#10a37f] transition-all bg-white text-gray-700"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
                  {indicatorProfiles.filter(p => !dropdownSearch || p.indicator_title.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400 font-bold">
                      Tidak ada hasil ditemukan
                    </div>
                  ) : (
                    indicatorProfiles
                      .filter(p => !dropdownSearch || p.indicator_title.toLowerCase().includes(dropdownSearch.toLowerCase()))
                      .map((p) => {
                        const isSelected = p.id === activeIndikatorId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedIndikatorId(p.id);
                              setIsDropdownOpen(false);
                              setDropdownSearch("");
                            }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-emerald-50/50 flex items-center justify-between ${
                              isSelected
                                ? "bg-emerald-50/70 text-[#10a37f]"
                                : "text-gray-700"
                            }`}
                          >
                            <span className="truncate leading-tight block pr-2">{p.indicator_title}</span>
                            {isSelected && (
                              <CheckCircle2 size={14} className="text-[#10a37f] shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50/50 p-2.5 md:p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          <div>
            <span className="text-[9px] md:text-[10px] font-black text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2 py-0.5 md:px-2.5 md:py-1 rounded">
              Pencapaian Indikator Aktif
            </span>
            <h4 className="text-[11px] md:text-xs font-bold text-emerald-950 mt-1 md:mt-1.5 leading-snug">
              {selectedIndikatorProfile?.indicator_title}
            </h4>
          </div>
          <div className="flex items-center justify-between md:justify-start gap-2 whitespace-nowrap mt-1 md:mt-0">
            <span className="text-[10px] md:text-xs font-bold text-gray-500">Target Sasaran:</span>
            <span className="text-[10px] md:text-xs font-black text-teal-850 bg-teal-50 border border-teal-100 px-1.5 md:px-2 py-0.5 rounded">
              {formatTarget(selectedIndikatorProfile?.target, selectedIndikatorProfile?.measurement_unit, selectedIndikatorProfile?.reverse)}
            </span>
          </div>
        </div>

        {/* Dynamic ComposedChart rendering */}
        <div className="w-full flex items-center justify-center">
          {selectedChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/20 rounded-3xl border border-dashed border-gray-200 w-full animate-pulse">
              <div className="bg-slate-100 text-slate-400 p-4 rounded-full mb-3">
                <Activity size={24} />
              </div>
              <p className="text-slate-800 text-sm font-extrabold text-center">
                Belum Ada Catatan Riwayat Audit Indikator Ini
              </p>
              <p className="text-[11px] text-gray-400 mt-2 max-w-xs text-center leading-relaxed font-semibold">
                Silakan isi data laporan lewat tombol{" "}
                <Link href="/input" className="font-extrabold text-[#10a37f] hover:underline">
                  Menu Input Data
                </Link>{" "}
                untuk merespons grafik progres riwayat mutu secara langsung.
              </p>
            </div>
          ) : (
            <div className="h-80 w-full animate-in fade-in duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={selectedChartData}
                  margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "15px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  />

                  {/* Composed diagram representation: Bar and Line */}
                  <Bar
                    dataKey="Capaian"
                    fill="#10a37f"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                    name="Capaian (%)"
                  >
                    <LabelList
                      dataKey="Capaian"
                      position="top"
                      fill="#10a37f"
                      fontSize={10}
                      fontWeight="black"
                      formatter={(val: number) => val + "%"}
                    />
                  </Bar>

                  <Line
                    type="monotone"
                    dataKey="Capaian"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7 }}
                    name="Tren Garis"
                  />

                  <Line
                    type="monotone"
                    dataKey="Target"
                    stroke="#f97316"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    dot={false}
                    name="Target Sasaran (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 3. Patients Safety Incident (IKP) Card - diagram lingkaran saja */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 lg:p-8 border border-white/60 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.02)] space-y-4 md:space-y-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-3 border-b border-red-100/50 pb-3 md:pb-4">
          <ShieldAlert className="text-red-500 h-5 w-5 md:h-7 md:w-7 animate-pulse shrink-0" />
          <div>
            <h2 className="text-sm md:text-xl font-bold text-red-650 tracking-tight leading-none">
              Laporan Insiden Keselamatan Pasien (IKP)
            </h2>
            <span className="text-[9px] md:text-[10px] text-gray-400 font-extrabold block mt-1 uppercase tracking-wider leading-relaxed">
              Distribusi Kategori Mutu & Risiko Keselamatan (Diagram Lingkaran Saja)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center bg-white rounded-xl md:rounded-3xl p-4 md:p-6 border border-gray-50 shadow-xs">
          {/* Pie chart representation */}
          <div className="md:col-span-2 flex justify-center items-center h-64">
            {ikpPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/10 rounded-2xl border border-dashed border-emerald-100/50 w-full h-full">
                <div className="bg-emerald-50 text-[#10a37f] p-3 rounded-full mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-emerald-900 text-sm font-black text-center">
                  Laporan Nihil — Kondisi Pasien Aman
                </p>
                <p className="text-[10px] text-gray-400 mt-2 max-w-sm text-center leading-relaxed font-bold">
                  Belum ada catatan laporan insiden keselamatan dari bangsal klinis (KPC, KNC, KTC, KTD, Sentinel).
                </p>
              </div>
            ) : (
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ikpPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ikpPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Kejadian`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Counts & Legends block */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#0c2415] uppercase tracking-wider">
              Kejadian Terdaftar:
            </h4>
            
            <div className="space-y-2.5">
              {[
                { name: "KPC", label: "Potensial Cedera", val: totalIkp.KPC, color: "#10a37f" },
                { name: "KNC", label: "Nyaris Cedera", val: totalIkp.KNC, color: "#3b82f6" },
                { name: "KTC", label: "Tidak Cedera", val: totalIkp.KTC, color: "#eab308" },
                { name: "KTD", label: "Tidak Diharapkan", val: totalIkp.KTD, color: "#f97316" },
                { name: "Sentinel", label: "Sentinel", val: totalIkp.Sentinel, color: "#ef4444" },
              ].map((item) => (
                <div key={item.name} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <span className="text-xs font-black text-gray-800 block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold block leading-none">
                        {item.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-1 w-10 text-center">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/input"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg border border-emerald-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle size={14} /> Input Insiden Keselamatan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
