import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, X, Search, Edit, Trash2, Eye, FileText, Download, 
  AlertTriangle, CheckCircle, Award, Layers, Users, Compass, 
  Network, HelpCircle, Copy, Check, Calculator, AlertCircle, 
  Calendar, RefreshCw, ChevronDown, Filter, Printer, FileDown, Target
} from 'lucide-react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore, IndicatorProfile } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { formatTarget } from '../../lib/utils';

// Form validation schema adhering to strict required validation rules
const schema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, "Kategori wajib dipilih"),
  indicator_title: z.string().min(1, "Judul indikator wajib diisi"),
  rationale: z.string().min(1, "Dasar pemikiran wajib diisi"),
  quality_dimension: z.string().min(1, "Dimensi mutu wajib dipilih"),
  objective: z.string().min(1, "Tujuan wajib diisi"),
  operational_definition: z.string().min(1, "Definisi operasional wajib diisi"),
  indicator_type: z.string().min(1, "Tipe indikator wajib dipilih"),
  measurement_unit: z.string().min(1, "Satuan pengukuran wajib dipilih"),
  numerator: z.string().min(1, "Numerator wajib diisi"),
  denominator: z.string().min(1, "Denominator wajib diisi"),
  target: z.string().min(1, "Target wajib diisi"),
  criteria: z.string().min(1, "Kriteria wajib diisi"),
  formula: z.string().min(1, "Formula wajib diisi"),
  data_collection_method: z.string().min(1, "Metode pengumpulan data wajib diisi"),
  data_source: z.string().min(1, "Sumber data wajib diisi"),
  sampling_method: z.string().min(1, "Cara pengambilan sampel wajib diisi"),
  data_collection_tool: z.string().min(1, "Instrument pengambilan data wajib diisi"),
  sample_size: z.string().min(1, "Besar sampel wajib diisi"),
  collection_period: z.string().min(1, "Periode pengumpulan data wajib dipilih"),
  analysis_period: z.string().min(1, "Periode analisis wajib dipilih"),
  data_presentation: z.string().min(1, "Penyajian data wajib dipilih"),
  person_responsible: z.string().min(1, "Penanggung jawab wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

// Helper functions for database backward compatibility and adaptation
const adaptFromSupabase = (dbItem: any): IndicatorProfile => {
  return {
    id: dbItem.id,
    category: dbItem.category === 'IMP Unit' ? 'IMP-Unit' : (dbItem.category || 'INM'),
    indicator_title: dbItem.title || dbItem.indicator_title || "",
    rationale: dbItem.rationale || "—",
    quality_dimension: dbItem.quality_dimension || "—",
    objective: dbItem.purpose || dbItem.objective || "—",
    operational_definition: dbItem.operational_definition || "—",
    indicator_type: dbItem.indicator_type || "—",
    measurement_unit: dbItem.measurement_unit || "—",
    numerator: dbItem.numerator || "—",
    denominator: dbItem.denominator || "—",
    target: dbItem.target ? String(dbItem.target) : "—",
    criteria: dbItem.criteria || "—",
    formula: dbItem.formula || "—",
    data_collection_method: dbItem.data_collection_method || "—",
    data_source: dbItem.data_source || "—",
    sampling_method: dbItem.sampling_method || "—",
    data_collection_tool: dbItem.data_collection_instrument || dbItem.data_collection_tool || "—",
    sample_size: dbItem.sample_size || "—",
    collection_period: dbItem.collection_period || "—",
    analysis_period: dbItem.analysis_period || "—",
    data_presentation: dbItem.data_presentation || "—",
    person_responsible: dbItem.person_in_charge || dbItem.person_responsible || "—",
    reverse: dbItem.reverse || false,
    created_at: dbItem.created_at,
    updated_at: dbItem.updated_at,
  };
};

const adaptToSupabase = (profile: IndicatorProfile, email?: string) => {
  return {
    id: profile.id,
    category: profile.category,
    title: profile.indicator_title,
    rationale: profile.rationale,
    quality_dimension: profile.quality_dimension,
    purpose: profile.objective || "—",
    operational_definition: profile.operational_definition,
    indicator_type: profile.indicator_type,
    measurement_unit: profile.measurement_unit,
    numerator: profile.numerator,
    denominator: profile.denominator,
    target: profile.target,
    criteria: profile.criteria,
    formula: profile.formula,
    data_collection_method: profile.data_collection_method,
    data_source: profile.data_source,
    sampling_method: profile.sampling_method,
    data_collection_instrument: profile.data_collection_tool,
    sample_size: profile.sample_size,
    collection_period: profile.collection_period,
    analysis_period: profile.analysis_period,
    data_presentation: profile.data_presentation,
    person_in_charge: profile.person_responsible,
    reverse: profile.reverse || false,
    created_by: email || "admin@optimus.hospital",
    updated_at: new Date().toISOString()
  };
};

const FormattedDocumentText = ({ content }: { content: string }) => {
  if (!content || typeof content !== 'string') return <span>—</span>;
  const lines = content.split('\n');
  return (
    <div className="space-y-3 text-justify text-[13px] md:text-[14px]">
      {lines.map((line, idx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;

        // Match main number list (e.g., "1. ")
        const numMatch = trimmedLine.match(/^(\d+\.)\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-3">
              <span className="shrink-0 font-bold text-gray-800 w-5 text-right mt-[2px]">{numMatch[1]}</span>
              <span className="text-gray-700 font-medium leading-[1.8] flex-1">{numMatch[2]}</span>
            </div>
          );
        }

        // Match sub list (e.g., "a. ")
        const alphaMatch = trimmedLine.match(/^([a-z]\.)\s+(.*)/i);
        if (alphaMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 pl-8">
              <span className="shrink-0 font-semibold text-gray-700 w-4 text-right mt-[2px]">{alphaMatch[1]}</span>
              <span className="text-gray-600 leading-[1.8] flex-1">{alphaMatch[2]}</span>
            </div>
          );
        }

        // Match bullet (e.g., "- " or "• ")
        const bulletMatch = trimmedLine.match(/^([•\-])\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 pl-8">
              <span className="shrink-0 font-bold text-gray-500 w-4 text-right mt-[2px]">•</span>
              <span className="text-gray-600 leading-[1.8] flex-1">{bulletMatch[2]}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <div key={idx} className="text-gray-700 font-medium leading-[1.8]">
            {trimmedLine}
          </div>
        );
      })}
    </div>
  );
};

