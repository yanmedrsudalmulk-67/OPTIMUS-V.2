import React, { useState } from 'react';
import Head from 'next/head';
import SupervisiMenu from '../components/supervisi/SupervisiMenu';
import FormSupervisiMutu from '../components/supervisi/FormSupervisiMutu';
import DashboardSupervisi from '../components/supervisi/DashboardSupervisi';
// import { ShieldCheck } from 'lucide-react';

export default function SupervisiPage() {
  const [activeView, setActiveView] = useState<'menu' | 'form-mutu' | 'dashboard' | 'riwayat'>('menu');

  const renderContent = () => {
    switch (activeView) {
      case 'form-mutu':
        return (
          <FormSupervisiMutu 
            onBack={() => setActiveView('menu')} 
            onViewRiwayat={() => setActiveView('riwayat')} 
          />
        );
      case 'dashboard':
        return <DashboardSupervisi onBack={() => setActiveView('menu')} />;
      case 'riwayat':
        // Reuse Dashboard or create placeholder Riwayat. For now fallback to Dashboard visually
        return <DashboardSupervisi onBack={() => setActiveView('form-mutu')} />;
      default:
        return (
          <SupervisiMenu 
            onSelect={(menu) => {
              if (menu === 'mutu') setActiveView('form-mutu');
              else alert('Modul ini sedang dalam pengembangan.');
            }} 
            onViewDashboard={() => setActiveView('dashboard')}
          />
        );
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-140px)] mb-20">
      <Head>
        <title>Supervisi Mutu Terintegrasi - OptiMus</title>
      </Head>

      {/* Header Page (Only show in Menu view so forms take full attention?) Let's keep it visible but minimal. */}
      {activeView === 'menu' && (
        <div className="mb-6 shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Supervisi Mutu Terintegrasi
            </h1>
            <p className="text-slate-300 font-medium text-sm md:text-base max-w-2xl leading-relaxed">
              Modul terpadu untuk pelaksanaan, monitoring, dan evaluasi hasil supervisi rumah sakit demi tercapainya standar akreditasi dan mutu paripurna.
            </p>
          </div>
          {/* Decor */}
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 translate-x-32"></div>
        </div>
      )}

      <div className={activeView === 'menu' ? "" : "pt-2"}>
        {renderContent()}
      </div>
    </div>
  );
}
