import React, { useState, useMemo, useEffect } from "react";
import InteractiveDashboardModal from "../components/dashboard/InteractiveDashboardModal";
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
  X,
  Search,
  Filter,
  FileText,
  Users,
  ShieldCheck,
  Building,
  Building2,
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
  Label,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { formatTarget } from "../../lib/utils";
import Link from "next/link";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-xs font-bold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex flex-row items-center justify-between gap-4 mb-1"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[10px] font-semibold text-gray-500 uppercase">
                {entry.name}
              </span>
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
      <path
        d={path}
        fill="#000000"
        opacity="0.18"
        style={{ transform: "translate(3px, 3px)", filter: "blur(1.5px)" }}
      />
      <path d={path} fill={fill} />
    </g>
  );
};

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
  const setDataMutuList = useStore((state) => state.setDataMutuList);
  const indicatorProfiles = useStore((state) => state.indicatorProfiles);

  const inmCount = indicatorProfiles.filter((p) => p.category === "INM").length;
  const impRsCount = indicatorProfiles.filter(
    (p) => p.category === "IMP-RS",
  ).length;
  const impUnitCount = indicatorProfiles.filter(
    (p) => p.category === "IMP-Unit",
  ).length;
  const spmCount = indicatorProfiles.filter((p) => p.category === "SPM").length;

  const [selectedIndikatorId, setSelectedIndikatorId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Filter Period State
  const [periodeMode, setPeriodeMode] = useState("Bulanan");
  const [selectedBulan, setSelectedBulan] = useState(
    new Date().toLocaleString("id-ID", { month: "long" }),
  );
  const [selectedTahun, setSelectedTahun] = useState(
    String(new Date().getFullYear()),
  );
  const [selectedTriwulan, setSelectedTriwulan] = useState("Triwulan 1");
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");

  // Modal State
  const [activeModal, setActiveModal] = useState<
    "TERCAPAI" | "BELUM_TERCAPAI" | "IKP" | "ALL" | null
  >(null);
  const [modalSearch, setModalSearch] = useState("");

  const filteredDropdownProfiles = useMemo(() => {
    let profiles = indicatorProfiles.filter(
      (p) =>
        !dropdownSearch ||
        p.indicator_title.toLowerCase().includes(dropdownSearch.toLowerCase()),
    );
    
    profiles.sort((a, b) => {
      const aIsKKT = (a.indicator_title || "").toLowerCase().includes("kebersihan tangan");
      const bIsKKT = (b.indicator_title || "").toLowerCase().includes("kebersihan tangan");
      if (aIsKKT && !bIsKKT) return -1;
      if (!aIsKKT && bIsKKT) return 1;
      return 0;
    });
    
    return profiles;
  }, [indicatorProfiles, dropdownSearch]);

  const activeIndikatorId =
    selectedIndikatorId || filteredDropdownProfiles[0]?.id || indicatorProfiles[0]?.id || "";

  // Fetch inputs from Supabase on mount to show correct user inputs in real-time
  useEffect(() => {
    const fetchSupabaseInputs = async () => {
      try {
        const { data, error } = await supabase
          .from("indicator_inputs")
          .select("*")
          .order("created_at", { ascending: true });

        if (data && data.length >= 0) {
          const newDataList = data.map((dbInput: any) => {
            const matchedProfile = indicatorProfiles.find(
              (p) => p.id === dbInput.indicator_id,
            );
            const persentase = dbInput.achievement_percentage || 0;
            const rawTarget = dbInput.target || matchedProfile?.target || 80;
            const target =
              parseFloat(String(rawTarget).replace(/[^0-9.]/g, "")) || 80;

            // Determine achievement status
            const isReverse = matchedProfile?.reverse || false;
            let computedStatus: "Tercapai" | "Mendekati" | "Tidak Tercapai" =
              "Tidak Tercapai";
            const isSuccess = isReverse
              ? persentase <= target
              : persentase >= target;
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
                if (
                  typeof parsed === "object" &&
                  parsed !== null &&
                  ("kpc" in parsed || "knc" in parsed)
                ) {
                  ikpData = parsed;
                }
              } catch (e) {
                // Not JSON, fallback to legacy
              }
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
              status: (dbInput.category_id === "IKP"
                ? "N/A"
                : computedStatus) as any,
              keterangan: ikpData ? ikpData.keterangan : dbInput.notes || "",
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
        console.warn(
          "Supabase load skipped or delayed, relying on client memory",
          err,
        );
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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inputsChannel);
    };
  }, [indicatorProfiles, setDataMutuList]);

  // Filtered Input Data based on Period (Real-Time)
  const filteredDataMutu = useMemo(() => {
    return dataMutuList.filter((d) => {
      if (!d.tanggal) return false;
      const date = new Date(d.tanggal);
      const mYear = String(date.getFullYear());
      const monthIndex = date.getMonth(); // 0 - 11
      const mMonthName = date.toLocaleString("id-ID", { month: "long" });

      if (mYear !== selectedTahun) return false;

      if (periodeMode === "Bulanan") {
        return mMonthName === selectedBulan;
      }
      if (periodeMode === "Triwulan") {
        if (selectedTriwulan === "Triwulan 1")
          return monthIndex >= 0 && monthIndex <= 2;
        if (selectedTriwulan === "Triwulan 2")
          return monthIndex >= 3 && monthIndex <= 5;
        if (selectedTriwulan === "Triwulan 3")
          return monthIndex >= 6 && monthIndex <= 8;
        if (selectedTriwulan === "Triwulan 4")
          return monthIndex >= 9 && monthIndex <= 11;
      }
      if (periodeMode === "Semester") {
        if (selectedSemester === "Semester 1")
          return monthIndex >= 0 && monthIndex <= 5;
        if (selectedSemester === "Semester 2")
          return monthIndex >= 6 && monthIndex <= 11;
      }
      if (periodeMode === "Tahunan") {
        return true;
      }
      return true;
    });
  }, [
    dataMutuList,
    periodeMode,
    selectedBulan,
    selectedTahun,
    selectedTriwulan,
    selectedSemester,
  ]);

  // Map 13 indicators table data based on dynamic input records
  let inmTableData = indicatorProfiles
    .filter((item) => item.category === "INM")
    .map((item, index) => {
    const matchingEntries = filteredDataMutu.filter(
      (d) => d.indikator_id === item.id,
    );
    let capaianVal = 0;
    let status = "red";

    if (matchingEntries.length > 0) {
      const totalCapaian = matchingEntries.reduce(
        (sum, entry) => sum + (entry.capaian || 0),
        0,
      );
      capaianVal = totalCapaian / matchingEntries.length;

      const rawTarget = matchingEntries[0]?.target || item.target || 80;
      const targetVal =
        parseFloat(String(rawTarget).replace(/[^0-9.]/g, "")) || 80;
      const isReverse = item.reverse || false;
      const isSuccess = isReverse
        ? capaianVal <= targetVal
        : capaianVal >= targetVal;

      if (isSuccess) {
        status = "green";
      } else if (Math.abs(capaianVal - targetVal) <= 10) {
        status = "orange";
      } else {
        status = "red";
      }
    }

    const formattedTarget = formatTarget(
      item.target,
      item.measurement_unit,
      item.reverse,
    );

    return {
      no: index + 1,
      id: item.id,
      name: item.indicator_title,
      target: formattedTarget,
      targetNum: item.target,
      capaian: matchingEntries.length > 0 ? `${capaianVal.toFixed(1)}%` : "0%",
      status: matchingEntries.length > 0 ? status : "red",
      unit_id:
        matchingEntries.length > 0
          ? matchingEntries[matchingEntries.length - 1].unit
          : "-",
      tanggal:
        matchingEntries.length > 0
          ? matchingEntries[matchingEntries.length - 1].tanggal
          : "-",
    };
  });

  // Sort "Kepatuhan Kebersihan Tangan" to the top
  inmTableData.sort((a, b) => {
    const aIsKKT = (a.name || "").toLowerCase().includes("kebersihan tangan");
    const bIsKKT = (b.name || "").toLowerCase().includes("kebersihan tangan");
    if (aIsKKT && !bIsKKT) return -1;
    if (!aIsKKT && bIsKKT) return 1;
    return 0;
  });

  // Re-assign sequential numbers
  inmTableData.forEach((item, index) => {
    item.no = index + 1;
  });

  const tercapaiCount = inmTableData.filter((i) => i.status === "green").length;
  const belumTercapaiCount = inmTableData.filter(
    (i) => i.status === "red" || i.status === "orange",
  ).length;

  // IKP (Insiden Keselamatan Pasien) Aggregation Logic
  const ikpDataRaw = filteredDataMutu.filter((d) => d.kategori === "IKP");
  const totalIkp = {
    KPC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.kpc) || 0), 0),
    KNC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.knc) || 0), 0),
    KTC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktc) || 0), 0),
    KTD: ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktd) || 0), 0),
    Sentinel: ikpDataRaw.reduce(
      (sum, item) => sum + (Number(item.sentinel) || 0),
      0,
    ),
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
    0,
  );

  // Find detail setup of chosen indicator
  const selectedIndikatorProfile = useMemo(() => {
    return indicatorProfiles.find((p) => p.id === activeIndikatorId);
  }, [indicatorProfiles, activeIndikatorId]);

  // Compute real-time monthly performance for chosen indicator based strictly on standard input records
  const selectedChartData = useMemo(() => {
    const matching = filteredDataMutu.filter(
      (d) => d.indikator_id === activeIndikatorId,
    );
    if (matching.length === 0) return [];

    // Sort chronologically based on input date
    const sorted = [...matching].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );

    // Group actual records by Month & Year to yield authentic progress statistics without dummy data
    const monthlyGroups: {
      [key: string]: { totalCapaian: number; count: number; target: number };
    } = {};
    sorted.forEach((item) => {
      const d = new Date(item.tanggal);
      let mLabel = d.toLocaleString("id-ID", { month: "long" });

      if (!monthlyGroups[mLabel]) {
        const rawTarget = item.target || selectedIndikatorProfile?.target || 80;
        const numTarget =
          parseFloat(String(rawTarget).replace(/[^0-9.]/g, "")) || 80;
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
  }, [filteredDataMutu, activeIndikatorId, selectedIndikatorProfile]);

  const selectedChartAnalysis = useMemo(() => {
    if (
      !selectedChartData ||
      selectedChartData.length === 0 ||
      !selectedIndikatorProfile
    )
      return null;

    let totalCap = 0;
    selectedChartData.forEach((d) => (totalCap += d.Capaian));
    const avgCap =
      selectedChartData.length > 0
        ? parseFloat((totalCap / selectedChartData.length).toFixed(2))
        : 0;
    const target = selectedChartData[0]?.Target || 80;

    const isReverse = selectedIndikatorProfile?.reverse || false;
    const isSuccess = isReverse ? avgCap <= target : avgCap >= target;

    let status = "Tidak Tercapai";
    if (isSuccess) status = "Tercapai";
    else if (Math.abs(avgCap - target) <= 10) status = "Mendekati Target";

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

    const indTitle = selectedIndikatorProfile.indicator_title;
    
    // Generate base narrative
    let narasi = "";
    if (shortPeriod === "Bulanan") {
      narasi = `Berdasarkan hasil pemantauan ${longPeriodName} di UOBK RSUD Al-Mulk Kota Sukabumi, capaian indikator ${indTitle} sebesar ${avgCap}%, `;
    } else {
      narasi = `Berdasarkan hasil pemantauan ${longPeriodName} di UOBK RSUD Al-Mulk Kota Sukabumi, diperoleh rata-rata capaian indikator ${indTitle} sebesar ${avgCap}%, `;
    }

    const opTargetText = isReverse ? `≤${target}%` : `≥${target}%`;
    if (isSuccess) {
      narasi += `telah mencapai target nasional yaitu ${opTargetText}.`;
    } else {
      narasi += `masih berada di bawah target nasional yaitu ${opTargetText}.`;
    }

    // Trend analysis
    let trendStr = "";
    if (selectedChartData.length > 1) {
      const firstCap = selectedChartData[0].Capaian;
      const lastCap = selectedChartData[selectedChartData.length - 1].Capaian;
      const diff = lastCap - firstCap;

      let isMonotonicIncrease = true;
      let isMonotonicDecrease = true;

      for (let i = 1; i < selectedChartData.length; i++) {
        const prev = selectedChartData[i - 1].Capaian;
        const curr = selectedChartData[i].Capaian;
        if (curr < prev) isMonotonicIncrease = false;
        if (curr > prev) isMonotonicDecrease = false;
      }

      if (isMonotonicIncrease && diff > 0) {
        trendStr = `Terdapat tren peningkatan capaian dari bulan ${selectedChartData[0].name.toLowerCase()} hingga ${selectedChartData[selectedChartData.length - 1].name.toLowerCase()} yang menunjukkan adanya perbaikan kepatuhan petugas terhadap indikator yang diukur.`;
      } else if (isMonotonicDecrease && diff < 0) {
        trendStr = `Terdapat tren penurunan capaian dari bulan ${selectedChartData[0].name.toLowerCase()} hingga ${selectedChartData[selectedChartData.length - 1].name.toLowerCase()} yang perlu menjadi perhatian untuk dilakukan evaluasi lebih lanjut.`;
      } else if (diff > 5) {
        trendStr = "Terdapat tren peningkatan capaian pada beberapa periode terakhir yang menunjukkan perbaikan berkelanjutan.";
      } else if (diff < -5) {
        trendStr = "Terdapat tren penurunan capaian pada beberapa periode yang perlu menjadi perhatian untuk dilakukan evaluasi lebih lanjut.";
      } else {
        trendStr = "Capaian indikator relatif stabil pada seluruh periode pemantauan.";
      }
    }

    // Conclusion
    let conclusion = "";
    if (isSuccess) {
      conclusion = "Walaupun terdapat variasi capaian antar periode, indikator telah memenuhi target yang ditetapkan sehingga mutu pelayanan dinilai baik.";
    } else {
      conclusion = "Hal ini menunjukkan pencapaian masih belum optimal. Indikator masih belum mencapai target yang ditetapkan sehingga diperlukan upaya perbaikan berkelanjutan melalui monitoring dan evaluasi rutin.";
    }

    // Recommendations
    let recommendations: string[] = [];
    if (!isSuccess) {
      recommendations = [
        "Meningkatkan sosialisasi kepada petugas.",
        "Melakukan audit internal secara berkala.",
        "Memperkuat supervisi kepala unit.",
        "Memberikan umpan balik hasil monitoring.",
        "Menyusun rencana tindak lanjut perbaikan."
      ];
    } else {
      recommendations = [
        "Mempertahankan capaian yang sudah baik.",
        "Melakukan monitoring rutin.",
        "Menjadikan unit dengan capaian tinggi sebagai role model."
      ];
    }

    return {
      avgCap,
      target,
      status,
      longPeriodName,
      indicatorTitle: indTitle,
      narasi,
      trendStr,
      conclusion,
      recommendations
    };
  }, [
    selectedChartData,
    selectedIndikatorProfile,
    periodeMode,
    selectedBulan,
    selectedTriwulan,
    selectedSemester,
    selectedTahun,
  ]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-4 w-full max-w-full px-2 sm:px-4 md:px-0 md:overflow-visible">
      {/* Header and Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-4">
        <div>
          <div className="flex items-start md:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#10a37f] tracking-tight leading-tight">
              Dashboard Mutu Rumah Sakit
            </h1>
          </div>
          <p
            style={{ color: "#4a5565" }}
            className="mt-2 text-[9px] sm:text-[10px] md:text-sm font-semibold whitespace-nowrap leading-relaxed"
          >
            Pemantauan Indikator Mutu & Keselamatan Pasien UOBK RSUD AL-MULK
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full xl:w-auto justify-start xl:justify-end mt-2 xl:mt-0">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg md:rounded-xl px-2.5 md:px-2 lg:px-2.5 shadow-sm shrink-0">
            <Filter size={14} className="text-emerald-600 hidden md:block" />
            <select
              value={periodeMode}
              onChange={(e) => setPeriodeMode(e.target.value)}
              className="py-2.5 md:py-1.5 lg:py-2.5 bg-transparent outline-none focus:ring-0 text-xs md:text-[11px] lg:text-xs font-bold text-gray-700 cursor-pointer w-full"
            >
              <option value="Bulanan">Bulanan</option>
              <option value="Triwulan">Triwulan</option>
              <option value="Semester">Semester</option>
              <option value="Tahunan">Tahunan</option>
            </select>
          </div>

          {periodeMode === "Bulanan" && (
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="px-4 md:px-2.5 lg:px-4 py-2.5 md:py-1.5 lg:py-2.5 border border-gray-200 rounded-lg md:rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs md:text-[11px] lg:text-xs font-bold text-gray-700 shadow-sm cursor-pointer"
            >
              {[
                "Januari",
                "Februari",
                "Maret",
                "April",
                "Mei",
                "Juni",
                "Juli",
                "Agustus",
                "September",
                "Oktober",
                "November",
                "Desember",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {periodeMode === "Triwulan" && (
            <select
              value={selectedTriwulan}
              onChange={(e) => setSelectedTriwulan(e.target.value)}
              className="px-4 md:px-2.5 lg:px-4 py-2.5 md:py-1.5 lg:py-2.5 border border-gray-200 rounded-lg md:rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs md:text-[11px] lg:text-xs font-bold text-gray-700 shadow-sm cursor-pointer"
            >
              <option value="Triwulan 1">Triwulan 1 (Jan-Mar)</option>
              <option value="Triwulan 2">Triwulan 2 (Apr-Jun)</option>
              <option value="Triwulan 3">Triwulan 3 (Jul-Sep)</option>
              <option value="Triwulan 4">Triwulan 4 (Okt-Des)</option>
            </select>
          )}

          {periodeMode === "Semester" && (
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 md:px-2.5 lg:px-4 py-2.5 md:py-1.5 lg:py-2.5 border border-gray-200 rounded-lg md:rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs md:text-[11px] lg:text-xs font-bold text-gray-700 shadow-sm cursor-pointer"
            >
              <option value="Semester 1">Semester 1 (Jan-Jun)</option>
              <option value="Semester 2">Semester 2 (Jul-Des)</option>
            </select>
          )}

          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="px-4 md:px-2.5 lg:px-4 py-2.5 md:py-1.5 lg:py-2.5 border border-gray-200 rounded-lg md:rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs md:text-[11px] lg:text-xs font-bold text-gray-700 shadow-sm cursor-pointer"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4 xl:gap-6">
        {/* Card 1: Pemenuhan Target INM */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(16, 163, 127, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveModal("TERCAPAI")}
          className="bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-emerald-100 flex flex-col cursor-pointer relative overflow-hidden group h-full"
        >
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,163,127,0.8)] opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-[16px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200/50 flex-shrink-0">
                <Target className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            <div className="mt-2 md:mt-4">
              <p className="text-[11px] md:text-[15px] font-semibold text-gray-500 leading-tight md:leading-[1.4] mb-0">
                Pemenuhan Target INM
              </p>
              <h3 className="text-[28px] md:text-[48px] font-extrabold text-slate-800 leading-none mt-1 md:mt-[12px] mb-1 md:mb-[12px] flex items-baseline italic">
                {tercapaiCount}
                <span className="text-sm md:text-2xl text-gray-400 font-bold ml-1 md:ml-1.5">
                  / 13
                </span>
              </h3>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 mt-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                <span>0%</span>
                <span>{((tercapaiCount / 13) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full relative overflow-hidden"
                  style={{ width: `${(tercapaiCount / 13) * 100}%` }}
                >
                  <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-auto pt-3 md:pt-4 border-t border-gray-100/80">
              <span className="px-2 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-full bg-emerald-50/80 text-emerald-600 text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 w-full transition-colors group-hover:bg-emerald-100/80 text-center leading-tight min-h-[36px] md:min-h-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 hidden md:block" />
                {tercapaiCount > 0
                  ? "Target INM Tercapai"
                  : "Belum Ada Indikator Tercapai"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Indikator Belum Tercapai */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(220, 38, 38, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveModal("BELUM_TERCAPAI")}
          className="bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-red-100 flex flex-col cursor-pointer relative overflow-hidden group h-full"
        >
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 to-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-[16px] bg-gradient-to-br from-red-400 to-red-500 text-white shadow-lg shadow-red-200/50 flex-shrink-0">
                <AlertTriangle className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="p-2 bg-red-50 rounded-xl text-red-500 shrink-0">
                <TrendingDown className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            <div className="mt-2 md:mt-4">
              <p className="text-[11px] md:text-[14px] font-semibold text-gray-500 leading-tight md:leading-[1.4] mb-0">
                Indikator Belum Tercapai
              </p>
              <h3 className="text-[28px] md:text-[48px] font-extrabold text-slate-800 leading-none mt-1 md:mt-[12px] mb-1 md:mb-[12px] italic">
                {belumTercapaiCount}
              </h3>
            </div>

            <div className="relative z-10 mt-auto pt-3 md:pt-4 border-t border-gray-100/80">
              <span className="px-2 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-full bg-red-50/80 text-red-600 text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 w-full transition-colors group-hover:bg-red-100/80 text-center leading-tight min-h-[36px] md:min-h-0">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 hidden md:block" />
                Perlu Perbaikan Mutu
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Kejadian IKP */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveModal("IKP")}
          className="bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-blue-100 flex flex-col cursor-pointer relative overflow-hidden group h-full"
        >
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-[16px] bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-200/50 flex-shrink-0">
                <ShieldAlert className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-500 shrink-0">
                <FileText className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            <div className="mt-2 md:mt-4">
              <p className="text-[11px] md:text-[15px] font-semibold text-gray-500 leading-tight md:leading-[1.4] mb-0">
                Kejadian IKP Tercatat
              </p>
              <div className="flex items-end gap-[4px] md:gap-[8px] mt-1 md:mt-[12px] mb-1 md:mb-[12px]">
                <h3 className="text-[28px] md:text-[48px] font-extrabold text-slate-800 leading-none italic">
                  {totalIncidentCount}
                </h3>
                <span className="text-[10px] md:text-xl text-gray-400 font-bold mb-0.5 md:mb-1.5 italic">
                  Laporan
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-auto pt-3 md:pt-4 border-t border-gray-100/80">
              <div className="flex flex-row md:flex-col xl:flex-row items-center justify-center bg-gray-50/50 hover:bg-gray-100/50 transition-colors px-2 md:px-4 py-2 xl:py-2.5 rounded-xl md:rounded-full w-full gap-2 md:gap-1.5 xl:gap-2">
                <span className="text-blue-600 text-[10px] md:text-[11px] xl:text-xs font-bold flex items-center gap-1.5 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 hidden md:block" />
                  Laporan Masuk
                </span>
                <span className="px-3 md:px-2 xl:px-3 py-1 md:py-0.5 xl:py-1 rounded-full bg-blue-100/50 text-blue-700 text-[10px] md:text-[9px] xl:text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-sm border border-blue-200/30 flex-shrink-0">
                  Realtime{" "}
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Total Indikator */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(234, 88, 12, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveModal("ALL")}
          className="bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-orange-100 flex flex-col cursor-pointer relative overflow-hidden group h-full"
        >
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)] opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-[16px] bg-[#f97316] text-white shadow-lg shadow-orange-200/50 flex-shrink-0">
                <ListTodo className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="p-2 bg-orange-50 rounded-xl text-orange-600 shrink-0">
                <Users className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            <div className="mt-2 md:mt-4">
              <p className="text-[11px] md:text-[15px] font-semibold text-gray-500 leading-tight md:leading-[1.4] mb-0 line-clamp-1 md:line-clamp-2 xl:line-clamp-1">
                Total Indikator <br className="hidden md:block xl:hidden" /> Aktif
              </p>
              <h3 className="text-[28px] md:text-[48px] font-extrabold text-slate-800 leading-none mt-1 md:mt-[12px] mb-1 md:mb-[12px] italic">
                {indicatorProfiles.length}
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-2 gap-x-[10px] mt-auto pt-3 md:pt-4 border-t border-gray-100/80">
              <div className="flex items-center gap-1.5 md:gap-2">
                <ShieldCheck
                  className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-[10px] md:text-[13px] xl:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  <span className="inline-block md:w-[68px] xl:w-auto">
                    INM
                  </span>
                  <span className="pr-1">:</span>
                  <span className="text-slate-800 font-bold ml-0.5">
                    {inmCount}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Building
                  className="w-4 h-4 md:w-5 md:h-5 text-blue-500 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-[10px] md:text-[13px] xl:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  <span className="inline-block md:w-[68px] xl:w-auto">
                    IMP-RS
                  </span>
                  <span className="pr-1">:</span>
                  <span className="text-slate-800 font-bold ml-0.5">
                    {impRsCount}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Building2
                  className="w-4 h-4 md:w-5 md:h-5 text-purple-500 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-[10px] md:text-[13px] xl:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  <span className="inline-block md:w-[68px] xl:w-auto">
                    IMP-Unit
                  </span>
                  <span className="pr-1">:</span>
                  <span className="text-slate-800 font-bold ml-0.5">
                    {impUnitCount}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <FileText
                  className="w-4 h-4 md:w-5 md:h-5 text-orange-500 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-[10px] md:text-[13px] xl:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  <span className="inline-block md:w-[68px] xl:w-auto">
                    SPM
                  </span>
                  <span className="pr-1">:</span>
                  <span className="text-slate-800 font-bold ml-0.5">
                    {spmCount}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 1. 13 Indikator Nasional Mutu (INM) Table */}
      <div className="bg-emerald-50/20 rounded-2xl md:rounded-[32px] p-4 md:p-6 lg:p-8 border border-emerald-50 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-3 md:gap-4 md:px-2">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#10a37f] tracking-tight leading-normal">
              13 Indikator Nasional Mutu (INM)
            </h2>
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
            <table className="w-full min-w-[400px] md:min-w-[700px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#10a37f] text-white">
                  <th className="py-2 px-1.5 md:py-4 md:px-8 font-black text-[8px] md:text-xs border-r border-[#10a37f]/20 w-6 md:w-16 text-center">
                    NO
                  </th>
                  <th className="py-2 px-2 md:py-4 md:px-6 font-black text-[8px] md:text-xs uppercase tracking-wider text-center">
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
            <div className="flex items-center gap-2">
              <BarChart3 className="text-[#10a37f] h-[18px] w-[18px] md:h-5 md:w-5" />
              <h3 className="text-sm md:text-xl font-extrabold text-[#10a37f] tracking-tight leading-normal" style={{ fontSize: "16px" }}>
                GRAFIK CAPAIAN MUTU INM
              </h3>
            </div>
          </div>

          {/* Interactive Selection filter - Professional Searchable Dropdown */}
          <div className="relative w-full md:w-96 select-none z-30">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#10a37f]/30 hover:border-[#10a37f] rounded-xl outline-none focus:ring-2 focus:ring-[#10a37f] text-xs font-extrabold text-gray-700 shadow-sm transition-all duration-300 cursor-pointer"
            >
              <span className="truncate pr-2">
                {selectedIndikatorProfile?.indicator_title ||
                  "Pilih Indikator Mutu"}
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
                  {filteredDropdownProfiles.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400 font-bold">
                      Tidak ada hasil ditemukan
                    </div>
                  ) : (
                    filteredDropdownProfiles
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
                            <span className="truncate leading-tight block pr-2">
                              {p.indicator_title}
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                size={14}
                                className="text-[#10a37f] shrink-0 ml-2"
                              />
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

        {selectedChartData.length === 0 ? (
          <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/20 rounded-3xl border border-dashed border-gray-200 w-full animate-pulse">
              <div className="bg-slate-100 text-slate-400 p-4 rounded-full mb-3">
                <Activity size={24} />
              </div>
              <p className="text-slate-800 text-sm font-extrabold text-center">
                Belum Ada Catatan Riwayat Audit Indikator Ini
              </p>
              <p className="text-[11px] text-gray-400 mt-2 max-w-xs text-center leading-relaxed font-semibold">
                Silakan isi data laporan lewat tombol{" "}
                <Link
                  href="/input"
                  className="font-extrabold text-[#10a37f] hover:underline"
                >
                  Menu Input Data
                </Link>{" "}
                untuk merespons grafik progres riwayat mutu secara langsung.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col items-center mt-3">
            <div className="text-center mb-6 w-full px-4">
              <h3 className="text-[16px] font-bold text-slate-800 leading-tight" style={{ fontSize: "16px" }}>
                {selectedChartAnalysis?.indicatorTitle}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">
                UOBK RSUD AL-MULK KOTA SUKABUMI
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedChartAnalysis?.longPeriodName}
              </p>
            </div>

            <div className="relative w-full h-[280px] shrink-0 mt-4">
              <div className="absolute inset-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                  <ComposedChart
                    data={selectedChartData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(val) => (val === 0 ? "0" : val)}
                      tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickCount={5}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "11px",
                        fontWeight: 600,
                        paddingTop: "15px",
                      }}
                    />
                    <Bar
                      shape={<TwoDShadowBar />}
                      dataKey="Capaian"
                      name="Capaian"
                      fill="#2563EB"
                      maxBarSize={48}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="Capaian"
                        position="top"
                        offset={10}
                        formatter={(val: number) => val + "%"}
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          fill: "#2563EB",
                        }}
                      />
                    </Bar>
                    <Bar
                      shape={<TwoDShadowBar />}
                      dataKey="Target"
                      name="Target"
                      fill="#DC2626"
                      maxBarSize={48}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="Target"
                        position="top"
                        offset={10}
                        formatter={(val: number) => val + "%"}
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          fill: "#DC2626",
                        }}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="w-full mt-6 bg-slate-50/70 p-5 md:p-6 rounded-2xl border border-slate-100/80">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Analisa Capaian
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4 text-justify">
                {selectedChartAnalysis?.narasi} {selectedChartAnalysis?.trendStr} {selectedChartAnalysis?.conclusion}
              </p>
              
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4">
                <h5 className="text-[13px] font-bold text-slate-800 mb-2 uppercase tracking-wide">
                  Rekomendasi Tindak Lanjut:
                </h5>
                <ul className="list-none space-y-2 pl-0 mb-0">
                  {selectedChartAnalysis?.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="text-[13px] text-slate-600 flex items-start gap-2.5">
                      <span className="text-emerald-500 font-bold mt-[-1px] text-lg leading-none">•</span>
                      <span className="font-medium">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Patients Safety Incident (IKP) Card - diagram lingkaran saja */}
      <div className="bg-white/80 backdrop-blur-lg rounded-[24px] p-6 lg:p-10 border border-white/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300">
        
        {/* Header IKP */}
        <div className="flex flex-col items-center justify-center text-center mb-8 pb-6 border-b border-gray-100">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-tight">
            INSIDEN KESELAMATAN PASIEN (IKP)
          </h2>
          <h3 className="text-sm md:text-base font-bold text-gray-500 mt-1">
            UOBK RSUD AL-MULK KOTA SUKABUMI
          </h3>
          <div className="mt-3 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border border-emerald-100/50 shadow-sm inline-block">
            PERIODE : {
              periodeMode === "Bulanan" ? `BULAN ${selectedBulan.toUpperCase()} ${selectedTahun}` :
              periodeMode === "Triwulan" ? `${selectedTriwulan.toUpperCase().replace("TRIWULAN 1", "TRIWULAN I").replace("TRIWULAN 2", "TRIWULAN II").replace("TRIWULAN 3", "TRIWULAN III").replace("TRIWULAN 4", "TRIWULAN IV")} TAHUN ${selectedTahun}` :
              periodeMode === "Semester" ? `${selectedSemester.toUpperCase().replace("SEMESTER 1", "SEMESTER I").replace("SEMESTER 2", "SEMESTER II")} TAHUN ${selectedTahun}` :
              `TAHUN ${selectedTahun}`
            }
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/40 rounded-3xl p-2 md:p-4">
          {/* Pie chart representation */}
          <div className="lg:col-span-7 flex justify-center items-center h-80 md:h-[400px]">
            {ikpPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[20px] border border-dashed border-slate-200 w-full h-full max-w-md mx-auto">
                <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full mb-4 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-slate-700 text-lg font-black text-center">
                  Laporan Nihil
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm text-center font-medium leading-relaxed">
                  Tidak ada catatan laporan insiden keselamatan pada periode ini. Kondisi Pasien Aman.
                </p>
              </div>
            ) : (
              <div className="relative w-full h-full shrink-0 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={ikpPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={140}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      labelLine={false}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        percent,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius =
                          innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        if (percent < 0.03) return null;
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={800}
                            style={{
                              textShadow: "0px 1px 3px rgba(0,0,0,0.4)",
                            }}
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {ikpPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity duration-300 outline-none"
                          style={{
                            filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.15)) inset 0px 4px 8px rgba(255,255,255,0.2)",
                          }}
                        />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          const { cx, cy } = viewBox as any;
                          const sorted = [...ikpPieData].sort((a,b) => b.value - a.value);
                          const dominant = sorted[0];
                          const dominantPct = ((dominant.value / totalIncidentCount) * 100).toFixed(0);

                          return (
                            <text
                              x={cx}
                              y={cy - 10}
                              textAnchor="middle"
                              dominantBaseline="central"
                            >
                              <tspan
                                x={cx}
                                y={cy - 15}
                                fill="#0f172a"
                                fontSize="48"
                                fontWeight="900"
                                style={{ letterSpacing: "-0.05em" }}
                              >
                                {totalIncidentCount}
                              </tspan>
                              <tspan
                                x={cx}
                                dy="30"
                                fill="#64748b"
                                fontSize="12"
                                fontWeight="800"
                                style={{ letterSpacing: "0.1em" }}
                                textAnchor="middle"
                              >
                                INSIDEN
                              </tspan>
                              <tspan
                                x={cx}
                                dy="22"
                                fill={dominant.color}
                                fontSize="11"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                Dominan: {dominant.name} ({dominantPct}%)
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        `${value} Kasus (${((Number(value) / totalIncidentCount) * 100).toFixed(0)}%)`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                        fontWeight: "900",
                        fontSize: "13px",
                        padding: "10px 16px",
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                      }}
                      itemStyle={{ color: "#0f172a", fontWeight: "900", marginTop: "4px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Counts & Legends block */}
          <div className="lg:col-span-5 space-y-4 px-2 md:px-0">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 px-1 border-b border-slate-100 pb-3">
              Data Jumlah Insiden
            </h4>

            <div className="space-y-3">
              {[
                {
                  name: "KPC",
                  label: "Kondisi Potensial Cedera",
                  val: totalIkp.KPC,
                  color: "#10a37f",
                },
                {
                  name: "KNC",
                  label: "Kejadian Nyaris Cedera",
                  val: totalIkp.KNC,
                  color: "#3b82f6",
                },
                {
                  name: "KTC",
                  label: "Kejadian Tidak Cedera",
                  val: totalIkp.KTC,
                  color: "#eab308",
                },
                {
                  name: "KTD",
                  label: "Kejadian Tidak Diharapkan",
                  val: totalIkp.KTD,
                  color: "#f97316",
                },
                {
                  name: "Sentinel",
                  label: "Kejadian Sentinel",
                  val: totalIkp.Sentinel,
                  color: "#ef4444",
                },
              ].map((item) => {
                 const pct = totalIncidentCount > 0 ? ((item.val / totalIncidentCount) * 100).toFixed(0) : "0";
                 
                 return (
                <div
                  key={item.name}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-inner"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                        {item.name}
                        {item.val > 0 && <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{pct}%</span>}
                      </span>
                      {item.label && (
                        <span className="text-xs text-slate-500 font-medium">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.val > 0 ? (
                     <span className="text-sm font-bold text-white px-3 py-1.5 rounded-xl text-center min-w-[3rem] shadow-sm self-start sm:self-auto" style={{ backgroundColor: item.color }}>
                       {item.val} <span className="text-[10px] font-medium opacity-90 hidden sm:inline">Kasus</span>
                     </span>
                  ) : (
                     <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center min-w-[3rem] self-start sm:self-auto">
                       0
                     </span>
                  )}
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* Automatic Analysis Section */}
        <div className="mt-8 bg-slate-50/70 p-5 md:p-6 rounded-2xl border border-slate-100/80">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Analisa Data Insiden Keselamatan Pasien
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-medium text-justify">
            {(() => {
              if (totalIncidentCount === 0) {
                return `Tidak terdapat laporan insiden keselamatan pasien pada ${periodeMode === "Bulanan" ? `bulan ${selectedBulan.toLowerCase()} ${selectedTahun}` : periodeMode === "Triwulan" ? `periode ${selectedTriwulan.toLowerCase().replace("triwulan 1", "triwulan I").replace("triwulan 2", "triwulan II").replace("triwulan 3", "triwulan III").replace("triwulan 4", "triwulan IV")} ${selectedTahun}` : periodeMode === "Semester" ? `periode ${selectedSemester.toLowerCase().replace("semester 1", "semester I").replace("semester 2", "semester II")} ${selectedTahun}` : `tahun ${selectedTahun}`}. Kondisi lingkungan klinis terpantau aman.`;
              }

              const sorted = [...ikpPieData].sort((a,b) => b.value - a.value);
              const dominant = sorted[0];
              const percentage = ((dominant.value / totalIncidentCount) * 100).toFixed(0);
              
              const labelMapping: Record<string, string> = {
                KPC: "Kondisi Potensial Cedera",
                KNC: "Kejadian Nyaris Cedera",
                KTC: "Kejadian Tidak Cedera",
                KTD: "Kejadian Tidak Diharapkan",
                Sentinel: "Kejadian Sentinel"
              };

              const periodeText = periodeMode === "Bulanan" ? `bulan ${selectedBulan.toLowerCase()} ${selectedTahun}` : periodeMode === "Triwulan" ? `periode ${selectedTriwulan.toLowerCase().replace("triwulan 1", "triwulan I").replace("triwulan 2", "triwulan II").replace("triwulan 3", "triwulan III").replace("triwulan 4", "triwulan IV")} ${selectedTahun}` : periodeMode === "Semester" ? `periode ${selectedSemester.toLowerCase().replace("semester 1", "semester I").replace("semester 2", "semester II")} ${selectedTahun}` : `tahun ${selectedTahun}`;

              let analysis = `Berdasarkan data ${periodeText}, tercatat ${totalIncidentCount} laporan insiden keselamatan pasien. Jenis insiden yang paling dominan adalah ${dominant.name} (${labelMapping[dominant.name] || dominant.name}) sebanyak ${dominant.value} kejadian atau ${percentage}% dari total laporan.`;
              
              if (sorted.length > 1) {
                const second = sorted[1];
                const secondPct = ((second.value / totalIncidentCount) * 100).toFixed(0);
                analysis += ` ${second.name} menempati urutan kedua sebanyak ${second.value} kejadian (${secondPct}%).`;
              }
              
              const rest = sorted.slice(2).map(i => i.name).join(", ");
              if (rest.length > 0) {
                 analysis += ` Kategori lainnya meliputi ${rest} yang berkontribusi pada sisa total insiden.`;
              }

              if (dominant.name === "KPC") {
                analysis += ` Data ini menunjukkan bahwa potensi risiko masih menjadi kategori yang paling sering ditemukan dan memerlukan tindak lanjut pencegahan proaktif untuk mengurangi kemungkinan terjadinya cedera pada pasien.`;
              } else if (dominant.name === "KTD" || dominant.name === "Sentinel") {
                analysis += ` Tingginya angka ${dominant.name} memerlukan prioritas investigasi mendalam (Root Cause Analysis) dan perbaikan sistem secara komprehensif demi keselamatan pasien.`;
              } else {
                analysis += ` Evaluasi dan peningkatan standar prosedur keselamatan ruang rawat secara berkesinambungan tetap harus dijalankan.`;
              }

              return analysis;
            })()}
          </p>
        </div>
      </div>

      <InteractiveDashboardModal
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        inmTableData={inmTableData}
        ikpDataRaw={ikpDataRaw}
        indicatorProfiles={indicatorProfiles}
        filteredDataMutu={filteredDataMutu}
        dataMutuList={dataMutuList}
        periodeText={periodeMode === "Bulanan" ? `Bulan ${selectedBulan} ${selectedTahun}` : periodeMode === "Triwulan" ? `${selectedTriwulan} ${selectedTahun}` : periodeMode === "Semester" ? `${selectedSemester} ${selectedTahun}` : `Tahun ${selectedTahun}`}
      />
    </div>
  );
}
