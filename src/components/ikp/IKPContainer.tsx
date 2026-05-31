import React, { useState } from 'react';
import FormIKP from './FormIKP';
import RiwayatIKP from './RiwayatIKP';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { FilePlus, History } from 'lucide-react';

export default function IKPContainer() {
  const [activeTab, setActiveTab] = useState<'input' | 'riwayat'>('input');
  const [editData, setEditData] = useState<any | null>(null);
  const addDataMutu = useStore(state => state.addDataMutu);

  const handleIKPSubmit = async (ikpData: any, status: string) => {
    try {
      const categoryType = ikpData.tipe_insiden || "KPC";
      const unit = "UMUM"; // Ideally captured in form if needed, or defaults to UMUM
      const tgl = ikpData.tgl_insiden || new Date().toISOString().split('T')[0];
      const detailPesan = ikpData.insiden || "Laporan Insiden";

      const dbPayload = {
        id: editData ? editData.id : Math.random().toString(36).substring(7),
        unit_id: unit,
        category_id: "IKP",
        indicator_id: null,
        input_date: tgl,
        numerator_value: 0,
        denominator_value: 0,
        target: null,
        achievement_percentage: null,
        notes: JSON.stringify({
          kpc: categoryType === 'KPC' ? 1 : 0,
          knc: categoryType === 'KNC' ? 1 : 0,
          ktc: categoryType === 'KTC' ? 1 : 0,
          ktd: categoryType === 'KTD' ? 1 : 0,
          sentinel: categoryType === 'Sentinel' ? 1 : 0,
          keterangan: detailPesan,
          reportStatus: status,
          details: ikpData
        }),
        created_at: editData ? undefined : new Date().toISOString()
      };

      let error;
      if (editData) {
        const { error: updateError } = await supabase
          .from('indicator_inputs')
          .update(dbPayload)
          .eq('id', editData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('indicator_inputs')
          .insert(dbPayload);
        error = insertError;
      }

      if (error) {
        throw error;
      }
      
      addDataMutu({
        id: dbPayload.id,
        unit: dbPayload.unit_id,
        tanggal: dbPayload.input_date,
        kategori: dbPayload.category_id,
        keterangan: detailPesan,
        kpc: categoryType === 'KPC' ? 1 : 0,
        knc: categoryType === 'KNC' ? 1 : 0,
        ktc: categoryType === 'KTC' ? 1 : 0,
        ktd: categoryType === 'KTD' ? 1 : 0,
        sentinel: categoryType === 'Sentinel' ? 1 : 0,
        status: "N/A" as any
      });

      alert(`Laporan ${categoryType} berhasil ${editData ? 'diperbarui' : 'disimpan'}!`);
      setEditData(null);
      setActiveTab('riwayat');
    } catch (e: any) {
      alert("Gagal menyimpan Laporan IKP: " + e.message);
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm w-full max-w-sm">
        <button
          onClick={() => { setActiveTab('input'); setEditData(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'input' 
              ? 'bg-[#10a37f] text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FilePlus size={16} />
          {editData ? 'Edit Laporan' : 'Input Baru'}
        </button>
        <button
          onClick={() => { setActiveTab('riwayat'); setEditData(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'riwayat' 
              ? 'bg-[#10a37f] text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <History size={16} />
          Riwayat Laporan
        </button>
      </div>

      {activeTab === 'input' ? (
        <FormIKP 
          initialData={editData?.details} 
          onSave={handleIKPSubmit} 
          onCancel={() => { setActiveTab('riwayat'); setEditData(null); }} 
        />
      ) : (
        <RiwayatIKP onEdit={(item) => { setEditData(item); setActiveTab('input'); }} />
      )}
    </div>
  );
}
