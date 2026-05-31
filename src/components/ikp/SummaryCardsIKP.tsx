import React from "react";
import { useStore } from "@/store/useStore";
import { ShieldCheck, Activity, Flame, AlertTriangle } from "lucide-react";

export default function SummaryCardsIKP() {
  const dataMutuList = useStore((state) => state.dataMutuList);
  const ikpDataRaw = dataMutuList.filter((d) => d.kategori === "IKP");

  const totalKPC = ikpDataRaw.reduce((sum, item) => sum + (Number(item.kpc) || 0), 0);
  const totalKNC = ikpDataRaw.reduce((sum, item) => sum + (Number(item.knc) || 0), 0);
  const totalKTC = ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktc) || 0), 0);
  const totalKTD = ikpDataRaw.reduce((sum, item) => sum + (Number(item.ktd) || 0), 0);
  const totalSentinel = ikpDataRaw.reduce((sum, item) => sum + (Number(item.sentinel) || 0), 0);

  const totalKasus = totalKPC + totalKNC + totalKTC + totalKTD + totalSentinel;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full animate-in fade-in slide-in-from-bottom-2 mb-8">
      {/* Total Sentinel */}
      <div className="bg-white rounded-[20px] p-4 md:p-5 border border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.05)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.1)] transition-all overflow-hidden relative group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full group-hover:scale-110 transition-transform pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Sentinel</p>
            <h4 className="text-2xl md:text-3xl font-black text-red-600 leading-none">{totalSentinel}</h4>
          </div>
          <div className="p-2 md:p-2.5 bg-red-100 text-red-600 rounded-xl">
            <Flame className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Total Kasus */}
      <div className="bg-white rounded-[20px] p-4 md:p-5 border border-emerald-100 shadow-[0_4px_20px_rgba(16,163,127,0.05)] hover:shadow-[0_8px_30px_rgba(16,163,127,0.1)] transition-all overflow-hidden relative group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kasus Tercatat</p>
            <h4 className="text-2xl md:text-3xl font-black text-emerald-600 leading-none">{totalKasus}</h4>
          </div>
          <div className="p-2 md:p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* KNC & KTC */}
      <div className="bg-white rounded-[20px] p-4 md:p-5 border border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.05)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all overflow-hidden relative group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">KNC & KTC</p>
            <h4 className="text-2xl md:text-3xl font-black text-blue-600 leading-none">{totalKNC + totalKTC}</h4>
          </div>
          <div className="p-2 md:p-2.5 bg-blue-100 text-blue-600 rounded-xl">
            <Activity className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* KTD & Potensial */}
      <div className="bg-white rounded-[20px] p-4 md:p-5 border border-orange-100 shadow-[0_4px_20px_rgba(249,115,22,0.05)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.1)] transition-all overflow-hidden relative group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-110 transition-transform pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">KTD & Potensial</p>
            <h4 className="text-2xl md:text-3xl font-black text-orange-500 leading-none">{totalKTD + totalKPC}</h4>
          </div>
          <div className="p-2 md:p-2.5 bg-orange-100 text-orange-600 rounded-xl">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
