import { create } from "zustand";

export interface IndicatorProfile {
  id: string;
  category: string;
  indicator_title: string;
  rationale: string;
  quality_dimension: string;
  objective: string;
  operational_definition: string;
  indicator_type: string;
  measurement_unit: string;
  numerator: string;
  denominator: string;
  target: string | number;
  criteria: string;
  formula: string;
  data_collection_method: string;
  data_source: string;
  sampling_method: string;
  data_collection_tool: string;
  sample_size: string;
  collection_period: string;
  analysis_period: string;
  data_presentation: string;
  person_responsible: string;
  reverse?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VisiteData {
  id: string;
  tanggal: string;
  nama_pasien: string;
  jam_visite_kurang_14: boolean;
  jam_visite_lebih_14: boolean;
  dokter_visite: string;
  keterangan: string;
}

export interface JatuhData {
  id: string;
  tanggal: string;
  nama_pasien: string;
  no_rm: string;
  asesmen_awal: boolean | null;
  asesmen_ulang: boolean | null;
  intervensi: boolean | null;
}

export interface MomentIdentifikasi {
  aktif: boolean;
  petugas: string;
  tanya_nama: string | null;
  tanya_tgllahir: string | null;
  cara_verbal: string | null;
  cara_visual: string | null;
  lokasi: string;
  patuh: boolean | null;
}

export interface IdentifikasiData {
  id: string;
  tanggal_observasi: string;
  jam_observasi: string;
  nama_observer: string;
  nama_pasien: string;
  no_rm: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  petugas: string;
  lokasi: string;
  moments: Record<string, MomentIdentifikasi>;
}

export interface WaktuTungguData {
  id: string;
  tanggal: string;
  nama_pasien: string;
  no_rm: string;
  jam_datang: string;
  jam_dilayani: string;
  selisih_menit: number;
  memenuhi_standar?: boolean;
}

export interface FornasData {
  id: string;
  tanggal: string;
  jumlah_resep: number | "";
  jumlah_sesuai: number | "";
}

export interface DataMutuPayload {
  id: string;
  unit: string;
  tanggal: string;
  kategori: string;
  indikator_id?: string;
  indikator_name?: string;
  numerator?: number;
  denominator?: number;
  target?: string | number;
  capaian?: number;
  status?: "Tercapai" | "Mendekati" | "Tidak Tercapai" | "N/A";
  keterangan?: string;
  kpc?: number;
  knc?: number;
  ktc?: number;
  ktd?: number;
  sentinel?: number;
  visite_details?: VisiteData[];
  jatuh_details?: JatuhData[];
  waktu_tunggu_details?: WaktuTungguData[];
  identifikasi_details?: IdentifikasiData[];
  fornas_details?: FornasData[];
}

const initialDataMutu: DataMutuPayload[] = [];
const initialIndicatorProfiles: IndicatorProfile[] = [];

interface RootState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userRole: string;
  hospitalLogo: string;
  setHospitalLogo: (logo: string) => void;
  dataMutuList: DataMutuPayload[];
  addDataMutu: (data: DataMutuPayload) => void;
  setDataMutuList: (data: DataMutuPayload[]) => void;
  indicatorProfiles: IndicatorProfile[];
  setIndicatorProfiles: (data: IndicatorProfile[]) => void;
  addIndicatorProfile: (data: IndicatorProfile) => void;
  updateIndicatorProfile: (id: string, data: Partial<IndicatorProfile>) => void;
  deleteIndicatorProfile: (id: string) => void;
  units: Unit[];
  addUnit: (unit: Unit) => void;
  updateUnit: (id: string, data: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;
}

export interface Unit {
  id: string;
  name: string;
  category: string;
  status: "Aktif" | "Nonaktif";
}

const initialUnits: Unit[] = [
  { id: "1", name: "IGD", category: "Umum", status: "Aktif" },
  { id: "2", name: "Ranap Aisyah", category: "Rawat Inap", status: "Aktif" },
  { id: "3", name: "Ranap Fatimah", category: "Rawat Inap", status: "Aktif" },
  { id: "4", name: "Ranap Khadijah", category: "Rawat Inap", status: "Aktif" },
  { id: "5", name: "Ranap Usman", category: "Rawat Inap", status: "Aktif" },
  { id: "6", name: "ICU", category: "Intensif", status: "Aktif" },
  { id: "7", name: "IBS", category: "Khusus", status: "Aktif" },
  { id: "8", name: "Rawat Jalan", category: "Rawat Jalan", status: "Aktif" },
  { id: "9", name: "Radiologi", category: "Penunjang", status: "Aktif" },
  { id: "10", name: "Laboratorium", category: "Penunjang", status: "Aktif" },
  { id: "11", name: "Farmasi", category: "Penunjang", status: "Aktif" },
];

export const useStore = create<RootState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  userRole: "Admin",
  hospitalLogo: "",
  setHospitalLogo: (logo) => set({ hospitalLogo: logo }),
  dataMutuList: [],
  addDataMutu: (data) =>
    set((state) => ({ dataMutuList: [...state.dataMutuList, data] })),
  setDataMutuList: (data) => set({ dataMutuList: data }),
  indicatorProfiles: [],
  setIndicatorProfiles: (data) => set({ indicatorProfiles: data }),
  addIndicatorProfile: (data) =>
    set((state) => ({ indicatorProfiles: [...state.indicatorProfiles, data] })),
  updateIndicatorProfile: (id, data) =>
    set((state) => ({
      indicatorProfiles: state.indicatorProfiles.map((p) =>
        p.id === id ? { ...p, ...data } : p,
      ),
    })),
  deleteIndicatorProfile: (id) =>
    set((state) => ({
      indicatorProfiles: state.indicatorProfiles.filter((p) => p.id !== id),
    })),
  units: initialUnits,
  addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),
  updateUnit: (id, data) =>
    set((state) => ({
      units: state.units.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),
  deleteUnit: (id) =>
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    })),
}));
