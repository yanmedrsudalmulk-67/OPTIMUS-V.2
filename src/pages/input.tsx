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
  ChevronDown,
  Save,
  Target,
  Sparkles,
} from "lucide-react";
import {
  useStore,
  DataMutuPayload,
  VisiteData,
  JatuhData,
  Unit,
  IndicatorProfile,
  WaktuTungguData,
  IdentifikasiData,
  MomentIdentifikasi,
  FornasData,
} from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { motion } from "motion/react";

// Validation schema for general inputs
const schema = z
  .object({
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
  })
  .superRefine((data, ctx) => {
    if (data.kategori !== "IKP") {
      if (!data.indikator_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih Indikator terlebih dahulu",
          path: ["indikator_id"],
        });
      }
    }
  });

const momentHeaders = [
  { code: "M1", title: "Gelang Identitas", label: "Sebelum pemasangan gelang identitas pasien" },
  { code: "M2", title: "Pemberian Obat", label: "Sebelum pemberian obat" },
  { code: "M3", title: "Darah/Produk", label: "Sebelum pemberian darah / produk darah" },
  { code: "M4", title: "Tindakan Medis", label: "Sebelum tindakan" },
  { code: "M5", title: "Cairan Infus", label: "Sebelum pemberian cairan intravena" },
  { code: "M6", title: "Darah/Spesimen", label: "Sebelum pengambilan darah / spesimen" },
  { code: "M7", title: "Pemberian Diet", label: "Sebelum pemberian diet" },
  { code: "M8", title: "Prosedur Dx/Tx", label: "Sebelum melakukan prosedur diagnostik dan terapi" },
  { code: "M9", title: "Periksa Pasien", label: "Sebelum pemeriksaan pasien" },
];

