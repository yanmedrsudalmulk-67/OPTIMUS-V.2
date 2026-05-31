import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Flame,
  PieChart as PieIcon,
  Activity,
  Plus,
  LayoutTemplate,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import IKPForm from "@/components/ikp/IKPForm";
import IKPHistory from "@/components/ikp/IKPHistory";

export default function IKP() {
  const [showInput, setShowInput] = useState(false);
  const [editData, setEditData] = useState<any>(null);
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
            const matchedProfile = indicatorProfiles.find(
              (p) => p.id === dbInput.indicator_id,
            );
            const persentase = dbInput.achievement_percentage || 0;
            const rawTarget = dbInput.target || matchedProfile?.target || 80;
            const target =
              parseFloat(String(rawTarget).replace(/[^0-9.]/g, "")) || 80;

            let ikpData: any = null;
            if (dbInput.category_id === "IKP" && dbInput.notes) {
              try {
                const parsed = JSON.parse(dbInput.notes);
                if (
                  typeof parsed === "object" &&
                  parsed !== null &&
                  ("kpc" in parsed ||
                    "knc" in parsed ||
                    "fullFormData" in parsed)
                ) {
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
              keterangan: ikpData ? ikpData.keterangan : dbInput.notes || "",
              kpc: ikpData ? ikpData.kpc : 0,
              knc: ikpData ? ikpData.knc : 0,
              ktc: ikpData ? ikpData.ktc : 0,
              ktd: ikpData ? ikpData.ktd : 0,
              sentinel: ikpData ? ikpData.sentinel : 0,
              fullFormData: ikpData ? ikpData.fullFormData : null,
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
        },
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
    Sentinel: ikpDataRaw.reduce(
      (sum, item) => sum + (Number(item.sentinel) || 0),
      0,
    ),
  };

  const gradingStats = [
    { name: "KPC (Potensial Cedera)", value: totalIkp.KPC, color: "#10a37f" },
    { name: "KNC (Nyaris Cedera)", value: totalIkp.KNC, color: "#3b82f6" },
    { name: "KTC (Tidak Cedera)", value: totalIkp.KTC, color: "#eab308" },
    { name: "KTD (Tidak Diharapkan)", value: totalIkp.KTD, color: "#f97316" },
    { name: "Sentinel", value: totalIkp.Sentinel, color: "#ef4444" },
  ].filter((item) => item.value > 0);

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
            Sistem pencatatan, pemantauan, dan investigasi insiden klinis rumah
            sakit.
          </p>
        </div>
        <div>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="flex items-center gap-2 bg-[#10a37f] hover:bg-[#0e8f6e] text-white px-5 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} strokeWidth={3} />
              Input Data IKP
            </button>
          ) : (
            <button
              onClick={() => setShowInput(false)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-bold shadow-sm transition-all"
            >
              <LayoutTemplate size={18} strokeWidth={2.5} />
              Dashboard IKP
            </button>
          )}
        </div>
      </div>

      {/* SummaryCardsIKP should be here */}

      {!showInput ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Incident Grading Chart */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-1.5">
                <PieIcon size={16} className="text-[#10a37f]" /> Persentase Data
                IKP
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
                      if (percent < 0.05) return null;
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={800}
                          style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.4)" }}
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {gradingStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
                        }}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox as any;
                        const total = gradingStats.reduce(
                          (sum, item) => sum + item.value,
                          0,
                        );
                        return (
                          <text
                            x={cx}
                            y={cy - 4}
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            <tspan
                              x={cx}
                              y={cy - 4}
                              fill="#0f172a"
                              fontSize="30"
                              fontWeight="900"
                              style={{ letterSpacing: "-0.05em" }}
                            >
                              {total}
                            </tspan>
                            <tspan
                              x={cx}
                              dy="20"
                              fill="#64748b"
                              fontSize="10"
                              fontWeight="800"
                              style={{ letterSpacing: "0.08em" }}
                              textAnchor="middle"
                            >
                              KASUS
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} Kejadian`]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      fontWeight: "bold",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    itemStyle={{ color: "#0f172a", fontWeight: "900" }}
                  />
                  <Legend
                    iconSize={10}
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2">
            <IKPHistory
              dataList={ikpDataRaw}
              onEdit={(data: any) => {
                setEditData(data.fullFormData || data);
                setShowInput(true);
              }}
            />
          </div>
        </div>
      ) : (
        <IKPForm
          initialData={editData}
          onSuccess={() => {
            setShowInput(false);
            setEditData(null);
          }}
          onCancel={() => {
            setShowInput(false);
            setEditData(null);
          }}
        />
      )}
    </div>
  );
}
