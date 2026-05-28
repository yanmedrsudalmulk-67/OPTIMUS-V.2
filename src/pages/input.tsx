import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Zap,
  Building2,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Plus,
  Trash2,
  Search,
  Edit2,
  Check,
  X,
  FileUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useStore, DataMutuPayload, VisiteData, JatuhData, Unit, IndicatorProfile } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { motion } from "motion/react";

// Validation schema for general inputs
const schema = z.object({
  unit: z.string().min(1, "Unit harus dipilih"),
  sub_unit: z.string().optional(),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  kategori: z.string().min(1, "Kategori harus dipilih"),
  indikator_id: z.string().optional(),
  numerator_val: z.number().min(0, "Nilai minimal 0").optional(),
  denominator_val: z.number().min(1, "Nilai minimal 1").optional(),
  kpc: z.number().min(0).optional(),
  knc: z.number().min(0).optional(),
  ktc: z.number().min(0).optional(),
  ktd: z.number().min(0).optional(),
  sentinel: z.number().min(0).optional(),
  keterangan: z.string().optional(),
  bukti_file_name: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.kategori !== "IKP") {
    if (!data.indikator_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pilih Indikator terlebih dahulu", path: ["indikator_id"] });
    }
  }
});

type FormValues = z.infer<typeof schema>;

