import React, { useState } from "react";
import {
  ClipboardCheck,
  LayoutDashboard,
  FileEdit,
  Activity,
  Calendar,
  BarChart2,
  Printer,
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Target,
  ListTodo
} from "lucide-react";

export default function SupervisiMutu() {
  const [activeTab, setActiveTab] = useState("DASHBOARD");

  const tabs = [
    { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
    { id: "INSTRUMEN", label: "Master Instrumen", icon: ListTodo },
    { id: "INPUT", label: "Input Supervisi", icon: FileEdit },
    { id: "TINDAK_LANJUT", label: "Tindak Lanjut", icon: Activity },
    { id: "MONITORING", label: "Monitoring", icon: Target },
    { id: "KALENDER", label: "Kalender", icon: Calendar },
    { id: "ANALISIS", label: "Analisis", icon: BarChart2 },
    { id: "CETAK", label: "Cetak Laporan", icon: Printer },
  ];

  return (
    <div className="w-full mx-auto pb-safe p-4 md:p-6 lg:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-[#10a37f]" strokeWidth={2.5} />
            Supervisi Mutu
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
            Sistem Digital Pelaksanaan, Monitoring, Evaluasi, dan Tindak Lanjut Supervisi Mutu.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#10a37f] text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="anime-in zoom-in-95 duration-500">
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6">
              {[
                { title: "Total Supervisi Bulan Ini", value: "24", icon: ClipboardCheck, color: "emerald" },
                { title: "Supervisi Selesai", value: "18", icon: CheckCircle, color: "blue" },
                { title: "Belum Ditindaklanjuti", value: "6", icon: Clock, color: "orange" },
                { title: "Total Temuan Lapangan", value: "12", icon: ShieldAlert, color: "rose" },
              ].map((kpi, idx) => {
                const colors: Record<string, string> = {
                  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
                  blue: "bg-blue-50 text-blue-600 border-blue-100",
                  orange: "bg-orange-50 text-orange-600 border-orange-100",
                  rose: "bg-rose-50 text-rose-600 border-rose-100",
                };
                return (
                  <div key={idx} className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group cursor-pointer relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                      <div className={`p-3 rounded-xl ${colors[kpi.color]}`}>
                        <kpi.icon className="w-6 h-6" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="z-10 mt-2">
                      <h3 className="text-3xl font-black text-slate-800">{kpi.value}</h3>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">{kpi.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content Mockups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                 <h2 className="text-lg font-extrabold text-slate-800 mb-4">Grafik Temuan per Unit</h2>
                 <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                   <p className="text-gray-400 font-medium">Area Chart (Segera Hadir)</p>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                 <h2 className="text-lg font-extrabold text-slate-800 mb-4">Kepatuhan Tindak Lanjut</h2>
                 <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                   <p className="text-gray-400 font-medium">Progress Bar / Donut Chart (Segera Hadir)</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "INSTRUMEN" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Kategori Instrumen Supervisi</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Kelola checklist dan instrumen berdasarkan standar akreditasi.</p>
              </div>
              <button className="px-4 py-2 bg-[#10a37f] text-white font-bold text-sm rounded-xl hover:bg-[#0e8f6e] transition-colors shadow-md">
                + Tambah Instrumen
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "PMKP", items: ["Kepatuhan Pengumpulan Data", "Validasi Data Indikator", "Analisis Indikator", "Pelaporan Mutu"] },
                { title: "Sasaran Keselamatan Pasien (SKP)", items: ["SKP 1 Identifikasi Pasien", "SKP 2 Komunikasi Efektif", "SKP 3 Obat High Alert", "SKP 4 Tepat Lokasi Operasi", "SKP 5 Pencegahan Infeksi", "SKP 6 Pencegahan Risiko Jatuh"] },
                { title: "PPI", items: ["Kepatuhan Hand Hygiene", "Penggunaan APD", "Dekontaminasi Alat", "Pengelolaan Limbah Medis"] },
                { title: "Manajemen Risiko", items: ["Identifikasi Risiko", "Register Risiko", "Mitigasi Risiko", "Monitoring Risiko"] },
                { title: "IKP", items: ["Pelaporan Insiden", "Investigasi Insiden", "RCA", "Tindak Lanjut Insiden"] },
                { title: "Fasilitas dan Keselamatan", items: ["APAR", "Jalur Evakuasi", "K3RS", "Sarana Prasarana"] },
              ].map((category, idx) => (
                <div key={idx} className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ListTodo className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-emerald-600 transition-colors">{category.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {category.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm font-semibold text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOCK OTHER TABS */}
        {activeTab !== "DASHBOARD" && activeTab !== "INSTRUMEN" && (
          <div className="bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <ClipboardCheck className="w-10 h-10 text-emerald-500" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Modul {tabs.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-slate-500 font-medium max-w-md">
              Halaman ini akan menampilkan sistem terintegrasi untuk {tabs.find(t => t.id === activeTab)?.label?.toLowerCase()} dengan desain modern, realtime database sinkronisasi, dan laporan PDF otomatis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
