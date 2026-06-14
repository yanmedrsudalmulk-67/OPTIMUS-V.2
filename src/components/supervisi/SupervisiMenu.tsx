import React from 'react';
import { BarChart, Shield, HardHat, UserRoundPlus, Activity, Stethoscope } from 'lucide-react';

interface SupervisiMenuProps {
  onSelect: (menu: string) => void;
  onViewDashboard: () => void;
}

export default function SupervisiMenu({ onSelect, onViewDashboard }: SupervisiMenuProps) {
  const menus = [
    {
      id: 'mutu',
      title: 'SUPERVISI TIM MUTU',
      icon: <Activity size={32} className="text-[#0ea5e9]" />,
      bg: 'bg-[#0ea5e9]/10',
      border: 'border-[#0ea5e9]/20',
      hover: 'hover:border-[#0ea5e9] hover:shadow-[#0ea5e9]/20',
      textColor: 'text-[#0ea5e9]'
    },
    {
      id: 'ppi',
      title: 'SUPERVISI PPI',
      icon: <Shield size={32} className="text-[#10b981]" />,
      bg: 'bg-[#10b981]/10',
      border: 'border-[#10b981]/20',
      hover: 'hover:border-[#10b981] hover:shadow-[#10b981]/20',
      textColor: 'text-[#10b981]'
    },
    {
      id: 'k3rs',
      title: 'SUPERVISI K3RS',
      icon: <HardHat size={32} className="text-[#f97316]" />,
      bg: 'bg-[#f97316]/10',
      border: 'border-[#f97316]/20',
      hover: 'hover:border-[#f97316] hover:shadow-[#f97316]/20',
      textColor: 'text-[#f97316]'
    },
    {
      id: 'keperawatan',
      title: 'SUPERVISI BIDANG KEPERAWATAN',
      icon: <UserRoundPlus size={32} className="text-[#8b5cf6]" />,
      bg: 'bg-[#8b5cf6]/10',
      border: 'border-[#8b5cf6]/20',
      hover: 'hover:border-[#8b5cf6] hover:shadow-[#8b5cf6]/20',
      textColor: 'text-[#8b5cf6]'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pilih Modul Supervisi</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Silakan pilih modul supervisi yang akan dilakukan sesuai dengan kewenangan Anda.
          </p>
        </div>
        <button
          onClick={onViewDashboard}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
        >
          <BarChart size={18} />
          Lihat Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menus.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`cursor-pointer group relative overflow-hidden flex flex-col justify-between bg-white rounded-2xl p-6 border-2 transition-all duration-300 shadow-sm ${m.border} ${m.hover}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${m.bg}`}>
              {m.icon}
            </div>
            
            <div>
              <h3 className={`font-black text-lg leading-tight mb-2 ${m.textColor}`}>
                {m.title}
              </h3>
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 group-hover:text-slate-600 transition-colors">
                Mulai Supervisi &rarr;
              </p>
            </div>
            
            {/* Decoration */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 blur-2xl group-hover:opacity-50 transition-opacity duration-500 ${m.bg}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