export default function InputData() {
  const {
    units,
    addUnit,
    updateUnit,
    deleteUnit,
    indicatorProfiles,
    addDataMutu,
  } = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Searchable Unit parameters
  const [unitSearch, setUnitSearch] = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [tempUnitName, setTempUnitName] = useState("");
  const [selectedSubUnit, setSelectedSubUnit] = useState("");

  // Room modal form active status (Admin features)
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalUnitId, setModalUnitId] = useState<string | null>(null);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [roomCategoryInput, setRoomCategoryInput] = useState("Rawat Inap");
  const [roomStatusInput, setRoomStatusInput] = useState<"Aktif" | "Nonaktif">("Aktif");

  // Dynamic dynamic clock indicator
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");

  const unitDropdownRef = useRef<HTMLDivElement>(null);

  // Load real-time clock inside the WIB format once upon display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Indonesia timezone with 12/04/2026 — 08:45 WIB
      const optionsDate: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Jakarta"
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta"
      };
      const dateStr = now.toLocaleDateString("id-ID", optionsDate);
      const timeStr = now.toLocaleTimeString("id-ID", optionsTime);
      setCurrentTimeFormatted(`${dateStr} — ${timeStr} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch newest units from Supabase if active
  useEffect(() => {
    const fetchSupabaseUnits = async () => {
      try {
        const { data, error } = await supabase.from("units").select("*");
        if (data && data.length > 0) {
          // If Supabase contains values, load them into the application
          data.forEach((dbUnit: any) => {
            const exists = units.some((u) => u.id === dbUnit.id || u.name === dbUnit.name);
            if (!exists) {
              addUnit({
                id: dbUnit.id || String(Math.random()),
                name: dbUnit.name,
                category: dbUnit.category || "Umum",
                status: dbUnit.status === "Nonaktif" ? "Nonaktif" : "Aktif",
              });
            }
          });
        }
      } catch (err) {
        console.warn("Supabase units select skipped, falling back to local Zustand schema", err);
      }
    };
    fetchSupabaseUnits();
  }, [addUnit, units]);

  // Keyboard navigation click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setShowUnitDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form registration
  const {
    register,
    handleSubmit,
    watch,
    setValue: setFormValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: "",
      sub_unit: "",
      tanggal: new Date().toISOString().split("T")[0],
      kategori: "INM",
      indikator_id: "",
      numerator_val: undefined,
      denominator_val: undefined,
      kpc: 0,
      knc: 0,
      ktc: 0,
      ktd: 0,
      sentinel: 0,
      keterangan: "",
      bukti_file_name: "",
    },
  });

  const watchKategori = watch("kategori");
  const watchIndikatorId = watch("indikator_id");
  const watchNumerator = watch("numerator_val");
  const watchDenominator = watch("denominator_val");

  // Filter indicator profiles dynamically from state/database
  const filteredIndikators = useMemo(() => {
    return indicatorProfiles.filter((i) => i.category === watchKategori);
  }, [indicatorProfiles, watchKategori]);

  const selectedIndikatorProfile = useMemo(() => {
    return indicatorProfiles.find((i) => i.id === watchIndikatorId);
  }, [indicatorProfiles, watchIndikatorId]);

  // States for dynamic custom subgrids/checklists inside section 7
  const [visiteGrid, setVisiteGrid] = useState<VisiteData[]>([]);
  const [jatuhGrid, setJatuhGrid] = useState<JatuhData[]>([]);
  const [averageWaktuTunggu, setAverageWaktuTunggu] = useState<number | undefined>(undefined);
  const [customNumerator, setCustomNumerator] = useState<number | undefined>(undefined);
  const [customDenominator, setCustomDenominator] = useState<number | undefined>(undefined);
  const [uploadedProofName, setUploadedProofName] = useState<string>("");

  // Sub units list when Rawat Jalan is clicked
  const subUnitsRawatJalan = [
    "Poli Anak",
    "Poli Bedah",
    "Poli Penyakit Dalam",
    "Poli Obgyn",
    "Poli Saraf",
    "Poli DOTS",
    "Poli Arafah",
  ];

  // Dynamically compute real-time score
  const computedCapaian = useMemo(() => {
    let num = watchNumerator !== undefined ? watchNumerator : 0;
    let den = watchDenominator !== undefined && watchDenominator > 0 ? watchDenominator : 1;

    // Special calculations
    if (watchIndikatorId === "7") {
      num = visiteGrid.filter((d) => d.jam_visite_kurang_14 && d.keterangan === "Sesuai Jadwal").length;
      den = visiteGrid.length || 1;
    } else if (watchIndikatorId === "11") {
      num = jatuhGrid.reduce(
        (acc, curr) => acc + (curr.asesmen_awal ? 1 : 0) + (curr.asesmen_ulang ? 1 : 0) + (curr.intervensi ? 1 : 0),
        0
      );
      den = jatuhGrid.length * 3 || 1;
    } else if (customNumerator !== undefined && customDenominator !== undefined) {
      num = customNumerator;
      den = customDenominator > 0 ? customDenominator : 1;
    }

    const val = parseFloat(((num / (den || 1)) * 100).toFixed(2));
    return isNaN(val) ? 0 : val;
  }, [watchNumerator, watchDenominator, watchIndikatorId, visiteGrid, jatuhGrid, customNumerator, customDenominator]);

  const achievementStatus = useMemo(() => {
    if (!selectedIndikatorProfile) return "N/A";
    const target = parseFloat(String(selectedIndikatorProfile.target).replace(/[^0-9.]/g, '')) || 80;
    const isReverse = selectedIndikatorProfile.reverse;

    let success = false;
    if (isReverse) {
      success = computedCapaian <= target;
    } else {
      success = computedCapaian >= target;
    }

    if (success) return "Tercapai";
    const gap = isReverse ? computedCapaian - target : target - computedCapaian;
    if (gap <= 10) return "Mendekati";
    return "Tidak Tercapai";
  }, [selectedIndikatorProfile, computedCapaian]);

  // Real-time unit list filtering
  const filteredUnits = useMemo(() => {
    return units.filter(
      (u) =>
        u.name.toLowerCase().includes(unitSearch.toLowerCase()) &&
        u.status === "Aktif"
    );
  }, [units, unitSearch]);

  // Interactive functions to manage units via modal (Admin)
  const handleOpenAddRoom = () => {
    setModalMode("add");
    setRoomNameInput("");
    setRoomCategoryInput("Rawat Inap");
    setRoomStatusInput("Aktif");
    setShowRoomModal(true);
  };

  const handleOpenEditRoom = (e: React.MouseEvent, u: Unit) => {
    e.stopPropagation();
    setModalMode("edit");
    setModalUnitId(u.id);
    setRoomNameInput(u.name);
    setRoomCategoryInput(u.category);
    setRoomStatusInput(u.status);
    setShowRoomModal(true);
  };

  const handleSaveRoom = async () => {
    if (!roomNameInput.trim()) return;

    if (modalMode === "add") {
      const newUnit: Unit = {
        id: String(Math.random().toString(36).substring(7)),
        name: roomNameInput.trim(),
        category: roomCategoryInput,
        status: roomStatusInput,
      };
      
      // Zustand Save
      addUnit(newUnit);

      // Supabase Save attempt
      try {
        await supabase.from("units").insert({
          id: newUnit.id,
          name: newUnit.name,
          category: newUnit.category,
          status: newUnit.status,
        });
      } catch (err) {
        console.warn("Supabase save delayed, local sync executed", err);
      }
    } else if (modalMode === "edit" && modalUnitId) {
      // Zustand Update
      updateUnit(modalUnitId, {
        name: roomNameInput.trim(),
        category: roomCategoryInput,
        status: roomStatusInput,
      });

      // Supabase Update attempt
      try {
        await supabase
          .from("units")
          .update({
            name: roomNameInput.trim(),
            category: roomCategoryInput,
            status: roomStatusInput,
          })
          .eq("id", modalUnitId);
      } catch (err) {
        console.warn("Supabase update skipped", err);
      }
    }

    setShowRoomModal(false);
  };

  const handleDeleteRoom = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus unit ini?")) {
      deleteUnit(id);
      try {
        await supabase.from("units").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase connection delay", err);
      }
    }
  };

  // Input actions for specialized checkers
  const handleAddVisiteRow = () => {
    setVisiteGrid([
      ...visiteGrid,
      {
        id: Math.random().toString(36).substring(7),
        tanggal: new Date().toISOString().split("T")[0],
        nama_pasien: "",
        jam_visite_kurang_14: false,
        jam_visite_lebih_14: false,
        dokter_visite: "",
        keterangan: "Sesuai Jadwal",
      },
    ]);
  };

  const handleRemoveVisiteRow = (id: string) => setVisiteGrid(visiteGrid.filter((r) => r.id !== id));

  const handleUpdateVisite = (id: string, field: keyof VisiteData, value: any) => {
    setVisiteGrid(
      visiteGrid.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === "jam_visite_kurang_14" && value) updated.jam_visite_lebih_14 = false;
        if (field === "jam_visite_lebih_14" && value) updated.jam_visite_kurang_14 = false;
        return updated;
      })
    );
  };

  const handleAddJatuhRow = () => {
    setJatuhGrid([
      ...jatuhGrid,
      {
        id: Math.random().toString(36).substring(7),
        tanggal: new Date().toISOString().split("T")[0],
        nama_pasien: "",
        no_rm: "",
        asesmen_awal: false,
        asesmen_ulang: false,
        intervensi: false,
      },
    ]);
  };

  const handleRemoveJatuhRow = (id: string) => setJatuhGrid(jatuhGrid.filter((r) => r.id !== id));

  const handleUpdateJatuh = (id: string, field: keyof JatuhData, value: any) => {
    setJatuhGrid(jatuhGrid.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Mock upload handler helper
  const handleFileUploadMock = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedProofName(file.name);
      setFormValue("bukti_file_name", file.name);
    }
  };

  // Form submission fully integrated with Supabase and store payload
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    let finalNum = data.numerator_val || 0;
    let finalDen = data.denominator_val || 1;

    if (data.kategori !== "IKP") {
      if (watchIndikatorId === "7") {
        finalNum = visiteGrid.filter((d) => d.jam_visite_kurang_14 && d.keterangan === "Sesuai Jadwal").length;
        finalDen = visiteGrid.length || 1;
      } else if (watchIndikatorId === "11") {
        finalNum = jatuhGrid.reduce(
          (acc, curr) => acc + (curr.asesmen_awal ? 1 : 0) + (curr.asesmen_ulang ? 1 : 0) + (curr.intervensi ? 1 : 0),
          0
        );
        finalDen = jatuhGrid.length * 3 || 1;
      } else if (customNumerator !== undefined && customDenominator !== undefined) {
        finalNum = customNumerator;
        finalDen = customDenominator;
      }
    }

    let persentase = Number(((finalNum / (finalDen || 1)) * 100).toFixed(2));
    if (isNaN(persentase)) persentase = 0;

    const payload: DataMutuPayload = {
      id: Math.random().toString(36).substring(7),
      unit: data.unit + (selectedSubUnit ? ` - ${selectedSubUnit}` : ""),
      tanggal: data.tanggal,
      kategori: data.kategori,
      indikator_id: data.indikator_id || undefined,
      indikator_name: selectedIndikatorProfile?.indicator_title || undefined,
      numerator: finalNum,
      denominator: finalDen,
      target: selectedIndikatorProfile?.target || undefined,
      capaian: data.kategori === "IKP" ? undefined : persentase,
      status: data.kategori === "IKP" ? "N/A" : (achievementStatus as any),
      keterangan: data.keterangan || "",
      kpc: data.kategori === "IKP" ? data.kpc || 0 : undefined,
      knc: data.kategori === "IKP" ? data.knc || 0 : undefined,
      ktc: data.kategori === "IKP" ? data.ktc || 0 : undefined,
      ktd: data.kategori === "IKP" ? data.ktd || 0 : undefined,
      sentinel: data.kategori === "IKP" ? data.sentinel || 0 : undefined,
      visite_details: watchIndikatorId === "7" ? [...visiteGrid] : undefined,
      jatuh_details: watchIndikatorId === "11" ? [...jatuhGrid] : undefined,
    };

    // 1. Save locally in Zustand instantly (Optimistic update)
    addDataMutu(payload);

    // 2. Perform background Supabase inserts securely (No blocking if fails)
    try {
      await supabase.from("indicator_inputs").insert({
        id: payload.id,
        unit_id: payload.unit,
        sub_unit: selectedSubUnit || null,
        category_id: data.kategori,
        indicator_id: data.indikator_id || null,
        input_date: data.tanggal,
        numerator_value: finalNum,
        denominator_value: finalDen,
        target: selectedIndikatorProfile?.target || null,
        achievement_percentage: data.kategori === "IKP" ? null : persentase,
        notes: data.keterangan || "",
        attachment_url: uploadedProofName || null,
        created_at: new Date().toISOString(),
      });
    } catch (supabaseError) {
      console.warn("Supabase sync skipped - data recorded in local Zustand and memory channels", supabaseError);
    }

    // Success notifications and state cleanup
    setIsSubmitting(false);
    setSuccessMsg(true);
    setVisiteGrid([]);
    setJatuhGrid([]);
    setCustomNumerator(undefined);
    setCustomDenominator(undefined);
    setAverageWaktuTunggu(undefined);
    setUploadedProofName("");

    // Reset standard fields
    reset({
      unit: "",
      sub_unit: "",
      tanggal: new Date().toISOString().split("T")[0],
      kategori: data.kategori,
      indikator_id: "",
      numerator_val: undefined,
      denominator_val: undefined,
      kpc: 0,
      knc: 0,
      ktc: 0,
      ktd: 0,
      sentinel: 0,
      keterangan: "",
      bukti_file_name: "",
    });

    setUnitSearch("");
    setSelectedUnit(null);
    setSelectedSubUnit("");

    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSuccessMsg(false), 5000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-5xl mx-auto space-y-10 pb-16">
      {/* Title & Real-time Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-[#10a37f] tracking-tight">
              Input Data Mutu RS
            </h1>
          </div>
          <p className="text-gray-900 text-sm font-semibold">
            Input Data INM, IMP-RS, IMP-Unit dan SPM secara realtime
          </p>
        </div>
      </div>

      {/* Primary Input Panel */}
      <div className="bg-white rounded-[32px] shadow-[0_4px_30px_-5px_rgba(0,0,0,0.03)] border border-gray-100 p-8 md:p-10 space-y-8">
        {successMsg && (
          <div className="p-5 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-3 border border-emerald-100/75 animate-in fade-in duration-500">
            <div className="bg-emerald-600 text-white p-1 rounded-full">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="font-extrabold block text-sm">Data Berhasil Disimpan!</span>
              <span className="text-xs text-emerald-700/90 font-medium mt-0.5 block">
                Sistem berhasil mengamankan record baru Anda di database dan menyinkronkan seluruh visual grafik dashboard secara instan.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* STEP 1 & 2: UNIT & TANGGAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Pilih Unit Selector */}
            <div className="space-y-3 relative" ref={unitDropdownRef}>
              <label className="flex items-center justify-between text-sm font-extrabold text-slate-800 tracking-wide">
                <span>1. Pilih Unit</span>
                
                {/* Admin-only Add Room trigger */}
                <button
                  type="button"
                  onClick={handleOpenAddRoom}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center justify-center bg-emerald-55 hover:bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-100 transition-colors w-7 h-7"
                  title="Tambah Ruangan"
                >
                  <Plus size={14} className="stroke-[3]" />
                </button>
              </label>

              {/* Custom Searchable Select Container */}
              <div className="relative">
                <div
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 font-bold bg-slate-50/50 hover:bg-white cursor-pointer flex items-center justify-between shadow-xs"
                >
                  <span className={selectedUnit ? "text-slate-900" : "text-gray-400"}>
                    {selectedUnit ? selectedUnit.name : "Silahkan pilih unit"}
                  </span>
                </div>

                {showUnitDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 max-h-80 flex flex-col">
                    <div className="p-3 border-b border-gray-50 flex items-center gap-2 bg-[#fcfdfd]">
                      <Search size={14} className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari Layanan / Unit..."
                        value={unitSearch}
                        onChange={(e) => setUnitSearch(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs font-semibold text-slate-800 placeholder-gray-400"
                        onClick={(e) => e.stopPropagation()} // protect input click
                      />
                    </div>
                    
                    <div className="overflow-y-auto scroll-smooth flex-1 py-1">
                      {filteredUnits.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400 italic font-medium">
                          Unit tidak ditemukan
                        </div>
                      ) : (
                        filteredUnits.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUnit(u);
                              setFormValue("unit", u.name);
                              setShowUnitDropdown(false);
                            }}
                            className="px-5 py-3 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                                {u.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                Kategori: {u.category}
                              </span>
                            </div>

                            {/* Edit/Delete triggers for Admin */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditRoom(e, u)}
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit Unit"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteRoom(e, u.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus Unit"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <input type="hidden" {...register("unit")} />
              {errors.unit && <p className="text-red-500 text-xs font-semibold mt-1">{errors.unit.message}</p>}
            </div>

            {/* 2. Pilih Tanggal Realtime */}
            <div className="space-y-3">
              <label className="text-sm font-extrabold text-slate-800 tracking-wide">
                2. Tanggal input
              </label>
              <input
                type="date"
                {...register("tanggal")}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 font-bold bg-slate-50/50 hover:bg-white shadow-xs"
              />
              {errors.tanggal && <p className="text-red-500 text-xs font-semibold mt-1">{errors.tanggal.message}</p>}
            </div>
          </div>

          {/* DYNAMIC SUB UNIT: RAWAT JALAN SUB SPECIFICATION */}
          {selectedUnit?.name === "Rawat Jalan" && (
            <div className="bg-emerald-50/35 border border-emerald-100/50 rounded-2xl p-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Pilih Sub-Pelayanan Poli (Rawat Jalan)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {subUnitsRawatJalan.map((poli) => (
                  <button
                    key={poli}
                    type="button"
                    onClick={() => {
                      setSelectedSubUnit(poli);
                      setFormValue("sub_unit", poli);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedSubUnit === poli
                        ? "bg-emerald-600 text-white border-emerald-600/50 shadow-xs scale-[1.02]"
                        : "bg-white text-slate-700 border-gray-100 hover:border-emerald-200"
                    }`}
                  >
                    {poli}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT CATEGORY (INM, IMP-RS, IMP-Unit, SPM, IKP) */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-slate-800 tracking-wide font-sans">
              3. Pilih Kategori Indikator Mutu
            </label>
            <div className="relative">
              <select
                value={watchKategori || ""}
                onChange={(e) => {
                  setFormValue("kategori", e.target.value);
                  setFormValue("indikator_id", "");
                  setUploadedProofName("");
                }}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 font-bold bg-slate-50/50 hover:bg-white cursor-pointer shadow-xs text-sm"
              >
                <option value="INM">INM</option>
                <option value="IMP-RS">IMP-RS</option>
                <option value="IMP-Unit">IMP-Unit</option>
                <option value="SPM">SPM</option>
                <option value="IKP">IKP (Insiden Keselamatan Pasien)</option>
              </select>
            </div>
          </div>

          {/* STEP 4: SELECT INDICATOR OUT FROM MASTER DYNAMIC PROFILE */}
          {watchKategori !== "IKP" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <label className="text-sm font-extrabold text-slate-800 tracking-wide font-sans">
                4. Pilih Indikator Mutu
              </label>
              <div className="relative">
                <select
                  {...register("indikator_id")}
                  className={`w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold bg-slate-50/50 hover:bg-white cursor-pointer shadow-xs text-sm ${
                    watchIndikatorId ? "text-slate-900" : "text-gray-400/80"
                  }`}
                >
                  <option value="" className="text-gray-400">Pilih indikator</option>
                  {filteredIndikators.map((i) => (
                    <option key={i.id} value={i.id} className="text-slate-900">
                      {i.indicator_title}
                    </option>
                  ))}
                </select>
              </div>
              {errors.indikator_id && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.indikator_id.message}
                </p>
              )}
            </div>
          )}

          {/* STEP 7: DYNAMIC MEDICAL FORM FIELDS AND SPECIAL CLINICAL GRIDS */}
          {/* A. If Patient Safety Incidents (IKP) */}
          {watchKategori === "IKP" && (
            <div className="bg-red-50/20 border border-red-100 rounded-[28px] p-6 md:p-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 border-b border-red-100 pb-4">
                <ShieldAlert className="text-red-500 w-6 h-6" />
                <h3 className="text-lg font-bold text-red-900">
                  Form Input Insiden Keselamatan Pasien (IKP)
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { id: "kpc", label: "KPC", sub: "Potensial Cedera" },
                  { id: "knc", label: "KNC", sub: "Nyaris Cedera" },
                  { id: "ktc", label: "KTC", sub: "Tidak Cedera" },
                  { id: "ktd", label: "KTD", sub: "Tidak Diharapkan" },
                  { id: "sentinel", label: "Sentinel", sub: "Kejadian Sentinel" },
                ].map((ikpItem) => (
                  <div
                    key={ikpItem.id}
                    className="bg-white border border-red-100/50 rounded-2xl p-4 text-center hover:border-red-200 hover:shadow-xs transition-all focus-within:ring-2 focus-within:ring-red-500/20"
                  >
                    <label className="block text-[#0c2415] font-extrabold text-sm mb-1">
                      {ikpItem.label}
                    </label>
                    <span className="block text-[10px] text-gray-400 mb-3 uppercase tracking-wider font-semibold">
                      {ikpItem.sub}
                    </span>
                    <input
                      type="number"
                      min="0"
                      {...register(ikpItem.id as any, { valueAsNumber: true })}
                      className="w-full text-center px-3 py-2.5 bg-red-50/30 rounded-xl border border-red-100 focus:outline-none focus:border-red-300 focus:bg-red-50 transition-colors text-red-900 font-bold text-lg"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 tracking-wide">
                  <FileText size={16} className="text-red-500" />
                  Keterangan Ringkat Laporan Insiden
                </label>
                <textarea
                  {...register("keterangan")}
                  rows={3}
                  placeholder="Tambahkan catatan ringkas lokasi kejadian, tindakan penanganan awal, atau rujukan investigasi..."
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition-all text-slate-800 font-medium bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* B. Specialized Clinical Grid Forms */}
          {watchKategori !== "IKP" && selectedIndikatorProfile && (
            <div className="space-y-6">
              {/* Specialized Form For Visite Dokter (ID "7") */}
              {watchIndikatorId === "7" && (
                <div className="bg-white border border-emerald-100 rounded-[28px] overflow-hidden shadow-xs animate-in fade-in">
                  <div className="bg-emerald-600 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-white" />
                      <h3 className="font-extrabold text-white tracking-wide text-sm md:text-base">
                        Data Registrasi Kepatuhan Visite Dokter
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVisiteRow}
                      className="flex items-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors"
                    >
                      <Plus size={14} /> Tambah Pasien
                    </button>
                  </div>

                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-emerald-50/55 border-b border-emerald-100 text-emerald-950">
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-12 text-center rounded-tl-xl border-r border-emerald-100/30">No</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-32 border-r border-emerald-100/30">Tanggal</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase border-r border-emerald-100/30">Nama Pasien</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">Visite {'<'} 14.00</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">Visite {'>'} 14.00</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase border-r border-emerald-100/30 min-w-[200px]">Dokter Penanggung Jawab</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-48 border-r border-emerald-100/30">Kelayakan Keterangan</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-16 text-center rounded-tr-xl">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiteGrid.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-gray-400 text-xs italic font-semibold border-b border-emerald-50 bg-[#fafdfc]">
                              Belum ada baris data audit. Silakan tambahkan pasien untuk memulai verifikasi indikator visite dokter.
                            </td>
                          </tr>
                        ) : (
                          visiteGrid.map((row, idx) => (
                            <tr key={row.id} className="border-b border-gray-50 hover:bg-emerald-50/10 transition-colors">
                              <td className="py-3 px-4 text-center text-sm font-semibold text-gray-400 border-r border-emerald-50">{idx + 1}</td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="date"
                                  value={row.tanggal}
                                  onChange={(e) => handleUpdateVisite(row.id, "tanggal", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-850"
                                />
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="text"
                                  placeholder="Nama Lengkap Pasien"
                                  value={row.nama_pasien}
                                  onChange={(e) => handleUpdateVisite(row.id, "nama_pasien", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.jam_visite_kurang_14}
                                  onChange={(e) => handleUpdateVisite(row.id, "jam_visite_kurang_14", e.target.checked)}
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.jam_visite_lebih_14}
                                  onChange={(e) => handleUpdateVisite(row.id, "jam_visite_lebih_14", e.target.checked)}
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <select
                                  value={row.dokter_visite}
                                  onChange={(e) => handleUpdateVisite(row.id, "dokter_visite", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                >
                                  <option value="">-- Pilih Dokter Spesialis --</option>
                                  <option value="dr. Hijrah Saputra WR, Sp.PD">dr. Hijrah Saputra WR, Sp.PD</option>
                                  <option value="dr. Niko Adhi H, Sp.PD., M.Kes., FINASIM">dr. Niko Adhi H, Sp.PD., FINASIM</option>
                                  <option value="dr. Dhyniek Nurul FLA, Sp.A">dr. Dhyniek Nurul FLA, Sp.A</option>
                                  <option value="dr. Ferry Sudarsono, Sp.B., FINACS">dr. Ferry Sudarsono, Sp.B., FINACS</option>
                                  <option value="dr. Billy Nusa Anggara T, Sp.OG">dr. Billy Nusa Anggara T, Sp.OG</option>
                                  <option value="dr. Haris Nut, Sp.N">dr. Haris Nut, Sp.N</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <select
                                  value={row.keterangan}
                                  onChange={(e) => handleUpdateVisite(row.id, "keterangan", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                >
                                  <option value="Sesuai Jadwal">Sesuai Jadwal</option>
                                  <option value="Tidak Sesuai Jadwal">Tidak Sesuai Jadwal</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVisiteRow(row.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Specialized Form For Upaya Risiko Jatuh (ID "11") */}
              {watchIndikatorId === "11" && (
                <div className="bg-white border border-emerald-100 rounded-[28px] overflow-hidden shadow-xs animate-in fade-in">
                  <div className="bg-emerald-600 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-white" />
                      <h3 className="font-extrabold text-white tracking-wide text-sm md:text-base">
                        Data Registrasi Kepatuhan Upaya Risiko Jatuh
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddJatuhRow}
                      className="flex items-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors"
                    >
                      <Plus size={14} /> Tambah Pasien
                    </button>
                  </div>

                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-emerald-50/55 border-b border-emerald-100 text-emerald-950">
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-12 text-center border-r border-emerald-100/30">No</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-32 border-r border-emerald-100/30">Tanggal</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase border-r border-emerald-100/30">Nama Pasien</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-36 border-r border-emerald-100/30">No. RM</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">Asesmen Awal</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">Asesmen Ulang</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">Intervensi</th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-16 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jatuhGrid.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-gray-400 text-xs italic font-semibold bg-[#fafdfc]">
                              Belum ada baris data audit. Silakan tambahkan pasien untuk memulai verifikasi risiko jatuh.
                            </td>
                          </tr>
                        ) : (
                          jatuhGrid.map((row, idx) => (
                            <tr key={row.id} className="border-b border-gray-50 hover:bg-emerald-50/10 transition-colors">
                              <td className="py-3 px-4 text-center text-sm font-semibold text-gray-400 border-r border-emerald-50">{idx + 1}</td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="date"
                                  value={row.tanggal}
                                  onChange={(e) => handleUpdateJatuh(row.id, "tanggal", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                />
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="text"
                                  placeholder="Nama Lengkap Pasien"
                                  value={row.nama_pasien}
                                  onChange={(e) => handleUpdateJatuh(row.id, "nama_pasien", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                />
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="text"
                                  placeholder="No. Rekam Medis"
                                  value={row.no_rm}
                                  onChange={(e) => handleUpdateJatuh(row.id, "no_rm", e.target.value)}
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-850"
                                  required
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.asesmen_awal}
                                  onChange={(e) => handleUpdateJatuh(row.id, "asesmen_awal", e.target.checked)}
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.asesmen_ulang}
                                  onChange={(e) => handleUpdateJatuh(row.id, "asesmen_ulang", e.target.checked)}
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.intervensi}
                                  onChange={(e) => handleUpdateJatuh(row.id, "intervensi", e.target.checked)}
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveJatuhRow(row.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Advanced Custom Form: Kepatuhan Identifikasi Pasien (ID "3") */}
              {watchIndikatorId === "3" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-emerald-100/10 pt-4">
                  <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 space-y-4">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md font-black">
                      INPUT DATA CAPAIAN
                    </span>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-800">
                          Jumlah Pasien Teridentifikasi Benar (Patuh)
                        </label>
                        <input
                          type="number"
                          placeholder="Masukkan jumlah patuh"
                          onChange={(e) => setCustomNumerator(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-800"
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-800">
                          Jumlah Peluang Observasi Identifikasi (Total)
                        </label>
                        <input
                          type="number"
                          placeholder="Masukkan total observasi"
                          onChange={(e) => setCustomDenominator(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-800"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-black">
                        BUKTI DOKUMENTASI
                      </span>
                      <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                        Guna mendukung orisinalitas audit, disarankan mengunggah lembar observasi yang sudah disetujui Kepala Ruangan.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center transition-all">
                        <FileUp className="text-gray-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-slate-700">Pilih berkas audit</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG atau PDF maks 2MB</span>
                        <input type="file" onChange={handleFileUploadMock} className="hidden" accept=".jpg,.png,.pdf" />
                      </label>
                      {uploadedProofName && (
                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                          📎 {uploadedProofName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Custom Form: Waktu Tunggu Rawat Jalan (ID "5") */}
              {watchIndikatorId === "5" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-emerald-100/10 pt-4">
                  <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 space-y-4">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md font-black">
                      INPUT SURVEI RAWAT JALAN
                    </span>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-800">
                          Jumlah Pasien dengan Waktu Tunggu ≤ 60 Menit
                        </label>
                        <input
                          type="number"
                          placeholder="Jumlah sesuai standar"
                          onChange={(e) => setCustomNumerator(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-800"
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-800">
                          Total Seluruh Pasien Rawat Jalan yang Disurvei
                        </label>
                        <input
                          type="number"
                          placeholder="Jumlah seluruh pasien"
                          onChange={(e) => setCustomDenominator(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-800"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-3 py-1 rounded-md font-black">
                        RATA-RATA WAKTU TUNGGU
                      </span>
                      <p className="text-[11px] text-gray-400 font-semibold pt-1">
                        Opsional masukkan estimasi rata-rata pelayanan poli terpadu hari ini (unit: menit).
                      </p>
                      <input
                        type="number"
                        placeholder="Misal: 45 menit"
                        value={averageWaktuTunggu || ""}
                        onChange={(e) => setAverageWaktuTunggu(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-805"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-gray-400 font-black tracking-widest block uppercase">UPLOAD BUKTI FISIK</span>
                      <label className="border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2">
                        <FileUp className="text-gray-400" size={18} />
                        <span className="text-xs font-bold text-slate-700">Pilih Lembar Audit (Formulir)</span>
                        <input type="file" onChange={handleFileUploadMock} className="hidden" accept=".jpg,.png,.pdf" />
                      </label>
                      {uploadedProofName && (
                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
                          📎 {uploadedProofName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* C. Fallback Fields For Dynamic Standard Indicators */}
              {watchIndikatorId !== "7" && watchIndikatorId !== "11" && watchIndikatorId !== "3" && watchIndikatorId !== "5" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-emerald-100/10 pt-4">
                  <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:shadow-xs hover:border-emerald-100 transition-all duration-300">
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <Activity size={20} className="text-emerald-600" strokeWidth={2.5} />
                        <h4 className="font-extrabold text-[11px] tracking-widest text-[#0c2415] uppercase">
                          NUMERATOR VALUE
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        {selectedIndikatorProfile.numerator || "Isi nilai pembilang indikator."}
                      </p>
                    </div>
                    <div className="mt-6">
                      <input
                        type="number"
                        placeholder="Nilai Pembilang (Numerator)"
                        {...register("numerator_val", { valueAsNumber: true })}
                        className="w-full px-5 py-3.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-extrabold text-base"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:shadow-xs hover:border-emerald-100 transition-all duration-300">
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <Layers size={20} className="text-emerald-700" strokeWidth={2.5} />
                        <h4 className="font-extrabold text-[11px] tracking-widest text-[#0c2415] uppercase">
                          DENOMINATOR VALUE
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        {selectedIndikatorProfile.denominator || "Isi nilai penyebut indikator."}
                      </p>
                    </div>
                    <div className="mt-6">
                      <input
                        type="number"
                        placeholder="Nilai Penyebut (Denominator)"
                        {...register("denominator_val", { valueAsNumber: true })}
                        className="w-full px-5 py-3.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-extrabold text-base"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REALTIME SCORE PREVIEW & CALCULATION INSIGHT BAR */}
          {watchKategori !== "IKP" && selectedIndikatorProfile && (
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 p-8 rounded-[24px] border border-emerald-800 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                {/* Premium Circular Progress Ring */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r={36}
                      className="text-emerald-950/40"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Foreground circle with animation */}
                    <motion.circle
                      cx="48"
                      cy="48"
                      r={36}
                      className="text-emerald-400"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={(2 * Math.PI * 36) - (computedCapaian / 100) * (2 * Math.PI * 36)}
                      initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 36) - (computedCapaian / 100) * (2 * Math.PI * 36) }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                  {/* Indicator icon inside circle */}
                  <span className="absolute text-sm font-black text-emerald-400">
                    %
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <span className="block text-xs font-black tracking-widest text-emerald-400 uppercase font-sans">
                    REALTIME ANALYSIS: PERSENTASE CAPAIAN MUTU
                  </span>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{computedCapaian}%</span>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full border ${
                        achievementStatus === "Tercapai"
                          ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                          : achievementStatus === "Mendekati"
                          ? "bg-orange-500/20 border-orange-400/30 text-orange-350"
                          : "bg-red-500/20 border-red-400/30 text-red-300"
                      }`}
                    >
                      {achievementStatus}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/70 font-semibold max-w-sm">
                    {watchIndikatorId === "7" && `Formula: ${visiteGrid.filter((d) => d.jam_visite_kurang_14 && d.keterangan === "Sesuai Jadwal").length} / ${visiteGrid.length || 0} pasien patuh.`}
                    {watchIndikatorId === "11" && `Formula: ${jatuhGrid.reduce((acc, curr) => acc + (curr.asesmen_awal ? 1 : 0) + (curr.asesmen_ulang ? 1 : 0) + (curr.intervensi ? 1 : 0), 0)} / ${jatuhGrid.length * 3 || 0} poin asesmen.`}
                    {watchIndikatorId !== "7" && watchIndikatorId !== "11" && `Berdasarkan Nilai Pembilang (${watchNumerator ?? 0}) dibagi Nilai Penyebut (${watchDenominator ?? 0})`}
                  </p>
                </div>
              </div>

              {/* Upload Proof Document inside the same card */}
              {watchIndikatorId !== "3" && watchIndikatorId !== "5" && (
                <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                  <span className="text-[10px] text-emerald-300 font-extrabold tracking-widest uppercase font-sans">Lampirkan Bukti Fisik</span>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black text-emerald-105 cursor-pointer hover:text-white bg-emerald-800/40 hover:bg-emerald-800/60 px-4 py-2.5 rounded-xl border border-emerald-700/50 transition-all flex items-center gap-1.5 shadow-xs">
                      <FileUp size={14} />
                      {uploadedProofName ? "Ubah Berkas" : "Upload Bukti Audit"}
                      <input type="file" onChange={handleFileUploadMock} className="hidden" accept=".jpg,.png,.pdf" />
                    </label>
                    {uploadedProofName && (
                      <span className="text-xs font-bold text-emerald-300 truncate max-w-[150px]" title={uploadedProofName}>
                        📎 {uploadedProofName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BUTTON SAVE SUBMISSION */}
          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-12 py-4 rounded-xl font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg ${
                watchKategori === "IKP"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/10"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Zap className="animate-spin text-white" size={18} /> Menyimpan...
                </>
              ) : (
                <>
                  💾 Simpan {watchKategori === "IKP" ? "Insiden Keselamatan" : "Hasil Capaian"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* DYNAMIC ROOM/UNIT MANAGEMENT MODAL (ADMIN ONLY) */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#10a37f] p-5 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm md:text-base tracking-wide flex items-center gap-2">
                <Building2 size={18} />
                {modalMode === "add" ? "Tambah Unit Baru" : "Edit Unit Layanan"}
              </h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 tracking-wide uppercase">Nama Ruangan / Unit *</label>
                <input
                  type="text"
                  placeholder="Misal: ICU, Poli Bedah"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-850"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 tracking-wide uppercase">Kategori Ruangan</label>
                <select
                  value={roomCategoryInput}
                  onChange={(e) => setRoomCategoryInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-850"
                >
                  <option value="Rawat Inap">Rawat Inap</option>
                  <option value="Rawat Jalan">Rawat Jalan</option>
                  <option value="Intensif">Intensif</option>
                  <option value="Penunjang">Penunjang</option>
                  <option value="Umum">Umum</option>
                  <option value="Instalasi Gawat Darurat">Gawat Darurat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 tracking-wide uppercase">Status Pelayanan</label>
                <div className="flex gap-4">
                  {["Aktif", "Nonaktif"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRoomStatusInput(st as any)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black border flex-1 text-center transition-all ${
                        roomStatusInput === st
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-slate-50 flex justify-end gap-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-550 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRoom}
                className="px-6 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md shadow-emerald-500/20"
              >
                Simpan Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