const DetailRow = ({ label, value, id }: { label: string, value: React.ReactNode, id?: string }) => (
  <div id={id} className="flex flex-col md:flex-row overflow-hidden border-b border-gray-200 last:border-b-0 transition-colors hover:bg-slate-50/50">
    <div className="w-full md:w-[30%] bg-[#10a37f] p-5 md:p-6 flex items-start shrink-0 border-b md:border-b-0 md:border-r border-gray-200">
      <span className="text-white font-extrabold text-[11px] md:text-sm leading-snug block tracking-wider uppercase">{label}</span>
    </div>
    <div className="w-full md:w-[70%] bg-white p-5 md:p-6 text-gray-700 text-sm">
      {typeof value === 'string' ? (
        <FormattedDocumentText content={value} />
      ) : (
        <div className="font-medium text-[13px] md:text-[14px] text-gray-600 whitespace-pre-wrap">{value}</div>
      )}
    </div>
  </div>
);

export default function ProfilIndikator() {
  const queryClient = useQueryClient();
  const { indicatorProfiles, setIndicatorProfiles, addIndicatorProfile, updateIndicatorProfile, deleteIndicatorProfile } = useStore();
  const userRole = useStore((state) => state.userRole);
  const hospitalLogo = useStore((state) => state.hospitalLogo);

  // UI Dialog/Overlay State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<IndicatorProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");

  // Notifications State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Formula Builder helpers & triggers
  const [isFormulaManual, setIsFormulaManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draftRestoredMsg, setDraftRestoredMsg] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState(false);

  // Local state for role control (for UI testing)
  const handleRoleToggle = (role: "Admin" | "User biasa") => {
    useStore.setState({ userRole: role });
    showToast(`Hak akses beralih ke: ${role}`, "info");
  };

  // Helper clear/reset showToast
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Form setup
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'INM',
      indicator_title: '',
      rationale: '',
      quality_dimension: 'Keselamatan',
      objective: '',
      operational_definition: '',
      indicator_type: 'Proses',
      measurement_unit: 'Persen (%)',
      numerator: '',
      denominator: '',
      target: "≥ 80%",
      criteria: '',
      formula: '',
      data_collection_method: 'Retrospektif',
      data_source: 'Rekam Medis',
      sampling_method: 'Total Sampling',
      data_collection_tool: 'Formulir Catatan',
      sample_size: 'Total seluruh populasi',
      collection_period: 'Bulanan',
      analysis_period: 'Triwulanan',
      data_presentation: 'Tabel',
      person_responsible: ''
    }
  });

  // Hot watches
  const watchNum = watch("numerator");
  const watchDen = watch("denominator");
  const watchUnit = watch("measurement_unit");
  const watchFormula = watch("formula");
  const watchAllFields = watch();

  // Real-time automatic formula generator
  useEffect(() => {
    if (!isFormulaManual && showForm) {
      if (watchNum && watchDen) {
        const hasPercent = watchUnit?.includes("%") || watchUnit?.toLowerCase().includes("persen");
        const formattedFormula = `("${watchNum.trim()}" / "${watchDen.trim()}")${hasPercent ? ' × 100%' : ''}`;
        setValue("formula", formattedFormula);
      } else {
        setValue("formula", "");
      }
    }
  }, [watchNum, watchDen, watchUnit, isFormulaManual, setValue, showForm]);

  // Read draft state on edit/add initiation or resume on component mount
  const checkAndOfferDraft = () => {
    const draft = localStorage.getItem("optimus_indicator_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.indicator_title || parsed.numerator) {
          reset(parsed);
          setDraftRestoredMsg(true);
          showToast("Draf pengisian sebelumnya dipulihkan secara otomatis!", "info");
          setTimeout(() => setDraftRestoredMsg(false), 4000);
        }
      } catch (e) {
        console.warn("Could not read draft state", e);
      }
    }
  };

  // Debounced auto draft save configuration 
  useEffect(() => {
    if (showForm) {
      const timer = setTimeout(() => {
        localStorage.setItem("optimus_indicator_draft", JSON.stringify(watchAllFields));
        setDraftSavedMsg(true);
        setTimeout(() => setDraftSavedMsg(false), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchAllFields, showForm]);

  // Clean draft on successful save or cancel
  const clearDraft = () => {
    localStorage.removeItem("optimus_indicator_draft");
  };

  // Fetch indicator profiles with TanStack Query directly from Supabase
  const { data: profiles = [], isLoading } = useQuery<IndicatorProfile[]>({
    queryKey: ['master_indikator'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('master_indikator')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const normalized = data.map(item => adaptFromSupabase(item));
          setIndicatorProfiles(normalized);
          return normalized;
        } else {
          // SEED DATABASE: if Supabase contains 0 profiles, upload defaults.
          const localProfiles = useStore.getState().indicatorProfiles;
          if (localProfiles.length > 0) {
            const seedData = localProfiles.map(p => adaptToSupabase(p));
            const { error: seedError } = await supabase
              .from('master_indikator')
              .insert(seedData);

            if (!seedError) {
              const { data: refreshed } = await supabase
                .from('master_indikator')
                .select('*')
                .order('created_at', { ascending: true });
              if (refreshed) {
                const refreshedNormalized = refreshed.map(item => adaptFromSupabase(item));
                setIndicatorProfiles(refreshedNormalized);
                return refreshedNormalized;
              }
            }
          }
          return localProfiles;
        }
      } catch (err) {
        console.warn("Using offline memory fallback due to Supabase read timeout/err", err);
        return useStore.getState().indicatorProfiles;
      }
    },
    initialData: indicatorProfiles,
    refetchOnWindowFocus: false,
  });

  // Supabase Real-time connection handler / Real-time synchronicity
  useEffect(() => {
    const channel = supabase
      .channel('master_indikator_realtime_changes_tab')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'master_indikator' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['master_indikator'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: IndicatorProfile) => {
      const dbPayload = adaptToSupabase(payload);
      
      // Gunakan created_at dari payload jika ada
      if (payload.created_at) {
        (dbPayload as any).created_at = payload.created_at;
      }

      console.log("Saving dbPayload to supabase:", dbPayload);

      const { error } = await supabase
        .from('master_indikator')
        .upsert(dbPayload);

      if (error) {
        console.error("Supabase upsert error:", error);
        throw error;
      }
      
      return payload;
    },
    onMutate: async (newProfile) => {
      await queryClient.cancelQueries({ queryKey: ['master_indikator'] });
      const previous = queryClient.getQueryData(['master_indikator']);
      
      // Optimistic updates
      if (editingId) {
        updateIndicatorProfile(editingId, newProfile);
      } else {
        addIndicatorProfile(newProfile);
      }
      return { previous };
    },
    onError: (err, newProfile, context: any) => {
      // Offline fallback: do not revert the queryData. Sync it with local store.
      queryClient.setQueryData(['master_indikator'], useStore.getState().indicatorProfiles);
      showToast("Tersimpan di memori lokal (offline/no-supabase).", "info");
      clearDraft();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_indikator'] });
      showToast(editingId ? "Profil indikator berhasil diperbarui!" : "Profil indikator baru berhasil disimpan!", "success");
      clearDraft();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('master_indikator')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['master_indikator'] });
      const previous = queryClient.getQueryData(['master_indikator']);
      deleteIndicatorProfile(id);
      return { previous };
    },
    onError: (err, id, context: any) => {
      // Offline fallback: do not revert queryData.
      queryClient.setQueryData(['master_indikator'], useStore.getState().indicatorProfiles);
      showToast("Dihapus dari memori lokal (offline/no-supabase).", "info");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_indikator'] });
      showToast("Profil indikator berhasil dihapus!", "success");
    },
  });

  const handleAdd = () => {
    setEditingId(null);
    setIsFormulaManual(false);
    reset({
      category: 'INM',
      indicator_title: '',
      rationale: '',
      quality_dimension: 'Keselamatan',
      objective: '',
      operational_definition: '',
      indicator_type: 'Proses',
      measurement_unit: 'Persen (%)',
      numerator: '',
      denominator: '',
      target: "≥ 80%",
      criteria: '',
      formula: '',
      data_collection_method: 'Retrospektif',
      data_source: 'Rekam Medis',
      sampling_method: 'Total Sampling',
      data_collection_tool: 'Formulir Catatan',
      sample_size: 'Total seluruh populasi',
      collection_period: 'Bulanan',
      analysis_period: 'Triwulanan',
      data_presentation: 'Tabel',
      person_responsible: ''
    });
    setShowForm(true);
    // check for draft
    setTimeout(() => {
      checkAndOfferDraft();
    }, 100);
  };

  const handleEdit = (profile: IndicatorProfile) => {
    setEditingId(profile.id);
    setIsFormulaManual(true); // default to true on edit so we keep manual formula modifications
    reset({
      ...profile,
      target: profile.target
    } as any);
    setShowForm(true);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleDeleteExecute = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
      setDeletingId(null);
    }
  };

  const onSubmit = (data: FormValues) => {
    const profileId = editingId || crypto.randomUUID();
    
    // Find existing profile to potentially preserve created_at
    const existingProfiles = useStore.getState().indicatorProfiles;
    const existing = existingProfiles.find(p => p.id === profileId);
    
    const payload: IndicatorProfile = {
      ...(data as any),
      id: profileId,
      created_at: existing?.created_at || new Date().toISOString()
    };
    saveMutation.mutate(payload);
    setShowForm(false);
  };

  const handleResetForm = () => {
    if (window.confirm("Batal melakukan perubahan dan bersihkan draft? Semua data terisi akan hilang.")) {
      clearDraft();
      reset({
        category: 'INM',
        indicator_title: '',
        rationale: '',
        quality_dimension: 'Keselamatan',
        objective: '',
        operational_definition: '',
        indicator_type: 'Proses',
        measurement_unit: 'Persen (%)',
        numerator: '',
        denominator: '',
        target: "≥ 80%",
        criteria: '',
        formula: '',
        data_collection_method: 'Retrospektif',
        data_source: 'Rekam Medis',
        sampling_method: 'Total Sampling',
        data_collection_tool: 'Formulir Catatan',
        sample_size: 'Total seluruh populasi',
        collection_period: 'Bulanan',
        analysis_period: 'Triwulanan',
        data_presentation: 'Tabel',
        person_responsible: ''
      });
      showToast("Form berhasil di-reset", "info");
    }
  };

  // Search & Filter
  const filteredData = useMemo(() => {
    const sortedProfiles = [...(profiles || [])];
    sortedProfiles.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return String(a.id).localeCompare(String(b.id));
    });

    return sortedProfiles.filter(p => {
      const title = p.indicator_title || "";
      const category = p.category || "";
      const rationaleText = p.rationale || "";
      const pj = p.person_responsible || "";
      
      const term = searchQuery.toLowerCase().trim();
      const matchSearch = !term || 
        title.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        rationaleText.toLowerCase().includes(term) ||
        pj.toLowerCase().includes(term);

      const matchCategory = categoryFilter === "Semua" || 
        category === categoryFilter ||
        (categoryFilter === "IMP-Unit" && category === "IMP Unit") ||
        (categoryFilter === "IMP-Unit" && category === "IMP-Unit");

      return matchSearch && matchCategory;
    });
  }, [profiles, searchQuery, categoryFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "No", "ID", "Kategori", "Judul Indikator", "Dasar Pemikiran", 
      "Dimensi Mutu", "Tujuan", "Definisi Operasional", "Tipe Indikator", 
      "Satuan", "Numerator", "Denominator", "Target", "Kriteria", 
      "Formula", "Metode Koleksi", "Sumber Data", "Pengambilan Sampel", 
      "Instrumen", "Besar Sampel", "Periode Koleksi", "Periode Analisis", 
      "Penyajian", "Penanggung Jawab"
    ];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.id,
      item.category,
      `"${item.indicator_title.replace(/"/g, '""')}"`,
      `"${item.rationale.replace(/"/g, '""')}"`,
      item.quality_dimension,
      `"${item.objective.replace(/"/g, '""')}"`,
      `"${item.operational_definition.replace(/"/g, '""')}"`,
      item.indicator_type,
      item.measurement_unit,
      `"${item.numerator.replace(/"/g, '""')}"`,
      `"${item.denominator.replace(/"/g, '""')}"`,
      item.target,
      `"${item.criteria.replace(/"/g, '""')}"`,
      `"${item.formula.replace(/"/g, '""')}"`,
      `"${item.data_collection_method.replace(/"/g, '""')}"`,
      `"${item.data_source.replace(/"/g, '""')}"`,
      `"${item.sampling_method.replace(/"/g, '""')}"`,
      `"${item.data_collection_tool.replace(/"/g, '""')}"`,
      `"${item.sample_size.replace(/"/g, '""')}"`,
      item.collection_period,
      item.analysis_period,
      item.data_presentation,
      `"${item.person_responsible.replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Profil_Indikator_${categoryFilter}_OPTIMUS.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Master indikator berhasil diekspor!", "success");
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "INM": return "bg-emerald-50 text-emerald-800 border-emerald-200/50";
      case "IMP-RS": return "bg-blue-50 text-blue-800 border-blue-200/50";
      case "IMP-Unit": return "bg-purple-50 text-purple-800 border-purple-200/50";
      case "SPM": return "bg-amber-50 text-amber-800 border-amber-200/50";
      case "IKP": return "bg-rose-50 text-rose-800 border-rose-200/50";
      case "Manajemen Risiko": return "bg-indigo-50 text-indigo-800 border-indigo-200/50";
      case "Survei Budaya Keselamatan Pasien": return "bg-teal-50 text-teal-800 border-teal-200/50";
      default: return "bg-slate-50 text-slate-800 border-slate-200/50";
    }
  };

  const copyFormulaToClipboard = () => {
    if (watchFormula) {
      navigator.clipboard.writeText(watchFormula);
      setCopied(true);
      showToast("Formula berhasil disalin ke clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="profil-indikator-root" className="space-y-6 pb-16 relative max-w-6xl mx-auto w-full">
      
      {/* Dynamic light frosted glass pop-up toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            id="optimus-toast-banner"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-xl max-w-sm ${
              toastType === 'success' ? 'bg-[#ECFDF5]/95 text-emerald-950 border-emerald-200' :
              toastType === 'error' ? 'bg-[#FEF2F2]/95 text-red-950 border-red-200' :
              'bg-[#F0F9FF]/95 text-blue-950 border-blue-200'
            }`}
          >
            {toastType === 'success' && <div className="p-1 bg-emerald-500 rounded-full text-white"><CheckCircle size={14} /></div>}
            {toastType === 'error' && <div className="p-1 bg-red-500 rounded-full text-white"><AlertTriangle size={14} /></div>}
            {toastType === 'info' && <div className="p-1 bg-blue-500 rounded-full text-white"><AlertCircle size={14} /></div>}
            <span className="text-xs font-bold leading-relaxed">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Controls */}
      <div id="profil-header-panel" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#10a37f] tracking-tight leading-tight">Profil Indikator Mutu</h1>
          <p className="text-gray-900 text-xs mt-1.5 max-w-xl leading-relaxed">
            Kelola master indikator mutu rumah sakit yang terintegrasi dengan seluruh modul OPTIMUS.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {userRole === "Admin" && (
            <button 
              id="tambah-indikator-btn"
              onClick={handleAdd} 
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-emerald-600/10 w-full sm:w-auto justify-center cursor-pointer active:scale-98"
            >
              <Plus size={14} /> Tambah Profil Baru
            </button>
          )}
        </div>
      </div>

      {/* Main Panel Content with list view and creation state */}
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div 
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-5"
          >
            {/* Filter and Search Bar */}
            <div id="filter-search-card" className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
              
              {/* Category Dropdown Filter */}
              <div id="category-filter-wrapper" className="flex items-center gap-3 w-full sm:w-auto">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  <Filter size={14} className="text-emerald-600" /> Kategori:
                </span>
                <div className="relative w-full sm:w-60 md:w-64">
                  <select 
                    id="category-dropdown-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 bg-gray-50/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs font-semibold text-gray-700 transition-all cursor-pointer shadow-3xs appearance-none hover:border-gray-300"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="INM">INM (Indikator Nasional Mutu)</option>
                    <option value="IMP-RS">IMP-RS (Mutu Prioritas RS)</option>
                    <option value="IMP-Unit">IMP-Unit (Mutu Prioritas Unit)</option>
                    <option value="SPM">SPM (Standar Pelayanan Minimum)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-450">
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Advanced text input search */}
              <div id="search-input-box" className="relative w-full sm:w-72 md:w-80 lg:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="🔍 Cari judul, penanggung jawab, atau dasar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs font-semibold tracking-tight transition-all placeholder-gray-400 text-gray-900"
                />
                {searchQuery && (
                  <button 
                    id="clear-search-btn"
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
                  >
                    <X size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom high quality responsive listing grid cards or list table view */}
            <div id="master-indicators-panel" className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto lg:overflow-x-hidden max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-100 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse table-auto lg:table-fixed">
                  <thead>
                    <tr className="bg-emerald-700 text-white">
                      <th className="sticky top-0 z-10 bg-transparent text-white py-3.5 px-3 md:py-4 md:px-4 font-bold text-xs uppercase tracking-wider w-12 md:w-16 text-center border-b border-emerald-700/30">No</th>
                      <th className="sticky top-0 z-10 bg-transparent text-white py-3.5 px-3 md:py-4 md:px-4 font-bold text-xs uppercase tracking-wider w-24 md:w-36 text-center md:text-left border-b border-emerald-700/30">Kategori</th>
                      <th className="sticky top-0 z-10 bg-transparent text-white py-3.5 px-3 md:py-4 md:px-4 font-bold text-xs uppercase tracking-wider w-auto md:w-[40%] text-left border-b border-emerald-700/30">Judul Indikator</th>
                      <th className="sticky top-0 z-10 bg-transparent text-white py-3.5 px-3 md:py-4 md:px-4 font-bold text-xs uppercase tracking-wider w-24 md:w-32 text-center border-b border-emerald-700/30">Target</th>
                      <th className="sticky top-0 z-10 bg-transparent text-white py-3.5 px-3 md:py-4 md:px-4 font-bold text-xs uppercase tracking-wider w-32 md:w-40 text-center border-b border-emerald-700/30">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            {/* Skeleton shimmer dynamic indicator */}
                            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                            <div className="space-y-1 text-center">
                              <p className="text-xs text-emerald-950 font-semibold tracking-wider uppercase">MODUL SEDANG DISINKRONKAN</p>
                              <p className="text-[10px] text-gray-400 font-bold">Mengunduh konfigurasi PostgreSQL Supabase Realtime...</p>
                            </div>
                            {/* Loading Shimmer representation */}
                            <div className="w-48 h-2 bg-slate-100 overflow-hidden rounded-full relative">
                              <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-400 bg-gray-50/20">
                          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto p-4">
                            <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100">
                              <FileText size={32} />
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-sm">Indikator tidak ditemukan</p>
                              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                Tidak ada profil indikator klinis yang sesuai dengan pencarian Anda saat ini. Kosongkan filter pencarian atau buat baru.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-emerald-50/30 transition-colors bg-white even:bg-gray-50/40 border-b border-gray-100/60"
                        >
                          {/* Row Number */}
                          <td className="py-2.5 px-3 md:py-4 md:px-4 text-xs font-semibold text-gray-500 text-center tracking-tight">
                            {idx + 1}
                          </td>
                          
                          {/* Category Badge */}
                          <td className="py-2.5 px-3 md:py-4 md:px-4 text-center md:text-left">
                            <span className={`inline-block px-2 py-0.5 rounded-xl text-[9px] md:text-[10px] font-bold tracking-widest uppercase border leading-none ${getCategoryTheme(item.category)}`}>
                              {item.category}
                            </span>
                          </td>
                          
                          {/* Indicator Title and Responsible Body details */}
                          <td className="py-2.5 px-3 md:py-4 md:px-4">
                            <div className="space-y-1">
                              <span className="text-xs md:text-sm font-bold text-gray-900 leading-snug tracking-tight hover:text-emerald-700 transition-colors block break-words whitespace-normal">
                                {item.indicator_title}
                              </span>
                            </div>
                          </td>
                          
                          {/* Target representation */}
                          <td className="py-2.5 px-3 md:py-4 md:px-4 text-center">
                            <span className="inline-block text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg whitespace-nowrap shadow-3xs">
                              {formatTarget(item.target, item.measurement_unit, item.reverse)}
                            </span>
                          </td>
                          
                          {/* Action Buttons with high accessibility sizes */}
                          <td className="py-2.5 px-3 md:py-4 md:px-4">
                            <div className="flex items-center justify-center gap-1.5 md:gap-2">
                              {/* View Action (Available for all) */}
                              <button 
                                id={`lihat-${item.id}`}
                                onClick={() => setViewingProfile(item)}
                                className="flex items-center justify-center p-2 h-9 w-9 border border-emerald-200 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 rounded-xl transition-all cursor-pointer active:scale-95 duration-150 shrink-0 shadow-sm"
                                title="Lihat Profil"
                              >
                                <Eye size={15} strokeWidth={2.5} className="shrink-0" />
                              </button>
                              
                              {/* Admin Privileged Actions */}
                              {userRole === "Admin" && (
                                <>
                                  <button 
                                    id={`edit-${item.id}`}
                                    onClick={() => handleEdit(item)}
                                    className="flex items-center justify-center p-2 h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 duration-150 shrink-0"
                                    title="Edit Profil"
                                  >
                                    <Edit size={14} className="shrink-0" />
                                  </button>
                                  <button 
                                    id={`hapus-${item.id}`}
                                    onClick={() => confirmDelete(item.id)}
                                    className="flex items-center justify-center p-2 h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100 shrink-0 shadow-sm"
                                    title="Hapus Profil"
                                  >
                                    <Trash2 size={15} className="shrink-0" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="add-edit-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {/* Redesigned Edit/Add Form - Premium Healthcare Design, Emerald Focus */}
            <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden relative">
              
              {/* Draft state top visual warnings */}
              {draftSavedMsg && (
                <div className="absolute top-0 left-0 w-full bg-emerald-50 px-4 py-1 border-b border-emerald-100 text-center">
                  <span className="text-[10px] text-emerald-700 font-extrabold flex items-center justify-center gap-1 uppercase tracking-wider">
                    <RefreshCw size={10} className="animate-spin" /> draf tersimpan otomatis di perangkat lokal
                  </span>
                </div>
              )}

              <div className="bg-emerald-500/5 px-6 py-6 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-8">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-[#059669] text-white rounded-xl shadow-xs shadow-emerald-600/20 block">
                    <Calculator size={18} />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-emerald-950 tracking-tight">
                      {editingId ? "Revisi Profil Indikator Kemenkes" : "Form Tambah Profil Indikator"}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Optimalisasi sistem pelaporan mutu rumah sakit (OPTIMUS)</p>
                  </div>
                </div>
                <button 
                  id="close-form-btn"
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full transition-colors cursor-pointer w-9 h-9 flex items-center justify-center active:scale-95"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-10">
                
                {/* 2-Column Grid Input Field Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Field 0: Kategori Indikator (MUST be integrated dropdown) */}
                  <div className="md:col-span-2 bg-[#ECFDF5]/30 p-5 rounded-2xl border border-emerald-100/40">
                    <label className="block text-xs font-black text-emerald-900 mb-2 uppercase tracking-wide">Kategori Indikator Mutu (Master Database) *</label>
                    <select 
                      id="input-category"
                      {...register("category")} 
                      className="w-full px-4 py-3 bg-white border-2 border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-xs font-bold text-gray-900 transition-all cursor-pointer shadow-3xs"
                    >
                      <option value="INM">INM (Indikator Nasional Mutu)</option>
                      <option value="IMP-RS">IMP-RS (Indikator Mutu Prioritas RS)</option>
                      <option value="IMP-Unit">IMP-Unit (Indikator Mutu Prioritas Unit)</option>
                      <option value="SPM">SPM (Standar Pelayanan Minimum)</option>
                      <option value="IKP">IKP (Insiden Keselamatan Pasien)</option>
                      <option value="Manajemen Risiko">Manajemen Risiko</option>
                      <option value="Survei Budaya Keselamatan Pasien">Survei Budaya Keselamatan Pasien</option>
                    </select>
                    {errors.category && <p className="text-red-500 text-[10px] uppercase font-black mt-1.5">{errors.category.message}</p>}
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1.5 leading-relaxed">
                      * Kategori ini digunakan untuk master integrasi otomatis ke Menu Input Data, Dashboard, Grafik, Laporan, Analitik, dan Export tanpa reload halaman.
                    </span>
                  </div>

                  {/* Field 1: Judul Indikator */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">1. Judul Indikator Mutu *</label>
                    <input 
                      id="input-title"
                      type="text" 
                      {...register("indicator_title")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-bold text-gray-900 transition-all shadow-3xs placeholder-gray-400" 
                      placeholder="Masukkan nama judul indikator secara lengkap dan jelas (Misal: Kepatuhan Kebersihan Tangan)"
                    />
                    {errors.indicator_title && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.indicator_title.message}</p>}
                  </div>

                  {/* Field 2: Dasar Pemikiran */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">2. Dasar Pemikiran (Justifikasi/Rasionalisasi) *</label>
                    <textarea 
                      id="input-rationale"
                      {...register("rationale")} 
                      rows={3} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Uraikan dasar pemikiran, regulasi Kemenkes, atau urgensi dilakukannya pengukuran terhadap indikator ini..."
                    />
                    {errors.rationale && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.rationale.message}</p>}
                  </div>

                  {/* Field 3: Dimensi Mutu */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">3. Dimensi Mutu *</label>
                    <select 
                      id="input-quality-dimension"
                      {...register("quality_dimension")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-bold text-gray-900 transition-all cursor-pointer shadow-3xs"
                    >
                      <option value="Keselamatan">Keselamatan (Safety)</option>
                      <option value="Efektif">Efektif (Effective)</option>
                      <option value="Efisien">Efisien (Efficient)</option>
                      <option value="Tepat Waktu">Tepat Waktu (Timely)</option>
                      <option value="Berorientasi Pasien">Berorientasi Pasien (Patient-oriented)</option>
                      <option value="Adil">Adil (Equitable)</option>
                    </select>
                    {errors.quality_dimension && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.quality_dimension.message}</p>}
                  </div>

                  {/* Field 4: Tujuan */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">4. Tujuan Pengukuran *</label>
                    <textarea 
                      id="input-purpose"
                      {...register("objective")} 
                      rows={1} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-none shadow-3xs placeholder-gray-400 leading-relaxed h-[44px]" 
                      placeholder="Keadaan yang ingin dicapai setelah diukur..."
                    />
                    {errors.objective && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.objective.message}</p>}
                  </div>

                  {/* Field 5: Definisi Operasional */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">5. Definisi Operasional *</label>
                    <textarea 
                      id="input-operational-definition"
                      {...register("operational_definition")} 
                      rows={4} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Definisikan secara terperinci seluruh istilah, variabel, batas batasan, serta arti penting pengukuran..."
                    />
                    {errors.operational_definition && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.operational_definition.message}</p>}
                  </div>

                  {/* Field 6: Tipe Indikator */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">6. Tipe Indikator *</label>
                    <select 
                      id="input-indicator-type"
                      {...register("indicator_type")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-bold text-gray-900 transition-all cursor-pointer shadow-3xs"
                    >
                      <option value="Struktur">Struktur (Structure / Input)</option>
                      <option value="Proses">Proses (Process)</option>
                      <option value="Outcome">Outcome (Hasil)</option>
                    </select>
                    {errors.indicator_type && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.indicator_type.message}</p>}
                  </div>

                  {/* Field 7: Satuan Pengukuran */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">7. Satuan Pengukuran *</label>
                    <select 
                      id="input-measurement-unit"
                      {...register("measurement_unit")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-bold text-gray-900 transition-all cursor-pointer shadow-3xs"
                    >
                      <option value="Persen (%)">Persen (%)</option>
                      <option value="Menit">Menit</option>
                      <option value="Jam">Jam</option>
                      <option value="Hari">Hari</option>
                      <option value="Rasio">Rasio</option>
                      <option value="Jumlah Kasus">Jumlah Kasus</option>
                      <option value="Skor">Skor</option>
                      <option value="Nilai">Nilai</option>
                    </select>
                    {errors.measurement_unit && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.measurement_unit.message}</p>}
                  </div>

                  {/* Field 8: Numerator (Pembilang) */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">8. Numerator (Pembilang) *</label>
                    <textarea 
                      id="input-numerator"
                      {...register("numerator")} 
                      rows={3} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Masukkan peristiwa/kejadian khusus yang dinilai positif sesuai definisi indikator..."
                    />
                    {errors.numerator && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.numerator.message}</p>}
                  </div>

                  {/* Field 9: Denominator (Penyebut) */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">9. Denominator (Penyebut) *</label>
                    <textarea 
                      id="input-denominator"
                      {...register("denominator")} 
                      rows={3} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Masukkan total populasi atau keseluruhan kejadian observasi..."
                    />
                    {errors.denominator && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.denominator.message}</p>}
                  </div>

                  {/* Field 10 & 11: Target & Kriteria */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">10. Target Mutu *</label>
                    <input 
                      id="input-target"
                      type="text" 
                      {...register("target")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-black text-gray-900 transition-all shadow-3xs" 
                      placeholder="Contoh: ≥ 85%, 100%, ≤ 2 Hari, 24 Jam"
                    />
                    {errors.target && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.target.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">11. Kriteria Inklusi & Eksklusi *</label>
                    <textarea 
                      id="input-criteria"
                      {...register("criteria")} 
                      rows={1}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed h-[44px]" 
                      placeholder="Tentukan sasaran evaluasi yang harus dimasukkan atau dikeluarkan dari perhitungan..."
                    />
                    {errors.criteria && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.criteria.message}</p>}
                  </div>

                  {/* Field 12: Formula (Col-span 2 with healthcare formula preview builder) */}
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200/50 rounded-2xl p-5 md:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <label className="text-xs font-black text-gray-900 uppercase tracking-wide block">12. Formula Perhitungan Indikator Mutu *</label>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Sesuai standar Kemenkes RI dan komite mutu pelayanan medis.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <label htmlFor="toggle-manual-formula" className="text-[10px] text-emerald-800 font-black tracking-wider uppercase cursor-pointer select-none">Manual Edit</label>
                        <input 
                          id="toggle-manual-formula"
                          type="checkbox"
                          checked={isFormulaManual}
                          onChange={(e) => setIsFormulaManual(e.target.checked)}
                          className="w-4.5 h-4.5 accent-emerald-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <input 
                        id="input-formula"
                        type="text" 
                        {...register("formula")} 
                        disabled={!isFormulaManual}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-xs font-mono font-bold transition-all shadow-3xs border ${
                          isFormulaManual ? 'bg-white border-2 border-emerald-400 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                        placeholder='Misal: ("Numerator" / "Denominator") * 100%' 
                      />
                      {errors.formula && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.formula.message}</p>}
                    </div>

                    {/* Premium Centered Formula Visual Container Box with divisions */}
                    <div id="formula-preview-wrapper" className="pt-2">
                      <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider block mb-2 align-middle">
                        🔬 Preview Penulisan Formula Dokumen Mutu (Realtime)
                      </span>
                      <div 
                        id="formula-preview-card"
                        className="p-6 bg-[#ECFDF5]/30 border border-emerald-500/10 rounded-2xl relative shadow-3xs group flex flex-col md:flex-row items-center justify-between gap-4"
                      >
                        {/* Interactive dynamic preview container */}
                        <div className="flex flex-col md:flex-row items-center gap-4 text-slate-900 w-full md:w-auto">
                          <span className="text-base font-black font-sans text-emerald-950">(</span>
                          <div className="flex flex-col items-center">
                            {/* Numerator fraction division */}
                            <span 
                              id="preview-numerator"
                              className="text-xs font-mono font-bold text-[#059669] border-b-2 border-slate-400 pb-1 text-center max-w-lg break-words"
                            >
                              {watchNum ? `"${watchNum.trim()}"` : "Numerator (Pembilang)"}
                            </span>
                            {/* Denominator fraction division */}
                            <span 
                              id="preview-denominator"
                              className="text-xs font-mono font-bold text-emerald-900 pt-1 text-center max-w-lg break-words"
                            >
                              {watchDen ? `"${watchDen.trim()}"` : "Denominator (Penyebut)"}
                            </span>
                          </div>
                          <span className="text-base font-black font-sans text-emerald-955">)</span>
                          
                          {/* Unit automatically suffix multiply */}
                          <span className="text-xs font-black text-[#059669] bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest leading-none">
                            {watchUnit?.includes("%") ? "× 100%" : "kali satuan"}
                          </span>
                        </div>

                        {/* Copy formula command button */}
                        <button 
                          id="copy-formula-btn"
                          type="button" 
                          onClick={copyFormulaToClipboard}
                          disabled={!watchFormula}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all shadow-3xs active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {copied ? <Check size={12} className="text-emerald-600 animate-bounce" /> : <Copy size={12} />}
                          <span>{copied ? "Tersalin" : "Salin Formula"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Field 13: Metode pengumpulan data */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">13. Metode Pengumpulan Data *</label>
                    <textarea 
                      id="input-collection-method"
                      {...register("data_collection_method")} 
                      rows={2} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Misal: Retrospektif (audit berkas rekam medis terdahulu) atau Konkuren"
                    />
                    {errors.data_collection_method && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.data_collection_method.message}</p>}
                  </div>

                  {/* Field 14: Sumber data */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">14. Sumber Data *</label>
                    <textarea 
                      id="input-data-source"
                      {...register("data_source")} 
                      rows={2} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Misal: Berkas rekam medis, logbook pelayanan IGD, register rawat jalan, dll..."
                    />
                    {errors.data_source && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.data_source.message}</p>}
                  </div>

                  {/* Field 15: Cara pengambilan sampel */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">15. Cara Pengambilan Sampel (Sampling) *</label>
                    <textarea 
                      id="input-sampling-method"
                      {...register("sampling_method")} 
                      rows={2} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Misal: Non-probability Sampling (Consecutive / Convenience) atau Probability Random Sampling..."
                    />
                    {errors.sampling_method && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.sampling_method.message}</p>}
                  </div>

                  {/* Field 16: Instrument pengambilan data */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">16. Instrumen Pengambilan Data *</label>
                    <textarea 
                      id="input-collection-tool"
                      {...register("data_collection_tool")} 
                      rows={2} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-medium text-gray-900 transition-all resize-y shadow-3xs placeholder-gray-400 leading-relaxed" 
                      placeholder="Misal: Formulir audit kepatuhan kebersihan tangan PPI, lembar check observation, Kuesioner..."
                    />
                    {errors.data_collection_tool && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.data_collection_tool.message}</p>}
                  </div>

                  {/* Field 17: Besar sampel */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">17. Besar Sampel (Sample Size) *</label>
                    <input 
                      id="input-sample-size"
                      type="text" 
                      {...register("sample_size")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-bold text-gray-900 transition-all shadow-3xs" 
                      placeholder="Misal: Total sampling, Rumus Slovin, atau minimal 30 sampel..."
                    />
                    {errors.sample_size && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.sample_size.message}</p>}
                  </div>

                  {/* Field 18: Periode pengumpulan data */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">18. Periode Pengumpulan Data *</label>
                    <MultiSelect
                      options={["Harian", "Mingguan", "Bulanan", "Triwulanan", "Semesteran", "Tahunan"]}
                      selected={watch("collection_period") ? watch("collection_period").split(",").map((s: string) => s.trim()).filter(Boolean) : []}
                      onChange={(val) => setValue("collection_period", val.join(", "), { shouldValidate: true })}
                      placeholder="Pilih periode..."
                    />
                    {errors.collection_period && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.collection_period.message}</p>}
                  </div>

                  {/* Field 19: Periode analisis data */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">19. Periode Analisis Data *</label>
                    <MultiSelect
                      options={["Bulanan", "Triwulanan", "Semesteran", "Tahunan"]}
                      selected={watch("analysis_period") ? watch("analysis_period").split(",").map((s: string) => s.trim()).filter(Boolean) : []}
                      onChange={(val) => setValue("analysis_period", val.join(", "), { shouldValidate: true })}
                      placeholder="Pilih periode..."
                    />
                    {errors.analysis_period && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.analysis_period.message}</p>}
                  </div>

                  {/* Field 20: Penyajian data */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">20. Penyajian Data *</label>
                    <MultiSelect
                      options={["Tabel", "Grafik Line & Bar", "Diagram Pie", "Narasi Evaluasi", "Kombinasi Dashboard (Tabel & Grafik)"]}
                      selected={watch("data_presentation") ? watch("data_presentation").split(",").map((s: string) => s.trim()).filter(Boolean) : []}
                      onChange={(val) => setValue("data_presentation", val.join(", "), { shouldValidate: true })}
                      placeholder="Pilih penyajian..."
                    />
                    {errors.data_presentation && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.data_presentation.message}</p>}
                  </div>

                  {/* Field 21: Penanggung Jawab */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">21. Penanggung Jawab Terkait *</label>
                    <input 
                      id="input-person-responsible"
                      type="text" 
                      {...register("person_responsible")} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none text-xs font-bold text-gray-900 transition-all shadow-3xs" 
                      placeholder="Masukkan nama unit penanggung jawab utama (Misal: Komite PPI / Kepala IGD / Direktur Pelayanan)"
                    />
                    {errors.person_responsible && <p className="text-red-500 text-[10px] uppercase font-black mt-1">{errors.person_responsible.message}</p>}
                  </div>

                </div>

                {/* Form Action Controls layout */}
                <div id="form-actions-bar" className="pt-8 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                  <button 
                    id="reset-form-btn"
                    type="button" 
                    onClick={handleResetForm} 
                    className="px-5 py-3 rounded-xl text-xs font-black text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer active:scale-95"
                  >
                    🔴 Reset Form / Bersihkan Draf
                  </button>
                  <div className="flex gap-3">
                    <button 
                      id="cancel-form-btn"
                      type="button" 
                      onClick={() => {
                        clearDraft();
                        setShowForm(false);
                      }} 
                      className="px-6 py-3 rounded-xl text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
                    >
                      Batal
                    </button>
                    <button 
                      id="save-submit-btn"
                      type="submit" 
                      className="px-6 py-3 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
                    >
                      Simpan Profil Indikator Mutu
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL OVERLAY MODAL (👁 Lihat) */}
      <AnimatePresence>
        {viewingProfile && (
          <div id="detail-overlay-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 md:p-6 transition-all duration-500">
            
            {/* Main Fullscreen or Large Modal Box */}
            <motion.div 
              id="detail-modal-box"
              initial={{ y: 50, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-gray-50 flex flex-col w-full h-full md:h-[95vh] md:max-w-6xl md:rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              
              {/* Sticky Top Action Bar / Header */}
              <div className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-20 sticky top-0 px-4 md:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Logo RS */}
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                    {hospitalLogo ? (
                      <img src={hospitalLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-lg">RS</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="text-sm md:text-[17px] font-black text-gray-900 tracking-tight leading-tight">Profil Indikator Mutu</h1>
                    <h2 className="text-[9px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">UOBK RSUD AL-MULK</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                    <Printer size={15} /> Cetak PDF
                  </button>
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                    <FileDown size={15} /> Dokumen
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
                  <button 
                    onClick={() => setViewingProfile(null)}
                    className="p-2 md:px-4 md:py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-3xs"
                  >
                    <X size={18} strokeWidth={2.5} /> <span className="hidden md:block">Tutup Panel</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
                <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
                  
                  {/* Main Specifications Frame with Unified Title Header */}
                  <div className="bg-white/90 backdrop-blur-md shadow-xl border border-emerald-100/60 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
                    
                    {/* Unified Header */}
                    <div className="relative bg-gradient-to-b from-emerald-50/30 to-white border-b border-emerald-100/60 px-6 py-10 md:px-12 md:py-12 flex flex-col items-center justify-center text-center space-y-4">
                      {/* Decorative Elegant Line Accent */}
                      <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full mb-1 opacity-80" />

                      <span className="font-extrabold text-emerald-900 text-xs md:text-sm tracking-[0.16em] uppercase">
                        {viewingProfile.category.toUpperCase() === "INM"
                          ? "PROFIL INDIKATOR NASIONAL MUTU (INM)"
                          : `PROFIL INDIKATOR ${viewingProfile.category.toUpperCase()}`}
                      </span>

                      <h2 className="text-xl md:text-3xl font-black text-emerald-850 tracking-tight leading-tight max-w-4xl uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] antialiased">
                        {viewingProfile.indicator_title}
                      </h2>

                      {/* Elegant Divider Line with Centering Marker */}
                      <div className="relative w-full max-w-xs mt-3">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-emerald-100/80"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-3 text-[10px] text-emerald-500/80 font-mono">◆</span>
                        </div>
                      </div>
                    </div>
                    
                    <DetailRow 
                      label="Dimensi Mutu" 
                      value={viewingProfile.quality_dimension || "—"} 
                      id="dimension-row"
                    />
                    <DetailRow 
                      label="Dasar Pemikiran" 
                      value={viewingProfile.rationale || "—"} 
                      id="rationale-row"
                    />
                    <DetailRow 
                      label="Tujuan" 
                      value={viewingProfile.objective || "—"} 
                      id="objective-row"
                    />
                    <DetailRow 
                      label="Definisi Operasional" 
                      value={viewingProfile.operational_definition || "—"} 
                      id="def-row"
                    />
                    <DetailRow 
                      label="Tipe Indikator" 
                      value={viewingProfile.indicator_type || "—"} 
                      id="type-row"
                    />
                    <DetailRow 
                      label="Satuan Pengukuran" 
                      value={viewingProfile.measurement_unit || "—"} 
                      id="unit-row"
                    />
                    <DetailRow 
                      label="Kriteria Inklusi & Eksklusi" 
                      value={viewingProfile.criteria || "—"} 
                      id="criteria-row"
                    />
                    <DetailRow 
                      label="Numerator (Pembilang)" 
                      value={viewingProfile.numerator || "—"} 
                      id="numerator-row"
                    />
                    <DetailRow 
                      label="Denominator (Penyebut)" 
                      value={viewingProfile.denominator || "—"} 
                      id="denominator-row"
                    />
                    <DetailRow 
                      label="Formula Perhitungan" 
                      value={viewingProfile.formula || "—"} 
                      id="formula-row"
                    />
                     <DetailRow 
                      label="Target Mutu" 
                      value={viewingProfile.target || "—"} 
                      id="target-row"
                    />
 
                     <DetailRow 
                      label="Sumber Data" 
                      value={viewingProfile.data_source || "—"} 
                      id="source-row"
                    />
                    <DetailRow 
                      label="Metode Pengumpulan Data" 
                      value={viewingProfile.data_collection_method || "—"} 
                      id="method-row"
                    />
                    <DetailRow 
                      label="Pengambilan Sampel" 
                      value={viewingProfile.sampling_method || "—"} 
                      id="sampling-row"
                    />
                    <DetailRow 
                      label="Instrumen Pengumpulan Data" 
                      value={viewingProfile.data_collection_tool || "—"} 
                      id="tool-row"
                    />
                    <DetailRow 
                      label="Besar Sampel" 
                      value={viewingProfile.sample_size || "—"} 
                      id="size-row"
                    />
                    <DetailRow 
                      label="Periode Pengumpulan" 
                      value={viewingProfile.collection_period || "—"} 
                      id="period-row"
                    />
                    <DetailRow 
                      label="Periode Analisis" 
                      value={viewingProfile.analysis_period || "—"} 
                      id="analysis-row"
                    />
                    <DetailRow 
                      label="Penyajian Data" 
                      value={viewingProfile.data_presentation || "—"} 
                      id="presentation-row"
                    />
                    <DetailRow 
                      label="Unit Penanggung Jawab" 
                      value={viewingProfile.person_responsible || "—"} 
                      id="responsible-row"
                    />
                  </div>

                  <div className="h-6 md:h-10"></div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM RED DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingId && (
          <div id="delete-overlay-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            />

            {/* Confirmation Box */}
            <motion.div 
              id="delete-confirmation-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative bg-white rounded-3xl border border-red-100 shadow-2xl w-full max-w-md overflow-hidden z-10 p-6 text-center space-y-4"
            >
              
              {/* Animated Danger Icon */}
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 animate-pulse">
                <AlertTriangle size={26} strokeWidth={2.3} />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 leading-snug">Hapus Profil Indikator?</h3>
                <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus indikator klinis ini? Data yang terhapus dari tabel <strong className="text-slate-800">master_indikator</strong> tidak dapat dikembalikan dan akan memengaruhi riwayat pelaporan secara realtime.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button 
                  id="cancel-delete-btn"
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  id="confirm-delete-btn"
                  onClick={handleDeleteExecute}
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-black rounded-xl border border-red-100 transition-all cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