const TriStateSelector = ({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: string | null) => void;
}) => {
  return (
    <div className="flex rounded-md overflow-hidden border border-slate-200 bg-white shadow-2xs h-[20px] w-full">
      <button
        type="button"
        onClick={() => onChange(value === "Ya" ? null : "Ya")}
        className={`flex-1 flex items-center justify-center font-black text-[8px] tracking-tighter transition-all ${
          value === "Ya"
            ? "bg-emerald-600 text-white"
            : "text-slate-600 hover:bg-slate-55 bg-white"
        }`}
        title="Ya"
      >
        YA
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "Tidak" ? null : "Tidak")}
        className={`flex-1 flex items-center justify-center font-black text-[8px] tracking-tighter border-x border-slate-150 transition-all ${
          value === "Tidak"
            ? "bg-rose-500 text-white"
            : "text-slate-500 hover:bg-slate-55 bg-white"
        }`}
        title="Tidak"
      >
        TDK
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "N/A" ? null : "N/A")}
        className={`flex-1 flex items-center justify-center font-black text-[8px] tracking-tighter transition-all ${
          value === "N/A"
            ? "bg-slate-400 text-white"
            : "text-slate-500 hover:bg-slate-55 bg-white"
        }`}
        title="Not Applicable"
      >
        N/A
      </button>
    </div>
  );
};

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
  const [roomStatusInput, setRoomStatusInput] = useState<"Aktif" | "Nonaktif">(
    "Aktif",
  );
  // Delete confirmation modal state for Kepatuhan Identifikasi Pasien
  const [deleteIdentifikasiId, setDeleteIdentifikasiId] = useState<string | null>(null);

  const unitDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch newest units from Supabase if active
  useEffect(() => {
    const fetchSupabaseUnits = async () => {
      try {
        const { data, error } = await supabase.from("units").select("*");
        if (data && data.length > 0) {
          // If Supabase contains values, load them into the application
          data.forEach((dbUnit: any) => {
            const exists = units.some(
              (u) => u.id === dbUnit.id || u.name === dbUnit.name,
            );
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
        console.warn(
          "Supabase units select skipped, falling back to local Zustand schema",
          err,
        );
      }
    };
    fetchSupabaseUnits();
  }, [addUnit, units]);

  // Keyboard navigation click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        unitDropdownRef.current &&
        !unitDropdownRef.current.contains(event.target as Node)
      ) {
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

  /* eslint-disable react-hooks/incompatible-library */
  const watchKategori = watch("kategori");
  const watchIndikatorId = watch("indikator_id");
  const watchNumerator = watch("numerator_val");
  const watchDenominator = watch("denominator_val");
  /* eslint-enable react-hooks/incompatible-library */

  // Filter indicator profiles dynamically from state/database
  const filteredIndikators = useMemo(() => {
    let filtered = indicatorProfiles.filter(
      (i) => i.category === watchKategori,
    );
    filtered.sort((a, b) => {
      const aIsKKT = (a.indicator_title || "")
        .toLowerCase()
        .includes("kebersihan tangan");
      const bIsKKT = (b.indicator_title || "")
        .toLowerCase()
        .includes("kebersihan tangan");
      if (aIsKKT && !bIsKKT) return -1;
      if (!aIsKKT && bIsKKT) return 1;
      return 0;
    });
    return filtered;
  }, [indicatorProfiles, watchKategori]);

  const selectedIndikatorProfile = useMemo(() => {
    return indicatorProfiles.find((i) => i.id === watchIndikatorId);
  }, [indicatorProfiles, watchIndikatorId]);

  const isVisiteDokter =
    watchIndikatorId === "7" ||
    !!selectedIndikatorProfile?.indicator_title
      ?.toLowerCase()
      .includes("visite");
  const isRisikoJatuh =
    watchIndikatorId === "11" ||
    !!selectedIndikatorProfile?.indicator_title
      ?.toLowerCase()
      .includes("jatuh");
  const isIdentifikasiPasien =
    watchIndikatorId === "3" ||
    !!selectedIndikatorProfile?.indicator_title
      ?.toLowerCase()
      .includes("identifikasi pasien");
  const isWaktuTunggu =
    watchIndikatorId === "5" ||
    !!selectedIndikatorProfile?.indicator_title
      ?.toLowerCase()
      .includes("waktu tunggu");
  const isFornas =
    !!selectedIndikatorProfile?.indicator_title
      ?.toLowerCase()
      .includes("formularium nasional");

  // States for dynamic custom subgrids/checklists inside section 7
  const [visiteGrid, setVisiteGrid] = useState<VisiteData[]>([]);
  const [jatuhGrid, setJatuhGrid] = useState<JatuhData[]>([]);
  const [jatuhSearchTerm, setJatuhSearchTerm] = useState("");
  const [jatuhFilterDate, setJatuhFilterDate] = useState("");
  const [waktuTungguGrid, setWaktuTungguGrid] = useState<WaktuTungguData[]>([]);
  const [fornasGrid, setFornasGrid] = useState<FornasData[]>([]);
  const [identifikasiGrid, setIdentifikasiGrid] = useState<IdentifikasiData[]>([
    {
      id: Math.random().toString(36).substring(7),
      tanggal_observasi: new Date().toISOString().split("T")[0],
      jam_observasi: "",
      nama_observer: "",
      nama_pasien: "",
      no_rm: "",
      tanggal_lahir: "",
      jenis_kelamin: "",
      petugas: "",
      lokasi: "",
      moments: {},
    },
  ]);
  const [averageWaktuTunggu, setAverageWaktuTunggu] = useState<
    number | undefined
  >(undefined);
  const [customNumerator, setCustomNumerator] = useState<number | undefined>(
    undefined,
  );
  const [customDenominator, setCustomDenominator] = useState<
    number | undefined
  >(undefined);
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
    let den =
      watchDenominator !== undefined && watchDenominator > 0
        ? watchDenominator
        : 1;

    // Special calculations
    if (isVisiteDokter) {
      num = visiteGrid.filter(
        (d) => d.jam_visite_kurang_14 && d.keterangan === "Sesuai Jadwal",
      ).length;
      den = visiteGrid.length || 1;
    } else if (isRisikoJatuh) {
      num = jatuhGrid.reduce(
        (acc, curr) =>
          acc +
          (curr.asesmen_awal && curr.asesmen_ulang && curr.intervensi ? 1 : 0),
        0,
      );
      den = jatuhGrid.length || 1;
    } else if (isIdentifikasiPasien) {
      let calcNum = 0;
      let calcDen = 0;
      identifikasiGrid.forEach(row => {
         Object.values(row.moments || {}).forEach(m => {
            if (m.aktif) {
               calcDen++;
               if (m.patuh) calcNum++;
            }
         });
      });
      num = calcNum;
      den = calcDen || 1;
    } else if (isWaktuTunggu) {
      num = waktuTungguGrid.filter((d) => d.selisih_menit <= 60).length;
      den = waktuTungguGrid.length || 1;
    } else if (isFornas) {
      num = fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_sesuai) || 0), 0);
      den = fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_resep) || 0), 0) || 1;
    } else if (
      customNumerator !== undefined &&
      customDenominator !== undefined
    ) {
      num = customNumerator;
      den = customDenominator > 0 ? customDenominator : 1;
    }

    const val = parseFloat(((num / (den || 1)) * 100).toFixed(2));
    return isNaN(val) ? 0 : val;
  }, [
    watchNumerator,
    watchDenominator,
    isVisiteDokter,
    isRisikoJatuh,
    isWaktuTunggu,
    isIdentifikasiPasien,
    isFornas,
    visiteGrid,
    jatuhGrid,
    identifikasiGrid,
    waktuTungguGrid,
    fornasGrid,
    customNumerator,
    customDenominator,
  ]);

  const achievementStatus = useMemo(() => {
    if (!selectedIndikatorProfile) return "N/A";
    const target =
      parseFloat(
        String(selectedIndikatorProfile.target).replace(/[^0-9.]/g, ""),
      ) || 80;
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
        u.status === "Aktif",
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

  const handleRemoveVisiteRow = (id: string) =>
    setVisiteGrid(visiteGrid.filter((r) => r.id !== id));

  const handleUpdateVisite = (
    id: string,
    field: keyof VisiteData,
    value: any,
  ) => {
    setVisiteGrid(
      visiteGrid.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === "jam_visite_kurang_14" && value) {
          updated.jam_visite_lebih_14 = false;
          updated.keterangan = "Sesuai Jadwal";
        }
        if (field === "jam_visite_lebih_14" && value) {
          updated.jam_visite_kurang_14 = false;
          updated.keterangan = "Tidak Sesuai Jadwal";
        }
        return updated;
      }),
    );
  };

  const handleAddFornasRow = () => {
    setFornasGrid([
      ...fornasGrid,
      {
        id: Math.random().toString(36).substring(7),
        tanggal: new Date().toISOString().split("T")[0],
        jumlah_resep: "",
        jumlah_sesuai: "",
      },
    ]);
  };

  const handleRemoveFornasRow = (id: string) =>
    setFornasGrid(fornasGrid.filter((r) => r.id !== id));

  const handleUpdateFornas = (
    id: string,
    field: keyof FornasData,
    value: any,
  ) => {
    setFornasGrid((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
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
        asesmen_awal: null,
        asesmen_ulang: null,
        intervensi: null,
      },
    ]);
  };

  const handleRemoveJatuhRow = (id: string) =>
    setJatuhGrid(jatuhGrid.filter((r) => r.id !== id));

  const handleUpdateJatuh = (
    id: string,
    field: keyof JatuhData,
    value: any,
  ) => {
    setJatuhGrid(
      jatuhGrid.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleAddIdentifikasiRow = () => {
    setIdentifikasiGrid([
      ...identifikasiGrid,
      {
        id: Math.random().toString(36).substring(7),
        tanggal_observasi: new Date().toISOString().split("T")[0],
        jam_observasi: "",
        nama_observer: "",
        nama_pasien: "",
        no_rm: "",
        tanggal_lahir: "",
        jenis_kelamin: "",
        petugas: "",
        lokasi: "",
        moments: {},
      },
    ]);
  };

  const handleRemoveIdentifikasiRow = (id: string) => {
    setDeleteIdentifikasiId(id);
  };

  const handleConfirmRemoveIdentifikasi = () => {
    if (deleteIdentifikasiId) {
      setIdentifikasiGrid(identifikasiGrid.filter((r) => r.id !== deleteIdentifikasiId));
      setDeleteIdentifikasiId(null);
    }
  };

  const handleUpdateIdentifikasi = (
    id: string,
    field: keyof IdentifikasiData,
    value: any,
  ) => {
    setIdentifikasiGrid(
      identifikasiGrid.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      }),
    );
  };

  const handleUpdateIdentifikasiMoment = (
    id: string,
    momentIndex: string,
    field: keyof MomentIdentifikasi,
    value: any,
  ) => {
    setIdentifikasiGrid(
      identifikasiGrid.map((r) => {
        if (r.id !== id) return r;
        const currentMoment = r.moments[momentIndex] || {
          aktif: false,
          petugas: "",
          tanya_nama: null,
          tanya_tgllahir: null,
          cara_verbal: null,
          cara_visual: null,
          lokasi: "",
          patuh: null,
        };
        const updatedMoment = { ...currentMoment, [field]: value };

        // Mark as active if it has some data
        if (
          updatedMoment.petugas !== "" ||
          updatedMoment.tanya_nama !== null ||
          updatedMoment.tanya_tgllahir !== null ||
          updatedMoment.cara_verbal !== null ||
          updatedMoment.cara_visual !== null ||
          updatedMoment.lokasi !== ""
        ) {
          updatedMoment.aktif = true;
        } else {
          updatedMoment.aktif = false;
        }

        // Auto-calculate Patuh
        if (
          updatedMoment.tanya_nama !== null ||
          updatedMoment.tanya_tgllahir !== null ||
          updatedMoment.cara_verbal !== null ||
          updatedMoment.cara_visual !== null
        ) {
          if (
            updatedMoment.tanya_nama === "Ya" &&
            updatedMoment.tanya_tgllahir === "Ya" &&
            (updatedMoment.cara_verbal === "Ya" || updatedMoment.cara_visual === "Ya")
          ) {
            updatedMoment.patuh = true;
          } else {
            updatedMoment.patuh = false;
          }
        } else {
          updatedMoment.patuh = null;
        }

        return {
          ...r,
          moments: {
            ...r.moments,
            [momentIndex]: updatedMoment,
          },
        };
      }),
    );
  };

  const handleAddWaktuTungguRow = () => {
    setWaktuTungguGrid([
      ...waktuTungguGrid,
      {
        id: Math.random().toString(36).substring(7),
        tanggal: new Date().toISOString().split("T")[0],
        nama_pasien: "",
        no_rm: "",
        jam_datang: "",
        jam_dilayani: "",
        selisih_menit: 0,
      },
    ]);
  };

  const handleRemoveWaktuTungguRow = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      setWaktuTungguGrid(waktuTungguGrid.filter((r) => r.id !== id));
    }
  };

  const calculateMinutesDiff = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);

    let diff = eH * 60 + eM - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60; // handle overnight if occurs though rare in outpatient
    return diff;
  };

  const handleUpdateWaktuTunggu = (
    id: string,
    field: keyof WaktuTungguData,
    value: any,
  ) => {
    setWaktuTungguGrid(
      waktuTungguGrid.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };

        if (field === "jam_datang" || field === "jam_dilayani") {
          updated.selisih_menit = calculateMinutesDiff(
            updated.jam_datang,
            updated.jam_dilayani,
          );
        }
        return updated;
      }),
    );
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
      if (isVisiteDokter) {
        finalNum = visiteGrid.filter(
          (d) => d.jam_visite_kurang_14 && d.keterangan === "Sesuai Jadwal",
        ).length;
        finalDen = visiteGrid.length || 1;
      } else if (isRisikoJatuh) {
        const isValid = jatuhGrid.every(
          (r) =>
            r.nama_pasien.trim() !== "" &&
            r.no_rm.trim() !== "" &&
            r.asesmen_awal !== null &&
            r.asesmen_ulang !== null &&
            r.intervensi !== null,
        );
        if (!isValid && jatuhGrid.length > 0) {
          alert(
            "Data observasi belum lengkap. Mohon lengkapi seluruh kolom wajib terlebih dahulu.",
          );
          setIsSubmitting(false);
          return;
        }
        finalNum = jatuhGrid.reduce(
          (acc, curr) =>
            acc +
            (curr.asesmen_awal && curr.asesmen_ulang && curr.intervensi
              ? 1
              : 0),
          0,
        );
        finalDen = jatuhGrid.length || 1;
      } else if (isIdentifikasiPasien) {
        const isValid = identifikasiGrid.every((r) => {
          if (r.nama_pasien.trim() === "" || r.no_rm.trim() === "") return false;
          if (!r.petugas || r.petugas.trim() === "") return false;
          if (!r.lokasi || r.lokasi.trim() === "") return false;
          
          const moments = Object.values(r.moments || {});
          const activeMoments = moments.filter(m => m.aktif);
          if (activeMoments.length === 0) return false;
          
          return true;
        });

        if (!isValid && identifikasiGrid.length > 0) {
          alert("Data observasi identifikasi pasien belum lengkap (nama pasien, no rm, nama petugas, lokasi identifikasi, dan minimal satu checklist observasi harus terisi).");
          setIsSubmitting(false);
          return;
        }

        let totalNum = 0;
        let totalDen = 0;
        identifikasiGrid.forEach(row => {
           Object.values(row.moments || {}).forEach(m => {
              if (m.aktif) {
                 m.petugas = row.petugas;
                 m.lokasi = row.lokasi;
                 totalDen++;
                 if (m.patuh) totalNum++;
              }
           });
        });
        finalNum = totalNum;
        finalDen = totalDen || 1;
      } else if (isWaktuTunggu) {
        finalNum = waktuTungguGrid.filter((d) => d.selisih_menit <= 60).length;
        finalDen = waktuTungguGrid.length || 1;
      } else if (isFornas) {
        const isFornasValid = fornasGrid.every(r => r.tanggal && r.jumlah_resep !== "" && Number(r.jumlah_resep) >= 0 && r.jumlah_sesuai !== "" && Number(r.jumlah_sesuai) >= 0 && Number(r.jumlah_sesuai) <= Number(r.jumlah_resep));
        if (!isFornasValid && fornasGrid.length > 0) {
           alert("Data Fornas tidak lengkap atau salah. Pastikan tanggal, jumlah resep, dan jumlah sesuai resep terisi, dan jumlah sesuai tidak melebihi jumlah resep.");
           setIsSubmitting(false);
           return;
        }
        
        // Validation for uniqueness over date is somewhat complex without backend, 
        // but we can check if there's duplicate date within the same grid:
        const dates = fornasGrid.map(r => r.tanggal);
        const hasDuplicateDates = new Set(dates).size !== dates.length;
        if (hasDuplicateDates) {
           alert("Data Fornas memiliki tanggal yang duplikat dalam form ini.");
           setIsSubmitting(false);
           return;
        }

        finalNum = fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_sesuai) || 0), 0);
        finalDen = fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_resep) || 0), 0) || 1;
      } else if (
        customNumerator !== undefined &&
        customDenominator !== undefined
      ) {
        finalNum = customNumerator;
        finalDen = customDenominator;
      }
    }

    let computedCapaian = 0;
    if (selectedIndikatorProfile) {
      const unit = selectedIndikatorProfile.measurement_unit;
      if (unit === "Indeks" || unit === "Rasio") {
        // Handle old "Rasio" values just in case
        computedCapaian = Number(
          ((finalNum / (finalDen || 1)) * 25).toFixed(2),
        );
      } else if (unit === "Jumlah Kasus") {
        computedCapaian = finalNum;
      } else if (["Menit", "Jam", "Hari"].includes(unit)) {
        computedCapaian = Number((finalNum / (finalDen || 1)).toFixed(2));
      } else {
        computedCapaian = Number(
          ((finalNum / (finalDen || 1)) * 100).toFixed(2),
        );
      }
    } else {
      computedCapaian = Number(((finalNum / (finalDen || 1)) * 100).toFixed(2));
    }
    if (isNaN(computedCapaian)) computedCapaian = 0;

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
      capaian: data.kategori === "IKP" ? undefined : computedCapaian,
      status: data.kategori === "IKP" ? "N/A" : (achievementStatus as any),
      keterangan: data.keterangan || "",
      kpc: data.kategori === "IKP" ? data.kpc || 0 : undefined,
      knc: data.kategori === "IKP" ? data.knc || 0 : undefined,
      ktc: data.kategori === "IKP" ? data.ktc || 0 : undefined,
      ktd: data.kategori === "IKP" ? data.ktd || 0 : undefined,
      sentinel: data.kategori === "IKP" ? data.sentinel || 0 : undefined,
      visite_details: isVisiteDokter ? [...visiteGrid] : undefined,
      jatuh_details: isRisikoJatuh ? [...jatuhGrid] : undefined,
      identifikasi_details: isIdentifikasiPasien
        ? [...identifikasiGrid]
        : undefined,
      waktu_tunggu_details: isWaktuTunggu ? [...waktuTungguGrid] : undefined,
      fornas_details: isFornas ? [...fornasGrid] : undefined,
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
        achievement_percentage:
          data.kategori === "IKP" ? null : computedCapaian,
        notes: JSON.stringify({
          kpc: payload.kpc,
          knc: payload.knc,
          ktc: payload.ktc,
          ktd: payload.ktd,
          sentinel: payload.sentinel,
          keterangan: payload.keterangan || data.keterangan,
          visite_details: payload.visite_details,
          jatuh_details: payload.jatuh_details,
          identifikasi_details: payload.identifikasi_details,
          waktu_tunggu_details: payload.waktu_tunggu_details,
        }),
        attachment_url: uploadedProofName || null,
        created_at: new Date().toISOString(),
      });

      // Simpan rincian data visite ke tabel visite_dpjp jika applicable
      if (isVisiteDokter && visiteGrid.length > 0) {
        const visitePayload = visiteGrid.map((v) => ({
          tanggal_visite: v.tanggal,
          nama_pasien: v.nama_pasien,
          visite_sebelum_14: v.jam_visite_kurang_14,
          visite_setelah_14: v.jam_visite_lebih_14,
          nama_dokter: v.dokter_visite,
          keterangan:
            v.keterangan ||
            (v.jam_visite_kurang_14 ? "Sesuai Jadwal" : "Tidak Sesuai Jadwal"),
          indikator_id: data.indikator_id || null,
        }));
        try {
          await supabase.from("visite_dpjp").insert(visitePayload);
        } catch (e) {
          console.warn("Failed saving into visite_dpjp:", e);
        }
      }

      // Simpan rincian data waktu tunggu ke tabel waktu_tunggu_rajal
      if (isWaktuTunggu && waktuTungguGrid.length > 0) {
        const wtPayload = waktuTungguGrid.map((v) => ({
          tanggal: v.tanggal,
          nama_pasien: v.nama_pasien,
          no_rm: v.no_rm,
          jam_datang: v.jam_datang,
          jam_dilayani: v.jam_dilayani,
          selisih_menit: v.selisih_menit,
          memenuhi_standar: v.selisih_menit <= 60,
          indikator_id: data.indikator_id || null,
        }));
        try {
          await supabase.from("waktu_tunggu_rajal").insert(wtPayload);
        } catch (e) {
          console.warn("Failed saving into waktu_tunggu_rajal:", e);
        }
      }
    } catch (supabaseError) {
      console.warn(
        "Supabase sync skipped - data recorded in local Zustand and memory channels",
        supabaseError,
      );
    }

    // Success notifications and state cleanup
    setIsSubmitting(false);
    setSuccessMsg(true);
    setVisiteGrid([]);
    setJatuhGrid([]);
    setIdentifikasiGrid([]);
    setWaktuTungguGrid([]);
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
          <p className="text-gray-900 text-[10px] sm:text-sm font-semibold">
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
              <span className="font-extrabold block text-sm">
                Data Berhasil Disimpan!
              </span>
              <span className="text-xs text-emerald-700/90 font-medium mt-0.5 block">
                Sistem berhasil mengamankan record baru Anda di database dan
                menyinkronkan seluruh visual grafik dashboard secara instan.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* STEP 1 & 2: UNIT & TANGGAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Pilih Unit Selector */}
            <div
              className="space-y-3 relative animate-in fade-in duration-300"
              ref={unitDropdownRef}
            >
              <label className="flex items-center justify-between text-sm font-extrabold text-slate-800 tracking-wide h-8">
                <span>1. Pilih Unit</span>

                {/* Admin-only Add Room trigger */}
                <button
                  type="button"
                  onClick={handleOpenAddRoom}
                  className="text-xs font-black text-[#10a37f] hover:text-emerald-800 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-100 transition-colors w-7 h-7"
                  title="Tambah Ruangan"
                >
                  <Plus size={14} className="stroke-[3]" />
                </button>
              </label>

              {/* Custom Searchable Select Container */}
              <div className="relative">
                <div
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  className="w-full h-[56px] px-5 rounded-2xl border border-gray-200 outline-none transition-all text-slate-800 bg-white hover:border-[#10a37f]/50 cursor-pointer flex items-center justify-between shadow-xs select-none focus-within:border-[#10a37f] focus-within:ring-2 focus-within:ring-[#10a37f]/20"
                >
                  <span
                    className={
                      selectedUnit
                        ? "text-slate-900 text-sm font-semibold"
                        : "text-gray-400 text-sm font-medium"
                    }
                  >
                    {selectedUnit ? selectedUnit.name : "Silahkan pilih unit"}
                  </span>
                  <ChevronDown
                    className={`text-gray-400 h-4 w-4 transition-transform duration-200 ${showUnitDropdown ? "rotate-180" : ""}`}
                  />
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
              {errors.unit && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.unit.message}
                </p>
              )}
            </div>

            {/* 2. Pilih Tanggal Realtime */}
            <div className="space-y-3 animate-in fade-in duration-300">
              <label className="flex items-center text-sm font-extrabold text-slate-800 tracking-wide h-8">
                <span>2. Tanggal Input</span>
              </label>
              <div className="relative flex items-center h-[56px] w-full bg-white border border-gray-200 hover:border-[#10a37f]/50 focus-within:border-[#10a37f] focus-within:ring-2 focus-within:ring-[#10a37f]/20 rounded-2xl px-5 shadow-xs transition-all ring-offset-background">
                <input
                  type="date"
                  {...register("tanggal")}
                  className="w-full h-full bg-transparent outline-none text-slate-900 font-semibold text-sm cursor-pointer border-none p-0 focus:ring-0 leading-normal flex items-center [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 pr-2"
                />
              </div>
              {errors.tanggal && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.tanggal.message}
                </p>
              )}
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
                  <option value="" className="text-gray-400">
                    Pilih indikator
                  </option>
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
                  {
                    id: "sentinel",
                    label: "Sentinel",
                    sub: "Kejadian Sentinel",
                  },
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
              {isVisiteDokter && (
                <div className="bg-white border border-emerald-100 rounded-[28px] overflow-hidden shadow-xs animate-in fade-in">
                  <div className="bg-emerald-600 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-white" />
                      <h3 className="font-extrabold text-white tracking-wide text-sm md:text-base">
                        Input Data Indikator Kepatuhan Waktu Visite Dokter
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
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-12 text-center rounded-tl-xl border-r border-emerald-100/30">
                            No
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-32 border-r border-emerald-100/30">
                            Tanggal
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase border-r border-emerald-100/30">
                            Nama Pasien
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">
                            Visite {"<"} 14.00
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-28 border-r border-emerald-100/30">
                            Visite {">"} 14.00
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase border-r border-emerald-100/30 min-w-[200px]">
                            Dokter Penanggung Jawab
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-48 border-r border-emerald-100/30">
                            Keterangan
                          </th>
                          <th className="py-3 px-4 font-extrabold text-xs uppercase w-16 text-center rounded-tr-xl">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiteGrid.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-12 text-center text-gray-400 text-xs italic font-semibold border-b border-emerald-50 bg-[#fafdfc]"
                            >
                              Belum ada baris data audit. Silakan tambahkan
                              pasien untuk memulai verifikasi indikator visite
                              dokter.
                            </td>
                          </tr>
                        ) : (
                          visiteGrid.map((row, idx) => (
                            <tr
                              key={row.id}
                              className="border-b border-gray-50 hover:bg-emerald-50/10 transition-colors"
                            >
                              <td className="py-3 px-4 text-center text-sm font-semibold text-gray-400 border-r border-emerald-50">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="date"
                                  value={row.tanggal}
                                  onChange={(e) =>
                                    handleUpdateVisite(
                                      row.id,
                                      "tanggal",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-850"
                                />
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <input
                                  type="text"
                                  placeholder="Nama Lengkap Pasien"
                                  value={row.nama_pasien}
                                  onChange={(e) =>
                                    handleUpdateVisite(
                                      row.id,
                                      "nama_pasien",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.jam_visite_kurang_14}
                                  onChange={(e) =>
                                    handleUpdateVisite(
                                      row.id,
                                      "jam_visite_kurang_14",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 text-center border-r border-emerald-50">
                                <input
                                  type="checkbox"
                                  checked={row.jam_visite_lebih_14}
                                  onChange={(e) =>
                                    handleUpdateVisite(
                                      row.id,
                                      "jam_visite_lebih_14",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <select
                                  value={row.dokter_visite}
                                  onChange={(e) =>
                                    handleUpdateVisite(
                                      row.id,
                                      "dokter_visite",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                >
                                  <option value="">
                                    -- Pilih Dokter Spesialis --
                                  </option>
                                  <option value="dr. Hijrah Saputra WR, Sp.PD">
                                    dr. Hijrah Saputra WR, Sp.PD
                                  </option>
                                  <option value="dr. Niko Adhi Husni, Sp.PD., M.Kes., FINASIM">
                                    dr. Niko Adhi Husni, Sp.PD., M.Kes., FINASIM
                                  </option>
                                  <option value="dr. Dhyniek Nurul F.L.A., Sp.A">
                                    dr. Dhyniek Nurul F.L.A., Sp.A
                                  </option>
                                  <option value="dr. Ferry Sudarsono, Sp.B">
                                    dr. Ferry Sudarsono, Sp.B
                                  </option>
                                  <option value="dr. Haris Nur, Sp.N">
                                    dr. Haris Nur, Sp.N
                                  </option>
                                  <option value="dr. Billy Nusa Anggara T., Sp.OG">
                                    dr. Billy Nusa Anggara T., Sp.OG
                                  </option>
                                  <option value="dr. Muthiah Nurul Izzah, Sp.OG">
                                    dr. Muthiah Nurul Izzah, Sp.OG
                                  </option>
                                  <option value="dr. Asep Tajul Mutaqin, Sp.B">
                                    dr. Asep Tajul Mutaqin, Sp.B
                                  </option>
                                </select>
                              </td>
                              <td className="py-3 px-4 border-r border-emerald-50">
                                <select
                                  value={row.keterangan}
                                  onChange={(e) =>
                                    handleUpdateVisite(
                                      row.id,
                                      "keterangan",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                  required
                                >
                                  <option value="Sesuai Jadwal">
                                    Sesuai Jadwal
                                  </option>
                                  <option value="Tidak Sesuai Jadwal">
                                    Tidak Sesuai Jadwal
                                  </option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm("Hapus data pasien ini?")
                                    ) {
                                      handleRemoveVisiteRow(row.id);
                                    }
                                  }}
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
              {isRisikoJatuh && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white border border-emerald-100 rounded-[28px] overflow-hidden shadow-xs">
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

                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-emerald-50/55 border-b border-emerald-100 text-emerald-950">
                            <th className="py-3 px-4 font-extrabold text-xs uppercase w-12 text-center border-r border-emerald-100/30">
                              No
                            </th>
                            <th className="py-3 px-4 font-extrabold text-xs uppercase border-r border-emerald-100/30">
                              Nama Pasien
                            </th>
                            <th className="py-3 px-4 font-extrabold text-xs uppercase w-36 border-r border-emerald-100/30">
                              No. RM
                            </th>
                            <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-36 border-r border-emerald-100/30">
                              Asesmen Awal
                            </th>
                            <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-36 border-r border-emerald-100/30">
                              Asesmen Ulang
                            </th>
                            <th className="py-3 px-4 font-extrabold text-xs uppercase text-center w-36 border-r border-emerald-100/30">
                              Intervensi
                            </th>
                            <th className="py-3 px-4 font-extrabold text-xs uppercase w-16 text-center">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {jatuhGrid.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="py-12 text-center text-gray-400 text-xs italic font-semibold bg-[#fafdfc]"
                              >
                                Belum ada baris data audit. Silakan tambahkan
                                pasien.
                              </td>
                            </tr>
                          ) : (
                            jatuhGrid.map((row, idx) => (
                              <tr
                                key={row.id}
                                className="border-b border-gray-50 hover:bg-emerald-50/10 transition-colors"
                              >
                                <td className="py-3 px-4 text-center text-sm font-semibold text-gray-400 border-r border-emerald-50">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 border-r border-emerald-50">
                                  <input
                                    type="text"
                                    placeholder="Nama Lengkap Pasien"
                                    value={row.nama_pasien}
                                    onChange={(e) =>
                                      handleUpdateJatuh(
                                        row.id,
                                        "nama_pasien",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 border-r border-emerald-50">
                                  <input
                                    type="text"
                                    placeholder="No. Rekam Medis"
                                    value={row.no_rm}
                                    onChange={(e) =>
                                      handleUpdateJatuh(
                                        row.id,
                                        "no_rm",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-850"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 text-center border-r border-emerald-50">
                                  <select
                                    value={
                                      row.asesmen_awal === null
                                        ? ""
                                        : row.asesmen_awal
                                          ? "1"
                                          : "0"
                                    }
                                    onChange={(e) =>
                                      handleUpdateJatuh(
                                        row.id,
                                        "asesmen_awal",
                                        e.target.value === ""
                                          ? null
                                          : e.target.value === "1",
                                      )
                                    }
                                    className={`w-full h-8 rounded-lg outline-none text-xs font-bold text-center appearance-none ${row.asesmen_awal === null ? "bg-slate-100 text-slate-500" : row.asesmen_awal ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                  >
                                    <option value="">-- Pilih --</option>
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 text-center border-r border-emerald-50">
                                  <select
                                    value={
                                      row.asesmen_ulang === null
                                        ? ""
                                        : row.asesmen_ulang
                                          ? "1"
                                          : "0"
                                    }
                                    onChange={(e) =>
                                      handleUpdateJatuh(
                                        row.id,
                                        "asesmen_ulang",
                                        e.target.value === ""
                                          ? null
                                          : e.target.value === "1",
                                      )
                                    }
                                    className={`w-full h-8 rounded-lg outline-none text-xs font-bold text-center appearance-none ${row.asesmen_ulang === null ? "bg-slate-100 text-slate-500" : row.asesmen_ulang ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                  >
                                    <option value="">-- Pilih --</option>
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 text-center border-r border-emerald-50">
                                  <select
                                    value={
                                      row.intervensi === null
                                        ? ""
                                        : row.intervensi
                                          ? "1"
                                          : "0"
                                    }
                                    onChange={(e) =>
                                      handleUpdateJatuh(
                                        row.id,
                                        "intervensi",
                                        e.target.value === ""
                                          ? null
                                          : e.target.value === "1",
                                      )
                                    }
                                    className={`w-full h-8 rounded-lg outline-none text-xs font-bold text-center appearance-none ${row.intervensi === null ? "bg-slate-100 text-slate-500" : row.intervensi ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                  >
                                    <option value="">-- Pilih --</option>
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                  </select>
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
                </div>
              )}

              {/* Advanced Custom Form: Kepatuhan Identifikasi Pasien */}
              {isIdentifikasiPasien && (
                <div className="space-y-4 border-t border-emerald-100/10 pt-4 animate-in fade-in duration-300">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#0c2415] uppercase tracking-wide">
                      Form Observasi Kepatuhan Identifikasi Pasien
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Pilih dan observasi minimal satu peluang tindakan.
                      Kepatuhan dinilai berdasarkan kelengkapan identifikasi
                      pasien.
                    </p>
                  </div>

                  <div className="space-y-4">
                      {identifikasiGrid.map((row, idx) => (
                        <div
                          key={row.id}
                          className="bg-white border text-left border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 group hover:border-[#10a37f] transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#10a37f] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                          {/* Row Header & Delete */}
                          <div className="flex justify-end items-center border-b border-slate-100 pb-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveIdentifikasiRow(row.id)}
                              className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors ml-2"
                              title="Hapus Form Observasi"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Top: Observasi Details */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                                Tgl Observasi
                              </label>
                              <input
                                type="date"
                                value={row.tanggal_observasi}
                                onChange={(e) =>
                                  handleUpdateIdentifikasi(row.id, "tanggal_observasi", e.target.value)
                                }
                                className="w-full text-xs font-bold border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                                Jam
                              </label>
                              <input
                                type="time"
                                value={row.jam_observasi}
                                onChange={(e) =>
                                  handleUpdateIdentifikasi(row.id, "jam_observasi", e.target.value)
                                }
                                className="w-full text-xs font-bold border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                                Nama Observer
                              </label>
                              <input
                                type="text"
                                value={row.nama_observer}
                                onChange={(e) =>
                                  handleUpdateIdentifikasi(row.id, "nama_observer", e.target.value)
                                }
                                className="w-full text-xs font-bold border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-500 bg-slate-50/50"
                                placeholder="Observer..."
                              />
                            </div>
                          </div>

                          {/* Info Pasien */}
                          <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border border-slate-100">
                            <div>
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase">Nama Pasien</label>
                              <input
                                type="text"
                                value={row.nama_pasien}
                                onChange={(e) => handleUpdateIdentifikasi(row.id, "nama_pasien", e.target.value)}
                                className="w-full text-xs font-bold border-b border-slate-200 px-1 py-1 outline-none focus:border-emerald-500 bg-transparent"
                                placeholder="Nama Pasien"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase">No RM</label>
                              <input
                                type="text"
                                value={row.no_rm}
                                onChange={(e) => handleUpdateIdentifikasi(row.id, "no_rm", e.target.value)}
                                className="w-full text-xs font-bold border-b border-slate-200 px-1 py-1 outline-none focus:border-emerald-500 bg-transparent"
                                placeholder="00-00-00"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase">Tanggal Lahir</label>
                              <input
                                type="date"
                                value={row.tanggal_lahir}
                                onChange={(e) => handleUpdateIdentifikasi(row.id, "tanggal_lahir", e.target.value)}
                                className="w-full text-xs font-bold border-b border-slate-200 px-1 py-1 outline-none focus:border-emerald-500 bg-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase">Jenis Kelamin</label>
                              <select
                                value={row.jenis_kelamin}
                                onChange={(e) => handleUpdateIdentifikasi(row.id, "jenis_kelamin", e.target.value)}
                                className="w-full text-xs font-bold border-b border-slate-200 px-1 py-1 outline-none focus:border-emerald-500 bg-transparent appearance-none"
                              >
                                <option value="">- Pilih JK -</option>
                                <option value="Laki-Laki">Laki-Laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                            </div>
                          </div>

                          {/* Data Observasi Utama (Horizontal Table) */}
                          <div className="w-full border border-emerald-100 rounded-xl bg-white shadow-xs overflow-hidden">
                             <table className="w-full text-left border-collapse table-fixed">
                               <thead className="bg-[#059669] text-white">
                                 <tr>
                                   <th className="px-2 py-1 font-extrabold uppercase border-r border-[#047857] text-[9px] text-center w-[14%] align-middle bg-[#047857] sticky left-0 z-10">Komponen</th>
                                   {momentHeaders.map((hdr, index) => {
                                      const momentKey = `moment_${index}`;

                                      const isPatuhReal = row.moments[momentKey]?.patuh;
                                      const isAktif = row.moments[momentKey]?.aktif;
                                      return (
                                        <th key={index} className="px-1 py-1 font-bold uppercase text-center border-r border-[#047857] align-middle w-[9.5%] relative group">
                                          <div className="text-[7.5px] font-bold leading-tight truncate px-0.5 py-1 mb-0.5">{hdr.title}</div>
                                          
                                          {/* Status compliance under the header */}
                                          <div className="mt-1 flex justify-center h-4 items-center">
                                             {isAktif ? (
                                               isPatuhReal === true ? (
                                                  <span className="bg-emerald-600 text-white border border-emerald-400 px-1 py-0.2 rounded-[3px] text-[7px] font-extrabold tracking-tight">PATUH</span>
                                               ) : (
                                                  <span className="bg-rose-500 text-white border border-rose-400 px-1 py-0.2 rounded-[3px] text-[7px] font-extrabold tracking-tight">TDK PATUH</span>
                                               )
                                             ) : (
                                                <span className="text-emerald-200/50 text-[7px] font-bold tracking-tight uppercase">OFF</span>
                                             )}
                                          </div>

                                          {/* Enhanced hover tooltip */}
                                          <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900/95 text-white text-[9px] rounded shadow-lg z-50 text-center font-normal uppercase leading-normal">
                                            {hdr.label}
                                          </div>
                                        </th>
                                      );
                                   })}
                                 </tr>
                               </thead>
                               <tbody className="bg-white">
                                 {/* Baris 1: Siapa yang melakukan (Single inline text input) */}
                                 <tr className="border-b border-slate-100 bg-slate-50/20">
                                   <td className="px-2 py-1.5 font-extrabold text-slate-700 align-middle bg-slate-50 border-r border-slate-100 sticky left-0 z-10 text-[9px]">
                                      1. Siapa melakukan
                                   </td>
                                   <td colSpan={9} className="px-2 py-1 align-middle border-r border-slate-100">
                                      <input 
                                         type="text"
                                         value={row.petugas || ""} 
                                         onChange={(e) => handleUpdateIdentifikasi(row.id, "petugas", e.target.value)}
                                         placeholder="Tulis nama / peran petugas (contoh: Perawat A, Dokter Budi)..."
                                         className="w-full text-[9px] font-bold border border-slate-200 px-2.5 py-1 rounded-sm outline-none focus:border-emerald-500 bg-white placeholder:text-slate-400 placeholder:font-normal"
                                      />
                                   </td>
                                 </tr>

                                 {/* Baris 2: Apa yang ditanyakan? */}
                                 <tr className="border-b border-slate-100 bg-white">
                                   <td colSpan={10} className="px-2 py-1.5 font-bold text-slate-700 bg-transparent align-middle sticky left-0 z-10 text-[9px] leading-tight">
                                      2. Yang ditanyakan?
                                   </td>
                                 </tr>
                                 <tr className="border-b border-slate-100">
                                   <td className="px-2 py-2 pl-4 font-semibold text-slate-600 align-middle bg-slate-50 border-r border-slate-100 sticky left-0 z-10 text-[9px]">
                                      a. Nama Lengkap
                                   </td>
                                   {[0,1,2,3,4,5,6,7,8].map((idx) => {
                                      const momentKey = `moment_${idx}`;
                                      const mData = row.moments[momentKey] || { tanya_nama: null, tanya_tgllahir: null };
                                      return (
                                        <td key={idx} className="px-1 py-1.5 align-middle border-r border-slate-100 text-center">
                                           <TriStateSelector
                                              value={mData.tanya_nama}
                                              onChange={(val) => handleUpdateIdentifikasiMoment(row.id, momentKey, "tanya_nama", val)}
                                           />
                                        </td>
                                      );
                                   })}
                                 </tr>
                                 <tr className="border-b border-slate-100">
                                   <td className="px-2 py-2 pl-4 font-semibold text-slate-600 align-middle bg-slate-50 border-r border-slate-100 sticky left-0 z-10 text-[9px]">
                                      b. Tanggal Lahir
                                   </td>
                                   {[0,1,2,3,4,5,6,7,8].map((idx) => {
                                      const momentKey = `moment_${idx}`;
                                      const mData = row.moments[momentKey] || { tanya_nama: null, tanya_tgllahir: null };
                                      return (
                                        <td key={idx} className="px-1 py-1.5 align-middle border-r border-slate-100 text-center">
                                           <TriStateSelector
                                              value={mData.tanya_tgllahir}
                                              onChange={(val) => handleUpdateIdentifikasiMoment(row.id, momentKey, "tanya_tgllahir", val)}
                                           />
                                        </td>
                                      );
                                   })}
                                 </tr>

                                 {/* Baris 3: Bagaimana menanyakannya? */}
                                 <tr className="border-b border-slate-100 bg-white">
                                   <td colSpan={10} className="px-2 py-1.5 font-bold text-slate-700 bg-transparent align-middle sticky left-0 z-10 text-[9px] leading-tight">
                                      3. Cara menanyakan?
                                   </td>
                                 </tr>
                                 <tr className="border-b border-slate-100">
                                   <td className="px-2 py-2 pl-4 font-semibold text-slate-600 align-middle bg-slate-50 border-r border-slate-100 sticky left-0 z-10 text-[9px]">
                                      a. Secara Verbal
                                   </td>
                                   {[0,1,2,3,4,5,6,7,8].map((idx) => {
                                      const momentKey = `moment_${idx}`;
                                      const mData = row.moments[momentKey] || { cara_verbal: null, cara_visual: null };
                                      return (
                                        <td key={idx} className="px-1 py-1.5 align-middle border-r border-slate-100 text-center">
                                           <TriStateSelector
                                              value={mData.cara_verbal}
                                              onChange={(val) => handleUpdateIdentifikasiMoment(row.id, momentKey, "cara_verbal", val)}
                                           />
                                        </td>
                                      );
                                   })}
                                 </tr>
                                 <tr className="border-b border-slate-100">
                                   <td className="px-2 py-2 pl-4 font-semibold text-slate-600 align-middle bg-slate-50 border-r border-slate-100 sticky left-0 z-10 text-[9px]">
                                      b. Secara Visual
                                   </td>
                                   {[0,1,2,3,4,5,6,7,8].map((idx) => {
                                      const momentKey = `moment_${idx}`;
                                      const mData = row.moments[momentKey] || { cara_verbal: null, cara_visual: null };
                                      return (
                                        <td key={idx} className="px-1 py-1.5 align-middle border-r border-slate-100 text-center">
                                           <TriStateSelector
                                              value={mData.cara_visual}
                                              onChange={(val) => handleUpdateIdentifikasiMoment(row.id, momentKey, "cara_visual", val)}
                                           />
                                        </td>
                                      );
                                   })}
                                 </tr>

                                 {/* Baris 4: Dimana dilakukan identifikasi? */}
                                 <tr className="bg-slate-50/25">
                                   <td className="px-2 py-1.5 font-extrabold text-slate-700 align-middle bg-slate-50 border-r border-slate-100 sticky left-0 z-10 text-[9px]">
                                      4. Lokasi Identifikasi
                                   </td>
                                   <td colSpan={9} className="px-2 py-1 align-middle border-r border-slate-100">
                                      <select 
                                         value={row.lokasi || ""} 
                                         onChange={(e) => handleUpdateIdentifikasi(row.id, "lokasi", e.target.value)}
                                         className="w-full text-[9px] font-bold border border-slate-200 px-2 py-1 rounded-sm outline-none focus:border-emerald-500 bg-white"
                                      >
                                         <option value="">-- Pilih Lokasi Identifikasi --</option>
                                         <option value="Rawat Inap">Rawat Inap</option>
                                         <option value="Rawat Jalan">Rawat Jalan</option>
                                         <option value="IGD">IGD</option>
                                         <option value="Bersalin">Bersalin</option>
                                         <option value="Haemodialisis">Haemodialisis</option>
                                         <option value="Instalasi Kamar Bedah">Instalasi Kamar Bedah</option>
                                         <option value="ICU">ICU</option>
                                         <option value="Laboratorium">Laboratorium</option>
                                         <option value="Radiologi">Radiologi</option>
                                         <option value="Ruangan Lainnya">Ruangan Lainnya</option>
                                      </select>
                                   </td>
                                 </tr>
                               </tbody>
                             </table>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-4 pt-2">
                        <button
                          type="button"
                          onClick={handleAddIdentifikasiRow}
                          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#059669] px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          <Plus size={16} strokeWidth={3} />
                          Tambah Baris Observasi
                        </button>
                      </div>

                      {identifikasiGrid.length > 0 &&
                        (() => {
                          let calcNum = 0;
                          let calcDen = 0;
                          let tglLahirIssue = 0;
                          identifikasiGrid.forEach((d) => {
                             Object.values(d.moments || {}).forEach((m) => {
                                if (m.aktif) {
                                   calcDen++;
                                   if (m.patuh) calcNum++;
                                   if (m.tanya_tgllahir === "Tidak") tglLahirIssue++;
                                }
                             });
                          });
                          
                          const num = calcNum;
                          const den = calcDen;
                          const pct =
                            den > 0 ? ((num / den) * 100).toFixed(2) : "0.00";
                          const target = 100;
                          const isMet = parseFloat(pct) >= target;

                          return (
                            <div className="mt-8 space-y-6">
                              {/* Hasil Perhitungan */}
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6">
                                <h4 className="font-extrabold text-xs text-emerald-800 uppercase tracking-widest mb-4">
                                  Hasil Perhitungan
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                      Numerator
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600">
                                      {num}
                                    </span>
                                  </div>
                                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                      Denominator
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600">
                                      {den}
                                    </span>
                                  </div>
                                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                      Persentase
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600">
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                      Target
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600">
                                      100%
                                    </span>
                                  </div>
                                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                      Status
                                    </span>
                                    {isMet ? (
                                      <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg mt-1">
                                        MENCAPAI
                                      </span>
                                    ) : (
                                      <span className="text-sm font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-lg mt-1">
                                        BELUM
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Analisis & Rekomendasi */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                  <h4 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
                                    <Sparkles
                                      size={18}
                                      className="text-amber-500"
                                    />{" "}
                                    Analisa Capaian
                                  </h4>
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Berdasarkan hasil observasi, terdapat{" "}
                                    <strong>{den}</strong> observasi
                                    identifikasi pasien. Sebanyak{" "}
                                    <strong>{num}</strong> observasi dilakukan
                                    sesuai standar dan{" "}
                                    <strong>{den - num}</strong> observasi belum
                                    sesuai standar. Persentase kepatuhan sebesar{" "}
                                    <strong>{pct}%</strong> sehingga{" "}
                                    {isMet
                                      ? "telah mencapai"
                                      : "belum mencapai"}{" "}
                                    target indikator 100%.
                                    {tglLahirIssue > 0 &&
                                      ` Ketidaksesuaian banyak ditemukan pada proses verifikasi tanggal lahir pasien.`}
                                  </p>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                  <h4 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
                                    <Target
                                      size={18}
                                      className="text-emerald-500"
                                    />{" "}
                                    Rekomendasi Otomatis
                                  </h4>
                                  <ul className="text-xs text-slate-600 leading-relaxed font-medium space-y-2">
                                    <li className="flex gap-2 items-start">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>{" "}
                                      <span className="flex-1">
                                        Meningkatkan kepatuhan petugas dalam
                                        melakukan verifikasi dua identitas
                                        pasien.
                                      </span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>{" "}
                                      <span className="flex-1">
                                        Melakukan refresh training identifikasi
                                        pasien.
                                      </span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>{" "}
                                      <span className="flex-1">
                                        Melakukan supervisi berkala oleh kepala
                                        unit.
                                      </span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>{" "}
                                      <span className="flex-1">
                                        Melakukan audit observasi identifikasi
                                        pasien setiap bulan.
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                </div>
              )}

              {/* Advanced Custom Form: Waktu Tunggu Rawat Jalan (ID "5") */}
              {isWaktuTunggu && (
                <div className="space-y-4 border-t border-emerald-100/10 pt-4 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0c2415] uppercase tracking-wide">
                        TABEL PENGUMPULAN DATA - WAKTU TUNGGU RAWAT JALAN
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Catat data waktu pelayanan pasien untuk kalkulasi
                        indikator secara otomatis. Waktu tunggu terhitung
                        standar jika selisih ≤ 60 Menit.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border text-left border-gray-200 rounded-2xl shadow-sm overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                      <thead className="bg-[#059669] text-white select-none">
                        <tr>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-center w-12 rounded-tl-xl">
                            No
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider w-40">
                            Tanggal
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider w-64">
                            Nama Pasien
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider w-36">
                            No. RM
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-center w-36">
                            Jam Datang
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-center w-36">
                            Jam Pemeriksaan
                            <br />
                            Dokter
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-center w-40">
                            Selisih Waktu
                          </th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-center w-16 rounded-tr-xl">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {waktuTungguGrid.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center py-10 font-bold text-gray-500 bg-slate-50/50"
                            >
                              Belum ada data pasien diinput. Klik tombol
                              &quot;Tambah Pasien&quot; di bawah judul tabel
                              untuk memulai.
                            </td>
                          </tr>
                        ) : (
                          waktuTungguGrid.map((row, idx) => {
                            const hours = Math.floor(row.selisih_menit / 60);
                            const minutes = row.selisih_menit % 60;
                            const isStandar =
                              row.selisih_menit <= 60 &&
                              row.jam_datang !== "" &&
                              row.jam_dilayani !== "";

                            return (
                              <tr
                                key={row.id}
                                className={`border-b border-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"} hover:bg-emerald-50/20`}
                              >
                                <td className="py-3 px-4 text-center text-sm font-semibold text-gray-800 border-r border-gray-100">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 border-r border-gray-100">
                                  <input
                                    type="date"
                                    value={row.tanggal}
                                    onChange={(e) =>
                                      handleUpdateWaktuTunggu(
                                        row.id,
                                        "tanggal",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent outline-none text-xs font-bold text-[#374151]"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 border-r border-gray-100">
                                  <input
                                    type="text"
                                    placeholder="Masukkan nama pasien"
                                    value={row.nama_pasien}
                                    onChange={(e) =>
                                      handleUpdateWaktuTunggu(
                                        row.id,
                                        "nama_pasien",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent outline-none text-xs font-bold text-[#374151]"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 border-r border-gray-100">
                                  <input
                                    type="text"
                                    placeholder="No RM"
                                    value={row.no_rm}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(
                                        /[^0-9]/g,
                                        "",
                                      );
                                      handleUpdateWaktuTunggu(
                                        row.id,
                                        "no_rm",
                                        val,
                                      );
                                    }}
                                    className="w-full bg-transparent outline-none text-xs font-bold text-[#374151]"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 text-center border-r border-gray-100">
                                  <input
                                    type="time"
                                    value={row.jam_datang}
                                    onChange={(e) =>
                                      handleUpdateWaktuTunggu(
                                        row.id,
                                        "jam_datang",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent outline-none text-xs font-bold text-[#374151] text-center"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 text-center border-r border-gray-100">
                                  <input
                                    type="time"
                                    value={row.jam_dilayani}
                                    onChange={(e) =>
                                      handleUpdateWaktuTunggu(
                                        row.id,
                                        "jam_dilayani",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent outline-none text-xs font-bold text-[#374151] text-center"
                                    required
                                  />
                                </td>
                                <td className="py-3 px-4 text-center border-r border-gray-100 font-bold">
                                  {row.jam_datang && row.jam_dilayani ? (
                                    <span
                                      className={`${isStandar ? "text-[#059669]" : "text-red-600"} text-[11px]`}
                                    >
                                      {hours > 0 ? `${hours} Jam ` : ""}
                                      {minutes} Menit
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-normal">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveWaktuTungguRow(row.id)
                                    }
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-block"
                                    title="Hapus Baris"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleAddWaktuTungguRow}
                      className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Tambah Baris Pasien
                    </button>
                  </div>
                </div>
              )}

              {/* Form Kepatuhan Penggunaan Formularium Nasional */}
              {isFornas && (
                <div className="space-y-4 border-t border-emerald-100/10 pt-4 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0c2415] uppercase tracking-wide">
                        TABEL PENGUMPULAN DATA - KEPATUHAN PENGGUNAAN FORMULARIUM NASIONAL
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Isi form harian. Persentase kepatuhan dihitung secara otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="w-full border border-emerald-100 rounded-2xl bg-white shadow-xs overflow-x-auto relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                      <thead className="bg-[#059669] text-white">
                        <tr>
                          <th className="py-3 px-4 font-extrabold uppercase text-[10px] w-12 text-center sticky left-0 z-10 bg-[#047857]">
                            NO
                          </th>
                          <th className="py-3 px-4 font-extrabold uppercase text-[10px] w-40 sticky left-12 z-10 bg-[#047857] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            TANGGAL
                          </th>
                          <th className="py-3 px-4 font-extrabold uppercase text-[10px]">
                            JUMLAH RESEP
                          </th>
                          <th className="py-3 px-4 font-extrabold uppercase text-[10px]">
                            JUMLAH RESEP <br/>SESUAI FORNAS
                          </th>
                          <th className="py-3 px-4 font-extrabold text-center uppercase text-[10px]">
                            JUMLAH RESEP TIDAK<br/>SESUAI FORMULARIUM
                          </th>
                          <th className="py-3 px-4 font-extrabold text-center uppercase text-[10px]">
                            PERSENTASE (%) KEPATUHAN <br/>RESEP SESUAI FORMULARIUM
                          </th>
                          <th className="py-3 px-4 font-extrabold text-center uppercase text-[10px]">
                            TARGET (%)
                          </th>
                          <th className="py-3 px-4 font-extrabold uppercase text-[10px] w-16 text-center">
                            AKSI
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fornasGrid.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center bg-slate-50 border-b border-slate-100">
                              <p className="text-xs font-bold text-slate-400">Belum ada data</p>
                            </td>
                          </tr>
                        ) : (
                          fornasGrid.map((row, idx) => {
                            const numStr = String(row.jumlah_resep).replace(/\D/g, "");
                            const num = numStr === "" ? 0 : parseInt(numStr, 10);
                            
                            const sesStr = String(row.jumlah_sesuai).replace(/\D/g, "");
                            const ses = sesStr === "" ? 0 : parseInt(sesStr, 10);
                            
                            const tdk_sesuai = num > 0 ? Math.max(0, num - ses) : 0;
                            const persentase = num > 0 ? parseFloat(((ses / num) * 100).toFixed(2)) : 0;
                            const isTercapai = persentase >= 80;

                            return (
                              <tr
                                key={row.id}
                                className="border-b border-slate-100 hover:bg-[#f0fdf4] transition-colors"
                              >
                                <td className="py-2.5 px-4 text-xs font-bold text-slate-500 text-center sticky left-0 z-10 bg-white group-hover:bg-[#f0fdf4]">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-4 sticky left-12 z-10 bg-white group-hover:bg-[#f0fdf4] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                  <input
                                    type="date"
                                    value={row.tanggal}
                                    onChange={(e) =>
                                      handleUpdateFornas(row.id, "tanggal", e.target.value)
                                    }
                                    className="w-full text-xs font-bold text-slate-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
                                  />
                                </td>
                                <td className="py-2.5 px-4">
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.jumlah_resep}
                                    onChange={(e) =>
                                      handleUpdateFornas(row.id, "jumlah_resep", e.target.value)
                                    }
                                    placeholder="0"
                                    className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 outline-none focus:border-emerald-500 rounded px-3 py-1.5"
                                  />
                                </td>
                                <td className="py-2.5 px-4">
                                  <input
                                    type="number"
                                    min="0"
                                    max={num || undefined}
                                    value={row.jumlah_sesuai}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (!isNaN(val) && val > num) {
                                        return;
                                      }
                                      handleUpdateFornas(row.id, "jumlah_sesuai", e.target.value);
                                    }}
                                    placeholder="0"
                                    className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 outline-none focus:border-emerald-500 rounded px-3 py-1.5"
                                  />
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold inline-block min-w-[3rem]">
                                    {tdk_sesuai}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                   <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold inline-block min-w-[3rem] ${persentase > 0 ? (isTercapai ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600") : "bg-slate-50 text-slate-400"}`}>
                                      {num > 0 ? `${persentase}%` : "-"}
                                   </div>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                   <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-[11px] font-bold inline-block min-w-[3rem] border border-amber-100">
                                      80%
                                   </div>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if(window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
                                        handleRemoveFornasRow(row.id);
                                      }
                                    }}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-block"
                                    title="Hapus Baris"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleAddFornasRow}
                      className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Tambah Baris Data
                    </button>
                  </div>
                  
                  {/* Rekapitulasi Otomatis for Fornas */}
                  {fornasGrid.length > 0 && (
                     <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
                        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-xs break-words border-b-[4px] border-b-sky-500 relative hover:shadow-md transition-all">
                          <p className="text-[10px] text-sky-500 font-extrabold uppercase mb-1">Total Resep</p>
                          <p className="text-xl font-black text-sky-600">
                            {fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_resep) || 0), 0)}
                          </p>
                        </div>
                        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-xs break-words border-b-[4px] border-b-emerald-500 relative hover:shadow-md transition-all">
                          <p className="text-[10px] text-emerald-500 font-extrabold uppercase mb-1">Total Sesuai Fornas</p>
                          <p className="text-xl font-black text-emerald-600">
                            {fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_sesuai) || 0), 0)}
                          </p>
                        </div>
                        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-xs break-words border-b-[4px] border-b-rose-500 relative hover:shadow-md transition-all">
                          <p className="text-[10px] text-rose-500 font-extrabold uppercase mb-1">Total Tidak Sesuai</p>
                          <p className="text-xl font-black text-rose-600">
                            {fornasGrid.reduce((acc, curr) => {
                               const num = Number(curr.jumlah_resep) || 0;
                               const ses = Number(curr.jumlah_sesuai) || 0;
                               return acc + Math.max(0, num - ses);
                            }, 0)}
                          </p>
                        </div>
                        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-xs break-words border-b-[4px] border-b-amber-500 relative hover:shadow-md transition-all">
                          <p className="text-[10px] text-amber-500 font-extrabold uppercase mb-1 z-10">Kepatuhan Bulanan</p>
                          <p className="text-xl font-black text-amber-600 z-10">
                            {(() => {
                               const tNum = fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_sesuai) || 0), 0);
                               const tDen = fornasGrid.reduce((acc, curr) => acc + (Number(curr.jumlah_resep) || 0), 0) || 1;
                               const pct = ((tNum / tDen) * 100).toFixed(1);
                               return `${pct}%`;
                            })()}
                          </p>
                        </div>
                     </div>
                  )}
                </div>
              )}

              {/* C. Fallback Fields For Dynamic Standard Indicators */}
              {!isVisiteDokter &&
                !isRisikoJatuh &&
                !isIdentifikasiPasien &&
                !isWaktuTunggu &&
                !isFornas && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-emerald-100/10 pt-4">
                    <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:shadow-xs hover:border-emerald-100 transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-2.5 mb-4">
                          <Activity
                            size={20}
                            className="text-emerald-600"
                            strokeWidth={2.5}
                          />
                          <h4 className="font-extrabold text-[11px] tracking-widest text-[#0c2415] uppercase">
                            NUMERATOR
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          {selectedIndikatorProfile.numerator ||
                            "Isi nilai pembilang indikator."}
                        </p>
                      </div>
                      <div className="mt-6">
                        <input
                          type="number"
                          placeholder="Nilai Pembilang (Numerator)"
                          {...register("numerator_val", {
                            valueAsNumber: true,
                          })}
                          className="w-full px-5 py-3.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-extrabold text-base"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-[#fbFdfC] border border-emerald-50 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:shadow-xs hover:border-emerald-100 transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-2.5 mb-4">
                          <Layers
                            size={20}
                            className="text-emerald-700"
                            strokeWidth={2.5}
                          />
                          <h4 className="font-extrabold text-[11px] tracking-widest text-[#0c2415] uppercase">
                            DENOMINATOR
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          {selectedIndikatorProfile.denominator ||
                            "Isi nilai penyebut indikator."}
                        </p>
                      </div>
                      <div className="mt-6">
                        <input
                          type="number"
                          placeholder="Nilai Penyebut (Denominator)"
                          {...register("denominator_val", {
                            valueAsNumber: true,
                          })}
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
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all max-w-2xl mx-auto w-full">
              <span className="text-sm md:text-base font-semibold text-gray-500 tracking-wide md:mb-1">
                Persentase Capaian
              </span>

              <div className="flex flex-col items-center gap-5 mt-1">
                <span
                  className={`text-[60px] md:text-[72px] font-bold leading-none tracking-tight transition-all duration-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${
                    achievementStatus === "Tercapai"
                      ? "text-[#10a37f]"
                      : achievementStatus === "Mendekati"
                        ? "text-amber-500"
                        : "text-red-500"
                  }`}
                >
                  {computedCapaian}%
                </span>

                <span
                  className={`px-6 py-2.5 rounded-full text-sm md:text-base font-bold shadow-sm transition-colors duration-500 ${
                    achievementStatus === "Tercapai"
                      ? "bg-emerald-50 text-[#10a37f] border border-emerald-100/50"
                      : achievementStatus === "Mendekati"
                        ? "bg-amber-50 text-amber-600 border border-amber-100/50"
                        : "bg-red-50 text-red-600 border border-red-100/50"
                  }`}
                >
                  {achievementStatus === "Mendekati"
                    ? "Mendekati Target"
                    : achievementStatus}
                </span>
              </div>
            </div>
          )}

          {/* BUTTON SAVE SUBMISSION */}
          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto px-12 py-4 rounded-xl font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg ${
                watchKategori === "IKP"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/10"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Zap className="animate-spin text-white" size={18} />{" "}
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> Simpan Data
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
                <label className="block text-xs font-black text-slate-800 tracking-wide uppercase">
                  Nama Ruangan / Unit *
                </label>
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
                <label className="block text-xs font-black text-slate-800 tracking-wide uppercase">
                  Kategori Ruangan
                </label>
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
                <label className="block text-xs font-black text-slate-800 tracking-wide uppercase">
                  Status Pelayanan
                </label>
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

      {/* DELETE CONFIRMATION MODAL FOR KEPATUHAN IDENTIFIKASI PASIEN */}
      {deleteIdentifikasiId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[28px] border border-rose-100 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-500 p-5 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm md:text-base tracking-wide flex items-center gap-2">
                <ShieldAlert size={18} />
                Konfirmasi Hapus Data
              </h3>
              <button
                onClick={() => setDeleteIdentifikasiId(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 md:p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm md:text-base">
                  Apakah Anda yakin ingin menghapus form observasi pasien ini?
                </h4>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteIdentifikasiId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-550 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveIdentifikasi}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-md shadow-rose-500/20"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
