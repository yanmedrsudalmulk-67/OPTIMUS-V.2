import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldCheck, Flame, PieChart as PieIcon, Activity } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, Label } from "recharts";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

export default function IKP() {
  const dataMutuList = useStore((state) => state.dataMutuList);
  const setDataMutuList = useStore((state) => state.setDataMutuList);
  const indicatorProfiles = useStore((state) => state.indicatorProfiles);

  useEffect(() => {
    const fetchSupabaseInputs = async () => {
      try {
        const { data, error } = await supabase
          .from("indicator_inputs")
          .select("*")
          .order("created_at", { ascending: true });

        if (data && data.length >= 0) {
          const newDataList = data.map((dbInput: any) => {
            const matchedProfile = indicatorProfiles.find((p) => p.id === dbInput.indicator_id);
            const persentase = dbInput.achievement_percentage || 0;
            const rawTarget = dbInput.target || matchedProfile?.target || 80;
            const target = parseFloat(String(rawTarget).replace(/[^0-9.]/g, '')) || 80;

            let ikpData: any = null;
            if (dbInput.category_id === "IKP" && dbInput.notes) {
              try {
                const parsed = JSON.parse(dbInput.notes);
                if (typeof parsed === 'object' && parsed !== null && ('kpc' in parsed || 'knc' in parsed)) {
                  ikpData = parsed;
                }
              } catch (e) {
                // Not JSON, fallback
              }
            }

            return {
              id: dbInput.id,
              unit: dbInput.unit_id,
              tanggal: dbInput.input_date,
              kategori: dbInput.category_id,
              status: "N/A" as any,
              keterangan: ikpData ? ikpData.keterangan : (dbInput.notes || ""),
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
        console.warn("Supabase load skipped or delayed", err);
      }
    };
    fetchSupabaseInputs();

    const inputsChannel = supabase
      .channel("inputs-realtime-ikp")
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
  }, [indicatorProfiles, setDataMutuList]);

  // Compute Real-Time Chart Data
  const ikpDataRaw = dataMutuList.filter((d) => d.kategori === "IKP");
  const totalIkp = {
    KPC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.kpc) || 0), 0),
    KNC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.knc) || 0), 0),
    KTC: ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktc) || 0), 0),
    KTD: ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktd) || 0), 0),
    Sentinel: ikpDataRaw.reduce((sum, item) => sum + (Number(item.sentinel) || 0), 0),
  };

  const gradingStats = [
    { name: "KPC (Potensial Cedera)", value: totalIkp.KPC, color: "#10a37f" },
    { name: "KNC (Nyaris Cedera)", value: totalIkp.KNC, color: "#3b82f6" },
    { name: "KTC (Tidak Cedera)", value: totalIkp.KTC, color: "#eab308" },
    { name: "KTD (Tidak Diharapkan)", value: totalIkp.KTD, color: "#f97316" },
    { name: "Sentinel", value: totalIkp.Sentinel, color: "#ef4444" },
  ].filter(item => item.value > 0);

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
            <span className="text-2xl font-black text-gray-900">{totalIkp.Sentinel}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-[#10a37f] p-3.5 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">Total Kasus Tercatat</span>
            <span className="text-2xl font-black text-gray-900">
              {totalIkp.KPC + totalIkp.KNC + totalIkp.KTC + totalIkp.KTD + totalIkp.Sentinel}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">KNC & KTC</span>
            <span className="text-2xl font-black text-gray-900">{totalIkp.KNC + totalIkp.KTC}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider">KTD & Potensial</span>
            <span className="text-2xl font-black text-gray-900">{totalIkp.KTD + totalIkp.KPC}</span>
          </div>
        </div>
      </div>

      {/* Analytics & Table list split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Grading Chart */}
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
              <PieIcon size={16} className="text-[#10a37f]" /> Distribusi Matriks Risiko (Grading)
            </span>
          </div>
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradingStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  stroke="none"
                  dataKey="value"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    if (percent < 0.05) return null;
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.4)" }}>
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {gradingStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      const total = gradingStats.reduce((sum, item) => sum + item.value, 0);
                      return (
                        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central">
                          <tspan x={cx} y={cy - 4} fill="#0f172a" fontSize="30" fontWeight="900" style={{ letterSpacing: "-0.05em" }}>
                            {total}
                          </tspan>
                          <tspan x={cx} dy="20" fill="#64748b" fontSize="10" fontWeight="800" style={{ letterSpacing: "0.08em" }} textAnchor="middle">
                            KASUS
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} Kejadian`]}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontWeight: "bold", fontSize: "12px", padding: "8px 12px" }}
                  itemStyle={{ color: "#0f172a", fontWeight: "900" }} 
                />
                <Legend iconSize={10} iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", fontWeight: "bold", marginTop: "10px" }} />
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#10a37f] text-white">
                  <th className="py-4 px-5 font-bold text-xs">Tanggal & Unit</th>
                  <th className="py-4 px-5 font-bold text-xs">Rincian Laporan (Jenis Insiden)</th>
                  <th className="py-4 px-5 font-bold text-xs w-[35%]">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {ikpDataRaw.length > 0 ? (
                  ikpDataRaw.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((inc) => {
                    const rincian = [];
                    if (inc.kpc) rincian.push(`KPC: ${inc.kpc}`);
                    if (inc.knc) rincian.push(`KNC: ${inc.knc}`);
                    if (inc.ktc) rincian.push(`KTC: ${inc.ktc}`);
                    if (inc.ktd) rincian.push(`KTD: ${inc.ktd}`);
                    if (inc.sentinel) rincian.push(`Sentinel: ${inc.sentinel}`);

                    return (
                      <tr key={inc.id} className="border-b border-gray-50 hover:bg-[#10a37f]/5 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900 text-xs">{inc.tanggal}</div>
                          <div className="text-[10px] uppercase font-extrabold text-[#10a37f]">{inc.unit}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1.5">
                            {rincian.length > 0 ? rincian.map((r, i) => (
                              <span key={i} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                                {r}
                              </span>
                            )) : (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                                Nihil
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 max-w-sm">
                          <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">{inc.keterangan || "-"}</p>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-sm font-bold text-gray-400">
                      Belum ada laporan IKP terbaru terinput.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
