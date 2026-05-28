import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, Flame, PieChart as PieIcon, Activity } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const dataIKP = [
  { id: "1", tanggal: "2026-04-10", unit: "IGD", jenis: "KNC (Kejadian Nyaris Cedera)", deskripsi: "Salah penulisan etiket resep obat, disadari sebelum diberikan", grading: "Biru", status: "Closed", investigasi: "Investigasi Sederhana (1 minggu)" },
  { id: "2", tanggal: "2026-04-14", unit: "Ranap Kartika", jenis: "KTC (Kejadian Tidak Cedera)", deskripsi: "Pasien meminum dosis ganda obat vitamin, tidak menimbulkan efek medis berbahaya", grading: "Hijau", status: "Closed", investigasi: "Investigasi Sederhana (2 minggu)" },
  { id: "3", tanggal: "2026-04-22", unit: "Farmasi", jenis: "KPC (Kejadian Potensial Cedera)", deskripsi: "Lantai licin di dekat wastafel racikan obat tanpa tanda peringatan basah", grading: "Kuning", status: "Open", investigasi: "RCA (Root Cause Analysis)" },
];

const gradingStats = [
  { name: "Sangat Rendah (Biru)", value: 4, color: "#3b82f6" },
  { name: "Rendah (Hijau)", value: 8, color: "#10a37f" },
  { name: "Sedang (Kuning)", value: 2, color: "#eab308" },
  { name: "Tinggi (Merah)", value: 1, color: "#ef4444" },
];

export default function IKP() {
  const [incidents, setIncidents] = useState(dataIKP);
  const [activeTab, setActiveTab] = useState("Semua");

  const filteredIncidents = incidents.filter((item) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Open") return item.status === "Open";
    if (activeTab === "Closed") return item.status === "Closed";
    return true;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#10a37f] tracking-tight">
              Insiden Keselamatan Pasien (IKP)
            </h1>
          </div>
          <p className="text-gray-900 mt-1.5 text-sm font-semibold">
            Sistem pencatatan, pemantauan, dan investigasi insiden klinis rumah sakit.
          </p>
        </div>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl">
            <Flame size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">Total Sentinel</span>
            <span className="text-2xl font-black text-gray-900">0</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-[#10a37f] p-3.5 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">Investigasi Selesai</span>
            <span className="text-2xl font-black text-gray-900">12 Berkas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">Kejadian (KNC)</span>
            <span className="text-2xl font-black text-gray-900">3 Laporan</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">Aktif Investigasi</span>
            <span className="text-2xl font-black text-gray-900">1 Kasus</span>
          </div>
        </div>
      </div>

      {/* Analytics & Table list split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Grading Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
              <PieIcon size={16} className="text-[#10a37f]" /> Distribusi Matriks Risiko (Grading)
            </span>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradingStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradingStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Kejadian`]} />
                <Legend iconSize={10} iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents Table list */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Header & Filter */}
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-gray-900">Daftar Insiden Terkini</h3>
              <p className="text-[11px] text-gray-400 font-bold tracking-wider">Audit Mutu Internal & Pelaporan Lapangan</p>
            </div>
            <div className="flex bg-gray-200/60 p-0.5 rounded-lg border border-gray-200">
              {["Semua", "Open", "Closed"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${
                    activeTab === tab ? "bg-white text-emerald-950 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#10a37f] text-white">
                  <th className="py-4 px-5 font-bold text-xs">Tanggal & Unit</th>
                  <th className="py-4 px-5 font-bold text-xs">Jenis Insiden</th>
                  <th className="py-4 px-5 font-bold text-xs">Grading</th>
                  <th className="py-4 px-5 font-bold text-xs text-center">Status</th>
                  <th className="py-4 px-5 font-bold text-xs">Rekomendasi / Investigasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-gray-50 hover:bg-[#10a37f]/5 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900 text-xs">{inc.tanggal}</div>
                      <div className="text-[10px] uppercase font-extrabold text-[#10a37f]">{inc.unit}</div>
                    </td>
                    <td className="py-4 px-5 max-w-xs">
                      <div className="font-bold text-gray-800 text-xs truncate leading-snug">{inc.jenis}</div>
                      <p className="text-[10px] text-gray-400 line-clamp-1 leading-snug mt-0.5">{inc.deskripsi}</p>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                          inc.grading === "Biru"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : inc.grading === "Hijau"
                            ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {inc.grading}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg ${
                          inc.status === "Closed"
                            ? "bg-[#10a37f]/15 text-[#10a37f]"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs font-semibold text-gray-600">
                      {inc.investigasi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
