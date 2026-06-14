import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Download,
  FileText,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  Filter,
  CheckCircle2,
  X,
  Calendar,
  Activity,
  ChevronRight,
  Calculator,
  PieChart,
  Info,
  BookOpen,
  Clock,
  Building2,
  User,
  Target,
  TrendingUp,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
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

            let notesData: any = {};
            if (dbInput.notes) {
              try {
                const parsed = JSON.parse(dbInput.notes);
                if (typeof parsed === "object" && parsed !== null) {
                  notesData = parsed;
                }
              } catch (e) {
                notesData = { keterangan: dbInput.notes };
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
              keterangan: notesData.keterangan || "",
              kpc: notesData.kpc || 0,
              knc: notesData.knc || 0,
              ktc: notesData.ktc || 0,
              ktd: notesData.ktd || 0,
              sentinel: notesData.sentinel || 0,
              visite_details: notesData.visite_details || [],
              jatuh_details: notesData.jatuh_details || [],
              identifikasi_details: notesData.identifikasi_details || [],
              waktu_tunggu_details:
                notesData.waktu_tunggu_details || notesData.details || [],
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

  const allIndicators = useMemo(() => {
    let profiles = indicatorProfiles.map((p) => ({
      id: p.id,
      category: p.category,
      name: p.indicator_title,
      target: p.target,
      formattedTarget: formatTarget(p.target, p.measurement_unit, p.reverse),
      targetVal: parseFloat(String(p.target).replace(/[^0-9.]/g, "")) || 80,
      reverse: p.reverse,
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

  // Display states
  const [appliedFilters, setAppliedFilters] = useState({
    periode,
    bulan,
    triwulan,
    semester,
    tahun,
    kategori,
  });

  // Format number
  const formatNum = (num: number | undefined) => {
    if (num === undefined || isNaN(num)) return 0;
    return Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
  };

  // Detail Modal States
  const [selectedIndikatorDetail, setSelectedIndikatorDetail] = useState<
    any | null
  >(null);
  const [visiteDetails, setVisiteDetails] = useState<any[]>([]);
  const [waktuTungguDetails, setWaktuTungguDetails] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const selectedProfileData = useMemo(() => {
    return indicatorProfiles.find((p) => p.id === selectedIndikatorDetail?.id);
  }, [selectedIndikatorDetail, indicatorProfiles]);

  const activePeriodInputs = useMemo(() => {
    if (!selectedIndikatorDetail) return [];
    return dataMutuList
      .filter((d) => {
        if (d.indikator_id !== selectedIndikatorDetail.id) return false;
        const date = new Date(d.tanggal);
        const m = date.getMonth() + 1;
        const y = date.getFullYear().toString();

        if (y !== appliedFilters.tahun) return false;

        if (
          appliedFilters.periode === "Bulanan" &&
          date.getMonth().toString() !== appliedFilters.bulan
        )
          return false;
        if (appliedFilters.periode === "Triwulan") {
          if (appliedFilters.triwulan === "1" && m > 3) return false;
          if (appliedFilters.triwulan === "2" && (m < 4 || m > 6)) return false;
          if (appliedFilters.triwulan === "3" && (m < 7 || m > 9)) return false;
          if (appliedFilters.triwulan === "4" && m < 10) return false;
        }
        if (appliedFilters.periode === "Semester") {
          if (appliedFilters.semester === "1" && m > 6) return false;
          if (appliedFilters.semester === "2" && m < 7) return false;
        }
        return true;
      })
      .sort(
        (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
      );
  }, [dataMutuList, selectedIndikatorDetail, appliedFilters]);

  const inputsGroupedByUnit = useMemo(() => {
    const grouped: Record<string, DataMutuPayload[]> = {};
    activePeriodInputs.forEach((input) => {
      if (!grouped[input.unit]) {
        grouped[input.unit] = [];
      }
      grouped[input.unit].push(input);
    });
    return grouped;
  }, [activePeriodInputs]);

  const globalTotals = useMemo(() => {
    let num = 0,
      den = 0,
      kpc = 0,
      knc = 0,
      ktc = 0,
      ktd = 0,
      sentinel = 0;
    activePeriodInputs.forEach((u) => {
      num += Number(u.numerator) || 0;
      den += Number(u.denominator) || 0;
      kpc += Number(u.kpc) || 0;
      knc += Number(u.knc) || 0;
      ktc += Number(u.ktc) || 0;
      ktd += Number(u.ktd) || 0;
      sentinel += Number(u.sentinel) || 0;
    });

    let capaian = 0;
    let isTargetMet = false;
    let targetVal =
      parseFloat(
        String(selectedProfileData?.target || 0).replace(/[^0-9.]/g, ""),
      ) || 0;

    if (selectedProfileData) {
      const isPersen = selectedProfileData.measurement_unit === "Persen (%)";
      const isIndeks = selectedProfileData.measurement_unit === "Indeks";
      const multiplier = isIndeks ? 25 : isPersen ? 100 : 1;
      capaian = den > 0 ? (num / den) * multiplier : 0;
      isTargetMet = selectedProfileData.reverse
        ? capaian <= targetVal
        : capaian >= targetVal;
    } else if (activePeriodInputs.length > 0) {
      targetVal =
        parseFloat(
          String(activePeriodInputs[0].target || 0).replace(/[^0-9.]/g, ""),
        ) || 0;
      capaian = den > 0 ? (num / den) * 100 : 0; // Default fallback calculation
      isTargetMet = capaian >= targetVal;
    }

    // Previous Period Calculation
    let prevNum = 0,
      prevDen = 0,
      prevCapaian = 0;
    if (selectedIndikatorDetail && dataMutuList) {
      const prevInputs = dataMutuList.filter((d) => {
        if (d.indikator_id !== selectedIndikatorDetail.id) return false;
        const date = new Date(d.tanggal);
        const m = date.getMonth() + 1;
        const y = parseInt(date.getFullYear().toString());

        const currYear = parseInt(appliedFilters.tahun);

        if (appliedFilters.periode === "Bulanan") {
          const currMonth = parseInt(appliedFilters.bulan) + 1;
          const prevMonth = currMonth === 1 ? 12 : currMonth - 1;
          const targetYear = currMonth === 1 ? currYear - 1 : currYear;
          return m === prevMonth && y === targetYear;
        }
        if (appliedFilters.periode === "Triwulan") {
          const currTriwulan = parseInt(appliedFilters.triwulan);
          const prevTriwulan = currTriwulan === 1 ? 4 : currTriwulan - 1;
          const targetYear = currTriwulan === 1 ? currYear - 1 : currYear;
          if (y !== targetYear) return false;
          if (prevTriwulan === 1 && m <= 3) return true;
          if (prevTriwulan === 2 && m >= 4 && m <= 6) return true;
          if (prevTriwulan === 3 && m >= 7 && m <= 9) return true;
          if (prevTriwulan === 4 && m >= 10) return true;
          return false;
        }
        if (appliedFilters.periode === "Semester") {
          const currSemester = parseInt(appliedFilters.semester);
          const prevSemester = currSemester === 1 ? 2 : 1;
          const targetYear = currSemester === 1 ? currYear - 1 : currYear;
          if (y !== targetYear) return false;
          if (prevSemester === 1 && m <= 6) return true;
          if (prevSemester === 2 && m >= 7) return true;
          return false;
        }
        if (appliedFilters.periode === "Tahunan") {
          return y === currYear - 1;
        }
        return false;
      });

      prevInputs.forEach((u) => {
        prevNum += Number(u.numerator) || 0;
        prevDen += Number(u.denominator) || 0;
      });

      if (selectedProfileData) {
        const isPersen = selectedProfileData.measurement_unit === "Persen (%)";
        const isIndeks = selectedProfileData.measurement_unit === "Indeks";
        const multiplier = isIndeks ? 25 : isPersen ? 100 : 1;
        prevCapaian = prevDen > 0 ? (prevNum / prevDen) * multiplier : 0;
      }
    }

    const tren = prevDen > 0 ? capaian - prevCapaian : 0;

    return {
      num,
      den,
      kpc,
      knc,
      ktc,
      ktd,
      sentinel,
      capaian,
      targetVal,
      isTargetMet,
      tren,
      prevDen,
    };
  }, [
    activePeriodInputs,
    selectedProfileData,
    appliedFilters,
    dataMutuList,
    selectedIndikatorDetail,
  ]);

  const loadDetailData = async (indicator: any) => {
    // Check if it's visite docter
    if (indicator.name.toLowerCase().includes("visite")) {
      setIsDetailLoading(true);
      try {
        const { data, error } = await supabase
          .from("visite_dpjp")
          .select("*")
          .eq("indikator_id", indicator.id)
          .order("tanggal_visite", { ascending: true });
        if (data) setVisiteDetails(data);
      } catch (e) {}
      setIsDetailLoading(false);
    } else if (indicator.name.toLowerCase().includes("waktu tunggu")) {
      setIsDetailLoading(true);
      try {
        const { data, error } = await supabase
          .from("waktu_tunggu_rajal")
          .select("*")
          .eq("indikator_id", indicator.id)
          .order("tanggal", { ascending: true });
        if (data) setWaktuTungguDetails(data);
      } catch (e) {}
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedIndikatorDetail) return;

    let channel: any = null;

    if (selectedIndikatorDetail.name.toLowerCase().includes("visite")) {
      channel = supabase
        .channel("laporan-visite-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "visite_dpjp" },
          () => {
            loadDetailData(selectedIndikatorDetail);
          },
        )
        .subscribe();
    } else if (
      selectedIndikatorDetail.name.toLowerCase().includes("waktu tunggu")
    ) {
      channel = supabase
        .channel("laporan-waktu-tunggu-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "waktu_tunggu_rajal" },
          () => {
            loadDetailData(selectedIndikatorDetail);
          },
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedIndikatorDetail]);

  const handleOpenDetail = (indicator: any) => {
    setSelectedIndikatorDetail(indicator);
    loadDetailData(indicator);
  };

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

  const formattedMonthNames = [
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
  ];

  const getPeriodeText = () => {
    if (appliedFilters.periode === "Bulanan") {
      return `${formattedMonthNames[parseInt(appliedFilters.bulan)]} ${appliedFilters.tahun}`;
    }
    if (appliedFilters.periode === "Triwulan") {
      const label = ["I", "II", "III", "IV"][
        parseInt(appliedFilters.triwulan) - 1
      ];
      let range = "";
      if (appliedFilters.triwulan === "1") range = "Januari - Maret";
      if (appliedFilters.triwulan === "2") range = "April - Juni";
      if (appliedFilters.triwulan === "3") range = "Juli - September";
      if (appliedFilters.triwulan === "4") range = "Oktober - Desember";
      return `Triwulan ${label} (${range}) Tahun ${appliedFilters.tahun}`;
    }
    if (appliedFilters.periode === "Semester") {
      const label = ["I", "II"][parseInt(appliedFilters.semester) - 1];
      return `Semester ${label} Tahun ${appliedFilters.tahun}`;
    }
    if (appliedFilters.periode === "Tahunan") {
      return `Tahun ${appliedFilters.tahun}`;
    }
    return "";
  };

  const monthNames = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];
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
    setAppliedFilters({
      periode: "Triwulan",
      bulan: "0",
      triwulan: "1",
      semester: "1",
      tahun: new Date().getFullYear().toString(),
      kategori: "Mutu Keseluruhan",
    });
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

  const getCellData = (
    indikatorId: string,
    monthIndex: number,
    year: string,
  ) => {
    const records = dataMutuList.filter((d) => {
      const date = new Date(d.tanggal);
      return (
        d.indikator_id === indikatorId &&
        date.getMonth() === monthIndex &&
        date.getFullYear().toString() === year
      );
    });

    if (records.length === 0) return "-";

    const avgCapaian = parseFloat(
      (
        records.reduce((acc, curr) => acc + (curr.capaian || 0), 0) /
        records.length
      ).toFixed(2),
    );
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
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Periode
            </label>
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
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
              {periode === "Bulanan"
                ? "Pilih Bulan"
                : periode === "Triwulan"
                  ? "Pilih Triwulan"
                  : periode === "Semester"
                    ? "Pilih Semester"
                    : "Pilih Tahun"}
            </label>
            {periode === "Bulanan" && (
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            {periode === "Triwulan" && (
              <select
                value={triwulan}
                onChange={(e) => setTriwulan(e.target.value)}
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
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="1">Semester 1 (Jan-Jun)</option>
                <option value="2">Semester 2 (Jul-Des)</option>
              </select>
            )}
            {periode === "Tahunan" && (
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            )}
          </div>
          {periode !== "Tahunan" && (
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Tahun
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-4 py-3 bg-[#fafdfc] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none text-sm font-bold text-slate-800 transition-all appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Kategori
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
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
                <th className="py-4 px-6 font-extrabold text-xs text-center border-r border-[#10a37f]/20 w-16">
                  NO
                </th>
                <th className="py-4 px-6 font-extrabold text-xs tracking-wider uppercase">
                  INDIKATOR
                </th>
                <th className="py-4 px-6 font-extrabold text-xs text-center tracking-wider uppercase border-l border-[#10a37f]/20">
                  TARGET
                </th>
                {displayMonths.map((mIdx) => (
                  <th
                    key={mIdx}
                    className="py-4 px-6 font-extrabold text-xs text-center tracking-wider uppercase border-l border-[#10a37f]/20"
                  >
                    {monthNames[mIdx]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const categoryIndicators = allIndicators.filter(
                  (i) => i.category === cat,
                );
                if (categoryIndicators.length === 0) return null;

                // If filter specific category
                if (
                  appliedFilters.kategori !== "Mutu Keseluruhan" &&
                  appliedFilters.kategori !== cat
                )
                  return null;

                return (
                  <React.Fragment key={cat}>
                    {/* Category Header */}
                    <tr className="bg-emerald-50/50">
                      <td
                        colSpan={3 + displayMonths.length}
                        className="px-6 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-4 bg-[#10a37f] rounded-full"></div>
                          <span className="font-extrabold text-sm text-[#064e3b] tracking-wider uppercase">
                            {cat}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Indicators */}
                    {categoryIndicators.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors bg-white"
                      >
                        <td className="py-4 px-6 text-sm font-semibold text-gray-500 text-center">
                          {idx + 1}
                        </td>
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
                        <td className="py-4 px-6 text-slate-600 text-center text-sm font-semibold whitespace-nowrap">
                          {row.formattedTarget}
                        </td>

                        {displayMonths.map((mIdx) => {
                          const valStr = getCellData(
                            row.id,
                            mIdx,
                            appliedFilters.tahun,
                          );

                          let isTargetMet = false;
                          if (valStr !== "-") {
                            const numVal = parseFloat(valStr.replace("%", ""));
                            if (row.reverse) {
                              isTargetMet = numVal <= row.targetVal;
                            } else {
                              isTargetMet = numVal >= row.targetVal;
                            }
                          }

                          return (
                            <td key={mIdx} className="py-4 px-6 text-center">
                              {valStr === "-" ? (
                                <span className="inline-block w-8 h-8 rounded-lg bg-gray-50 text-gray-400 font-bold leading-8 text-sm border border-gray-100 shadow-sm">
                                  -
                                </span>
                              ) : (
                                <span
                                  className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${
                                    isTargetMet
                                      ? "bg-emerald-50 text-[#10a37f] border-emerald-100"
                                      : "bg-[#fffbeb] text-[#d97706] border-[#fde68a]"
                                  }`}
                                >
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
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-100/50 flex items-center justify-center border border-emerald-200 shrink-0">
                  <BookOpen className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-tight">
                    Detail Riwayat Input Indikator
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700/80 mt-0.5">
                    {selectedIndikatorDetail.name} •{" "}
                    {selectedIndikatorDetail.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                <div className="flex items-center gap-2.5 bg-white border border-emerald-500/20 px-4 py-2.5 rounded-2xl shadow-sm text-sm font-bold text-slate-800 shrink-0">
                  <Calendar size={18} className="text-[#10a37f]" />
                  <span>{getPeriodeText()}</span>
                </div>
                <button
                  onClick={() => setSelectedIndikatorDetail(null)}
                  className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-slate-600 bg-white border border-gray-100 shadow-sm ml-auto md:ml-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Detail Data Table */}
              {isDetailLoading ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 animate-pulse flex flex-col items-center justify-center gap-2">
                  <Activity className="animate-spin text-[#10a37f]" size={24} />
                  <p className="text-xs font-bold text-slate-500">
                    Memuat rincian data...
                  </p>
                </div>
              ) : Object.keys(inputsGroupedByUnit).length > 0 ? (
                <div className="space-y-12 pb-4">
                  {Object.entries(inputsGroupedByUnit).map(
                    ([unitName, unitInputs], idx) => {
                      // Calculate totals for this unit
                      let totalNum = 0;
                      let totalDen = 0;
                      let totalKpc = 0,
                        totalKnc = 0,
                        totalKtc = 0,
                        totalKtd = 0,
                        totalSentinel = 0;

                      unitInputs.forEach((u) => {
                        totalNum += Number(u.numerator) || 0;
                        totalDen += Number(u.denominator) || 0;
                        totalKpc += Number(u.kpc) || 0;
                        totalKnc += Number(u.knc) || 0;
                        totalKtc += Number(u.ktc) || 0;
                        totalKtd += Number(u.ktd) || 0;
                        totalSentinel += Number(u.sentinel) || 0;
                      });

                      const isPersen =
                        selectedProfileData?.measurement_unit === "Persen (%)";
                      const isIndeks =
                        selectedProfileData?.measurement_unit === "Indeks";
                      const formulaMultiplier = isIndeks
                        ? 25
                        : isPersen
                          ? 100
                          : 1;

                      // recalculate capaian based on formula type
                      const capaian =
                        totalDen > 0
                          ? (totalNum / totalDen) * formulaMultiplier
                          : 0;
                      const targetVal =
                        parseFloat(
                          String(
                            selectedProfileData?.target ||
                              unitInputs[0]?.target ||
                              0,
                          ).replace(/[^0-9.]/g, ""),
                        ) || 0;

                      // reverse logic
                      let isTargetMet = false;
                      if (selectedProfileData?.reverse) {
                        isTargetMet = capaian <= targetVal;
                      } else {
                        isTargetMet = capaian >= targetVal;
                      }

                      // Fetch Waktu Tunggu Detaisl
                      let activeWaktuTungguFiltered = unitInputs.flatMap(
                        (u) => u.waktu_tunggu_details || [],
                      );

                      if (
                        activeWaktuTungguFiltered.length === 0 &&
                        waktuTungguDetails.length > 0
                      ) {
                        const validDates = unitInputs.map((u) =>
                          u.tanggal.substring(0, 10),
                        );
                        activeWaktuTungguFiltered = waktuTungguDetails.filter(
                          (wd) => {
                            return (
                              wd.tanggal &&
                              validDates.some((vd) => wd.tanggal.startsWith(vd))
                            );
                          },
                        );
                      }

                      // Fetch Visite
                      let activeVisiteFiltered = visiteDetails.filter((vd) => {
                        const validDates = unitInputs.map((u) =>
                          u.tanggal.substring(0, 10),
                        );
                        return (
                          vd.tanggal_visite &&
                          validDates.some((vd_d) =>
                            vd.tanggal_visite.startsWith(vd_d),
                          )
                        );
                      });
                      if (activeVisiteFiltered.length === 0) {
                        activeVisiteFiltered = unitInputs.flatMap(
                          (u) => u.visite_details || [],
                        );
                      }

                      // Fetch Risiko Jatuh
                      let activeJatuhFiltered = unitInputs.flatMap(
                        (u) => u.jatuh_details || [],
                      );

                      // Fetch Identifikasi
                      let activeIdentifikasiFiltered = unitInputs.flatMap(
                        (u) => {
                          if (!u.identifikasi_details) return [];
                          const flat: any[] = [];
                          u.identifikasi_details.forEach(pasien => {
                            if (pasien.moments) {
                              Object.entries(pasien.moments).forEach(([momentName, momentData]) => {
                                if (momentData.aktif) {
                                  flat.push({
                                    ...pasien,
                                    moment: momentName,
                                    petugas: momentData.petugas,
                                    lokasi: momentData.lokasi,
                                    patuh: momentData.patuh,
                                  });
                                }
                              });
                            }
                          });
                          return flat;
                        }
                      );

                      return (
                        <div key={unitName} className="space-y-6">
                          {/* Unit Section Header */}
                          <div className="flex items-center gap-3 pl-4 border-l-4 border-[#059669] py-2 mb-2 bg-[#f8fafc] rounded-r-xl shadow-xs">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                              UNIT : {unitName}
                            </h3>
                          </div>

                          {/* Table Container */}
                          {selectedIndikatorDetail.name
                            .toLowerCase()
                            .includes("visite") ? (
                            <div className="bg-white border border-[#10a37f]/20 rounded-2xl overflow-hidden shadow-xs">
                              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                                  <thead className="sticky top-0 bg-[#059669] text-white h-11 select-none">
                                    <tr>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        Tanggal Visite
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        Nama Pasien No-RM
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        ≤ 14.00 (Tepat)
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        &gt; 14.00 (Terlambat)
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        Dokter DPJP
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        Keterangan
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeVisiteFiltered.length > 0 ? (
                                      activeVisiteFiltered.map((v, i) => {
                                        const tanggalStr =
                                          v.tanggal || v.tanggal_visite;
                                        const tepat =
                                          v.jam_visite_kurang_14 ??
                                          v.visite_sebelum_14;
                                        const lambat =
                                          v.jam_visite_lebih_14 ??
                                          v.visite_setelah_14;
                                        const dokter =
                                          v.dokter_visite ||
                                          v.nama_dokter ||
                                          "-";
                                        return (
                                          <tr
                                            key={v.id || i}
                                            className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                                          >
                                            <td className="px-4 py-3 text-slate-600 font-semibold">
                                              {tanggalStr &&
                                                new Date(
                                                  tanggalStr,
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-bold">
                                              {v.nama_pasien}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              {tepat ? (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-150/40 text-emerald-800 text-xs font-black">
                                                  ✓
                                                </span>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              {lambat ? (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-150/40 text-red-800 text-xs font-black">
                                                  ✗
                                                </span>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 font-bold">
                                              {dokter}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-medium">
                                              {v.keterangan || "-"}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan={6}
                                          className="text-center py-8 text-slate-400 font-bold bg-slate-50/50"
                                        >
                                          Tidak ada rincian data observasi di
                                          database untuk unit ini.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : selectedIndikatorDetail.name
                              .toLowerCase()
                              .includes("waktu tunggu") ? (
                            <div className="bg-white border border-[#10a37f]/20 rounded-2xl overflow-hidden shadow-xs">
                              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                                  <thead className="sticky top-0 bg-[#059669] text-white h-11 select-none">
                                    <tr>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        NO
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        TANGGAL
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        NAMA PASIEN
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        NO RM
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        JAM DATANG
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        JAM PEMERIKSAAN
                                        <br />
                                        DOKTER
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        SELISIH WAKTU
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeWaktuTungguFiltered.length > 0 ? (
                                      activeWaktuTungguFiltered.map((v, i) => {
                                        const hours = Math.floor(
                                          v.selisih_menit / 60,
                                        );
                                        const minutes = v.selisih_menit % 60;
                                        const isStandar =
                                          v.memenuhi_standar !== undefined
                                            ? v.memenuhi_standar
                                            : v.selisih_menit <= 60;

                                        return (
                                          <tr
                                            key={v.id || i}
                                            className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                                          >
                                            <td className="px-4 py-3 text-slate-600 font-semibold text-center">
                                              {i + 1}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 font-semibold">
                                              {v.tanggal &&
                                                new Date(
                                                  v.tanggal,
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-bold">
                                              {v.nama_pasien}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-semibold">
                                              {v.no_rm}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                              {v.jam_datang}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                              {v.jam_dilayani}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">
                                              <span
                                                className={`${isStandar ? "text-[#059669]" : "text-red-600"} text-[11px]`}
                                              >
                                                {hours > 0
                                                  ? `${hours} Jam `
                                                  : ""}
                                                {minutes} Menit
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan={7}
                                          className="text-center py-8 text-slate-400 font-bold bg-slate-50/50"
                                        >
                                          Tidak ada data pasien di tabulasi
                                          database untuk periode ini.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : selectedIndikatorDetail.name
                              .toLowerCase()
                              .includes("jatuh") ? (
                            <div className="bg-white border border-[#10a37f]/20 rounded-2xl overflow-hidden shadow-xs">
                              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                                  <thead className="sticky top-0 bg-[#059669] text-white h-11 select-none">
                                    <tr>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        NO
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        NAMA PASIEN
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
                                        NO RM
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        ASESMEN AWAL
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        ASESMEN ULANG
                                      </th>
                                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px] text-center">
                                        INTERVENSI
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeJatuhFiltered.length > 0 ? (
                                      activeJatuhFiltered.map((v, i) => (
                                        <tr
                                          key={v.id || i}
                                          className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                                        >
                                          <td className="px-4 py-3 text-slate-600 font-semibold text-center">
                                            {i + 1}
                                          </td>
                                          <td className="px-4 py-3 text-slate-800 font-bold">
                                            {v.nama_pasien}
                                          </td>
                                          <td className="px-4 py-3 text-slate-800 font-semibold">
                                            {v.no_rm}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            {v.asesmen_awal === null ? (
                                              "-"
                                            ) : v.asesmen_awal ? (
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-150/40 text-emerald-800 text-xs font-black">
                                                ✓
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-150/40 text-red-800 text-xs font-black">
                                                ✗
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            {v.asesmen_ulang === null ? (
                                              "-"
                                            ) : v.asesmen_ulang ? (
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-150/40 text-emerald-800 text-xs font-black">
                                                ✓
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-150/40 text-red-800 text-xs font-black">
                                                ✗
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            {v.intervensi === null ? (
                                              "-"
                                            ) : v.intervensi ? (
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-150/40 text-emerald-800 text-xs font-black">
                                                ✓
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-150/40 text-red-800 text-xs font-black">
                                                ✗
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan={6}
                                          className="text-center py-8 text-slate-400 font-bold bg-slate-50/50"
                                        >
                                          Tidak ada data observasi risiko jatuh
                                          untuk periode ini.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : selectedIndikatorDetail.name
                              .toLowerCase()
                              .includes("identifikasi pasien") ? (
                            <div className="bg-white border text-left border-gray-200 rounded-2xl shadow-sm overflow-x-auto w-full">
                              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                                <thead className="bg-[#059669] text-white select-none">
                                  <tr>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-center w-12 rounded-tl-xl border-r border-[#047857]">
                                      NO
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-[#047857]">
                                      HARI/TANGGAL
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-[#047857]">
                                      JAM
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-[#047857]">
                                      NAMA OBSERVER
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-[#047857]">
                                      LOKASI
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-[#047857]">
                                      PROFESI/PETUGAS
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider border-r border-[#047857]">
                                      MOMEN (1-9)
                                    </th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-center border-r border-[#047857]">
                                      KEPATUHAN
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeIdentifikasiFiltered.length > 0 ? (
                                    activeIdentifikasiFiltered.map((v, i) => (
                                      <tr
                                        key={v.id || i}
                                        className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                                      >
                                        <td className="px-4 py-3 text-slate-600 font-semibold text-center">
                                          {i + 1}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-semibold">
                                          {v.tanggal_observasi
                                            ? new Date(
                                                v.tanggal_observasi,
                                              ).toLocaleDateString("id-ID")
                                            : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-semibold">
                                          {v.jam_observasi || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-800 font-semibold">
                                          {v.nama_observer || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-800 font-semibold">
                                          {v.lokasi || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-800 font-semibold">
                                          {v.petugas || "-"}
                                        </td>
                                        <td
                                          className="px-4 py-3 text-slate-500 font-medium max-w-[200px] truncate"
                                          title={v.moment}
                                        >
                                          {v.moment || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {v.patuh === true ? (
                                            <span className="inline-flex items-center justify-center bg-emerald-150/40 text-emerald-800 text-xs font-black px-2 py-1 rounded-md">
                                              PATUH
                                            </span>
                                          ) : v.patuh === false ? (
                                            <span className="inline-flex items-center justify-center bg-red-150/40 text-red-800 text-xs font-black px-2 py-1 rounded-md">
                                              TIDAK PATUH
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={8}
                                        className="text-center py-8 text-slate-400 font-bold bg-slate-50/50"
                                      >
                                        Tidak ada data observasi kepatuhan
                                        identifikasi pasien untuk periode ini.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          ) : selectedIndikatorDetail.category === "IKP" ? (
                            <div className="bg-white border border-gray-205 rounded-2xl overflow-hidden shadow-xs flex flex-col md:flex-row">
                              <div className="bg-rose-50 px-5 py-5 md:w-52 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-rose-100/50 select-none">
                                <p className="text-[10px] font-black tracking-widest text-[#991b1b] uppercase">
                                  TOTAL IKP
                                </p>
                                <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md mt-1">
                                  Pada Unit Ini
                                </span>
                              </div>
                              <div className="flex-1 w-full overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead className="bg-[#fffdfd] border-b border-gray-150 select-none">
                                    <tr>
                                      <th className="px-5 py-3 font-black text-slate-500 text-center uppercase tracking-wider text-[10px]">
                                        KPC
                                      </th>
                                      <th className="px-5 py-3 font-black text-slate-500 text-center uppercase tracking-wider text-[10px]">
                                        KNC
                                      </th>
                                      <th className="px-5 py-3 font-black text-slate-500 text-center uppercase tracking-wider text-[10px]">
                                        KTC
                                      </th>
                                      <th className="px-5 py-3 font-black text-rose-600 text-center uppercase tracking-wider text-[10px]">
                                        KTD
                                      </th>
                                      <th className="px-5 py-3 font-black text-rose-600 text-center uppercase tracking-wider text-[10px]">
                                        Sentinel
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="hover:bg-slate-50/20">
                                      <td className="px-5 py-5 text-slate-800 font-black text-center text-xl bg-slate-50/40">
                                        {totalKpc}
                                      </td>
                                      <td className="px-5 py-5 text-slate-800 font-black text-center text-xl">
                                        {totalKnc}
                                      </td>
                                      <td className="px-5 py-5 text-slate-800 font-black text-center text-xl bg-slate-50/40">
                                        {totalKtc}
                                      </td>
                                      <td className="px-5 py-5 text-rose-600 font-black text-center text-xl">
                                        {totalKtd}
                                      </td>
                                      <td className="px-5 py-5 text-rose-600 font-black text-center text-xl bg-slate-50/40">
                                        {totalSentinel}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                              <div className="w-full overflow-x-auto max-h-[350px]">
                                <table className="w-full text-center text-xs border-collapse min-w-[700px]">
                                  <thead className="sticky top-0 bg-[#059669] text-white h-11 select-none">
                                    <tr>
                                      <th className="px-5 py-3 font-bold uppercase text-[10px] w-[15%] text-center align-middle">
                                        Tanggal
                                      </th>
                                      <th className="px-5 py-3 font-bold uppercase text-[10px] w-[20%] text-center align-middle">
                                        Unit
                                      </th>
                                      <th className="px-5 py-3 font-bold uppercase text-[10px] w-[15%] text-center align-middle">
                                        Numerator
                                      </th>
                                      <th className="px-5 py-3 font-bold uppercase text-[10px] w-[15%] text-center align-middle">
                                        Denominator
                                      </th>
                                      <th className="px-5 py-3 font-bold uppercase text-[10px] w-[15%] text-center align-middle">
                                        Target
                                      </th>
                                      <th className="px-5 py-3 font-bold uppercase text-[10px] w-[20%] text-center align-middle">
                                        Capaian
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {unitInputs.map((u, i) => {
                                      const uTarget =
                                        parseFloat(
                                          String(
                                            selectedProfileData?.target ||
                                              u.target ||
                                              0,
                                          ).replace(/[^0-9.]/g, ""),
                                        ) || 0;
                                      const uCapaian = Number(u.capaian);
                                      let statusBadge = null;
                                      if (selectedProfileData?.reverse) {
                                        if (uCapaian <= uTarget) {
                                          statusBadge = (
                                            <div className="mt-1 flex justify-center">
                                              <span className="text-[9px] px-2 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-md whitespace-nowrap">
                                                🟢 Target Tercapai
                                              </span>
                                            </div>
                                          );
                                        } else if (uCapaian - uTarget <= 5) {
                                          statusBadge = (
                                            <div className="mt-1 flex justify-center">
                                              <span className="text-[9px] px-2 py-1 bg-yellow-100 text-yellow-700 font-bold rounded-md whitespace-nowrap">
                                                🟡 Mendekati Target
                                              </span>
                                            </div>
                                          );
                                        } else {
                                          statusBadge = (
                                            <div className="mt-1 flex justify-center">
                                              <span className="text-[9px] px-2 py-1 bg-red-100 text-red-700 font-bold rounded-md whitespace-nowrap">
                                                🔴 Belum Tercapai
                                              </span>
                                            </div>
                                          );
                                        }
                                      } else {
                                        if (uCapaian >= uTarget) {
                                          statusBadge = (
                                            <div className="mt-1 flex justify-center">
                                              <span className="text-[9px] px-2 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-md whitespace-nowrap">
                                                🟢 Target Tercapai
                                              </span>
                                            </div>
                                          );
                                        } else if (uTarget - uCapaian <= 5) {
                                          statusBadge = (
                                            <div className="mt-1 flex justify-center">
                                              <span className="text-[9px] px-2 py-1 bg-yellow-100 text-yellow-700 font-bold rounded-md whitespace-nowrap">
                                                🟡 Mendekati Target
                                              </span>
                                            </div>
                                          );
                                        } else {
                                          statusBadge = (
                                            <div className="mt-1 flex justify-center">
                                              <span className="text-[9px] px-2 py-1 bg-red-100 text-red-700 font-bold rounded-md whitespace-nowrap">
                                                🔴 Belum Tercapai
                                              </span>
                                            </div>
                                          );
                                        }
                                      }
                                      return (
                                        <tr
                                          key={u.id || i}
                                          className="hover:bg-slate-50/40 border-b border-gray-50"
                                        >
                                          <td className="px-5 py-4 text-slate-600 font-bold text-center align-middle whitespace-nowrap">
                                            {new Date(
                                              u.tanggal,
                                            ).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </td>
                                          <td className="px-5 py-4 text-slate-800 font-bold text-center align-middle">
                                            {u.unit || unitName}
                                          </td>
                                          <td className="px-5 py-4 text-slate-800 font-black text-center align-middle text-sm">
                                            {formatNum(u.numerator)}
                                          </td>
                                          <td className="px-5 py-4 text-slate-800 font-black text-center align-middle text-sm">
                                            {formatNum(u.denominator)}
                                          </td>
                                          <td className="px-5 py-4 text-slate-500 font-bold text-center align-middle text-xs">
                                            {selectedProfileData?.reverse
                                              ? "≤"
                                              : "≥"}{" "}
                                            {uTarget}%
                                          </td>
                                          <td className="px-5 py-4 font-black text-center align-middle">
                                            <div className="text-sm text-slate-800">
                                              {formatNum(uCapaian)}%
                                            </div>
                                            {statusBadge}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}

                  {/* Integrated Global Recap Card */}
                  {selectedIndikatorDetail.category !== "IKP" &&
                    activePeriodInputs.length > 0 && (
                      <div className="pt-8 border-t border-gray-100 flex flex-col items-center mt-6 gap-8">
                        <div className="w-full max-w-4xl bg-white border border-emerald-100/60 rounded-[32px] shadow-[0_8px_32px_-12px_rgba(16,163,127,0.15)] overflow-hidden transition-all hover:shadow-[0_16px_48px_-12px_rgba(16,163,127,0.25)] group relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-emerald-50/30 opacity-50 z-0 pointer-events-none"></div>
                          <div className="relative z-10">
                            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 py-5 px-8 text-center flex items-center justify-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                <TrendingUp size={16} />
                              </div>
                              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                REKAPITULASI CAPAIAN INDIKATOR TERINTEGRASI
                              </h3>
                            </div>
                            <div className="p-8 md:p-12 flex flex-col items-center">
                              {/* Numerator & Denominator Modules */}
                              <div className="flex flex-col md:flex-row justify-center w-full gap-6 md:gap-16 mb-12">
                                <div className="flex-1 flex flex-col items-center p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100/50">
                                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 shadow-sm">
                                    Total Numerator
                                  </span>
                                  <span className="text-4xl md:text-5xl font-black text-slate-800">
                                    {formatNum(globalTotals.num)}
                                  </span>
                                </div>
                                <div className="flex-1 flex flex-col items-center p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100/50">
                                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 shadow-sm">
                                    Total Denominator
                                  </span>
                                  <span className="text-4xl md:text-5xl font-black text-slate-800">
                                    {formatNum(globalTotals.den)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-center text-center relative w-full">
                                <span className="text-sm rounded-full px-4 py-1.5 bg-slate-100 text-slate-600 font-bold uppercase tracking-widest mb-4 shadow-sm border border-slate-200/50">
                                  Target{" "}
                                  {selectedProfileData?.reverse ? "≤" : "≥"}{" "}
                                  {globalTotals.targetVal}%
                                </span>

                                <div className="relative flex items-center justify-center">
                                  <span
                                    className={`text-[90px] md:text-[120px] font-black leading-none tracking-tighter ${
                                      globalTotals.isTargetMet
                                        ? "text-[#10a37f]"
                                        : selectedProfileData?.reverse
                                          ? globalTotals.capaian -
                                              globalTotals.targetVal <=
                                            5
                                            ? "text-yellow-500"
                                            : "text-red-500"
                                          : globalTotals.targetVal -
                                                globalTotals.capaian <=
                                              5
                                            ? "text-yellow-500"
                                            : "text-red-500"
                                    }`}
                                  >
                                    {formatNum(globalTotals.capaian)}
                                    <span className="text-5xl md:text-6xl">
                                      %
                                    </span>
                                  </span>
                                </div>

                                <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
                                  <span
                                    className={`px-8 py-3 rounded-2xl text-sm font-black tracking-widest uppercase shadow-sm ${
                                      globalTotals.isTargetMet
                                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                        : selectedProfileData?.reverse
                                          ? globalTotals.capaian -
                                              globalTotals.targetVal <=
                                            5
                                            ? "bg-yellow-500 text-white shadow-yellow-500/20"
                                            : "bg-red-500 text-white shadow-red-500/20"
                                          : globalTotals.targetVal -
                                                globalTotals.capaian <=
                                              5
                                            ? "bg-yellow-500 text-white shadow-yellow-500/20"
                                            : "bg-red-500 text-white shadow-red-500/20"
                                    }`}
                                  >
                                    {globalTotals.isTargetMet
                                      ? "🟢 TARGET TERCAPAI"
                                      : selectedProfileData?.reverse
                                        ? globalTotals.capaian -
                                            globalTotals.targetVal <=
                                          5
                                          ? "🟡 MENDEKATI TARGET"
                                          : "🔴 BELUM TERCAPAI"
                                        : globalTotals.targetVal -
                                              globalTotals.capaian <=
                                            5
                                          ? "🟡 MENDEKATI TARGET"
                                          : "🔴 BELUM TERCAPAI"}
                                  </span>

                                  {globalTotals.prevDen > 0 && (
                                    <div className="flex flex-col items-center justify-center px-6 py-2 rounded-2xl bg-slate-50 border border-slate-100">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Tren Periode Lali
                                      </span>
                                      <div
                                        className={`flex items-center gap-1 font-black ${globalTotals.tren > 0 ? "text-emerald-500" : globalTotals.tren < 0 ? "text-red-500" : "text-slate-500"}`}
                                      >
                                        {globalTotals.tren > 0
                                          ? "▲"
                                          : globalTotals.tren < 0
                                            ? "▼"
                                            : "—"}{" "}
                                        {globalTotals.tren > 0 ? "+" : ""}
                                        {formatNum(globalTotals.tren)}%
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                        {globalTotals.tren > 0
                                          ? "Naik"
                                          : globalTotals.tren < 0
                                            ? "Turun"
                                            : "Sama"}{" "}
                                        dibanding sebelumnya
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50/80 backdrop-blur-sm border-t border-gray-100 p-6 md:px-12 flex flex-wrap justify-center md:justify-between gap-6 md:gap-4 text-center text-xs font-bold text-slate-600">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                                  Periode
                                </span>
                                <span>{getPeriodeText()}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                                  Kategori
                                </span>
                                <span>{selectedIndikatorDetail.category}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                                  Unit Berpartisipasi
                                </span>
                                <span>
                                  {Object.keys(inputsGroupedByUnit).length} Unit
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                                  Data Observasi
                                </span>
                                <span>{formatNum(globalTotals.den)} Data</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-400">
                    Belum ada data input pada filter periode yang terpilih.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
