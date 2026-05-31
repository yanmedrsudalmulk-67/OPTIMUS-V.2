/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, FileText, Edit2, Trash2, LayoutList, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DetailLaporanIKP from './DetailLaporanIKP';

export default function RiwayatIKP({ onEdit }: { onEdit?: (item: any) => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGrading, setFilterGrading] = useState("");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: inputs, error } = await supabase
        .from("indicator_inputs")
        .select("*")
        .eq("category_id", "IKP")
        .order("input_date", { ascending: false });

      if (error) throw error;
      
      const parsed = (inputs || []).map(row => {
        let details: any = {};
        try { details = JSON.parse(row.notes || "{}").details || {}; } catch (e) {}
        return {
          id: row.id,
          tanggal: row.input_date,
          unit: row.unit_id,
          jenis_insiden: details.tipe_insiden || "-",
          sub_tipe: details.sub_tipe_insiden || "-",
          grading: details.grading || "-",
          status: JSON.parse(row.notes || "{}").reportStatus || "Dilaporkan",
          details
        };
      });
      setData(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('indicator_inputs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'indicator_inputs', filter: "category_id=eq.IKP" }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("indicator_inputs")
        .delete()
        .eq("id", deleteConfirm);

      if (error) throw error;
      setDeleteConfirm(null);
    } catch (err: any) {
      alert("Gagal menghapus laporan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter(item => {
    const matchSearch = (item.sub_tipe || "").toLowerCase().includes(search.toLowerCase()) || (item.unit || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType ? item.jenis_insiden === filterType : true;
    const matchGrading = filterGrading ? item.grading === filterGrading : true;
    return matchSearch && matchType && matchGrading;
  });

  if (selectedReport) {
    return <DetailLaporanIKP data={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h2 className="text-xl font-black text-slate-800">Riwayat Laporan IKP</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari unit atau sub tipe..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
            />
          </div>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Semua Tipe</option>
            <option value="KPC">KPC</option>
            <option value="KNC">KNC</option>
            <option value="KTC">KTC</option>
            <option value="KTD">KTD</option>
            <option value="Sentinel">Sentinel</option>
          </select>
          <select 
             value={filterGrading} 
             onChange={e => setFilterGrading(e.target.value)}
             className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
           >
             <option value="">Semua Grading</option>
             <option value="Biru">Biru (Rendah)</option>
             <option value="Hijau">Hijau (Sedang)</option>
             <option value="Kuning">Kuning (Tinggi)</option>
             <option value="Merah">Merah (Ekstrem)</option>
           </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-100">
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Tanggal Laporan</th>
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Unit</th>
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Tipe Insiden</th>
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Sub Tipe Insiden</th>
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Grading Risiko</th>
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-bold">Memuat data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <LayoutList size={48} className="mb-4 text-gray-300" />
                    <h3 className="text-lg font-black text-gray-700 mb-1">Belum ada laporan IKP</h3>
                    <p className="text-sm font-semibold max-w-sm">
                      Silakan buat laporan baru melalui menu Input Baru. Laporan yang sudah disimpan akan muncul di sini secara real-time.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm font-bold text-gray-900">{item.tanggal}</td>
                  <td className="p-4 text-[11px] font-black uppercase text-gray-500">{item.unit}</td>
                  <td className="p-4 font-bold text-sm text-gray-900">{item.jenis_insiden}</td>
                  <td className="p-4 text-xs font-semibold text-gray-500 truncate max-w-[200px]">{item.sub_tipe}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest inline-block ${
                      item.grading === 'Merah' ? 'bg-red-100 text-red-600' : 
                      item.grading === 'Kuning' ? 'bg-yellow-100 text-yellow-600' :
                      item.grading === 'Hijau' ? 'bg-green-100 text-green-600' :
                      item.grading === 'Biru' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.grading}
                    </span>
                  </td>
                  <td className="p-4">
                     <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-600 uppercase tracking-widest">{item.status}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 border border-gray-100 rounded-lg p-1 bg-white shadow-sm inline-flex">
                      <button 
                        onClick={() => setSelectedReport(item)}
                        className="p-2 text-slate-600 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        title="Lihat Laporan"
                      >
                         <Eye size={16} strokeWidth={2.5} />
                      </button>
                      <div className="w-px h-4 bg-gray-200"></div>
                      <button 
                        onClick={() => onEdit && onEdit(item)}
                        className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-md transition-colors"
                        title="Edit Laporan"
                      >
                         <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                      <div className="w-px h-4 bg-gray-200"></div>
                      <button 
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-colors"
                        title="Hapus Laporan"
                      >
                         <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Laporan IKP</h3>
              <p className="text-sm font-semibold text-slate-500">
                Apakah Anda yakin ingin menghapus laporan ini? Data yang sudah dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
