import React, { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { Activity, Plus, ClipboardList } from "lucide-react";
import SurveiForm from "@/components/survei/SurveiForm";

const dataSurvei = [
  { subject: "Teamwork", A: 85, B: 65, fullMark: 100 },
  { subject: "Komunikasi", A: 78, B: 70, fullMark: 100 },
  { subject: "Leadership", A: 82, B: 75, fullMark: 100 },
  { subject: "Staffing", A: 60, B: 85, fullMark: 100 },
  { subject: "Handoff", A: 88, B: 80, fullMark: 100 },
  { subject: "Incident Reporting", A: 90, B: 85, fullMark: 100 },
];

export default function SurveiBudaya() {
  const [view, setView] = useState<"dashboard" | "form">("dashboard");

  if (view === "form") {
    return (
      <div className="w-full px-2 md:px-0">
        <SurveiForm onBack={() => setView("dashboard")} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 max-w-7xl mx-auto w-full p-2 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-2">
        <div>
          <h1 className="text-3xl font-bold text-[#10a37f] tracking-tight">
            Survei Budaya Keselamatan Pasien
          </h1>
          <p className="text-gray-900 mt-1 text-sm font-semibold">
            Evaluasi budaya keselamatan pasien per dimensi.
          </p>
        </div>
        <button
          onClick={() => setView("form")}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30"
        >
          <ClipboardList size={18} />
          Isi Kuesioner Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 w-full min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
            <Activity className="text-emerald-500" size={20} />
            Radar Capaian Dimensi
          </h3>
          <div className="relative w-full h-[280px] md:h-[320px] shrink-0 mt-4 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={dataSurvei}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#9ca3af", fontSize: 9 }}
                  />

                  <Radar
                    name="Skor RS"
                    dataKey="A"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.5}
                    isAnimationActive={false}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white text-emerald-950 rounded-2xl shadow-sm border border-emerald-100 p-8 flex flex-col justify-center items-center text-center w-full min-w-0 overflow-hidden">
          <h3 className="text-2xl font-bold mb-2">Nilai Rata-Rata Budaya</h3>
          <div className="text-6xl font-black text-emerald-600 mb-4 drop-shadow-sm">
            80.5%
          </div>
          <p className="text-emerald-800 font-medium max-w-sm">
            Budaya keselamatan pasien berada pada kategori{" "}
            <span className="font-bold underline decoration-2 underline-offset-4 decoration-emerald-500">
              BAIK
            </span>
            . Perlu peningkatan pada area Staffing.
          </p>
        </div>
      </div>
    </div>
  );
}
