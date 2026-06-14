import React from 'react';
import { ArrowLeft, TrendingUp, Award, AlertTriangle, Activity, BarChart3, LineChart } from 'lucide-react';

interface DashboardSupervisiProps {
  onBack: () => void;
}

export default function DashboardSupervisi({ onBack }: DashboardSupervisiProps) {
  // Mock Data
  const stats = {
    jumlah: 15,
    unit: 8,
    rataRata: 82.5,
    tertinggi: 'ICU (95%)',
    terendah: 'Pantry (65%)'
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Supervisi Terintegrasi</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Supervisi</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-800 relative z-10">{stats.jumlah}</p>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Unit Disupervisi</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-800 relative z-10">{stats.unit}</p>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rata-rata Nilai</h3>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-800 relative z-10">{stats.rataRata}%</p>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik (Mocking visually) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <LineChart className="text-slate-400" size={24} />
              <h3 className="text-lg font-bold text-slate-800">Grafik Tren Supervisi Bulanan</h3>
           </div>
           
           <div className="h-64 flex items-end justify-between gap-2 px-2 pb-6 border-b border-l border-slate-100 relative">
              {[65, 70, 75, 72, 85, 82, 88].map((val, idx) => (
                <div key={idx} className="relative flex flex-col items-center group flex-1">
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded">
                    {val}%
                  </div>
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-sky-400 to-sky-200 rounded-t-lg transition-all duration-500 hover:from-sky-500 hover:to-sky-300"
                    style={{ height: `${val}%` }}
                  ></div>
                  <span className="absolute -bottom-6 text-xs font-bold text-slate-400">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'][idx]}
                  </span>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-3 mb-4 opacity-90">
              <Award size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Nilai Tertinggi</h3>
            </div>
            <p className="text-3xl font-black">{stats.tertinggi}</p>
            <p className="mt-2 text-sm font-medium opacity-80">Konsisten menjalankan standar indikator mutu.</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-400 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/20">
            <div className="flex items-center gap-3 mb-4 opacity-90">
              <AlertTriangle size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Nilai Terendah</h3>
            </div>
            <p className="text-3xl font-black">{stats.terendah}</p>
            <p className="mt-2 text-sm font-medium opacity-80">Perlu evaluasi SOP dan edukasi ulang.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
